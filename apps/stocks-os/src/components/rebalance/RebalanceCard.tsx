import type { RebalanceRule } from "@/lib/rebalance-types";

const ACTION_COLOR = { Add: "text-emerald-400", Trim: "text-red-400", Hold: "text-zinc-400" };
const ACTION_BG = { Add: "bg-emerald-400/10", Trim: "bg-red-400/10", Hold: "bg-zinc-700/30" };

interface Props {
  rule: RebalanceRule;
  onEdit?: () => void;
}

export function RebalanceCard({ rule, onEdit }: Props) {
  const { target, currentWeight, deviation, action } = rule;
  const barMax = Math.max(target.targetWeight, currentWeight, 1);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-bold text-white">{target.symbol}</div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLOR[action]} ${ACTION_BG[action]}`}>
          {action}
        </span>
      </div>

      {/* Target bar */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between text-zinc-500">
          <span>Target</span>
          <span className="text-zinc-300">{target.targetWeight.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-800">
          <div className="h-full rounded-full bg-sky-500/60" style={{ width: `${Math.min(100, (target.targetWeight / barMax) * 100)}%` }} />
        </div>
        <div className="flex justify-between text-zinc-500">
          <span>Current</span>
          <span className="text-zinc-300">{currentWeight.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-800">
          <div
            className={`h-full rounded-full ${deviation > 0 ? "bg-red-400/60" : deviation < 0 ? "bg-emerald-400/60" : "bg-zinc-500"}`}
            style={{ width: `${Math.min(100, (currentWeight / barMax) * 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className={deviation > 0.5 ? "text-red-400" : deviation < -0.5 ? "text-emerald-400" : "text-zinc-500"}>
          {deviation > 0 ? "+" : ""}{deviation.toFixed(1)}% deviation
        </span>
        {onEdit && (
          <button onClick={onEdit} className="text-sky-400 hover:text-sky-300 transition-colors">Edit</button>
        )}
      </div>

      {target.notes && <div className="text-xs text-zinc-600">{target.notes}</div>}
    </div>
  );
}
