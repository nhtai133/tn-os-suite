"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useStocksStore, toUSD } from "@/store/useStocksStore";
import { buildSnapshot, downloadSnapshot, snapshotToJSON, validateSnapshot } from "@tn-os/sync";
import { Badge, Button, Card } from "@tn-os/ui";
import { StocksOSSummarySchema, type StocksOSSummary } from "@tn-os/schemas";

type Status =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

function buildStocksSnapshot(store: ReturnType<typeof useStocksStore>) {
  const topHoldings = [...store.holdings]
    .sort((a, b) => toUSD(b.shares * b.current_price, b.currency) - toUSD(a.shares * a.current_price, a.currency))
    .slice(0, 5)
    .map((holding) => holding.symbol);

  const overvalued = store.valuation_notes.filter((note) => note.verdict === "overvalued");
  const triggeredSellRules = store.sell_rules.filter((rule) => rule.status === "triggered");
  const activeSellRules = store.sell_rules.filter((rule) => rule.status === "active");
  const riskNotes = [
    ...overvalued.map((note) => `${note.symbol} is marked overvalued.`),
    ...triggeredSellRules.map((rule) => `${rule.symbol} sell rule triggered: ${rule.trigger}`),
    store.holdings.length > 0 && activeSellRules.length === 0 ? "No active sell rules are defined for current holdings." : "",
  ].filter(Boolean);

  const nextActions = [
    ...store.buy_zones
      .filter((zone) => zone.status === "waiting" || zone.status === "active")
      .slice(0, 3)
      .map((zone) => `Monitor ${zone.symbol} buy zone ${zone.zone_low.toLocaleString()}-${zone.zone_high.toLocaleString()} ${zone.currency}.`),
    ...activeSellRules.slice(0, 3).map((rule) => `Review ${rule.symbol} sell rule: ${rule.trigger}`),
    store.watchlist.length > 0 ? `Review ${store.watchlist.length} watchlist candidate${store.watchlist.length === 1 ? "" : "s"}.` : "",
  ].filter(Boolean);

  const summary: StocksOSSummary = {
    total_stock_value_usd: store.totalStockValueUSD,
    total_positions: store.holdings.length,
    cash_available_usd: store.cash_available_usd,
    annual_dividend_income_usd: store.annualDividendIncomeUSD,
    sector_allocation: store.sectorAllocation,
    top_holdings: topHoldings,
    target_vcb_shares: store.targetVCBShares,
    target_vcb_progress_pct: store.targetVCBProgressPct,
    target_acb_shares: store.targetACBShares,
    target_acb_progress_pct: store.targetACBProgressPct,
    valuation_risk: store.valuationRisk,
    watchlist_count: store.watchlist.length,
    buy_zones_active: store.activeBuyZones,
    stocks_risk_notes: riskNotes,
    next_actions: nextActions,
    currency: "USD",
  };

  StocksOSSummarySchema.parse(summary);

  const snapshot = buildSnapshot({
    osType: "stocks_os",
    owner: "nhtai133",
    summary: summary as unknown as Record<string, unknown>,
    entities: {
      holdings: store.holdings,
      watchlist: store.watchlist,
      dividends: store.dividends,
      valuation_notes: store.valuation_notes,
      targets: store.targets,
      theses: store.theses,
      buy_zones: store.buy_zones,
      sell_rules: store.sell_rules,
    },
    metrics: {
      total_stock_value_usd: store.totalStockValueUSD,
      annual_dividend_income_usd: store.annualDividendIncomeUSD,
      active_buy_zones: store.activeBuyZones,
      active_sell_rules: activeSellRules.length,
      triggered_sell_rules: triggeredSellRules.length,
      valuation_risk: store.valuationRisk,
    },
    risks: riskNotes,
    aiContext: {
      portfolio_summary: `${store.holdings.length} stock positions worth $${store.totalStockValueUSD.toFixed(0)} with ${store.valuationRisk} valuation risk`,
      top_holdings: topHoldings.join(", "),
      income_summary: `$${store.annualDividendIncomeUSD.toFixed(0)} annual dividend income recorded`,
      next_actions: nextActions,
    },
  });

  const validation = validateSnapshot(snapshot);
  if (!validation.success) {
    throw new Error(validation.errors.join("; "));
  }

  return snapshot;
}

