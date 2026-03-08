/*
 * CyberMine CTA Section — Neon Metropolis Design
 * Final call-to-action with glowing button and urgency messaging
 */
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Zap } from "lucide-react";
import { Link } from "wouter";

export default function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050510] via-[oklch(0.1_0.03_192)] to-[#050510]" />
      </div>

      {/* Accent glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[oklch(0.85_0.18_192/0.05)] rounded-full blur-[120px]" />

      <div className="relative container" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-[oklch(0.65_0.28_12/0.3)] bg-[oklch(0.65_0.28_12/0.08)]">
            <Zap size={14} className="text-[#ff0066]" />
            <span className="text-xs font-[Orbitron] text-[#ff0066] tracking-widest uppercase">
              Supply is decreasing
            </span>
          </div>

          <h2 className="font-[Orbitron] text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Every Second You Wait,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#ff0066]">
              Someone Else Claims
            </span>
          </h2>

          <p className="text-lg text-[oklch(0.6_0.02_265)] font-[Space_Grotesk] mb-10 max-w-xl mx-auto leading-relaxed">
            The emission pool shrinks with every claim. Early miners capture the largest share
            of $MINE tokens. The protocol rewards those who act first.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/mine"
              className="group relative px-10 py-5 font-[Orbitron] text-base font-bold tracking-wider text-[#050510] bg-[#00f0ff] rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_oklch(0.85_0.18_192/0.5)] animate-glow-breathe"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Zap size={18} />
                START MINING NOW
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#00f0ff] to-[#00d4ff] opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
