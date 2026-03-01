/*
 * CyberMine Hero Section — Neon Metropolis Design
 * Full-viewport hero with cyberpunk cityscape, animated counters, and glowing CTA
 */
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "wouter";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030263196/SzmZWtoZkXFNHVBrfb4wFY/hero-bg-UXY5vX9WHyaeosKoszJm37.webp";

function AnimatedCounter({ end, duration = 2, prefix = "", suffix = "" }: { end: number; duration?: number; prefix?: string; suffix?: string }) {
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
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [end, duration]);

  return (
    <span className="font-[Fira_Code] tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

export default function HeroSection() {
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
          {/* Tag */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-[oklch(0.85_0.18_192/0.3)] bg-[oklch(0.85_0.18_192/0.08)]"
          >
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
            <span className="text-xs font-[Orbitron] text-[#00f0ff] tracking-widest uppercase">
              Built on Solana
            </span>
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
            className="flex flex-wrap gap-4 mb-16"
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

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
          >
            {[
              { label: "Total Supply", value: <><AnimatedCounter end={21} suffix="" />B</>, color: "cyan" },
              { label: "Emission Pool", value: "99%", color: "magenta" },
              { label: "Claim Cooldown", value: "12h", color: "cyan" },
              { label: "Join Fee", value: "0.0009 SOL", color: "magenta" },
            ].map((stat, i) => (
              <div
                key={i}
                className={`glass-panel rounded-xl p-4 md:p-5 ${
                  stat.color === "cyan"
                    ? "border-[oklch(0.85_0.18_192/0.2)] hover:border-[oklch(0.85_0.18_192/0.4)]"
                    : "border-[oklch(0.65_0.28_12/0.2)] hover:border-[oklch(0.65_0.28_12/0.4)]"
                } transition-all duration-300`}
              >
                <div className="text-xs font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider uppercase mb-2">
                  {stat.label}
                </div>
                <div
                  className={`text-xl md:text-2xl font-bold ${
                    stat.color === "cyan" ? "text-[#00f0ff] text-glow-cyan" : "text-[#ff0066] text-glow-magenta"
                  }`}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050510] to-transparent pointer-events-none" />
    </section>
  );
}
