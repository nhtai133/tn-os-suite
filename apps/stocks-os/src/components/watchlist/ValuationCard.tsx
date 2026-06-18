import type { WatchlistItem } from "@/lib/watchlist-types";

function fmt(n: number, currency: "VND" | "USD") {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(n) + " ₫";
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

interface Props {
  item: WatchlistItem;
  onEdit?: (item: WatchlistItem) => void;
}

export function ValuationCard({ item, onEdit }: Props) {
  const hasFairValue = item.fairValue != null && item.fairValue > 0;
  const mos = hasFairValue
    ? ((item.fairValue! - item.currentPrice) / item.fairValue!) * 100
    : null;
  const upside =
    item.targetPrice != null && item.targetPrice > 0
      ? ((item.targetPrice - item.currentPrice) / item.currentPrice) * 100
      : null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-bold text-white">{item.symbol}</div>
        {item.sector && <div className="text-xs text-zinc-500">{item.sector}</div>}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
          <div className="text-zinc-500 mb-0.5">Current Price</div>
          <div className="text-white font-medium">{fmt(item.currentPrice, item.currency)}</div>
        </div>

        {hasFairValue && (
          <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
            <div className="text-zinc-500 mb-0.5">Fair Value</div>
            <div className="text-zinc-200 font-medium">{fmt(item.fairValue!, item.currency)}</div>
          </div>
        )}

        {mos != null && (
          <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
            <div className="text-zinc-500 mb-0.5">Margin of Safety</div>
            <div className={`font-bold ${mos >= 20 ? "text-emerald-400" : mos >= 0 ? "text-yellow-400" : "text-red-400"}`}>
              {mos >= 0 ? "+" : ""}{mos.toFixed(1)}%
            </div>
          </div>
        )}

        {upside != null && (
          <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
            <div className="text-zinc-500 mb-0.5">Target Upside</div>
            <div className={`font-medium ${upside >= 0 ? "text-sky-400" : "text-red-400"}`}>
              {upside >= 0 ? "+" : ""}{upside.toFixed(1)}%
            </div>
          </div>
        )}
      </div>

      {/* MoS gauge */}
      {mos != null && (
        <div>
          <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${mos >= 20 ? "bg-emerald-500" : mos >= 0 ? "bg-yellow-500" : "bg-red-500"}`}
              style={{ width: `${Math.min(100, Math.max(0, Math.abs(mos)))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
            <span>0%</span>
            <span>50%+</span>
          </div>
        </div>
      )}

      {!hasFairValue && (
        <div className="text-xs text-zinc-600">Set a fair value to see margin of safety</div>
      )}

      {onEdit && (
        <button
          onClick={() => onEdit(item)}
          className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
        >
          Update Valuation →
        </button>
      )}
    </div>
  );
}
