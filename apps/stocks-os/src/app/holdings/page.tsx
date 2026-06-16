"use client";

import { useState } from "react";
import { useStocksStore, toUSD } from "@/store/useStocksStore";
import type { StockHolding, StockExchange } from "@/store/useStocksStore";
import { Card, Badge, Button } from "@tn-os/ui";

type FormState = { symbol: string; name: string; shares: string; avg_buy_price: string; current_price: string; currency: "VND" | "USD"; sector: string; exchange: StockExchange; notes: string };
const emptyForm = (): FormState => ({ symbol: "", name: "", shares: "", avg_buy_price: "", current_price: "", currency: "VND", sector: "Banking", exchange: "HOSE", notes: "" });

function fmtPrice(price: number, currency: "VND" | "USD"): string {
  return currency === "VND" ? `${price.toLocaleString()}₫` : `$${price.toLocaleString()}`;
}

export default function HoldingsPage() {
  const s = useStocksStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StockHolding | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!s.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (h: StockHolding) => {
    setEditing(h);
    setForm({ symbol: h.symbol, name: h.name, shares: String(h.shares), avg_buy_price: String(h.avg_buy_price), current_price: String(h.current_price), currency: h.currency, sector: h.sector, exchange: h.exchange, notes: h.notes ?? "" });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { symbol: form.symbol.toUpperCase().trim(), name: form.name.trim(), shares: parseFloat(form.shares) || 0, avg_buy_price: parseFloat(form.avg_buy_price) || 0, current_price: parseFloat(form.current_price) || 0, currency: form.currency, sector: form.sector.trim(), exchange: form.exchange, notes: form.notes.trim() || undefined };
    if (editing) { s.updateHolding({ ...editing, ...payload }); } else { s.addHolding(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const sorted = [...s.holdings].sort((a, b) => toUSD(b.shares * b.current_price, b.currency) - toUSD(a.shares * a.current_price, a.currency));

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Holdings</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Stock positions across all markets</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Holding</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Total Value (USD)</div>
          <div className="text-lg font-semibold text-sky-400">${s.totalStockValueUSD.toFixed(0)}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Positions</div>
          <div className="text-lg font-semibold text-white">{s.holdings.length}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Annual Dividends</div>
          <div className="text-lg font-semibold text-emerald-400">${s.annualDividendIncomeUSD.toFixed(0)}</div>
        </div>
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Holding" : "Add Holding"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Symbol *</label>
                <input required value={form.symbol} onChange={(e) => set("symbol", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="VCB" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Name *</label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="Vietcombank" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Shares *</label>
                <input required type="number" value={form.shares} onChange={(e) => set("shares", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="0" />
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
                <label className="text-xs text-zinc-400 mb-1 block">Avg Buy Price</label>
                <input type="number" step="any" value={form.avg_buy_price} onChange={(e) => set("avg_buy_price", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Current Price</label>
                <input type="number" step="any" value={form.current_price} onChange={(e) => set("current_price", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Sector</label>
                <input value={form.sector} onChange={(e) => set("sector", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="Banking" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Exchange</label>
                <select value={form.exchange} onChange={(e) => set("exchange", e.target.value as StockExchange)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500">
                  {["HOSE", "HNX", "UPCOM", "NYSE", "NASDAQ", "other"].map((ex) => <option key={ex} value={ex}>{ex}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
                <input value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" type="submit">{editing ? "Save" : "Add"}</Button>
              <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title={`All Holdings (${s.holdings.length})`}>
        {sorted.length === 0 ? (
          <p className="text-zinc-600 text-sm mt-3">No holdings yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Symbol", "Shares", "Avg Buy", "Current", "Value (USD)", "PnL %", "Sector", ""].map((h) => (
                    <th key={h} className="text-left py-2 pr-4 text-xs text-zinc-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((h) => {
                  const valueUSD = toUSD(h.shares * h.current_price, h.currency);
                  const pct = h.avg_buy_price > 0 ? ((h.current_price - h.avg_buy_price) / h.avg_buy_price) * 100 : 0;
                  return (
                    <tr key={h.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="py-2.5 pr-4">
                        <div className="font-bold text-sky-400">{h.symbol}</div>
                        <div className="text-xs text-zinc-600">{h.exchange}</div>
                      </td>
                      <td className="py-2.5 pr-4 text-zinc-200">{h.shares}</td>
                      <td className="py-2.5 pr-4 text-zinc-400">{fmtPrice(h.avg_buy_price, h.currency)}</td>
                      <td className="py-2.5 pr-4 text-zinc-200">{fmtPrice(h.current_price, h.currency)}</td>
                      <td className="py-2.5 pr-4 text-sky-400 font-medium">${valueUSD.toFixed(0)}</td>
                      <td className={`py-2.5 pr-4 font-medium ${pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>{pct.toFixed(1)}%</td>
                      <td className="py-2.5 pr-4"><Badge variant="neutral">{h.sector}</Badge></td>
                      <td className="py-2.5">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(h)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                          <button onClick={() => s.deleteHolding(h.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
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
