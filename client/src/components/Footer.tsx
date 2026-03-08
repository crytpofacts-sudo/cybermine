/*
 * CyberMine Footer — Neon Metropolis Design
 * Minimal cyberpunk footer with links and branding
 */
import { motion } from "framer-motion";

const footerLinks = [
  {
    title: "Protocol",
    links: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "Tokenomics", href: "#tokenomics" },
      { label: "Tiers", href: "#tiers" },
      { label: "Referrals", href: "#referrals" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "PancakeSwap Pool", href: "https://pancakeswap.finance/add/BNB/0x40325c4F37F577111faFC4f31AB7979026626680", external: true },
      { label: "BscScan", href: "https://testnet.bscscan.com/address/0xba75a1cdad9e5ff1218561f039b80d465a37723e", external: true },
      { label: "Smart Contract", href: "https://testnet.bscscan.com/address/0xba75a1cdad9e5ff1218561f039b80d465a37723e#code", external: true },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Twitter / X", href: "https://x.com", external: true },
      { label: "Discord", href: "#" },
      { label: "Telegram", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-[oklch(0.85_0.18_192/0.1)]">
      <div className="absolute inset-0 hex-grid-bg opacity-10" />

      <div className="relative container py-16 md:py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310419663030263196/SzmZWtoZkXFNHVBrfb4wFY/cybermine-icon-transparent-44WwcLSoNbwT5vFEsrEPF3.webp"
                alt="CyberMine"
                className="w-9 h-9 drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]"
              />
              <span className="font-[Orbitron] text-lg font-bold tracking-wider text-white">
                CYBER<span className="text-[#00f0ff]">MINE</span>
              </span>
            </div>
            <p className="text-sm text-[oklch(0.5_0.02_265)] font-[Space_Grotesk] max-w-sm leading-relaxed mb-6">
              A BNB Chain-based LP reward protocol. Provide liquidity, earn $MINE tokens.
              Mining for the people, not the machines.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[oklch(0.85_0.18_192/0.2)] bg-[oklch(0.85_0.18_192/0.05)]">
              <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
              <span className="text-xs font-[Fira_Code] text-[#00f0ff]">
                Powered by BNB Chain
              </span>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((group, i) => (
            <div key={i}>
              <h4 className="font-[Orbitron] text-xs font-bold text-white tracking-wider uppercase mb-4">
                {group.title}
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link, j) => (
                  <li key={j}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-sm text-[oklch(0.5_0.02_265)] hover:text-[#00f0ff] transition-colors font-[Space_Grotesk]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[oklch(0.3_0.04_265/0.2)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[oklch(0.4_0.02_265)] font-[Space_Grotesk]">
            &copy; {new Date().getFullYear()} CyberMine. All rights reserved. Not financial advice.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-[oklch(0.4_0.02_265)] hover:text-[#00f0ff] transition-colors font-[Space_Grotesk]">
              Terms
            </a>
            <a href="#" className="text-xs text-[oklch(0.4_0.02_265)] hover:text-[#00f0ff] transition-colors font-[Space_Grotesk]">
              Privacy
            </a>
            <span className="text-xs text-[oklch(0.3_0.02_265)] font-[Fira_Code]">
              v1.0.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
