"use client";

interface BrokerRow {
  broker: string;
  annualIncome: number;
  currency: "VND" | "USD";
  eventCount: number;
  pct: number;
}

const VND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
const USD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

function fmt(amount: number, currency: "VND" | "USD") {
  return currency === "VND" ? VND(amount) : USD(amount);
}

interface Props {
  rows: BrokerRow[];
}

export function BrokerIncomeTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-8 text-center text-sm text-zinc-500">
        No broker income data
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wide">
            <th className="px-4 py-3 text-left">Broker</th>
            <th className="px-4 py-3 text-right">Annual Income</th>
            <th className="px-4 py-3 text-right">Events</th>
            <th className="px-4 py-3 text-right">Share</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
              <td className="px-4 py-3 text-zinc-200">{row.broker}</td>
              <td className="px-4 py-3 text-right text-emerald-400 font-medium">{fmt(row.annualIncome, row.currency)}</td>
              <td className="px-4 py-3 text-right text-zinc-400">{row.eventCount}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(row.pct, 100)}%` }}
                    />
                  </div>
                  <span className="text-zinc-400 text-xs w-10 text-right">{row.pct.toFixed(1)}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
