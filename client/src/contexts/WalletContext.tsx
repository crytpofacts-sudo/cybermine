/*
 * CyberMine Wallet Context — BNB Chain (ethers.js v6)
 *
 * Provides MetaMask connection, chain enforcement, and contract interactions
 * for the CybermineStakingV7 staking contract on BSC Testnet / Mainnet.
 *
 * Key reliability features:
 *   - initialLoading state prevents flash of "Join" form before first fetch
 *   - Deduplication prevents overlapping refreshAll calls
 *   - Graceful error handling preserves existing state on RPC failures
 *   - Provider is recreated on chain changes
 *   - Multiple RPC fallback endpoints for BSC testnet
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
  type Signer,
} from "ethers";
import { ACTIVE_CHAIN, txUrl } from "@/config/contracts";
import { STAKING_ABI } from "@/config/stakingAbi";
import { ERC20_ABI } from "@/config/erc20Abi";
import { getStoredReferral, isValidAddress, shortenAddress } from "@/lib/referral";

// ─── Types ─────────────────────────────────────────────────────
export interface UserData {
  activeLp: bigint;
  pendingLp: bigint;
  lastClaimTs: bigint;
  referrer: string;
  referralWeightCreditFp: bigint;
  referralCount: bigint;
  joined: boolean;
}

export interface ProtocolData {
  feeWei: bigint;
  cooldownSeconds: bigint;
  paused: boolean;
  totalBaseWeight: bigint;
  remainingSupply: bigint;
}

export interface WalletContextType {
  // Connection
  connected: boolean;
  address: string | null;
  connecting: boolean;
  wrongChain: boolean;
  connect: () => Promise<void>;
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
  const [wrongChain, setWrongChain] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

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

  const signerRef = useRef<Signer | null>(null);
  const providerRef = useRef<BrowserProvider | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshInFlightRef = useRef(false);
  const refreshNonceRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);

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

  // ─── Fetch all on-chain data (with deduplication & resilience) ─
  const refreshAll = useCallback(async () => {
    const userAddr = address;
    if (!userAddr) return;

    // Deduplicate: skip if another refresh is already in flight
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;

    const thisNonce = ++refreshNonceRef.current;

    // Show initialLoading only if we haven't loaded data yet
    if (!hasLoadedOnceRef.current) {
      setInitialLoading(true);
    }
    setLoading(true);

    // Try with the browser provider first, fall back to read-only RPC
    let provider: BrowserProvider | JsonRpcProvider;
    if (providerRef.current) {
      provider = providerRef.current;
    } else {
      provider = getReadProvider();
    }

    const staking = getStakingContract(provider);
    const lp = getLpContract(provider);
    const mineC = getMineContract(provider);

    // Fetch user data and protocol data separately for resilience.
    // If one group fails, the other can still succeed.
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
        activeLp: BigInt(userRaw[0]),
        pendingLp: BigInt(userRaw[1]),
        lastClaimTs: BigInt(userRaw[2]),
        referrer: userRaw[3],
        referralWeightCreditFp: BigInt(userRaw[4]),
        referralCount: BigInt(userRaw[5]),
        joined: Boolean(userRaw[6]),
      };
      newNextClaim = BigInt(nextClaim);
    } catch (err) {
      console.warn("refreshAll: user data fetch failed, retrying with fallback RPC", err);
      rotateRpc();
      // Retry once with a different RPC
      try {
        const fallback = getReadProvider();
        const stakingFb = getStakingContract(fallback);
        const [userRaw, nextClaim] = await Promise.all([
          stakingFb.getUser(userAddr),
          stakingFb.nextClaimTime(userAddr),
        ]);
        newUserData = {
          activeLp: BigInt(userRaw[0]),
          pendingLp: BigInt(userRaw[1]),
          lastClaimTs: BigInt(userRaw[2]),
          referrer: userRaw[3],
          referralWeightCreditFp: BigInt(userRaw[4]),
          referralCount: BigInt(userRaw[5]),
          joined: Boolean(userRaw[6]),
        };
        newNextClaim = BigInt(nextClaim);
      } catch (retryErr) {
        console.error("refreshAll: user data fetch failed on retry too", retryErr);
      }
    }

    // Attempt 2: protocol-level data
    try {
      const [fee, cooldown, paused, totalWeight, supply] = await Promise.all([
        staking.feeWei(),
        staking.cooldownSeconds(),
        staking.paused(),
        staking.totalBaseWeightFp(),
        staking.remainingSupply().catch(() => ZERO),
      ]);
      newProtocol = {
        feeWei: BigInt(fee),
        cooldownSeconds: BigInt(cooldown),
        paused: Boolean(paused),
        totalBaseWeight: BigInt(totalWeight),
        remainingSupply: BigInt(supply),
      };
    } catch (err) {
      console.warn("refreshAll: protocol data fetch failed", err);
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
      console.warn("refreshAll: token balance fetch failed", err);
    }

    // Attempt 4: decimals (only needed once, rarely fails)
    try {
      const [lpDec, mineDec] = await Promise.all([
        lp.decimals().catch(() => 18),
        mineC.decimals().catch(() => 18),
      ]);
      newLpDec = Number(lpDec);
      newMineDec = Number(mineDec);
    } catch {
      // decimals are non-critical
    }

    // Only apply state if this is still the latest refresh (no newer one started)
    if (thisNonce === refreshNonceRef.current) {
      // CRITICAL: Only update state if we got valid data.
      // Never overwrite good data with null on failure.
      if (newUserData !== null) {
        setUserData(newUserData);
        hasLoadedOnceRef.current = true;
      }
      if (newNextClaim !== null) setNextClaimTs(newNextClaim);
      if (newProtocol !== null) setProtocolData(newProtocol);
      if (newLpBal !== null) setLpBalance(newLpBal);
      if (newLpAllow !== null) setLpAllowance(newLpAllow);
      if (newMineBal !== null) setMineBalance(newMineBal);
      if (newLpDec !== null) setLpDecimals(newLpDec);
      if (newMineDec !== null) setMineDecimals(newMineDec);

      setLoading(false);
      setInitialLoading(false);
    }

    refreshInFlightRef.current = false;
  }, [address]);

  // ─── Check chain ─────────────────────────────────────────────
  const checkChain = useCallback(async () => {
    if (!(window as any).ethereum) return;
    try {
      const chainIdHex = await (window as any).ethereum.request({ method: "eth_chainId" });
      const chainId = parseInt(chainIdHex, 16);
      setWrongChain(chainId !== ACTIVE_CHAIN.chainId);
    } catch {
      // ignore
    }
  }, []);

  // ─── Recreate provider (after chain switch or account change) ─
  const recreateProvider = useCallback(async () => {
    const eth = (window as any).ethereum;
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
    if (!(window as any).ethereum) return;
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ACTIVE_CHAIN.chainIdHex }],
      });
      setWrongChain(false);
      await recreateProvider();
    } catch (err: any) {
      if (err.code === 4902) {
        try {
          await (window as any).ethereum.request({
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

  // ─── Connect ─────────────────────────────────────────────────
  const connect = useCallback(async () => {
    const eth = (window as any).ethereum;
    if (!eth) {
      toast.error("MetaMask not detected", {
        description: "Please install MetaMask to use CyberMine.",
      });
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    setConnecting(true);
    try {
      const provider = new BrowserProvider(eth);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();

      providerRef.current = provider;
      signerRef.current = signer;
      setAddress(addr);
      setConnected(true);
      hasLoadedOnceRef.current = false; // Reset so initialLoading shows
      await checkChain();

      toast.success("Wallet connected", {
        description: `${shortenAddress(addr)}`,
      });
    } catch (err: any) {
      console.error("connect error:", err);
      toast.error("Connection failed", { description: err?.message || "Unknown error" });
    } finally {
      setConnecting(false);
    }
  }, [checkChain]);

  // ─── Disconnect ──────────────────────────────────────────────
  const disconnect = useCallback(() => {
    setConnected(false);
    setAddress(null);
    setUserData(null);
    setProtocolData(null);
    setLpBalance(ZERO);
    setLpAllowance(ZERO);
    setMineBalance(ZERO);
    setNextClaimTs(ZERO);
    signerRef.current = null;
    providerRef.current = null;
    hasLoadedOnceRef.current = false;
    toast.info("Wallet disconnected");
  }, []);

  // ─── Listen for account/chain changes ────────────────────────
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (connected) {
        // Recreate provider for the new account
        await recreateProvider();
        hasLoadedOnceRef.current = false;
        setUserData(null); // Clear stale data for old address
        setAddress(accounts[0]);
      }
    };
    const handleChainChanged = async () => {
      await checkChain();
      // Recreate provider for the new chain
      if (connected) {
        await recreateProvider();
      }
    };

    eth.on("accountsChanged", handleAccountsChanged);
    eth.on("chainChanged", handleChainChanged);
    return () => {
      eth.removeListener("accountsChanged", handleAccountsChanged);
      eth.removeListener("chainChanged", handleChainChanged);
    };
  }, [connected, disconnect, checkChain, recreateProvider]);

  // ─── Auto-refresh on connect / address change ────────────────
  useEffect(() => {
    if (connected && address && !wrongChain) {
      refreshAll();
    }
  }, [connected, address, wrongChain, refreshAll]);

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
        // Force a fresh refresh after tx
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
    return executeTx("Claim Rewards", async () => {
      const staking = getStakingContract(signerRef.current!);
      return staking.claim({ value: fee });
    });
  }, [protocolData, executeTx]);

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
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