export default function ExportPage() {
  const store = useStocksStore();
  const storeRef = useRef(store);
  storeRef.current = store;
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!store.hydrated) return;
    if (window.parent !== window) window.parent.postMessage({ type: "TNOS_READY" }, "*");
  }, [store.hydrated]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if ((event.data as { type?: string }).type !== "TNOS_SNAPSHOT_REQUEST") return;
      try {
        const snapshot = buildStocksSnapshot(storeRef.current);
        (event.source as Window | null)?.postMessage(
          { type: "TNOS_SNAPSHOT_RESPONSE", payload: JSON.stringify(snapshot) },
          event.origin
        );
      } catch {
        (event.source as Window | null)?.postMessage(
          { type: "TNOS_SNAPSHOT_RESPONSE", payload: null },
          event.origin
        );
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handlePreview = useCallback(() => {
    try {
      const snapshot = buildStocksSnapshot(store);
      setPreview(snapshotToJSON(snapshot));
      setStatus({ type: "success", message: "Snapshot validated successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Unknown export error" });
    }
  }, [store]);

  const handleDownload = useCallback(() => {
    try {
      const snapshot = buildStocksSnapshot(store);
      downloadSnapshot(snapshot);
      setStatus({ type: "success", message: "Snapshot downloaded successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Unknown export error" });
    }
  }, [store]);

  if (!store.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const hasData = store.holdings.length > 0 || store.watchlist.length > 0 || store.sell_rules.length > 0;

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Export Snapshot</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Generate a <code className="text-sky-400">.tnos.json</code> file to import into TN Life OS
        </p>
      </div>

      {status.type === "success" && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
          {status.message}
        </div>
      )}
      {status.type === "error" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          Error: {status.message}
        </div>
      )}

      {!hasData && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
          No Stocks OS data loaded yet. Load sample data or add portfolio records before exporting.
        </div>
      )}

      <Card title="Export Status">
        <div className="space-y-2">
          {[
            ["Holdings", store.holdings.length],
            ["Watchlist", store.watchlist.length],
            ["Dividends", store.dividends.length],
            ["Valuation Notes", store.valuation_notes.length],
            ["Target Positions", store.targets.length],
            ["Company Theses", store.theses.length],
            ["Buy Zones", store.buy_zones.length],
            ["Sell Rules", store.sell_rules.length],
          ].map(([label, count]) => (
            <div key={String(label)} className="flex items-center justify-between py-1.5 border-b border-zinc-800/60 last:border-0">
              <span className="text-sm text-zinc-400">{label}</span>
              <Badge variant={Number(count) > 0 ? "success" : "neutral"}>{count} records</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Stocks OS Summary">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {[
            ["Total Stock Value", `$${store.totalStockValueUSD.toFixed(0)}`],
            ["Cash Available", `$${store.cash_available_usd.toFixed(0)}`],
            ["Annual Dividends", `$${store.annualDividendIncomeUSD.toFixed(0)}`],
            ["Valuation Risk", store.valuationRisk.toUpperCase()],
            ["VCB Target", `${store.targetVCBShares} shares (${store.targetVCBProgressPct.toFixed(0)}%)`],
            ["ACB Target", `${store.targetACBShares} shares (${store.targetACBProgressPct.toFixed(0)}%)`],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-zinc-500">{label}</span>
              <span className="text-zinc-200 font-medium">{value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Exported Summary Fields">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-zinc-500">
          {[
            "total_stock_value_usd",
            "total_positions",
            "cash_available_usd",
            "annual_dividend_income_usd",
            "sector_allocation",
            "top_holdings",
            "target_vcb_shares",
            "target_vcb_progress_pct",
            "target_acb_shares",
            "target_acb_progress_pct",
            "valuation_risk",
            "watchlist_count",
            "buy_zones_active",
            "stocks_risk_notes",
            "next_actions",
            "currency",
          ].map((field) => (
            <div key={field} className="flex items-center gap-2 py-0.5">
              <span className="text-sky-500">ok</span>
              <code className="text-zinc-400">{field}</code>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={handlePreview}>Preview JSON</Button>
        <Button variant="primary" onClick={handleDownload} disabled={!hasData}>Download .tnos.json</Button>
      </div>

      {preview && (
        <Card title="JSON Preview">
          <pre className="text-xs text-zinc-400 overflow-auto max-h-96 font-mono leading-relaxed">
            {preview}
          </pre>
        </Card>
      )}
    </div>
  );
}
