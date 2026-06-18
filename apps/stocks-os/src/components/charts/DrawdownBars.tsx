import type { Holding } from "@/lib/portfolio-types";

interface Props {
  holdings: Holding[];
}

function pnlPct(h: Holding): number {
  if (h.averageCost <= 0) return 0;
  return ((h.currentPrice - h.averageCost) / h.averageCost) * 100;
}

export function DrawdownBars({ holdings }: Props) {
  if (holdings.length === 0) return null;

  const sorted = [...holdings].sort((a, b) => pnlPct(a) - pnlPct(b));
  const maxAbsPct = Math.max(...sorted.map((h) => Math.abs(pnlPct(h))), 0.1);

  return (
    <div className="space-y-1.5">
      {sorted.map((h) => {
        const pct = pnlPct(h);
        // Each bar fills up to 45% of its half
        const halfWidth = (Math.abs(pct) / maxAbsPct) * 45;
        const isGain = pct >= 0;

        const targetGapPct =
          h.targetPrice && h.targetPrice > 0 && h.currentPrice > 0
            ? ((h.targetPrice - h.currentPrice) / h.currentPrice) * 100
            : null;

        return (
          <div key={h.id} className="flex items-center gap-2 h-6 text-xs">
            {/* Symbol */}
            <div className="w-11 text-right font-bold text-sky-400 shrink-0 truncate">{h.symbol}</div>

            {/* Bidirectional bar */}
            <div className="relative flex-1 h-4">
              {/* Center axis */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-700 -translate-x-px" />
              {/* Bar */}
              <div
                className={`absolute top-1 bottom-1 rounded-sm transition-all ${
                  isGain ? "bg-emerald-500/70" : "bg-red-500/60"
                }`}
                style={{
                  width: `${halfWidth}%`,
                  ...(isGain ? { left: "50%" } : { right: "50%" }),
                }}
              />
            </div>

            {/* P/L % label */}
            <div
              className={`w-14 font-medium tabular-nums shrink-0 ${
                isGain ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {pct >= 0 ? "+" : ""}
              {pct.toFixed(1)}%
            </div>

            {/* Target gap (optional) */}
            {targetGapPct !== null ? (
              <div
                className={`w-24 text-right tabular-nums shrink-0 ${
                  targetGapPct > 0 ? "text-amber-500" : "text-zinc-600"
                }`}
              >
                {targetGapPct > 0
                  ? `+${targetGapPct.toFixed(0)}% to tgt`
                  : `${targetGapPct.toFixed(0)}% past`}
              </div>
            ) : (
              <div className="w-24 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
