"use client";

interface PortfolioIncomeRow {
  portfolioId: string;
  portfolioName: string;
  annualIncome: number;
  currency: "VND" | "USD";
  eventCount: number;
  yield?: number;
}

const VND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
const USD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

function fmt(amount: number, currency: "VND" | "USD") {
  return currency === "VND" ? VND(amount) : USD(amount);
}

interface Props {
  rows: PortfolioIncomeRow[];
}

export function IncomePortfolioTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-8 text-center text-sm text-zinc-500">
        No portfolio income data
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wide">
            <th className="px-4 py-3 text-left">Portfolio</th>
            <th className="px-4 py-3 text-right">Annual Income</th>
            <th className="px-4 py-3 text-right">Monthly Avg</th>
            <th className="px-4 py-3 text-right">Events</th>
            <th className="px-4 py-3 text-right">Yield</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.portfolioId} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
              <td className="px-4 py-3 text-zinc-200">{row.portfolioName}</td>
              <td className="px-4 py-3 text-right text-emerald-400 font-medium">{fmt(row.annualIncome, row.currency)}</td>
              <td className="px-4 py-3 text-right text-zinc-300">{fmt(row.annualIncome / 12, row.currency)}</td>
              <td className="px-4 py-3 text-right text-zinc-400">{row.eventCount}</td>
              <td className="px-4 py-3 text-right text-zinc-400">
                {row.yield != null ? `${row.yield.toFixed(2)}%` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
