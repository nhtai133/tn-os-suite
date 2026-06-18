"use client";

import { useParams } from "next/navigation";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { PORTFOLIO_MAP } from "@/lib/portfolio-registry";
import { toUSD } from "@/lib/portfolio-metrics";
import { AllocationDonut } from "@/components/charts/AllocationDonut";

function fmtUSD(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

const COLORS = [
  "bg-sky-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-teal-500", "bg-orange-500", "bg-pink-500",
];

function AllocationSection({
  title,
  allocation,
  total,
  showDonut = false,
}: {
  title: string;
  allocation: Record<string, number>;
  total: number;
  showDonut?: boolean;
}) {
  const entries = Object.entries(allocation).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">{title}</h3>
        <p className="text-xs text-zinc-600">No data</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4">
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">{title}</h3>
      {showDonut && (
        <div className="mb-4 pb-4 border-b border-zinc-800/60">
          <AllocationDonut data={allocation} total={total} />
        </div>
      )}
      <div className="space-y-3">
        {entries.map(([label, value], i) => {
          const pct = total > 0 ? (value / total) * 100 : 0;
          const color = COLORS[i % COLORS.length] ?? "bg-zinc-500";
          return (
            <div key={label}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-zinc-300 font-medium">{label}</span>
                <span className="text-zinc-500 tabular-nums">
                  {fmtUSD(value)} &nbsp;·&nbsp; {pct.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${color} transition-all duration-500`}
                  style={{ width: `${Math.max(pct, 0.5)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AllocationPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const store = usePortfolioStore();
  const def = PORTFOLIO_MAP[id];

  if (!store.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;
  if (!def) return null;

  const holdings = store.getPortfolioHoldings(id);
  const metrics = store.getPortfolioMetrics(id);
  const total = metrics.value;

  if (holdings.length === 0) {
    return (
      <div className="p-8">
        <div className="border border-dashed border-zinc-800 rounded-xl p-10 text-center max-w-lg">
          <p className="text-zinc-400 font-medium mb-1">No holdings to allocate</p>
          <p className="text-zinc-600 text-sm">Add holdings first to see allocation breakdown.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-white">Allocation</h2>
        <p className="text-sm text-zinc-500">Portfolio value: {fmtUSD(total)}</p>
      </div>

      {/* Stacked overview bar */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4">
        <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">By Symbol</h3>
        <div className="flex h-6 rounded-full overflow-hidden gap-0.5">
          {Object.entries(metrics.allocationBySymbol)
            .sort((a, b) => b[1] - a[1])
            .map(([sym, val], i) => {
              const pct = total > 0 ? (val / total) * 100 : 0;
              const color = COLORS[i % COLORS.length] ?? "bg-zinc-500";
              return (
                <div
                  key={sym}
                  className={`${color} first:rounded-l-full last:rounded-r-full transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${sym}: ${pct.toFixed(1)}%`}
                />
              );
            })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
          {Object.entries(metrics.allocationBySymbol)
            .sort((a, b) => b[1] - a[1])
            .map(([sym, val], i) => {
              const pct = total > 0 ? (val / total) * 100 : 0;
              const color = COLORS[i % COLORS.length] ?? "bg-zinc-500";
              return (
                <div key={sym} className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className={`inline-block w-2.5 h-2.5 rounded-sm ${color}`} />
                  {sym} {pct.toFixed(1)}%
                </div>
              );
            })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AllocationSection title="By Sector" allocation={metrics.allocationBySector} total={total} showDonut />
        <AllocationSection title="By Asset Class" allocation={metrics.allocationByAssetClass} total={total} showDonut />
      </div>

      <AllocationSection title="By Broker" allocation={metrics.allocationByBroker} total={total} />

      {/* Detailed symbol breakdown */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="px-5 py-3 bg-zinc-900/60 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-300">Position Detail</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Symbol", "Qty", "Value (USD)", "% of Portfolio", "Sector", "Class"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs text-zinc-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...holdings]
              .sort((a, b) => toUSD(b.quantity * b.currentPrice, b.currency) - toUSD(a.quantity * a.currentPrice, a.currency))
              .map((h) => {
                const val = toUSD(h.quantity * h.currentPrice, h.currency);
                const pct = total > 0 ? (val / total) * 100 : 0;
                return (
                  <tr key={h.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="px-4 py-3 font-bold text-sky-400">{h.symbol}</td>
                    <td className="px-4 py-3 text-zinc-300">{h.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sky-400 font-medium">{fmtUSD(val)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-sky-500"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-zinc-400 tabular-nums text-xs w-10 text-right">{pct.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{h.sector ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{h.assetClass}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
