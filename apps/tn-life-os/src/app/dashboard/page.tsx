"use client";

import { useSnapshotStore, CHILD_OS_TYPES, OS_LABELS } from "@/store/useSnapshotStore";
import { isStale } from "@tn-os/sync";
import { Card, StatWidget, Badge, Button } from "@tn-os/ui";
import Link from "next/link";
import type { OSType } from "@tn-os/schemas";

function formatCurrency(n: number, currency = "VND") {
  if (currency === "USD") return `$${(n / 1000).toFixed(0)}K`;
  return `${(n / 1_000_000).toFixed(0)}M`;
}

function OSStatusDot({ connected }: { connected: boolean }) {
  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-zinc-700"}`} />
  );
}

function InvestmentWidget({ snapshot }: { snapshot: ReturnType<typeof useSnapshotStore>["snapshots"][OSType] }) {
  if (!snapshot) return <p className="text-zinc-600 text-sm">Not connected — import Investment OS snapshot.</p>;
  const s = snapshot.summary as Record<string, unknown>;
  const stale = isStale(snapshot);
  return (
    <div className="space-y-3">
      {stale && <Badge variant="warning">Snapshot is stale (&gt;7 days old)</Badge>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatWidget label="Total Value" value={formatCurrency(Number(s["total_current_value"]) || 0)} trend="up" />
        <StatWidget label="Gain/Loss %" value={`${(Number(s["total_gain_loss_pct"]) || 0).toFixed(1)}%`} trend={(Number(s["total_gain_loss"]) || 0) >= 0 ? "up" : "down"} />
        <StatWidget label="Funds" value={String(s["num_funds"] ?? "—")} trend="neutral" />
        <StatWidget label="Cash Waiting" value={formatCurrency(Number(s["cash_waiting_deployment"]) || 0)} trend="neutral" />
      </div>
      <div className="text-xs text-zinc-500">Last synced: {new Date(snapshot.generated_at).toLocaleDateString()}</div>
    </div>
  );
}

function WealthWidget({ snapshot }: { snapshot: ReturnType<typeof useSnapshotStore>["snapshots"][OSType] }) {
  if (!snapshot) return <p className="text-zinc-600 text-sm">Not connected — import Wealth OS snapshot.</p>;
  const s = snapshot.summary as Record<string, unknown>;
  const stale = isStale(snapshot);
  const netWorth = Number(s["total_net_worth"]) || 0;
  const cash = Number(s["cash_balance"]) || 0;
  const realEstate = Number(s["total_real_estate_value"]) || 0;
  const liabilities = Number(s["total_liabilities"]) || 0;
  const efMonths = Number(s["emergency_fund_months"]) || 0;
  const efTarget = Number(s["emergency_fund_target_months"]) || 6;
  const monthlyDebt = Number(s["monthly_debt_payments"]) || 0;
  const monthlyFamily = Number(s["monthly_family_support"]) || 0;
  const debtToAsset = Number(s["total_assets"]) > 0 ? (liabilities / Number(s["total_assets"])) * 100 : 0;

  return (
    <div className="space-y-4">
      {stale && <Badge variant="warning">Snapshot is stale (&gt;7 days old)</Badge>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatWidget label="Net Worth" value={formatCurrency(netWorth)} trend={netWorth >= 0 ? "up" : "down"} />
        <StatWidget label="Cash & Bank" value={formatCurrency(cash)} trend="neutral" />
        <StatWidget label="Real Estate" value={formatCurrency(realEstate)} trend="up" />
        <StatWidget label="Total Debt" value={formatCurrency(liabilities)} trend="down" />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs border-t border-zinc-800 pt-3">
        <div>
          <div className="text-zinc-500 uppercase tracking-widest mb-1">Emergency</div>
          <span className={`font-semibold text-sm ${efMonths >= efTarget ? "text-emerald-400" : "text-amber-400"}`}>
            {efMonths.toFixed(1)} mo
          </span>
          <span className="text-zinc-600 ml-1">/ {efTarget}</span>
        </div>
        <div>
          <div className="text-zinc-500 uppercase tracking-widest mb-1">D/A Ratio</div>
          <span className={`font-semibold text-sm ${debtToAsset > 50 ? "text-red-400" : "text-zinc-300"}`}>
            {debtToAsset.toFixed(1)}%
          </span>
        </div>
        <div>
          <div className="text-zinc-500 uppercase tracking-widest mb-1">Monthly Out</div>
          <span className="font-semibold text-sm text-amber-400">
            {formatCurrency(monthlyDebt + monthlyFamily)}
          </span>
        </div>
      </div>

      <div className="text-xs text-zinc-600">Last synced: {new Date(snapshot.generated_at).toLocaleDateString()}</div>
    </div>
  );
}

function TradingWidget({ snapshot }: { snapshot: ReturnType<typeof useSnapshotStore>["snapshots"][OSType] }) {
  if (!snapshot) return <p className="text-zinc-600 text-sm">Not connected — import Trading OS snapshot.</p>;
  const s = snapshot.summary as Record<string, unknown>;
  const stale = isStale(snapshot);
  const ftmoRisk = String(s["ftmo_risk_status"] ?? s["risk_status"] ?? "Safe");
  const riskVariant: "success" | "warning" | "danger" =
    ftmoRisk === "Safe" ? "success" : ftmoRisk === "Warning" ? "warning" : "danger";
  const weeklyPnl = Number(s["weekly_pnl"]) || 0;
  const monthlyPnl = Number(s["monthly_pnl"]) || 0;
  const dailyUsage = Number(s["daily_loss_usage_pct"]) || 0;
  const maxUsage = Number(s["max_loss_usage_pct"]) || 0;
  const disciplineScore = Number(s["discipline_score"]) || 0;
  const bestSetup = String(s["best_setup"] ?? "—");
  const worstMistake = String(s["worst_mistake"] ?? "—");
  const focusNext = String(s["focus_setup_next_week"] ?? "—");
  const violations = Array.isArray(s["rule_violations"]) ? (s["rule_violations"] as string[]) : [];
  const winRate = Number(s["win_rate_pct"]) || 0;

  return (
    <div className="space-y-4">
      {stale && <Badge variant="warning">Snapshot is stale (&gt;7 days old)</Badge>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatWidget label="Equity" value={`$${(Number(s["total_equity"]) || 0).toLocaleString()}`} trend="neutral" />
        <StatWidget label="Weekly PnL" value={`$${weeklyPnl.toFixed(0)}`} trend={weeklyPnl >= 0 ? "up" : "down"} />
        <StatWidget label="Monthly PnL" value={`$${monthlyPnl.toFixed(0)}`} trend={monthlyPnl >= 0 ? "up" : "down"} />
        <StatWidget label="Win Rate" value={`${winRate.toFixed(1)}%`} trend={winRate >= 50 ? "up" : "down"} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">FTMO Risk</div>
          <Badge variant={riskVariant}>{ftmoRisk}</Badge>
        </div>
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Daily DD</div>
          <span className={`text-sm font-semibold ${dailyUsage >= 70 ? "text-red-400" : "text-zinc-300"}`}>{dailyUsage.toFixed(1)}%</span>
        </div>
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Max DD</div>
          <span className={`text-sm font-semibold ${maxUsage >= 70 ? "text-red-400" : "text-zinc-300"}`}>{maxUsage.toFixed(1)}%</span>
        </div>
      </div>

      <div className="space-y-1.5 text-xs border-t border-zinc-800 pt-3">
        <div className="flex justify-between"><span className="text-zinc-500">Best Setup</span><span className="text-emerald-400">{bestSetup}</span></div>
        <div className="flex justify-between"><span className="text-zinc-500">Common Mistake</span><span className="text-amber-400">{worstMistake}</span></div>
        <div className="flex justify-between"><span className="text-zinc-500">Focus Next Week</span><span className="text-blue-400">{focusNext}</span></div>
        <div className="flex justify-between"><span className="text-zinc-500">Discipline Score</span><span className="text-zinc-300">{disciplineScore}/100</span></div>
      </div>

      {violations.length > 0 && (
        <div className="border-t border-zinc-800 pt-3">
          <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Rule Violations</div>
          <ul className="space-y-1">
            {violations.slice(0, 3).map((v, i) => (
              <li key={i} className="text-xs text-amber-400 flex items-start gap-1.5">
                <span>⚠</span><span>{v}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-xs text-zinc-600">Last synced: {new Date(snapshot.generated_at).toLocaleDateString()}</div>
    </div>
  );
}

function BusinessWidget({ snapshot }: { snapshot: ReturnType<typeof useSnapshotStore>["snapshots"][OSType] }) {
  if (!snapshot) return <p className="text-zinc-600 text-sm">Not connected — import Business OS snapshot.</p>;
  const s = snapshot.summary as Record<string, unknown>;
  const stale = isStale(snapshot);
  const monthlyRevenue = Number(s["monthly_revenue"]) || 0;
  const netProfit = Number(s["net_profit"]) || 0;
  const marginPct = Number(s["net_profit_margin_pct"]) || 0;
  const activeClients = Number(s["active_clients"]) || 0;
  const contentCount = Number(s["content_output_count"]) || 0;
  const businessRisk = String(s["business_risk"] ?? "low");
  const riskVariant: "success" | "warning" | "danger" =
    businessRisk === "low" ? "success" : businessRisk === "medium" ? "warning" : "danger";
  const revenueByChannel = s["revenue_by_channel"] as Record<string, number> | undefined;
  const topChannels = revenueByChannel
    ? Object.entries(revenueByChannel).sort((a, z) => z[1] - a[1]).slice(0, 3)
    : [];
  const nextActions: string[] = Array.isArray(s["next_growth_actions"]) ? (s["next_growth_actions"] as string[]) : [];

  return (
    <div className="space-y-4">
      {stale && <Badge variant="warning">Snapshot is stale (&gt;7 days old)</Badge>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatWidget label="Monthly Revenue" value={`$${monthlyRevenue.toFixed(0)}`} trend="up" />
        <StatWidget label="Net Profit" value={`$${netProfit.toFixed(0)}`} trend={netProfit >= 0 ? "up" : "down"} />
        <StatWidget label="Profit Margin" value={`${marginPct.toFixed(0)}%`} trend={marginPct >= 30 ? "up" : "neutral"} />
        <StatWidget label="Active Clients" value={String(activeClients)} trend="neutral" />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs border-t border-zinc-800 pt-3">
        <div>
          <div className="text-zinc-500 uppercase tracking-widest mb-1">Content</div>
          <span className="font-semibold text-sm text-violet-400">{contentCount} this mo</span>
        </div>
        <div>
          <div className="text-zinc-500 uppercase tracking-widest mb-1">Risk</div>
          <Badge variant={riskVariant}>{businessRisk}</Badge>
        </div>
        <div>
          <div className="text-zinc-500 uppercase tracking-widest mb-1">Open Tasks</div>
          <span className="font-semibold text-sm text-zinc-300">{Number(s["open_tasks"]) || 0}</span>
        </div>
      </div>

      {topChannels.length > 0 && (
        <div className="border-t border-zinc-800 pt-3 space-y-1">
          <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Top Revenue Channels</div>
          {topChannels.map(([ch, val]) => (
            <div key={ch} className="flex justify-between text-xs">
              <span className="text-zinc-400 capitalize">{ch.replace(/-/g, " ")}</span>
              <span className="text-violet-400 font-medium">${val.toFixed(0)}/mo</span>
            </div>
          ))}
        </div>
      )}

      {nextActions.length > 0 && (
        <div className="border-t border-zinc-800 pt-3">
          <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Next Actions</div>
          <ul className="space-y-1">
            {nextActions.slice(0, 2).map((a, i) => (
              <li key={i} className="text-xs text-zinc-400 flex items-start gap-1.5">
                <span className="text-violet-500">→</span><span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-xs text-zinc-600">Last synced: {new Date(snapshot.generated_at).toLocaleDateString()}</div>
    </div>
  );
}

function GenericWidget({ snapshot, osType }: { snapshot: ReturnType<typeof useSnapshotStore>["snapshots"][OSType]; osType: OSType }) {
  if (!snapshot) return <p className="text-zinc-600 text-sm">Not connected — import {OS_LABELS[osType]} snapshot.</p>;
  const keys = Object.entries(snapshot.summary as Record<string, unknown>).slice(0, 4);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {keys.map(([k, v]) => (
        <StatWidget key={k} label={k.replace(/_/g, " ")} value={typeof v === "number" ? v.toLocaleString() : String(v)} trend="neutral" />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { snapshots, hydrated } = useSnapshotStore();

  if (!hydrated) return <div className="p-4 md:p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const connectedCount = CHILD_OS_TYPES.filter((t) => !!snapshots[t]).length;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">CEO Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Personal operating system — federated view</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-zinc-500">
            <span className="text-white font-medium">{connectedCount}</span> / {CHILD_OS_TYPES.length} OS connected
          </div>
          <Link href="/import">
            <Button variant="primary" size="sm">Import Snapshot</Button>
          </Link>
        </div>
      </div>

      {/* OS Connection Status Bar */}
      <div className="flex gap-3 flex-wrap">
        {CHILD_OS_TYPES.map((osType) => {
          const connected = !!snapshots[osType];
          const stale = connected && isStale(snapshots[osType]!);
          return (
            <div key={osType} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${connected ? stale ? "border-amber-500/30 bg-amber-500/5 text-amber-400" : "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" : "border-zinc-800 bg-zinc-900 text-zinc-600"}`}>
              <OSStatusDot connected={connected} />
              {OS_LABELS[osType]}
              {stale && " · stale"}
            </div>
          );
        })}
      </div>

      {/* Main widgets grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card title="Investment OS" action={snapshots["investment_os"] ? <Badge variant="success">Live</Badge> : <Badge variant="neutral">Offline</Badge>}>
          <InvestmentWidget snapshot={snapshots["investment_os"]} />
        </Card>

        <Card title="Wealth OS" action={snapshots["wealth_os"] ? <Badge variant="success">Live</Badge> : <Badge variant="neutral">Offline</Badge>}>
          <WealthWidget snapshot={snapshots["wealth_os"]} />
        </Card>

        <Card title="Trading OS" action={snapshots["trading_os"] ? <Badge variant="success">Live</Badge> : <Badge variant="neutral">Offline</Badge>}>
          <TradingWidget snapshot={snapshots["trading_os"]} />
        </Card>

        <Card title="Business OS" action={snapshots["business_os"] ? <Badge variant="success">Live</Badge> : <Badge variant="neutral">Offline</Badge>}>
          <BusinessWidget snapshot={snapshots["business_os"]} />
        </Card>

        {(["crypto_os", "stocks_os"] as OSType[]).map((osType) => (
          <Card key={osType} title={OS_LABELS[osType]} action={snapshots[osType] ? <Badge variant="success">Live</Badge> : <Badge variant="neutral">Offline</Badge>}>
            <GenericWidget snapshot={snapshots[osType]} osType={osType} />
          </Card>
        ))}
      </div>

      {/* Risk alerts */}
      {CHILD_OS_TYPES.some((t) => snapshots[t]?.risks?.length) && (
        <Card title="Active Risk Flags">
          <div className="space-y-2 mt-2">
            {CHILD_OS_TYPES.flatMap((t) =>
              (snapshots[t]?.risks ?? []).map((risk, i) => (
                <div key={`${t}-${i}`} className="flex items-start gap-3 text-sm">
                  <Badge variant="warning">{OS_LABELS[t]}</Badge>
                  <span className="text-zinc-300">{risk}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {connectedCount === 0 && (
        <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">⬡</div>
          <h2 className="text-lg font-semibold text-zinc-300 mb-2">No OS connected yet</h2>
          <p className="text-sm text-zinc-600 mb-6 max-w-md mx-auto">
            Open Investment OS, export a <code className="text-blue-400">.tnos.json</code> snapshot, then import it here to see your data.
          </p>
          <Link href="/import">
            <Button variant="primary">Import First Snapshot →</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
