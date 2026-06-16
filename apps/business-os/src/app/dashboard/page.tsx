"use client";

import Link from "next/link";
import { useBusinessStore } from "@/store/useBusinessStore";
import { Card, StatWidget, Badge, Button } from "@tn-os/ui";

function fmtUSD(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const CHANNEL_LABELS: Record<string, string> = {
  "forex-ib": "Forex IB", "crypto-ib": "Crypto IB", "tiktok": "TikTok",
  "telegram": "Telegram", "zalo": "Zalo", "affiliate": "Affiliate",
  "saas": "SaaS", "coaching": "Coaching", "consulting": "Consulting", "other": "Other",
};

export default function DashboardPage() {
  const b = useBusinessStore();

  if (!b.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const hasData = b.revenue_streams.length > 0;
  const margin = b.totalMonthlyRevenue > 0 ? (b.netProfit / b.totalMonthlyRevenue) * 100 : 0;
  const latestPnL = b.monthly_pnl[0];

  return (
    <div className="p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Business Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">TNPA operations — revenue, content, clients</p>
        </div>
        {!hasData && (
          <Button variant="primary" onClick={b.seedSampleData}>Load Sample Data</Button>
        )}
      </div>

      {/* P&L Hero */}
      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6">
        <div className="text-sm text-violet-400/70 uppercase tracking-widest mb-1">Monthly Net Profit (USD)</div>
        <div className={`text-4xl font-bold ${b.netProfit >= 0 ? "text-violet-400" : "text-red-400"}`}>
          {fmtUSD(b.netProfit)}
        </div>
        <div className="mt-3 flex gap-6 text-sm">
          <div><span className="text-zinc-500">Revenue</span> <span className="text-white font-medium ml-2">{fmtUSD(b.totalMonthlyRevenue)}</span></div>
          <div><span className="text-zinc-500">Expenses</span> <span className="text-red-400 font-medium ml-2">-{fmtUSD(b.monthlyExpenses)}</span></div>
          <div><span className="text-zinc-500">Margin</span> <span className={`font-medium ml-2 ${margin >= 50 ? "text-emerald-400" : "text-amber-400"}`}>{margin.toFixed(0)}%</span></div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatWidget label="Active Clients" value={String(b.activeClients)} trend="up" />
        <StatWidget label="Active Leads" value={String(b.activeLeads)} trend="neutral" />
        <StatWidget label="Content This Month" value={String(b.publishedThisMonth)} trend="neutral" />
        <StatWidget label="Open Tasks" value={String(b.openTasks)} trend="neutral" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Revenue by Channel */}
        <Card title="Revenue by Channel">
          <div className="mt-3 space-y-2">
            {Object.entries(b.revenueByChannel)
              .sort((a, b) => b[1] - a[1])
              .map(([ch, amt]) => {
                const pct = b.totalMonthlyRevenue > 0 ? (amt / b.totalMonthlyRevenue) * 100 : 0;
                return (
                  <div key={ch}>
                    <div className="flex justify-between text-sm mb-0.5">
                      <span className="text-zinc-300">{CHANNEL_LABELS[ch] ?? ch}</span>
                      <span className="text-violet-400 font-medium">{fmtUSD(amt)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            {Object.keys(b.revenueByChannel).length === 0 && (
              <p className="text-zinc-600 text-sm">No active revenue streams.</p>
            )}
          </div>
        </Card>

        {/* IB Accounts */}
        <Card
          title="IB Accounts"
          action={<span className="text-xs text-zinc-500">{b.ib_accounts.filter((a) => a.status === "active").length} active</span>}
        >
          <div className="mt-3 space-y-2">
            {b.ib_accounts.filter((a) => a.status === "active").map((a) => (
              <div key={a.id} className="flex justify-between text-sm">
                <div>
                  <div className="text-zinc-200">{a.name}</div>
                  <div className="text-xs text-zinc-500">{a.broker} · {a.client_count} clients</div>
                </div>
                <div className="text-right">
                  <div className="text-violet-400 font-medium">{fmtUSD(a.monthly_commission)}/mo</div>
                  {a.commission_rate && <div className="text-xs text-zinc-500">{a.commission_rate}% rate</div>}
                </div>
              </div>
            ))}
            {b.ib_accounts.filter((a) => a.status === "active").length === 0 && (
              <p className="text-zinc-600 text-sm">No active IB accounts.</p>
            )}
          </div>
        </Card>

        {/* Clients overview */}
        <Card title="Clients & Leads">
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "VIP", count: b.clients.filter((c) => c.status === "vip").length, color: "text-amber-400" },
                { label: "Active", count: b.activeClients, color: "text-emerald-400" },
                { label: "Leads", count: b.activeLeads, color: "text-blue-400" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-zinc-800/50 px-2 py-2">
                  <div className={`text-lg font-bold ${item.color}`}>{item.count}</div>
                  <div className="text-xs text-zinc-500">{item.label}</div>
                </div>
              ))}
            </div>
            {b.pendingIssues > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="warning">{b.pendingIssues} pending issues</Badge>
              </div>
            )}
            <div className="text-xs text-zinc-600">{b.clients.length} total clients tracked</div>
          </div>
        </Card>

        {/* Content calendar */}
        <Card title="Content Calendar (Upcoming)">
          <div className="mt-3 space-y-2">
            {b.calendar_items
              .filter((c) => c.status !== "done" && c.status !== "cancelled")
              .slice(0, 4)
              .map((c) => (
                <div key={c.id} className="flex items-start justify-between text-sm">
                  <div>
                    <div className="text-zinc-200">{c.title}</div>
                    <div className="text-xs text-zinc-500">{c.platform} · {c.planned_date}</div>
                  </div>
                  <Badge variant={c.status === "in-progress" ? "warning" : "neutral"}>{c.status}</Badge>
                </div>
              ))}
            {b.calendar_items.filter((c) => c.status !== "done").length === 0 && (
              <p className="text-zinc-600 text-sm">No upcoming content planned.</p>
            )}
          </div>
        </Card>

        {/* Active campaigns */}
        <Card title="Campaigns">
          <div className="mt-3 space-y-2">
            {b.campaigns.filter((c) => c.status === "active").map((c) => {
              const roi = c.budget > 0 ? ((c.revenue_generated - c.budget) / c.budget) * 100 : null;
              return (
                <div key={c.id} className="flex justify-between text-sm">
                  <div>
                    <div className="text-zinc-200">{c.name}</div>
                    <div className="text-xs text-zinc-500">{c.channel}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-medium">{fmtUSD(c.revenue_generated)}</div>
                    {roi !== null && <div className="text-xs text-zinc-500">ROI {roi.toFixed(0)}%</div>}
                  </div>
                </div>
              );
            })}
            {b.campaigns.filter((c) => c.status === "active").length === 0 && (
              <p className="text-zinc-600 text-sm">No active campaigns.</p>
            )}
            <div className="text-xs text-zinc-600 pt-1">{b.activeCampaigns} active · {b.campaigns.length} total</div>
          </div>
        </Card>

        {/* High priority tasks */}
        <Card title="Priority Tasks">
          <div className="mt-3 space-y-2">
            {b.tasks
              .filter((t) => t.priority === "high" && t.status !== "done")
              .slice(0, 4)
              .map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${t.status === "in-progress" ? "bg-amber-400" : t.status === "blocked" ? "bg-red-400" : "bg-zinc-600"}`} />
                  <span className="text-zinc-200 flex-1">{t.title}</span>
                  {t.due_date && <span className="text-xs text-zinc-500">{t.due_date}</span>}
                </div>
              ))}
            {b.highPriorityTasks === 0 && <p className="text-emerald-400 text-sm">All high priority tasks done!</p>}
            <div className="text-xs text-zinc-600 pt-1">{b.highPriorityTasks} high priority · {b.openTasks} total open</div>
          </div>
        </Card>
      </div>

      {/* Latest PnL */}
      {latestPnL && (
        <Card title={`Latest P&L — ${latestPnL.month}`}>
          <div className="mt-3 grid grid-cols-3 gap-4 text-center">
            <div><div className="text-xs text-zinc-500 mb-1">Revenue</div><div className="text-lg font-bold text-violet-400">{fmtUSD(latestPnL.revenue)}</div></div>
            <div><div className="text-xs text-zinc-500 mb-1">Expenses</div><div className="text-lg font-bold text-red-400">-{fmtUSD(latestPnL.expenses)}</div></div>
            <div><div className="text-xs text-zinc-500 mb-1">Net Profit</div><div className={`text-lg font-bold ${latestPnL.net_profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmtUSD(latestPnL.net_profit)}</div></div>
          </div>
          {latestPnL.notes && <p className="text-xs text-zinc-500 mt-3 italic">{latestPnL.notes}</p>}
        </Card>
      )}

      {/* Quick nav */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { href: "/revenue", label: "Revenue", count: b.revenue_streams.length },
          { href: "/clients", label: "Clients", count: b.clients.length },
          { href: "/content", label: "Content", count: b.content_assets.length },
          { href: "/tasks", label: "Tasks", count: b.openTasks },
          { href: "/expenses", label: "Expenses", count: b.expenses.length },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 hover:border-violet-500/30 hover:bg-violet-500/5 transition-colors"
          >
            <div className="text-xs text-zinc-500 mb-1">{item.label}</div>
            <div className="text-lg font-semibold text-white">{item.count}</div>
            <div className="text-xs text-zinc-600">records</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
