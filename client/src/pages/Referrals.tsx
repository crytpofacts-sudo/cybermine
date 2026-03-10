/*
 * CyberMine Referrals Page — Neon Metropolis Design
 * Shows referral link, social sharing buttons, referral stats,
 * referred members list, and a colorful bonus meter.
 * Referral weight credit is capped at 20% of the referrer's base weight.
 */
import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Wallet, Users, Copy, Check, ExternalLink, AlertTriangle, Loader2,
  ArrowUpRight, TrendingUp, Gift, Link2,
} from "lucide-react";
import { formatUnits, JsonRpcProvider, Contract } from "ethers";
import { fetchReferredMembers as fetchReferredMembersCached } from "@/lib/eventCache";
import { Link } from "wouter";
import AppNavbar from "@/components/AppNavbar";
import ParticleBackground from "@/components/ParticleBackground";
import SocialShareButtons from "@/components/SocialShareButtons";
import WeightBreakdown from "@/components/WeightBreakdown";
import { useWallet } from "@/contexts/WalletContext";
import { ACTIVE_CHAIN, addressUrl } from "@/config/contracts";
import { shortenAddress } from "@/lib/referral";
import { getTierInfo, getWeightBreakdown } from "@/lib/tiers";
import { STAKING_ABI } from "@/config/stakingAbi";
import { toast } from "sonner";

function formatBigNum(val: bigint, decimals: number, dp = 4): string {
  const str = formatUnits(val, decimals);
  const num = parseFloat(str);
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toFixed(dp);
}

interface ReferredMember {
  address: string;
  blockNumber?: number;
  txHash?: string;
  activeLp?: bigint;
  activeDepositTs?: bigint;
  weight?: number; // computed real-time weight
}

const FP = BigInt(10 ** 18);

