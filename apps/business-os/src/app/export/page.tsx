"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useBusinessStore } from "@/store/useBusinessStore";
import { buildSnapshot, downloadSnapshot, snapshotToJSON } from "@tn-os/sync";
import { Card, Badge } from "@tn-os/ui";
import type { BusinessOSSummary } from "@tn-os/schemas";

function buildBusinessSnapshot(b: ReturnType<typeof useBusinessStore>) {
  const risks: string[] = [];
  const nextGrowthActions: string[] = [];

  if (b.pendingIssues > 0) {
    risks.push(`${b.pendingIssues} client${b.pendingIssues > 1 ? "s" : ""} with pending issues requiring follow-up`);
  }
  if (b.highPriorityTasks > 3) {
    risks.push(`${b.highPriorityTasks} high-priority tasks overdue — operational bottleneck risk`);
  } else if (b.highPriorityTasks > 0) {
    risks.push(`${b.highPriorityTasks} high-priority task${b.highPriorityTasks > 1 ? "s" : ""} pending`);
  }
  if (b.netProfit < 0) {
    risks.push(`Business operating at a loss: $${b.netProfit.toFixed(0)}/mo net`);
  }
  if (b.totalMonthlyRevenue > 0 && b.monthlyExpenses / b.totalMonthlyRevenue > 0.5) {
    risks.push(`High expense ratio: ${((b.monthlyExpenses / b.totalMonthlyRevenue) * 100).toFixed(0)}% of revenue spent on expenses`);
  }

  const businessRisk: "low" | "medium" | "high" =
    risks.length >= 3 || b.pendingIssues > 2 || b.netProfit < 0
      ? "high"
      : risks.length >= 1 || b.highPriorityTasks > 2
      ? "medium"
      : "low";

  b.tasks
    .filter((t) => t.status !== "done" && t.priority === "high")
    .slice(0, 5)
    .forEach((t) => nextGrowthActions.push(t.title));

  if (nextGrowthActions.length === 0) {
    b.tasks
      .filter((t) => t.status !== "done" && t.priority === "medium" && t.category === "growth")
      .slice(0, 3)
      .forEach((t) => nextGrowthActions.push(t.title));
  }

  const netProfitMarginPct =
    b.totalMonthlyRevenue > 0 ? (b.netProfit / b.totalMonthlyRevenue) * 100 : 0;

  const summary: BusinessOSSummary = {
    monthly_revenue: b.totalMonthlyRevenue,
    monthly_expenses: b.monthlyExpenses,
    net_profit: b.netProfit,
    net_profit_margin_pct: netProfitMarginPct,
    revenue_by_channel: b.revenueByChannel,
    active_clients: b.activeClients,
    active_leads: b.activeLeads,
    total_clients: b.clients.length,
    content_output_count: b.publishedThisMonth,
    pending_client_issues: b.pendingIssues,
    active_campaigns: b.activeCampaigns,
    ib_account_count: b.ib_accounts.filter((a) => a.status === "active").length,
    partner_count: b.partners.filter((p) => p.status === "active").length,
    open_tasks: b.openTasks,
    high_priority_tasks: b.highPriorityTasks,
    business_risk: businessRisk,
    business_risk_notes: risks,
    next_growth_actions: nextGrowthActions,
    currency: "USD",
  };

  return buildSnapshot({
    osType: "business_os",
    owner: "nhtai133",
    summary: summary as unknown as Record<string, unknown>,
    entities: {
      revenue_streams: b.revenue_streams,
      clients: b.clients,
      ib_accounts: b.ib_accounts,
      partners: b.partners,
      content_assets: b.content_assets,
      campaigns: b.campaigns,
      tasks: b.tasks,
      expenses: b.expenses,
      monthly_pnl: b.monthly_pnl,
    },
    metrics: {
      monthly_revenue: b.totalMonthlyRevenue,
      monthly_expenses: b.monthlyExpenses,
      net_profit: b.netProfit,
      net_profit_margin_pct: netProfitMarginPct,
      active_clients: b.activeClients,
      active_leads: b.activeLeads,
      open_tasks: b.openTasks,
      high_priority_tasks: b.highPriorityTasks,
      active_campaigns: b.activeCampaigns,
    },
    risks,
    aiContext: {
      business_summary: `$${b.totalMonthlyRevenue.toFixed(0)}/mo revenue, $${b.netProfit.toFixed(0)}/mo net profit across ${b.revenue_streams.filter((r) => r.status === "active").length} active channels`,
      client_summary: `${b.activeClients} active clients, ${b.activeLeads} leads, ${b.pendingIssues} pending issues`,
      content_summary: `${b.publishedThisMonth} pieces published this month, ${b.calendar_items.filter((c) => c.status !== "done" && c.status !== "cancelled").length} upcoming`,
      campaign_summary: `${b.activeCampaigns} active campaigns`,
      risk_level: businessRisk,
    },
  });
}

type Status = { type: "idle" } | { type: "success" } | { type: "error"; message: string };

