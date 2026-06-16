"use client";

import { useState } from "react";
import { useCryptoStore } from "@/store/useCryptoStore";
import type { Stablecoin } from "@/store/useCryptoStore";
import { Card, Button } from "@tn-os/ui";

type FormState = { symbol: string; amount: string; location: string; purpose: string; notes: string };
const emptyForm = (): FormState => ({ symbol: "USDT", amount: "", location: "", purpose: "", notes: "" });

export default function StablecoinsPage() {
  const c = useCryptoStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Stablecoin | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!c.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (s: Stablecoin) => {
    setEditing(s);
    setForm({ symbol: s.symbol, amount: String(s.amount), location: s.location, purpose: s.purpose, notes: s.notes ?? "" });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { symbol: form.symbol.toUpperCase().trim(), amount: parseFloat(form.amount) || 0, location: form.location.trim(), purpose: form.purpose.trim(), notes: form.notes.trim() || undefined };
    if (editing) { c.updateStablecoin({ ...editing, ...payload }); } else { c.addStablecoin(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Stablecoins</h1>
          <p className="text-sm text-zinc-500 mt-0.5">USDT, USDC, and other stable assets</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add</Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Total Stablecoins</div>
          <div className="text-lg font-semibold text-emerald-400">${c.stablecoinBalanceUSD.toFixed(0)}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Positions</div>
          <div className="text-lg font-semibold text-white">{c.stablecoins.length}</div>
        </div>
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Stablecoin" : "Add Stablecoin"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Symbol *</label>
                <input required value={form.symbol} onChange={(e) => set("symbol", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="USDT" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Amount (USD) *</label>
                <input required type="number" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Location *</label>
                <input required value={form.location} onChange={(e) => set("location", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="Binance / MetaMask" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Purpose</label>
                <input value={form.purpose} onChange={(e) => set("purpose", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="Reserve / DeFi yield" />
              </div>
              <div className="col-span-2">
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

      <Card title={`All Stablecoins (${c.stablecoins.length})`}>
        {c.stablecoins.length === 0 ? (
          <p className="text-zinc-600 text-sm mt-3">No stablecoins added yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Symbol", "Amount", "Location", "Purpose", ""].map((h) => (
                    <th key={h} className="text-left py-2 pr-4 text-xs text-zinc-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.stablecoins.map((s) => (
                  <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="py-2.5 pr-4 font-bold text-emerald-400">{s.symbol}</td>
                    <td className="py-2.5 pr-4 text-zinc-200">${s.amount.toFixed(0)}</td>
                    <td className="py-2.5 pr-4 text-zinc-400">{s.location}</td>
                    <td className="py-2.5 pr-4 text-zinc-500 text-xs">{s.purpose || "—"}</td>
                    <td className="py-2.5">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(s)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                        <button onClick={() => c.deleteStablecoin(s.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-700">
                  <td className="py-2 text-zinc-500 text-xs">Total</td>
                  <td className="py-2 font-bold text-emerald-400">${c.stablecoinBalanceUSD.toFixed(0)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
