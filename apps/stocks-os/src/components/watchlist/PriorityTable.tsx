import type { WatchlistItem, WatchlistStatus } from "@/lib/watchlist-types";

const STATUS_COLOR: Record<WatchlistStatus, string> = {
  Watching:     "text-sky-400",
  Accumulating: "text-emerald-400",
  Hold:         "text-zinc-400",
  Overvalued:   "text-amber-400",
  Sold:         "text-red-400",
};

function fmt(n: number, currency: "VND" | "USD") {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(n);
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

function mos(item: WatchlistItem): number | null {
  if (!item.fairValue || item.fairValue <= 0) return null;
  return ((item.fairValue - item.currentPrice) / item.fairValue) * 100;
}

interface Props {
  items: WatchlistItem[];
  onEdit?: (item: WatchlistItem) => void;
}

export function PriorityTable({ items, onEdit }: Props) {
  const sorted = [...items]
    .filter((x) => x.status !== "Sold")
    .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0));

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-10 text-center text-sm text-zinc-500">
        No items in priority list
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wide">
            <th className="px-4 py-3 text-left w-10">#</th>
            <th className="px-4 py-3 text-left">Symbol</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Price</th>
            <th className="px-4 py-3 text-right">Fair Value</th>
            <th className="px-4 py-3 text-right">MoS</th>
            <th className="px-4 py-3 text-right">Score</th>
            <th className="px-4 py-3 text-left">Portfolio</th>
            {onEdit && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody>
          {sorted.map((item, i) => {
            const margin = mos(item);
            return (
              <tr key={item.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 text-zinc-600 text-xs">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{item.symbol}</div>
                  {item.sector && <div className="text-xs text-zinc-600">{item.sector}</div>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${STATUS_COLOR[item.status]}`}>{item.status}</span>
                </td>
                <td className="px-4 py-3 text-right text-zinc-300">{fmt(item.currentPrice, item.currency)}</td>
                <td className="px-4 py-3 text-right text-zinc-400">
                  {item.fairValue != null ? fmt(item.fairValue, item.currency) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {margin != null ? (
                    <span className={margin >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {margin >= 0 ? "+" : ""}{margin.toFixed(1)}%
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {item.priorityScore != null ? (
                    <span className="text-white font-bold">{item.priorityScore}</span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">{item.portfolioType ?? "—"}</td>
                {onEdit && (
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onEdit(item)}
                      className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
