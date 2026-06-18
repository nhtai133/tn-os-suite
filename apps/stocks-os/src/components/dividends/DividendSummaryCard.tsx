interface Props {
  symbol: string;
  totalReceived: number;
  totalExpected: number;
  eventCount: number;
  currency: "VND" | "USD";
  lastDate?: string;
}

const VND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
const USD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

function fmt(amount: number, currency: "VND" | "USD") {
  return currency === "VND" ? VND(amount) : USD(amount);
}

export function DividendSummaryCard({ symbol, totalReceived, totalExpected, eventCount, currency, lastDate }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-white">{symbol}</div>
        <div className="text-xs text-zinc-500">{eventCount} event{eventCount !== 1 ? "s" : ""}</div>
      </div>
      <div className="flex gap-4 text-xs">
        <div>
          <div className="text-zinc-500 mb-0.5">Received</div>
          <div className="text-emerald-400 font-medium">{fmt(totalReceived, currency)}</div>
        </div>
        <div>
          <div className="text-zinc-500 mb-0.5">Expected</div>
          <div className="text-amber-400 font-medium">{fmt(totalExpected, currency)}</div>
        </div>
      </div>
      {lastDate && <div className="text-xs text-zinc-600">Last: {lastDate}</div>}
    </div>
  );
}
