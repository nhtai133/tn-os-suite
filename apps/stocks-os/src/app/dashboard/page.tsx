"use client";

import Link from "next/link";
import { StatWidget } from "@tn-os/ui";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { STOCK_PORTFOLIOS } from "@/lib/portfolio-registry";
import { toUSD, calculateProjectedValue } from "@/lib/portfolio-metrics";

function fmtUSD(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

const PORTFOLIO_COLORS = [
  { bar: "bg-sky-500",     text: "text-sky-400"     },
  { bar: "bg-violet-500",  text: "text-violet-400"  },
  { bar: "bg-emerald-500", text: "text-emerald-400" },
  { bar: "bg-amber-500",   text: "text-amber-400"   },
  { bar: "bg-rose-500",    text: "text-rose-400"    },
];

const ALLOCATION_COLORS = [
  "bg-sky-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-teal-500",  "bg-orange-500",  "bg-pink-500",
];

const CURVE_YEARS = [1, 3, 5, 10, 15, 20];

function AllocationBars({
  data,
  total,
}: {
  data: Record<string, number>;
  total: number;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0)
    return <p className="text-xs text-zinc-600">No data</p>;

  return (
    <div className="space-y-2.5">
      {entries.map(([label, val], i) => {
        const pct = total > 0 ? (val / total) * 100 : 0;
        const color = ALLOCATION_COLORS[i % ALLOCATION_COLORS.length] ?? "bg-zinc-500";
        return (
          <div key={label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-300">{label}</span>
              <span className="text-zinc-500 tabular-nums">{fmtUSD(val)} · {pct.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${color}`}
                style={{ width: `${Math.max(pct, 0.5)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function GlobalDashboardPage() {
  const store = usePortfolioStore();

  if (!store.hydrated)
    return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const g = store.globalMetrics;
  const totalPnLPct = g.totalInvested > 0 ? ((g.totalUnrealized + g.totalRealized) / g.totalInvested) * 100 : 0;

  // Per-portfolio snapshots
  const portfolioRows = STOCK_PORTFOLIOS.map((def, i) => {
    const m = store.getPortfolioMetrics(def.id);
    const weight = g.totalValue > 0 ? (m.value / g.totalValue) * 100 : 0;
    const pnlPct = m.investedCapital > 0 ? ((m.value - m.investedCapital) / m.investedCapital) * 100 : 0;
    return { def, m, weight, pnlPct, color: PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length]! };
  });

  // Aggregate annual dividends from holding annualDividend fields
  const annualDividends = store.holdings.reduce((sum, h) => {
    if (!h.annualDividend || h.annualDividend <= 0) return sum;
    return sum + toUSD(h.annualDividend * h.quantity, h.currency);
  }, 0);

  // Aggregate allocation across all portfolios
  const allocationByAssetClass = store.holdings.reduce<Record<string, number>>((acc, h) => {
    const val = toUSD(h.quantity * h.currentPrice, h.currency);
    acc[h.assetClass] = (acc[h.assetClass] ?? 0) + val;
    return acc;
  }, {});

  const allocationBySector = store.holdings.reduce<Record<string, number>>((acc, h) => {
    const sector = h.sector ?? "Other";
    const val = toUSD(h.quantity * h.currentPrice, h.currency);
    acc[sector] = (acc[sector] ?? 0) + val;
    return acc;
  }, {});

  // Total monthly contributions (VND portfolios convert to USD)
  const totalMonthlyUSD = store.portfolios.reduce((sum, p) => {
    if (!p.monthlyContribution || p.monthlyContribution <= 0) return sum;
    return sum + toUSD(p.monthlyContribution, p.baseCurrency);
  }, 0);

  // Equity curve projections at base 12% CAGR
  const curveValues = CURVE_YEARS.map((yr) =>
    calculateProjectedValue(g.totalInvested, totalMonthlyUSD, 12, yr)
  );
  const curveMax = Math.max(g.totalValue, ...curveValues, 1);

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Global Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Aggregate view across {g.portfolioCount} portfolios · {g.totalHoldings} positions
        </p>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatWidget
          label="Total Value"
          value={fmtUSD(g.totalValue)}
          trend={g.totalValue > 0 ? "up" : "neutral"}
        />
        <StatWidget
          label="Total Invested"
          value={fmtUSD(g.totalInvested)}
          trend="neutral"
        />
        <StatWidget
          label="Unrealized P/L"
          value={fmtUSD(g.totalUnrealized)}
          trend={g.totalUnrealized >= 0 ? "up" : "down"}
        />
        <StatWidget
          label="Total Return"
          value={`${totalPnLPct >= 0 ? "+" : ""}${totalPnLPct.toFixed(2)}%`}
          trend={totalPnLPct >= 0 ? "up" : "down"}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Realized P/L",    value: fmtUSD(g.totalRealized),   color: g.totalRealized >= 0 ? "text-emerald-400" : "text-red-400" },
          { label: "Dividend Received", value: fmtUSD(g.totalDividends), color: "text-emerald-400" },
          { label: "Annual Dividends", value: fmtUSD(annualDividends),   color: "text-sky-400" },
          { label: "Monthly DCA",      value: totalMonthlyUSD > 0 ? fmtUSD(totalMonthlyUSD) : "—", color: "text-violet-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <div className="text-xs text-zinc-500 mb-1">{label}</div>
            <div className={`text-lg font-semibold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Portfolio weights — stacked bar + table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200">Portfolio Weights</h2>

        {g.totalValue > 0 ? (
          <>
            {/* Stacked bar */}
            <div className="flex h-5 rounded-full overflow-hidden gap-px">
              {portfolioRows.filter((r) => r.m.value > 0).map(({ def, weight, color }) => (
                <div
                  key={def.id}
                  className={`${color.bar} first:rounded-l-full last:rounded-r-full transition-all`}
                  style={{ width: `${weight}%` }}
                  title={`${def.name}: ${weight.toFixed(1)}%`}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              {portfolioRows.map(({ def, color }) => (
                <div key={def.id} className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className={`inline-block w-2.5 h-2.5 rounded-sm ${color.bar}`} />
                  {def.name}
                </div>
              ))}
            </div>

            {/* Per-portfolio table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    {["Portfolio", "Type", "Value", "Invested", "P/L", "P/L %", "Weight", "Holdings"].map((h) => (
                      <th key={h} className="text-left py-2 pr-4 text-xs text-zinc-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {portfolioRows.map(({ def, m, weight, pnlPct, color }) => (
                    <tr key={def.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="py-2.5 pr-4">
                        <Link href={`/portfolios/${def.id}`} className={`font-semibold hover:underline ${color.text}`}>
                          {def.name}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4 text-zinc-600 text-xs">{def.type}</td>
                      <td className="py-2.5 pr-4 text-sky-400 font-medium">{fmtUSD(m.value)}</td>
                      <td className="py-2.5 pr-4 text-zinc-400">{fmtUSD(m.investedCapital)}</td>
                      <td className={`py-2.5 pr-4 font-medium ${(m.value - m.investedCapital) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {fmtUSD(m.value - m.investedCapital)}
                      </td>
                      <td className={`py-2.5 pr-4 font-medium ${pnlPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                            <div className={`h-full rounded-full ${color.bar}`} style={{ width: `${Math.min(weight, 100)}%` }} />
                          </div>
                          <span className="text-zinc-400 tabular-nums text-xs">{weight.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 text-zinc-400">{m.holdingCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-sm text-zinc-600">
            No holdings yet.{" "}
            <Link href="/portfolios/retirement-5/holdings" className="text-sky-400 hover:underline">
              Add your first position →
            </Link>
          </p>
        )}
      </div>

      {/* Allocation panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-200 mb-4">Asset Class Allocation</h3>
          <AllocationBars data={allocationByAssetClass} total={g.totalValue} />
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-200 mb-4">Sector Allocation</h3>
          <AllocationBars data={allocationBySector} total={g.totalValue} />
        </div>
      </div>

      {/* Equity curve — projected growth at 12% base CAGR */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-5">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-sm font-semibold text-zinc-200">Projected Equity Curve</h3>
          <span className="text-xs text-zinc-600">Base case · 12% CAGR{totalMonthlyUSD > 0 ? ` + ${fmtUSD(totalMonthlyUSD)}/mo DCA` : ""}</span>
        </div>
        <p className="text-xs text-zinc-600 mb-5">
          Starting from {fmtUSD(g.totalInvested)} invested today
        </p>

        {g.totalInvested > 0 ? (
          <div className="space-y-3">
            {/* Current value baseline */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-zinc-400 font-medium">Today</span>
                <span className="text-zinc-300 tabular-nums font-medium">{fmtUSD(g.totalValue > 0 ? g.totalValue : g.totalInvested)}</span>
              </div>
              <div className="h-7 rounded-lg bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-lg bg-zinc-600 transition-all"
                  style={{ width: `${((g.totalValue > 0 ? g.totalValue : g.totalInvested) / curveMax) * 100}%` }}
                />
              </div>
            </div>

            {CURVE_YEARS.map((yr, i) => {
              const val = curveValues[i] ?? 0;
              const widthPct = (val / curveMax) * 100;
              return (
                <div key={yr}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-zinc-400 font-medium">{yr}Y</span>
                    <span className="text-sky-400 tabular-nums font-medium">{fmtUSD(val)}</span>
                  </div>
                  <div className="h-7 rounded-lg bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-lg bg-sky-500/70 transition-all"
                      style={{ width: `${Math.max(widthPct, 1)}%` }}
                    />
                  </div>
                </div>
              );
            })}

            <p className="text-xs text-zinc-700 pt-1">
              Projection assumes constant annual return. Actual returns will vary.
            </p>
          </div>
        ) : (
          <p className="text-sm text-zinc-600">Add holdings to generate a projection.</p>
        )}
      </div>
    </div>
  );
}
