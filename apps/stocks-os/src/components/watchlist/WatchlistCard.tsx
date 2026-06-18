import type { WatchlistItem, WatchlistStatus } from "@/lib/watchlist-types";

const STATUS_COLOR: Record<WatchlistStatus, string> = {
  Watching:     "text-sky-400 bg-sky-400/10",
  Accumulating: "text-emerald-400 bg-emerald-400/10",
  Hold:         "text-zinc-300 bg-zinc-700/40",
  Overvalued:   "text-amber-400 bg-amber-400/10",
  Sold:         "text-red-400 bg-red-400/10",
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
  item: WatchlistItem;
  onEdit?: (item: WatchlistItem) => void;
  onDelete?: (id: string) => void;
}

export function WatchlistCard({ item, onEdit, onDelete }: Props) {
  const margin = mos(item);
  const inZone =
    item.buyZoneLow != null &&
    item.buyZoneHigh != null &&
    item.currentPrice >= item.buyZoneLow &&
    item.currentPrice <= item.buyZoneHigh;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-white text-base">{item.symbol}</div>
          {item.sector && <div className="text-xs text-zinc-500 mt-0.5">{item.sector}</div>}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[item.status]}`}>
          {item.status}
        </span>
      </div>

      {/* Price row */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-zinc-500 mb-0.5">Price</div>
          <div className="text-white font-medium">{fmt(item.currentPrice, item.currency)}</div>
        </div>
        {item.fairValue != null && (
          <div>
            <div className="text-zinc-500 mb-0.5">Fair Value</div>
            <div className="text-zinc-200">{fmt(item.fairValue, item.currency)}</div>
          </div>
        )}
        {margin != null && (
          <div>
            <div className="text-zinc-500 mb-0.5">MoS</div>
            <div className={margin >= 0 ? "text-emerald-400" : "text-red-400"}>
              {margin >= 0 ? "+" : ""}{margin.toFixed(1)}%
            </div>
          </div>
        )}
      </div>

      {/* Buy zone indicator */}
      {item.buyZoneLow != null && item.buyZoneHigh != null && (
        <div className="flex items-center gap-2 text-xs">
          <div className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${inZone ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>
            {inZone ? "IN ZONE" : "Buy zone: " + fmt(item.buyZoneLow, item.currency) + " – " + fmt(item.buyZoneHigh, item.currency)}
          </div>
        </div>
      )}

      {/* Priority + notes */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          {item.priorityScore != null && (
            <span>P{item.priorityScore}</span>
          )}
          {item.portfolioType && <span className="text-zinc-600">· {item.portfolioType}</span>}
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <button onClick={() => onEdit(item)} className="text-sky-400 hover:text-sky-300 transition-colors">
              Edit
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(item.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
              Del
            </button>
          )}
        </div>
      </div>

      {item.notes && (
        <div className="text-xs text-zinc-600 leading-relaxed border-t border-zinc-800 pt-2">{item.notes}</div>
      )}
    </div>
  );
}
