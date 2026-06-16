"use client";

import React from "react";
import { useSnapshotStore, CHILD_OS_TYPES, OS_LABELS } from "@/store/useSnapshotStore";
import { useDecisionStore } from "@/store/useDecisionStore";
import { isStale } from "@tn-os/sync";
import { Card, Badge } from "@tn-os/ui";
import type { TNOSSnapshot } from "@tn-os/schemas";

function ScalarEntry({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs text-zinc-500 uppercase tracking-wider">{label}</div>
      <div className="text-sm text-zinc-200 font-medium mt-0.5">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

function extractScalarEntries(summary: Record<string, unknown>): Array<{ key: string; value: string | number }> {
  return Object.entries(summary)
    .filter((e): e is [string, string | number] => typeof e[1] === "number" || typeof e[1] === "string")
    .slice(0, 6)
    .map(([key, value]) => ({ key, value }));
}

function fmtM(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  return n.toLocaleString();
}

function WealthReviewSection({ snap }: { snap: TNOSSnapshot }) {
  const s = snap.summary as Record<string, unknown>;
  const stale = isStale(snap);
  const netWorth = Number(s["total_net_worth"]) || 0;
  const totalAssets = Number(s["total_assets"]) || 0;
  const totalLiabilities = Number(s["total_liabilities"]) || 0;
  const cash = Number(s["cash_balance"]) || 0;
  const realEstate = Number(s["total_real_estate_value"]) || 0;
  const efMonths = Number(s["emergency_fund_months"]) || 0;
  const efTarget = Number(s["emergency_fund_target_months"]) || 6;
  const monthlyDebt = Number(s["monthly_debt_payments"]) || 0;
  const monthlyFamily = Number(s["monthly_family_support"]) || 0;
  const upcomingMaturities: string[] = Array.isArray(s["upcoming_maturities"]) ? (s["upcoming_maturities"] as string[]) : [];

  return (
    <Card
      title="Wealth OS"
      action={
        <div className="flex items-center gap-2">
          <Badge variant={stale ? "warning" : "success"}>{stale ? "Stale" : "Current"}</Badge>
          <span className="text-xs text-zinc-600">{new Date(snap.generated_at).toLocaleDateString()}</span>
        </div>
      }
    >
      <div className="mt-3 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Net Worth</div>
            <div className={`text-lg font-bold mt-0.5 ${netWorth >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmtM(netWorth)}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Total Assets</div>
            <div className="text-lg font-bold mt-0.5 text-zinc-200">{fmtM(totalAssets)}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Total Debt</div>
            <div className="text-lg font-bold mt-0.5 text-red-400">{fmtM(totalLiabilities)}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Emergency Fund</div>
            <div className={`text-lg font-bold mt-0.5 ${efMonths >= efTarget ? "text-emerald-400" : "text-amber-400"}`}>{efMonths.toFixed(1)} mo</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm border-t border-zinc-800 pt-3">
          {[
            ["Cash & Bank", fmtM(cash)],
            ["Real Estate", fmtM(realEstate)],
            ["Monthly Debt Pmts", fmtM(monthlyDebt)],
            ["Monthly Family", fmtM(monthlyFamily)],
            ["Total Monthly Out", fmtM(monthlyDebt + monthlyFamily)],
            ["D/A Ratio", totalAssets > 0 ? `${((totalLiabilities / totalAssets) * 100).toFixed(1)}%` : "—"],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <div className="text-xs text-zinc-500">{label}</div>
              <div className="text-zinc-200 font-medium mt-0.5">{value}</div>
            </div>
          ))}
        </div>

        {upcomingMaturities.length > 0 && (
          <div className="border-t border-zinc-800 pt-3">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Upcoming Maturities</div>
            <ul className="space-y-1">
              {upcomingMaturities.map((m, i) => (
                <li key={i} className="text-xs text-emerald-400 flex items-start gap-2">
                  <span>◆</span><span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

function TradingReviewSection({ snap }: { snap: TNOSSnapshot }) {
  const s = snap.summary as Record<string, unknown>;
  const stale = isStale(snap);
  const ftmoRisk = String(s["ftmo_risk_status"] ?? "—");
  const riskVariant: "success" | "warning" | "danger" =
    ftmoRisk === "Safe" ? "success" : ftmoRisk === "Warning" ? "warning" : "danger";
  const violations = Array.isArray(s["rule_violations"]) ? (s["rule_violations"] as string[]) : [];
  const weeklyPnl = Number(s["weekly_pnl"]) || 0;
  const monthlyPnl = Number(s["monthly_pnl"]) || 0;

  return (
    <Card
      title="Trading OS"
      action={
        <div className="flex items-center gap-2">
          <Badge variant={stale ? "warning" : "success"}>{stale ? "Stale" : "Current"}</Badge>
          <span className="text-xs text-zinc-600">{new Date(snap.generated_at).toLocaleDateString()}</span>
        </div>
      }
    >
      <div className="mt-3 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Weekly PnL</div>
            <div className={`text-lg font-bold mt-0.5 ${weeklyPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              ${weeklyPnl.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Monthly PnL</div>
            <div className={`text-lg font-bold mt-0.5 ${monthlyPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              ${monthlyPnl.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Win Rate</div>
            <div className="text-lg font-bold mt-0.5 text-zinc-200">
              {(Number(s["win_rate_pct"]) || 0).toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">FTMO Risk</div>
            <div className="mt-1"><Badge variant={riskVariant}>{ftmoRisk}</Badge></div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm border-t border-zinc-800 pt-3">
          {[
            ["Total Equity", `$${(Number(s["total_equity"]) || 0).toLocaleString()}`],
            ["Daily DD Used", `${(Number(s["daily_loss_usage_pct"]) || 0).toFixed(1)}%`],
            ["Max DD Used", `${(Number(s["max_loss_usage_pct"]) || 0).toFixed(1)}%`],
            ["Discipline Score", `${Number(s["discipline_score"]) || 0}/100`],
            ["Best Setup", String(s["best_setup"] ?? "—")],
            ["Common Mistake", String(s["worst_mistake"] ?? "—")],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="text-xs text-zinc-500">{label}</div>
              <div className="text-zinc-200 font-medium mt-0.5">{value}</div>
            </div>
          ))}
        </div>

        {String(s["focus_setup_next_week"] ?? "—") !== "—" && (
          <div className="border-t border-zinc-800 pt-3">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Focus Setup Next Week</div>
            <div className="text-sm text-blue-400">{String(s["focus_setup_next_week"])}</div>
          </div>
        )}

        {violations.length > 0 && (
          <div className="border-t border-zinc-800 pt-3">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Rule Violations This Period</div>
            <ul className="space-y-1">
              {violations.map((v, i) => (
                <li key={i} className="text-xs text-amber-400 flex items-start gap-2">
                  <span>⚠</span><span>{v}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

function BusinessReviewSection({ snap }: { snap: TNOSSnapshot }) {
  const s = snap.summary as Record<string, unknown>;
  const stale = isStale(snap);
  const monthlyRevenue = Number(s["monthly_revenue"]) || 0;
  const monthlyExpenses = Number(s["monthly_expenses"]) || 0;
  const netProfit = Number(s["net_profit"]) || 0;
  const marginPct = Number(s["net_profit_margin_pct"]) || 0;
  const activeClients = Number(s["active_clients"]) || 0;
  const activeLeads = Number(s["active_leads"]) || 0;
  const pendingIssues = Number(s["pending_client_issues"]) || 0;
  const contentCount = Number(s["content_output_count"]) || 0;
  const activeCampaigns = Number(s["active_campaigns"]) || 0;
  const openTasks = Number(s["open_tasks"]) || 0;
  const highPriorityTasks = Number(s["high_priority_tasks"]) || 0;
  const businessRisk = String(s["business_risk"] ?? "low");
  const riskVariant: "success" | "warning" | "danger" =
    businessRisk === "low" ? "success" : businessRisk === "medium" ? "warning" : "danger";
  const riskNotes: string[] = Array.isArray(s["business_risk_notes"]) ? (s["business_risk_notes"] as string[]) : [];
  const nextGrowthActions: string[] = Array.isArray(s["next_growth_actions"]) ? (s["next_growth_actions"] as string[]) : [];
  const revenueByChannel = s["revenue_by_channel"] as Record<string, number> | undefined;
  const topChannels = revenueByChannel
    ? Object.entries(revenueByChannel).sort((a, z) => z[1] - a[1]).slice(0, 4)
    : [];

  return (
    <Card
      title="Business OS"
      action={
        <div className="flex items-center gap-2">
          <Badge variant={stale ? "warning" : "success"}>{stale ? "Stale" : "Current"}</Badge>
          <span className="text-xs text-zinc-600">{new Date(snap.generated_at).toLocaleDateString()}</span>
        </div>
      }
    >
      <div className="mt-3 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Monthly Revenue</div>
            <div className="text-lg font-bold mt-0.5 text-violet-400">${monthlyRevenue.toFixed(0)}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Net Profit</div>
            <div className={`text-lg font-bold mt-0.5 ${netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>${netProfit.toFixed(0)}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Profit Margin</div>
            <div className={`text-lg font-bold mt-0.5 ${marginPct >= 30 ? "text-emerald-400" : "text-amber-400"}`}>{marginPct.toFixed(0)}%</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Business Risk</div>
            <div className="mt-1"><Badge variant={riskVariant}>{businessRisk}</Badge></div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm border-t border-zinc-800 pt-3">
          {[
            ["Monthly Expenses", `$${monthlyExpenses.toFixed(0)}`],
            ["Active Clients", String(activeClients)],
            ["Active Leads", String(activeLeads)],
            ["Pending Issues", String(pendingIssues)],
            ["Content Published", `${contentCount} this mo`],
            ["Active Campaigns", String(activeCampaigns)],
            ["Open Tasks", String(openTasks)],
            ["High Priority", String(highPriorityTasks)],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <div className="text-xs text-zinc-500">{label}</div>
              <div className={`font-medium mt-0.5 ${label === "Pending Issues" && pendingIssues > 0 ? "text-red-400" : label === "High Priority" && highPriorityTasks > 0 ? "text-amber-400" : "text-zinc-200"}`}>{value}</div>
            </div>
          ))}
        </div>

        {topChannels.length > 0 && (
          <div className="border-t border-zinc-800 pt-3">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Revenue by Channel</div>
            <div className="grid grid-cols-2 gap-2">
              {topChannels.map(([ch, val]) => (
                <div key={ch} className="flex justify-between text-sm">
                  <span className="text-zinc-400 capitalize">{ch.replace(/-/g, " ")}</span>
                  <span className="text-violet-400 font-medium">${val.toFixed(0)}/mo</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {riskNotes.length > 0 && (
          <div className="border-t border-zinc-800 pt-3">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Risk Flags</div>
            <ul className="space-y-1">
              {riskNotes.map((note, i) => (
                <li key={i} className="text-xs text-amber-400 flex items-start gap-2">
                  <span>⚠</span><span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {nextGrowthActions.length > 0 && (
          <div className="border-t border-zinc-800 pt-3">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Next Growth Actions</div>
            <ul className="space-y-1">
              {nextGrowthActions.map((action, i) => (
                <li key={i} className="text-xs text-violet-400 flex items-start gap-2">
                  <span>→</span><span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function WeeklyReviewPage() {
  const { snapshots, hydrated } = useSnapshotStore();
  const decisionStore = useDecisionStore();

  if (!hydrated || !decisionStore.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);

  const hasAny = CHILD_OS_TYPES.some((t) => !!snapshots[t]);
  const reviewCutoff = new Date();
  reviewCutoff.setHours(23, 59, 59, 999);
  const decisionsDue = decisionStore.decisions.filter((decision) => (
    decision.status !== "archived" &&
    decision.review_date &&
    new Date(`${decision.review_date}T00:00:00`).getTime() <= reviewCutoff.getTime()
  ));

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Weekly Review</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Week of {weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <Card title="Decisions Due for Review" action={<Badge variant={decisionsDue.length > 0 ? "warning" : "success"}>{decisionsDue.length}</Badge>}>
        <div className="space-y-3">
          {decisionsDue.length === 0 && <p className="text-sm text-zinc-600">No decisions are due for review.</p>}
          {decisionsDue.map((decision) => (
            <a key={decision.id} href={`/decisions/${decision.id}`} className="block rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 transition-colors hover:border-blue-500/40">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-zinc-100">{decision.title}</span>
                <Badge variant={decision.status === "reviewed" ? "success" : decision.status === "decided" ? "warning" : "info"}>{decision.status}</Badge>
              </div>
              <div className="mt-1 text-xs text-zinc-500">{decision.category} · Review date {decision.review_date}</div>
              {decision.expected_outcome && <p className="mt-2 text-sm text-zinc-400">{decision.expected_outcome}</p>}
            </a>
          ))}
        </div>
      </Card>

      {CHILD_OS_TYPES.map((osType) => {
        const snap = snapshots[osType];
        if (!snap) return null;

        if (osType === "trading_os") {
          return <TradingReviewSection key={osType} snap={snap} />;
        }

        if (osType === "wealth_os") {
          return <WealthReviewSection key={osType} snap={snap} />;
        }

        if (osType === "business_os") {
          return <BusinessReviewSection key={osType} snap={snap} />;
        }

        const stale = isStale(snap);
        const risks: string[] = Array.isArray(snap.risks) ? (snap.risks as string[]) : [];
        const summary = snap.summary as Record<string, unknown>;
        const aiContext = snap.ai_context as Record<string, unknown>;
        const scalarEntries = extractScalarEntries(summary);
        const portfolioNote = typeof aiContext["portfolio_summary"] === "string" ? aiContext["portfolio_summary"] : null;

        return (
          <Card
            key={osType}
            title={OS_LABELS[osType]}
            action={
              <div className="flex items-center gap-2">
                <Badge variant={stale ? "warning" : "success"}>{stale ? "Stale" : "Current"}</Badge>
                <span className="text-xs text-zinc-600">{new Date(snap.generated_at).toLocaleDateString()}</span>
              </div>
            }
          >
            <div className="mt-2 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
                {scalarEntries.map(({ key, value }) => (
                  <ScalarEntry key={key} label={key.replace(/_/g, " ")} value={value} />
                ))}
              </div>

              {risks.length > 0 && (
                <div>
                  <div className="text-xs text-zinc-600 uppercase tracking-wider mb-1">Risks</div>
                  <ul className="space-y-1">
                    {risks.map((r, i) => (
                      <li key={i} className="text-sm text-amber-400 flex items-start gap-2">
                        <span className="mt-0.5">⚠</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {portfolioNote !== null && (
                <div className="text-xs text-zinc-500 italic border-t border-zinc-800 pt-2 mt-2">
                  {portfolioNote}
                </div>
              )}
            </div>
          </Card>
        );
      })}

      {!hasAny && (
        <div className="border border-dashed border-zinc-800 rounded-xl p-10 text-center">
          <p className="text-zinc-600">No snapshots imported yet. Import at least one OS snapshot to see your weekly review.</p>
        </div>
      )}
    </div>
  );
}
