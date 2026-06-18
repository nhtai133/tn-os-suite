"use client";

import { useState } from "react";
import { useWatchlistStore } from "@/store/useWatchlistStore";
import type { WatchlistItem, WatchlistStatus } from "@/lib/watchlist-types";
import { WatchlistCard } from "@/components/watchlist/WatchlistCard";
import { BuyZoneCard } from "@/components/watchlist/BuyZoneCard";
import { PriorityTable } from "@/components/watchlist/PriorityTable";
import { ValuationCard } from "@/components/watchlist/ValuationCard";

const TABS = ["Watchlist", "Buy Zone", "Fair Value", "Margin of Safety", "Priority List"] as const;
type Tab = (typeof TABS)[number];

const STATUSES: WatchlistStatus[] = ["Watching", "Accumulating", "Hold", "Overvalued", "Sold"];
const PORTFOLIO_TYPES = ["RETIREMENT_5", "HOLD_10Y", "SWING_3_6M", "MEDIUM_3Y", "FUNDS_ETF"];

type FormState = {
  symbol: string;
  sector: string;
  portfolioType: string;
  currentPrice: string;
  fairValue: string;
  buyZoneLow: string;
  buyZoneHigh: string;
  targetPrice: string;
  priorityScore: string;
  status: WatchlistStatus;
  currency: "VND" | "USD";
  notes: string;
};

function emptyForm(): FormState {
  return {
    symbol: "", sector: "", portfolioType: "",
    currentPrice: "", fairValue: "", buyZoneLow: "",
    buyZoneHigh: "", targetPrice: "", priorityScore: "",
    status: "Watching", currency: "VND", notes: "",
  };
}

function formToItem(form: FormState): Omit<WatchlistItem, "id" | "createdAt" | "updatedAt"> {
  return {
    symbol: form.symbol.toUpperCase().trim(),
    sector: form.sector.trim() || undefined,
    portfolioType: form.portfolioType || undefined,
    currentPrice: parseFloat(form.currentPrice) || 0,
    fairValue: form.fairValue ? parseFloat(form.fairValue) : undefined,
    buyZoneLow: form.buyZoneLow ? parseFloat(form.buyZoneLow) : undefined,
    buyZoneHigh: form.buyZoneHigh ? parseFloat(form.buyZoneHigh) : undefined,
    targetPrice: form.targetPrice ? parseFloat(form.targetPrice) : undefined,
    priorityScore: form.priorityScore ? parseInt(form.priorityScore) : undefined,
    status: form.status,
    currency: form.currency,
    notes: form.notes.trim() || undefined,
  };
}

function itemToForm(item: WatchlistItem): FormState {
  return {
    symbol: item.symbol,
    sector: item.sector ?? "",
    portfolioType: item.portfolioType ?? "",
    currentPrice: String(item.currentPrice),
    fairValue: item.fairValue != null ? String(item.fairValue) : "",
    buyZoneLow: item.buyZoneLow != null ? String(item.buyZoneLow) : "",
    buyZoneHigh: item.buyZoneHigh != null ? String(item.buyZoneHigh) : "",
    targetPrice: item.targetPrice != null ? String(item.targetPrice) : "",
    priorityScore: item.priorityScore != null ? String(item.priorityScore) : "",
    status: item.status,
    currency: item.currency,
    notes: item.notes ?? "",
  };
}

function mos(item: WatchlistItem): number | null {
  if (!item.fairValue || item.fairValue <= 0) return null;
  return ((item.fairValue - item.currentPrice) / item.fairValue) * 100;
}

