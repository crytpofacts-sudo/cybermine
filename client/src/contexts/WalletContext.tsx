/*
 * CyberMine Wallet Context — BNB Chain (ethers.js v6)
 *
 * Provides MetaMask + WalletConnect connection, chain enforcement,
 * and contract interactions for CybermineStakingV7 on BSC.
 *
 * Key reliability features:
 *   - initialLoading state prevents flash of "Join" form before first fetch
 *   - Deduplication prevents overlapping refreshAll calls
 *   - Graceful error handling preserves existing state on RPC failures
 *   - Provider is recreated on chain changes
 *   - Multiple RPC fallback endpoints for BSC testnet
 *   - Claim history from on-chain events
 *   - ConnectModal with MetaMask + WalletConnect v2 options
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  formatUnits,
  type Signer,
} from "ethers";
import { ACTIVE_CHAIN, txUrl } from "@/config/contracts";
import { STAKING_ABI } from "@/config/stakingAbi";
import { ERC20_ABI } from "@/config/erc20Abi";
import { getStoredReferral, isValidAddress, shortenAddress } from "@/lib/referral";
import { getWalletConnectProvider, disconnectWalletConnect, getWcInstance } from "@/lib/walletconnect";
import ConnectModal, { type WalletType } from "@/components/ConnectModal";

// ─── Types ─────────────────────────────────────────────────────
export interface UserData {
  activeLp: bigint;
  activeDepositTs: bigint;
  pendingLp: bigint;
  pendingDepositTs: bigint;
  lastClaimTs: bigint;
  referrer: string;
  referralWeightCreditFp: bigint;
  cachedBaseWeightFp: bigint;
  totalClaimed: bigint;
  referralCount: number;
  joined: boolean;
}

export interface ProtocolData {
  feeWei: bigint;
  cooldownSeconds: bigint;
  paused: boolean;
  totalBaseWeight: bigint;
  remainingSupply: bigint;
}

export interface ClaimEvent {
  txHash: string;
  blockNumber: number;
  reward: bigint;
  baseWeightFp: bigint;
  referralBonusUsedFp: bigint;
  totalBaseWeightFp: bigint;
  remainingSupply: bigint;
  timestamp?: number;
}

export interface WalletContextType {
  // Connection
  connected: boolean;
  address: string | null;
  connecting: boolean;
  wrongChain: boolean;
  walletType: WalletType | null;
  connect: () => void; // opens modal
  disconnect: () => void;
  switchChain: () => Promise<void>;

  // On-chain data
  userData: UserData | null;
  protocolData: ProtocolData | null;
  lpBalance: bigint;
  lpAllowance: bigint;
  mineBalance: bigint;
  nextClaimTs: bigint;
  lpDecimals: number;
  mineDecimals: number;

  // Claim tracking
  claimHistory: ClaimEvent[];
  lastClaimAmount: string | null;
  lastClaimTxHash: string | null;
  clearLastClaim: () => void;

  // Actions
  approveLp: (amount: bigint) => Promise<string | null>;
  joinAndDeposit: (amount: bigint, referrer?: string) => Promise<string | null>;
  depositPending: (amount: bigint) => Promise<string | null>;
  claim: () => Promise<string | null>;
  withdraw: (amount: bigint) => Promise<string | null>;
  emergencyWithdrawPending: (amount: bigint) => Promise<string | null>;

  // Refresh
  refreshAll: () => Promise<void>;
  loading: boolean;
  initialLoading: boolean;
  txPending: boolean;
}

const ZERO = 0n;
const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

// BSC Testnet has multiple RPC endpoints — try them in order
const BSC_TESTNET_RPCS = [
  "https://data-seed-prebsc-1-s1.binance.org:8545/",
  "https://data-seed-prebsc-2-s1.binance.org:8545/",
  "https://data-seed-prebsc-1-s2.binance.org:8545/",
  "https://bsc-testnet-rpc.publicnode.com",
];

const WalletContext = createContext<WalletContextType | null>(null);

// ─── Read-only fallback provider with retry ───────────────────
let currentRpcIndex = 0;

function getReadProvider(): JsonRpcProvider {
  const url = ACTIVE_CHAIN.isTestnet
    ? BSC_TESTNET_RPCS[currentRpcIndex % BSC_TESTNET_RPCS.length]
    : ACTIVE_CHAIN.rpcUrl;
  return new JsonRpcProvider(url, ACTIVE_CHAIN.chainId);
}

function rotateRpc() {
  if (ACTIVE_CHAIN.isTestnet) {
    currentRpcIndex = (currentRpcIndex + 1) % BSC_TESTNET_RPCS.length;
  }
}

// ─── Provider ──────────────────────────────────────────────────
export function WalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectingType, setConnectingType] = useState<WalletType | null>(null);
  const [wrongChain, setWrongChain] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const [userData, setUserData] = useState<UserData | null>(null);
  const [protocolData, setProtocolData] = useState<ProtocolData | null>(null);
  const [lpBalance, setLpBalance] = useState<bigint>(ZERO);
  const [lpAllowance, setLpAllowance] = useState<bigint>(ZERO);
  const [mineBalance, setMineBalance] = useState<bigint>(ZERO);
  const [nextClaimTs, setNextClaimTs] = useState<bigint>(ZERO);
  const [lpDecimals, setLpDecimals] = useState(18);
  const [mineDecimals, setMineDecimals] = useState(18);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);

  // Claim tracking
  const [claimHistory, setClaimHistory] = useState<ClaimEvent[]>([]);
  const [lastClaimAmount, setLastClaimAmount] = useState<string | null>(null);
  const [lastClaimTxHash, setLastClaimTxHash] = useState<string | null>(null);

  const signerRef = useRef<Signer | null>(null);
  const providerRef = useRef<BrowserProvider | null>(null);
  const eip1193Ref = useRef<any>(null); // raw EIP-1193 provider (MetaMask or WC)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshInFlightRef = useRef(false);
  const refreshNonceRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);

  const clearLastClaim = useCallback(() => {
    setLastClaimAmount(null);
    setLastClaimTxHash(null);
  }, []);

  // ─── Helpers ─────────────────────────────────────────────────
  function getStakingContract(signerOrProvider: Signer | JsonRpcProvider | BrowserProvider) {
    return new Contract(ACTIVE_CHAIN.staking, STAKING_ABI, signerOrProvider);
  }
  function getLpContract(signerOrProvider: Signer | JsonRpcProvider | BrowserProvider) {
    return new Contract(ACTIVE_CHAIN.lpToken, ERC20_ABI, signerOrProvider);
  }
  function getMineContract(signerOrProvider: Signer | JsonRpcProvider | BrowserProvider) {
    return new Contract(ACTIVE_CHAIN.mineToken, ERC20_ABI, signerOrProvider);
  }

  // ─── Fetch claim history from events ────────────────────────
  const fetchClaimHistory = useCallback(async (userAddr: string) => {
    try {
      const provider = getReadProvider();
      const staking = getStakingContract(provider);
      const block = await provider.getBlockNumber();
      const fromBlock = Math.max(0, block - 50000);
      const filter = staking.filters.Claimed(userAddr);
      const events = await staking.queryFilter(filter, fromBlock, block);

      const claims: ClaimEvent[] = events.map((e: any) => ({
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
        reward: BigInt(e.args.reward),
        baseWeightFp: BigInt(e.args.baseWeightFp),
        referralBonusUsedFp: BigInt(e.args.referralBonusUsedFp),
        totalBaseWeightFp: BigInt(e.args.totalBaseWeightFp),
        remainingSupply: BigInt(e.args.remainingSupply),
      }));

      claims.sort((a, b) => b.blockNumber - a.blockNumber);
      setClaimHistory(claims);
    } catch (err) {
      console.warn("fetchClaimHistory failed:", err);
    }
  }, []);

  // ─── Fetch all on-chain data (with deduplication & resilience) ─
  const refreshAll = useCallback(async () => {
    const userAddr = address;
    if (!userAddr) return;

    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;

    const thisNonce = ++refreshNonceRef.current;

    if (!hasLoadedOnceRef.current) {
      setInitialLoading(true);
    }
    setLoading(true);

    let provider: BrowserProvider | JsonRpcProvider;
    if (providerRef.current) {
      provider = providerRef.current;
    } else {
      provider = getReadProvider();
    }

    const staking = getStakingContract(provider);
    const lp = getLpContract(provider);
    const mineC = getMineContract(provider);

    let newUserData: UserData | null = null;
    let newNextClaim: bigint | null = null;
    let newProtocol: ProtocolData | null = null;
    let newLpBal: bigint | null = null;
    let newLpAllow: bigint | null = null;
    let newMineBal: bigint | null = null;
    let newLpDec: number | null = null;
    let newMineDec: number | null = null;

    // Attempt 1: user-specific data
    try {
      const [userRaw, nextClaim] = await Promise.all([
        staking.getUser(userAddr),
        staking.nextClaimTime(userAddr),
      ]);
      newUserData = {
        activeLp: BigInt(userRaw.activeLp),
        activeDepositTs: BigInt(userRaw.activeDepositTs),
        pendingLp: BigInt(userRaw.pendingLp),
        pendingDepositTs: BigInt(userRaw.pendingDepositTs),
        lastClaimTs: BigInt(userRaw.lastClaimTs),
        referrer: userRaw.referrer,
        referralWeightCreditFp: BigInt(userRaw.referralWeightCreditFp),
        cachedBaseWeightFp: BigInt(userRaw.cachedBaseWeightFp),
        totalClaimed: BigInt(userRaw.totalClaimed),
        referralCount: Number(userRaw.referralCount),
        joined: Boolean(userRaw.joined),
      };
      newNextClaim = BigInt(nextClaim);
    } catch (err) {
      console.warn("refreshAll: user data fetch failed, retrying with fallback RPC", err);
      rotateRpc();
      try {
        const fallback = getReadProvider();
        const stakingFb = getStakingContract(fallback);
        const [userRaw, nextClaim] = await Promise.all([
          stakingFb.getUser(userAddr),
          stakingFb.nextClaimTime(userAddr),
        ]);
        newUserData = {
          activeLp: BigInt(userRaw.activeLp),
          activeDepositTs: BigInt(userRaw.activeDepositTs),
          pendingLp: BigInt(userRaw.pendingLp),
          pendingDepositTs: BigInt(userRaw.pendingDepositTs),
          lastClaimTs: BigInt(userRaw.lastClaimTs),
          referrer: userRaw.referrer,
          referralWeightCreditFp: BigInt(userRaw.referralWeightCreditFp),
          cachedBaseWeightFp: BigInt(userRaw.cachedBaseWeightFp),
          totalClaimed: BigInt(userRaw.totalClaimed),
          referralCount: Number(userRaw.referralCount),
          joined: Boolean(userRaw.joined),
        };
        newNextClaim = BigInt(nextClaim);
      } catch (err2) {
        console.warn("refreshAll: user data fallback also failed", err2);
      }
    }

    // Attempt 2: protocol data
    try {
      const readProv = getReadProvider();
      const stakingRead = getStakingContract(readProv);
      const [fee, cd, paused, tbw, rs] = await Promise.all([
        stakingRead.feeWei(),
        stakingRead.cooldownSeconds(),
        stakingRead.paused(),
        stakingRead.totalBaseWeightFp(),
        stakingRead.remainingSupply(),
      ]);
      newProtocol = {
        feeWei: BigInt(fee),
        cooldownSeconds: BigInt(cd),
        paused: Boolean(paused),
        totalBaseWeight: BigInt(tbw),
        remainingSupply: BigInt(rs),
      };
    } catch (err) {
      console.warn("refreshAll: protocol data failed", err);
      rotateRpc();
    }

    // Attempt 3: token balances
    try {
      const [lpBal, lpAllow, mineBal] = await Promise.all([
        lp.balanceOf(userAddr),
        lp.allowance(userAddr, ACTIVE_CHAIN.staking),
        mineC.balanceOf(userAddr),
      ]);
      newLpBal = BigInt(lpBal);
      newLpAllow = BigInt(lpAllow);
      newMineBal = BigInt(mineBal);
    } catch (err) {
      console.warn("refreshAll: token balances failed", err);
      rotateRpc();
      try {
        const readProv = getReadProvider();
        const lpFb = getLpContract(readProv);
        const mineFb = getMineContract(readProv);
        const [lpBal, lpAllow, mineBal] = await Promise.all([
          lpFb.balanceOf(userAddr),
          lpFb.allowance(userAddr, ACTIVE_CHAIN.staking),
          mineFb.balanceOf(userAddr),
        ]);
        newLpBal = BigInt(lpBal);
        newLpAllow = BigInt(lpAllow);
        newMineBal = BigInt(mineBal);
      } catch {
        // keep existing
      }
    }

    // Attempt 4: decimals (only once)
    if (lpDecimals === 18 && mineDecimals === 18) {
      try {
        const readProv = getReadProvider();
        const lpR = getLpContract(readProv);
        const mineR = getMineContract(readProv);
        const [ld, md] = await Promise.all([lpR.decimals(), mineR.decimals()]);
        newLpDec = Number(ld);
        newMineDec = Number(md);
      } catch {
        // keep defaults
      }
    }

    // Apply state only if this is still the latest nonce
    if (thisNonce === refreshNonceRef.current) {
      if (newUserData) setUserData(newUserData);
      if (newNextClaim !== null) setNextClaimTs(newNextClaim);
      if (newProtocol) setProtocolData(newProtocol);
      if (newLpBal !== null) setLpBalance(newLpBal);
      if (newLpAllow !== null) setLpAllowance(newLpAllow);
      if (newMineBal !== null) setMineBalance(newMineBal);
      if (newLpDec !== null) setLpDecimals(newLpDec);
      if (newMineDec !== null) setMineDecimals(newMineDec);

      if (newUserData || newProtocol) {
        hasLoadedOnceRef.current = true;
      }
      setInitialLoading(false);
      setLoading(false);
    }

    refreshInFlightRef.current = false;
  }, [address, lpDecimals, mineDecimals]);

  // ─── Check chain ────────────────────────────────────────────
  const checkChain = useCallback(async () => {
    const eth = eip1193Ref.current;
    if (!eth) return;
    try {
      const chainId = await eth.request({ method: "eth_chainId" });
      setWrongChain(parseInt(chainId, 16) !== ACTIVE_CHAIN.chainId);
    } catch {
      // ignore
    }
  }, []);

  // ─── Recreate provider (after chain switch or account change) ─
  const recreateProvider = useCallback(async () => {
    const eth = eip1193Ref.current;
    if (!eth) return;
    try {
      const provider = new BrowserProvider(eth);
      const signer = await provider.getSigner();
      providerRef.current = provider;
      signerRef.current = signer;
    } catch (err) {
      console.warn("recreateProvider failed:", err);
    }
  }, []);

  // ─── Switch chain ────────────────────────────────────────────
  const switchChain = useCallback(async () => {
    const eth = eip1193Ref.current;
    if (!eth) return;
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ACTIVE_CHAIN.chainIdHex }],
      });
      setWrongChain(false);
      await recreateProvider();
    } catch (err: any) {
      if (err.code === 4902) {
        try {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: ACTIVE_CHAIN.chainIdHex,
                chainName: ACTIVE_CHAIN.name,
                nativeCurrency: ACTIVE_CHAIN.nativeCurrency,
                rpcUrls: [ACTIVE_CHAIN.rpcUrl],
                blockExplorerUrls: [ACTIVE_CHAIN.blockExplorer],
              },
            ],
          });
          setWrongChain(false);
          await recreateProvider();
        } catch {
          toast.error("Failed to add network");
        }
      }
    }
  }, [recreateProvider]);

  // ─── Connect with MetaMask ──────────────────────────────────
  const connectMetaMask = useCallback(async () => {
    const eth = (window as any).ethereum;
    if (!eth) {
      toast.error("MetaMask not detected", {
        description: "Please install MetaMask to use CyberMine.",
      });
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    setConnecting(true);
    setConnectingType("metamask");
    try {
      const provider = new BrowserProvider(eth);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();

      eip1193Ref.current = eth;
      providerRef.current = provider;
      signerRef.current = signer;

      hasLoadedOnceRef.current = false;
      setUserData(null);
      setClaimHistory([]);
      setLastClaimAmount(null);
      setLastClaimTxHash(null);

      setAddress(addr);
      setWalletType("metamask");
      setConnected(true);
      setShowConnectModal(false);

      // Check chain
      const chainId = await eth.request({ method: "eth_chainId" });
      setWrongChain(parseInt(chainId, 16) !== ACTIVE_CHAIN.chainId);

      toast.success("Wallet connected", {
        description: `MetaMask · ${shortenAddress(addr)}`,
      });
    } catch (err: any) {
      console.error("MetaMask connect error:", err);
      toast.error("Connection failed", { description: err?.message || "Unknown error" });
    } finally {
      setConnecting(false);
      setConnectingType(null);
    }
  }, []);

  // ─── Connect with WalletConnect ─────────────────────────────
  const connectWalletConnect = useCallback(async () => {
    setConnecting(true);
    setConnectingType("walletconnect");
    try {
      const wcProvider = await getWalletConnectProvider();

      // Enable opens the QR modal
      await wcProvider.enable();

      const provider = new BrowserProvider(wcProvider as any);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();

      eip1193Ref.current = wcProvider;
      providerRef.current = provider;
      signerRef.current = signer;

      hasLoadedOnceRef.current = false;
      setUserData(null);
      setClaimHistory([]);
      setLastClaimAmount(null);
      setLastClaimTxHash(null);

      setAddress(addr);
      setWalletType("walletconnect");
      setConnected(true);
      setShowConnectModal(false);

      // Check chain
      const chainId = wcProvider.chainId;
      setWrongChain(chainId !== ACTIVE_CHAIN.chainId);

      toast.success("Wallet connected", {
        description: `WalletConnect · ${shortenAddress(addr)}`,
      });
    } catch (err: any) {
      console.error("WalletConnect connect error:", err);
      if (err?.message?.includes("User rejected") || err?.code === 4001) {
        toast.info("Connection cancelled");
      } else {
        toast.error("WalletConnect failed", { description: err?.message || "Unknown error" });
      }
    } finally {
      setConnecting(false);
      setConnectingType(null);
    }
  }, []);

  // ─── Connect (opens modal) ──────────────────────────────────
  const connect = useCallback(() => {
    setShowConnectModal(true);
  }, []);

  // ─── Handle modal selection ─────────────────────────────────
  const handleModalSelect = useCallback(async (type: WalletType) => {
    if (type === "metamask") {
      await connectMetaMask();
    } else {
      await connectWalletConnect();
    }
  }, [connectMetaMask, connectWalletConnect]);

  // ─── Disconnect ──────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    // Disconnect WalletConnect session if active
    if (walletType === "walletconnect") {
      await disconnectWalletConnect();
    }

    setConnected(false);
    setAddress(null);
    setWalletType(null);
    setUserData(null);
    setProtocolData(null);
    setLpBalance(ZERO);
    setLpAllowance(ZERO);
    setMineBalance(ZERO);
    setNextClaimTs(ZERO);
    setClaimHistory([]);
    setLastClaimAmount(null);
    setLastClaimTxHash(null);
    signerRef.current = null;
    providerRef.current = null;
    eip1193Ref.current = null;
    hasLoadedOnceRef.current = false;
    toast.info("Wallet disconnected");
  }, [walletType]);

  // ─── Listen for account/chain changes ────────────────────────
  useEffect(() => {
    const eth = eip1193Ref.current;
    if (!eth || !connected) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        await recreateProvider();
        hasLoadedOnceRef.current = false;
        setUserData(null);
        setClaimHistory([]);
        setLastClaimAmount(null);
        setLastClaimTxHash(null);
        refreshInFlightRef.current = false;
        setAddress(accounts[0]);
      }
    };
    const handleChainChanged = async () => {
      await checkChain();
      if (connected) {
        await recreateProvider();
        refreshInFlightRef.current = false;
      }
    };
    const handleDisconnect = () => {
      disconnect();
    };

    eth.on("accountsChanged", handleAccountsChanged);
    eth.on("chainChanged", handleChainChanged);
    // WalletConnect emits "disconnect" when session ends
    eth.on("disconnect", handleDisconnect);

    return () => {
      eth.removeListener("accountsChanged", handleAccountsChanged);
      eth.removeListener("chainChanged", handleChainChanged);
      eth.removeListener("disconnect", handleDisconnect);
    };
  }, [connected, disconnect, checkChain, recreateProvider]);

  // ─── Auto-refresh on connect / address change ────────────────
  useEffect(() => {
    if (connected && address && !wrongChain) {
      refreshAll();
      fetchClaimHistory(address);
    }
  }, [connected, address, wrongChain, refreshAll, fetchClaimHistory]);

  // ─── Polling (every 20s) ─────────────────────────────────────
  useEffect(() => {
    if (connected && address && !wrongChain) {
      pollRef.current = setInterval(() => {
        refreshAll();
      }, 20_000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [connected, address, wrongChain, refreshAll]);

  // ─── TX helper ───────────────────────────────────────────────
  const executeTx = useCallback(
    async (label: string, fn: () => Promise<any>): Promise<string | null> => {
      if (!signerRef.current) {
        toast.error("Wallet not connected");
        return null;
      }
      setTxPending(true);
      try {
        const tx = await fn();
        toast.info(`${label} submitted`, {
          description: "Waiting for confirmation...",
        });
        const receipt = await tx.wait();
        const hash = receipt.hash || tx.hash;
        toast.success(`${label} confirmed`, {
          description: shortenAddress(hash, 8),
          action: {
            label: "View TX",
            onClick: () => window.open(txUrl(hash), "_blank"),
          },
        });
        refreshInFlightRef.current = false;
        await refreshAll();
        return hash;
      } catch (err: any) {
        console.error(`${label} error:`, err);
        const reason = err?.reason || err?.shortMessage || err?.message || "Transaction failed";
        toast.error(`${label} failed`, { description: reason });
        return null;
      } finally {
        setTxPending(false);
      }
    },
    [refreshAll],
  );

  // ─── Contract actions ────────────────────────────────────────

  const approveLp = useCallback(
    async (amount: bigint) => {
      return executeTx("Approve LP", async () => {
        const lp = getLpContract(signerRef.current!);
        return lp.approve(ACTIVE_CHAIN.staking, amount);
      });
    },
    [executeTx],
  );

  const joinAndDeposit = useCallback(
    async (amount: bigint, referrer?: string) => {
      const fee = protocolData?.feeWei ?? ZERO;
      const storedRef = referrer || getStoredReferral();

      if (storedRef && isValidAddress(storedRef) && storedRef.toLowerCase() !== address?.toLowerCase()) {
        return executeTx("Join & Stake (with referrer)", async () => {
          const staking = getStakingContract(signerRef.current!);
          return staking.joinAndDepositWithReferrer(amount, storedRef, { value: fee });
        });
      }
      return executeTx("Join & Stake", async () => {
        const staking = getStakingContract(signerRef.current!);
        return staking.joinAndDeposit(amount, { value: fee });
      });
    },
    [address, protocolData, executeTx],
  );

  const depositPending = useCallback(
    async (amount: bigint) => {
      return executeTx("Deposit LP (Pending)", async () => {
        const staking = getStakingContract(signerRef.current!);
        return staking.depositPending(amount);
      });
    },
    [executeTx],
  );

  const claim = useCallback(async () => {
    const fee = protocolData?.feeWei ?? ZERO;
    const balBefore = mineBalance;

    const hash = await executeTx("Claim Rewards", async () => {
      const staking = getStakingContract(signerRef.current!);
      return staking.claim({ value: fee });
    });

    if (hash) {
      try {
        const mineC = getMineContract(providerRef.current || getReadProvider());
        const newBal = await mineC.balanceOf(address);
        const reward = BigInt(newBal) - balBefore;
        if (reward > 0n) {
          const formatted = parseFloat(formatUnits(reward, mineDecimals));
          let amountStr: string;
          if (formatted >= 1_000_000_000) amountStr = (formatted / 1_000_000_000).toFixed(2) + "B";
          else if (formatted >= 1_000_000) amountStr = (formatted / 1_000_000).toFixed(2) + "M";
          else if (formatted >= 1_000) amountStr = (formatted / 1_000).toFixed(1) + "K";
          else amountStr = formatted.toFixed(4);
          setLastClaimAmount(amountStr);
          setLastClaimTxHash(hash);
        }
      } catch {
        // Non-critical
      }

      if (address) fetchClaimHistory(address);
    }

    return hash;
  }, [protocolData, mineBalance, address, mineDecimals, executeTx, fetchClaimHistory]);

  const withdraw = useCallback(
    async (amount: bigint) => {
      return executeTx("Withdraw Active LP", async () => {
        const staking = getStakingContract(signerRef.current!);
        return staking.withdraw(amount);
      });
    },
    [executeTx],
  );

  const emergencyWithdrawPending = useCallback(
    async (amount: bigint) => {
      return executeTx("Emergency Withdraw Pending", async () => {
        const staking = getStakingContract(signerRef.current!);
        return staking.emergencyWithdrawPending(amount);
      });
    },
    [executeTx],
  );

  return (
    <WalletContext.Provider
      value={{
        connected,
        address,
        connecting,
        wrongChain,
        walletType,
        connect,
        disconnect,
        switchChain,
        userData,
        protocolData,
        lpBalance,
        lpAllowance,
        mineBalance,
        nextClaimTs,
        lpDecimals,
        mineDecimals,
        claimHistory,
        lastClaimAmount,
        lastClaimTxHash,
        clearLastClaim,
        approveLp,
        joinAndDeposit,
        depositPending,
        claim,
        withdraw,
        emergencyWithdrawPending,
        refreshAll,
        loading,
        initialLoading,
        txPending,
      }}
    >
      {children}
      <ConnectModal
        open={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSelect={handleModalSelect}
        connecting={connecting}
        connectingType={connectingType}
      />
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
