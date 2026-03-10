/*
 * CyberMine Hero Section — Neon Metropolis Design
 * Full-viewport hero with cyberpunk cityscape, FOMO emission progress bar,
 * live protocol stats (total miners, MINE distributed, network weight),
 * and clear contract address links.
 *
 * Data sources (read-only, no wallet needed):
 *   - remainingSupply() from staking contract
 *   - totalSupply() from MINE token contract
 *   - totalBaseWeightFp() from staking contract
 *   - cooldownSeconds() from staking contract
 *   - Joined events via eventCache → total miners count
 */
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "wouter";
import { formatUnits, JsonRpcProvider, Contract } from "ethers";
import { ACTIVE_CHAIN, addressUrl } from "@/config/contracts";
import { STAKING_ABI } from "@/config/stakingAbi";
import { ERC20_ABI } from "@/config/erc20Abi";
import { fetchJoinedEvents } from "@/lib/eventCache";
import { ExternalLink, Copy, CheckCircle2, Users, Coins, Activity, Timer, Shield } from "lucide-react";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030263196/SzmZWtoZkXFNHVBrfb4wFY/hero-bg-UXY5vX9WHyaeosKoszJm37.webp";
const MINE_ICON = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030263196/SzmZWtoZkXFNHVBrfb4wFY/cybermine-icon-transparent-44WwcLSoNbwT5vFEsrEPF3.webp";

const FP = BigInt(10 ** 18);

function formatLargeNumber(val: number, dp = 2): string {
  if (val < 0) return "0";
  if (val >= 1e9) return (val / 1e9).toFixed(dp) + "B";
  if (val >= 1e6) return (val / 1e6).toFixed(dp) + "M";
  if (val >= 1e3) return (val / 1e3).toFixed(1) + "K";
  return val.toFixed(dp);
}

function formatFullNumber(val: number): string {
  return val.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/* ─── Copyable Address Row ──────────────────────────────────────── */
function CopyableAddress({ label, address }: { label: string; address: string }) {
  const [copied, setCopied] = useState(false);
  const short = address.slice(0, 10) + "..." + address.slice(-8);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-[oklch(0.85_0.18_192/0.06)] transition-colors group border border-transparent hover:border-[oklch(0.85_0.18_192/0.15)]">
      <span className="text-sm font-[Orbitron] text-[oklch(0.6_0.02_265)] uppercase tracking-wider min-w-[100px] font-semibold">
        {label}
      </span>
      <a
        href={addressUrl(address)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-base font-[Fira_Code] text-[#00f0ff] hover:underline tracking-wide"
      >
        {short}
      </a>
      <button
        onClick={handleCopy}
        className="ml-auto p-1.5 rounded-md text-[oklch(0.45_0.02_265)] hover:text-[#00f0ff] hover:bg-[oklch(0.85_0.18_192/0.1)] transition-colors"
        title="Copy address"
      >
        {copied ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} />}
      </button>
      <a
        href={addressUrl(address)}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-md text-[oklch(0.45_0.02_265)] hover:text-[#00f0ff] hover:bg-[oklch(0.85_0.18_192/0.1)] transition-colors"
        title="View on BscScan"
      >
        <ExternalLink size={16} />
      </a>
    </div>
  );
}

/* ─── Animated Counter ──────────────────────────────────────────── */
function AnimatedCounter({ value, formatter }: { value: number; formatter: (v: number) => string }) {
  const motionVal = useMotionValue(0);
  const display = useTransform(motionVal, (v) => formatter(v));
  const [text, setText] = useState(formatter(0));
  const prevRef = useRef(0);

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration: 1.5,
      ease: "easeOut",
    });
    return controls.stop;
  }, [value, motionVal]);

  useEffect(() => {
    const unsub = display.on("change", (v) => setText(v));
    return unsub;
  }, [display]);

  return <span>{text}</span>;
}

