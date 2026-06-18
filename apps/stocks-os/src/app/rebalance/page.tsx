"use client";

import { useState, useMemo } from "react";
import { useRebalanceStore } from "@/store/useRebalanceStore";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { STOCK_PORTFOLIOS } from "@/lib/portfolio-registry";
import type { RebalanceTarget, RebalanceRule } from "@/lib/rebalance-types";
import { RebalanceCard } from "@/components/rebalance/RebalanceCard";
import { AllocationDiffTable } from "@/components/rebalance/AllocationDiffTable";

const TABS = ["Target Allocation", "Current Allocation", "Deviation", "Suggestions"] as const;
type Tab = (typeof TABS)[number];
const THRESHOLD = 5;

type FormState = { portfolioId: string; symbol: string; targetWeight: string; notes: string };
function emptyForm(pid: string): FormState {
  return { portfolioId: pid, symbol: "", targetWeight: "", notes: "" };
}

function computeRules(
  targets: RebalanceTarget[],
  holdingAllocs: { symbol: string; weight: number }[]
): { rules: RebalanceRule[]; unmapped: { symbol: string; currentWeight: number }[] } {
  const allocMap = Object.fromEntries(holdingAllocs.map((a) => [a.symbol, a.weight]));
  const rules: RebalanceRule[] = targets.map((t) => {
    const current = allocMap[t.symbol] ?? 0;
    const deviation = current - t.targetWeight;
    const action = deviation < -THRESHOLD ? "Add" : deviation > THRESHOLD ? "Trim" : "Hold";
    return { target: t, currentWeight: current, deviation, action };
  });
  const targetSymbols = new Set(targets.map((t) => t.symbol));
  const unmapped = holdingAllocs
    .filter((a) => !targetSymbols.has(a.symbol))
    .map((a) => ({ symbol: a.symbol, currentWeight: a.weight }));
  return { rules, unmapped };
}

