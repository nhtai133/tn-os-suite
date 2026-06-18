import type { WatchlistItem } from "@/lib/watchlist-types";

function fmt(n: number, currency: "VND" | "USD") {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(n) + " ₫";
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

function zoneStatus(item: WatchlistItem): { label: string; color: string } {
  const { currentPrice, buyZoneLow, buyZoneHigh } = item;
  if (buyZoneLow == null || buyZoneHigh == null) return { label: "No Zone", color: "text-zinc-500" };
  if (currentPrice < buyZoneLow) return { label: "Below Zone", color: "text-sky-400" };
  if (currentPrice > buyZoneHigh) return { label: "Above Zone", color: "text-red-400" };
  return { label: "In Zone", color: "text-emerald-400" };
}

interface Props {
  item: WatchlistItem;
  onEdit?: (item: WatchlistItem) => void;
}

export function BuyZoneCard({ item, onEdit }: Props) {
  const { label, color } = zoneStatus(item);
  const hasBuyZone = item.buyZoneLow != null && item.buyZoneHigh != null;

  // Calculate bar position: span from low to high, mark current price
  let barPct = 50;
  if (hasBuyZone) {
    const lo = item.buyZoneLow!;
    const hi = item.buyZoneHigh!;
    const range = hi - lo;
    const padding = range * 0.5;
    const min = lo - padding;
    const max = hi + padding;
    barPct = Math.max(0, Math.min(100, ((item.currentPrice - min) / (max - min)) * 100));
  }

  const zonePct = hasBuyZone
    ? (() => {
        const lo = item.buyZoneLow!;
        const hi = item.buyZoneHigh!;
        const range = hi - lo;
        const padding = range * 0.5;
        const min = lo - padding;
        const max = hi + padding;
        const leftPct = ((lo - min) / (max - min)) * 100;
        const rightPct = ((hi - min) / (max - min)) * 100;
        return { left: leftPct, width: rightPct - leftPct };
      })()
    : null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-white">{item.symbol}</div>
          {item.sector && <div className="text-xs text-zinc-500">{item.sector}</div>}
        </div>
        <span className={`text-xs font-medium ${color}`}>{label}</span>
      </div>

      {/* Range bar */}
      {hasBuyZone && zonePct ? (
        <div className="space-y-1.5">
          <div className="relative h-3 rounded-full bg-zinc-800 overflow-hidden">
            {/* Buy zone band */}
            <div
              className="absolute top-0 h-full rounded-full bg-emerald-500/30"
              style={{ left: `${zonePct.left}%`, width: `${zonePct.width}%` }}
            />
            {/* Current price marker */}
            <div
              className="absolute top-0 w-1 h-full bg-white rounded-full"
              style={{ left: `${barPct}%`, transform: "translateX(-50%)" }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-600">
            <span>{fmt(item.buyZoneLow!, item.currency)}</span>
            <span className="text-zinc-400">{fmt(item.currentPrice, item.currency)}</span>
            <span>{fmt(item.buyZoneHigh!, item.currency)}</span>
          </div>
        </div>
      ) : (
        <div className="text-xs text-zinc-600">No buy zone set</div>
      )}

      {/* Current price vs target */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-zinc-500 mb-0.5">Current</div>
          <div className="text-white">{fmt(item.currentPrice, item.currency)}</div>
        </div>
        {item.targetPrice != null && (
          <div>
            <div className="text-zinc-500 mb-0.5">Target</div>
            <div className="text-sky-400">{fmt(item.targetPrice, item.currency)}</div>
          </div>
        )}
      </div>

      {onEdit && (
        <button
          onClick={() => onEdit(item)}
          className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
        >
          Update Zone →
        </button>
      )}
    </div>
  );
}
