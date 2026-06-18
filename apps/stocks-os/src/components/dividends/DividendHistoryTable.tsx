"use client";

import { useState } from "react";
import type { DividendEvent } from "@/lib/dividend-types";

const VND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
const USD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

function fmt(amount: number, currency: "VND" | "USD") {
  return currency === "VND" ? VND(amount) : USD(amount);
}

const STATUS_LABEL: Record<string, string> = { expected: "Expected", received: "Received" };
const STATUS_COLOR: Record<string, string> = {
  expected: "text-amber-400 bg-amber-400/10",
  received: "text-emerald-400 bg-emerald-400/10",
};

interface Props {
  events: DividendEvent[];
  onEdit?: (event: DividendEvent) => void;
  onDelete?: (id: string) => void;
}

export function DividendHistoryTable({ events, onEdit, onDelete }: Props) {
  const [confirm, setConfirm] = useState<string | null>(null);

  const sorted = [...events].sort((a, b) => b.exDate.localeCompare(a.exDate));

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-10 text-center text-sm text-zinc-500">
        No dividend records yet
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
            <th className="px-4 py-3 text-right">Gross</th>
            <th className="px-4 py-3 text-right">Tax</th>
            <th className="px-4 py-3 text-right">Net</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Broker</th>
            {(onEdit || onDelete) && <th className="px-4 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((e) => (
            <tr key={e.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
              <td className="px-4 py-3 font-medium text-white">{e.symbol}</td>
              <td className="px-4 py-3 text-zinc-300">{e.exDate}</td>
              <td className="px-4 py-3 text-right text-zinc-300">{fmt(e.grossAmount, e.currency)}</td>
              <td className="px-4 py-3 text-right text-red-400">
                {e.tax ? fmt(e.tax, e.currency) : "—"}
              </td>
              <td className="px-4 py-3 text-right text-emerald-400">{fmt(e.netAmount, e.currency)}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[e.status] ?? ""}`}>
                  {STATUS_LABEL[e.status] ?? e.status}
                </span>
              </td>
              <td className="px-4 py-3 text-zinc-500 text-xs">{e.broker ?? "—"}</td>
              {(onEdit || onDelete) && (
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(e)}
                        className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      confirm === e.id ? (
                        <span className="flex items-center gap-1">
                          <button
                            onClick={() => { onDelete(e.id); setConfirm(null); }}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirm(null)}
                            className="text-xs text-zinc-500 hover:text-zinc-300"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirm(e.id)}
                          className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      )
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