export default function RebalancePage() {
  const rebalanceStore = useRebalanceStore();
  const portfolioStore = usePortfolioStore();
  const [tab, setTab] = useState<Tab>("Target Allocation");
  const [selectedPortfolio, setSelectedPortfolio] = useState(STOCK_PORTFOLIOS[0]?.id ?? "");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RebalanceTarget | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(selectedPortfolio));

  // Suggestions: collect all portfolios with deviations — must be before any early return
  const allSuggestions = useMemo(() => {
    if (!rebalanceStore.hydrated || !portfolioStore.hydrated) return [];
    return STOCK_PORTFOLIOS.flatMap((p) => {
      const targets = rebalanceStore.getByPortfolio(p.id);
      if (targets.length === 0) return [];
      const pm = portfolioStore.getPortfolioMetrics(p.id);
      const tv = pm.value || 1;
      const allocs = Object.entries(pm.allocationBySymbol).map(([symbol, usdVal]) => ({ symbol, weight: (usdVal / tv) * 100 }));
      const { rules } = computeRules(targets, allocs);
      return rules
        .filter((r) => r.action !== "Hold")
        .map((r) => ({ ...r, portfolioName: p.name }));
    });
  }, [rebalanceStore, portfolioStore]);

  if (!rebalanceStore.hydrated || !portfolioStore.hydrated) {
    return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;
  }

  const { addTarget, updateTarget, deleteTarget, getByPortfolio } = rebalanceStore;

  const portfolioTargets = getByPortfolio(selectedPortfolio);
  const metrics = portfolioStore.getPortfolioMetrics(selectedPortfolio);
  const totalValue = metrics.value || 1;
  const holdingAllocs = Object.entries(metrics.allocationBySymbol).map(([symbol, usdValue]) => ({
    symbol,
    weight: (usdValue / totalValue) * 100,
  }));

  const { rules, unmapped } = computeRules(portfolioTargets, holdingAllocs);
  const totalTarget = portfolioTargets.reduce((s, t) => s + t.targetWeight, 0);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm(selectedPortfolio));
    setModalOpen(true);
  };
  const openEdit = (t: RebalanceTarget) => {
    setEditing(t);
    setForm({ portfolioId: t.portfolioId, symbol: t.symbol, targetWeight: String(t.targetWeight), notes: t.notes ?? "" });
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const payload = {
      portfolioId: form.portfolioId,
      symbol: form.symbol.toUpperCase().trim(),
      targetWeight: parseFloat(form.targetWeight) || 0,
      notes: form.notes.trim() || undefined,
    };
    if (editing) updateTarget({ ...payload, id: editing.id });
    else addTarget(payload);
    closeModal();
  };

  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const PortfolioSelector = (
    <select
      value={selectedPortfolio}
      onChange={(e) => setSelectedPortfolio(e.target.value)}
      className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-sky-500"
    >
      {STOCK_PORTFOLIOS.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  );

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Rebalancing</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Target weights · Deviations · Suggested actions</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition-colors">
          + Add Target
        </button>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 border-b border-zinc-800">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t ? "border-sky-500 text-sky-400" : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}>
            {t}
            {t === "Suggestions" && allSuggestions.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400 text-[10px]">
                {allSuggestions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Target Allocation ── */}
      {tab === "Target Allocation" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {PortfolioSelector}
            {Math.abs(totalTarget - 100) > 0.5 && portfolioTargets.length > 0 && (
              <span className="text-xs text-amber-400">Sum: {totalTarget.toFixed(1)}% (should be 100%)</span>
            )}
          </div>
          {portfolioTargets.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center text-sm text-zinc-500">
              No targets set for this portfolio. Click + Add Target to define target allocations.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rules.map((r) => (
                <RebalanceCard key={r.target.id} rule={r} onEdit={() => openEdit(r.target)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Current Allocation ── */}
      {tab === "Current Allocation" && (
        <div className="space-y-4">
          {PortfolioSelector}
          {holdingAllocs.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-10 text-center text-sm text-zinc-500">
              No holdings in this portfolio.
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Symbol</th>
                    <th className="px-4 py-3 text-right">Current %</th>
                    <th className="px-4 py-3 text-right">Target %</th>
                    <th className="px-4 py-3 text-left">Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {holdingAllocs.sort((a, b) => b.weight - a.weight).map((a) => {
                    const t = portfolioTargets.find((x) => x.symbol === a.symbol);
                    return (
                      <tr key={a.symbol} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{a.symbol}</td>
                        <td className="px-4 py-3 text-right text-zinc-300">{a.weight.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right text-zinc-500">{t ? `${t.targetWeight.toFixed(1)}%` : "—"}</td>
                        <td className="px-4 py-3 w-40">
                          <div className="h-1.5 rounded-full bg-zinc-800">
                            <div className="h-full rounded-full bg-sky-500/70" style={{ width: `${Math.min(100, a.weight)}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Deviation ── */}
      {tab === "Deviation" && (
        <div className="space-y-4">
          {PortfolioSelector}
          <AllocationDiffTable rules={rules} unmapped={unmapped} />
        </div>
      )}

      {/* ── Suggestions ── */}
      {tab === "Suggestions" && (
        <div className="space-y-3">
          {allSuggestions.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center text-sm text-zinc-500">
              All portfolios are within ±{THRESHOLD}% of their target allocations. Nothing to do.
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Portfolio</th>
                    <th className="px-4 py-3 text-left">Symbol</th>
                    <th className="px-4 py-3 text-right">Target %</th>
                    <th className="px-4 py-3 text-right">Current %</th>
                    <th className="px-4 py-3 text-right">Deviation</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allSuggestions.map((r, i) => (
                    <tr key={i} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 text-zinc-400 text-xs">{r.portfolioName}</td>
                      <td className="px-4 py-3 font-medium text-white">{r.target.symbol}</td>
                      <td className="px-4 py-3 text-right text-zinc-400">{r.target.targetWeight.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right text-zinc-300">{r.currentWeight.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right">
                        <span className={r.deviation > 0 ? "text-red-400" : "text-emerald-400"}>
                          {r.deviation > 0 ? "+" : ""}{r.deviation.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={r.action === "Add" ? "text-emerald-400" : "text-red-400"}>
                          {r.action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
            <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">{editing ? "Edit Target" : "Add Target"}</h2>
              <button onClick={closeModal} className="text-zinc-500 hover:text-zinc-300 text-lg">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Portfolio</label>
                <select value={form.portfolioId} onChange={(e) => set("portfolioId", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500">
                  {STOCK_PORTFOLIOS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Symbol *</label>
                <input required value={form.symbol} onChange={(e) => set("symbol", e.target.value)}
                  placeholder="VCB"
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Target Weight (%) *</label>
                <input required type="number" step="0.1" min="0" max="100" value={form.targetWeight} onChange={(e) => set("targetWeight", e.target.value)}
                  placeholder="20"
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
                <input value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  placeholder="Core holding, DCA monthly..."
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition-colors">
                  {editing ? "Save" : "Add"}
                </button>
                {editing && (
                  <button type="button" onClick={() => { deleteTarget(editing.id); closeModal(); }}
                    className="px-5 py-2 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-400 text-sm font-medium transition-colors">
                    Delete
                  </button>
                )}
                <button type="button" onClick={closeModal}
                  className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