/* ─── Main Component ────────────────────────────────────────────── */
export default function HeroSection() {
  // On-chain data
  const [remainingSupply, setRemainingSupply] = useState<bigint | null>(null);
  const [totalSupply, setTotalSupply] = useState<bigint | null>(null);
  const [totalWeight, setTotalWeight] = useState<bigint | null>(null);
  const [cooldown, setCooldown] = useState<bigint | null>(null);
  const [totalMiners, setTotalMiners] = useState<number | null>(null);

  // Fetch protocol stats from RPC (no wallet needed)
  useEffect(() => {
    async function fetchProtocolStats() {
      try {
        const provider = new JsonRpcProvider(ACTIVE_CHAIN.rpcUrl, ACTIVE_CHAIN.chainId);
        const staking = new Contract(ACTIVE_CHAIN.staking, STAKING_ABI, provider);
        const mineToken = new Contract(ACTIVE_CHAIN.mineToken, ERC20_ABI, provider);

        const [supply, ts, weight, cd] = await Promise.all([
          staking.remainingSupply().catch(() => null),
          mineToken.totalSupply().catch(() => null),
          staking.totalBaseWeightFp().catch(() => null),
          staking.cooldownSeconds().catch(() => null),
        ]);
        if (supply !== null) setRemainingSupply(BigInt(supply));
        if (ts !== null) setTotalSupply(BigInt(ts));
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

  // Fetch total miners from Joined events using cached progressive scanning
  useEffect(() => {
    async function fetchMiners() {
      try {
        const events = await fetchJoinedEvents();
        // Deduplicate by user address for accurate unique count
        const uniqueUsers = new Set(events.map((e) => e.user.toLowerCase()));
        setTotalMiners(uniqueUsers.size);
      } catch (err) {
        console.warn("HeroSection: total miners fetch failed", err);
      }
    }
    fetchMiners();
    const interval = setInterval(fetchMiners, 120_000);
    return () => clearInterval(interval);
  }, []);

  // ─── Derived stats ──────────────────────────────────────────────
  const emissionPool = useMemo(() => {
    if (totalSupply === null) return null;
    // 99% of total supply goes to emission
    return (totalSupply * 99n) / 100n;
  }, [totalSupply]);

  const distributed = useMemo(() => {
    if (emissionPool === null || remainingSupply === null) return null;
    const d = emissionPool - remainingSupply;
    return d < 0n ? 0n : d;
  }, [emissionPool, remainingSupply]);

  const distributedNum = useMemo(() => {
    if (distributed === null) return 0;
    return Number(formatUnits(distributed, 18));
  }, [distributed]);

  const emissionPoolNum = useMemo(() => {
    if (emissionPool === null) return 0;
    return Number(formatUnits(emissionPool, 18));
  }, [emissionPool]);

  const remainingNum = useMemo(() => {
    if (remainingSupply === null) return 0;
    return Number(formatUnits(remainingSupply, 18));
  }, [remainingSupply]);

  const supplyPct = useMemo(() => {
    if (emissionPoolNum <= 0 || distributedNum <= 0) return 0;
    return (distributedNum / emissionPoolNum) * 100;
  }, [distributedNum, emissionPoolNum]);

  const totalWeightDisplay = useMemo(() => {
    if (totalWeight === null) return "...";
    const val = Number(totalWeight) / Number(FP);
    return formatLargeNumber(val);
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
        <img src={HERO_BG} alt="" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050510]/70 via-[#050510]/50 to-[#050510]" />
      </div>

      {/* Hex grid overlay */}
      <div className="absolute inset-0 hex-grid-bg opacity-30" />

      {/* Content */}
      <div className="relative container pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="max-w-4xl">
          {/* Badges */}
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

          {/* ═══ EMISSION PROGRESS BAR ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="glass-panel rounded-xl p-5 md:p-6 mb-6 border-[oklch(0.85_0.18_192/0.15)]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-[Orbitron] text-white tracking-wider uppercase font-bold flex items-center gap-2">
                <Activity size={16} className="text-[#00f0ff]" />
                EMISSION PROGRESS
              </span>
              <span className="text-sm font-[Fira_Code] text-[#00f0ff] font-bold">
                {distributed !== null ? (
                  <AnimatedCounter value={supplyPct} formatter={(v) => v.toFixed(4) + "% mined"} />
                ) : (
                  "..."
                )}
              </span>
            </div>

            {/* Progress bar */}
            <div className="relative h-5 rounded-full bg-[oklch(0.1_0.02_265)] overflow-hidden mb-3 border border-[oklch(0.2_0.02_265/0.3)]">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: "linear-gradient(90deg, #00f0ff, #00cc88, #ff0066)",
                  boxShadow: "0 0 20px rgba(0,240,255,0.3), 0 0 40px rgba(0,204,136,0.15)",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(supplyPct, 0.3)}%` }}
                transition={{ duration: 2, ease: "easeOut" }}
              />
              {/* Pulse glow at the edge */}
              <motion.div
                className="absolute top-0 bottom-0 w-2 rounded-full bg-white/40"
                style={{ left: `${Math.max(supplyPct, 0.3)}%` }}
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-[Fira_Code]">
              <span className="text-[oklch(0.55_0.02_265)]">
                Remaining:{" "}
                <span className="text-[#00f0ff] font-bold" title={remainingSupply !== null ? formatFullNumber(remainingNum) : ""}>
                  {remainingSupply !== null ? formatLargeNumber(remainingNum) : "..."}
                </span>{" "}
                MINE
              </span>
              <span className="text-[oklch(0.55_0.02_265)]">
                Emission Pool:{" "}
                <span className="text-[oklch(0.7_0.02_265)] font-bold" title={emissionPool !== null ? formatFullNumber(emissionPoolNum) : ""}>
                  {emissionPool !== null ? formatLargeNumber(emissionPoolNum) : "..."}
                </span>{" "}
                MINE (99%)
              </span>
            </div>
          </motion.div>

          {/* ═══ STATS ROW ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mb-6"
          >
            {/* Total Miners */}
            <div className="glass-panel rounded-xl p-4 md:p-5 border-[oklch(0.85_0.18_192/0.2)] hover:border-[oklch(0.85_0.18_192/0.4)] transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Users size={14} className="text-[#ff0066]" />
                <span className="text-[10px] font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider uppercase">
                  Total Miners
                </span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-[#ff0066] text-glow-magenta">
                {totalMiners !== null ? totalMiners.toLocaleString() : "..."}
              </div>
            </div>

            {/* $MINE Distributed */}
            <div className="glass-panel rounded-xl p-4 md:p-5 border-[oklch(0.85_0.18_192/0.2)] hover:border-[oklch(0.85_0.18_192/0.4)] transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Coins size={14} className="text-[#00f0ff]" />
                <span className="text-[10px] font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider uppercase">
                  $MINE Distributed
                </span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-[#00f0ff] text-glow-cyan" title={distributed !== null ? formatFullNumber(distributedNum) : ""}>
                {distributed !== null ? (
                  <AnimatedCounter value={distributedNum} formatter={(v) => formatLargeNumber(v)} />
                ) : (
                  "..."
                )}
              </div>
            </div>

            {/* Network Weight */}
            <div className="glass-panel rounded-xl p-4 md:p-5 border-[oklch(0.85_0.18_192/0.2)] hover:border-[oklch(0.85_0.18_192/0.4)] transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={14} className="text-[#00f0ff]" />
                <span className="text-[10px] font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider uppercase">
                  Network Weight
                </span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-[#00f0ff] text-glow-cyan">
                {totalWeightDisplay}
              </div>
            </div>

            {/* Claim Cooldown */}
            <div className="glass-panel rounded-xl p-4 md:p-5 border-[oklch(0.85_0.18_192/0.2)] hover:border-[oklch(0.85_0.18_192/0.4)] transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Timer size={14} className="text-[oklch(0.8_0.2_90)]" />
                <span className="text-[10px] font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider uppercase">
                  Claim Cooldown
                </span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-[oklch(0.8_0.2_90)]">
                {cooldownDisplay}
              </div>
            </div>
          </motion.div>

          {/* ═══ CONTRACT ADDRESSES ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="glass-panel rounded-xl p-5 md:p-6 border-[oklch(0.85_0.18_192/0.2)]"
          >
            <div className="flex items-center gap-3 mb-2">
              <Shield size={18} className="text-[#00f0ff]" />
              <span className="text-base font-[Orbitron] text-white tracking-wider uppercase font-bold">
                Contract Addresses
              </span>
            </div>
            <p className="text-xs font-[Space_Grotesk] text-[oklch(0.5_0.02_265)] mb-4">
              Verified contracts on {ACTIVE_CHAIN.isTestnet ? "BSC Testnet" : "BSC Mainnet"}
            </p>
            <div className="flex flex-col gap-1">
              <CopyableAddress label="STAKING" address={ACTIVE_CHAIN.staking} />
              <CopyableAddress label="$MINE TOKEN" address={ACTIVE_CHAIN.mineToken} />
              <CopyableAddress label="LP PAIR" address={ACTIVE_CHAIN.lpToken} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050510] to-transparent pointer-events-none" />
    </section>
  );
}
