/*
 * CyberMine App Navbar — Neon Metropolis Design
 * Used on dApp pages (Mine, Profile, Referrals) with page routing + wallet button
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Wallet, LogOut, Pickaxe, User, Users, Home } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { shortenAddress } from "@/lib/referral";

const appLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "Mine", href: "/mine", icon: Pickaxe },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Referrals", href: "/referrals", icon: Users },
];

export default function AppNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { connected, address, connecting, connect, disconnect, walletType } = useWallet();
  const walletLabel = walletType === "walletconnect" ? "WC" : "MM";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="glass-panel border-b border-[oklch(0.85_0.18_192/0.12)]">
        <div className="container flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310419663030263196/SzmZWtoZkXFNHVBrfb4wFY/cybermine-icon-transparent-44WwcLSoNbwT5vFEsrEPF3.webp"
              alt="CyberMine"
              className="w-9 h-9 md:w-10 md:h-10 drop-shadow-[0_0_8px_rgba(0,240,255,0.5)] group-hover:drop-shadow-[0_0_12px_rgba(0,240,255,0.7)] transition-all"
            />
            <span className="font-[Orbitron] text-lg md:text-xl font-bold tracking-wider text-white">
              CYBER<span className="text-[#00f0ff]">MINE</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {appLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-[Space_Grotesk] transition-colors duration-300 relative group flex items-center gap-2 ${
                    isActive
                      ? "text-[#00f0ff]"
                      : "text-[oklch(0.7_0.02_265)] hover:text-[#00f0ff]"
                  }`}
                >
                  <link.icon size={14} />
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-[#00f0ff]"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Wallet Button */}
          <div className="hidden lg:flex items-center gap-3">
            {connected ? (
              <div className="flex items-center gap-2">
                <div className="px-4 py-2 glass-panel rounded-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
                  <span className="font-[Orbitron] text-[9px] text-[oklch(0.5_0.02_265)] tracking-wider">{walletLabel}</span>
                  <span className="font-[Fira_Code] text-xs text-[#00f0ff]">{shortenAddress(address || "", 4)}</span>
                </div>
                <button
                  onClick={disconnect}
                  className="p-2.5 rounded-lg border border-[oklch(0.65_0.28_12/0.3)] text-[#ff0066] hover:bg-[oklch(0.65_0.28_12/0.1)] transition-colors"
                  title="Disconnect"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={connecting}
                className="px-5 py-2.5 text-sm font-[Orbitron] font-semibold text-[#050510] bg-[#00f0ff] rounded-lg hover:shadow-[0_0_25px_oklch(0.85_0.18_192/0.5)] transition-all duration-300 tracking-wide flex items-center gap-2 disabled:opacity-50"
              >
                <Wallet size={16} />
                {connecting ? "CONNECTING..." : "CONNECT WALLET"}
              </button>
            )}
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
              {appLinks.map((link) => {
                const isActive = location === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`px-4 py-3 text-sm font-[Space_Grotesk] rounded-lg transition-colors flex items-center gap-3 ${
                      isActive
                        ? "text-[#00f0ff] bg-[oklch(0.85_0.18_192/0.08)]"
                        : "text-[oklch(0.7_0.02_265)] hover:text-[#00f0ff] hover:bg-[oklch(0.85_0.18_192/0.05)]"
                    }`}
                  >
                    <link.icon size={16} />
                    {link.label}
                  </Link>
                );
              })}
              <div className="mt-3 pt-3 border-t border-[oklch(0.3_0.04_265/0.3)]">
                {connected ? (
                  <div className="flex flex-col gap-2">
                    <div className="px-4 py-3 glass-panel rounded-lg flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
                      <span className="font-[Orbitron] text-[9px] text-[oklch(0.5_0.02_265)] tracking-wider">{walletLabel}</span>
                      <span className="font-[Fira_Code] text-xs text-[#00f0ff]">{shortenAddress(address || "", 4)}</span>
                    </div>
                    <button
                      onClick={() => { disconnect(); setMobileOpen(false); }}
                      className="px-4 py-3 text-sm font-[Space_Grotesk] text-[#ff0066] rounded-lg border border-[oklch(0.65_0.28_12/0.2)] text-center"
                    >
                      Disconnect Wallet
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { connect(); setMobileOpen(false); }}
                    disabled={connecting}
                    className="w-full px-5 py-3 text-sm font-[Orbitron] font-semibold text-center text-[#050510] bg-[#00f0ff] rounded-lg tracking-wide"
                  >
                    {connecting ? "CONNECTING..." : "CONNECT WALLET"}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