export default function Referrals() {
  const {
    connected, connecting, connect, address, wrongChain, switchChain,
    userData, protocolData, lpDecimals, initialLoading,
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [referredMembers, setReferredMembers] = useState<ReferredMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const joined = userData?.joined ?? false;
  const referralCount = userData?.referralCount ?? 0;

  const referralLink = useMemo(() => {
    if (!address) return "";
    return `${window.location.origin}/?ref=${address}`;
  }, [address]);

  const handleCopy = useCallback(async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy");
    }
  }, [referralLink]);

  // Tier info for weight calculations
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

  // Referral bonus meter: credit used vs max (20% of base weight)
  const bonusMeter = useMemo(() => {
    if (!userData) return { used: 0, max: 0, pct: 0 };
    const baseW = Number(userData.cachedBaseWeightFp) / Number(FP);
    const maxCredit = baseW * 0.20; // 20% cap
    const usedCredit = Number(userData.referralWeightCreditFp) / Number(FP);
    const pct = maxCredit > 0 ? Math.min((usedCredit / maxCredit) * 100, 100) : 0;
    return { used: usedCredit, max: maxCredit, pct };
  }, [userData]);

  // Fetch referred members using progressive event scanning (eventCache)
  // with fallback to /api/referrals endpoint
  useEffect(() => {
    if (!address || !joined) {
      setReferredMembers([]);
      return;
    }

    let cancelled = false;
    const fetchMembers = async () => {
      setLoadingMembers(true);
      try {
        let refereeAddresses: string[] = [];

        // Primary: progressive event scanning via eventCache (up to 2M blocks, cached)
        try {
          const events = await fetchReferredMembersCached(address);
          refereeAddresses = events.map((e) => e.user);
        } catch (err) {
          console.warn("eventCache fetch failed, trying API:", err);
        }

        // Fallback: try the API
        if (refereeAddresses.length === 0) {
          try {
            const res = await fetch(`/api/referrals?referrer=${address}&pageSize=100`);
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data.referees) && data.referees.length > 0) {
                refereeAddresses = data.referees;
              }
            }
          } catch {
            // API unavailable
          }
        }

        if (cancelled || refereeAddresses.length === 0) {
          if (!cancelled) setReferredMembers([]);
          return;
        }

        // Deduplicate addresses
        refereeAddresses = [...new Set(refereeAddresses.map(a => a.toLowerCase()))];

        // Fetch real-time weight for each referee via getUser
        const provider = new JsonRpcProvider(ACTIVE_CHAIN.rpcUrl);
        const staking = new Contract(ACTIVE_CHAIN.staking, STAKING_ABI, provider);

        const members: ReferredMember[] = await Promise.all(
          refereeAddresses.map(async (addr) => {
            try {
              const u = await staking.getUser(addr);
              const activeLp = BigInt(u.activeLp);
              const activeDepositTs = BigInt(u.activeDepositTs);
              const cachedBaseWeightFp = BigInt(u.cachedBaseWeightFp);
              // Compute real-time weight using tier multiplier
              const tier = getTierInfo(activeDepositTs);
              const baseW = Number(cachedBaseWeightFp) / Number(FP);
              const weight = baseW * tier.multiplier;
              return { address: addr, activeLp, activeDepositTs, weight };
            } catch {
              return { address: addr, weight: 0 };
            }
          })
        );

        if (!cancelled) setReferredMembers(members);
      } catch (err) {
        console.warn("Failed to fetch referred members:", err);
        if (!cancelled) setReferredMembers([]);
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    };
    fetchMembers();
    return () => { cancelled = true; };
  }, [address, joined]);

  return (
    <div className="min-h-screen bg-[#050510] text-white scan-line">
      <ParticleBackground />
      <AppNavbar />

      <main className="relative z-10 pt-24 md:pt-28 pb-16">
        <div className="container max-w-4xl">
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
              // REFERRAL NETWORK
            </span>
            <h1 className="font-[Orbitron] text-2xl md:text-3xl font-bold text-white">
              Grow Your Network
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
                  Connect your wallet to access your referral dashboard.
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
                  Switch to {ACTIVE_CHAIN.name} to view your referrals.
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
                <p className="font-[Orbitron] text-sm text-[oklch(0.5_0.02_265)]">Loading referral data...</p>
              </div>
            </motion.div>
          ) : !joined ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto"
            >
              <div className="glass-panel rounded-2xl p-8 md:p-12 text-center">
                <Users size={32} className="text-[oklch(0.4_0.02_265)] mx-auto mb-4" />
                <h2 className="font-[Orbitron] text-lg font-bold text-white mb-2">Not Yet Joined</h2>
                <p className="text-sm text-[oklch(0.5_0.02_265)] font-[Space_Grotesk] mb-6">
                  Join CyberMine first to unlock your referral link and start earning referral bonuses.
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
              {/* Referral Link Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-2xl p-6"
              >
                <h3 className="font-[Orbitron] text-sm font-bold text-white tracking-wider mb-4 flex items-center gap-2">
                  <Link2 size={14} className="text-[#ff0066]" />
                  YOUR REFERRAL LINK
                </h3>
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 px-4 py-3 rounded-lg bg-[oklch(0.1_0.02_265)] border border-[oklch(0.3_0.04_265/0.3)] font-[Fira_Code] text-xs text-[#00f0ff] overflow-x-auto whitespace-nowrap">
                    {referralLink}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="px-4 py-3 rounded-lg border border-[oklch(0.85_0.18_192/0.3)] text-[#00f0ff] hover:bg-[oklch(0.85_0.18_192/0.08)] transition-colors flex items-center gap-1.5"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    <span className="text-xs font-[Orbitron] hidden sm:inline">
                      {copied ? "COPIED" : "COPY"}
                    </span>
                  </button>
                </div>

                <p className="text-xs text-[oklch(0.5_0.02_265)] font-[Space_Grotesk] mb-4">
                  When someone joins CyberMine through your link, both of you earn a weight bonus.
                  Your referral weight credit is capped at 20% of your base weight.
                </p>

                {/* Social Share Buttons */}
                <SocialShareButtons address={address || ""} />
              </motion.div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="glass-panel rounded-xl p-4"
                >
                  <Users size={14} className="text-[#ff0066] mb-2" />
                  <div className="text-[10px] font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider uppercase mb-1">
                    Referrals
                  </div>
                  <div className="font-[Fira_Code] text-2xl font-bold text-[#ff0066]">
                    {referralCount}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-panel rounded-xl p-4"
                >
                  <TrendingUp size={14} className="text-[#00f0ff] mb-2" />
                  <div className="text-[10px] font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider uppercase mb-1">
                    Ref Weight Credit
                  </div>
                  <div className="font-[Fira_Code] text-2xl font-bold text-[#00f0ff]">
                    {formatBigNum(userData?.referralWeightCreditFp ?? 0n, 18, 2)}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="glass-panel rounded-xl p-4 col-span-2 md:col-span-1"
                >
                  <Gift size={14} className="text-[#ffd700] mb-2" />
                  <div className="text-[10px] font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider uppercase mb-1">
                    Referrer
                  </div>
                  <div className="font-[Fira_Code] text-sm font-bold text-white">
                    {userData?.referrer && userData.referrer !== "0x0000000000000000000000000000000000000000" ? (
                      <a
                        href={addressUrl(userData.referrer)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#ffd700] hover:underline flex items-center gap-1"
                      >
                        {shortenAddress(userData.referrer)} <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className="text-[oklch(0.4_0.02_265)]">None</span>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Bonus Meter */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-panel rounded-xl p-5"
              >
                <h3 className="font-[Orbitron] text-sm font-bold text-white tracking-wider mb-3 flex items-center gap-2">
                  <TrendingUp size={14} className="text-[#00cc88]" />
                  REFERRAL BONUS METER
                </h3>
                <p className="text-xs text-[oklch(0.5_0.02_265)] font-[Space_Grotesk] mb-4">
                  Your referral weight credit is capped at 20% of your base weight ({weightBreak.baseWeight.toFixed(2)}).
                  Invite more miners to fill the meter!
                </p>

                {/* Colorful gradient bar */}
                <div className="relative h-6 rounded-full overflow-hidden" style={{ background: "oklch(0.12 0.02 265)" }}>
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.max(bonusMeter.pct, 1)}%`,
                      background: bonusMeter.pct >= 100
                        ? "linear-gradient(90deg, #00f0ff, #00cc88, #ffd700)"
                        : bonusMeter.pct >= 50
                        ? "linear-gradient(90deg, #00f0ff, #00cc88)"
                        : "linear-gradient(90deg, #00f0ff, #00f0ff88)",
                      boxShadow: bonusMeter.pct >= 100
                        ? "0 0 20px rgba(255,215,0,0.4)"
                        : "0 0 10px rgba(0,240,255,0.3)",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-[Fira_Code] text-xs font-bold text-white drop-shadow-lg">
                      {bonusMeter.pct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between mt-2 text-[10px] font-[Fira_Code]">
                  <span className="text-[oklch(0.5_0.02_265)]">
                    Used: <span className="text-[#00f0ff]">{bonusMeter.used.toFixed(2)}</span>
                  </span>
                  <span className="text-[oklch(0.5_0.02_265)]">
                    Cap: <span className="text-[#ffd700]">{bonusMeter.max.toFixed(2)}</span>
                  </span>
                </div>

                {bonusMeter.pct >= 100 && (
                  <div className="mt-3 p-2 rounded-lg bg-[oklch(0.85_0.18_80/0.08)] border border-[oklch(0.85_0.18_80/0.2)] text-center">
                    <span className="text-[10px] font-[Orbitron] text-[#ffd700]">
                      Bonus cap reached! Stake more LP to increase your cap.
                    </span>
                  </div>
                )}
              </motion.div>

              {/* Weight Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="glass-panel rounded-xl p-5"
              >
                <h3 className="font-[Orbitron] text-sm font-bold text-white tracking-wider mb-3">
                  WEIGHT CONTRIBUTION
                </h3>
                <WeightBreakdown
                  rawWeight={weightBreak.rawWeight}
                  multiplierBonus={weightBreak.multiplierBonus}
                  refCredit={weightBreak.refCredit}
                  totalWeight={weightBreak.totalWeight}
                />
              </motion.div>

              {/* Referred Members List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-panel rounded-xl p-5"
              >
                <h3 className="font-[Orbitron] text-sm font-bold text-white tracking-wider mb-4 flex items-center gap-2">
                  <Users size={14} className="text-[#ff0066]" />
                  REFERRED MINERS ({referralCount})
                </h3>

                {loadingMembers ? (
                  <div className="text-center py-6">
                    <Loader2 size={24} className="mx-auto mb-2 text-[#00f0ff] animate-spin" />
                    <p className="text-xs text-[oklch(0.4_0.02_265)] font-[Fira_Code]">Scanning blockchain events...</p>
                  </div>
                ) : referredMembers.length === 0 ? (
                  <div className="text-center py-6">
                    <Users size={24} className="mx-auto mb-2 text-[oklch(0.3_0.02_265)]" />
                    <p className="text-xs text-[oklch(0.4_0.02_265)] font-[Fira_Code]">
                      {referralCount > 0
                        ? "Referred members found on-chain but events not in recent block range."
                        : "No referred miners yet. Share your link to get started!"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {referredMembers.map((m, i) => (
                      <motion.div
                        key={m.address}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-[oklch(0.1_0.02_265)] border border-[oklch(0.2_0.02_265/0.3)]"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-[Orbitron] font-bold"
                            style={{
                              background: `hsl(${(i * 60) % 360}, 70%, 15%)`,
                              border: `1px solid hsl(${(i * 60) % 360}, 70%, 30%)`,
                              color: `hsl(${(i * 60) % 360}, 70%, 60%)`,
                            }}
                          >
                            #{i + 1}
                          </div>
                          <div>
                            <a
                              href={addressUrl(m.address)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-[Fira_Code] text-xs text-[#00f0ff] hover:underline"
                            >
                              {shortenAddress(m.address, 6)}
                            </a>
                            {m.activeLp !== undefined && (
                              <div className="text-[10px] font-[Fira_Code] text-[oklch(0.4_0.02_265)]">
                                {formatBigNum(m.activeLp, lpDecimals, 2)} LP staked
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {m.weight !== undefined && m.weight > 0 && (
                            <div className="text-right">
                              <div className="text-xs font-[Fira_Code] text-[#00f0ff]">
                                {m.weight >= 1000 ? (m.weight / 1000).toFixed(1) + "K" : m.weight.toFixed(2)}
                              </div>
                              <div className="text-[9px] font-[Orbitron] text-[oklch(0.4_0.02_265)] tracking-wider">WEIGHT</div>
                            </div>
                          )}
                          <a
                            href={addressUrl(m.address)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[oklch(0.4_0.02_265)] hover:text-[#00f0ff] transition-colors"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* How Referrals Work */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="glass-panel rounded-xl p-5"
              >
                <h3 className="font-[Orbitron] text-sm font-bold text-white tracking-wider mb-4">
                  HOW REFERRALS WORK
                </h3>
                <div className="space-y-3 text-xs font-[Space_Grotesk] text-[oklch(0.55_0.02_265)]">
                  <div className="flex gap-3">
                    <span className="text-[#00f0ff] font-[Orbitron] font-bold flex-shrink-0">01</span>
                    <p>Share your referral link with friends. When they join CyberMine using your link, you both get a weight bonus.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[#ff0066] font-[Orbitron] font-bold flex-shrink-0">02</span>
                    <p>The referral weight credit is added to your mining weight, increasing your share of $MINE rewards.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[#ffd700] font-[Orbitron] font-bold flex-shrink-0">03</span>
                    <p>Your referral bonus is capped at 20% of your base weight. Stake more LP to increase the cap.</p>
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
