/*
 * CyberMine Hero Section — Neon Metropolis Design
 * Full-viewport hero with cyberpunk cityscape, live protocol stats,
 * supply progress bar, and contract address links
 */
import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import { formatUnits, JsonRpcProvider, Contract } from "ethers";
import { ACTIVE_CHAIN, addressUrl } from "@/config/contracts";
import { STAKING_ABI } from "@/config/stakingAbi";
import { ExternalLink, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030263196/SzmZWtoZkXFNHVBrfb4wFY/hero-bg-UXY5vX9WHyaeosKoszJm37.webp";

const TOTAL_SUPPLY = 21_000_000_000; // 21B MINE
const FP = BigInt(10 ** 18);

function AnimatedCounter({ end, duration = 2, prefix = "", suffix = "", decimals = 0 }: { end: number; duration?: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [end, duration]);

  const display = decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString();

  return (
    <span className="font-[Fira_Code] tabular-nums">
      {prefix}{display}{suffix}
    </span>
  );
}

function CopyableAddress({ label, address }: { label: string; address: string }) {
  const [copied, setCopied] = useState(false);
  const short = address.slice(0, 6) + "..." + address.slice(-4);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-[Orbitron] text-[oklch(0.45_0.02_265)] uppercase tracking-wider">{label}:</span>
      <a
        href={addressUrl(address)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-[Fira_Code] text-[#00f0ff] hover:underline"
      >
        {short}
      </a>
      <button onClick={handleCopy} className="text-[oklch(0.4_0.02_265)] hover:text-[#00f0ff] transition-colors">
        {copied ? <CheckCircle2 size={12} className="text-green-400" /> : <Copy size={12} />}
      </button>
      <a
        href={addressUrl(address)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[oklch(0.4_0.02_265)] hover:text-[#00f0ff] transition-colors"
      >
        <ExternalLink size={12} />
      </a>
    </div>
  );
}

export default function HeroSection() {
  // Live protocol stats fetched from RPC (no wallet needed)
  const [remainingSupply, setRemainingSupply] = useState<bigint | null>(null);
  const [totalWeight, setTotalWeight] = useState<bigint | null>(null);
  const [cooldown, setCooldown] = useState<bigint | null>(null);
  const [totalMiners, setTotalMiners] = useState<number | null>(null);

  useEffect(() => {
    async function fetchProtocolStats() {
      try {
        const provider = new JsonRpcProvider(ACTIVE_CHAIN.rpcUrl, ACTIVE_CHAIN.chainId);
        const staking = new Contract(ACTIVE_CHAIN.staking, STAKING_ABI, provider);
        const [supply, weight, cd] = await Promise.all([
          staking.remainingSupply().catch(() => null),
          staking.totalBaseWeightFp().catch(() => null),
          staking.cooldownSeconds().catch(() => null),
        ]);
        if (supply !== null) setRemainingSupply(BigInt(supply));
        if (weight !== null) setTotalWeight(BigInt(weight));
        if (cd !== null) setCooldown(BigInt(cd));
      } catch (err) {
        console.warn("HeroSection: protocol stats fetch failed", err);
      }
    }
    fetchProtocolStats();
    const interval = setInterval(fetchProtocolStats, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Fetch total miners from /api/stats (Cloudflare Pages Function)
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          if (typeof data.totalUsers === "number") setTotalMiners(data.totalUsers);
        }
      } catch {
        // Silently fail — stats are non-critical
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Derived stats
  const supplyMined = useMemo(() => {
    if (remainingSupply === null) return null;
    const remaining = Number(formatUnits(remainingSupply, 18));
    return TOTAL_SUPPLY - remaining;
  }, [remainingSupply]);

  const supplyPct = useMemo(() => {
    if (supplyMined === null) return 0;
    return (supplyMined / TOTAL_SUPPLY) * 100;
  }, [supplyMined]);

  const remainingDisplay = useMemo(() => {
    if (remainingSupply === null) return "...";
    const val = Number(formatUnits(remainingSupply, 18));
    if (val >= 1e9) return (val / 1e9).toFixed(2) + "B";
    if (val >= 1e6) return (val / 1e6).toFixed(1) + "M";
    return val.toLocaleString();
  }, [remainingSupply]);

  const totalWeightDisplay = useMemo(() => {
    if (totalWeight === null) return "...";
    const val = Number(totalWeight) / Number(FP);
    if (val >= 1e6) return (val / 1e6).toFixed(2) + "M";
    if (val >= 1e3) return (val / 1e3).toFixed(1) + "K";
    return val.toFixed(2);
  }, [totalWeight]);

  const cooldownDisplay = useMemo(() => {
    if (cooldown === null) return "...";
    const hours = Number(cooldown) / 3600;
    return hours + "h";
  }, [cooldown]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={HERO_BG}
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050510]/70 via-[#050510]/50 to-[#050510]" />
      </div>

      {/* Hex grid overlay */}
      <div className="absolute inset-0 hex-grid-bg opacity-30" />

      {/* Content */}
      <div className="relative container pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="max-w-4xl">
          {/* Testnet Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-wrap items-center gap-3 mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[oklch(0.85_0.18_192/0.3)] bg-[oklch(0.85_0.18_192/0.08)]">
              <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
              <span className="text-xs font-[Orbitron] text-[#00f0ff] tracking-widest uppercase">
                Built on BNB Chain
              </span>
            </div>
            {ACTIVE_CHAIN.isTestnet && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[oklch(0.8_0.2_90/0.4)] bg-[oklch(0.8_0.2_90/0.1)]">
                <span className="text-[10px] font-[Orbitron] text-[oklch(0.8_0.2_90)] tracking-widest uppercase">
                  Testnet
                </span>
              </div>
            )}
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-[Orbitron] text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6"
          >
            <span className="text-white">Mining for the</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#ff0066]">
              People
            </span>
            <span className="text-white">, Not</span>
            <br />
            <span className="text-white">the Machines</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-[oklch(0.7_0.02_265)] max-w-2xl mb-10 leading-relaxed font-[Space_Grotesk]"
          >
            Provide liquidity. Earn <span className="text-[#00f0ff] font-semibold">$MINE</span> tokens.
            No hardware, no electricity bills. Your commitment is your hashrate.
            The longer you stay, the more you earn.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap gap-4 mb-10"
          >
            <Link
              href="/mine"
              className="group relative px-8 py-4 font-[Orbitron] text-sm font-bold tracking-wider text-[#050510] bg-[#00f0ff] rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_oklch(0.85_0.18_192/0.5)]"
            >
              <span className="relative z-10">START MINING</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#00f0ff] to-[#00d4ff] opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <a
              href="#protocol"
              className="px-8 py-4 font-[Orbitron] text-sm font-bold tracking-wider text-[#00f0ff] border border-[oklch(0.85_0.18_192/0.4)] rounded-lg hover:bg-[oklch(0.85_0.18_192/0.08)] transition-all duration-300"
            >
              LEARN MORE
            </a>
          </motion.div>

          {/* Supply Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="glass-panel rounded-xl p-4 md:p-5 mb-6 border-[oklch(0.85_0.18_192/0.15)]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider uppercase">
                Mining Supply Progress
              </span>
              <span className="text-xs font-[Fira_Code] text-[oklch(0.5_0.02_265)]">
                {supplyPct.toFixed(4)}% mined
              </span>
            </div>
            <div className="h-3 rounded-full bg-[oklch(0.12_0.02_265)] overflow-hidden mb-2">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #00f0ff, #00cc88, #ff0066)",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(supplyPct, 0.5)}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-[Fira_Code]">
              <span className="text-[oklch(0.45_0.02_265)]">
                Remaining: <span className="text-[#00f0ff]">{remainingDisplay}</span> MINE
              </span>
              <span className="text-[oklch(0.45_0.02_265)]">
                Total: <span className="text-[oklch(0.6_0.02_265)]">21B</span> MINE
              </span>
            </div>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5 mb-6"
          >
            <div className="glass-panel rounded-xl p-4 md:p-5 border-[oklch(0.85_0.18_192/0.2)] hover:border-[oklch(0.85_0.18_192/0.4)] transition-all duration-300">
              <div className="text-xs font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider uppercase mb-2">
                Total Network Weight
              </div>
              <div className="text-xl md:text-2xl font-bold text-[#00f0ff] text-glow-cyan">
                {totalWeightDisplay}
              </div>
            </div>
            <div className="glass-panel rounded-xl p-4 md:p-5 border-[oklch(0.65_0.28_12/0.2)] hover:border-[oklch(0.65_0.28_12/0.4)] transition-all duration-300">
              <div className="text-xs font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider uppercase mb-2">
                Total Miners
              </div>
              <div className="text-xl md:text-2xl font-bold text-[#ff0066] text-glow-magenta">
                {totalMiners !== null ? totalMiners.toLocaleString() : "..."}
              </div>
            </div>
            <div className="glass-panel rounded-xl p-4 md:p-5 border-[oklch(0.85_0.18_192/0.2)] hover:border-[oklch(0.85_0.18_192/0.4)] transition-all duration-300 col-span-2 md:col-span-1">
              <div className="text-xs font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider uppercase mb-2">
                Claim Cooldown
              </div>
              <div className="text-xl md:text-2xl font-bold text-[#00f0ff] text-glow-cyan">
                {cooldownDisplay}
              </div>
            </div>
          </motion.div>

          {/* Contract Addresses */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="glass-panel rounded-xl p-4 border-[oklch(0.2_0.02_265/0.5)]"
          >
            <div className="text-[10px] font-[Orbitron] text-[oklch(0.4_0.02_265)] tracking-wider uppercase mb-3">
              Contract Addresses
            </div>
            <div className="flex flex-col gap-1.5">
              <CopyableAddress label="Staking" address={ACTIVE_CHAIN.staking} />
              <CopyableAddress label="$MINE Token" address={ACTIVE_CHAIN.mineToken} />
              <CopyableAddress label="LP Token" address={ACTIVE_CHAIN.lpToken} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050510] to-transparent pointer-events-none" />
    </section>
  );
}
