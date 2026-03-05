/*
 * CyberMine Weight Breakdown — Shared Component
 * Color-coded horizontal bar showing base weight, multiplier bonus, and referral credit
 * Colors: cyan for base LP, gold for multiplier bonus, magenta for referral credit
 */

interface WeightBreakdownProps {
  rawWeight: number;        // LP base contribution
  multiplierBonus: number;  // Extra from tier multiplier
  refCredit: number;        // Referral bonus
  totalWeight: number;      // Sum of all
  compact?: boolean;
}

export default function WeightBreakdown({ rawWeight, multiplierBonus, refCredit, totalWeight, compact = false }: WeightBreakdownProps) {
  if (totalWeight === 0) {
    return (
      <div className="text-xs text-[oklch(0.4_0.02_265)] font-[Fira_Code]">
        No weight yet
      </div>
    );
  }

  const rawPct = (rawWeight / totalWeight) * 100;
  const multPct = (multiplierBonus / totalWeight) * 100;
  const refPct = (refCredit / totalWeight) * 100;

  const formatNum = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n.toFixed(2);
  };

  return (
    <div>
      {/* Stacked bar */}
      <div className={`rounded-full overflow-hidden flex ${compact ? "h-2" : "h-3"}`} style={{ background: "oklch(0.15 0.02 265)" }}>
        {rawPct > 0 && (
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${rawPct}%`, background: "#00f0ff" }}
            title={`Base LP: ${formatNum(rawWeight)}`}
          />
        )}
        {multPct > 0 && (
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${multPct}%`, background: "#ffd700" }}
            title={`Multiplier: ${formatNum(multiplierBonus)}`}
          />
        )}
        {refPct > 0 && (
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${refPct}%`, background: "#ff0066" }}
            title={`Referral: ${formatNum(refCredit)}`}
          />
        )}
      </div>

      {/* Legend */}
      {!compact && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#00f0ff" }} />
            <span className="text-[10px] font-[Fira_Code] text-[oklch(0.6_0.02_265)]">
              Base LP <span className="text-[#00f0ff]">{formatNum(rawWeight)}</span>
            </span>
          </div>
          {multiplierBonus > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#ffd700" }} />
              <span className="text-[10px] font-[Fira_Code] text-[oklch(0.6_0.02_265)]">
                Multiplier <span className="text-[#ffd700]">+{formatNum(multiplierBonus)}</span>
              </span>
            </div>
          )}
          {refCredit > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#ff0066" }} />
              <span className="text-[10px] font-[Fira_Code] text-[oklch(0.6_0.02_265)]">
                Referral <span className="text-[#ff0066]">+{formatNum(refCredit)}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
