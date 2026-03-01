/*
 * CyberMine How It Works Section — Neon Metropolis Design
 * Step-by-step guide with numbered steps, animated connections, and LP vault image
 */
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Wallet, Droplets, ArrowDownToLine, Timer } from "lucide-react";

const VAULT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030263196/SzmZWtoZkXFNHVBrfb4wFY/lp-vault-8fggu3ocVAEMFoQPBJL3nJ.webp";

const steps = [
  {
    icon: Wallet,
    number: "01",
    title: "Join the Protocol",
    description: "Connect your Solana wallet and pay a one-time fee of 0.0009 SOL to register. Optionally enter a referral code from another miner.",
    color: "cyan",
  },
  {
    icon: Droplets,
    number: "02",
    title: "Add Liquidity on Raydium",
    description: "Provide liquidity to the designated MINE/SOL pool on Raydium. You'll receive LP tokens representing your share of the pool.",
    color: "magenta",
  },
  {
    icon: ArrowDownToLine,
    number: "03",
    title: "Deposit LP Tokens",
    description: "Deposit your Raydium LP tokens into the CyberMine vault. Your base weight is calculated from your LP amount and time tier multiplier.",
    color: "cyan",
  },
  {
    icon: Timer,
    number: "04",
    title: "Claim Every 12 Hours",
    description: "Every 12 hours, claim your share of newly minted $MINE tokens. Each claim costs 0.0009 SOL. The earlier you claim, the larger your share.",
    color: "magenta",
  },
];

export default function HowItWorksSection() {
  const headerRef = useRef(null);
  const stepsRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-50px" });
  const stepsInView = useInView(stepsRef, { once: true, margin: "-50px" });

  return (
    <section id="how-it-works" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 hex-grid-bg opacity-15" />

      <div className="relative container">
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block font-[Orbitron] text-xs text-[#ff0066] tracking-[0.3em] uppercase mb-4">
            // HOW IT WORKS
          </span>
          <h2 className="font-[Orbitron] text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Start Mining in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#ff0066]">
              4 Steps
            </span>
          </h2>
          <p className="text-[oklch(0.6_0.02_265)] text-lg max-w-2xl mx-auto font-[Space_Grotesk]">
            From wallet connection to your first claim — the entire process takes minutes, not months.
          </p>
        </motion.div>

        <div ref={stepsRef} className="grid lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-0 items-center">
          {/* Steps */}
          <div className="space-y-6 lg:pr-12">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -40 }}
                animate={stepsInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                className={`group relative glass-panel rounded-xl p-6 transition-all duration-500 hover:translate-x-2 ${
                  step.color === "cyan"
                    ? "hover:border-[oklch(0.85_0.18_192/0.4)] hover:shadow-[0_0_25px_oklch(0.85_0.18_192/0.08)]"
                    : "hover:border-[oklch(0.65_0.28_12/0.4)] hover:shadow-[0_0_25px_oklch(0.65_0.28_12/0.08)]"
                }`}
              >
                <div className="flex gap-5">
                  {/* Number */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        step.color === "cyan"
                          ? "bg-[oklch(0.85_0.18_192/0.1)] border border-[oklch(0.85_0.18_192/0.2)]"
                          : "bg-[oklch(0.65_0.28_12/0.1)] border border-[oklch(0.65_0.28_12/0.2)]"
                      }`}
                    >
                      <span
                        className={`font-[Orbitron] text-lg font-bold ${
                          step.color === "cyan" ? "text-[#00f0ff]" : "text-[#ff0066]"
                        }`}
                      >
                        {step.number}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <step.icon
                        size={16}
                        className={step.color === "cyan" ? "text-[#00f0ff]" : "text-[#ff0066]"}
                      />
                      <h3 className="font-[Orbitron] text-base font-bold text-white tracking-wide">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-sm text-[oklch(0.55_0.02_265)] leading-relaxed font-[Space_Grotesk]">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Center Divider (desktop) */}
          <div className="hidden lg:flex flex-col items-center">
            <div className="w-px h-full bg-gradient-to-b from-transparent via-[oklch(0.85_0.18_192/0.3)] to-transparent" />
          </div>

          {/* Vault Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={stepsInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:pl-12"
          >
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-[oklch(0.85_0.18_192/0.15)] to-[oklch(0.65_0.28_12/0.15)] rounded-3xl blur-2xl" />
              <img
                src={VAULT_IMG}
                alt="CyberMine LP Vault"
                className="relative rounded-2xl w-full"
                loading="lazy"
              />
              {/* Overlay info */}
              <div className="absolute bottom-4 left-4 right-4 glass-panel rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#00f0ff] animate-pulse" />
                  <span className="font-[Orbitron] text-xs text-[#00f0ff] tracking-wider">
                    VAULT ACTIVE
                  </span>
                </div>
                <p className="text-xs text-[oklch(0.5_0.02_265)] mt-1 font-[Space_Grotesk]">
                  LP tokens are securely held in a protocol-owned vault PDA
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
