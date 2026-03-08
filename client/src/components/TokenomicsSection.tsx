/*
 * CyberMine Tokenomics Section — Neon Metropolis Design
 * Visual breakdown of token supply, emission mechanics, and fee structure
 */
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const TOKENOMICS_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030263196/SzmZWtoZkXFNHVBrfb4wFY/tokenomics-bg-6rKUy7YwkcXvUZRJv23yaF.webp";

const tokenData = [
  { label: "Emission Pool", percent: 99, amount: "20,790,000,000", color: "#00f0ff" },
  { label: "Initial LP", percent: 1, amount: "210,000,000", color: "#ff0066" },
];

const mechanics = [
  {
    label: "Emission Rate (r)",
    value: "0.0003",
    description: "Fraction of remaining supply available per claim cycle",
  },
  {
    label: "Claim Cooldown",
    value: "12 Hours",
    description: "Minimum time between reward claims",
  },
  {
    label: "Join Fee",
    value: "BNB fee",
    description: "One-time fee to enter the protocol (set by contract)",
  },
  {
    label: "Claim Fee",
    value: "BNB fee",
    description: "Fee per reward claim, sent to dev wallet (set by contract)",
  },
];

export default function TokenomicsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="tokenomics" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 opacity-10">
        <img src={TOKENOMICS_BG} alt="" className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="absolute inset-0 bg-[#050510]/90" />

      <div className="relative container" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block font-[Orbitron] text-xs text-[#ff0066] tracking-[0.3em] uppercase mb-4">
            // TOKENOMICS
          </span>
          <h2 className="font-[Orbitron] text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            $MINE Token{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#ff0066]">
              Economics
            </span>
          </h2>
          <p className="text-[oklch(0.6_0.02_265)] text-lg max-w-2xl mx-auto font-[Space_Grotesk]">
            A fixed supply of 21 billion tokens with a deflationary emission model.
            Every claim reduces the remaining pool — early miners capture the largest share.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Supply Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-panel rounded-2xl p-8"
          >
            <h3 className="font-[Orbitron] text-xl font-bold text-white mb-8 tracking-wide">
              Supply Allocation
            </h3>

            {/* Total Supply */}
            <div className="mb-8 p-5 rounded-xl bg-[oklch(0.85_0.18_192/0.05)] border border-[oklch(0.85_0.18_192/0.15)]">
              <div className="text-xs font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider uppercase mb-1">
                Hard Cap
              </div>
              <div className="font-[Fira_Code] text-3xl font-bold text-[#00f0ff] text-glow-cyan">
                21,000,000,000
              </div>
              <div className="text-xs text-[oklch(0.5_0.02_265)] font-[Space_Grotesk] mt-1">
                $MINE Tokens
              </div>
            </div>

            {/* Visual Bar */}
            <div className="mb-6">
              <div className="h-6 rounded-full overflow-hidden bg-[oklch(0.15_0.02_265)] flex">
                <motion.div
                  initial={{ width: 0 }}
                  animate={isInView ? { width: "99%" } : {}}
                  transition={{ duration: 1.2, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-[#00f0ff] to-[#00d4ff] rounded-l-full"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={isInView ? { width: "1%" } : {}}
                  transition={{ duration: 0.5, delay: 1.5 }}
                  className="h-full bg-[#ff0066] rounded-r-full"
                />
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-4">
              {tokenData.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-[Space_Grotesk] text-[oklch(0.7_0.02_265)]">
                      {item.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-[Fira_Code] text-sm font-semibold" style={{ color: item.color }}>
                      {item.percent}%
                    </span>
                    <span className="text-xs text-[oklch(0.5_0.02_265)] ml-2 font-[Fira_Code]">
                      ({item.amount})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Emission Mechanics */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="glass-panel rounded-2xl p-8 md:p-10"
          >
            <h3 className="font-[Orbitron] text-2xl md:text-3xl font-bold text-white mb-8 tracking-wide">
              Emission{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff0066] to-[#ffd700]">Mechanics</span>
            </h3>

            {/* Formula — large and prominent */}
            <div className="mb-8 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[oklch(0.65_0.28_12/0.08)] to-[oklch(0.85_0.18_192/0.05)] border border-[oklch(0.65_0.28_12/0.2)] shadow-[0_0_30px_oklch(0.65_0.28_12/0.05)]">
              <div className="text-xs font-[Orbitron] text-[#ff0066] tracking-[0.3em] uppercase mb-4">
                Reward Formula
              </div>
              <div className="font-[Fira_Code] text-base md:text-lg text-[#ff0066] leading-loose">
                <span className="text-white font-bold text-lg md:text-xl">mint_amount</span> =
                <br />
                <span className="ml-4 md:ml-8 text-[oklch(0.7_0.02_265)]">remaining_supply</span>
                <br />
                <span className="ml-4 md:ml-8">× <span className="text-[#00f0ff] font-bold">r</span> <span className="text-[oklch(0.4_0.02_265)] text-sm">(0.0003)</span></span>
                <br />
                <span className="ml-4 md:ml-8">× <span className="text-[#00f0ff] font-bold">user_weight</span> / <span className="text-[#00f0ff] font-bold">total_weight</span></span>
              </div>
              <p className="mt-4 text-xs text-[oklch(0.5_0.02_265)] font-[Space_Grotesk] leading-relaxed border-t border-[oklch(0.3_0.04_265/0.2)] pt-4">
                Each claim mints a fraction of the remaining supply proportional to your share of the total network weight.
                As supply decreases, each claim yields fewer tokens — rewarding early participants.
              </p>
            </div>

            {/* Parameters — bigger cards */}
            <div className="space-y-4">
              {mechanics.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-5 rounded-xl bg-[oklch(0.12_0.02_265/0.5)] border border-[oklch(0.3_0.04_265/0.2)] hover:border-[oklch(0.65_0.28_12/0.3)] transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-[Space_Grotesk] font-semibold text-white">
                        {item.label}
                      </span>
                      <span className="font-[Fira_Code] text-base font-bold text-[#ff0066]">
                        {item.value}
                      </span>
                    </div>
                    <p className="text-sm text-[oklch(0.55_0.02_265)] font-[Space_Grotesk] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
