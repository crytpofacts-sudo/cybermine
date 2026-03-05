/*
 * CyberMine Profile Page — Neon Metropolis Design
 * BNB Chain integration — reads real on-chain data:
 *   - Wallet address & connection status
 *   - Active LP / Pending LP
 *   - $MINE balance
 *   - Referral info
 *   - Wrong-chain enforcement
 */
import { motion } from "framer-motion";
import { Wallet, TrendingUp, Clock, Zap, Shield, Award, ArrowUpRight, AlertTriangle, ExternalLink } from "lucide-react";
import { formatUnits } from "ethers";
import AppNavbar from "@/components/AppNavbar";
import ParticleBackground from "@/components/ParticleBackground";
import { useWallet } from "@/contexts/WalletContext";
import { ACTIVE_CHAIN, addressUrl } from "@/config/contracts";
import { shortenAddress } from "@/lib/referral";
import { Link } from "wouter";

function formatBigNum(val: bigint, decimals: number, dp = 4): string {
  const str = formatUnits(val, decimals);
  const num = parseFloat(str);
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toFixed(dp);
}

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

export default function Profile() {
  const {
    connected, address, connect, connecting, wrongChain, switchChain,
    userData, protocolData, lpBalance, mineBalance, lpDecimals, mineDecimals,
    loading, initialLoading,
  } = useWallet();

  const joined = userData?.joined ?? false;

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
                  Connect your MetaMask wallet to view your miner profile.
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
          ) : wrongChain ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto"
            >
              <div className="glass-panel rounded-2xl p-8 md:p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[oklch(0.85_0.18_80/0.1)] border border-[oklch(0.85_0.18_80/0.2)] flex items-center justify-center">
                  <AlertTriangle size={32} className="text-[#ffd700]" />
                </div>
                <h2 className="font-[Orbitron] text-xl font-bold text-white mb-3">Wrong Network</h2>
                <p className="text-[oklch(0.55_0.02_265)] font-[Space_Grotesk] mb-8">
                  Switch to <span className="text-[#00f0ff] font-[Fira_Code]">{ACTIVE_CHAIN.name}</span> to view your profile.
                </p>
                <button
                  onClick={switchChain}
                  className="px-8 py-4 text-base font-[Orbitron] font-bold text-[#050510] bg-[#ffd700] rounded-xl hover:shadow-[0_0_30px_oklch(0.85_0.18_80/0.5)] transition-all duration-300 tracking-wide"
                >
                  SWITCH NETWORK
                </button>
              </div>
            </motion.div>
          ) : initialLoading ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto"
            >
              <div className="glass-panel rounded-2xl p-8 md:p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[oklch(0.85_0.18_192/0.1)] border border-[oklch(0.85_0.18_192/0.2)] flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
                </div>
                <h2 className="font-[Orbitron] text-xl font-bold text-white mb-3">Loading Profile</h2>
                <p className="text-[oklch(0.55_0.02_265)] font-[Space_Grotesk]">
                  Fetching your on-chain data...
                </p>
              </div>
            </motion.div>
          ) : !joined ? (
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
                      <a
                        href={addressUrl(address || "")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-[Fira_Code] text-sm text-[#00f0ff] mb-1 hover:underline flex items-center gap-1"
                      >
                        {shortenAddress(address || "", 6)} <ExternalLink size={10} />
                      </a>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">
                          Connected to {ACTIVE_CHAIN.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  {loading && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Syncing...</span>
                    </div>
                  )}
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
                  { label: "ACTIVE LP", value: formatBigNum(userData?.activeLp ?? 0n, lpDecimals), color: "#00f0ff", icon: Zap },
                  { label: "PENDING LP", value: formatBigNum(userData?.pendingLp ?? 0n, lpDecimals), color: "#ff0066", icon: Clock },
                  { label: "$MINE BALANCE", value: formatBigNum(mineBalance, mineDecimals, 2), color: "#ffd700", icon: Award },
                  { label: "WALLET LP", value: formatBigNum(lpBalance, lpDecimals), color: "#00f0ff", icon: Shield },
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

              {/* Detailed Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-panel rounded-xl p-6"
              >
                <h3 className="font-[Orbitron] text-sm font-bold text-white tracking-wider mb-5 flex items-center gap-2">
                  <TrendingUp size={14} className="text-[#00f0ff]" />
                  ON-CHAIN STATUS
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Referrer</span>
                    <span className="font-[Fira_Code] text-sm text-white">
                      {userData?.referrer && userData.referrer !== ZERO_ADDR ? (
                        <a
                          href={addressUrl(userData.referrer)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#ff0066] hover:underline flex items-center gap-1"
                        >
                          {shortenAddress(userData.referrer)} <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="text-[oklch(0.4_0.02_265)]">None</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Referral Count</span>
                    <span className="font-[Fira_Code] text-sm font-bold text-[#00f0ff]">
                      {String(userData?.referralCount ?? 0n)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Referral Weight Credit</span>
                    <span className="font-[Fira_Code] text-sm font-bold text-[#ff0066]">
                      {formatBigNum(userData?.referralWeightCreditFp ?? 0n, lpDecimals, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Protocol Paused</span>
                    <span className={`font-[Fira_Code] text-sm font-bold ${protocolData?.paused ? "text-[#ff0066]" : "text-green-400"}`}>
                      {protocolData?.paused ? "YES" : "NO"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Cooldown Period</span>
                    <span className="font-[Fira_Code] text-sm text-white">
                      {protocolData?.cooldownSeconds ? `${Number(protocolData.cooldownSeconds) / 60} min` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">Protocol Fee</span>
                    <span className="font-[Fira_Code] text-sm text-white">
                      {protocolData?.feeWei && protocolData.feeWei > 0n
                        ? `${formatUnits(protocolData.feeWei, 18)} BNB`
                        : "Free"}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-[oklch(0.3_0.04_265/0.2)] flex justify-between items-center">
                    <span className="text-xs font-[Orbitron] text-[oklch(0.6_0.02_265)] tracking-wider">TOTAL BASE WEIGHT</span>
                    <span className="font-[Fira_Code] text-lg font-bold text-[#00f0ff]">
                      {formatBigNum(protocolData?.totalBaseWeight ?? 0n, lpDecimals, 2)}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Contract links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-panel rounded-xl p-6"
              >
                <h3 className="font-[Orbitron] text-sm font-bold text-white tracking-wider mb-5 flex items-center gap-2">
                  <Shield size={14} className="text-[#ff0066]" />
                  CONTRACTS
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Staking Contract", addr: ACTIVE_CHAIN.staking },
                    { label: "$MINE Token", addr: ACTIVE_CHAIN.mineToken },
                    { label: "LP Token (MINE/BNB)", addr: ACTIVE_CHAIN.lpToken },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center">
                      <span className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)]">{item.label}</span>
                      <a
                        href={addressUrl(item.addr)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-[Fira_Code] text-xs text-[#00f0ff] hover:underline flex items-center gap-1"
                      >
                        {shortenAddress(item.addr, 6)} <ExternalLink size={10} />
                      </a>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
