"use client";

import { useState } from "react";
import { useInvestmentStore } from "@/store/useInvestmentStore";
import { buildSnapshot, downloadSnapshot, snapshotToJSON } from "@tn-os/sync";
import { Card, Button, Badge } from "@tn-os/ui";
import { InvestmentOSEntitiesSchema, InvestmentOSSummarySchema, type InvestmentOSSummary } from "@tn-os/schemas";

export default function ExportPage() {
  const store = useInvestmentStore();
  const [preview, setPreview] = useState<string | null>(null);

  function buildInvestmentSnapshot() {
    const totalCost = store.funds.reduce((s, f) => s + f.cost_basis, 0);
    const totalValue = store.funds.reduce((s, f) => s + f.current_value, 0);
    const cashFund = store.funds.find((f) => f.category === "cash");
    const dcaTotal = store.buy_plans.reduce((s, p) => s + (p.currency === "VND" ? p.amount : p.amount * 25000), 0);

    const highConviction = store.funds.filter((f) => f.conviction === "high");
    const convictionScore = highConviction.length > store.funds.length / 2 ? "high" : store.funds.length > 0 ? "medium" : "low";

    const summary: InvestmentOSSummary = {
      total_invested_capital: totalCost,
      total_current_value: totalValue,
      total_gain_loss: totalValue - totalCost,
      total_gain_loss_pct: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
      cash_waiting_deployment: cashFund?.current_value ?? 0,
      num_funds: store.funds.length,
      dca_monthly_amount: dcaTotal,
      conviction_score: convictionScore,
      next_buy_zones: store.funds.filter((f) => f.next_buy_zone).map((f) => `${f.name}: ${f.next_buy_zone}`),
      fund_review_notes: `${store.funds.length} funds tracked. ${store.watchlist.length} items on watchlist.`,
      currency: "VND",
    };

    const entities = {
      funds: store.funds,
      buy_plans: store.buy_plans,
      watchlist: store.watchlist,
      rebalancing_logs: store.rebalancing_logs,
    };

    InvestmentOSSummarySchema.parse(summary);
    InvestmentOSEntitiesSchema.parse(entities);

    return buildSnapshot({
      osType: "investment_os",
      owner: "nhtai133",
      summary: summary as unknown as Record<string, unknown>,
      entities,
      metrics: {
        total_gain_loss_pct: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
        allocation_drift_max: Math.max(...store.funds.map((f) => {
          const pct = totalValue > 0 ? (f.current_value / totalValue) * 100 : 0;
          return Math.abs(pct - f.target_allocation_pct);
        }), 0),
      },
      risks: store.funds
        .filter((f) => {
          const pct = totalValue > 0 ? (f.current_value / totalValue) * 100 : 0;
          return Math.abs(pct - f.target_allocation_pct) > 5;
        })
        .map((f) => {
          const pct = totalValue > 0 ? (f.current_value / totalValue) * 100 : 0;
          return `${f.name} is ${(pct - f.target_allocation_pct).toFixed(1)}% off target allocation`;
        }),
      aiContext: {
        portfolio_summary: `${store.funds.length} funds, total value ${totalValue.toLocaleString()} VND, ${convictionScore} conviction`,
        watchlist_summary: store.watchlist.map((w) => w.name).join(", "),
        next_actions: store.buy_plans.map((p) => {
          const fund = store.funds.find((f) => f.id === p.fund_id);
          return `${p.frequency} buy of ${p.amount} ${p.currency} into ${fund?.name ?? p.fund_id} on ${p.next_date}`;
        }),
      },
    });
  }

  function handlePreview() {
    const snap = buildInvestmentSnapshot();
    setPreview(snapshotToJSON(snap));
  }

  function handleDownload() {
    const snap = buildInvestmentSnapshot();
    downloadSnapshot(snap);
  }

  if (!store.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const hasData = store.funds.length > 0;

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Export Snapshot</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Generate a <code className="text-blue-400">.tnos.json</code> file to import into TN Life OS</p>
      </div>

      <Card title="Export Status">
        <div className="space-y-3 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Funds</span>
            <Badge variant={store.funds.length > 0 ? "success" : "warning"}>{store.funds.length} records</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Buy Plans</span>
            <Badge variant={store.buy_plans.length > 0 ? "success" : "neutral"}>{store.buy_plans.length} records</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Watchlist</span>
            <Badge variant={store.watchlist.length > 0 ? "success" : "neutral"}>{store.watchlist.length} items</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Schema Version</span>
            <Badge variant="info">1.0.0</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">OS Type</span>
            <Badge variant="info">investment_os</Badge>
          </div>
        </div>
      </Card>

      {!hasData && (
        <Card>
          <div className="text-center py-6">
            <p className="text-zinc-500 mb-4">No data to export yet.</p>
            <Button variant="secondary" onClick={store.seedSampleData}>Load Sample Data First</Button>
          </div>
        </Card>
      )}

      {hasData && (
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handlePreview}>Preview JSON</Button>
          <Button variant="primary" onClick={handleDownload}>Download .tnos.json</Button>
        </div>
      )}

      {preview && (
        <Card title="JSON Preview">
          <pre className="text-xs text-zinc-400 overflow-auto max-h-96 mt-2 font-mono leading-relaxed">
            {preview}
          </pre>
        </Card>
      )}
    </div>
  );
}
