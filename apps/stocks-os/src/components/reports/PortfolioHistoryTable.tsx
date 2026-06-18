"use client";

import { useState } from "react";
import type { HistoryEntry } from "@/lib/snapshot-types";

type TimeFilter = "1M" | "3M" | "6M" | "1Y" | "All";

const FILTER_LABELS: TimeFilter[] = ["1M", "3M", "6M", "1Y", "All"];

const FILTER_MS: Record<TimeFilter, number> = {
  "1M":  30  * 24 * 60 * 60 * 1000,
  "3M":  90  * 24 * 60 * 60 * 1000,
  "6M":  180 * 24 * 60 * 60 * 1000,
  "1Y":  365 * 24 * 60 * 60 * 1000,
  "All": Infinity,
};

function fmtUSD(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  }) + " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

interface Props {
  entries: HistoryEntry[];
  onDelete?: (id: string) => void;
}

export function PortfolioHistoryTable({ entries, onDelete }: Props) {
  const [filter, setFilter] = useState<TimeFilter>("All");

  const now = Date.now();
  const maxMs = FILTER_MS[filter];

  const filtered = entries
    .filter((e) => now - new Date(e.takenAt).getTime() <= maxMs)
    .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());

  return (
    <div className="space-y-3">
      {/* Time filter */}
      <div className="flex gap-1">
        {FILTER_LABELS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent"
            }`}
          >
            {f === "All" ? "Since inception" : f}
          </button>
        ))}
        <span className="ml-auto text-xs text-zinc-700 self-center">
          {filtered.length} snapshot{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-xl py-8 text-center">
          <p className="text-zinc-600 text-sm">
            {entries.length === 0
              ? "No snapshots yet. Click Snapshot on any portfolio to start tracking."
              : `No snapshots in the last ${filter}.`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                {["Date", "Value", "Invested", "Unrealized P/L", "Realized P/L", "Return %", "Holdings", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-2.5 text-xs text-zinc-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap text-xs">{fmtDate(e.takenAt)}</td>
                  <td className="px-4 py-3 text-sky-400 font-medium tabular-nums">{fmtUSD(e.value)}</td>
                  <td className="px-4 py-3 text-zinc-400 tabular-nums">{fmtUSD(e.investedCapital)}</td>
                  <td
                    className={`px-4 py-3 font-medium tabular-nums ${
                      e.unrealizedPnL >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {e.unrealizedPnL >= 0 ? "+" : ""}
                    {fmtUSD(e.unrealizedPnL)}
                  </td>
                  <td
                    className={`px-4 py-3 font-medium tabular-nums ${
                      e.realizedPnL >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {e.realizedPnL >= 0 ? "+" : ""}
                    {fmtUSD(e.realizedPnL)}
                  </td>
                  <td
                    className={`px-4 py-3 font-medium tabular-nums ${
                      e.totalReturnPct >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {e.totalReturnPct >= 0 ? "+" : ""}
                    {e.totalReturnPct.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-zinc-500 tabular-nums">{e.holdingCount}</td>
                  <td className="px-4 py-3">
                    {onDelete && (
                      <button
                        onClick={() => onDelete(e.id)}
                        className="text-xs text-zinc-700 hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
