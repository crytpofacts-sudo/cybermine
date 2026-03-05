/*
 * CyberMine Wallet Context — BNB Chain (ethers.js v6)
 *
 * Provides MetaMask connection, chain enforcement, and contract interactions
 * for the CybermineStakingV7 staking contract on BSC Testnet / Mainnet.
 *
 * Replaces the previous simulated/mock wallet context.
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
  txPending: boolean;
}

const ZERO = 0n;
const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

const WalletContext = createContext<WalletContextType | null>(null);

// ─── Read-only fallback provider ───────────────────────────────
function getReadProvider() {
  return new JsonRpcProvider(ACTIVE_CHAIN.rpcUrl, ACTIVE_CHAIN.chainId);
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
  const [txPending, setTxPending] = useState(false);

  const signerRef = useRef<Signer | null>(null);
  const providerRef = useRef<BrowserProvider | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // ─── Fetch all on-chain data ─────────────────────────────────
  const refreshAll = useCallback(async () => {
    const userAddr = address;
    if (!userAddr) return;

    setLoading(true);
    try {
      const provider = providerRef.current || getReadProvider();
      const staking = getStakingContract(provider);
      const lp = getLpContract(provider);
      const mineC = getMineContract(provider);

      // Parallel reads
      const [
        userRaw,
        nextClaim,
        fee,
        cooldown,
        paused,
        totalWeight,
        supply,
        lpBal,
        lpAllow,
        mineBal,
        lpDec,
        mineDec,
      ] = await Promise.all([
        staking.getUser(userAddr),
        staking.nextClaimTime(userAddr),
        staking.feeWei(),
        staking.cooldownSeconds(),
        staking.paused(),
        staking.totalBaseWeight(),
        staking.remainingSupply().catch(() => ZERO),
        lp.balanceOf(userAddr),
        lp.allowance(userAddr, ACTIVE_CHAIN.staking),
        mineC.balanceOf(userAddr),
        lp.decimals().catch(() => 18),
        mineC.decimals().catch(() => 18),
      ]);

      setUserData({
        activeLp: BigInt(userRaw[0]),
        pendingLp: BigInt(userRaw[1]),
        lastClaimTs: BigInt(userRaw[2]),
        referrer: userRaw[3],
        referralWeightCreditFp: BigInt(userRaw[4]),
        referralCount: BigInt(userRaw[5]),
        joined: Boolean(userRaw[6]),
      });
      setNextClaimTs(BigInt(nextClaim));
      setProtocolData({
        feeWei: BigInt(fee),
        cooldownSeconds: BigInt(cooldown),
        paused: Boolean(paused),
        totalBaseWeight: BigInt(totalWeight),
        remainingSupply: BigInt(supply),
      });
      setLpBalance(BigInt(lpBal));
      setLpAllowance(BigInt(lpAllow));
      setMineBalance(BigInt(mineBal));
      setLpDecimals(Number(lpDec));
      setMineDecimals(Number(mineDec));
    } catch (err) {
      console.error("refreshAll error:", err);
    } finally {
      setLoading(false);
    }
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

  // ─── Switch chain ────────────────────────────────────────────
  const switchChain = useCallback(async () => {
    if (!(window as any).ethereum) return;
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ACTIVE_CHAIN.chainIdHex }],
      });
      setWrongChain(false);
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
        } catch {
          toast.error("Failed to add network");
        }
      }
    }
  }, []);

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
    toast.info("Wallet disconnected");
  }, []);

  // ─── Listen for account/chain changes ────────────────────────
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (connected) {
        setAddress(accounts[0]);
      }
    };
    const handleChainChanged = () => {
      checkChain();
    };

    eth.on("accountsChanged", handleAccountsChanged);
    eth.on("chainChanged", handleChainChanged);
    return () => {
      eth.removeListener("accountsChanged", handleAccountsChanged);
      eth.removeListener("chainChanged", handleChainChanged);
    };
  }, [connected, disconnect, checkChain]);

  // ─── Auto-refresh on connect / address change ────────────────
  useEffect(() => {
    if (connected && address && !wrongChain) {
      refreshAll();
    }
  }, [connected, address, wrongChain, refreshAll]);

  // ─── Polling (every 15s) ─────────────────────────────────────
  useEffect(() => {
    if (connected && address && !wrongChain) {
      pollRef.current = setInterval(() => {
        refreshAll();
      }, 15_000);
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
