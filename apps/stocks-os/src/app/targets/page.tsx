"use client";

import { useState } from "react";
import { useStocksStore } from "@/store/useStocksStore";
import type { TargetPosition } from "@/store/useStocksStore";
import { Card, Badge, Button } from "@tn-os/ui";

type FormState = { symbol: string; name: string; target_shares: string; current_shares: string; target_price: string; currency: "VND" | "USD"; priority: TargetPosition["priority"]; rationale: string };
const emptyForm = (): FormState => ({ symbol: "", name: "", target_shares: "", current_shares: "0", target_price: "", currency: "VND", priority: "medium", rationale: "" });

export default function TargetsPage() {
  const s = useStocksStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TargetPosition | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!s.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (t: TargetPosition) => {
    setEditing(t);
    setForm({ symbol: t.symbol, name: t.name, target_shares: String(t.target_shares), current_shares: String(t.current_shares), target_price: String(t.target_price ?? ""), currency: t.currency, priority: t.priority, rationale: t.rationale ?? "" });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { symbol: form.symbol.toUpperCase().trim(), name: form.name.trim(), target_shares: parseFloat(form.target_shares) || 0, current_shares: parseFloat(form.current_shares) || 0, target_price: form.target_price ? parseFloat(form.target_price) : undefined, currency: form.currency, priority: form.priority, rationale: form.rationale.trim() || undefined };
    if (editing) { s.updateTarget({ ...editing, ...payload }); } else { s.addTarget(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Target Positions</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Accumulation goals and progress tracking</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Target</Button>
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Target" : "Add Target"}>
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
                <label className="text-xs text-zinc-400 mb-1 block">Target Shares *</label>
                <input required type="number" value={form.target_shares} onChange={(e) => set("target_shares", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="100" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Current Shares</label>
                <input type="number" value={form.current_shares} onChange={(e) => set("current_shares", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Target Buy Price</label>
                <input type="number" step="any" value={form.target_price} onChange={(e) => set("target_price", e.target.value)}
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
                <label className="text-xs text-zinc-400 mb-1 block">Priority</label>
                <select value={form.priority} onChange={(e) => set("priority", e.target.value as TargetPosition["priority"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500">
                  {["high", "medium", "low"].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Rationale</label>
                <input value={form.rationale} onChange={(e) => set("rationale", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="Why and how to reach this target" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" type="submit">{editing ? "Save" : "Add"}</Button>
              <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {s.targets.length === 0 && <Card title="No targets"><p className="text-zinc-600 text-sm mt-2">No targets yet.</p></Card>}
        {s.targets.map((t) => {
          const pct = t.target_shares > 0 ? Math.min((t.current_shares / t.target_shares) * 100, 100) : 0;
          const remaining = Math.max(t.target_shares - t.current_shares, 0);
          return (
            <Card key={t.id} title={`${t.symbol} — ${t.name}`}
              action={
                <div className="flex items-center gap-2">
                  <Badge variant={t.priority === "high" ? "danger" : t.priority === "medium" ? "warning" : "neutral"}>{t.priority}</Badge>
                  <button onClick={() => openEdit(t)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                  <button onClick={() => s.deleteTarget(t.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                </div>
              }>
              <div className="mt-3 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">{t.current_shares} / {t.target_shares} shares</span>
                  <span className="text-sky-400 font-semibold">{pct.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full">
                  <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex gap-4 text-xs text-zinc-500">
                  <span>Remaining: <strong className="text-zinc-300">{remaining} shares</strong></span>
                  {t.target_price && <span>Target price: <strong className="text-zinc-300">{t.target_price.toLocaleString()} {t.currency}</strong></span>}
                </div>
                {t.rationale && <div className="text-xs text-zinc-500 italic border-t border-zinc-800 pt-2">{t.rationale}</div>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
