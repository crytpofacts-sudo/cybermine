/*
 * CyberMine Profile Page — Neon Metropolis Design
 * User dashboard showing:
 *   - Wallet address & connection status
 *   - LP deposit stats
 *   - Tier progression meter
 *   - Claim history (simulated)
 *   - Weight breakdown
 */
import { motion } from "framer-motion";
import { Wallet, TrendingUp, Clock, Zap, Shield, Award, ArrowUpRight } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import ParticleBackground from "@/components/ParticleBackground";
import { useWallet } from "@/contexts/WalletContext";
import { Link } from "wouter";

const TIERS = [
  { label: "Initiate", range: "0–7d", mult: "1.00×", color: "#00f0ff", threshold: 0 },
  { label: "Operative", range: "7–30d", mult: "1.15×", color: "#00f0ff", threshold: 7 },
  { label: "Specialist", range: "30–90d", mult: "1.35×", color: "#00f0ff", threshold: 30 },
  { label: "Commander", range: "90–180d", mult: "1.60×", color: "#ff0066", threshold: 90 },
  { label: "Elite", range: "180–365d", mult: "1.90×", color: "#ff0066", threshold: 180 },
  { label: "Legend", range: "365d+", mult: "2.10×", color: "#ffd700", threshold: 365 },
];

