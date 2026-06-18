"use client";

import { useParams } from "next/navigation";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { PORTFOLIO_MAP } from "@/lib/portfolio-registry";
import { calculateCAGR, calculateProjectedValue, calculateTopWinner, calculateTopLoser, calculateWinRate, toUSD } from "@/lib/portfolio-metrics";
import { ProjectionChart } from "@/components/charts/ProjectionChart";
import { DrawdownBars } from "@/components/charts/DrawdownBars";

function fmtUSD(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

const PROJECTION_SCENARIOS = [
  { label: "Conservative", rate: 8 },
  { label: "Base", rate: 12 },
  { label: "Optimistic", rate: 18 },
];

export default function PerformancePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const store = usePortfolioStore();
  const def = PORTFOLIO_MAP[id];

  if (!store.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;
  if (!def) return null;

  const holdings = store.getPortfolioHoldings(id);
  const transactions = store.getPortfolioTransactions(id);
  const metrics = store.getPortfolioMetrics(id);
  const portfolio = store.portfolios.find((p) => p.id === id);

  const cagr =
    portfolio && metrics.investedCapital > 0
      ? calculateCAGR(metrics.investedCapital, metrics.value, portfolio.createdAt)
      : 0;

  const topWinner = calculateTopWinner(holdings);
  const topLoser = calculateTopLoser(holdings);
  const winRate = calculateWinRate(transactions);

  const isDCA = def.type === "RETIREMENT_5" || def.type === "FUNDS_ETF";
  const monthly = portfolio?.monthlyContribution ?? 0;
  const monthlyUSD = toUSD(monthly, def.baseCurrency);

  const pnlItems = [
    {
      label: "Unrealized P/L",
      value: fmtUSD(metrics.unrealizedPnL),
      raw: metrics.unrealizedPnL,
      sub: holdings.length > 0 ? fmtPct(metrics.totalReturn.pct) : null,
    },
    {
      label: "Realized P/L",
      value: fmtUSD(metrics.realizedPnL),
      raw: metrics.realizedPnL,
      sub: transactions.filter((t) => t.type === "SELL").length + " closed trades",
    },
    {
      label: "Dividend Income",
      value: fmtUSD(metrics.dividendIncome),
      raw: metrics.dividendIncome,
      sub: transactions.filter((t) => t.type === "DIVIDEND" || t.type === "DISTRIBUTION").length + " payments",
    },
    {
      label: "Total Return",
      value: fmtPct(metrics.totalReturn.pct),
      raw: metrics.totalReturn.pct,
      sub: fmtUSD(metrics.totalReturn.amount),
    },
  ];

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <h2 className="text-lg font-semibold text-white">Performance</h2>

      {/* P/L grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {pnlItems.map(({ label, value, raw, sub }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <div className="text-xs text-zinc-500 mb-1">{label}</div>
            <div className={`text-lg font-semibold ${raw >= 0 ? "text-emerald-400" : "text-red-400"}`}>{value}</div>
            {sub && <div className="text-xs text-zinc-600 mt-0.5">{sub}</div>}
          </div>
        ))}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Est. CAGR</div>
          <div className={`text-lg font-semibold ${cagr > 0 ? "text-sky-400" : "text-zinc-400"}`}>
            {cagr > 0 ? `${cagr.toFixed(2)}%` : "—"}
          </div>
          <div className="text-xs text-zinc-600 mt-0.5">annualized return</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Win Rate</div>
          <div className={`text-lg font-semibold ${winRate >= 50 ? "text-emerald-400" : winRate > 0 ? "text-amber-400" : "text-zinc-400"}`}>
            {winRate > 0 ? `${winRate.toFixed(0)}%` : "—"}
          </div>
          <div className="text-xs text-zinc-600 mt-0.5">profitable closed trades</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Holdings</div>
          <div className="text-lg font-semibold text-white">{metrics.holdingCount}</div>
          <div className="text-xs text-zinc-600 mt-0.5">active positions</div>
        </div>
      </div>

      {/* Equity curve */}
      {metrics.investedCapital > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-5">
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-sm font-semibold text-zinc-200">Equity Curve</h3>
            <span className="text-xs text-zinc-600">
              Projected from {`$${metrics.investedCapital < 1000 ? metrics.investedCapital.toFixed(0) : (metrics.investedCapital / 1000).toFixed(1) + "K"}`}
              {monthlyUSD > 0 ? ` + $${monthlyUSD.toFixed(0)}/mo` : ""}
            </span>
          </div>
          <div className="mt-3">
            <ProjectionChart
              investedCapital={metrics.investedCapital}
              currentValue={metrics.value}
              monthlyContribution={monthlyUSD}
            />
          </div>
        </div>
      )}

      {/* Top winner / loser */}
      {holdings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Top Winner</div>
            {topWinner ? (
              <div>
                <div className="text-base font-bold text-sky-400">{topWinner.symbol}</div>
                <div className="text-xs text-zinc-500 mb-2">{topWinner.name}</div>
                <div className="text-lg font-semibold text-emerald-400">
                  +{(((topWinner.currentPrice - topWinner.averageCost) / topWinner.averageCost) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-zinc-600">
                  {topWinner.averageCost > 0
                    ? `avg ${topWinner.currency === "VND" ? `${topWinner.averageCost.toLocaleString()}₫` : `$${topWinner.averageCost}`} → now ${topWinner.currency === "VND" ? `${topWinner.currentPrice.toLocaleString()}₫` : `$${topWinner.currentPrice}`}`
                    : ""}
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-600">No data yet</p>
            )}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Top Loser</div>
            {topLoser ? (
              <div>
                <div className="text-base font-bold text-sky-400">{topLoser.symbol}</div>
                <div className="text-xs text-zinc-500 mb-2">{topLoser.name}</div>
                <div className="text-lg font-semibold text-red-400">
                  {(((topLoser.currentPrice - topLoser.averageCost) / topLoser.averageCost) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-zinc-600">
                  {topLoser.averageCost > 0
                    ? `avg ${topLoser.currency === "VND" ? `${topLoser.averageCost.toLocaleString()}₫` : `$${topLoser.averageCost}`} → now ${topLoser.currency === "VND" ? `${topLoser.currentPrice.toLocaleString()}₫` : `$${topLoser.currentPrice}`}`
                    : ""}
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-600">No data yet</p>
            )}
          </div>
        </div>
      )}

      {/* Position returns / drawdown from cost */}
      {holdings.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-200">Position Returns</h3>
            <span className="text-xs text-zinc-600">vs average cost · sorted worst first</span>
          </div>
          <DrawdownBars holdings={holdings} />
        </div>
      )}

      {/* DCA projections */}
      {isDCA && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-5">
          <h3 className="text-sm font-semibold text-zinc-200 mb-1">Growth Projection</h3>
          <p className="text-xs text-zinc-600 mb-4">
            Based on {fmtUSD(metrics.investedCapital)} invested
            {monthlyUSD > 0 ? ` + ${fmtUSD(monthlyUSD)}/mo` : " (no monthly contribution set)"}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-2 pr-6 text-xs text-zinc-500 uppercase tracking-wide">Horizon</th>
                  {PROJECTION_SCENARIOS.map(({ label, rate }) => (
                    <th key={label} className="text-left py-2 pr-6 text-xs text-zinc-500 uppercase tracking-wide">
                      {label} ({rate}%)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[5, 10, 15, 20].map((years) => (
                  <tr key={years} className="border-b border-zinc-800/50">
                    <td className="py-2.5 pr-6 text-zinc-400">{years}Y</td>
                    {PROJECTION_SCENARIOS.map(({ label, rate }) => {
                      const projected = calculateProjectedValue(
                        metrics.investedCapital,
                        monthlyUSD,
                        rate,
                        years
                      );
                      return (
                        <td key={label} className="py-2.5 pr-6 text-sky-400 font-medium tabular-nums">
                          {fmtUSD(projected)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {monthlyUSD === 0 && (
            <p className="text-xs text-zinc-600 mt-3">
              Set a monthly contribution on the portfolio to see compounding DCA projections.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
