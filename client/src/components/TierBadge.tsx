/*
 * CyberMine Tier Badge — Shared Component
 * Shows the user's current tier with icon, name, multiplier, and optional countdown to next tier
 */
import { type TierInfo } from "@/lib/tiers";

interface TierBadgeProps {
  tierInfo: TierInfo;
  compact?: boolean;
}

export default function TierBadge({ tierInfo, compact = false }: TierBadgeProps) {
  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-[Orbitron] font-bold"
        style={{
          color: tierInfo.color,
          background: tierInfo.bgColor,
          border: `1px solid ${tierInfo.borderColor}`,
        }}
      >
        <span>{tierInfo.icon}</span>
        <span>{tierInfo.name}</span>
        <span className="opacity-70">{tierInfo.multiplierLabel}</span>
      </span>
    );
  }

  return (
    <div
      className="glass-panel rounded-xl p-4 transition-all duration-300"
      style={{ borderColor: tierInfo.borderColor }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
          style={{ background: tierInfo.bgColor, border: `1px solid ${tierInfo.borderColor}` }}
        >
          {tierInfo.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-[Orbitron] text-sm font-bold" style={{ color: tierInfo.color }}>
              {tierInfo.name}
            </span>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-[Orbitron] font-bold"
              style={{ background: tierInfo.bgColor, color: tierInfo.color }}
            >
              {tierInfo.multiplierLabel}
            </span>
          </div>
          <div className="text-xs text-[oklch(0.5_0.02_265)] font-[Space_Grotesk] mt-0.5">
            Tier {tierInfo.tier} Multiplier
          </div>
        </div>
      </div>

      {tierInfo.daysToNext !== null && tierInfo.nextTierName && (
        <div className="mt-2">
          <div className="flex justify-between text-[10px] font-[Fira_Code] mb-1">
            <span className="text-[oklch(0.5_0.02_265)]">Next: {tierInfo.nextTierName} ({tierInfo.nextMultiplier?.toFixed(2)}x)</span>
            <span style={{ color: tierInfo.color }}>{tierInfo.daysToNext}d remaining</span>
          </div>
          <div className="h-1.5 rounded-full bg-[oklch(0.15_0.02_265)]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, ((tierInfo.daysInTier) / (tierInfo.daysInTier + tierInfo.daysToNext)) * 100)}%`,
                background: `linear-gradient(90deg, ${tierInfo.color}, ${tierInfo.color}88)`,
              }}
            />
          </div>
        </div>
      )}
      {tierInfo.daysToNext === null && (
        <div className="mt-2 text-[10px] font-[Fira_Code] text-[oklch(0.5_0.02_265)]">
          <span style={{ color: tierInfo.color }}>Maximum tier reached</span>
        </div>
      )}
    </div>
  );
}
