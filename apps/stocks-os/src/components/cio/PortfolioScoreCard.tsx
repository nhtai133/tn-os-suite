import type { HealthScore } from "@/lib/cio-engine";

function scoreColor(score: number, max: number): string {
  const pct = score / max;
  if (pct >= 0.8) return "text-emerald-400";
  if (pct >= 0.5) return "text-yellow-400";
  return "text-red-400";
}

function totalColor(total: number): string {
  if (total >= 80) return "text-emerald-400";
  if (total >= 55) return "text-yellow-400";
  return "text-red-400";
}

function totalLabel(total: number): string {
  if (total >= 80) return "Excellent";
  if (total >= 65) return "Good";
  if (total >= 50) return "Fair";
  return "Needs Work";
}

interface Props {
  score: HealthScore;
}

export function PortfolioScoreCard({ score }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      {/* Total */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-zinc-800">
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Portfolio Health</div>
          <div className={`text-5xl font-bold ${totalColor(score.total)}`}>{score.total}</div>
          <div className="text-xs text-zinc-500 mt-1">/ 100 — {totalLabel(score.total)}</div>
        </div>
        {/* Gauge arc via SVG */}
        <svg width="80" height="50" viewBox="0 0 80 50" aria-hidden="true">
          <path d="M10 45 A30 30 0 0 1 70 45" fill="none" stroke="#27272a" strokeWidth="6" strokeLinecap="round" />
          <path
            d="M10 45 A30 30 0 0 1 70 45"
            fill="none"
            stroke={score.total >= 80 ? "#10b981" : score.total >= 55 ? "#eab308" : "#ef4444"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(score.total / 100) * 94} 94`}
          />
          <text x="40" y="44" textAnchor="middle" fontSize="11" fill="#a1a1aa">
            {totalLabel(score.total)}
          </text>
        </svg>
      </div>

      {/* Breakdown */}
      <div className="divide-y divide-zinc-800/60">
        {score.breakdown.map((b) => (
          <div key={b.label} className="px-6 py-3 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-400">{b.label}</span>
                <span className={`text-xs font-medium ${scoreColor(b.score, b.max)}`}>
                  {b.score}/{b.max}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    b.score / b.max >= 0.8 ? "bg-emerald-500" : b.score / b.max >= 0.5 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${(b.score / b.max) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-zinc-600 w-40 text-right shrink-0">{b.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
