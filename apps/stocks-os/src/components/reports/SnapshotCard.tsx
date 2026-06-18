"use client";

import { useState } from "react";
import type { PortfolioSnapshot } from "@/lib/snapshot-types";

function fmtUSD(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

interface Props {
  portfolioId: string;
  portfolioName: string;
  currentValue: number;
  currentPnL: number;
  currentReturnPct: number;
  currentHoldings: number;
  lastSnapshot: PortfolioSnapshot | undefined;
  onTakeSnapshot: () => void;
}

export function SnapshotCard({
  portfolioName,
  currentValue,
  currentPnL,
  currentReturnPct,
  currentHoldings,
  lastSnapshot,
  onTakeSnapshot,
}: Props) {
  const [saved, setSaved] = useState(false);

  function handleSnapshot() {
    onTakeSnapshot();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const deltaValue = lastSnapshot ? currentValue - lastSnapshot.value : null;
  const deltaPct =
    lastSnapshot && lastSnapshot.value > 0
      ? ((currentValue - lastSnapshot.value) / lastSnapshot.value) * 100
      : null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-zinc-200 truncate">{portfolioName}</div>
          <div className="text-xs text-zinc-600 mt-0.5">{currentHoldings} holdings</div>
        </div>
        <button
          onClick={handleSnapshot}
          className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            saved
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 border border-zinc-700"
          }`}
        >
          {saved ? "Saved ✓" : "Snapshot"}
        </button>
      </div>

      {/* Current value */}
      <div>
        <div className="text-xl font-bold text-white">{fmtUSD(currentValue)}</div>
        <div
          className={`text-xs font-medium mt-0.5 ${
            currentPnL >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {currentPnL >= 0 ? "+" : ""}
          {fmtUSD(currentPnL)} ({currentReturnPct >= 0 ? "+" : ""}
          {currentReturnPct.toFixed(2)}%)
        </div>
      </div>

      {/* Delta from last snapshot */}
      {deltaValue !== null && deltaPct !== null ? (
        <div className="text-xs border-t border-zinc-800 pt-2.5">
          <span className="text-zinc-600">Since last snapshot: </span>
          <span className={deltaValue >= 0 ? "text-emerald-400" : "text-red-400"}>
            {deltaValue >= 0 ? "+" : ""}
            {fmtUSD(deltaValue)} ({deltaPct >= 0 ? "+" : ""}
            {deltaPct.toFixed(1)}%)
          </span>
        </div>
      ) : (
        <div className="text-xs border-t border-zinc-800 pt-2.5 text-zinc-700">
          No snapshot yet
        </div>
      )}

      {/* Last snapshot date */}
      {lastSnapshot && (
        <div className="text-xs text-zinc-700">
          Last: {relativeTime(lastSnapshot.takenAt)}
        </div>
      )}
    </div>
  );
}