// Simulated claim history
const MOCK_CLAIMS = [
  { date: "2026-03-01 14:32", amount: 42_187, fee: 0.0009 },
  { date: "2026-03-01 02:15", amount: 38_921, fee: 0.0009 },
  { date: "2026-02-28 14:01", amount: 41_003, fee: 0.0009 },
  { date: "2026-02-28 01:58", amount: 39_445, fee: 0.0009 },
  { date: "2026-02-27 13:44", amount: 43_112, fee: 0.0009 },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

export default function Profile() {
  const { connected, address, connect, connecting, userStats } = useWallet();

  // Calculate days since deposit for tier display
  const daysSinceDeposit = userStats.depositTs > 0
    ? Math.floor((Date.now() / 1000 - userStats.depositTs) / 86400)
    : 0;
  const currentTierIndex = TIERS.findIndex((t, i) => {
    const next = TIERS[i + 1];
    return !next || daysSinceDeposit < next.threshold;
  });
  const currentTier = TIERS[Math.max(0, currentTierIndex)];
  const nextTier = TIERS[Math.min(currentTierIndex + 1, TIERS.length - 1)];
  const daysToNext = currentTierIndex < TIERS.length - 1
    ? Math.max(0, nextTier.threshold - daysSinceDeposit)
    : 0;

  return (
    <div className="min-h-screen bg-[#050510] text-white scan-line">
      <ParticleBackground />
      <AppNavbar />

      <main className="relative z-10 pt-24 md:pt-28 pb-16">
        <div className="container max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <span className="inline-block font-[Orbitron] text-xs text-[#ff0066] tracking-[0.3em] uppercase mb-2">
              // MINER PROFILE
            </span>
            <h1 className="font-[Orbitron] text-2xl md:text-3xl font-bold text-white">
              Your Dashboard
            </h1>
          </motion.div>

          {!connected ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto"
            >
              <div className="glass-panel rounded-2xl p-8 md:p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[oklch(0.85_0.18_192/0.1)] border border-[oklch(0.85_0.18_192/0.2)] flex items-center justify-center">
                  <Wallet size={32} className="text-[#00f0ff]" />
                </div>
                <h2 className="font-[Orbitron] text-xl font-bold text-white mb-3">Connect Wallet</h2>
                <p className="text-[oklch(0.55_0.02_265)] font-[Space_Grotesk] mb-8">
                  Connect your Solana wallet to view your miner profile.
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
          ) : !userStats.joined ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto"
            >
              <div className="glass-panel rounded-2xl p-8 md:p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[oklch(0.65_0.28_12/0.1)] border border-[oklch(0.65_0.28_12/0.2)] flex items-center justify-center">
                  <Zap size={32} className="text-[#ff0066]" />
                </div>
                <h2 className="font-[Orbitron] text-xl font-bold text-white mb-3">Not Yet Joined</h2>
                <p className="text-[oklch(0.55_0.02_265)] font-[Space_Grotesk] mb-8">
                  You haven't joined the CyberMine protocol yet. Head to the mining terminal to register.
                </p>
                <Link
                  href="/mine"
                  className="inline-flex items-center gap-2 px-8 py-4 text-base font-[Orbitron] font-bold text-white bg-gradient-to-r from-[#ff0066] to-[#ff3388] rounded-xl hover:shadow-[0_0_30px_oklch(0.65_0.28_12/0.5)] transition-all duration-300 tracking-wide glow-magenta"
                >
                  GO TO MINE <ArrowUpRight size={18} />
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Wallet Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel rounded-xl p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00f0ff] to-[#ff0066] p-[2px]">
                      <div className="w-full h-full rounded-[10px] bg-[#050510] flex items-center justify-center">
                        <Wallet size={24} className="text-[#00f0ff]" />
                      </div>
                    </div>
                    <div>
                      <div className="font-[Fira_Code] text-sm text-[#00f0ff] mb-1">{address}</div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Connected</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="font-[Orbitron] text-xs font-bold tracking-wider px-4 py-2 rounded-lg"
                      style={{
                        color: currentTier.color,
                        backgroundColor: `${currentTier.color}15`,
                        border: `1px solid ${currentTier.color}30`,
                      }}
                    >
                      {currentTier.label.toUpperCase()} — {currentTier.mult}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Stats Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {[
                  { label: "LP DEPOSITED", value: formatNumber(userStats.lpAmount), color: "#00f0ff", icon: Zap },
                  { label: "BASE WEIGHT", value: formatNumber(userStats.baseWeight), color: "#00f0ff", icon: Shield },
                  { label: "TOTAL CLAIMED", value: formatNumber(userStats.totalClaimed) + " $MINE", color: "#ffd700", icon: Award },
                  { label: "DAYS ACTIVE", value: daysSinceDeposit.toString(), color: "#ff0066", icon: Clock },
                ].map((stat, i) => (
                  <div key={i} className="glass-panel rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <stat.icon size={14} style={{ color: stat.color }} />
                      <span className="font-[Orbitron] text-[10px] tracking-wider text-[oklch(0.5_0.02_265)]">
                        {stat.label}
                      </span>
                    </div>
                    <div className="font-[Fira_Code] text-xl font-bold" style={{ color: stat.color }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Tier Progression */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-panel rounded-xl p-6"
              >
                <h3 className="font-[Orbitron] text-sm font-bold text-white tracking-wider mb-5 flex items-center gap-2">
                  <TrendingUp size={14} className="text-[#00f0ff]" />
                  TIER PROGRESSION
                </h3>
                <div className="space-y-3">
                  {TIERS.map((tier, i) => {
                    const isActive = i === currentTierIndex;
                    const isPast = i < currentTierIndex;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                          isActive
                            ? "bg-[oklch(0.85_0.18_192/0.08)] border border-[oklch(0.85_0.18_192/0.2)]"
                            : isPast
                            ? "opacity-50"
                            : "opacity-30"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-[Orbitron] font-bold ${
                            isActive || isPast ? "" : "opacity-50"
                          }`}
                          style={{
                            color: tier.color,
                            backgroundColor: `${tier.color}15`,
                            border: `1px solid ${tier.color}30`,
                          }}
                        >
                          {isPast ? "✓" : i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-[Space_Grotesk] text-sm text-white font-medium">
                              {tier.label}
                            </span>
                            <span className="font-[Fira_Code] text-sm font-bold" style={{ color: tier.color }}>
                              {tier.mult}
                            </span>
                          </div>
                          <span className="text-xs text-[oklch(0.45_0.02_265)] font-[Fira_Code]">
                            {tier.range}
                          </span>
                        </div>
                        {isActive && daysToNext > 0 && (
                          <span className="text-xs font-[Fira_Code] text-[oklch(0.5_0.02_265)]">
                            {daysToNext}d to next
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Claim History */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-panel rounded-xl p-6"
              >
                <h3 className="font-[Orbitron] text-sm font-bold text-white tracking-wider mb-5 flex items-center gap-2">
                  <Clock size={14} className="text-[#ff0066]" />
                  CLAIM HISTORY
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[oklch(0.3_0.04_265/0.2)]">
                        <th className="text-left py-3 text-[10px] font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider">DATE</th>
                        <th className="text-right py-3 text-[10px] font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider">AMOUNT</th>
                        <th className="text-right py-3 text-[10px] font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider">FEE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_CLAIMS.map((claim, i) => (
                        <tr key={i} className="border-b border-[oklch(0.2_0.02_265/0.3)]">
                          <td className="py-3 font-[Fira_Code] text-xs text-[oklch(0.6_0.02_265)]">
                            {claim.date}
                          </td>
                          <td className="py-3 text-right font-[Fira_Code] text-sm font-semibold text-[#00f0ff]">
                            +{claim.amount.toLocaleString()} $MINE
                          </td>
                          <td className="py-3 text-right font-[Fira_Code] text-xs text-[oklch(0.5_0.02_265)]">
                            {claim.fee} SOL
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-[10px] text-[oklch(0.4_0.02_265)] font-[Space_Grotesk] text-center">
                  Showing simulated data — connect to mainnet for real claim history
                </p>
              </motion.div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
