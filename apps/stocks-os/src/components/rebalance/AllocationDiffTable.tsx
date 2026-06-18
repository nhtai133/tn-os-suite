import type { RebalanceRule } from "@/lib/rebalance-types";

const ACTION_COLOR = { Add: "text-emerald-400", Trim: "text-red-400", Hold: "text-zinc-400" };

interface Props {
  rules: RebalanceRule[];
  unmapped: { symbol: string; currentWeight: number }[];
}

export function AllocationDiffTable({ rules, unmapped }: Props) {
  if (rules.length === 0 && unmapped.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-10 text-center text-sm text-zinc-500">
        No holdings or target allocations set for this portfolio.
      </div>
    );
  }

  const totalTarget = rules.reduce((s, r) => s + r.target.targetWeight, 0);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Symbol</th>
              <th className="px-4 py-3 text-right">Target %</th>
              <th className="px-4 py-3 text-right">Current %</th>
              <th className="px-4 py-3 text-right">Deviation</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.target.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{r.target.symbol}</td>
                <td className="px-4 py-3 text-right text-zinc-400">{r.target.targetWeight.toFixed(1)}%</td>
                <td className="px-4 py-3 text-right text-zinc-300">{r.currentWeight.toFixed(1)}%</td>
                <td className="px-4 py-3 text-right">
                  <span className={r.deviation > 0.5 ? "text-red-400" : r.deviation < -0.5 ? "text-emerald-400" : "text-zinc-500"}>
                    {r.deviation > 0 ? "+" : ""}{r.deviation.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${ACTION_COLOR[r.action]}`}>{r.action}</span>
                </td>
              </tr>
            ))}
            {unmapped.map((u) => (
              <tr key={u.symbol} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 text-zinc-400">{u.symbol}</td>
                <td className="px-4 py-3 text-right text-zinc-600">—</td>
                <td className="px-4 py-3 text-right text-zinc-300">{u.currentWeight.toFixed(1)}%</td>
                <td className="px-4 py-3 text-right text-zinc-600">—</td>
                <td className="px-4 py-3 text-xs text-zinc-600">No target</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {Math.abs(totalTarget - 100) > 0.5 && (
        <div className="text-xs text-amber-400 px-1">
          ⚠ Target weights sum to {totalTarget.toFixed(1)}% — should be 100%
        </div>
      )}
    </div>
  );
}
