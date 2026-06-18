"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, StatWidget, Badge } from "@tn-os/ui";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { PORTFOLIO_MAP } from "@/lib/portfolio-registry";
import { calculateCAGR, calculateWinRate, toUSD } from "@/lib/portfolio-metrics";

function fmtUSD(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export default function PortfolioDashboardPage() {
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

  const winRate = calculateWinRate(transactions);

  const sortedHoldings = [...holdings].sort(
    (a, b) => toUSD(b.quantity * b.currentPrice, b.currency) - toUSD(a.quantity * a.currentPrice, a.currency)
  );

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      {/* Primary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatWidget label="Portfolio Value" value={fmtUSD(metrics.value)} trend={metrics.value > 0 ? "up" : "neutral"} />
        <StatWidget label="Invested Capital" value={fmtUSD(metrics.investedCapital)} trend="neutral" />
        <StatWidget
          label="Unrealized P/L"
          value={fmtUSD(metrics.unrealizedPnL)}
          trend={metrics.unrealizedPnL >= 0 ? "up" : "down"}
        />
        <StatWidget
          label="Total Return"
          value={fmtPct(metrics.totalReturn.pct)}
          trend={metrics.totalReturn.pct >= 0 ? "up" : "down"}
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Realized P/L", value: fmtUSD(metrics.realizedPnL), color: metrics.realizedPnL >= 0 ? "text-emerald-400" : "text-red-400" },
          { label: "Dividends", value: fmtUSD(metrics.dividendIncome), color: "text-emerald-400" },
          { label: "Holdings", value: String(metrics.holdingCount), color: "text-white" },
          { label: "Est. CAGR", value: cagr > 0 ? `${cagr.toFixed(1)}%` : "—", color: "text-sky-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <div className="text-xs text-zinc-500 mb-1">{label}</div>
            <div className={`text-lg font-semibold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Type-specific metrics */}
      {def.type === "SWING_3_6M" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <div className="text-xs text-zinc-500 mb-1">Open Positions</div>
            <div className="text-lg font-semibold text-white">{holdings.length}</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <div className="text-xs text-zinc-500 mb-1">Closed Trades</div>
            <div className="text-lg font-semibold text-white">
              {transactions.filter((tx) => tx.type === "SELL").length}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <div className="text-xs text-zinc-500 mb-1">Win Rate</div>
            <div className="text-lg font-semibold text-white">
              {winRate > 0 ? `${winRate.toFixed(0)}%` : "—"}
            </div>
          </div>
        </div>
      )}

      {(def.type === "RETIREMENT_5" || def.type === "FUNDS_ETF") && portfolio && (
        <Card title="DCA Plan">
          <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Monthly Contribution</div>
              <div className="text-zinc-200 font-medium">
                {portfolio.monthlyContribution && portfolio.monthlyContribution > 0
                  ? fmtUSD(portfolio.monthlyContribution)
                  : <span className="text-zinc-600">Not set</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Target Period</div>
              <div className="text-zinc-200 font-medium">{def.targetHoldingPeriod ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Strategy</div>
              <div className="text-zinc-200 font-medium">{def.type === "RETIREMENT_5" ? "Retirement DCA" : "Fund Accumulation"}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Holdings summary */}
      {holdings.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-xl p-10 text-center">
          <p className="text-zinc-400 font-medium mb-1">No holdings yet</p>
          <p className="text-zinc-600 text-sm mb-4">
            Add your first position to start tracking this portfolio.
          </p>
          <Link
            href={`/portfolios/${id}/holdings`}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 transition-colors"
          >
            Add Holdings →
          </Link>
        </div>
      ) : (
        <Card title={`Top Holdings (${holdings.length})`} action={
          <Link href={`/portfolios/${id}/holdings`} className="text-xs text-sky-400 hover:text-sky-300">
            View all →
          </Link>
        }>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Symbol", "Quantity", "Avg Cost", "Current", "Value (USD)", "P/L %"].map((h) => (
                    <th key={h} className="text-left py-2 pr-4 text-xs text-zinc-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedHoldings.slice(0, 5).map((h) => {
                  const valueUSD = toUSD(h.quantity * h.currentPrice, h.currency);
                  const pnlPct = h.averageCost > 0 ? ((h.currentPrice - h.averageCost) / h.averageCost) * 100 : 0;
                  const fmtPrice = (p: number) =>
                    h.currency === "VND" ? `${p.toLocaleString()}₫` : `$${p.toLocaleString()}`;
                  return (
                    <tr key={h.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="py-2.5 pr-4">
                        <div className="font-bold text-sky-400">{h.symbol}</div>
                        <div className="text-xs text-zinc-600">{h.assetClass}</div>
                      </td>
                      <td className="py-2.5 pr-4 text-zinc-200">{h.quantity}</td>
                      <td className="py-2.5 pr-4 text-zinc-400">{fmtPrice(h.averageCost)}</td>
                      <td className="py-2.5 pr-4 text-zinc-200">{fmtPrice(h.currentPrice)}</td>
                      <td className="py-2.5 pr-4 text-sky-400 font-medium">{fmtUSD(valueUSD)}</td>
                      <td className={`py-2.5 pr-4 font-medium ${pnlPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
