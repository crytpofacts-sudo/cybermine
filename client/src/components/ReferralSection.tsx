/*
 * CyberMine Referral Section — Neon Metropolis Design
 * Holographic referral system display with network visualization
 */
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Users, Gift, Link2, ArrowRight } from "lucide-react";

const NETWORK_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030263196/SzmZWtoZkXFNHVBrfb4wFY/referral-network-K2in7xUGSiYum3vDT5jWXf.webp";

const referralRules = [
  {
    icon: Link2,
    title: "Set Once, Forever",
    description: "Referral is set during JOIN and is immutable. Your referrer is locked in permanently.",
  },
  {
    icon: Gift,
    title: "5% Weight Credit",
    description: "When your referred user claims, you receive 5% of their base weight as referral credit.",
  },
  {
    icon: Users,
    title: "20% Cap on Bonus",
    description: "Your usable referral bonus is capped at 20% of your own base weight per claim.",
  },
];

export default function ReferralSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="referrals" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 opacity-8">
        <img src={NETWORK_IMG} alt="" className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="absolute inset-0 bg-[#050510]/92" />

      <div className="relative container" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block font-[Orbitron] text-xs text-[#ff0066] tracking-[0.3em] uppercase mb-4">
            // REFERRAL NETWORK
          </span>
          <h2 className="font-[Orbitron] text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Expand the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff0066] to-[#ffd700]">
              Network
            </span>
          </h2>
          <p className="text-[oklch(0.6_0.02_265)] text-lg max-w-2xl mx-auto font-[Space_Grotesk]">
            Invite other miners to the protocol and earn bonus weight on every claim.
            Build your network, amplify your rewards.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Rules */}
          <div className="space-y-5">
            {referralRules.map((rule, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                className="glass-panel-magenta rounded-xl p-6 hover:border-[oklch(0.65_0.28_12/0.4)] transition-all duration-300"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-[oklch(0.65_0.28_12/0.1)] border border-[oklch(0.65_0.28_12/0.2)] flex items-center justify-center">
                    <rule.icon size={20} className="text-[#ff0066]" />
                  </div>
                  <div>
                    <h3 className="font-[Orbitron] text-base font-bold text-white mb-1.5 tracking-wide">
                      {rule.title}
                    </h3>
                    <p className="text-sm text-[oklch(0.55_0.02_265)] font-[Space_Grotesk] leading-relaxed">
                      {rule.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Formula */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="p-5 rounded-xl bg-[oklch(0.12_0.02_265/0.5)] border border-[oklch(0.3_0.04_265/0.2)]"
            >
              <div className="text-xs font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider uppercase mb-3">
                Effective Weight Formula
              </div>
              <div className="font-[Fira_Code] text-sm space-y-1">
                <div>
                  <span className="text-[#00f0ff]">effective_weight</span>{" "}
                  <span className="text-white">=</span>{" "}
                  <span className="text-white">base_weight</span>{" "}
                  <span className="text-white">+</span>{" "}
                  <span className="text-[#ff0066]">usable_bonus</span>
                </div>
                <div className="text-[oklch(0.45_0.02_265)] text-xs mt-2">
                  where usable_bonus = min(referral_credit, 0.20 × base_weight)
                </div>
              </div>
            </motion.div>
          </div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-[oklch(0.65_0.28_12/0.15)] to-[oklch(0.85_0.18_192/0.1)] rounded-3xl blur-2xl" />
              <div className="relative glass-panel rounded-2xl p-8 overflow-hidden">
                {/* Simulated referral code display */}
                <div className="mb-6">
                  <div className="text-xs font-[Orbitron] text-[oklch(0.5_0.02_265)] tracking-wider uppercase mb-3">
                    Your Referral Code
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-4 rounded-lg bg-[oklch(0.1_0.02_265)] border border-[oklch(0.65_0.28_12/0.3)] font-[Fira_Code] text-[#ff0066] text-sm tracking-wider">
                      CYB3R-M1N3-X7K9-DEMO
                    </div>
                    <button className="px-4 py-4 rounded-lg bg-[oklch(0.65_0.28_12/0.15)] border border-[oklch(0.65_0.28_12/0.3)] text-[#ff0066] hover:bg-[oklch(0.65_0.28_12/0.25)] transition-colors">
                      <Link2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Simulated stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-[oklch(0.1_0.02_265)] border border-[oklch(0.3_0.04_265/0.2)]">
                    <div className="text-xs font-[Orbitron] text-[oklch(0.45_0.02_265)] tracking-wider mb-1">
                      REFERRALS
                    </div>
                    <div className="font-[Fira_Code] text-2xl font-bold text-[#00f0ff]">
                      --
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-[oklch(0.1_0.02_265)] border border-[oklch(0.3_0.04_265/0.2)]">
                    <div className="text-xs font-[Orbitron] text-[oklch(0.45_0.02_265)] tracking-wider mb-1">
                      BONUS CREDIT
                    </div>
                    <div className="font-[Fira_Code] text-2xl font-bold text-[#ff0066]">
                      --
                    </div>
                  </div>
                </div>

                {/* Network visualization hint */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[oklch(0.85_0.18_192/0.05)] border border-[oklch(0.85_0.18_192/0.1)]">
                  <Users size={16} className="text-[#00f0ff]" />
                  <span className="text-xs text-[oklch(0.5_0.02_265)] font-[Space_Grotesk]">
                    Connect wallet to view your referral network
                  </span>
                  <ArrowRight size={14} className="text-[#00f0ff] ml-auto" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
