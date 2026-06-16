"use client";

import { useStocksStore, toUSD } from "@/store/useStocksStore";
import { Card, StatWidget, Badge } from "@tn-os/ui";

function fmtVND(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B₫`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M₫`;
  return `${n.toLocaleString()}₫`;
}

export default function DashboardPage() {
  const s = useStocksStore();

  if (!s.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const sortedHoldings = [...s.holdings].sort(
    (a, b) => toUSD(b.shares * b.current_price, b.currency) - toUSD(a.shares * a.current_price, a.currency)
  );

  const riskVariant: "success" | "warning" | "danger" =
    s.valuationRisk === "low" ? "success" : s.valuationRisk === "medium" ? "warning" : "danger";

  const totalPnLUSD = s.holdings.reduce(
    (sum, h) => sum + toUSD((h.current_price - h.avg_buy_price) * h.shares, h.currency), 0
  );

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Stocks Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Portfolio overview — holdings, targets, analysis</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatWidget label="Total Value" value={`$${s.totalStockValueUSD.toFixed(0)}`} trend="up" />
        <StatWidget label="Total PnL" value={`$${totalPnLUSD.toFixed(0)}`} trend={totalPnLUSD >= 0 ? "up" : "down"} />
        <StatWidget label="Cash Available" value={`$${s.cash_available_usd.toFixed(0)}`} trend="neutral" />
        <StatWidget label="Annual Dividends" value={`$${s.annualDividendIncomeUSD.toFixed(0)}`} trend="up" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Positions</div>
          <div className="text-lg font-semibold text-white">{s.holdings.length}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Watchlist</div>
          <div className="text-lg font-semibold text-sky-400">{s.watchlist.length}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Buy Zones Active</div>
          <div className="text-lg font-semibold text-emerald-400">{s.activeBuyZones}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Valuation Risk</div>
          <div className="mt-1"><Badge variant={riskVariant}>{s.valuationRisk.toUpperCase()}</Badge></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {s.targets.slice(0, 2).map((t) => {
          const pct = t.target_shares > 0 ? Math.min((t.current_shares / t.target_shares) * 100, 100) : 0;
          return (
            <div key={t.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
              <div className="text-xs text-zinc-500 mb-1">{t.symbol} Target Progress</div>
              <div className="text-sm font-semibold text-zinc-200">{t.current_shares} / {t.target_shares} shares ({pct.toFixed(0)}%)</div>
              <div className="mt-1.5 h-1.5 bg-zinc-800 rounded-full">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <Card title={`Holdings (${s.holdings.length})`}>
        {sortedHoldings.length === 0 ? (
          <p className="text-zinc-600 text-sm mt-3">No holdings. Go to Settings to load sample data.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Symbol", "Shares", "Avg Buy", "Current", "Value (USD)", "PnL %"].map((h) => (
                    <th key={h} className="text-left py-2 pr-4 text-xs text-zinc-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedHoldings.map((h) => {
                  const valueUSD = toUSD(h.shares * h.current_price, h.currency);
                  const pct = h.avg_buy_price > 0 ? ((h.current_price - h.avg_buy_price) / h.avg_buy_price) * 100 : 0;
                  return (
                    <tr key={h.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="py-2.5 pr-4">
                        <div className="font-bold text-sky-400">{h.symbol}</div>
                        <div className="text-xs text-zinc-600">{h.sector}</div>
                      </td>
                      <td className="py-2.5 pr-4 text-zinc-200">{h.shares}</td>
                      <td className="py-2.5 pr-4 text-zinc-400">{h.currency === "VND" ? fmtVND(h.avg_buy_price) : `$${h.avg_buy_price}`}</td>
                      <td className="py-2.5 pr-4 text-zinc-200">{h.currency === "VND" ? fmtVND(h.current_price) : `$${h.current_price}`}</td>
                      <td className="py-2.5 pr-4 text-sky-400 font-medium">${valueUSD.toFixed(0)}</td>
                      <td className={`py-2.5 pr-4 font-medium ${pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>{pct.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Sector Allocation">
          <div className="mt-3 space-y-2">
            {Object.entries(s.sectorAllocation).sort((a, b) => b[1] - a[1]).map(([sector, val]) => {
              const pct = s.totalStockValueUSD > 0 ? (val / s.totalStockValueUSD) * 100 : 0;
              return (
                <div key={sector}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400">{sector}</span>
                    <span className="text-zinc-300">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1 bg-zinc-800 rounded-full">
                    <div className="h-full bg-sky-500/60 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title={`Buy Zones (${s.activeBuyZones} active)`}>
          <div className="mt-3 space-y-2">
            {s.buy_zones.filter((b) => b.status !== "passed").slice(0, 4).map((b) => (
              <div key={b.id} className="flex items-center justify-between py-1.5 border-b border-zinc-800/50 last:border-0">
                <div>
                  <div className="text-sm font-medium text-zinc-200">{b.symbol}</div>
                  <div className="text-xs text-zinc-500">{b.zone_low.toLocaleString()} – {b.zone_high.toLocaleString()} {b.currency}</div>
                </div>
                <Badge variant={b.status === "active" ? "success" : "neutral"}>{b.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
