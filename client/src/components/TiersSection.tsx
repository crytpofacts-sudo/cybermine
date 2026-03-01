/*
 * CyberMine Tiers Section — Neon Metropolis Design
 * Visual tier ladder showing time-based multiplier progression
 */
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const tiers = [
  { range: "0 – 7 days", multiplier: "1.00×", label: "Initiate", barWidth: "48%", color: "#00f0ff", opacity: 0.4 },
  { range: "7 – 30 days", multiplier: "1.15×", label: "Operative", barWidth: "55%", color: "#00f0ff", opacity: 0.55 },
  { range: "30 – 90 days", multiplier: "1.35×", label: "Specialist", barWidth: "64%", color: "#00f0ff", opacity: 0.7 },
  { range: "90 – 180 days", multiplier: "1.60×", label: "Commander", barWidth: "76%", color: "#ff0066", opacity: 0.8 },
  { range: "180 – 365 days", multiplier: "1.90×", label: "Elite", barWidth: "90%", color: "#ff0066", opacity: 0.9 },
  { range: "365+ days", multiplier: "2.10×", label: "Legend", barWidth: "100%", color: "#ffd700", opacity: 1 },
];

export default function TiersSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="tiers" className="relative py-24 md:py-32 overflow-hidden">
      {/* Diagonal accent */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: "linear-gradient(135deg, #00f0ff 0%, transparent 50%, #ff0066 100%)",
        }}
      />

      <div className="relative container" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block font-[Orbitron] text-xs text-[#ff0066] tracking-[0.3em] uppercase mb-4">
            // WEIGHT TIERS
          </span>
          <h2 className="font-[Orbitron] text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Loyalty{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#ffd700]">
              Multipliers
            </span>
          </h2>
          <p className="text-[oklch(0.6_0.02_265)] text-lg max-w-2xl mx-auto font-[Space_Grotesk]">
            The longer you provide liquidity, the higher your weight multiplier grows.
            Diamond hands are rewarded — up to 2.1x at the Legend tier.
          </p>
        </motion.div>

        {/* Tier Ladder */}
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {tiers.map((tier, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -40 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className="group"
              >
                <div className="glass-panel rounded-xl p-5 hover:border-[oklch(0.85_0.18_192/0.3)] transition-all duration-300">
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="font-[Orbitron] text-xs font-bold tracking-wider px-3 py-1 rounded-md"
                        style={{
                          color: tier.color,
                          backgroundColor: `${tier.color}15`,
                          border: `1px solid ${tier.color}30`,
                        }}
                      >
                        {tier.label.toUpperCase()}
                      </span>
                      <span className="text-sm text-[oklch(0.5_0.02_265)] font-[Space_Grotesk]">
                        {tier.range}
                      </span>
                    </div>
                    <span
                      className="font-[Fira_Code] text-xl font-bold"
                      style={{ color: tier.color }}
                    >
                      {tier.multiplier}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 rounded-full bg-[oklch(0.15_0.02_265)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={isInView ? { width: tier.barWidth } : {}}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${tier.color}${Math.round(tier.opacity * 100).toString(16).padStart(2, '0')}, ${tier.color})`,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Formula note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 1 }}
            className="mt-8 p-5 rounded-xl bg-[oklch(0.12_0.02_265/0.5)] border border-[oklch(0.3_0.04_265/0.2)]"
          >
            <div className="text-xs font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider uppercase mb-2">
              Weight Formula
            </div>
            <div className="font-[Fira_Code] text-sm text-[#00f0ff]">
              base_weight = <span className="text-white">lp_amount</span> × <span className="text-[#ff0066]">tier_multiplier</span>
            </div>
            <p className="text-xs text-[oklch(0.45_0.02_265)] mt-2 font-[Space_Grotesk]">
              Your tier is determined by a weighted-average deposit timestamp, preventing gaming through repeated deposits.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
