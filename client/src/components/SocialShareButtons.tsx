/*
 * CyberMine Social Share Buttons — Shared Component
 * Row of social network share buttons with referral link embedded
 */
import { shareOnTwitter, shareOnTelegram, shareOnReddit, getReferralLink, copyToClipboard } from "@/lib/social";
import { toast } from "sonner";

interface SocialShareButtonsProps {
  address: string;
  message?: string;
}

export default function SocialShareButtons({ address, message }: SocialShareButtonsProps) {
  const refLink = getReferralLink(address);
  const defaultMsg = message || "Join CyberMine — Mining for the People! Provide liquidity and earn $MINE tokens.";

  const handleCopy = async () => {
    await copyToClipboard(`${defaultMsg}\n\n${refLink}`);
    toast.success("Referral link copied!");
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* X / Twitter */}
      <button
        onClick={() => shareOnTwitter(defaultMsg, refLink)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-[Space_Grotesk] font-semibold transition-all duration-200 hover:scale-105"
        style={{ background: "rgba(29,155,240,0.12)", border: "1px solid rgba(29,155,240,0.25)", color: "#1d9bf0" }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        X / Twitter
      </button>

      {/* Telegram */}
      <button
        onClick={() => shareOnTelegram(defaultMsg, refLink)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-[Space_Grotesk] font-semibold transition-all duration-200 hover:scale-105"
        style={{ background: "rgba(0,136,204,0.12)", border: "1px solid rgba(0,136,204,0.25)", color: "#0088cc" }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
        Telegram
      </button>

      {/* Reddit */}
      <button
        onClick={() => shareOnReddit(defaultMsg, refLink)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-[Space_Grotesk] font-semibold transition-all duration-200 hover:scale-105"
        style={{ background: "rgba(255,69,0,0.12)", border: "1px solid rgba(255,69,0,0.25)", color: "#ff4500" }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
        Reddit
      </button>

      {/* Copy */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-[Space_Grotesk] font-semibold transition-all duration-200 hover:scale-105"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#aaa" }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Copy Link
      </button>
    </div>
  );
}
