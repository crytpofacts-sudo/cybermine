/*
 * CyberMine Social Sharing Utilities
 * Generates share URLs for popular social networks with referral link embedded
 */

const SITE_URL = typeof window !== "undefined" ? window.location.origin : "https://cybermine.io";

export function getReferralLink(address: string): string {
  return `${SITE_URL}/?ref=${address}`;
}

export function shareOnTwitter(text: string, url: string): void {
  const encoded = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  window.open(
    `https://twitter.com/intent/tweet?text=${encoded}&url=${encodedUrl}`,
    "_blank",
    "noopener,noreferrer"
  );
}

export function shareOnTelegram(text: string, url: string): void {
  const encoded = encodeURIComponent(`${text}\n${url}`);
  window.open(
    `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    "_blank",
    "noopener,noreferrer"
  );
}

export function shareOnReddit(title: string, url: string): void {
  window.open(
    `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    "_blank",
    "noopener,noreferrer"
  );
}

export function shareOnDiscord(text: string): void {
  // Discord doesn't have a direct share URL, copy to clipboard instead
  navigator.clipboard.writeText(text);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
