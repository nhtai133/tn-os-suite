"use client";

import { useState } from "react";
import { useStocksStore } from "@/store/useStocksStore";
import type { WatchlistItem } from "@/store/useStocksStore";
import { Card, Badge, Button } from "@tn-os/ui";

type FormState = { symbol: string; name: string; current_price: string; target_buy_price: string; currency: "VND" | "USD"; sector: string; priority: WatchlistItem["priority"]; thesis: string; notes: string };
const emptyForm = (): FormState => ({ symbol: "", name: "", current_price: "", target_buy_price: "", currency: "VND", sector: "", priority: "medium", thesis: "", notes: "" });

const priorityVariant: Record<WatchlistItem["priority"], "danger" | "warning" | "neutral"> = { high: "danger", medium: "warning", low: "neutral" };

export default function WatchlistPage() {
  const s = useStocksStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WatchlistItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [filter, setFilter] = useState<WatchlistItem["priority"] | "all">("all");

  if (!s.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (w: WatchlistItem) => {
    setEditing(w);
    setForm({ symbol: w.symbol, name: w.name, current_price: String(w.current_price ?? ""), target_buy_price: String(w.target_buy_price ?? ""), currency: w.currency, sector: w.sector, priority: w.priority, thesis: w.thesis ?? "", notes: w.notes ?? "" });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { symbol: form.symbol.toUpperCase().trim(), name: form.name.trim(), current_price: form.current_price ? parseFloat(form.current_price) : undefined, target_buy_price: form.target_buy_price ? parseFloat(form.target_buy_price) : undefined, currency: form.currency, sector: form.sector.trim(), priority: form.priority, thesis: form.thesis.trim() || undefined, notes: form.notes.trim() || undefined };
    if (editing) { s.updateWatchlistItem({ ...editing, ...payload }); } else { s.addWatchlistItem(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const filtered = filter === "all" ? s.watchlist : s.watchlist.filter((w) => w.priority === filter);

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Watchlist</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Stocks on radar — waiting for right entry</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add to Watchlist</Button>
      </div>

      <div className="flex gap-2">
        {(["all", "high", "medium", "low"] as const).map((p) => {
          const count = p === "all" ? s.watchlist.length : s.watchlist.filter((w) => w.priority === p).length;
          return (
            <button key={p} onClick={() => setFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${filter === p ? "border-sky-500/40 bg-sky-500/10 text-sky-400" : "border-zinc-800 text-zinc-500 hover:text-white"}`}>
              {p} <span className="ml-1 opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Watchlist Item" : "Add to Watchlist"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Symbol *</label>
                <input required value={form.symbol} onChange={(e) => set("symbol", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="MBB" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Name *</label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="MB Bank" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Currency</label>
                <select value={form.currency} onChange={(e) => set("currency", e.target.value as "VND" | "USD")}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500">
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Priority</label>
                <select value={form.priority} onChange={(e) => set("priority", e.target.value as WatchlistItem["priority"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500">
                  {["high", "medium", "low"].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Current Price</label>
                <input type="number" step="any" value={form.current_price} onChange={(e) => set("current_price", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Target Buy Price</label>
                <input type="number" step="any" value={form.target_buy_price} onChange={(e) => set("target_buy_price", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Sector</label>
                <input value={form.sector} onChange={(e) => set("sector", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="Banking" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
                <input value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="Optional" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Thesis</label>
                <input value={form.thesis} onChange={(e) => set("thesis", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="Why watching this stock?" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" type="submit">{editing ? "Save" : "Add"}</Button>
              <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title={`Watchlist (${filtered.length})`}>
        {filtered.length === 0 ? <p className="text-zinc-600 text-sm mt-3">No items.</p> : (
          <div className="mt-3 space-y-2">
            {filtered.map((w) => {
              const upside = w.current_price && w.target_buy_price ? ((w.current_price - w.target_buy_price) / w.target_buy_price) * 100 : null;
              return (
                <div key={w.id} className="flex items-start justify-between py-2.5 border-b border-zinc-800/50 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sky-400">{w.symbol}</span>
                      <span className="text-sm text-zinc-400">{w.name}</span>
                      <Badge variant={priorityVariant[w.priority]}>{w.priority}</Badge>
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">{w.sector} · {w.currency}</div>
                    {w.thesis && <div className="text-xs text-zinc-500 italic mt-0.5">{w.thesis}</div>}
                  </div>
                  <div className="text-right ml-4">
                    {w.current_price && <div className="text-sm text-zinc-200">{w.current_price.toLocaleString()} {w.currency}</div>}
                    {w.target_buy_price && <div className="text-xs text-emerald-400">Buy at: {w.target_buy_price.toLocaleString()}</div>}
                    {upside !== null && <div className="text-xs text-zinc-500">{upside > 0 ? `${upside.toFixed(0)}% above` : `${Math.abs(upside).toFixed(0)}% below`} target</div>}
                    <div className="flex gap-2 mt-1 justify-end">
                      <button onClick={() => openEdit(w)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                      <button onClick={() => s.deleteWatchlistItem(w.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
