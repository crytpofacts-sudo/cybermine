/*
 * CyberMine Wallet Context — Simulated Wallet State
 * 
 * This provides a mock wallet connection flow for the frontend.
 * When integrating with the real Solana smart contract, replace this
 * with @solana/wallet-adapter-react and @solana/wallet-adapter-wallets.
 *
 * The simulated state allows the full UI to be demonstrated and tested
 * before the contract is deployed.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { toast } from "sonner";

interface UserStats {
  lpAmount: number;
  depositTs: number;
  lastClaimTs: number;
  referrer: string | null;
  referralCreditFp: number;
  tier: string;
  tierMultiplier: number;
  baseWeight: number;
  effectiveWeight: number;
  referralCount: number;
  totalClaimed: number;
  joined: boolean;
}

interface WalletContextType {
  connected: boolean;
  address: string | null;
  connecting: boolean;
  userStats: UserStats;
  connect: () => Promise<void>;
  disconnect: () => void;
  join: (referralCode?: string) => Promise<boolean>;
  claim: () => Promise<boolean>;
  depositLp: (amount: number) => Promise<boolean>;
  withdrawLp: (amount: number) => Promise<boolean>;
}

const defaultStats: UserStats = {
  lpAmount: 0,
  depositTs: 0,
  lastClaimTs: 0,
  referrer: null,
  referralCreditFp: 0,
  tier: "INITIATE",
  tierMultiplier: 1.0,
  baseWeight: 0,
  effectiveWeight: 0,
  referralCount: 0,
  totalClaimed: 0,
  joined: false,
};

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats>(defaultStats);

  const connect = useCallback(async () => {
    setConnecting(true);
    // Simulate wallet connection delay
    await new Promise((r) => setTimeout(r, 1500));
    const mockAddr = "CyBr" + Math.random().toString(36).substring(2, 8).toUpperCase() + "...M1nE";
    setAddress(mockAddr);
    setConnected(true);
    setConnecting(false);
    toast.success("Wallet connected", {
      description: `Connected as ${mockAddr}`,
    });
  }, []);

  const disconnect = useCallback(() => {
    setConnected(false);
    setAddress(null);
    setUserStats(defaultStats);
    toast.info("Wallet disconnected");
  }, []);

  const join = useCallback(async (referralCode?: string) => {
    if (!connected) return false;
    await new Promise((r) => setTimeout(r, 1200));
    setUserStats((prev) => ({
      ...prev,
      joined: true,
      lastClaimTs: Date.now() / 1000,
      referrer: referralCode || null,
    }));
    toast.success("Joined CyberMine!", {
      description: "Welcome, miner. Fee: 0.0009 SOL",
    });
    return true;
  }, [connected]);

  const claim = useCallback(async () => {
    if (!connected || !userStats.joined) return false;
    await new Promise((r) => setTimeout(r, 1500));
    const reward = Math.floor(Math.random() * 50000) + 10000;
    setUserStats((prev) => ({
      ...prev,
      lastClaimTs: Date.now() / 1000,
      totalClaimed: prev.totalClaimed + reward,
    }));
    toast.success(`Claimed ${reward.toLocaleString()} $MINE`, {
      description: "Fee: 0.0009 SOL",
    });
    return true;
  }, [connected, userStats.joined]);

  const depositLp = useCallback(async (amount: number) => {
    if (!connected || !userStats.joined) return false;
    await new Promise((r) => setTimeout(r, 1200));
    const now = Date.now() / 1000;
    setUserStats((prev) => {
      const newAmount = prev.lpAmount + amount;
      const newTs = prev.lpAmount === 0
        ? now
        : Math.floor((prev.lpAmount * prev.depositTs + amount * now) / newAmount);
      return {
        ...prev,
        lpAmount: newAmount,
        depositTs: newTs,
        baseWeight: newAmount * prev.tierMultiplier,
        effectiveWeight: newAmount * prev.tierMultiplier + prev.referralCreditFp,
      };
    });
    toast.success(`Deposited ${amount.toLocaleString()} LP tokens`);
    return true;
  }, [connected, userStats.joined]);

  const withdrawLp = useCallback(async (amount: number) => {
    if (!connected || !userStats.joined) return false;
    if (amount > userStats.lpAmount) {
      toast.error("Insufficient LP balance");
      return false;
    }
    await new Promise((r) => setTimeout(r, 1200));
    setUserStats((prev) => {
      const newAmount = prev.lpAmount - amount;
      return {
        ...prev,
        lpAmount: newAmount,
        depositTs: newAmount === 0 ? 0 : prev.depositTs,
        baseWeight: newAmount * prev.tierMultiplier,
        effectiveWeight: newAmount * prev.tierMultiplier + prev.referralCreditFp,
      };
    });
    toast.success(`Withdrew ${amount.toLocaleString()} LP tokens`);
    return true;
  }, [connected, userStats]);

  return (
    <WalletContext.Provider
      value={{
        connected,
        address,
        connecting,
        userStats,
        connect,
        disconnect,
        join,
        claim,
        depositLp,
        withdrawLp,
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
