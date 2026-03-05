/*
 * CyberMine FAQ Section — Neon Metropolis Design
 * Accordion-style FAQ with cyberpunk glass panels
 */
import { useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is CyberMine?",
    answer: "CyberMine is a BNB Chain-based LP reward protocol. Users provide liquidity to a PancakeSwap pool, deposit their LP tokens into the CyberMine vault, and earn $MINE tokens periodically. It's liquidity mining without the hardware — your commitment is your hashrate.",
  },
  {
    question: "How do I start mining $MINE?",
    answer: "First, connect your MetaMask wallet. Then, add liquidity to the MINE/BNB pool on PancakeSwap to receive LP tokens. Approve your LP tokens, then join and stake them in one transaction. You can start claiming $MINE after the cooldown period.",
  },
  {
    question: "What is the total supply of $MINE?",
    answer: "The hard cap is 21,000,000,000 (21 billion) $MINE tokens. 1% (210M) is allocated for the initial PancakeSwap LP pool, and 99% (20.79B) forms the emission pool that miners claim from over time.",
  },
  {
    question: "How are rewards calculated?",
    answer: "Your reward per claim is: remaining_supply × r × (your_effective_weight / total_base_weight), where r = 0.0003. Your effective weight is based on your LP amount, time tier multiplier, and any referral bonus (capped at 20% of your base weight).",
  },
  {
    question: "Why do earlier participants earn more?",
    answer: "Because the emission pool decreases with every claim. When the remaining supply is high, each claim mints more tokens. As more people claim and the pool shrinks, individual rewards naturally decrease. This creates a first-mover advantage.",
  },
  {
    question: "What are the tier multipliers?",
    answer: "Your weight multiplier increases the longer you provide liquidity: 1.0x (0-7 days), 1.15x (7-30 days), 1.35x (30-90 days), 1.60x (90-180 days), 1.90x (180-365 days), and 2.10x (365+ days). The tier is based on a weighted-average deposit timestamp.",
  },
  {
    question: "How does the referral system work?",
    answer: "When you join, you can optionally set a referrer (another user who has already joined). This is immutable. When you claim, your referrer receives 5% of your base weight as referral credit. When they claim, they can use up to 20% of their own base weight as a bonus from accumulated referral credits.",
  },
  {
    question: "What is the pending LP queue?",
    answer: "When you deposit more LP after joining, it goes into a pending queue. On your next claim, pending LP automatically rolls into your active deposit using a weighted-average timestamp. This means your tier multiplier is recalculated based on the combined deposit time. You can also emergency-withdraw pending LP before it rolls over.",
  },
  {
    question: "Can I withdraw my LP tokens?",
    answer: "Yes. You can withdraw active LP at any time (your tier multiplier will be recalculated). You can also emergency-withdraw pending LP before it rolls over. There is no lock-up period — you're free to leave whenever you want.",
  },
  {
    question: "Is the smart contract audited?",
    answer: "The CyberMine smart contract is deployed on BNB Chain (Solidity), designed with security-first principles: O(1) operations, deterministic accounting, no iteration over users, and comprehensive test coverage. The contract is verified on BscScan.",
  },
];

function FAQItem({ faq, index }: { faq: typeof faqs[0]; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`glass-panel rounded-xl overflow-hidden transition-all duration-300 ${
        isOpen ? "border-[oklch(0.85_0.18_192/0.3)]" : ""
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 md:p-6 text-left"
      >
        <span className="font-[Space_Grotesk] text-sm md:text-base font-semibold text-white pr-4">
          {faq.question}
        </span>
        <ChevronDown
          size={18}
          className={`flex-shrink-0 text-[#00f0ff] transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-5 md:px-6 pb-5 md:pb-6">
              <div className="h-px bg-[oklch(0.3_0.04_265/0.3)] mb-4" />
              <p className="text-sm text-[oklch(0.55_0.02_265)] leading-relaxed font-[Space_Grotesk]">
                {faq.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 hex-grid-bg opacity-10" />

      <div className="relative container" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block font-[Orbitron] text-xs text-[#ff0066] tracking-[0.3em] uppercase mb-4">
            // FAQ
          </span>
          <h2 className="font-[Orbitron] text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Frequently Asked{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#ff0066]">
              Questions
            </span>
          </h2>
        </motion.div>

        {/* FAQ Items */}
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
            >
              <FAQItem faq={faq} index={i} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
