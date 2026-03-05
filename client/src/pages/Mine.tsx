/*
 * CyberMine Mining Terminal — Neon Metropolis Design
 * BNB Chain integration with real contract calls:
 *   - Approve LP → Join & Stake → Deposit Pending → Claim → Withdraw
 *   - Animated radial cooldown progress ring
 *   - Live countdown timer from nextClaimTime
 *   - Active LP / Pending LP / Network share displays
 *   - Wrong-chain enforcement
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Zap, Clock, TrendingUp, Shield, ChevronDown, ChevronUp, AlertTriangle, ExternalLink } from "lucide-react";
import { formatUnits, parseUnits, MaxUint256 } from "ethers";
import AppNavbar from "@/components/AppNavbar";
import ParticleBackground from "@/components/ParticleBackground";
import { useWallet } from "@/contexts/WalletContext";
import { ACTIVE_CHAIN, addressUrl } from "@/config/contracts";
import { getStoredReferral, shortenAddress } from "@/lib/referral";

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

export default function Mine() {
  const {
    connected, connecting, connect, wrongChain, switchChain,
    userData, protocolData, lpBalance, lpAllowance, mineBalance,
    nextClaimTs, lpDecimals, mineDecimals,
    approveLp, joinAndDeposit, depositPending, claim, withdraw, emergencyWithdrawPending,
    txPending,
  } = useWallet();

  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [showDepositPanel, setShowDepositPanel] = useState(false);
  const [showWithdrawPanel, setShowWithdrawPanel] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [joinAmount, setJoinAmount] = useState("");

  const joined = userData?.joined ?? false;
  const paused = protocolData?.paused ?? false;
  const feeWei = protocolData?.feeWei ?? 0n;
  const cooldownSec = Number(protocolData?.cooldownSeconds ?? 0n);

  const storedRef = useMemo(() => getStoredReferral(), []);

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
                  Please switch to <span className="text-[#00f0ff] font-[Fira_Code]">{ACTIVE_CHAIN.name}</span> to use CyberMine.
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

          {/* Connected, correct chain, not joined */}
          {connected && !wrongChain && !joined && !paused && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto"
            >
              <div className="glass-panel rounded-2xl p-8 md:p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[oklch(0.65_0.28_12/0.1)] border border-[oklch(0.65_0.28_12/0.2)] flex items-center justify-center">
                  <Zap size={32} className="text-[#ff0066]" />
                </div>
                <h2 className="font-[Orbitron] text-xl font-bold text-white mb-3">
                  Join CyberMine
                </h2>
                <p className="text-[oklch(0.55_0.02_265)] font-[Space_Grotesk] mb-4 leading-relaxed">
                  Stake Pancake LP (MINE/BNB) to earn $MINE. Approve your LP tokens, then join and stake in one transaction.
                </p>

                {/* Referral detected */}
                {storedRef && (
                  <div className="mb-4 p-3 rounded-lg bg-[oklch(0.65_0.28_12/0.08)] border border-[oklch(0.65_0.28_12/0.2)]">
                    <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">
                      Referral detected:{" "}
                    </span>
                    <span className="font-[Fira_Code] text-xs text-[#ff0066]">
                      {shortenAddress(storedRef)}
                    </span>
                  </div>
                )}

                {/* LP Balance */}
                <div className="mb-4 p-3 rounded-lg bg-[oklch(0.1_0.02_265)] border border-[oklch(0.3_0.04_265/0.2)]">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Your LP Balance</span>
                    <span className="font-[Fira_Code] text-sm text-[#00f0ff]">{lpBalFormatted}</span>
                  </div>
                </div>

                {/* Amount input */}
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="number"
                      value={joinAmount}
                      onChange={(e) => setJoinAmount(e.target.value)}
                      placeholder="LP amount to stake"
                      className="w-full px-4 py-3 rounded-lg bg-[oklch(0.1_0.02_265)] border border-[oklch(0.3_0.04_265/0.3)] text-sm font-[Fira_Code] text-white placeholder:text-[oklch(0.35_0.02_265)] focus:border-[oklch(0.85_0.18_192/0.5)] focus:outline-none transition-colors"
                    />
                    <button
                      onClick={() => setJoinAmount(formatUnits(lpBalance, lpDecimals))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-[Orbitron] text-[#00f0ff] border border-[oklch(0.85_0.18_192/0.3)] rounded hover:bg-[oklch(0.85_0.18_192/0.1)] transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {/* Fee info */}
                {feeWei > 0n && (
                  <p className="text-xs text-[oklch(0.45_0.02_265)] font-[Space_Grotesk] mb-4">
                    Protocol fee: <span className="font-[Fira_Code] text-[#00f0ff]">{formatUnits(feeWei, 18)} BNB</span>
                  </p>
                )}

                {/* Get LP link */}
                <div className="mb-6">
                  <a
                    href="https://pancakeswap.finance/add/BNB/0x40325c4F37F577111faFC4f31AB7979026626680"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)] hover:text-[#00f0ff] transition-colors flex items-center gap-1 justify-center"
                  >
                    Need LP? Add liquidity on PancakeSwap <ExternalLink size={10} />
                  </a>
                </div>

                <button
                  onClick={handleJoin}
                  disabled={txPending || !joinAmount || parseFloat(joinAmount) <= 0}
                  className="w-full px-8 py-4 text-base font-[Orbitron] font-bold text-white bg-gradient-to-r from-[#ff0066] to-[#ff3388] rounded-xl hover:shadow-[0_0_30px_oklch(0.65_0.28_12/0.5)] transition-all duration-300 tracking-wide glow-magenta disabled:opacity-50"
                >
                  {txPending
                    ? "PROCESSING..."
                    : joinAmountBn > 0n && needsApproval(joinAmountBn)
                    ? "APPROVE LP FIRST"
                    : `JOIN & STAKE${feeWei > 0n ? ` — ${formatUnits(feeWei, 18)} BNB` : ""}`}
                </button>
              </div>
            </motion.div>
          )}

          {/* Joined — Main Mining Terminal */}
          {connected && !wrongChain && joined && (
            <div className="max-w-5xl mx-auto">
              {/* Top Stats Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8"
              >
                {[
                  { label: "ACTIVE LP", value: activeLpFormatted, color: "#00f0ff", icon: Zap },
                  { label: "PENDING LP", value: pendingLpFormatted, color: "#ff0066", icon: Clock },
                  { label: "$MINE BALANCE", value: mineBalFormatted, color: "#ffd700", icon: TrendingUp },
                  { label: "REFERRAL COUNT", value: String(userData?.referralCount ?? 0n), color: "#00f0ff", icon: Shield },
                ].map((stat, i) => (
                  <div key={i} className="glass-panel rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon size={12} style={{ color: stat.color }} />
                      <span className="font-[Orbitron] text-[10px] tracking-wider" style={{ color: "oklch(0.5 0.02 265)" }}>
                        {stat.label}
                      </span>
                    </div>
                    <div className="font-[Fira_Code] text-lg md:text-xl font-bold" style={{ color: stat.color }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Center: The Big Claim Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                className="flex flex-col items-center mb-8"
              >
                <div className="relative">
                  {/* Outer glow */}
                  <div
                    className={`absolute -inset-6 rounded-full blur-2xl transition-all duration-1000 ${
                      canClaim
                        ? "bg-[oklch(0.85_0.18_192/0.25)] animate-glow-breathe"
                        : "bg-[oklch(0.65_0.28_12/0.1)]"
                    }`}
                  />

                  {/* SVG Ring */}
                  <svg width="300" height="300" viewBox="0 0 300 300" className="relative">
                    <circle cx="150" cy="150" r={ringRadius} fill="none" stroke="oklch(0.2 0.02 265)" strokeWidth="6" />
                    <circle
                      cx="150" cy="150" r={ringRadius}
                      fill="none"
                      stroke={canClaim ? "#00f0ff" : "#ff0066"}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                      transform="rotate(-90 150 150)"
                      className="transition-all duration-1000"
                      style={{
                        filter: canClaim
                          ? "drop-shadow(0 0 8px oklch(0.85 0.18 192 / 60%))"
                          : "drop-shadow(0 0 4px oklch(0.65 0.28 12 / 40%))",
                      }}
                    />
                    {Array.from({ length: 24 }).map((_, i) => {
                      const angle = (i * 360) / 24 - 90;
                      const rad = (angle * Math.PI) / 180;
                      const x1 = 150 + (ringRadius + 10) * Math.cos(rad);
                      const y1 = 150 + (ringRadius + 10) * Math.sin(rad);
                      const x2 = 150 + (ringRadius + 16) * Math.cos(rad);
                      const y2 = 150 + (ringRadius + 16) * Math.sin(rad);
                      return (
                        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="oklch(0.3 0.02 265)" strokeWidth="1.5" />
                      );
                    })}
                  </svg>

                  {/* Center button */}
                  <button
                    onClick={handleClaim}
                    disabled={!canClaim || txPending || paused}
                    className={`absolute inset-0 m-auto w-[220px] h-[220px] rounded-full flex flex-col items-center justify-center transition-all duration-500 ${
                      canClaim
                        ? "bg-gradient-to-br from-[oklch(0.85_0.18_192/0.15)] to-[oklch(0.85_0.18_192/0.05)] border-2 border-[#00f0ff] hover:scale-105 hover:shadow-[0_0_50px_oklch(0.85_0.18_192/0.4)] active:scale-95"
                        : "bg-[oklch(0.12_0.02_265/0.8)] border-2 border-[oklch(0.3_0.04_265/0.3)] cursor-not-allowed"
                    }`}
                  >
                    {txPending ? (
                      <>
                        <div className="w-8 h-8 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin mb-2" />
                        <span className="font-[Orbitron] text-sm text-[#00f0ff] tracking-wider">MINING...</span>
                      </>
                    ) : canClaim ? (
                      <>
                        <span className="font-[Orbitron] text-2xl font-bold text-[#00f0ff] text-glow-cyan mb-1">CLAIM</span>
                        {feeWei > 0n && (
                          <span className="font-[Fira_Code] text-xs text-[oklch(0.5_0.02_265)]">
                            {formatUnits(feeWei, 18)} BNB fee
                          </span>
                        )}
                      </>
                    ) : (userData?.activeLp ?? 0n) === 0n ? (
                      <>
                        <span className="font-[Orbitron] text-sm font-bold text-[oklch(0.5_0.02_265)] mb-1">DEPOSIT LP</span>
                        <span className="font-[Fira_Code] text-xs text-[oklch(0.35_0.02_265)]">to start mining</span>
                      </>
                    ) : (
                      <>
                        <span className="font-[Orbitron] text-sm font-bold text-[#ff0066] mb-1">COOLDOWN</span>
                        <span className="font-[Fira_Code] text-xl font-bold text-white">{formatCountdown(cooldownLeft)}</span>
                        <span className="font-[Fira_Code] text-xs text-[oklch(0.4_0.02_265)] mt-1">until next claim</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Pending LP info */}
                {(userData?.pendingLp ?? 0n) > 0n && (
                  <p className="mt-4 text-xs text-[oklch(0.5_0.02_265)] font-[Space_Grotesk] text-center max-w-sm">
                    You have <span className="text-[#ff0066] font-[Fira_Code]">{pendingLpFormatted}</span> pending LP.
                    It will roll into active LP on your next claim.
                  </p>
                )}
              </motion.div>

              {/* Bottom Panels */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Status Panel */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-panel rounded-xl p-6"
                >
                  <h3 className="font-[Orbitron] text-sm font-bold text-white tracking-wider mb-4 flex items-center gap-2">
                    <Shield size={14} className="text-[#00f0ff]" />
                    STATUS
                  </h3>
                  <div className="space-y-4">
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
                        {formatBigNum(userData?.referralWeightCreditFp ?? 0n, lpDecimals, 2)}
                      </span>
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
                  transition={{ delay: 0.4 }}
                  className="glass-panel rounded-xl p-6"
                >
                  <h3 className="font-[Orbitron] text-sm font-bold text-white tracking-wider mb-4 flex items-center gap-2">
                    <Zap size={14} className="text-[#ff0066]" />
                    LP VAULT
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Wallet LP Balance</span>
                      <span className="font-[Fira_Code] text-sm font-bold text-white">{lpBalFormatted}</span>
                    </div>

                    {/* Deposit more */}
                    <button
                      onClick={() => { setShowDepositPanel(!showDepositPanel); setShowWithdrawPanel(false); }}
                      disabled={paused}
                      className="w-full py-3 rounded-lg font-[Orbitron] text-sm font-semibold tracking-wide border border-[oklch(0.85_0.18_192/0.3)] text-[#00f0ff] hover:bg-[oklch(0.85_0.18_192/0.08)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {showDepositPanel ? "HIDE" : "DEPOSIT MORE LP (PENDING)"}
                      {showDepositPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    <AnimatePresence>
                      {showDepositPanel && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3 space-y-3">
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
                      className="w-full py-3 rounded-lg font-[Orbitron] text-sm font-semibold tracking-wide border border-[oklch(0.65_0.28_12/0.3)] text-[#ff0066] hover:bg-[oklch(0.65_0.28_12/0.08)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {showWithdrawPanel ? "HIDE" : "WITHDRAW ACTIVE LP"}
                      {showWithdrawPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    <AnimatePresence>
                      {showWithdrawPanel && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3 space-y-3">
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

                    {/* Get LP link */}
                    <a
                      href="https://pancakeswap.finance/add/BNB/0x40325c4F37F577111faFC4f31AB7979026626680"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)] hover:text-[#00f0ff] transition-colors mt-2"
                    >
                      Need LP? Add liquidity on PancakeSwap →
                    </a>
                  </div>
                </motion.div>
              </div>

              {/* Contract link */}
              <div className="mt-6 text-center">
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
    </div>
  );
}
