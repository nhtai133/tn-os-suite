"use client";

import { useCryptoStore } from "@/store/useCryptoStore";
import { Card, StatWidget, Badge } from "@tn-os/ui";

export default function DashboardPage() {
  const c = useCryptoStore();

  if (!c.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const totalValue = c.totalCryptoValueUSD;
  const pnlMap = c.holdings.map((h) => ({
    symbol: h.symbol,
    pnl: (h.current_price - h.avg_buy_price) * h.amount,
    pct: h.avg_buy_price > 0 ? ((h.current_price - h.avg_buy_price) / h.avg_buy_price) * 100 : 0,
  }));
  const totalPnL = pnlMap.reduce((s, x) => s + x.pnl, 0);

  const topHoldings = [...c.holdings]
    .sort((a, b) => b.amount * b.current_price - a.amount * a.current_price)
    .slice(0, 5);

  const riskVariant: "success" | "warning" | "danger" =
    c.exchangeRisk === "low" ? "success" : c.exchangeRisk === "medium" ? "warning" : "danger";
  const secVariant: "success" | "warning" | "danger" =
    c.securityScore >= 80 ? "success" : c.securityScore >= 50 ? "warning" : "danger";

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Crypto Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Portfolio overview — holdings, DeFi, security</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatWidget label="Total Portfolio" value={`$${totalValue.toFixed(0)}`} trend="up" />
        <StatWidget label="Total PnL" value={`$${totalPnL.toFixed(0)}`} trend={totalPnL >= 0 ? "up" : "down"} />
        <StatWidget label="BTC Held" value={`${c.btcAmount.toFixed(4)} BTC`} trend="neutral" />
        <StatWidget label="ETH Held" value={`${c.ethAmount.toFixed(3)} ETH`} trend="neutral" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Stablecoins</div>
          <div className="text-lg font-semibold text-emerald-400">${c.stablecoinBalanceUSD.toFixed(0)}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">DeFi Exposure</div>
          <div className="text-lg font-semibold text-amber-400">${c.defiExposureUSD.toFixed(0)}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Cold Storage</div>
          <div className="text-lg font-semibold text-blue-400">${c.coldWalletValueUSD.toFixed(0)}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Security Score</div>
          <div className={`text-lg font-semibold ${c.securityScore >= 80 ? "text-emerald-400" : "text-amber-400"}`}>{c.securityScore}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-2">Exchange Risk</div>
          <Badge variant={riskVariant}>{c.exchangeRisk.toUpperCase()}</Badge>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Security Status</div>
          <Badge variant={secVariant}>{c.securityScore}% complete</Badge>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">BTC Target</div>
          <div className="text-sm font-semibold text-amber-400">{c.targetBTCProgressPct.toFixed(0)}% of {c.target_btc_amount} BTC goal</div>
          <div className="mt-1.5 h-1.5 bg-zinc-800 rounded-full">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${c.targetBTCProgressPct}%` }} />
          </div>
        </div>
      </div>

      <Card title={`Top Holdings (${topHoldings.length})`}>
        {topHoldings.length === 0 ? (
          <p className="text-zinc-600 text-sm mt-3">No holdings yet. Go to Settings to load sample data.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Symbol", "Amount", "Avg Buy", "Current", "Value", "PnL %"].map((h) => (
                    <th key={h} className="text-left py-2 pr-4 text-xs text-zinc-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topHoldings.map((h) => {
                  const value = h.amount * h.current_price;
                  const pct = h.avg_buy_price > 0 ? ((h.current_price - h.avg_buy_price) / h.avg_buy_price) * 100 : 0;
                  return (
                    <tr key={h.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="py-2.5 pr-4 font-bold text-amber-400">{h.symbol}</td>
                      <td className="py-2.5 pr-4 text-zinc-200">{h.amount}</td>
                      <td className="py-2.5 pr-4 text-zinc-400">${h.avg_buy_price.toLocaleString()}</td>
                      <td className="py-2.5 pr-4 text-zinc-200">${h.current_price.toLocaleString()}</td>
                      <td className="py-2.5 pr-4 text-amber-400 font-medium">${value.toFixed(0)}</td>
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
        <Card title={`DeFi Positions (${c.defi_positions.filter((p) => p.status === "active").length} active)`}>
          <div className="mt-3 space-y-2">
            {c.defi_positions.filter((p) => p.status === "active").map((p) => (
              <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-zinc-800/50 last:border-0">
                <div>
                  <div className="text-sm text-zinc-200">{p.protocol}</div>
                  <div className="text-xs text-zinc-500">{p.chain} · {p.type}{p.apy ? ` · ${p.apy}% APY` : ""}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-amber-400">${p.value_usd.toFixed(0)}</div>
                  <Badge variant={p.risk === "low" ? "success" : p.risk === "medium" ? "warning" : "danger"}>{p.risk}</Badge>
                </div>
              </div>
            ))}
            {c.defi_positions.filter((p) => p.status === "active").length === 0 && (
              <p className="text-zinc-600 text-sm">No active DeFi positions.</p>
            )}
          </div>
        </Card>

        <Card title={`Security Checklist (${c.security_checklist.filter((x) => x.done).length}/${c.security_checklist.length})`}>
          <div className="mt-3 space-y-1.5">
            {c.security_checklist.slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-start gap-2 text-sm">
                <span className={item.done ? "text-emerald-400" : "text-zinc-600"}>{item.done ? "✓" : "○"}</span>
                <span className={item.done ? "text-zinc-400 line-through" : "text-zinc-200"}>{item.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
