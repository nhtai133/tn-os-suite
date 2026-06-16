"use client";

import { useState } from "react";
import { useCryptoStore } from "@/store/useCryptoStore";
import type { CryptoExchange } from "@/store/useCryptoStore";
import { Card, Badge, Button } from "@tn-os/ui";

type FormState = { name: string; status: CryptoExchange["status"]; balance_usd: string; risk_level: CryptoExchange["risk_level"]; notes: string };
const emptyForm = (): FormState => ({ name: "", status: "active", balance_usd: "", risk_level: "low", notes: "" });

export default function ExchangesPage() {
  const c = useCryptoStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CryptoExchange | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!c.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (e: CryptoExchange) => {
    setEditing(e);
    setForm({ name: e.name, status: e.status, balance_usd: String(e.balance_usd), risk_level: e.risk_level, notes: e.notes ?? "" });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name.trim(), status: form.status, balance_usd: parseFloat(form.balance_usd) || 0, risk_level: form.risk_level, notes: form.notes.trim() || undefined };
    if (editing) { c.updateExchange({ ...editing, ...payload }); } else { c.addExchange(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const totalBalance = c.exchanges.filter((e) => e.status === "active").reduce((s, e) => s + e.balance_usd, 0);

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Exchanges</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Centralized exchange accounts and risk levels</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Exchange</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Exchange Balance</div>
          <div className="text-lg font-semibold text-amber-400">${totalBalance.toFixed(0)}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Exchange Risk</div>
          <div className="mt-1"><Badge variant={c.exchangeRisk === "low" ? "success" : c.exchangeRisk === "medium" ? "warning" : "danger"}>{c.exchangeRisk}</Badge></div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Active Exchanges</div>
          <div className="text-lg font-semibold text-white">{c.exchanges.filter((e) => e.status === "active").length}</div>
        </div>
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Exchange" : "Add Exchange"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Exchange Name *</label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="e.g. Binance" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value as CryptoExchange["status"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Risk Level</label>
                <select value={form.risk_level} onChange={(e) => set("risk_level", e.target.value as CryptoExchange["risk_level"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                  {["low", "medium", "high"].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Balance (USD)</label>
                <input type="number" step="0.01" value={form.balance_usd} onChange={(e) => set("balance_usd", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="0" />
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

      <div className="space-y-3">
        {c.exchanges.length === 0 && <Card title="No exchanges"><p className="text-zinc-600 text-sm mt-2">No exchanges added yet.</p></Card>}
        {c.exchanges.map((e) => (
          <Card key={e.id} title={e.name}
            action={
              <div className="flex items-center gap-2">
                <Badge variant={e.status === "active" ? "success" : "neutral"}>{e.status}</Badge>
                <Badge variant={e.risk_level === "low" ? "success" : e.risk_level === "medium" ? "warning" : "danger"}>{e.risk_level} risk</Badge>
                <button onClick={() => openEdit(e)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                <button onClick={() => c.deleteExchange(e.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
              </div>
            }>
            <div className="mt-2 flex gap-6 text-sm">
              <div><div className="text-xs text-zinc-500">Balance</div><div className="font-medium mt-0.5 text-amber-400">${e.balance_usd.toFixed(0)}</div></div>
              {e.notes && <div className="text-xs text-zinc-500 italic self-end">{e.notes}</div>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
