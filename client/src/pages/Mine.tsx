/*
 * CyberMine Mining Terminal — Neon Metropolis Design
 * The core dApp page with:
 *   - Massive glowing circular CLAIM button
 *   - Animated radial cooldown progress ring
 *   - Live countdown timer
 *   - Network share, remaining supply, weight displays
 *   - Join flow for new users
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Zap, Clock, TrendingUp, Shield, ChevronDown, ChevronUp } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import ParticleBackground from "@/components/ParticleBackground";
import { useWallet } from "@/contexts/WalletContext";

const COOLDOWN_SECONDS = 43200; // 12 hours

// Simulated protocol stats
const PROTOCOL_STATS = {
  remainingSupply: 20_456_789_123,
  totalBaseWeight: 1_847_293,
  totalMiners: 2_847,
  totalClaimed: 333_210_877,
};

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "READY";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

export default function Mine() {
  const { connected, connecting, connect, userStats, join, claim } = useWallet();
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [joining, setJoining] = useState(false);
  const [referralInput, setReferralInput] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showDepositPanel, setShowDepositPanel] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");

  // Cooldown timer
  useEffect(() => {
    if (!userStats.joined) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() / 1000 - userStats.lastClaimTs;
      const remaining = Math.max(0, Math.floor(COOLDOWN_SECONDS - elapsed));
      setCooldownLeft(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [userStats.lastClaimTs, userStats.joined]);

  const cooldownProgress = userStats.joined
    ? Math.min(1, (COOLDOWN_SECONDS - cooldownLeft) / COOLDOWN_SECONDS)
    : 0;
  const canClaim = cooldownLeft === 0 && userStats.joined && userStats.lpAmount > 0;

  const handleClaim = useCallback(async () => {
    if (!canClaim) return;
    setClaiming(true);
    await claim();
    setClaiming(false);
  }, [canClaim, claim]);

  const handleJoin = useCallback(async () => {
    setJoining(true);
    await join(referralInput || undefined);
    setJoining(false);
  }, [join, referralInput]);

  // SVG ring parameters
  const ringRadius = 130;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - cooldownProgress);

  return (
    <div className="min-h-screen bg-[#050510] text-white scan-line">
      <ParticleBackground />
      <AppNavbar />

      <main className="relative z-10 pt-24 md:pt-28 pb-16">
        <div className="container">
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
              {connected ? (userStats.joined ? "Claim Your Rewards" : "Join the Protocol") : "Connect to Mine"}
            </h1>
          </motion.div>

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
                  Connect your Solana wallet to access the mining terminal. You'll need a Phantom, Solflare, or compatible wallet.
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

          {/* Connected but not joined */}
          {connected && !userStats.joined && (
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
                <p className="text-[oklch(0.55_0.02_265)] font-[Space_Grotesk] mb-6 leading-relaxed">
                  Pay a one-time fee of <span className="text-[#00f0ff] font-[Fira_Code]">0.0009 SOL</span> to register as a miner. Optionally enter a referral code.
                </p>

                <div className="mb-6">
                  <button
                    onClick={() => setShowJoinForm(!showJoinForm)}
                    className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)] hover:text-[#00f0ff] transition-colors flex items-center gap-1 mx-auto"
                  >
                    Have a referral code? {showJoinForm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <AnimatePresence>
                    {showJoinForm && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <input
                          type="text"
                          value={referralInput}
                          onChange={(e) => setReferralInput(e.target.value)}
                          placeholder="Enter referral wallet address"
                          className="mt-4 w-full px-4 py-3 rounded-lg bg-[oklch(0.1_0.02_265)] border border-[oklch(0.3_0.04_265/0.3)] text-sm font-[Fira_Code] text-[#00f0ff] placeholder:text-[oklch(0.35_0.02_265)] focus:border-[oklch(0.85_0.18_192/0.5)] focus:outline-none transition-colors"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="px-8 py-4 text-base font-[Orbitron] font-bold text-white bg-gradient-to-r from-[#ff0066] to-[#ff3388] rounded-xl hover:shadow-[0_0_30px_oklch(0.65_0.28_12/0.5)] transition-all duration-300 tracking-wide glow-magenta disabled:opacity-50"
                >
                  {joining ? "JOINING..." : "JOIN PROTOCOL — 0.0009 SOL"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Joined — Main Mining Terminal */}
          {connected && userStats.joined && (
            <div className="max-w-5xl mx-auto">
              {/* Top Stats Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8"
              >
                {[
                  { label: "REMAINING SUPPLY", value: formatNumber(PROTOCOL_STATS.remainingSupply), color: "#00f0ff", icon: TrendingUp },
                  { label: "TOTAL MINERS", value: PROTOCOL_STATS.totalMiners.toLocaleString(), color: "#ff0066", icon: Shield },
                  { label: "YOUR LP DEPOSITED", value: formatNumber(userStats.lpAmount), color: "#00f0ff", icon: Zap },
                  { label: "TOTAL CLAIMED", value: formatNumber(userStats.totalClaimed), color: "#ffd700", icon: Clock },
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
                        : "bg-[oklch(0.85_0.18_192/0.05)]"
                    }`}
                  />

                  {/* SVG Ring */}
                  <svg
                    width="300"
                    height="300"
                    viewBox="0 0 300 300"
                    className="relative"
                  >
                    {/* Background ring */}
                    <circle
                      cx="150"
                      cy="150"
                      r={ringRadius}
                      fill="none"
                      stroke="oklch(0.2 0.02 265)"
                      strokeWidth="6"
                    />
                    {/* Progress ring */}
                    <circle
                      cx="150"
                      cy="150"
                      r={ringRadius}
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
                    {/* Tick marks */}
                    {Array.from({ length: 24 }).map((_, i) => {
                      const angle = (i * 360) / 24 - 90;
                      const rad = (angle * Math.PI) / 180;
                      const x1 = 150 + (ringRadius + 10) * Math.cos(rad);
                      const y1 = 150 + (ringRadius + 10) * Math.sin(rad);
                      const x2 = 150 + (ringRadius + 16) * Math.cos(rad);
                      const y2 = 150 + (ringRadius + 16) * Math.sin(rad);
                      return (
                        <line
                          key={i}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="oklch(0.3 0.02 265)"
                          strokeWidth="1.5"
                        />
                      );
                    })}
                  </svg>

                  {/* Center button */}
                  <button
                    onClick={handleClaim}
                    disabled={!canClaim || claiming}
                    className={`absolute inset-0 m-auto w-[220px] h-[220px] rounded-full flex flex-col items-center justify-center transition-all duration-500 ${
                      canClaim
                        ? "bg-gradient-to-br from-[oklch(0.85_0.18_192/0.15)] to-[oklch(0.85_0.18_192/0.05)] border-2 border-[#00f0ff] hover:scale-105 hover:shadow-[0_0_50px_oklch(0.85_0.18_192/0.4)] active:scale-95"
                        : "bg-[oklch(0.12_0.02_265/0.8)] border-2 border-[oklch(0.3_0.04_265/0.3)] cursor-not-allowed"
                    }`}
                  >
                    {claiming ? (
                      <>
                        <div className="w-8 h-8 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin mb-2" />
                        <span className="font-[Orbitron] text-sm text-[#00f0ff] tracking-wider">
                          MINING...
                        </span>
                      </>
                    ) : canClaim ? (
                      <>
                        <span className="font-[Orbitron] text-2xl font-bold text-[#00f0ff] text-glow-cyan mb-1">
                          CLAIM
                        </span>
                        <span className="font-[Fira_Code] text-xs text-[oklch(0.5_0.02_265)]">
                          0.0009 SOL fee
                        </span>
                      </>
                    ) : userStats.lpAmount === 0 ? (
                      <>
                        <span className="font-[Orbitron] text-sm font-bold text-[oklch(0.5_0.02_265)] mb-1">
                          DEPOSIT LP
                        </span>
                        <span className="font-[Fira_Code] text-xs text-[oklch(0.35_0.02_265)]">
                          to start mining
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-[Orbitron] text-sm font-bold text-[#ff0066] mb-1">
                          COOLDOWN
                        </span>
                        <span className="font-[Fira_Code] text-xl font-bold text-white">
                          {formatCountdown(cooldownLeft)}
                        </span>
                        <span className="font-[Fira_Code] text-xs text-[oklch(0.4_0.02_265)] mt-1">
                          until next claim
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Bottom Panels */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Weight & Tier Panel */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-panel rounded-xl p-6"
                >
                  <h3 className="font-[Orbitron] text-sm font-bold text-white tracking-wider mb-4 flex items-center gap-2">
                    <Shield size={14} className="text-[#00f0ff]" />
                    WEIGHT & TIER
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Current Tier</span>
                      <span className="font-[Orbitron] text-sm font-bold text-[#00f0ff] px-3 py-1 rounded-md bg-[oklch(0.85_0.18_192/0.1)] border border-[oklch(0.85_0.18_192/0.2)]">
                        {userStats.tier}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Tier Multiplier</span>
                      <span className="font-[Fira_Code] text-sm font-bold text-white">{userStats.tierMultiplier.toFixed(2)}×</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Base Weight</span>
                      <span className="font-[Fira_Code] text-sm font-bold text-white">{formatNumber(userStats.baseWeight)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Referral Bonus</span>
                      <span className="font-[Fira_Code] text-sm font-bold text-[#ff0066]">+{formatNumber(userStats.referralCreditFp)}</span>
                    </div>
                    <div className="pt-3 border-t border-[oklch(0.3_0.04_265/0.2)] flex justify-between items-center">
                      <span className="text-xs font-[Orbitron] text-[oklch(0.6_0.02_265)] tracking-wider">EFFECTIVE WEIGHT</span>
                      <span className="font-[Fira_Code] text-lg font-bold text-[#00f0ff] text-glow-cyan">{formatNumber(userStats.effectiveWeight)}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Deposit LP Panel */}
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
                      <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Deposited LP</span>
                      <span className="font-[Fira_Code] text-sm font-bold text-white">{formatNumber(userStats.lpAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Network Share</span>
                      <span className="font-[Fira_Code] text-sm font-bold text-[#ff0066]">
                        {PROTOCOL_STATS.totalBaseWeight > 0
                          ? ((userStats.baseWeight / PROTOCOL_STATS.totalBaseWeight) * 100).toFixed(4)
                          : "0.0000"}%
                      </span>
                    </div>

                    <button
                      onClick={() => setShowDepositPanel(!showDepositPanel)}
                      className="w-full mt-2 py-3 rounded-lg font-[Orbitron] text-sm font-semibold tracking-wide border border-[oklch(0.85_0.18_192/0.3)] text-[#00f0ff] hover:bg-[oklch(0.85_0.18_192/0.08)] transition-colors flex items-center justify-center gap-2"
                    >
                      {showDepositPanel ? "HIDE" : "DEPOSIT / WITHDRAW LP"}
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
                            <input
                              type="number"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              placeholder="LP token amount"
                              className="w-full px-4 py-3 rounded-lg bg-[oklch(0.1_0.02_265)] border border-[oklch(0.3_0.04_265/0.3)] text-sm font-[Fira_Code] text-white placeholder:text-[oklch(0.35_0.02_265)] focus:border-[oklch(0.85_0.18_192/0.5)] focus:outline-none"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={() => {
                                  const amt = parseFloat(depositAmount);
                                  if (amt > 0) {
                                    import("@/contexts/WalletContext").then(() => {});
                                    // Direct call through context
                                  }
                                }}
                                className="py-2.5 rounded-lg font-[Orbitron] text-xs font-semibold tracking-wide bg-[#00f0ff] text-[#050510] hover:shadow-[0_0_20px_oklch(0.85_0.18_192/0.4)] transition-all"
                              >
                                DEPOSIT
                              </button>
                              <button className="py-2.5 rounded-lg font-[Orbitron] text-xs font-semibold tracking-wide border border-[oklch(0.65_0.28_12/0.3)] text-[#ff0066] hover:bg-[oklch(0.65_0.28_12/0.08)] transition-colors">
                                WITHDRAW
                              </button>
                            </div>
                            <p className="text-[10px] text-[oklch(0.4_0.02_265)] font-[Space_Grotesk]">
                              First add liquidity to the MINE/SOL pool on Raydium, then deposit your LP tokens here.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