export default function WatchlistPage() {
  const store = useWatchlistStore();
  const [tab, setTab] = useState<Tab>("Watchlist");
  const [statusFilter, setStatusFilter] = useState<WatchlistStatus | "All">("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WatchlistItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!store.hydrated) {
    return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;
  }

  const { items, addItem, updateItem, deleteItem } = store;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (item: WatchlistItem) => { setEditing(item); setForm(itemToForm(item)); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const payload = formToItem(form);
    if (editing) updateItem({ ...payload, id: editing.id, createdAt: editing.createdAt, updatedAt: editing.updatedAt });
    else addItem(payload);
    closeModal();
  };

  const set = (key: keyof FormState, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const filtered = statusFilter === "All" ? items : items.filter((x) => x.status === statusFilter);

  // Buy Zone tab: items that have a buy zone defined
  const withZone = items.filter((x) => x.buyZoneLow != null && x.buyZoneHigh != null);
  const inZone = withZone.filter((x) => x.currentPrice >= x.buyZoneLow! && x.currentPrice <= x.buyZoneHigh!);

  // Fair Value tab: items with fairValue
  const withFairValue = items.filter((x) => x.fairValue != null);

  // MoS tab: items with fairValue sorted by MoS desc
  const mosSorted = [...withFairValue].sort((a, b) => (mos(b) ?? -999) - (mos(a) ?? -999));

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Watchlist</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Stock hunting · Buy zones · Valuations</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition-colors"
        >
          + Add Stock
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs text-zinc-500 flex-wrap">
        <span>{items.length} tracked</span>
        <span>·</span>
        <span className="text-emerald-400">{items.filter((x) => x.status === "Accumulating").length} accumulating</span>
        <span>·</span>
        <span className="text-sky-400">{inZone.length} in buy zone</span>
        <span>·</span>
        <span className="text-zinc-400">{withFairValue.filter((x) => (mos(x) ?? 0) >= 20).length} at 20%+ MoS</span>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 border-b border-zinc-800 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t ? "border-sky-500 text-sky-400" : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Watchlist Tab ── */}
      {tab === "Watchlist" && (
        <div className="space-y-4">
          {/* Status filter */}
          <div className="flex gap-2 flex-wrap">
            {(["All", ...STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-sky-500/20 text-sky-400 border border-sky-500/40"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center text-sm text-zinc-500">
              {items.length === 0 ? "No stocks tracked yet. Click + Add Stock to start." : "No stocks match this filter."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((item) => (
                <WatchlistCard key={item.id} item={item} onEdit={openEdit} onDelete={deleteItem} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Buy Zone Tab ── */}
      {tab === "Buy Zone" && (
        <div className="space-y-4">
          {inZone.length > 0 && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-sm text-emerald-400">
              {inZone.length} stock{inZone.length !== 1 ? "s" : ""} currently in buy zone
            </div>
          )}
          {withZone.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center text-sm text-zinc-500">
              No stocks with buy zones defined. Edit a stock to add buy zone low/high.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {withZone
                .sort((a, b) => {
                  const aIn = a.currentPrice >= a.buyZoneLow! && a.currentPrice <= a.buyZoneHigh!;
                  const bIn = b.currentPrice >= b.buyZoneLow! && b.currentPrice <= b.buyZoneHigh!;
                  return Number(bIn) - Number(aIn);
                })
                .map((item) => (
                  <BuyZoneCard key={item.id} item={item} onEdit={openEdit} />
                ))}
            </div>
          )}
        </div>
      )}

      {/* ── Fair Value Tab ── */}
      {tab === "Fair Value" && (
        <div className="space-y-4">
          {withFairValue.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center text-sm text-zinc-500">
              No stocks with fair values. Edit a stock to add a fair value estimate.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {withFairValue.map((item) => (
                <ValuationCard key={item.id} item={item} onEdit={openEdit} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Margin of Safety Tab ── */}
      {tab === "Margin of Safety" && (
        <div className="space-y-4">
          {mosSorted.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center text-sm text-zinc-500">
              Set fair values to see margin of safety rankings.
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Symbol</th>
                    <th className="px-4 py-3 text-right">Current</th>
                    <th className="px-4 py-3 text-right">Fair Value</th>
                    <th className="px-4 py-3 text-right">MoS</th>
                    <th className="px-4 py-3 text-left">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {mosSorted.map((item, i) => {
                    const m = mos(item)!;
                    let verdict = "Overvalued";
                    let verdictColor = "text-red-400";
                    if (m >= 30) { verdict = "Strong Buy"; verdictColor = "text-emerald-400"; }
                    else if (m >= 15) { verdict = "Undervalued"; verdictColor = "text-green-400"; }
                    else if (m >= 0) { verdict = "Fair"; verdictColor = "text-yellow-400"; }

                    return (
                      <tr key={item.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 text-zinc-600 text-xs">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{item.symbol}</div>
                          {item.sector && <div className="text-xs text-zinc-600">{item.sector}</div>}
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-300">{item.currentPrice.toLocaleString()} {item.currency}</td>
                        <td className="px-4 py-3 text-right text-zinc-400">{item.fairValue!.toLocaleString()} {item.currency}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-bold ${m >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {m >= 0 ? "+" : ""}{m.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs ${verdictColor}`}>{verdict}</span>
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

      {/* ── Priority List Tab ── */}
      {tab === "Priority List" && (
        <div className="space-y-4">
          <div className="text-sm text-zinc-400">Sorted by priority score (highest first). Excludes sold positions.</div>
          <PriorityTable items={items} onEdit={openEdit} />
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                {editing ? "Edit Stock" : "Add Stock"}
              </h2>
              <button onClick={closeModal} className="text-zinc-500 hover:text-zinc-300 text-lg">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Symbol */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Symbol *</label>
                  <input
                    required
                    value={form.symbol}
                    onChange={(e) => set("symbol", e.target.value)}
                    placeholder="VCB"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Sector */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Sector</label>
                  <input
                    value={form.sector}
                    onChange={(e) => set("sector", e.target.value)}
                    placeholder="Banking, Real Estate..."
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => set("currency", e.target.value as "VND" | "USD")}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="VND">VND</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                {/* Portfolio Type */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Portfolio Target</label>
                  <select
                    value={form.portfolioType}
                    onChange={(e) => set("portfolioType", e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="">— None —</option>
                    {PORTFOLIO_TYPES.map((pt) => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value as WatchlistStatus)}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Priority Score */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Priority Score (1–10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.priorityScore}
                    onChange={(e) => set("priorityScore", e.target.value)}
                    placeholder="8"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Current Price */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Current Price *</label>
                  <input
                    required
                    type="number"
                    step="any"
                    value={form.currentPrice}
                    onChange={(e) => set("currentPrice", e.target.value)}
                    placeholder="85000"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Fair Value */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Fair Value</label>
                  <input
                    type="number"
                    step="any"
                    value={form.fairValue}
                    onChange={(e) => set("fairValue", e.target.value)}
                    placeholder="100000"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Buy Zone Low */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Buy Zone Low</label>
                  <input
                    type="number"
                    step="any"
                    value={form.buyZoneLow}
                    onChange={(e) => set("buyZoneLow", e.target.value)}
                    placeholder="70000"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Buy Zone High */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Buy Zone High</label>
                  <input
                    type="number"
                    step="any"
                    value={form.buyZoneHigh}
                    onChange={(e) => set("buyZoneHigh", e.target.value)}
                    placeholder="80000"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Target Price */}
                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 mb-1 block">Target Price</label>
                  <input
                    type="number"
                    step="any"
                    value={form.targetPrice}
                    onChange={(e) => set("targetPrice", e.target.value)}
                    placeholder="120000"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Notes */}
                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    rows={2}
                    placeholder="Investment thesis, catalysts, risks..."
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition-colors"
                >
                  {editing ? "Save Changes" : "Add Stock"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
                >
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
