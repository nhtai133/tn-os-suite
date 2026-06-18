interface BrokerRow {
  brokerName: string;
  symbol: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  currency: "VND" | "USD";
  unrealizedPL: number;
  unrealizedPct: number;
}

const VND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(n);
const USD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
function fmt(n: number, c: "VND" | "USD") { return c === "VND" ? VND(n) + " ₫" : USD(n); }

interface Props {
  rows: BrokerRow[];
  title?: string;
}

export function BrokerTable({ rows, title }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-8 text-center text-sm text-zinc-500">
        No holdings for this broker
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      {title && <div className="px-4 py-3 border-b border-zinc-800 text-sm font-medium text-zinc-300">{title}</div>}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wide">
            <th className="px-4 py-3 text-left">Symbol</th>
            <th className="px-4 py-3 text-right">Qty</th>
            <th className="px-4 py-3 text-right">Avg Cost</th>
            <th className="px-4 py-3 text-right">Current</th>
            <th className="px-4 py-3 text-right">P/L</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
              <td className="px-4 py-3 font-medium text-white">{row.symbol}</td>
              <td className="px-4 py-3 text-right text-zinc-300">{row.quantity.toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-zinc-400">{fmt(row.avgCost, row.currency)}</td>
              <td className="px-4 py-3 text-right text-zinc-300">{fmt(row.currentPrice, row.currency)}</td>
              <td className="px-4 py-3 text-right">
                <span className={row.unrealizedPL >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {row.unrealizedPL >= 0 ? "+" : ""}{row.unrealizedPct.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
