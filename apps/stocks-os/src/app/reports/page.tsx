"use client";

import { useState } from "react";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { useSnapshotStore } from "@/store/useSnapshotStore";
import { STOCK_PORTFOLIOS } from "@/lib/portfolio-registry";
import {
  holdingsToCsv,
  transactionsToCsv,
  portfolioToJson,
  allPortfoliosToJson,
  downloadFile,
  fileTimestamp,
  safeFilename,
} from "@/lib/export-utils";
import type { HistoryEntry } from "@/lib/snapshot-types";
import { ReportCard } from "@/components/reports/ReportCard";
import { ExportButton } from "@/components/reports/ExportButton";
import { SnapshotCard } from "@/components/reports/SnapshotCard";
import { PortfolioHistoryTable } from "@/components/reports/PortfolioHistoryTable";

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

type HistoryTab = "global" | string;

export default function ReportsPage() {
  const store = usePortfolioStore();
  const snapshots = useSnapshotStore();
  const [historyTab, setHistoryTab] = useState<HistoryTab>("global");

  if (!store.hydrated || !snapshots.hydrated) {
    return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;
  }

  const g = store.globalMetrics;
  const ts = fileTimestamp();
  const lastGlobal = snapshots.globalSnapshots[0];

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleGlobalSnapshot() {
    snapshots.takeGlobalSnapshot(g);
  }

  function handlePortfolioSnapshot(portfolioId: string, portfolioName: string) {
    const metrics = store.getPortfolioMetrics(portfolioId);
    snapshots.takePortfolioSnapshot(portfolioId, portfolioName, metrics);
  }

  // Export: per portfolio
  function exportPortfolioHoldings(portfolioId: string, name: string) {
    const holdings = store.getPortfolioHoldings(portfolioId);
    downloadFile(holdingsToCsv(holdings), `${safeFilename(name)}-holdings-${ts}.csv`, "text/csv");
  }

  function exportPortfolioTransactions(portfolioId: string, name: string) {
    const txs = store.getPortfolioTransactions(portfolioId);
    downloadFile(transactionsToCsv(txs), `${safeFilename(name)}-transactions-${ts}.csv`, "text/csv");
  }

  function exportPortfolioJson(portfolioId: string, name: string) {
    const portfolio = store.portfolios.find((p) => p.id === portfolioId);
    if (!portfolio) return;
    const holdings = store.getPortfolioHoldings(portfolioId);
    const txs = store.getPortfolioTransactions(portfolioId);
    downloadFile(portfolioToJson(portfolio, holdings, txs), `${safeFilename(name)}-${ts}.json`, "application/json");
  }

  // Export: all portfolios
  function exportAllHoldings() {
    downloadFile(holdingsToCsv(store.holdings), `all-portfolios-holdings-${ts}.csv`, "text/csv");
  }

  function exportAllTransactions() {
    downloadFile(transactionsToCsv(store.transactions), `all-portfolios-transactions-${ts}.csv`, "text/csv");
  }

  function exportAllJson() {
    downloadFile(
      allPortfoliosToJson(store.portfolios, store.holdings, store.transactions),
      `all-portfolios-${ts}.json`,
      "application/json"
    );
  }

  // ── History entries ──────────────────────────────────────────────────────────

  const historyEntries: HistoryEntry[] =
    historyTab === "global"
      ? snapshots.globalSnapshots.map((s) => ({
          id: s.id,
          takenAt: s.takenAt,
          value: s.totalValue,
          investedCapital: s.totalInvested,
          unrealizedPnL: s.totalUnrealized,
          realizedPnL: s.totalRealized,
          totalReturnPct:
            s.totalInvested > 0
              ? ((s.totalUnrealized + s.totalRealized) / s.totalInvested) * 100
              : 0,
          holdingCount: s.totalHoldings,
        }))
      : snapshots.getPortfolioSnapshots(historyTab).map((s) => ({
          id: s.id,
          takenAt: s.takenAt,
          value: s.value,
          investedCapital: s.investedCapital,
          unrealizedPnL: s.unrealizedPnL,
          realizedPnL: s.realizedPnL,
          totalReturnPct: s.totalReturnPct,
          holdingCount: s.holdingCount,
        }));

  function handleDeleteHistory(id: string) {
    if (historyTab === "global") {
      snapshots.deleteGlobalSnapshot(id);
    } else {
      snapshots.deletePortfolioSnapshot(id);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const totalPnLPct =
    g.totalInvested > 0
      ? ((g.totalUnrealized + g.totalRealized) / g.totalInvested) * 100
      : 0;

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Snapshots</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Track portfolio history, export data, and review performance over time
          </p>
        </div>
        <button
          onClick={handleGlobalSnapshot}
          className="shrink-0 px-4 py-2 rounded-lg bg-sky-600 text-sm font-medium text-white hover:bg-sky-500 transition-colors"
        >
          Take Global Snapshot
        </button>
      </div>

      {/* ── Global state banner ─────────────────────────────────────────────── */}
      <ReportCard
        title="Global Portfolio State"
        subtitle={lastGlobal ? `Last snapshot: ${relativeTime(lastGlobal.takenAt)}` : "No global snapshots yet"}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Value",    value: fmtUSD(g.totalValue),    color: "text-white"       },
            { label: "Total Invested", value: fmtUSD(g.totalInvested), color: "text-zinc-400"    },
            { label: "Unrealized P/L", value: fmtUSD(g.totalUnrealized),
              color: g.totalUnrealized >= 0 ? "text-emerald-400" : "text-red-400" },
            { label: "Total Return",
              value: `${totalPnLPct >= 0 ? "+" : ""}${totalPnLPct.toFixed(2)}%`,
              color: totalPnLPct >= 0 ? "text-emerald-400" : "text-red-400" },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="text-xs text-zinc-500 mb-1">{label}</div>
              <div className={`text-lg font-semibold ${color}`}>{value}</div>
            </div>
          ))}
        </div>
        {lastGlobal && (
          <div className="mt-4 pt-4 border-t border-zinc-800/60 flex gap-6 text-xs text-zinc-600">
            <span>At last snapshot: {fmtUSD(lastGlobal.totalValue)}</span>
            <span className={
              g.totalValue - lastGlobal.totalValue >= 0 ? "text-emerald-500" : "text-red-500"
            }>
              Delta: {g.totalValue - lastGlobal.totalValue >= 0 ? "+" : ""}
              {fmtUSD(g.totalValue - lastGlobal.totalValue)}
            </span>
          </div>
        )}
      </ReportCard>

      {/* ── Portfolio snapshot cards ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Portfolio Snapshots
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STOCK_PORTFOLIOS.map((def) => {
            const metrics = store.getPortfolioMetrics(def.id);
            const lastSnap = snapshots.getPortfolioSnapshots(def.id)[0];
            return (
              <SnapshotCard
                key={def.id}
                portfolioId={def.id}
                portfolioName={def.name}
                currentValue={metrics.value}
                currentPnL={metrics.unrealizedPnL + metrics.realizedPnL}
                currentReturnPct={metrics.totalReturn.pct}
                currentHoldings={metrics.holdingCount}
                lastSnapshot={lastSnap}
                onTakeSnapshot={() => handlePortfolioSnapshot(def.id, def.name)}
              />
            );
          })}
        </div>
      </div>

      {/* ── Export ──────────────────────────────────────────────────────────── */}
      <ReportCard title="Export Data" subtitle="Download portfolio data as CSV or JSON">
        {/* All portfolios */}
        <div className="pb-4 mb-4 border-b border-zinc-800">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm font-medium text-zinc-300">All Portfolios</span>
            <div className="flex gap-2 flex-wrap">
              <ExportButton
                label="Holdings"
                format="csv"
                onClick={exportAllHoldings}
                disabled={store.holdings.length === 0}
              />
              <ExportButton
                label="Transactions"
                format="csv"
                onClick={exportAllTransactions}
                disabled={store.transactions.length === 0}
              />
              <ExportButton
                label="Full Export"
                format="json"
                onClick={exportAllJson}
                disabled={store.holdings.length === 0}
              />
            </div>
          </div>
        </div>

        {/* Per-portfolio */}
        <div className="space-y-3">
          {STOCK_PORTFOLIOS.map((def) => {
            const metrics = store.getPortfolioMetrics(def.id);
            const noData = metrics.holdingCount === 0;
            return (
              <div key={def.id} className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="text-sm text-zinc-300">{def.name}</div>
                  <div className="text-xs text-zinc-600">
                    {metrics.holdingCount} holding{metrics.holdingCount !== 1 ? "s" : ""} ·{" "}
                    {fmtUSD(metrics.value)}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap shrink-0">
                  <ExportButton
                    label="Holdings"
                    format="csv"
                    onClick={() => exportPortfolioHoldings(def.id, def.name)}
                    disabled={noData}
                  />
                  <ExportButton
                    label="Transactions"
                    format="csv"
                    onClick={() => exportPortfolioTransactions(def.id, def.name)}
                    disabled={store.getPortfolioTransactions(def.id).length === 0}
                  />
                  <ExportButton
                    label="JSON"
                    format="json"
                    onClick={() => exportPortfolioJson(def.id, def.name)}
                    disabled={noData}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </ReportCard>

      {/* ── Snapshot History ─────────────────────────────────────────────────── */}
      <ReportCard
        title="Snapshot History"
        subtitle="Review portfolio values over time"
      >
        {/* Portfolio selector tabs */}
        <div className="flex flex-wrap gap-1 mb-5 -mx-1">
          {[{ id: "global", name: "Global" }, ...STOCK_PORTFOLIOS.map((p) => ({ id: p.id, name: p.name }))].map(
            ({ id, name }) => {
              const count =
                id === "global"
                  ? snapshots.globalSnapshots.length
                  : snapshots.getPortfolioSnapshots(id).length;
              return (
                <button
                  key={id}
                  onClick={() => setHistoryTab(id)}
                  className={`mx-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    historyTab === id
                      ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent"
                  }`}
                >
                  {name}
                  {count > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-zinc-700 text-zinc-400 text-[10px]">
                      {count}
                    </span>
                  )}
                </button>
              );
            }
          )}
        </div>

        <PortfolioHistoryTable entries={historyEntries} onDelete={handleDeleteHistory} />
      </ReportCard>
    </div>
  );
}
