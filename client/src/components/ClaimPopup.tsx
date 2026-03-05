/*
 * CyberMine Claim Popup — Neon Metropolis Design
 * Shows a celebration modal after a successful claim with token amount,
 * tx link, and social sharing buttons with referral link embedded
 */
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { txUrl } from "@/config/contracts";
import { shareOnTwitter, shareOnTelegram, getReferralLink, copyToClipboard } from "@/lib/social";
import { toast } from "sonner";

interface ClaimPopupProps {
  isOpen: boolean;
  onClose: () => void;
  amount: string;       // formatted token amount
  txHash: string | null;
  address: string;      // user's address for referral link
}

export default function ClaimPopup({ isOpen, onClose, amount, txHash, address }: ClaimPopupProps) {
  const refLink = getReferralLink(address);
  const shareText = `I just mined ${amount} $MINE tokens on CyberMine! Mining for the People, not the machines.`;

  const handleShareTwitter = () => shareOnTwitter(shareText, refLink);
  const handleShareTelegram = () => shareOnTelegram(shareText, refLink);
  const handleCopyLink = async () => {
    await copyToClipboard(`${shareText}\n\nJoin CyberMine: ${refLink}`);
    toast.success("Copied to clipboard!");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#050510]/80 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative glass-panel rounded-2xl p-6 md:p-8 max-w-md w-full"
            style={{ borderColor: "rgba(0,240,255,0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[oklch(0.5_0.02_265)] hover:text-white hover:bg-[oklch(0.2_0.02_265)] transition-colors"
            >
              <X size={18} />
            </button>

            {/* Celebration icon */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10, stiffness: 200, delay: 0.2 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                style={{
                  background: "radial-gradient(circle, rgba(0,240,255,0.15) 0%, transparent 70%)",
                  border: "2px solid rgba(0,240,255,0.3)",
                }}
              >
                <span className="text-4xl">⛏️</span>
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-[Orbitron] text-lg font-bold text-white mb-1"
              >
                Mining Successful!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-[oklch(0.5_0.02_265)] font-[Space_Grotesk]"
              >
                You just claimed
              </motion.p>
            </div>

            {/* Amount */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center mb-6 py-4 rounded-xl"
              style={{ background: "rgba(0,240,255,0.05)", border: "1px solid rgba(0,240,255,0.15)" }}
            >
              <div className="font-[Orbitron] text-3xl md:text-4xl font-bold text-[#00f0ff] text-glow-cyan">
                {amount}
              </div>
              <div className="font-[Orbitron] text-sm text-[oklch(0.5_0.02_265)] mt-1">
                $MINE Tokens
              </div>
            </motion.div>

            {/* TX Link */}
            {txHash && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center mb-6"
              >
                <a
                  href={txUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-[Fira_Code] text-[#00f0ff] hover:underline"
                >
                  <ExternalLink size={12} />
                  View Transaction
                </a>
              </motion.div>
            )}

            {/* Share buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <p className="text-xs text-[oklch(0.4_0.02_265)] font-[Space_Grotesk] text-center mb-3">
                Share your mining success
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleShareTwitter}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-[Space_Grotesk] font-semibold transition-all duration-200 hover:scale-105"
                  style={{ background: "rgba(29,155,240,0.15)", border: "1px solid rgba(29,155,240,0.3)", color: "#1d9bf0" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  X
                </button>
                <button
                  onClick={handleShareTelegram}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-[Space_Grotesk] font-semibold transition-all duration-200 hover:scale-105"
                  style={{ background: "rgba(0,136,204,0.15)", border: "1px solid rgba(0,136,204,0.3)", color: "#0088cc" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  Telegram
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-[Space_Grotesk] font-semibold transition-all duration-200 hover:scale-105"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#ccc" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy
                </button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
