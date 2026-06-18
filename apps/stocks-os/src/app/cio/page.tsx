"use client";

import { useMemo } from "react";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { useDividendStore } from "@/store/useDividendStore";
import { useWatchlistStore } from "@/store/useWatchlistStore";
import { useThesisStore } from "@/store/useThesisStore";
import { useRebalanceStore } from "@/store/useRebalanceStore";
import { computeHealthScore, getRiskAlerts, getReviewChecklist } from "@/lib/cio-engine";
import { PortfolioScoreCard } from "@/components/cio/PortfolioScoreCard";
import { RiskAlertCard } from "@/components/cio/RiskAlertCard";
import { ReviewChecklist } from "@/components/cio/ReviewChecklist";

export default function CIOPage() {
  const portfolioStore = usePortfolioStore();
  const dividendStore = useDividendStore();
  const watchlistStore = useWatchlistStore();
  const thesisStore = useThesisStore();
  const rebalanceStore = useRebalanceStore();

  const hydrated =
    portfolioStore.hydrated &&
    dividendStore.hydrated &&
    watchlistStore.hydrated &&
    thesisStore.hydrated &&
    rebalanceStore.hydrated;

  const healthScore = useMemo(
    () => computeHealthScore(portfolioStore.holdings, thesisStore.theses, dividendStore.events, watchlistStore.items),
    [portfolioStore.holdings, thesisStore.theses, dividendStore.events, watchlistStore.items]
  );

  const alerts = useMemo(
    () => getRiskAlerts(portfolioStore.holdings, thesisStore.theses, watchlistStore.items, rebalanceStore.targets, dividendStore.events),
    [portfolioStore.holdings, thesisStore.theses, watchlistStore.items, rebalanceStore.targets, dividendStore.events]
  );

  const checklist = useMemo(
    () => getReviewChecklist(thesisStore.theses, watchlistStore.items),
    [thesisStore.theses, watchlistStore.items]
  );

  if (!hydrated) {
    return <div className="p-8 text-zinc-600 animate-pulse">Loading CIO engine...</div>;
  }

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount  = alerts.filter((a) => a.severity === "warning").length;
  const urgentItems   = checklist.filter((c) => c.urgent).length;

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI CIO</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Portfolio health · Risk alerts · Review reminders — rule-based engine</p>
        </div>
        <div className="flex gap-2 text-xs">
          {criticalCount > 0 && (
            <span className="px-2 py-1 rounded-full bg-red-500/15 text-red-400 font-medium">
              {criticalCount} critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 font-medium">
              {warningCount} warnings
            </span>
          )}
          {urgentItems > 0 && (
            <span className="px-2 py-1 rounded-full bg-sky-500/15 text-sky-400 font-medium">
              {urgentItems} urgent
            </span>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg bg-zinc-800/40 border border-zinc-700/50 px-4 py-2.5 text-xs text-zinc-500">
        Rule-based engine — not financial advice. Future versions will integrate Claude AI for deeper analysis.
      </div>

      {/* Health Score */}
      <section>
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Portfolio Health Score</div>
        <PortfolioScoreCard score={healthScore} />
      </section>

      {/* Risk Alerts */}
      <section>
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          Risk Alerts
          {alerts.length > 0 && (
            <span className="ml-2 normal-case text-zinc-600 font-normal">{alerts.length} active</span>
          )}
        </div>
        <RiskAlertCard alerts={alerts} />
      </section>

      {/* Review Checklist */}
      <section>
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          Review Checklist
          {checklist.length > 0 && (
            <span className="ml-2 normal-case text-zinc-600 font-normal">{checklist.length} items</span>
          )}
        </div>
        <ReviewChecklist items={checklist} />
      </section>

      {/* Quick stats */}
      <section>
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Data Summary</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Holdings",   value: portfolioStore.holdings.length },
            { label: "Watchlist",  value: watchlistStore.items.length },
            { label: "Theses",     value: thesisStore.theses.length },
            { label: "Dividends",  value: dividendStore.events.length },
            { label: "RebTargets", value: rebalanceStore.targets.length },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-center">
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
