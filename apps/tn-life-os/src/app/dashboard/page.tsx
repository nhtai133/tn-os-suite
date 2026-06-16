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
      <div className="grid grid-cols-2 gap-3">
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
  return (
    <div className="space-y-3">
      {stale && <Badge variant="warning">Snapshot is stale</Badge>}
      <div className="grid grid-cols-2 gap-3">
        <StatWidget label="Net Worth" value={formatCurrency(Number(s["total_net_worth"]) || 0)} trend="up" />
        <StatWidget label="Cash" value={formatCurrency(Number(s["cash_balance"]) || 0)} trend="neutral" />
        <StatWidget label="Emergency" value={`${Number(s["emergency_fund_months"] || 0).toFixed(1)} mo`} trend="neutral" />
        <StatWidget label="Liabilities" value={formatCurrency(Number(s["total_liabilities"]) || 0)} trend="down" />
      </div>
    </div>
  );
}

function TradingWidget({ snapshot }: { snapshot: ReturnType<typeof useSnapshotStore>["snapshots"][OSType] }) {
  if (!snapshot) return <p className="text-zinc-600 text-sm">Not connected — import Trading OS snapshot.</p>;
  const s = snapshot.summary as Record<string, unknown>;
  const risk = String(s["risk_status"] ?? "safe");
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <StatWidget label="Equity" value={`$${(Number(s["equity"]) || 0).toFixed(0)}`} trend="neutral" />
        <StatWidget label="Drawdown" value={`${(Number(s["drawdown_pct"]) || 0).toFixed(1)}%`} trend="down" />
        <StatWidget label="Weekly PnL" value={`$${(Number(s["weekly_pnl"]) || 0).toFixed(0)}`} trend={(Number(s["weekly_pnl"]) || 0) >= 0 ? "up" : "down"} />
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Risk</div>
          <Badge variant={risk === "safe" ? "success" : risk === "caution" ? "warning" : "danger"}>{risk}</Badge>
        </div>
      </div>
    </div>
  );
}

function GenericWidget({ snapshot, osType }: { snapshot: ReturnType<typeof useSnapshotStore>["snapshots"][OSType]; osType: OSType }) {
  if (!snapshot) return <p className="text-zinc-600 text-sm">Not connected — import {OS_LABELS[osType]} snapshot.</p>;
  const keys = Object.entries(snapshot.summary as Record<string, unknown>).slice(0, 4);
  return (
    <div className="grid grid-cols-2 gap-3">
      {keys.map(([k, v]) => (
        <StatWidget key={k} label={k.replace(/_/g, " ")} value={typeof v === "number" ? v.toLocaleString() : String(v)} trend="neutral" />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { snapshots, hydrated } = useSnapshotStore();

  if (!hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const connectedCount = CHILD_OS_TYPES.filter((t) => !!snapshots[t]).length;

  return (
    <div className="p-8 space-y-6 max-w-7xl">
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

        {(["crypto_os", "stocks_os", "business_os"] as OSType[]).map((osType) => (
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
