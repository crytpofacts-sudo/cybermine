/*
 * CyberMine Tier System Utilities
 *
 * Tier multiplier is based on the weighted-average deposit timestamp.
 * The contract uses tierMultiplierFp(activeDepositTs, nowTs) but we can
 * replicate the logic client-side from the ABI guide:
 *
 *   0-7 days   → 1.00x (Tier 0 — Recruit)
 *   7-30 days  → 1.15x (Tier 1 — Operator)
 *   30-90 days → 1.35x (Tier 2 — Specialist)
 *   90-180 days→ 1.60x (Tier 3 — Commander)
 *   180-365 days→1.90x (Tier 4 — Elite)
 *   365+ days  → 2.10x (Tier 5 — Legend)
 *
 * Fixed-point precision: FP = 1e18
 */

export interface TierInfo {
  tier: number;
  name: string;
  multiplier: number;       // e.g. 1.35
  multiplierLabel: string;  // e.g. "1.35x"
  color: string;            // CSS color for badge
  bgColor: string;          // CSS bg color
  borderColor: string;      // CSS border color
  icon: string;             // Emoji/symbol
  daysInTier: number;       // days since entering this tier
  daysToNext: number | null; // days until next tier (null if max)
  nextTierName: string | null;
  nextMultiplier: number | null;
}

const TIERS = [
  { days: 0,   mult: 1.00, name: "Recruit",    icon: "⛏️", color: "#8b8b8b", bgColor: "rgba(139,139,139,0.1)", borderColor: "rgba(139,139,139,0.3)" },
  { days: 7,   mult: 1.15, name: "Operator",   icon: "🔧", color: "#00f0ff", bgColor: "rgba(0,240,255,0.1)",   borderColor: "rgba(0,240,255,0.3)" },
  { days: 30,  mult: 1.35, name: "Specialist",  icon: "🎯", color: "#00cc88", bgColor: "rgba(0,204,136,0.1)",   borderColor: "rgba(0,204,136,0.3)" },
  { days: 90,  mult: 1.60, name: "Commander",   icon: "⚡", color: "#ff8800", bgColor: "rgba(255,136,0,0.1)",   borderColor: "rgba(255,136,0,0.3)" },
  { days: 180, mult: 1.90, name: "Elite",       icon: "💎", color: "#ff0066", bgColor: "rgba(255,0,102,0.1)",   borderColor: "rgba(255,0,102,0.3)" },
  { days: 365, mult: 2.10, name: "Legend",       icon: "👑", color: "#ffd700", bgColor: "rgba(255,215,0,0.1)",   borderColor: "rgba(255,215,0,0.3)" },
];

export function getTierInfo(activeDepositTs: bigint): TierInfo {
  const now = Math.floor(Date.now() / 1000);
  const depositTs = Number(activeDepositTs);

  // If no deposit yet, return tier 0
  if (depositTs === 0) {
    return {
      tier: 0,
      name: TIERS[0].name,
      multiplier: TIERS[0].mult,
      multiplierLabel: `${TIERS[0].mult.toFixed(2)}x`,
      color: TIERS[0].color,
      bgColor: TIERS[0].bgColor,
      borderColor: TIERS[0].borderColor,
      icon: TIERS[0].icon,
      daysInTier: 0,
      daysToNext: 7,
      nextTierName: TIERS[1].name,
      nextMultiplier: TIERS[1].mult,
    };
  }

  const elapsed = now - depositTs;
  const elapsedDays = elapsed / 86400;

  // Find current tier
  let currentIdx = 0;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (elapsedDays >= TIERS[i].days) {
      currentIdx = i;
      break;
    }
  }

  const current = TIERS[currentIdx];
  const next = currentIdx < TIERS.length - 1 ? TIERS[currentIdx + 1] : null;

  const daysInTier = elapsedDays - current.days;
  const daysToNext = next ? Math.max(0, next.days - elapsedDays) : null;

  return {
    tier: currentIdx,
    name: current.name,
    multiplier: current.mult,
    multiplierLabel: `${current.mult.toFixed(2)}x`,
    color: current.color,
    bgColor: current.bgColor,
    borderColor: current.borderColor,
    icon: current.icon,
    daysInTier: Math.floor(daysInTier),
    daysToNext: daysToNext !== null ? Math.ceil(daysToNext) : null,
    nextTierName: next?.name ?? null,
    nextMultiplier: next?.mult ?? null,
  };
}

export function getAllTiers() {
  return TIERS;
}

/**
 * Calculate weight breakdown for visualization
 * baseWeightFp is from the contract (cachedBaseWeightFp)
 * referralWeightCreditFp is the ref bonus
 * multiplier is from getTierInfo
 */
export function getWeightBreakdown(
  cachedBaseWeightFp: bigint,
  referralWeightCreditFp: bigint,
  multiplier: number,
  lpDecimals: number,
) {
  const FP = BigInt(10 ** 18);
  // Base weight (before multiplier) = cachedBaseWeightFp / multiplierFp
  // But cachedBaseWeightFp already includes the multiplier
  // Actually from the ABI guide: cachedBaseWeightFp = activeLp * tierMultiplierFp / FP
  // So the "raw LP weight" = activeLp (in LP decimals)
  // And the multiplied weight = cachedBaseWeightFp (in FP)

  // For display purposes:
  // baseWeight = cachedBaseWeightFp (this is the user's weight after multiplier)
  // refCredit = referralWeightCreditFp (bonus from referrals, capped at 20% of base)

  const baseNum = Number(cachedBaseWeightFp) / Number(FP);
  const refNum = Number(referralWeightCreditFp) / Number(FP);
  const totalNum = baseNum + refNum;

  // The "raw" weight before multiplier
  const rawWeight = multiplier > 0 ? baseNum / multiplier : 0;
  const multiplierBonus = baseNum - rawWeight;

  return {
    rawWeight,          // LP amount contribution
    multiplierBonus,    // extra from tier multiplier
    refCredit: refNum,  // referral bonus
    totalWeight: totalNum,
    baseWeight: baseNum,
  };
}
