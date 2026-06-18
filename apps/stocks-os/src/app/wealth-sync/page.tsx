"use client";

import { useMemo, useState } from "react";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { useDividendStore } from "@/store/useDividendStore";
import { useBrokerStore } from "@/store/useBrokerStore";
import { STOCK_PORTFOLIOS } from "@/lib/portfolio-registry";
import type { StocksSnapshot } from "@/lib/wealth-sync-types";
import { WealthExportCard } from "@/components/wealth/WealthExportCard";

const VND_TO_USD = 25_000;
function toUSD(n: number, c: "VND" | "USD") { return c === "VND" ? n / VND_TO_USD : n; }
const USD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);

export default function WealthSyncPage() {
  const portfolioStore = usePortfolioStore();
  const dividendStore = useDividendStore();
  const brokerStore = useBrokerStore();
  const [saved, setSaved] = useState(false);

  const snapshot = useMemo<StocksSnapshot>(() => {
    const gm = portfolioStore.globalMetrics;
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const received = dividendStore.events.filter((e) => e.status === "received");
    const ytdDivs = received
      .filter((e) => e.exDate.startsWith(currentYear))
      .reduce((s, e) => s + toUSD(e.netAmount, e.currency), 0);
    const last12mo = new Date(now);
    last12mo.setFullYear(last12mo.getFullYear() - 1);
    const runRate = received
      .filter((e) => new Date(e.exDate) >= last12mo)
      .reduce((s, e) => s + toUSD(e.netAmount, e.currency), 0);
    const totalCash = brokerStore.accounts.reduce((s, a) => s + toUSD(a.cash, a.currency), 0);

    const portfolios = STOCK_PORTFOLIOS.map((p) => {
      const m = portfolioStore.getPortfolioMetrics(p.id);
      return { id: p.id, name: p.name, value: m.value, invested: m.investedCapital, unrealizedPL: m.unrealizedPnL };
    });

    return {
      version: "1.0",
      generatedAt: now.toISOString(),
      source: "stocks-os",
      totalValue: gm.totalValue,
      investedCapital: gm.totalInvested,
      cash: totalCash,
      unrealizedPL: gm.totalUnrealized,
      realizedPL: gm.totalRealized,
      dividendIncome: ytdDivs,
      monthlyIncome: runRate / 12,
      currency: "USD",
      portfolios,
    };
  }, [portfolioStore, dividendStore, brokerStore]);

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stocks-os-snapshot-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveToLocalStorage = () => {
    const key = "tn_os_stocks_snapshot";
    const history = (() => {
      try { return JSON.parse(localStorage.getItem(key + "_history") ?? "[]") as StocksSnapshot[]; }
      catch { return []; }
    })();
    history.unshift(snapshot);
    localStorage.setItem(key, JSON.stringify(snapshot));
    localStorage.setItem(key + "_history", JSON.stringify(history.slice(0, 30)));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!portfolioStore.hydrated || !dividendStore.hydrated || !brokerStore.hydrated) {
    return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;
  }

  const gm = portfolioStore.globalMetrics;

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Wealth OS Sync</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Export Stocks OS data to Wealth OS · JSON contract</p>
      </div>

      {/* Live KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Value", value: USD(gm.totalValue), color: "text-white" },
          { label: "Invested", value: USD(gm.totalInvested), color: "text-zinc-300" },
          { label: "Unrealized P/L", value: (gm.totalUnrealized >= 0 ? "+" : "") + USD(gm.totalUnrealized), color: gm.totalUnrealized >= 0 ? "text-emerald-400" : "text-red-400" },
          { label: "Holdings", value: String(gm.totalHoldings), color: "text-sky-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <div className="text-xs text-zinc-500 mb-1">{label}</div>
            <div className={`text-lg font-semibold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Sync actions */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={handleSaveToLocalStorage}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            saved ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-zinc-700 hover:bg-zinc-600 text-zinc-200"
          }`}>
          {saved ? "Saved to localStorage ✓" : "Save Snapshot"}
        </button>
      </div>

      {/* Export Card */}
      <div>
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">JSON Export Contract</div>
        <WealthExportCard snapshot={snapshot} onDownload={handleDownload} />
      </div>

      {/* Portfolio breakdown */}
      <div>
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Portfolio Breakdown</div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Portfolio</th>
                <th className="px-4 py-3 text-right">Value</th>
                <th className="px-4 py-3 text-right">Invested</th>
                <th className="px-4 py-3 text-right">Unrealized P/L</th>
                <th className="px-4 py-3 text-right">Weight</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.portfolios.map((p) => (
                <tr key={p.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 text-zinc-200">{p.name}</td>
                  <td className="px-4 py-3 text-right text-sky-400">{USD(p.value)}</td>
                  <td className="px-4 py-3 text-right text-zinc-400">{USD(p.invested)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={p.unrealizedPL >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {p.unrealizedPL >= 0 ? "+" : ""}{USD(p.unrealizedPL)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-500">
                    {snapshot.totalValue > 0 ? `${((p.value / snapshot.totalValue) * 100).toFixed(1)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
