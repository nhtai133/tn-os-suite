"use client";

import { useState } from "react";
import { useCryptoStore } from "@/store/useCryptoStore";
import type { DeFiPosition } from "@/store/useCryptoStore";
import { Card, Badge, Button } from "@tn-os/ui";

type FormState = { protocol: string; chain: string; type: DeFiPosition["type"]; value_usd: string; apy: string; risk: DeFiPosition["risk"]; status: DeFiPosition["status"]; notes: string };
const emptyForm = (): FormState => ({ protocol: "", chain: "ETH", type: "staking", value_usd: "", apy: "", risk: "low", status: "active", notes: "" });

export default function DeFiPage() {
  const c = useCryptoStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DeFiPosition | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!c.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (p: DeFiPosition) => {
    setEditing(p);
    setForm({ protocol: p.protocol, chain: p.chain, type: p.type, value_usd: String(p.value_usd), apy: String(p.apy ?? ""), risk: p.risk, status: p.status, notes: p.notes ?? "" });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { protocol: form.protocol.trim(), chain: form.chain.trim(), type: form.type, value_usd: parseFloat(form.value_usd) || 0, apy: form.apy ? parseFloat(form.apy) : undefined, risk: form.risk, status: form.status, notes: form.notes.trim() || undefined };
    if (editing) { c.updateDeFiPosition({ ...editing, ...payload }); } else { c.addDeFiPosition(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const active = c.defi_positions.filter((p) => p.status === "active");
  const closed = c.defi_positions.filter((p) => p.status === "closed");

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">DeFi Positions</h1>
          <p className="text-sm text-zinc-500 mt-0.5">LP, staking, lending, and yield positions</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Position</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Total DeFi Exposure</div>
          <div className="text-lg font-semibold text-amber-400">${c.defiExposureUSD.toFixed(0)}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Active Positions</div>
          <div className="text-lg font-semibold text-white">{active.length}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Avg APY</div>
          <div className="text-lg font-semibold text-emerald-400">{active.length > 0 && active.some((p) => p.apy) ? `${(active.reduce((s, p) => s + (p.apy ?? 0), 0) / active.filter((p) => p.apy).length).toFixed(1)}%` : "—"}</div>
        </div>
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Position" : "Add DeFi Position"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Protocol *</label>
                <input required value={form.protocol} onChange={(e) => set("protocol", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="PancakeSwap" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Chain</label>
                <input value={form.chain} onChange={(e) => set("chain", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="ETH / BSC / SOL" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Type</label>
                <select value={form.type} onChange={(e) => set("type", e.target.value as DeFiPosition["type"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                  {["staking", "lp", "lending", "yield", "other"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Value (USD) *</label>
                <input required type="number" step="0.01" value={form.value_usd} onChange={(e) => set("value_usd", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">APY %</label>
                <input type="number" step="0.1" value={form.apy} onChange={(e) => set("apy", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Risk</label>
                <select value={form.risk} onChange={(e) => set("risk", e.target.value as DeFiPosition["risk"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                  {["low", "medium", "high"].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value as DeFiPosition["status"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                  <option value="active">active</option>
                  <option value="closed">closed</option>
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

      <Card title={`Active (${active.length})`}>
        {active.length === 0 ? <p className="text-zinc-600 text-sm mt-3">No active positions.</p> : (
          <div className="mt-3 space-y-2">
            {active.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                <div>
                  <div className="text-sm text-zinc-200 font-medium">{p.protocol} <span className="text-xs text-zinc-500">({p.chain})</span></div>
                  <div className="text-xs text-zinc-500">{p.type}{p.apy ? ` · ${p.apy}% APY` : ""}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-amber-400">${p.value_usd.toFixed(0)}</div>
                    <Badge variant={p.risk === "low" ? "success" : p.risk === "medium" ? "warning" : "danger"}>{p.risk}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                    <button onClick={() => c.deleteDeFiPosition(p.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {closed.length > 0 && (
        <Card title={`Closed (${closed.length})`}>
          <div className="mt-3 space-y-1">
            {closed.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-1.5 text-sm opacity-50">
                <span>{p.protocol} · {p.chain} · {p.type}</span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">${p.value_usd.toFixed(0)}</span>
                  <button onClick={() => c.deleteDeFiPosition(p.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
