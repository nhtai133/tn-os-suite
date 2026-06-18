"use client";

interface Row {
  label: string;
  monthly: number;
  quarterly: number;
  annual: number;
  currency: "VND" | "USD";
}

const VND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
const USD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

function fmt(amount: number, currency: "VND" | "USD") {
  return currency === "VND" ? VND(amount) : USD(amount);
}

interface Props {
  rows: Row[];
  title?: string;
}

export function IncomeTable({ rows, title }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-zinc-800 text-sm font-medium text-zinc-300">{title}</div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wide">
            <th className="px-4 py-3 text-left">Portfolio / Source</th>
            <th className="px-4 py-3 text-right">Monthly</th>
            <th className="px-4 py-3 text-right">Quarterly</th>
            <th className="px-4 py-3 text-right">Annual</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
              <td className="px-4 py-3 text-zinc-200">{row.label}</td>
              <td className="px-4 py-3 text-right text-zinc-300">{fmt(row.monthly, row.currency)}</td>
              <td className="px-4 py-3 text-right text-zinc-300">{fmt(row.quarterly, row.currency)}</td>
              <td className="px-4 py-3 text-right text-emerald-400 font-medium">{fmt(row.annual, row.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
