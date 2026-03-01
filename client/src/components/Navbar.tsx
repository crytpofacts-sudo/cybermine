/*
 * CyberMine Navbar — Neon Metropolis Design
 * Landing page nav with anchor links + LAUNCH APP button that goes to /mine
 */
import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Protocol", href: "#protocol" },
  { label: "Tokenomics", href: "#tokenomics" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Tiers", href: "#tiers" },
  { label: "Referrals", href: "#referrals" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="glass-panel border-b border-[oklch(0.85_0.18_192/0.12)]">
        <div className="container flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 md:w-10 md:h-10">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#ff0066] opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-[2px] rounded-[6px] bg-[#050510] flex items-center justify-center">
                <span className="font-[Orbitron] text-[#00f0ff] text-sm font-bold">CM</span>
              </div>
            </div>
            <span className="font-[Orbitron] text-lg md:text-xl font-bold tracking-wider text-white">
              CYBER<span className="text-[#00f0ff]">MINE</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-[Space_Grotesk] text-[oklch(0.7_0.02_265)] hover:text-[#00f0ff] transition-colors duration-300 relative group"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-[#00f0ff] group-hover:w-3/4 transition-all duration-300" />
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/mine"
              className="px-5 py-2.5 text-sm font-[Orbitron] font-semibold text-[#050510] bg-[#00f0ff] rounded-lg hover:shadow-[0_0_25px_oklch(0.85_0.18_192/0.5)] transition-all duration-300 tracking-wide"
            >
              LAUNCH APP
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-[#00f0ff]"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden glass-panel border-b border-[oklch(0.85_0.18_192/0.12)]"
          >
            <div className="container py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-sm font-[Space_Grotesk] text-[oklch(0.7_0.02_265)] hover:text-[#00f0ff] hover:bg-[oklch(0.85_0.18_192/0.05)] rounded-lg transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/mine"
                onClick={() => setMobileOpen(false)}
                className="mt-2 px-5 py-3 text-sm font-[Orbitron] font-semibold text-center text-[#050510] bg-[#00f0ff] rounded-lg tracking-wide"
              >
                LAUNCH APP
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
