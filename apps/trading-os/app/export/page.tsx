"use client";

import { useState, useCallback } from "react";
import { buildSnapshot, downloadSnapshot, snapshotToJSON } from "@tn-os/sync";
import { buildRiskMetrics } from "@/app/_lib/risk-metrics";
import { buildSetupMetrics } from "@/app/_lib/trading-metrics";
import { readStoredMt5Report } from "@/app/_lib/mt5-local-storage";
import { readManualTrades } from "@/app/_lib/manual-trade-storage";
import { readStoredPropAccounts } from "@/app/_lib/prop-account-storage";
import { readRiskSettings } from "@/app/_lib/risk-settings-storage";
import { readReviewNotes } from "@/app/_lib/review-notes-storage";
import { readTradeJournalOverrides } from "@/app/_lib/trade-journal-storage";
import type { Trade } from "@/app/_lib/trading-types";
import type { TradingOSSummary } from "@tn-os/schemas";
import { AppShell } from "@/app/_components/app-shell";

function getISOWeekStart(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

function getMonthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function parseTradeDateMs(trade: Trade): number {
  const raw = trade.closeTime ?? trade.date ?? "";
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function computeWeeklyPnl(trades: Trade[]): number {
  const weekStart = getISOWeekStart().getTime();
  return trades
    .filter((t) => t.status !== "Open" && parseTradeDateMs(t) >= weekStart)
    .reduce((s, t) => s + t.pnl, 0);
}

function computeMonthlyPnl(trades: Trade[]): number {
  const monthStart = getMonthStart().getTime();
  return trades
    .filter((t) => t.status !== "Open" && parseTradeDateMs(t) >= monthStart)
    .reduce((s, t) => s + t.pnl, 0);
}

function computeWinRate(trades: Trade[]): number {
  const closed = trades.filter((t) => t.status !== "Open");
  if (closed.length === 0) return 0;
  return (closed.filter((t) => t.result === "Win").length / closed.length) * 100;
}

function computeProfitFactor(trades: Trade[]): number {
  const closed = trades.filter((t) => t.status !== "Open");
  const grossProfit = closed.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(closed.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  return grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
}

function getMostCommonMistake(trades: Trade[], journalOverrides: Record<string, { mistake?: string }>): string | undefined {
  const counts = new Map<string, number>();
  trades.forEach((t) => {
    const journal = journalOverrides[t.id];
    const mistake = t.mistake ?? journal?.mistake;
    if (mistake) counts.set(mistake, (counts.get(mistake) ?? 0) + 1);
  });
  if (counts.size === 0) return undefined;
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

function buildTradingSnapshot(): ReturnType<typeof buildSnapshot> {
  const report = readStoredMt5Report();
  const manualTrades = readManualTrades();
  const propAccounts = readStoredPropAccounts();
  const riskSettings = readRiskSettings();
  const reviewNotes = readReviewNotes();
  const journalOverrides = readTradeJournalOverrides();

  const allTrades: Trade[] = [
    ...(report?.trades ?? []),
    ...manualTrades,
  ];
  const closedTrades = allTrades.filter((t) => t.status !== "Open");
  const openPositions = allTrades.filter((t) => t.status === "Open");

  const riskMetrics = buildRiskMetrics({ report, settings: riskSettings, trades: allTrades });
  const setupMetrics = buildSetupMetrics(allTrades);

  const totalEquity = report?.equity ?? riskMetrics.equity;
  const totalNetProfit = report?.totalNetProfit ?? riskMetrics.netProfit;
  const maxDrawdownPct = riskMetrics.maxLossUsage > 0
    ? (riskMetrics.maxLossUsage / 100) * riskSettings.maxLossLimitPercent
    : 0;

  const weeklyPnl = computeWeeklyPnl(allTrades);
  const monthlyPnl = computeMonthlyPnl(allTrades);
  const winRate = computeWinRate(allTrades);
  const profitFactor = computeProfitFactor(allTrades);

  const bestSetup = setupMetrics[0];
  const worstMistake = getMostCommonMistake(allTrades, journalOverrides);

  const ruleViolations = riskMetrics.warnings.map((w) => `${w.label}: ${w.detail}`);

  const currentWeekKey = getISOWeekStart().toISOString().split("T")[0] ?? "";
  const focusSetupNextWeek = reviewNotes.weekly[currentWeekKey] ?? undefined;

  const summary: TradingOSSummary = {
    total_equity: totalEquity,
    account_count: propAccounts.length + (report ? 1 : 0),
    prop_account_count: propAccounts.length,
    weekly_pnl: weeklyPnl,
    monthly_pnl: monthlyPnl,
    total_net_profit: totalNetProfit,
    max_drawdown_pct: maxDrawdownPct,
    ftmo_risk_status: riskMetrics.riskLevel,
    daily_loss_usage_pct: riskMetrics.dailyLossUsage,
    max_loss_usage_pct: riskMetrics.maxLossUsage,
    discipline_score: riskMetrics.disciplineScore,
    best_setup: bestSetup?.setupTag,
    best_setup_win_rate_pct: bestSetup?.winRate,
    worst_mistake: worstMistake,
    rule_violations: ruleViolations,
    focus_setup_next_week: focusSetupNextWeek,
    win_rate_pct: winRate,
    profit_factor: profitFactor,
    total_trades: allTrades.length,
    closed_trades: closedTrades.length,
    open_positions: openPositions.length,
    currency: "USD",
    accounts: propAccounts.map((acc) => ({
      account_name: acc.accountName,
      account_size: acc.accountSize,
      lifecycle_type: acc.lifecycleType,
      lifecycle_status: acc.lifecycleStatus,
    })),
  };

  return buildSnapshot({
    osType: "trading_os",
    owner: "nhtai133",
    summary: summary as unknown as Record<string, unknown>,
    entities: {
      prop_accounts: propAccounts,
      trade_count: allTrades.length,
      setup_metrics: setupMetrics.slice(0, 5),
    },
    metrics: {
      win_rate_pct: winRate,
      profit_factor: profitFactor,
      discipline_score: riskMetrics.disciplineScore,
      daily_loss_usage_pct: riskMetrics.dailyLossUsage,
      max_loss_usage_pct: riskMetrics.maxLossUsage,
      total_net_profit: totalNetProfit,
    },
    risks: ruleViolations,
    aiContext: {
      trading_summary: `${allTrades.length} trades total, ${winRate.toFixed(1)}% win rate, ${riskMetrics.riskLevel} risk status`,
      best_setup: bestSetup ? `${bestSetup.setupTag} (${bestSetup.winRate.toFixed(1)}% WR, ${bestSetup.netProfit.toFixed(0)} net)` : "No data",
      worst_mistake: worstMistake ?? "None recorded",
      focus_next_week: focusSetupNextWeek ?? "Not set",
      weekly_pnl_usd: weeklyPnl.toFixed(2),
      monthly_pnl_usd: monthlyPnl.toFixed(2),
    },
  });
}

type SnapshotStatus = { type: "idle" } | { type: "success"; json: string } | { type: "error"; message: string };

function StatusRow({ label, value, color = "text-slate-300" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-medium ${color}`}>{value}</span>
    </div>
  );
}

export default function ExportPage() {
  const [status, setStatus] = useState<SnapshotStatus>({ type: "idle" });
  const [previewJson, setPreviewJson] = useState<string | null>(null);

  const handlePreview = useCallback(() => {
    try {
      const snap = buildTradingSnapshot();
      const json = snapshotToJSON(snap);
      setPreviewJson(json);
      setStatus({ type: "success", json });
    } catch (err) {
      setStatus({ type: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  }, []);

  const handleDownload = useCallback(() => {
    try {
      const snap = buildTradingSnapshot();
      downloadSnapshot(snap);
      setStatus({ type: "success", json: snapshotToJSON(snap) });
    } catch (err) {
      setStatus({ type: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  }, []);

  const report = typeof window !== "undefined" ? readStoredMt5Report() : null;
  const propAccounts = typeof window !== "undefined" ? readStoredPropAccounts() : [];
  const manualTrades = typeof window !== "undefined" ? readManualTrades() : [];
  const allTradeCount = (report?.trades.length ?? 0) + manualTrades.length;
  const riskSettings = typeof window !== "undefined" ? readRiskSettings() : { dailyLossLimitPercent: 5, maxLossLimitPercent: 10, profitTargetPercent: 10 };

  return (
    <AppShell eyebrow="Trading OS" title="Export Snapshot">
      <div className="space-y-6 max-w-3xl">

        {/* Status banner */}
        {status.type === "success" && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
            ✓ Snapshot built successfully — ready to import into TN Life OS.
          </div>
        )}
        {status.type === "error" && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            ✗ Error: {status.message}
          </div>
        )}

        {/* Data inventory */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-4">Data Inventory</h2>
          <StatusRow label="MT5 Report" value={report ? `✓ ${report.name}` : "Not imported"} color={report ? "text-emerald-400" : "text-slate-600"} />
          <StatusRow label="Prop Accounts" value={propAccounts.length} color={propAccounts.length > 0 ? "text-emerald-400" : "text-slate-600"} />
          <StatusRow label="Manual Trades" value={manualTrades.length} />
          <StatusRow label="Total Trades" value={allTradeCount} />
          <StatusRow label="Risk Settings" value={`DD ${riskSettings.dailyLossLimitPercent}% / ${riskSettings.maxLossLimitPercent}%`} />
          <StatusRow label="Schema Version" value="1.0.0" color="text-cyan-400" />
          <StatusRow label="OS Type" value="trading_os" color="text-cyan-400" />
        </div>

        {/* Export fields */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-4">Exported Summary Fields</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500">
            {[
              "total_equity", "account_count", "prop_account_count",
              "weekly_pnl", "monthly_pnl", "total_net_profit",
              "max_drawdown_pct", "ftmo_risk_status", "daily_loss_usage_pct",
              "max_loss_usage_pct", "discipline_score", "best_setup",
              "best_setup_win_rate_pct", "worst_mistake", "rule_violations",
              "focus_setup_next_week", "win_rate_pct", "profit_factor",
              "total_trades", "closed_trades", "open_positions",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 py-0.5">
                <span className="text-emerald-600">✓</span>
                <code className="text-slate-400">{f}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            className="px-4 py-2 rounded-lg border border-white/10 bg-slate-900 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Preview JSON
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-sm text-cyan-300 hover:bg-cyan-500/20 transition-colors font-medium"
          >
            Download .tnos.json
          </button>
        </div>

        {/* JSON preview */}
        {previewJson && (
          <div className="rounded-xl border border-white/10 bg-black/40 px-5 py-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3">JSON Preview</h2>
            <pre className="text-xs text-slate-400 overflow-auto max-h-96 font-mono leading-relaxed">
              {previewJson}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3">How to sync with TN Life OS</h2>
          <ol className="space-y-2 text-sm text-slate-400 list-decimal list-inside">
            <li>Click <strong className="text-slate-200">Download .tnos.json</strong> above.</li>
            <li>Open <strong className="text-slate-200">TN Life OS</strong> on port 3000.</li>
            <li>Go to <strong className="text-slate-200">Import Snapshots</strong>.</li>
            <li>Drop the downloaded file or click Browse.</li>
            <li>The CEO Dashboard Trading widget will populate.</li>
          </ol>
        </div>

      </div>
    </AppShell>
  );
}