export default function ExportPage() {
  const b = useBusinessStore();
  const bRef = useRef(b);
  bRef.current = b;
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!b.hydrated) return;
    if (window.parent !== window) window.parent.postMessage({ type: "TNOS_READY" }, "*");
  }, [b.hydrated]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if ((event.data as { type?: string }).type !== "TNOS_SNAPSHOT_REQUEST") return;
      try {
        const snapshot = buildBusinessSnapshot(bRef.current);
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
      const snap = buildBusinessSnapshot(b);
      setPreview(snapshotToJSON(snap));
      setStatus({ type: "success" });
    } catch (err) {
      setStatus({ type: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  }, [b]);

  const handleDownload = useCallback(() => {
    try {
      const snap = buildBusinessSnapshot(b);
      downloadSnapshot(snap);
      setStatus({ type: "success" });
    } catch (err) {
      setStatus({ type: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  }, [b]);

  if (!b.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const hasData = b.revenue_streams.length > 0 || b.clients.length > 0;

  const netProfitMarginPct = b.totalMonthlyRevenue > 0 ? (b.netProfit / b.totalMonthlyRevenue) * 100 : 0;
  const businessRisk: "low" | "medium" | "high" =
    b.pendingIssues > 2 || b.netProfit < 0
      ? "high"
      : b.pendingIssues > 0 || b.highPriorityTasks > 2
      ? "medium"
      : "low";

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Export Snapshot</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Generate a <code className="text-violet-400">.tnos.json</code> file to import into TN Life OS
        </p>
      </div>

      {status.type === "success" && (
        <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 px-4 py-3 text-sm text-violet-400">
          ✓ Snapshot built successfully — import into TN Life OS to see your business data.
        </div>
      )}
      {status.type === "error" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          ✗ Error: {status.message}
        </div>
      )}

      {!hasData && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
          ⚠ No data loaded yet. Load sample data from Settings or add your own data first.
        </div>
      )}

      <Card title="Data Inventory">
        <div className="mt-3 space-y-2">
          {[
            ["Revenue Streams", b.revenue_streams.length],
            ["Clients", b.clients.length],
            ["IB Accounts", b.ib_accounts.length],
            ["Partners", b.partners.length],
            ["Content Assets", b.content_assets.length],
            ["Campaigns", b.campaigns.length],
            ["Tasks", b.tasks.length],
            ["Expenses", b.expenses.length],
            ["Monthly P&L Records", b.monthly_pnl.length],
          ].map(([label, count]) => (
            <div key={String(label)} className="flex items-center justify-between py-1.5 border-b border-zinc-800/60 last:border-0">
              <span className="text-sm text-zinc-400">{label}</span>
              <Badge variant={Number(count) > 0 ? "success" : "neutral"}>{count} records</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Computed Summary">
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {[
            ["Monthly Revenue", `$${b.totalMonthlyRevenue.toFixed(0)}/mo`],
            ["Monthly Expenses", `$${b.monthlyExpenses.toFixed(0)}/mo`],
            ["Net Profit", `$${b.netProfit.toFixed(0)}/mo`],
            ["Profit Margin", `${netProfitMarginPct.toFixed(0)}%`],
            ["Active Clients", String(b.activeClients)],
            ["Active Leads", String(b.activeLeads)],
            ["Open Tasks", String(b.openTasks)],
            ["Business Risk", businessRisk.toUpperCase()],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex justify-between">
              <span className="text-zinc-500">{label}</span>
              <span className={`font-medium ${label === "Business Risk" ? (businessRisk === "high" ? "text-red-400" : businessRisk === "medium" ? "text-amber-400" : "text-emerald-400") : "text-zinc-200"}`}>{value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Exported Summary Fields">
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-zinc-500">
          {[
            "monthly_revenue", "monthly_expenses", "net_profit",
            "net_profit_margin_pct", "revenue_by_channel", "active_clients",
            "active_leads", "total_clients", "content_output_count",
            "pending_client_issues", "active_campaigns", "ib_account_count",
            "partner_count", "open_tasks", "high_priority_tasks",
            "business_risk", "business_risk_notes", "next_growth_actions", "currency",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 py-0.5">
              <span className="text-violet-600">✓</span>
              <code className="text-zinc-400">{f}</code>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-3">
        <button
          onClick={handlePreview}
          className="px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          Preview JSON
        </button>
        <button
          onClick={handleDownload}
          disabled={!hasData}
          className="px-4 py-2 rounded-lg border border-violet-500/30 bg-violet-500/10 text-sm text-violet-300 hover:bg-violet-500/20 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Download .tnos.json
        </button>
      </div>

      {preview && (
        <Card title="JSON Preview">
          <pre className="mt-3 text-xs text-zinc-400 overflow-auto max-h-96 font-mono leading-relaxed">{preview}</pre>
        </Card>
      )}

      <Card title="How to sync with TN Life OS">
        <ol className="mt-3 space-y-2 text-sm text-zinc-400 list-decimal list-inside">
          <li>Click <strong className="text-zinc-200">Download .tnos.json</strong> above.</li>
          <li>Open <strong className="text-zinc-200">TN Life OS</strong> on port 3000.</li>
          <li>Go to <strong className="text-zinc-200">Import Snapshots</strong>.</li>
          <li>Drop the downloaded file or click Browse.</li>
          <li>The CEO Dashboard Business widget will populate.</li>
        </ol>
      </Card>
    </div>
  );
}
