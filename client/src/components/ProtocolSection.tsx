/*
 * CyberMine Protocol Section — Neon Metropolis Design
 * Explains the core protocol with holographic glass cards and the mining terminal image
 */
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Zap, Shield, Clock, TrendingUp } from "lucide-react";

const TERMINAL_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030263196/SzmZWtoZkXFNHVBrfb4wFY/mining-terminal-nGjJJ7FDyAWhCfVmHc2X9j.webp";

const features = [
  {
    icon: Zap,
    title: "Liquidity Mining",
    description: "Deposit Raydium LP tokens and earn $MINE rewards every 12 hours. No hardware needed — your liquidity is your mining rig.",
    color: "cyan",
  },
  {
    icon: TrendingUp,
    title: "Decreasing Supply",
    description: "Every claim reduces the remaining emission pool. Early participants capture a larger share. The scarcity creates natural FOMO.",
    color: "magenta",
  },
  {
    icon: Clock,
    title: "Time-Weighted Rewards",
    description: "The longer you provide liquidity, the higher your tier multiplier grows — from 1.0x to 2.1x over 365 days.",
    color: "cyan",
  },
  {
    icon: Shield,
    title: "Security First",
    description: "O(1) operations, deterministic accounting, no iteration over users. Anchor smart contract with full test coverage.",
    color: "magenta",
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`group glass-panel rounded-xl p-6 md:p-8 transition-all duration-500 hover:translate-y-[-4px] ${
        feature.color === "cyan"
          ? "hover:border-[oklch(0.85_0.18_192/0.4)] hover:shadow-[0_0_30px_oklch(0.85_0.18_192/0.1)]"
          : "hover:border-[oklch(0.65_0.28_12/0.4)] hover:shadow-[0_0_30px_oklch(0.65_0.28_12/0.1)]"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center mb-5 ${
          feature.color === "cyan"
            ? "bg-[oklch(0.85_0.18_192/0.1)] text-[#00f0ff]"
            : "bg-[oklch(0.65_0.28_12/0.1)] text-[#ff0066]"
        }`}
      >
        <feature.icon size={24} />
      </div>
      <h3 className="font-[Orbitron] text-lg font-bold text-white mb-3 tracking-wide">
        {feature.title}
      </h3>
      <p className="text-sm text-[oklch(0.6_0.02_265)] leading-relaxed font-[Space_Grotesk]">
        {feature.description}
      </p>
    </motion.div>
  );
}

export default function ProtocolSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section id="protocol" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hex-grid-bg opacity-20" />

      <div className="relative container">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center mb-20">
          <div className="flex-1">
            <motion.div
              ref={sectionRef}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block font-[Orbitron] text-xs text-[#ff0066] tracking-[0.3em] uppercase mb-4">
                // THE PROTOCOL
              </span>
              <h2 className="font-[Orbitron] text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                A New Kind of{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#ff0066]">
                  Digital Mining
                </span>
              </h2>
              <p className="text-[oklch(0.6_0.02_265)] text-lg leading-relaxed font-[Space_Grotesk] max-w-xl">
                CyberMine reclaims the power of the network for the people. No GPUs, no ASICs, no
                electricity bills. Provide liquidity to the Raydium pool, and the protocol rewards
                your commitment with freshly minted $MINE tokens from a finite, decreasing supply.
              </p>
            </motion.div>
          </div>

          {/* Terminal Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 max-w-lg"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[oklch(0.85_0.18_192/0.2)] to-[oklch(0.65_0.28_12/0.2)] rounded-2xl blur-xl" />
              <img
                src={TERMINAL_IMG}
                alt="CyberMine Mining Terminal"
                className="relative rounded-xl w-full"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
