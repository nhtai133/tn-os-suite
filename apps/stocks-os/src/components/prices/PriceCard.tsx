import type { PriceEntry } from "@/lib/price-types";

const VND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(n) + " ₫";
const USD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
function fmt(n: number, c: "VND" | "USD") { return c === "VND" ? VND(n) : USD(n); }

interface Props {
  symbol: string;
  latest?: PriceEntry;
  previous?: PriceEntry;
  entryCount: number;
}

export function PriceCard({ symbol, latest, previous, entryCount }: Props) {
  const change =
    latest && previous && previous.price > 0
      ? ((latest.price - previous.price) / previous.price) * 100
      : null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-white">{symbol}</span>
        <span className="text-xs text-zinc-500">{entryCount} entries</span>
      </div>
      {latest ? (
        <>
          <div className="text-lg font-semibold text-white">{fmt(latest.price, latest.currency)}</div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>{latest.date}</span>
            <span className="text-zinc-700">·</span>
            <span className="capitalize">{latest.source}</span>
            {change != null && (
              <span className={change >= 0 ? "text-emerald-400" : "text-red-400"}>
                {change >= 0 ? "+" : ""}{change.toFixed(2)}%
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="text-xs text-zinc-600">No price data</div>
      )}
    </div>
  );
}
