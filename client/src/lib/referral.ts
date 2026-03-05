/*
 * CyberMine — Referral Capture & Persistence (localStorage)
 *
 * URL format: https://cybermine.xyz/?ref=0xREFERRER_ADDRESS
 * First-touch attribution with 30-day TTL.
 */

const STORAGE_KEY = "cybermine_ref";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface StoredReferral {
  ref: string;
  ts: number;
  source: "url" | "manual";
}

/** Validate that a string is a valid EVM hex address */
export function isValidAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

/** Read stored referral (returns null if expired or missing) */
export function getStoredReferral(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: StoredReferral = JSON.parse(raw);
    if (Date.now() - data.ts > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data.ref;
  } catch {
    return null;
  }
}

/** Store a referral address (first-touch: won't overwrite existing valid ref) */
export function storeReferral(ref: string, source: "url" | "manual" = "url"): boolean {
  if (!isValidAddress(ref)) return false;
  const existing = getStoredReferral();
  if (existing) return false; // first-touch attribution
  const data: StoredReferral = { ref, ts: Date.now(), source };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return true;
}

/** Clear stored referral */
export function clearReferral(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Capture referral from URL search params (?ref=0x...) */
export function captureReferralFromUrl(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref && isValidAddress(ref)) {
      storeReferral(ref, "url");
      return ref;
    }
  } catch {
    // ignore
  }
  return null;
}

/** Shorten an address for display: 0x1234...abcd */
export function shortenAddress(addr: string, chars = 4): string {
  if (!addr) return "";
  return `${addr.slice(0, chars + 2)}...${addr.slice(-chars)}`;
}
