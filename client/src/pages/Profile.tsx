/*
 * CyberMine Profile Page — Neon Metropolis Design
 * Shows user's on-chain staking profile with:
 *   - Tier badge with multiplier and countdown
 *   - Weight breakdown visualization
 *   - LP positions (active + pending)
 *   - Referral credit display
 *   - Total claimed MINE
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Wallet, Shield, Zap, Users, TrendingUp, ExternalLink, AlertTriangle, Loader2, Clock, Award, ArrowUpRight } from "lucide-react";
import { formatUnits } from "ethers";
import { Link } from "wouter";
import AppNavbar from "@/components/AppNavbar";
import ParticleBackground from "@/components/ParticleBackground";
import TierBadge from "@/components/TierBadge";
import WeightBreakdown from "@/components/WeightBreakdown";
import { useWallet } from "@/contexts/WalletContext";
import { ACTIVE_CHAIN, addressUrl } from "@/config/contracts";
import { shortenAddress } from "@/lib/referral";
import { getTierInfo, getWeightBreakdown } from "@/lib/tiers";

function formatBigNum(val: bigint, decimals: number, dp = 4): string {
  const str = formatUnits(val, decimals);
  const num = parseFloat(str);
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toFixed(dp);
}

const FP = BigInt(10 ** 18);

export default function Profile() {
  const {
    connected, address, connect, connecting, wrongChain, switchChain,
    userData, protocolData, lpBalance, mineBalance, lpDecimals, mineDecimals,
    loading, initialLoading,
  } = useWallet();

  const joined = userData?.joined ?? false;

  const tierInfo = useMemo(() => {
    if (!userData) return getTierInfo(0n);
    return getTierInfo(userData.activeDepositTs);
  }, [userData]);

  const weightBreak = useMemo(() => {
    if (!userData) return { rawWeight: 0, multiplierBonus: 0, refCredit: 0, totalWeight: 0, baseWeight: 0 };
    return getWeightBreakdown(
      userData.cachedBaseWeightFp,
      userData.referralWeightCreditFp,
      tierInfo.multiplier,
      lpDecimals,
    );
  }, [userData, tierInfo, lpDecimals]);

  const userWeightPct = useMemo(() => {
    if (!protocolData || !userData) return 0;
    const totalW = Number(protocolData.totalBaseWeight) / Number(FP);
    if (totalW === 0) return 0;
    return (weightBreak.totalWeight / totalW) * 100;
  }, [protocolData, userData, weightBreak]);

  const activeLpFormatted = formatBigNum(userData?.activeLp ?? 0n, lpDecimals);
  const pendingLpFormatted = formatBigNum(userData?.pendingLp ?? 0n, lpDecimals);
  const mineBalFormatted = formatBigNum(mineBalance, mineDecimals, 2);
  const totalClaimedFormatted = formatBigNum(userData?.totalClaimed ?? 0n, mineDecimals, 2);
  const lpBalFormatted = formatBigNum(lpBalance, lpDecimals);
  const refCreditFormatted = formatBigNum(userData?.referralWeightCreditFp ?? 0n, 18, 4);

  return (
    <div className="min-h-screen bg-[#050510] text-white scan-line">
      <ParticleBackground />
      <AppNavbar />

      <main className="relative z-10 pt-24 md:pt-28 pb-16">
        <div className="container max-w-5xl">
          {/* Testnet Badge */}
          {ACTIVE_CHAIN.isTestnet && (
            <div className="text-center mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[oklch(0.85_0.18_80/0.15)] border border-[oklch(0.85_0.18_80/0.3)] text-[#ffd700] font-[Orbitron] text-[10px] tracking-wider">
                <AlertTriangle size={10} /> TESTNET MODE
              </span>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <span className="inline-block font-[Orbitron] text-xs text-[#ff0066] tracking-[0.3em] uppercase mb-2">
              // MINER PROFILE
            </span>
            <h1 className="font-[Orbitron] text-2xl md:text-3xl font-bold text-white">
              Your Mining Identity
            </h1>
          </motion.div>

          {/* Not Connected */}
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
                <p className="text-[oklch(0.55_0.02_265)] font-[Space_Grotesk] mb-8 leading-relaxed">
                  Connect your wallet to view your mining profile.
                </p>
                <button
                  onClick={connect}
                  disabled={connecting}
                  className="px-8 py-4 text-base font-[Orbitron] font-bold text-[#050510] bg-[#00f0ff] rounded-xl hover:shadow-[0_0_30px_oklch(0.85_0.18_192/0.5)] transition-all duration-300 tracking-wide disabled:opacity-50"
                >
                  {connecting ? "CONNECTING..." : "CONNECT WALLET"}
                </button>
              </div>
            </motion.div>
          ) : wrongChain ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto"
            >
              <div className="glass-panel rounded-2xl p-8 md:p-12 text-center">
                <AlertTriangle size={32} className="text-[#ffd700] mx-auto mb-4" />
                <h2 className="font-[Orbitron] text-xl font-bold text-white mb-3">Wrong Network</h2>
                <p className="text-[oklch(0.55_0.02_265)] font-[Space_Grotesk] mb-8">
                  Switch to {ACTIVE_CHAIN.name} to view your profile.
                </p>
                <button
                  onClick={switchChain}
                  className="px-8 py-4 text-base font-[Orbitron] font-bold text-[#050510] bg-[#ffd700] rounded-xl transition-all duration-300 tracking-wide"
                >
                  SWITCH NETWORK
                </button>
              </div>
            </motion.div>
          ) : initialLoading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto">
              <div className="glass-panel rounded-2xl p-12 text-center">
                <Loader2 size={40} className="mx-auto mb-4 text-[#00f0ff] animate-spin" />
                <p className="font-[Orbitron] text-sm text-[oklch(0.5_0.02_265)]">Loading profile...</p>
              </div>
            </motion.div>
          ) : !joined ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto"
            >
              <div className="glass-panel rounded-2xl p-8 md:p-12 text-center">
                <Shield size={32} className="text-[oklch(0.4_0.02_265)] mx-auto mb-4" />
                <h2 className="font-[Orbitron] text-lg font-bold text-white mb-2">Not Yet Joined</h2>
                <p className="text-sm text-[oklch(0.5_0.02_265)] font-[Space_Grotesk] mb-6">
                  You haven't joined CyberMine yet. Head to the Mine page to join and start earning.
                </p>
                <Link
                  href="/mine"
                  className="inline-flex items-center gap-2 px-8 py-4 text-base font-[Orbitron] font-bold text-white bg-gradient-to-r from-[#ff0066] to-[#ff3388] rounded-xl hover:shadow-[0_0_30px_oklch(0.65_0.28_12/0.5)] transition-all duration-300 tracking-wide"
                >
                  GO TO MINE <ArrowUpRight size={18} />
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-5">
              {/* Address Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00f0ff] to-[#ff0066] flex items-center justify-center flex-shrink-0">
                  <span className="font-[Orbitron] text-lg font-bold text-white">
                    {address ? address.slice(2, 4).toUpperCase() : "??"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={addressUrl(address || "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-[Fira_Code] text-sm text-[#00f0ff] hover:underline flex items-center gap-1"
                    >
                      {address ? `${address.slice(0, 10)}...${address.slice(-8)}` : ""} <ExternalLink size={10} />
                    </a>
                    {loading && (
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 border border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Syncing</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <TierBadge tierInfo={tierInfo} compact />
                    <span className="text-[10px] font-[Fira_Code] text-[oklch(0.4_0.02_265)]">
                      Network share: {userWeightPct.toFixed(4)}%
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Tier + Weight Row */}
              <div className="grid md:grid-cols-2 gap-4">
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
                    Mining Weight Breakdown
                  </div>
                  <div className="font-[Fira_Code] text-2xl font-bold text-white mb-3">
                    {weightBreak.totalWeight.toFixed(2)}
                  </div>
                  <WeightBreakdown
                    rawWeight={weightBreak.rawWeight}
                    multiplierBonus={weightBreak.multiplierBonus}
                    refCredit={weightBreak.refCredit}
                    totalWeight={weightBreak.totalWeight}
                  />
                </motion.div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Active LP", value: activeLpFormatted, icon: Zap, color: "#00f0ff" },
                  { label: "Pending LP", value: pendingLpFormatted, icon: Clock, color: "#ff0066" },
                  { label: "$MINE Balance", value: mineBalFormatted, icon: Award, color: "#ffd700" },
                  { label: "Total Claimed", value: totalClaimedFormatted + " MINE", icon: TrendingUp, color: "#00cc88" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                    className="glass-panel rounded-xl p-4"
                  >
                    <stat.icon size={14} style={{ color: stat.color }} className="mb-2" />
                    <div className="text-[10px] font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider uppercase mb-1">
                      {stat.label}
                    </div>
                    <div className="font-[Fira_Code] text-sm font-bold" style={{ color: stat.color }}>
                      {stat.value}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Referral Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="glass-panel rounded-xl p-5"
              >
                <h3 className="font-[Orbitron] text-sm font-bold text-white tracking-wider mb-4 flex items-center gap-2">
                  <Users size={14} className="text-[#ff0066]" />
                  REFERRAL INFO
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Referrer</span>
                    <span className="font-[Fira_Code] text-sm text-white">
                      {userData?.referrer && userData.referrer !== "0x0000000000000000000000000000000000000000" ? (
                        <a
                          href={addressUrl(userData.referrer)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00f0ff] hover:underline"
                        >
                          {shortenAddress(userData.referrer)}
                        </a>
                      ) : (
                        "None"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Referral Count</span>
                    <span className="font-[Fira_Code] text-sm font-bold text-[#ff0066]">
                      {userData?.referralCount ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Referral Weight Credit</span>
                    <span className="font-[Fira_Code] text-sm font-bold text-[#ff0066]">
                      {refCreditFormatted}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Wallet LP Balance</span>
                    <span className="font-[Fira_Code] text-sm text-white">{lpBalFormatted}</span>
                  </div>
                </div>
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
    </div>
  );
}
