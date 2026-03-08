/*
 * ConnectModal — Wallet connection dialog with MetaMask & WalletConnect options
 * Cyberpunk Neon Metropolis design, matching the existing glass-panel aesthetic.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, Smartphone, Loader2 } from "lucide-react";

export type WalletType = "metamask" | "walletconnect";

interface ConnectModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: WalletType) => Promise<void>;
  connecting: boolean;
  connectingType: WalletType | null;
}

export default function ConnectModal({
  open,
  onClose,
  onSelect,
  connecting,
  connectingType,
}: ConnectModalProps) {
  const hasMetaMask = typeof window !== "undefined" && !!(window as any).ethereum;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm glass-panel rounded-2xl border border-[oklch(0.2_0.02_265/0.5)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-0">
              <h2 className="font-[Orbitron] text-base font-bold text-white tracking-wider">
                CONNECT WALLET
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[oklch(0.2_0.02_265/0.5)] transition-colors text-[oklch(0.5_0.02_265)] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="px-5 mt-2 text-xs font-[Space_Grotesk] text-[oklch(0.45_0.02_265)]">
              Choose how you want to connect to CyberMine.
            </p>

            {/* Options */}
            <div className="p-5 space-y-3">
              {/* MetaMask */}
              <button
                onClick={() => onSelect("metamask")}
                disabled={connecting}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-[oklch(0.1_0.02_265)] border border-[oklch(0.2_0.02_265/0.5)] hover:border-[#f6851b]/50 hover:bg-[oklch(0.12_0.02_265)] transition-all duration-200 disabled:opacity-50 group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#f6851b]/10 border border-[#f6851b]/20 flex items-center justify-center flex-shrink-0 group-hover:border-[#f6851b]/40 transition-colors">
                  {connectingType === "metamask" ? (
                    <Loader2 size={20} className="text-[#f6851b] animate-spin" />
                  ) : (
                    <Wallet size={20} className="text-[#f6851b]" />
                  )}
                </div>
                <div className="text-left flex-1">
                  <div className="font-[Orbitron] text-sm font-bold text-white tracking-wide">
                    MetaMask
                  </div>
                  <div className="text-[10px] font-[Space_Grotesk] text-[oklch(0.45_0.02_265)] mt-0.5">
                    {hasMetaMask ? "Browser extension detected" : "Not installed — will open download page"}
                  </div>
                </div>
                {connectingType === "metamask" && (
                  <span className="text-[10px] font-[Orbitron] text-[#f6851b] tracking-wider">
                    CONNECTING...
                  </span>
                )}
              </button>

              {/* WalletConnect */}
              <button
                onClick={() => onSelect("walletconnect")}
                disabled={connecting}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-[oklch(0.1_0.02_265)] border border-[oklch(0.2_0.02_265/0.5)] hover:border-[#3b99fc]/50 hover:bg-[oklch(0.12_0.02_265)] transition-all duration-200 disabled:opacity-50 group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#3b99fc]/10 border border-[#3b99fc]/20 flex items-center justify-center flex-shrink-0 group-hover:border-[#3b99fc]/40 transition-colors">
                  {connectingType === "walletconnect" ? (
                    <Loader2 size={20} className="text-[#3b99fc] animate-spin" />
                  ) : (
                    <Smartphone size={20} className="text-[#3b99fc]" />
                  )}
                </div>
                <div className="text-left flex-1">
                  <div className="font-[Orbitron] text-sm font-bold text-white tracking-wide">
                    WalletConnect
                  </div>
                  <div className="text-[10px] font-[Space_Grotesk] text-[oklch(0.45_0.02_265)] mt-0.5">
                    Trust Wallet, SafePal, and 300+ wallets
                  </div>
                </div>
                {connectingType === "walletconnect" && (
                  <span className="text-[10px] font-[Orbitron] text-[#3b99fc] tracking-wider">
                    CONNECTING...
                  </span>
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="px-5 pb-4 text-center">
              <p className="text-[9px] font-[Fira_Code] text-[oklch(0.35_0.02_265)]">
                By connecting, you agree to the protocol's terms of use.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
