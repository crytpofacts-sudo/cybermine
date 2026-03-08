/*
 * CyberMine Navbar — Neon Metropolis Design
 * Landing page nav with section anchors + dApp page links + LAUNCH APP button
 */
import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Pickaxe, User, Users } from "lucide-react";

const sectionLinks = [
  { label: "Protocol", href: "#protocol" },
  { label: "Tokenomics", href: "#tokenomics" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Tiers", href: "#tiers" },
];

const pageLinks = [
  { label: "Mine", href: "/mine", icon: Pickaxe },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Referrals", href: "/referrals", icon: Users },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="glass-panel border-b border-[oklch(0.85_0.18_192/0.12)]">
        <div className="container flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310419663030263196/SzmZWtoZkXFNHVBrfb4wFY/cybermine-icon-transparent-44WwcLSoNbwT5vFEsrEPF3.webp"
              alt="CyberMine"
              className="w-9 h-9 md:w-10 md:h-10 drop-shadow-[0_0_8px_rgba(0,240,255,0.5)] group-hover:drop-shadow-[0_0_12px_rgba(0,240,255,0.7)] transition-all"
            />
            <span className="font-[Orbitron] text-lg md:text-xl font-bold tracking-wider text-white">
              CYBER<span className="text-[#00f0ff]">MINE</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Section anchors */}
            {sectionLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-[Space_Grotesk] text-[oklch(0.7_0.02_265)] hover:text-[#00f0ff] transition-colors duration-300 relative group"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-[#00f0ff] group-hover:w-3/4 transition-all duration-300" />
              </a>
            ))}

            {/* Divider */}
            <div className="w-px h-5 bg-[oklch(0.3_0.04_265/0.4)] mx-2" />

            {/* Page links */}
            {pageLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-[Space_Grotesk] text-[oklch(0.7_0.02_265)] hover:text-[#00f0ff] transition-colors duration-300 relative group flex items-center gap-1.5"
              >
                <link.icon size={13} />
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-[#00f0ff] group-hover:w-3/4 transition-all duration-300" />
              </Link>
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
              {/* Section anchors */}
              {sectionLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-sm font-[Space_Grotesk] text-[oklch(0.7_0.02_265)] hover:text-[#00f0ff] hover:bg-[oklch(0.85_0.18_192/0.05)] rounded-lg transition-colors"
                >
                  {link.label}
                </a>
              ))}

              {/* Divider */}
              <div className="h-px bg-[oklch(0.3_0.04_265/0.3)] my-2" />

              {/* Page links */}
              {pageLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-sm font-[Space_Grotesk] text-[oklch(0.7_0.02_265)] hover:text-[#00f0ff] hover:bg-[oklch(0.85_0.18_192/0.05)] rounded-lg transition-colors flex items-center gap-2"
                >
                  <link.icon size={14} />
                  {link.label}
                </Link>
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
