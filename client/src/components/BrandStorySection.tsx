/*
 * CyberMine Brand Story Section — Neon Metropolis Design
 * Immersive narrative section with cinematic typography
 */
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function BrandStorySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-24 md:py-36 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050510] via-[oklch(0.1_0.04_265)] to-[#050510]" />
        <div className="absolute inset-0 hex-grid-bg opacity-10" />
      </div>

      {/* Accent lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.85_0.18_192/0.3)] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.65_0.28_12/0.3)] to-transparent" />

      <div className="relative container" ref={ref}>
        <div className="max-w-4xl mx-auto text-center">
          {/* Quote marks */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <span className="font-[Orbitron] text-6xl md:text-8xl text-[oklch(0.85_0.18_192/0.15)] leading-none">
              "
            </span>
          </motion.div>

          {/* Story */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="space-y-6 mb-10"
          >
            <p className="font-[Space_Grotesk] text-xl md:text-2xl text-[oklch(0.75_0.02_265)] leading-relaxed">
              In the sprawling digital metropolis of the future, the towering skyscrapers of
              traditional finance cast long shadows. Mining — the very heart of this new world —
              has been locked away in fortified data centers, accessible only to the wealthy and powerful.
            </p>
            <p className="font-[Space_Grotesk] text-xl md:text-2xl text-[oklch(0.75_0.02_265)] leading-relaxed">
              But from the neon-drenched streets, a new signal emerges.{" "}
              <span className="text-[#00f0ff] font-semibold">CyberMine</span> is a protocol that
              reclaims the power of the network for the people. Here, your voice matters more than
              your hardware.{" "}
              <span className="text-[#ff0066] font-semibold">Your commitment is your hashrate.</span>{" "}
              Your participation is your power.
            </p>
            <p className="font-[Space_Grotesk] text-xl md:text-2xl text-white leading-relaxed font-medium">
              We are not building a mining farm. We are building a{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#ff0066] font-bold">
                digital commonwealth
              </span>
              .
            </p>
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <p className="font-[Orbitron] text-lg md:text-xl text-[#00f0ff] text-glow-cyan tracking-wider font-bold">
              THE FUTURE IS YOURS TO CLAIM.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
