/*
 * CyberMine Mining Terminal — Neon Metropolis Design
 * BNB Chain integration with real contract calls:
 *   - Approve LP → Join & Stake → Deposit Pending → Claim → Withdraw
 *   - Tier badge with multiplier and countdown to next tier
 *   - Weight breakdown (base LP, multiplier bonus, referral credit)
 *   - Claim popup with social sharing
 *   - Claim history from on-chain events
 *   - Network weight & user weight %
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, Zap, Clock, TrendingUp, Shield, ChevronDown, ChevronUp,
  AlertTriangle, ExternalLink, Loader2, Award, ArrowDownToLine, ArrowUpFromLine,
} from "lucide-react";
import { formatUnits, parseUnits, MaxUint256 } from "ethers";
import AppNavbar from "@/components/AppNavbar";
import ParticleBackground from "@/components/ParticleBackground";
import TierBadge from "@/components/TierBadge";
import WeightBreakdown from "@/components/WeightBreakdown";
import ClaimPopup from "@/components/ClaimPopup";
import { useWallet } from "@/contexts/WalletContext";
import { ACTIVE_CHAIN, addressUrl } from "@/config/contracts";
import { getStoredReferral, shortenAddress } from "@/lib/referral";
import { getTierInfo, getWeightBreakdown, getAllTiers } from "@/lib/tiers";
import { txUrl } from "@/config/contracts";

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "READY";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatBigNum(val: bigint, decimals: number, dp = 4): string {
  const str = formatUnits(val, decimals);
  const num = parseFloat(str);
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toFixed(dp);
}

const FP = BigInt(10 ** 18);

export default function Mine() {
  const {
    connected, connecting, connect, disconnect, address, wrongChain, switchChain,
    userData, protocolData, lpBalance, lpAllowance, mineBalance,
    nextClaimTs, lpDecimals, mineDecimals,
    claimHistory, lastClaimAmount, lastClaimTxHash, clearLastClaim,
    approveLp, joinAndDeposit, depositPending, claim, withdraw, emergencyWithdrawPending,
    txPending, initialLoading,
  } = useWallet();

  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [showDepositPanel, setShowDepositPanel] = useState(false);
  const [showWithdrawPanel, setShowWithdrawPanel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTierInfo, setShowTierInfo] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [joinAmount, setJoinAmount] = useState("");
  const [showClaimPopup, setShowClaimPopup] = useState(false);

  const joined = userData?.joined ?? false;
  const paused = protocolData?.paused ?? false;
  const feeWei = protocolData?.feeWei ?? 0n;
  const cooldownSec = Number(protocolData?.cooldownSeconds ?? 0n);

  const storedRef = useMemo(() => getStoredReferral(), []);

  // Show claim popup when lastClaimAmount is set
  useEffect(() => {
    if (lastClaimAmount && lastClaimTxHash) {
      setShowClaimPopup(true);
    }
  }, [lastClaimAmount, lastClaimTxHash]);

  // Tier info
  const tierInfo = useMemo(() => {
    if (!userData) return getTierInfo(0n);
    return getTierInfo(userData.activeDepositTs);
  }, [userData]);

  // Weight breakdown
  const weightBreak = useMemo(() => {
    if (!userData) return { rawWeight: 0, multiplierBonus: 0, refCredit: 0, totalWeight: 0, baseWeight: 0 };
    return getWeightBreakdown(
      userData.cachedBaseWeightFp,
      userData.referralWeightCreditFp,
      tierInfo.multiplier,
      lpDecimals,
    );
  }, [userData, tierInfo, lpDecimals]);

  // User weight % of network
  const userWeightPct = useMemo(() => {
    if (!protocolData || !userData) return 0;
    const totalW = Number(protocolData.totalBaseWeight) / Number(FP);
    if (totalW === 0) return 0;
    const userW = weightBreak.totalWeight;
    return (userW / totalW) * 100;
  }, [protocolData, userData, weightBreak]);

  // Cooldown timer
  useEffect(() => {
    if (!joined) return;
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const nct = Number(nextClaimTs);
      const remaining = Math.max(0, nct - now);
      setCooldownLeft(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [nextClaimTs, joined]);

  const cooldownProgress = joined && cooldownSec > 0
    ? Math.min(1, (cooldownSec - cooldownLeft) / cooldownSec)
    : 0;
  const canClaim = cooldownLeft === 0 && joined && (userData?.activeLp ?? 0n) > 0n && !paused;

  const handleClaim = useCallback(async () => {
    if (!canClaim) return;
    await claim();
  }, [canClaim, claim]);

  // Needs approval check
  const needsApproval = useCallback((amount: bigint) => {
    return lpAllowance < amount;
  }, [lpAllowance]);

  // Join flow
  const handleJoin = useCallback(async () => {
    const raw = joinAmount.trim();
    if (!raw || parseFloat(raw) <= 0) return;
    const amount = parseUnits(raw, lpDecimals);

    if (needsApproval(amount)) {
      await approveLp(MaxUint256);
      return;
    }
    await joinAndDeposit(amount, storedRef || undefined);
    setJoinAmount("");
  }, [joinAmount, lpDecimals, needsApproval, approveLp, joinAndDeposit, storedRef]);

  // Deposit more (pending)
  const handleDeposit = useCallback(async () => {
    const raw = depositAmount.trim();
    if (!raw || parseFloat(raw) <= 0) return;
    const amount = parseUnits(raw, lpDecimals);

    if (needsApproval(amount)) {
      await approveLp(MaxUint256);
      return;
    }
    await depositPending(amount);
    setDepositAmount("");
  }, [depositAmount, lpDecimals, needsApproval, approveLp, depositPending]);

  // Withdraw active
  const handleWithdraw = useCallback(async () => {
    const raw = withdrawAmount.trim();
    if (!raw || parseFloat(raw) <= 0) return;
    const amount = parseUnits(raw, lpDecimals);
    await withdraw(amount);
    setWithdrawAmount("");
  }, [withdrawAmount, lpDecimals, withdraw]);

  // Emergency withdraw pending
  const handleEmergencyWithdraw = useCallback(async () => {
    if (!userData?.pendingLp || userData.pendingLp === 0n) return;
    await emergencyWithdrawPending(userData.pendingLp);
  }, [userData, emergencyWithdrawPending]);

  // SVG ring parameters
  const ringRadius = 130;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - cooldownProgress);

  const lpBalFormatted = formatBigNum(lpBalance, lpDecimals);
  const activeLpFormatted = formatBigNum(userData?.activeLp ?? 0n, lpDecimals);
  const pendingLpFormatted = formatBigNum(userData?.pendingLp ?? 0n, lpDecimals);
  const mineBalFormatted = formatBigNum(mineBalance, mineDecimals, 2);
  const totalClaimedFormatted = formatBigNum(userData?.totalClaimed ?? 0n, mineDecimals, 2);

  // Safe parseUnits for button label
  const joinAmountBn = useMemo(() => {
    try {
      const raw = joinAmount.trim();
      if (!raw || parseFloat(raw) <= 0) return 0n;
      return parseUnits(raw, lpDecimals);
    } catch { return 0n; }
  }, [joinAmount, lpDecimals]);

  const depositAmountBn = useMemo(() => {
    try {
      const raw = depositAmount.trim();
      if (!raw || parseFloat(raw) <= 0) return 0n;
      return parseUnits(raw, lpDecimals);
    } catch { return 0n; }
  }, [depositAmount, lpDecimals]);

  return (
    <div className="min-h-screen bg-[#050510] text-white scan-line">
      <ParticleBackground />
      <AppNavbar />

      <main className="relative z-10 pt-24 md:pt-28 pb-16">
        <div className="container">
          {/* Testnet Badge */}
          {ACTIVE_CHAIN.isTestnet && (
            <div className="text-center mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[oklch(0.85_0.18_80/0.15)] border border-[oklch(0.85_0.18_80/0.3)] text-[#ffd700] font-[Orbitron] text-[10px] tracking-wider">
                <AlertTriangle size={10} /> TESTNET MODE
              </span>
            </div>
          )}

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <span className="inline-block font-[Orbitron] text-xs text-[#ff0066] tracking-[0.3em] uppercase mb-2">
              // MINING TERMINAL
            </span>
            <h1 className="font-[Orbitron] text-2xl md:text-3xl font-bold text-white">
              {connected
                ? wrongChain
                  ? "Switch Network"
                  : initialLoading
                  ? "Loading..."
                  : joined
                  ? "Claim Your Rewards"
                  : "Join the Protocol"
                : "Connect to Mine"}
            </h1>
          </motion.div>

          {/* Paused Banner */}
          {paused && connected && !wrongChain && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-[oklch(0.65_0.28_12/0.1)] border border-[oklch(0.65_0.28_12/0.3)] text-center"
            >
              <AlertTriangle size={20} className="text-[#ff0066] mx-auto mb-2" />
              <p className="font-[Space_Grotesk] text-sm text-[#ff0066] font-medium">
                Protocol is paused. Join, deposit, and claim are disabled.
              </p>
              {(userData?.pendingLp ?? 0n) > 0n && (
                <button
                  onClick={handleEmergencyWithdraw}
                  disabled={txPending}
                  className="mt-3 px-6 py-2 rounded-lg font-[Orbitron] text-xs font-semibold text-white bg-[#ff0066] hover:bg-[#ff3388] transition-colors disabled:opacity-50"
                >
                  {txPending ? "PROCESSING..." : "EMERGENCY WITHDRAW PENDING LP"}
                </button>
              )}
            </motion.div>
          )}

          {/* Not Connected State */}
          {!connected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto"
            >
              <div className="glass-panel rounded-2xl p-8 md:p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[oklch(0.85_0.18_192/0.1)] border border-[oklch(0.85_0.18_192/0.2)] flex items-center justify-center">
                  <Wallet size={32} className="text-[#00f0ff]" />
                </div>
                <h2 className="font-[Orbitron] text-xl font-bold text-white mb-3">
                  Connect Your Wallet
                </h2>
                <p className="text-[oklch(0.55_0.02_265)] font-[Space_Grotesk] mb-8 leading-relaxed">
                  Connect your MetaMask wallet to access the mining terminal on BNB Chain.
                </p>
                <button
                  onClick={connect}
                  disabled={connecting}
                  className="px-8 py-4 text-base font-[Orbitron] font-bold text-[#050510] bg-[#00f0ff] rounded-xl hover:shadow-[0_0_30px_oklch(0.85_0.18_192/0.5)] transition-all duration-300 tracking-wide glow-cyan disabled:opacity-50"
                >
                  {connecting ? "CONNECTING..." : "CONNECT WALLET"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Wrong Chain */}
          {connected && wrongChain && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto"
            >
              <div className="glass-panel rounded-2xl p-8 md:p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[oklch(0.85_0.18_80/0.1)] border border-[oklch(0.85_0.18_80/0.2)] flex items-center justify-center">
                  <AlertTriangle size={32} className="text-[#ffd700]" />
                </div>
                <h2 className="font-[Orbitron] text-xl font-bold text-white mb-3">
                  Wrong Network
                </h2>
                <p className="text-[oklch(0.55_0.02_265)] font-[Space_Grotesk] mb-8 leading-relaxed">
                  Please switch to {ACTIVE_CHAIN.name} to use CyberMine.
                </p>
                <button
                  onClick={switchChain}
                  className="px-8 py-4 text-base font-[Orbitron] font-bold text-[#050510] bg-[#ffd700] rounded-xl hover:shadow-[0_0_30px_oklch(0.85_0.18_80/0.5)] transition-all duration-300 tracking-wide disabled:opacity-50"
                >
                  SWITCH TO {ACTIVE_CHAIN.name.toUpperCase()}
                </button>
              </div>
            </motion.div>
          )}

          {/* Loading */}
          {connected && !wrongChain && initialLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-lg mx-auto"
            >
              <div className="glass-panel rounded-2xl p-12 text-center">
                <Loader2 size={40} className="mx-auto mb-4 text-[#00f0ff] animate-spin" />
                <p className="font-[Orbitron] text-sm text-[oklch(0.5_0.02_265)]">
                  Loading mining data...
                </p>
              </div>
            </motion.div>
          )}

          {/* ─── JOIN FORM ─────────────────────────────────────── */}
          {connected && !wrongChain && !initialLoading && !joined && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto"
            >
              <div className="glass-panel rounded-2xl p-6 md:p-8">
                <h2 className="font-[Orbitron] text-lg font-bold text-white mb-1">Join CyberMine</h2>
                <p className="text-sm text-[oklch(0.5_0.02_265)] font-[Space_Grotesk] mb-6">
                  Stake PancakeSwap LP (MINE/BNB) to earn $MINE. Approve your LP tokens, then join and stake in one transaction.
                </p>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-[Orbitron] text-[oklch(0.5_0.02_265)]">Your LP Balance</span>
                  <span className="text-xs font-[Fira_Code] text-[#00f0ff]">{lpBalFormatted}</span>
                </div>
                <div className="flex gap-2 mb-4">
                  <input
                    type="number"
                    value={joinAmount}
                    onChange={(e) => setJoinAmount(e.target.value)}
                    placeholder="LP token amount"
                    className="flex-1 px-4 py-3 rounded-lg bg-[oklch(0.1_0.02_265)] border border-[oklch(0.3_0.04_265/0.3)] text-sm font-[Fira_Code] text-white placeholder:text-[oklch(0.35_0.02_265)] focus:border-[oklch(0.85_0.18_192/0.5)] focus:outline-none"
                  />
                  <button
                    onClick={() => setJoinAmount(formatUnits(lpBalance, lpDecimals))}
                    className="px-3 py-3 text-[10px] font-[Orbitron] font-bold text-[#00f0ff] border border-[oklch(0.85_0.18_192/0.3)] rounded-lg hover:bg-[oklch(0.85_0.18_192/0.08)] transition-colors"
                  >
                    MAX
                  </button>
                </div>

                <a
                  href={`https://pancakeswap.finance/add/BNB/${ACTIVE_CHAIN.mineToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)] hover:text-[#00f0ff] transition-colors mb-4"
                >
                  Need LP? Add liquidity on PancakeSwap <ExternalLink size={10} />
                </a>

                {feeWei > 0n && (
                  <div className="text-[10px] font-[Fira_Code] text-[oklch(0.35_0.02_265)] mb-4">
                    Join fee: {formatUnits(feeWei, 18)} {ACTIVE_CHAIN.nativeCurrency.symbol}
                  </div>
                )}

                {storedRef && (
                  <div className="text-[10px] font-[Fira_Code] text-[oklch(0.4_0.02_265)] mb-4 p-2 rounded-lg bg-[oklch(0.85_0.18_192/0.05)] border border-[oklch(0.85_0.18_192/0.15)]">
                    Referrer: <span className="text-[#00f0ff]">{shortenAddress(storedRef, 6)}</span>
                  </div>
                )}

                <button
                  onClick={handleJoin}
                  disabled={txPending || !joinAmount || parseFloat(joinAmount) <= 0 || paused}
                  className="w-full py-3.5 rounded-lg font-[Orbitron] text-sm font-bold tracking-wide bg-[#00f0ff] text-[#050510] hover:shadow-[0_0_25px_oklch(0.85_0.18_192/0.4)] transition-all disabled:opacity-50"
                >
                  {txPending
                    ? <><Loader2 size={16} className="inline animate-spin mr-2" />PROCESSING...</>
                    : joinAmountBn > 0n && needsApproval(joinAmountBn)
                    ? "APPROVE LP FIRST"
                    : "JOIN & STAKE"}
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── ACTIVE MINING DASHBOARD ─────────────────────── */}
          {connected && !wrongChain && !initialLoading && joined && (
            <div className="max-w-4xl mx-auto space-y-5">
              {/* Top row: Tier + Weight + Network Share */}
              <div className="grid md:grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                  <TierBadge tierInfo={tierInfo} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-panel rounded-xl p-4"
                >
                  <div className="text-xs font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider uppercase mb-2">
                    Your Mining Weight
                  </div>
                  <div className="font-[Fira_Code] text-xl font-bold text-white mb-2">
                    {weightBreak.totalWeight.toFixed(2)}
                  </div>
                  <WeightBreakdown
                    rawWeight={weightBreak.rawWeight}
                    multiplierBonus={weightBreak.multiplierBonus}
                    refCredit={weightBreak.refCredit}
                    totalWeight={weightBreak.totalWeight}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="glass-panel rounded-xl p-4"
                >
                  <div className="text-xs font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider uppercase mb-2">
                    Network Share
                  </div>
                  <div className="font-[Fira_Code] text-xl font-bold text-[#00f0ff] text-glow-cyan mb-1">
                    {userWeightPct.toFixed(4)}%
                  </div>
                  <div className="text-[10px] font-[Fira_Code] text-[oklch(0.4_0.02_265)]">
                    of total network weight
                  </div>
                  <div className="h-1.5 rounded-full bg-[oklch(0.15_0.02_265)] mt-3">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#00f0ff] to-[#00cc88] transition-all duration-700"
                      style={{ width: `${Math.min(Math.max(userWeightPct, 0.5), 100)}%` }}
                    />
                  </div>
                </motion.div>
              </div>

              {/* Tier info expandable */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <button
                  onClick={() => setShowTierInfo(!showTierInfo)}
                  className="flex items-center gap-2 text-xs font-[Orbitron] text-[oklch(0.5_0.02_265)] hover:text-[#00f0ff] transition-colors mb-2"
                >
                  <Award size={14} />
                  All Tier Multipliers
                  {showTierInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <AnimatePresence>
                  {showTierInfo && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="glass-panel rounded-xl p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                          {getAllTiers().map((t, i) => (
                            <div
                              key={i}
                              className={`rounded-lg p-3 text-center transition-all ${
                                tierInfo.tier === i ? "ring-1" : ""
                              }`}
                              style={{
                                background: tierInfo.tier === i ? `${t.color}15` : "oklch(0.1 0.02 265)",
                                outlineColor: tierInfo.tier === i ? t.color : "transparent",
                                outline: tierInfo.tier === i ? `1px solid ${t.color}` : "none",
                              }}
                            >
                              <div className="text-lg mb-1">
                                {["⛏️", "🔧", "🎯", "⚡", "💎", "👑"][i]}
                              </div>
                              <div className="text-[10px] font-[Orbitron] font-bold" style={{ color: t.color }}>
                                {t.name}
                              </div>
                              <div className="text-xs font-[Fira_Code] text-[oklch(0.6_0.02_265)]">
                                {t.mult.toFixed(2)}x
                              </div>
                              <div className="text-[9px] font-[Fira_Code] text-[oklch(0.4_0.02_265)]">
                                {t.days === 0 ? "0-7d" : `${t.days}d+`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Claim + Deposit row */}
              <div className="grid md:grid-cols-[1fr_auto_1fr] gap-0 md:gap-6 items-start">
                {/* Claim Ring */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                  className="glass-panel rounded-2xl p-6 flex flex-col items-center"
                >
                  <div className="relative w-[300px] h-[300px] flex items-center justify-center mb-4">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 300 300">
                      <circle cx="150" cy="150" r={ringRadius} fill="none" stroke="oklch(0.15 0.02 265)" strokeWidth="8" />
                      <circle
                        cx="150" cy="150" r={ringRadius} fill="none"
                        stroke={canClaim ? "#00cc88" : "#00f0ff"}
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={ringCircumference}
                        strokeDashoffset={ringOffset}
                        className="transition-all duration-1000"
                        style={{ filter: canClaim ? "drop-shadow(0 0 8px #00cc88)" : "drop-shadow(0 0 6px #00f0ff)" }}
                      />
                    </svg>
                    <div className="text-center z-10">
                      <div className={`font-[Fira_Code] text-3xl font-bold mb-1 ${canClaim ? "text-[#00cc88]" : "text-[#00f0ff] text-glow-cyan"}`}>
                        {formatCountdown(cooldownLeft)}
                      </div>
                      <div className="text-[10px] font-[Orbitron] text-[oklch(0.4_0.02_265)] tracking-wider mb-4">
                        {canClaim ? "READY TO CLAIM" : "COOLDOWN"}
                      </div>
                      <button
                        onClick={handleClaim}
                        disabled={!canClaim || txPending}
                        className={`px-8 py-3 rounded-xl font-[Orbitron] text-sm font-bold tracking-wide transition-all duration-300 disabled:opacity-40 ${
                          canClaim
                            ? "bg-[#00cc88] text-[#050510] hover:shadow-[0_0_30px_oklch(0.7_0.18_160/0.5)]"
                            : "bg-[oklch(0.15_0.02_265)] text-[oklch(0.4_0.02_265)] border border-[oklch(0.25_0.02_265)]"
                        }`}
                      >
                        {txPending ? <Loader2 size={16} className="inline animate-spin mr-2" /> : null}
                        {canClaim ? "CLAIM" : "LOCKED"}
                      </button>
                    </div>
                  </div>

                  {feeWei > 0n && (
                    <div className="text-[10px] font-[Fira_Code] text-[oklch(0.35_0.02_265)]">
                      Claim fee: {formatUnits(feeWei, 18)} {ACTIVE_CHAIN.nativeCurrency.symbol}
                    </div>
                  )}

                  {/* Pending LP info */}
                  {(userData?.pendingLp ?? 0n) > 0n && (
                    <p className="mt-3 text-xs text-[oklch(0.5_0.02_265)] font-[Space_Grotesk] text-center max-w-sm">
                      <Clock size={10} className="inline mr-1 text-[oklch(0.8_0.2_90)]" />
                      <span className="text-[#ff0066] font-[Fira_Code]">{pendingLpFormatted}</span> pending LP rolls into active on claim.
                    </p>
                  )}
                </motion.div>

                {/* Center divider (desktop) */}
                <div className="hidden md:flex flex-col items-center self-stretch">
                  <div className="w-px flex-1 bg-gradient-to-b from-transparent via-[oklch(0.85_0.18_192/0.2)] to-transparent" />
                </div>

                {/* Status + LP Vault */}
                <div className="space-y-4 mt-5 md:mt-0">
                  {/* Status Panel */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-panel rounded-xl p-5"
                  >
                    <h3 className="font-[Orbitron] text-sm font-bold text-white tracking-wider mb-4 flex items-center gap-2">
                      <Shield size={14} className="text-[#00f0ff]" />
                      STATUS
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Active LP</span>
                        <span className="font-[Fira_Code] text-sm font-bold text-[#00f0ff]">{activeLpFormatted}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Pending LP</span>
                        <span className="font-[Fira_Code] text-sm font-bold text-[#ff0066]">{pendingLpFormatted}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Referrer</span>
                        <span className="font-[Fira_Code] text-sm text-white">
                          {userData?.referrer && userData.referrer !== "0x0000000000000000000000000000000000000000"
                            ? shortenAddress(userData.referrer)
                            : "None"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Referral Credit</span>
                        <span className="font-[Fira_Code] text-sm font-bold text-[#ff0066]">
                          {formatBigNum(userData?.referralWeightCreditFp ?? 0n, 18, 2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Total Claimed</span>
                        <span className="font-[Fira_Code] text-sm text-white">{totalClaimedFormatted} MINE</span>
                      </div>
                      <div className="pt-3 border-t border-[oklch(0.3_0.04_265/0.2)] flex justify-between items-center">
                        <span className="text-xs font-[Orbitron] text-[oklch(0.6_0.02_265)] tracking-wider">$MINE BALANCE</span>
                        <span className="font-[Fira_Code] text-lg font-bold text-[#ffd700]">{mineBalFormatted}</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* LP Vault Panel */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                    className="glass-panel rounded-xl p-5"
                  >
                    <h3 className="font-[Orbitron] text-sm font-bold text-white tracking-wider mb-4 flex items-center gap-2">
                      <Zap size={14} className="text-[#ff0066]" />
                      LP VAULT
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Wallet LP Balance</span>
                        <span className="font-[Fira_Code] text-sm font-bold text-white">{lpBalFormatted}</span>
                      </div>

                      {/* Deposit more */}
                      <button
                        onClick={() => { setShowDepositPanel(!showDepositPanel); setShowWithdrawPanel(false); }}
                        disabled={paused}
                        className="w-full py-2.5 rounded-lg font-[Orbitron] text-xs font-semibold tracking-wide border border-[oklch(0.85_0.18_192/0.3)] text-[#00f0ff] hover:bg-[oklch(0.85_0.18_192/0.08)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <ArrowDownToLine size={14} />
                        {showDepositPanel ? "HIDE" : "DEPOSIT MORE LP"}
                        {showDepositPanel ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      <AnimatePresence>
                        {showDepositPanel && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-2 space-y-3">
                              <div className="relative">
                                <input
                                  type="number"
                                  value={depositAmount}
                                  onChange={(e) => setDepositAmount(e.target.value)}
                                  placeholder="LP token amount"
                                  className="w-full px-4 py-3 rounded-lg bg-[oklch(0.1_0.02_265)] border border-[oklch(0.3_0.04_265/0.3)] text-sm font-[Fira_Code] text-white placeholder:text-[oklch(0.35_0.02_265)] focus:border-[oklch(0.85_0.18_192/0.5)] focus:outline-none"
                                />
                                <button
                                  onClick={() => setDepositAmount(formatUnits(lpBalance, lpDecimals))}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-[Orbitron] text-[#00f0ff] border border-[oklch(0.85_0.18_192/0.3)] rounded hover:bg-[oklch(0.85_0.18_192/0.1)] transition-colors"
                                >
                                  MAX
                                </button>
                              </div>
                              <button
                                onClick={handleDeposit}
                                disabled={txPending || !depositAmount || parseFloat(depositAmount) <= 0}
                                className="w-full py-2.5 rounded-lg font-[Orbitron] text-xs font-semibold tracking-wide bg-[#00f0ff] text-[#050510] hover:shadow-[0_0_20px_oklch(0.85_0.18_192/0.4)] transition-all disabled:opacity-50"
                              >
                                {txPending
                                  ? "PROCESSING..."
                                  : depositAmountBn > 0n && needsApproval(depositAmountBn)
                                  ? "APPROVE LP FIRST"
                                  : "DEPOSIT TO PENDING"}
                              </button>
                              <p className="text-[10px] text-[oklch(0.4_0.02_265)] font-[Space_Grotesk]">
                                New deposits go into Pending. They become Active on your next claim.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Withdraw active */}
                      <button
                        onClick={() => { setShowWithdrawPanel(!showWithdrawPanel); setShowDepositPanel(false); }}
                        disabled={(userData?.activeLp ?? 0n) === 0n}
                        className="w-full py-2.5 rounded-lg font-[Orbitron] text-xs font-semibold tracking-wide border border-[oklch(0.65_0.28_12/0.3)] text-[#ff0066] hover:bg-[oklch(0.65_0.28_12/0.08)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <ArrowUpFromLine size={14} />
                        {showWithdrawPanel ? "HIDE" : "WITHDRAW ACTIVE LP"}
                        {showWithdrawPanel ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      <AnimatePresence>
                        {showWithdrawPanel && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-2 space-y-3">
                              <div className="text-[10px] font-[Space_Grotesk] text-[oklch(0.5_0.02_265)] flex items-center gap-1.5 mb-1">
                                <AlertTriangle size={10} className="text-[oklch(0.8_0.2_90)]" />
                                Withdrawing will recalculate your tier multiplier.
                              </div>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={withdrawAmount}
                                  onChange={(e) => setWithdrawAmount(e.target.value)}
                                  placeholder="Amount to withdraw"
                                  className="w-full px-4 py-3 rounded-lg bg-[oklch(0.1_0.02_265)] border border-[oklch(0.3_0.04_265/0.3)] text-sm font-[Fira_Code] text-white placeholder:text-[oklch(0.35_0.02_265)] focus:border-[oklch(0.65_0.28_12/0.5)] focus:outline-none"
                                />
                                <button
                                  onClick={() => setWithdrawAmount(formatUnits(userData?.activeLp ?? 0n, lpDecimals))}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-[Orbitron] text-[#ff0066] border border-[oklch(0.65_0.28_12/0.3)] rounded hover:bg-[oklch(0.65_0.28_12/0.1)] transition-colors"
                                >
                                  MAX
                                </button>
                              </div>
                              <button
                                onClick={handleWithdraw}
                                disabled={txPending || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                                className="w-full py-2.5 rounded-lg font-[Orbitron] text-xs font-semibold tracking-wide border border-[oklch(0.65_0.28_12/0.3)] text-[#ff0066] hover:bg-[oklch(0.65_0.28_12/0.08)] transition-colors disabled:opacity-50"
                              >
                                {txPending ? "PROCESSING..." : "WITHDRAW"}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Emergency withdraw pending */}
                      {(userData?.pendingLp ?? 0n) > 0n && (
                        <button
                          onClick={handleEmergencyWithdraw}
                          disabled={txPending}
                          className="w-full py-2 text-[10px] font-[Orbitron] text-[oklch(0.5_0.02_265)] hover:text-[oklch(0.8_0.2_90)] border border-[oklch(0.2_0.02_265)] rounded-lg hover:border-[oklch(0.8_0.2_90/0.3)] transition-all"
                        >
                          Emergency Withdraw Pending ({pendingLpFormatted} LP)
                        </button>
                      )}

                      {/* Get LP link */}
                      <a
                        href={`https://pancakeswap.finance/add/BNB/${ACTIVE_CHAIN.mineToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)] hover:text-[#00f0ff] transition-colors"
                      >
                        Need LP? Add liquidity on PancakeSwap →
                      </a>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Claim History (collapsible) */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 text-xs font-[Orbitron] text-[oklch(0.5_0.02_265)] hover:text-[#00f0ff] transition-colors mb-2"
                >
                  <TrendingUp size={14} />
                  Claim History
                  {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <AnimatePresence>
                  {showHistory && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="glass-panel rounded-xl p-4">
                        {claimHistory.length === 0 ? (
                          <p className="text-xs text-[oklch(0.4_0.02_265)] font-[Fira_Code] text-center py-4">
                            No recent claims found (last ~2 days)
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {claimHistory.slice(0, 10).map((c, i) => (
                              <div key={i} className="flex items-center justify-between py-2 border-b border-[oklch(0.2_0.02_265/0.3)] last:border-0">
                                <div>
                                  <div className="text-xs font-[Fira_Code] text-white">
                                    +{formatBigNum(c.reward, mineDecimals)} MINE
                                  </div>
                                  <div className="text-[10px] font-[Fira_Code] text-[oklch(0.4_0.02_265)]">
                                    Block #{c.blockNumber}
                                  </div>
                                </div>
                                <a
                                  href={txUrl(c.txHash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[oklch(0.4_0.02_265)] hover:text-[#00f0ff] transition-colors"
                                >
                                  <ExternalLink size={14} />
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Contract link */}
              <div className="text-center">
                <a
                  href={addressUrl(ACTIVE_CHAIN.staking)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-[Fira_Code] text-[oklch(0.4_0.02_265)] hover:text-[#00f0ff] transition-colors"
                >
                  Contract: {shortenAddress(ACTIVE_CHAIN.staking, 6)} <ExternalLink size={10} />
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Claim Popup */}
      <ClaimPopup
        isOpen={showClaimPopup}
        onClose={() => {
          setShowClaimPopup(false);
          clearLastClaim();
        }}
        amount={lastClaimAmount || "0"}
        txHash={lastClaimTxHash}
        address={address || ""}
      />
    </div>
  );
}
