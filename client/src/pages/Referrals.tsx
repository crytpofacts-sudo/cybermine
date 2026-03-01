/*
 * CyberMine Referrals Page — Neon Metropolis Design
 * Interactive referral dashboard with:
 *   - Holographic referral code display
 *   - Copy button with neon animation
 *   - Live referral bonus meter
 *   - Referral rules explanation
 *   - Referred users list (simulated)
 */
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Users, Gift, Link2, Shield, Wallet, Zap, ArrowUpRight, Share2 } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import ParticleBackground from "@/components/ParticleBackground";
import { useWallet } from "@/contexts/WalletContext";
import { Link } from "wouter";
import { toast } from "sonner";

// Simulated referral data
const MOCK_REFERRALS = [
  { address: "7xKX...AsU", lpAmount: 12_500, lastClaim: "2h ago", creditGiven: 625 },
  { address: "Bq3F...9mN", lpAmount: 8_200, lastClaim: "5h ago", creditGiven: 410 },
  { address: "Dw8K...2pR", lpAmount: 45_000, lastClaim: "11h ago", creditGiven: 2_250 },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

export default function Referrals() {
  const { connected, address, connect, connecting, userStats } = useWallet();
  const [copied, setCopied] = useState(false);

  const referralLink = address
    ? `https://cybermine.xyz/mine?ref=${address}`
    : "";

  const handleCopy = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, [address, referralLink]);

  const handleShare = useCallback(() => {
    if (!address) return;
    const text = `Join me on CyberMine — Mining for the People, Not the Machines. ⛏️\n\nProvide liquidity, earn $MINE tokens every 12 hours.\n\n${referralLink}`;
    if (navigator.share) {
      navigator.share({ title: "CyberMine", text, url: referralLink });
    } else {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
    }
  }, [address, referralLink]);

  // Simulated bonus meter
  const totalCredit = MOCK_REFERRALS.reduce((sum, r) => sum + r.creditGiven, 0);
  const bonusCap = userStats.baseWeight * 0.2;
  const usableBonus = Math.min(totalCredit, bonusCap || 1);
  const bonusPercent = bonusCap > 0 ? (usableBonus / bonusCap) * 100 : 0;

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
              // REFERRAL NETWORK
            </span>
            <h1 className="font-[Orbitron] text-2xl md:text-3xl font-bold text-white">
              Expand Your Network
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
                  Connect your Solana wallet to access your referral dashboard.
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
                <h2 className="font-[Orbitron] text-xl font-bold text-white mb-3">Join First</h2>
                <p className="text-[oklch(0.55_0.02_265)] font-[Space_Grotesk] mb-8">
                  You need to join the protocol before you can refer others.
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
              {/* Referral Code Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel-magenta rounded-2xl p-6 md:p-8 relative overflow-hidden"
              >
                {/* Holographic shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.65_0.28_12/0.03)] via-[oklch(0.85_0.18_192/0.05)] to-[oklch(0.65_0.28_12/0.03)] animate-pulse" />

                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Link2 size={16} className="text-[#ff0066]" />
                    <span className="font-[Orbitron] text-xs text-[oklch(0.5_0.02_265)] tracking-wider uppercase">
                      YOUR REFERRAL LINK
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 p-4 rounded-xl bg-[oklch(0.08_0.02_265)] border border-[oklch(0.65_0.28_12/0.2)] overflow-hidden">
                      <div className="font-[Fira_Code] text-sm text-[#ff0066] truncate">
                        {referralLink}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopy}
                        className={`px-5 py-4 rounded-xl font-[Orbitron] text-xs font-semibold tracking-wide flex items-center gap-2 transition-all duration-300 ${
                          copied
                            ? "bg-green-500/20 border border-green-500/40 text-green-400"
                            : "bg-[oklch(0.65_0.28_12/0.15)] border border-[oklch(0.65_0.28_12/0.3)] text-[#ff0066] hover:bg-[oklch(0.65_0.28_12/0.25)]"
                        }`}
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? "COPIED" : "COPY"}
                      </button>
                      <button
                        onClick={handleShare}
                        className="px-5 py-4 rounded-xl bg-[oklch(0.85_0.18_192/0.15)] border border-[oklch(0.85_0.18_192/0.3)] text-[#00f0ff] hover:bg-[oklch(0.85_0.18_192/0.25)] transition-colors flex items-center gap-2 font-[Orbitron] text-xs font-semibold tracking-wide"
                      >
                        <Share2 size={16} />
                        SHARE
                      </button>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-[oklch(0.4_0.02_265)] font-[Space_Grotesk]">
                    Share this link with other miners. When they join using your link and claim rewards, you earn 5% of their base weight as referral credit.
                  </p>
                </div>
              </motion.div>

              {/* Stats Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-3 gap-4"
              >
                <div className="glass-panel rounded-xl p-5 text-center">
                  <Users size={20} className="text-[#ff0066] mx-auto mb-2" />
                  <div className="font-[Fira_Code] text-2xl font-bold text-[#ff0066]">
                    {MOCK_REFERRALS.length}
                  </div>
                  <div className="text-[10px] font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider mt-1">
                    REFERRALS
                  </div>
                </div>
                <div className="glass-panel rounded-xl p-5 text-center">
                  <Gift size={20} className="text-[#00f0ff] mx-auto mb-2" />
                  <div className="font-[Fira_Code] text-2xl font-bold text-[#00f0ff]">
                    {formatNumber(totalCredit)}
                  </div>
                  <div className="text-[10px] font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider mt-1">
                    TOTAL CREDIT
                  </div>
                </div>
                <div className="glass-panel rounded-xl p-5 text-center">
                  <Shield size={20} className="text-[#ffd700] mx-auto mb-2" />
                  <div className="font-[Fira_Code] text-2xl font-bold text-[#ffd700]">
                    {formatNumber(usableBonus)}
                  </div>
                  <div className="text-[10px] font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider mt-1">
                    USABLE BONUS
                  </div>
                </div>
              </motion.div>

              {/* Bonus Meter */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-panel rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-[Orbitron] text-sm font-bold text-white tracking-wider flex items-center gap-2">
                    <Gift size={14} className="text-[#ff0066]" />
                    REFERRAL BONUS METER
                  </h3>
                  <span className="font-[Fira_Code] text-sm text-[#ff0066]">
                    {bonusPercent.toFixed(1)}% of cap
                  </span>
                </div>
                <div className="h-4 rounded-full bg-[oklch(0.15_0.02_265)] overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(bonusPercent, 100)}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-[#ff0066] to-[#ff3388]"
                    style={{
                      boxShadow: "0 0 10px oklch(0.65 0.28 12 / 50%)",
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs font-[Fira_Code] text-[oklch(0.45_0.02_265)]">
                  <span>0</span>
                  <span>Cap: {formatNumber(bonusCap)} (20% of base weight)</span>
                </div>
              </motion.div>

              {/* Rules */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="grid md:grid-cols-3 gap-4"
              >
                {[
                  {
                    icon: Link2,
                    title: "Set Once, Forever",
                    desc: "Referral is set during JOIN and is immutable. Your referrer is locked in permanently.",
                    color: "#ff0066",
                  },
                  {
                    icon: Gift,
                    title: "5% Weight Credit",
                    desc: "When your referred user claims, you receive 5% of their base weight as referral credit.",
                    color: "#00f0ff",
                  },
                  {
                    icon: Shield,
                    title: "20% Cap on Bonus",
                    desc: "Your usable referral bonus is capped at 20% of your own base weight per claim.",
                    color: "#ffd700",
                  },
                ].map((rule, i) => (
                  <div key={i} className="glass-panel rounded-xl p-5">
                    <rule.icon size={20} style={{ color: rule.color }} className="mb-3" />
                    <h4 className="font-[Orbitron] text-sm font-bold text-white mb-2 tracking-wide">
                      {rule.title}
                    </h4>
                    <p className="text-xs text-[oklch(0.5_0.02_265)] font-[Space_Grotesk] leading-relaxed">
                      {rule.desc}
                    </p>
                  </div>
                ))}
              </motion.div>

              {/* Referred Users Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-panel rounded-xl p-6"
              >
                <h3 className="font-[Orbitron] text-sm font-bold text-white tracking-wider mb-5 flex items-center gap-2">
                  <Users size={14} className="text-[#ff0066]" />
                  YOUR REFERRALS
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[oklch(0.3_0.04_265/0.2)]">
                        <th className="text-left py-3 text-[10px] font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider">WALLET</th>
                        <th className="text-right py-3 text-[10px] font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider">LP AMOUNT</th>
                        <th className="text-right py-3 text-[10px] font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider">LAST CLAIM</th>
                        <th className="text-right py-3 text-[10px] font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider">CREDIT GIVEN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_REFERRALS.map((ref, i) => (
                        <tr key={i} className="border-b border-[oklch(0.2_0.02_265/0.3)]">
                          <td className="py-3 font-[Fira_Code] text-xs text-[oklch(0.6_0.02_265)]">
                            {ref.address}
                          </td>
                          <td className="py-3 text-right font-[Fira_Code] text-sm text-white">
                            {formatNumber(ref.lpAmount)}
                          </td>
                          <td className="py-3 text-right font-[Fira_Code] text-xs text-[oklch(0.5_0.02_265)]">
                            {ref.lastClaim}
                          </td>
                          <td className="py-3 text-right font-[Fira_Code] text-sm font-semibold text-[#ff0066]">
                            +{formatNumber(ref.creditGiven)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-[10px] text-[oklch(0.4_0.02_265)] font-[Space_Grotesk] text-center">
                  Showing simulated data — connect to mainnet for real referral data
                </p>
              </motion.div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
