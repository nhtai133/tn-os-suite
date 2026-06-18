"use client";

import { useState } from "react";
import { usePriceStore } from "@/store/usePriceStore";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { PRICE_PROVIDERS } from "@/lib/price-types";
import type { PriceSource } from "@/lib/price-types";
import { PriceCard } from "@/components/prices/PriceCard";
import { SyncStatusCard } from "@/components/prices/SyncStatusCard";

const TABS = ["Price Sources", "Price History"] as const;
type Tab = (typeof TABS)[number];

type FormState = { symbol: string; price: string; currency: "VND" | "USD"; date: string; source: PriceSource };
function emptyForm(): FormState {
  return { symbol: "", price: "", currency: "VND", date: new Date().toISOString().split("T")[0]!, source: "Manual" };
}

export default function PricesPage() {
  const priceStore = usePriceStore();
  const portfolioStore = usePortfolioStore();

  const [tab, setTab] = useState<Tab>("Price Sources");
  const [filterSymbol, setFilterSymbol] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!priceStore.hydrated || !portfolioStore.hydrated) {
    return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;
  }

  const { entries, addEntry, deleteEntry, getLatestPrice, getHistory, addMockPrices } = priceStore;

  // Unique symbols tracked in portfolio
  const portfolioSymbols = [...new Set(portfolioStore.holdings.map((h) => h.symbol))];
  // Unique symbols in price store
  const priceSymbols = [...new Set(entries.map((e) => e.symbol))];
  const allSymbols = [...new Set([...portfolioSymbols, ...priceSymbols])].sort();

  const filteredHistory = filterSymbol
    ? entries.filter((e) => e.symbol === filterSymbol).sort((a, b) => b.date.localeCompare(a.date))
    : entries.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50);

  const handleAdd = (ev: React.FormEvent) => {
    ev.preventDefault();
    addEntry({
      symbol: form.symbol.toUpperCase().trim(),
      price: parseFloat(form.price),
      currency: form.currency,
      date: form.date,
      source: form.source,
    });
    setAddOpen(false);
    setForm(emptyForm());
  };

  const handleMock = () => {
    const symbols = portfolioSymbols.slice(0, 10).map((sym) => {
      const holding = portfolioStore.holdings.find((h) => h.symbol === sym);
      return { symbol: sym, basePrice: holding?.currentPrice ?? 100, currency: holding?.currency ?? "VND" as const };
    });
    addMockPrices(symbols);
  };

  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  // Last sync per provider
  const lastSyncBySource = (source: PriceSource) =>
    entries.filter((e) => e.source === source).sort((a, b) => b.date.localeCompare(a.date))[0]?.date;
  const countBySource = (source: PriceSource) => entries.filter((e) => e.source === source).length;

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Price Sync</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manual price updates · Price history · Adapter interfaces</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleMock} className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-medium transition-colors">
            Mock Sync
          </button>
          <button onClick={() => setAddOpen(true)} className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition-colors">
            + Manual Entry
          </button>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 border-b border-zinc-800">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t ? "border-sky-500 text-sky-400" : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}>{t}</button>
        ))}
      </div>

      {/* ── Price Sources ── */}
      {tab === "Price Sources" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRICE_PROVIDERS.map((p) => (
              <SyncStatusCard key={p.id} provider={p}
                lastSync={lastSyncBySource(p.id)}
                entryCount={countBySource(p.id)} />
            ))}
          </div>

          {/* Per-symbol latest prices */}
          {allSymbols.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Latest Prices</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {allSymbols.map((sym) => {
                  const history = getHistory(sym);
                  return (
                    <PriceCard key={sym} symbol={sym}
                      latest={history[0]}
                      previous={history[1]}
                      entryCount={history.length} />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Price History ── */}
      {tab === "Price History" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select value={filterSymbol} onChange={(e) => setFilterSymbol(e.target.value)}
              className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-sky-500">
              <option value="">All Symbols</option>
              {allSymbols.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-xs text-zinc-500">{filteredHistory.length} entries{!filterSymbol && entries.length > 50 ? ` (showing 50 of ${entries.length})` : ""}</span>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-10 text-center text-sm text-zinc-500">
              No price history. Add a manual entry or run Mock Sync.
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Symbol</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-left">Source</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((e) => (
                    <tr key={e.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{e.symbol}</td>
                      <td className="px-4 py-3 text-zinc-400">{e.date}</td>
                      <td className="px-4 py-3 text-right text-zinc-300">
                        {e.price.toLocaleString()} {e.currency}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">{e.source}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => deleteEntry(e.id)} className="text-xs text-zinc-600 hover:text-red-400 transition-colors">
                          Del
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
            <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Manual Price Entry</h2>
              <button onClick={() => setAddOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-lg">✕</button>
            </div>
            <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Symbol *</label>
                <input required value={form.symbol} onChange={(e) => set("symbol", e.target.value)}
                  list="price-symbols" placeholder="VCB"
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" />
                <datalist id="price-symbols">
                  {allSymbols.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Price *</label>
                  <input required type="number" step="any" value={form.price} onChange={(e) => set("price", e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Currency</label>
                  <select value={form.currency} onChange={(e) => set("currency", e.target.value as "VND" | "USD")}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500">
                    <option value="VND">VND</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Date</label>
                <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition-colors">
                  Save
                </button>
                <button type="button" onClick={() => setAddOpen(false)} className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors">
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
