"use client";

import type { DividendEvent } from "@/lib/dividend-types";

const VND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
const USD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

function fmt(amount: number, currency: "VND" | "USD") {
  return currency === "VND" ? VND(amount) : USD(amount);
}

interface Props {
  events: DividendEvent[];
}

export function DividendCalendarTable({ events }: Props) {
  const upcoming = events
    .filter((e) => e.status === "expected")
    .sort((a, b) => a.exDate.localeCompare(b.exDate));

  if (upcoming.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-10 text-center text-sm text-zinc-500">
        No upcoming dividends
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wide">
            <th className="px-4 py-3 text-left">Symbol</th>
            <th className="px-4 py-3 text-left">Ex-Date</th>
            <th className="px-4 py-3 text-left">Payment Date</th>
            <th className="px-4 py-3 text-right">Amount/Share</th>
            <th className="px-4 py-3 text-right">Shares</th>
            <th className="px-4 py-3 text-right">Gross</th>
            <th className="px-4 py-3 text-left">Broker</th>
          </tr>
        </thead>
        <tbody>
          {upcoming.map((e) => (
            <tr key={e.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
              <td className="px-4 py-3 font-medium text-white">{e.symbol}</td>
              <td className="px-4 py-3 text-zinc-300">{e.exDate}</td>
              <td className="px-4 py-3 text-zinc-400">{e.paymentDate ?? "—"}</td>
              <td className="px-4 py-3 text-right text-zinc-300">{fmt(e.amountPerShare, e.currency)}</td>
              <td className="px-4 py-3 text-right text-zinc-300">{e.shares.toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-sky-400">{fmt(e.grossAmount, e.currency)}</td>
              <td className="px-4 py-3 text-zinc-500 text-xs">{e.broker ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
