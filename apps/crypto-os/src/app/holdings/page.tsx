"use client";

import { useState } from "react";
import { useCryptoStore } from "@/store/useCryptoStore";
import { useLivePrices } from "@/hooks/useLivePrices";
import type { CryptoHolding } from "@/store/useCryptoStore";
import { Card, Badge, Button } from "@tn-os/ui";

type FormState = { symbol: string; name: string; amount: string; avg_buy_price: string; current_price: string; location: string; category: CryptoHolding["category"]; notes: string };
const emptyForm = (): FormState => ({ symbol: "", name: "", amount: "", avg_buy_price: "", current_price: "", location: "", category: "layer1", notes: "" });

export default function HoldingsPage() {
  const c = useCryptoStore();
  const livePrices = useLivePrices(c.holdings.map((h) => h.symbol));
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CryptoHolding | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!c.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (h: CryptoHolding) => {
    setEditing(h);
    setForm({ symbol: h.symbol, name: h.name, amount: String(h.amount), avg_buy_price: String(h.avg_buy_price), current_price: String(h.current_price), location: h.location, category: h.category, notes: h.notes ?? "" });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { symbol: form.symbol.toUpperCase().trim(), name: form.name.trim(), amount: parseFloat(form.amount) || 0, avg_buy_price: parseFloat(form.avg_buy_price) || 0, current_price: parseFloat(form.current_price) || 0, location: form.location.trim(), category: form.category, notes: form.notes.trim() || undefined };
    if (editing) { c.updateHolding({ ...editing, ...payload }); } else { c.addHolding(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const priceFor = (symbol: string, fallback: number) => livePrices.prices[symbol.toUpperCase()]?.usd ?? fallback;
  const sorted = [...c.holdings].sort((a, b) => b.amount * priceFor(b.symbol, b.current_price) - a.amount * priceFor(a.symbol, a.current_price));
  const totalValue = sorted.reduce((s, h) => s + h.amount * priceFor(h.symbol, h.current_price), 0);

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Holdings</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            All crypto assets across wallets and exchanges
            {livePrices.loading ? " · refreshing prices" : ""}
            {livePrices.error ? ` · live prices unavailable: ${livePrices.error}` : ""}
          </p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Holding</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Total Value</div>
          <div className="text-lg font-semibold text-amber-400">${totalValue.toFixed(0)}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">BTC</div>
          <div className="text-lg font-semibold text-orange-400">{c.btcAmount.toFixed(4)}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">ETH</div>
          <div className="text-lg font-semibold text-purple-400">{c.ethAmount.toFixed(3)}</div>
        </div>
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Holding" : "Add Holding"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Symbol *</label>
                <input required value={form.symbol} onChange={(e) => set("symbol", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="BTC" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Name *</label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="Bitcoin" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Amount *</label>
                <input required type="number" step="any" value={form.amount} onChange={(e) => set("amount", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Location *</label>
                <input required value={form.location} onChange={(e) => set("location", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="Ledger / Binance" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Avg Buy Price (USD)</label>
                <input type="number" step="any" value={form.avg_buy_price} onChange={(e) => set("avg_buy_price", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Current Price (USD)</label>
                <input type="number" step="any" value={form.current_price} onChange={(e) => set("current_price", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Category</label>
                <select value={form.category} onChange={(e) => set("category", e.target.value as CryptoHolding["category"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                  {["layer1", "layer2", "defi", "stablecoin", "meme", "other"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
                <input value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" type="submit">{editing ? "Save" : "Add"}</Button>
              <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title={`All Holdings (${c.holdings.length})`}>
        {sorted.length === 0 ? (
          <p className="text-zinc-600 text-sm mt-3">No holdings yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Symbol", "Amount", "Avg Buy", "Current", "Value", "PnL", "Location", ""].map((h) => (
                    <th key={h} className="text-left py-2 pr-4 text-xs text-zinc-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((h) => {
                  const currentPrice = priceFor(h.symbol, h.current_price);
                  const value = h.amount * currentPrice;
                  const pnl = (currentPrice - h.avg_buy_price) * h.amount;
                  const pct = h.avg_buy_price > 0 ? ((currentPrice - h.avg_buy_price) / h.avg_buy_price) * 100 : 0;
                  return (
                    <tr key={h.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="py-2.5 pr-4">
                        <div className="font-bold text-amber-400">{h.symbol}</div>
                        <div className="text-xs text-zinc-600">{h.category}</div>
                      </td>
                      <td className="py-2.5 pr-4 text-zinc-200">{h.amount}</td>
                      <td className="py-2.5 pr-4 text-zinc-400">${h.avg_buy_price.toLocaleString()}</td>
                      <td className="py-2.5 pr-4 text-zinc-200">${currentPrice.toLocaleString()}</td>
                      <td className="py-2.5 pr-4 text-amber-400 font-medium">${value.toFixed(0)}</td>
                      <td className={`py-2.5 pr-4 font-medium ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>${pnl.toFixed(0)} ({pct.toFixed(1)}%)</td>
                      <td className="py-2.5 pr-4 text-zinc-500 text-xs">{h.location}</td>
                      <td className="py-2.5">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(h)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                          <button onClick={() => c.deleteHolding(h.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
