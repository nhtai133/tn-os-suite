"use client";

import { useState } from "react";
import type { StocksSnapshot } from "@/lib/wealth-sync-types";

const USD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

interface Props {
  snapshot: StocksSnapshot;
  onDownload: () => void;
}

export function WealthExportCard({ snapshot, onDownload }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const plPct = snapshot.investedCapital > 0
    ? ((snapshot.unrealizedPL / snapshot.investedCapital) * 100)
    : 0;

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 space-y-4 overflow-hidden">
      {/* Summary */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Stocks OS Snapshot</div>
          <span className="text-xs text-zinc-500">v{snapshot.version} · {new Date(snapshot.generatedAt).toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
            <div className="text-zinc-500 mb-0.5">Total Value</div>
            <div className="text-white font-semibold">{USD(snapshot.totalValue)}</div>
          </div>
          <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
            <div className="text-zinc-500 mb-0.5">Invested</div>
            <div className="text-zinc-200">{USD(snapshot.investedCapital)}</div>
          </div>
          <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
            <div className="text-zinc-500 mb-0.5">Unrealized P/L</div>
            <div className={snapshot.unrealizedPL >= 0 ? "text-emerald-400" : "text-red-400"}>
              {snapshot.unrealizedPL >= 0 ? "+" : ""}{USD(snapshot.unrealizedPL)} ({plPct >= 0 ? "+" : ""}{plPct.toFixed(1)}%)
            </div>
          </div>
          <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
            <div className="text-zinc-500 mb-0.5">Monthly Income</div>
            <div className="text-emerald-400">{USD(snapshot.monthlyIncome)}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handleCopy}
            className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-medium transition-colors">
            {copied ? "Copied ✓" : "Copy JSON"}
          </button>
          <button onClick={onDownload}
            className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition-colors">
            Download JSON
          </button>
        </div>
      </div>

      {/* JSON preview */}
      <div className="border-t border-zinc-800 bg-zinc-950/60 px-5 py-3 max-h-64 overflow-y-auto">
        <pre className="text-xs text-zinc-500 font-mono leading-relaxed">
          {JSON.stringify(snapshot, null, 2)}
        </pre>
      </div>
    </div>
  );
}
