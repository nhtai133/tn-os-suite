"use client";

import { useState } from "react";
import { useCryptoStore } from "@/store/useCryptoStore";
import type { CryptoThesis } from "@/store/useCryptoStore";
import { Card, Badge, Button } from "@tn-os/ui";

type FormState = { symbol: string; title: string; timeframe: string; conviction: string; target_price: string; thesis: string; status: CryptoThesis["status"] };
const emptyForm = (): FormState => ({ symbol: "", title: "", timeframe: "12m", conviction: "7", target_price: "", thesis: "", status: "active" });

const convictionColor = (n: number) => n >= 8 ? "text-emerald-400" : n >= 5 ? "text-amber-400" : "text-red-400";
const statusVariant: Record<CryptoThesis["status"], "success" | "neutral" | "danger"> = { active: "success", fulfilled: "neutral", invalidated: "danger" };

export default function ThesisPage() {
  const c = useCryptoStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CryptoThesis | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [filter, setFilter] = useState<CryptoThesis["status"] | "all">("all");

  if (!c.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (t: CryptoThesis) => {
    setEditing(t);
    setForm({ symbol: t.symbol, title: t.title, timeframe: t.timeframe, conviction: String(t.conviction), target_price: String(t.target_price ?? ""), thesis: t.thesis, status: t.status });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { symbol: form.symbol.toUpperCase().trim(), title: form.title.trim(), timeframe: form.timeframe.trim(), conviction: parseInt(form.conviction) || 5, target_price: form.target_price ? parseFloat(form.target_price) : undefined, thesis: form.thesis.trim(), status: form.status };
    if (editing) { c.updateThesis({ ...editing, ...payload }); } else { c.addThesis(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const filtered = filter === "all" ? c.theses : c.theses.filter((t) => t.status === filter);

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Crypto Thesis</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Investment theses and conviction tracking</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Thesis</Button>
      </div>

      <div className="flex gap-2">
        {(["all", "active", "fulfilled", "invalidated"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-zinc-500 hover:text-zinc-300 border border-transparent"}`}>
            {s === "all" ? `All (${c.theses.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${c.theses.filter((t) => t.status === s).length})`}
          </button>
        ))}
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Thesis" : "Add Crypto Thesis"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Symbol *</label>
                <input required value={form.symbol} onChange={(e) => set("symbol", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="BTC" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Timeframe</label>
                <input value={form.timeframe} onChange={(e) => set("timeframe", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="12m / 2y" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Title *</label>
                <input required value={form.title} onChange={(e) => set("title", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="Thesis title" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Conviction (1–10)</label>
                <input type="number" min="1" max="10" value={form.conviction} onChange={(e) => set("conviction", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Target Price (USD)</label>
                <input type="number" step="any" value={form.target_price} onChange={(e) => set("target_price", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="100000" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value as CryptoThesis["status"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                  {["active", "fulfilled", "invalidated"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Thesis *</label>
                <textarea required value={form.thesis} onChange={(e) => set("thesis", e.target.value)} rows={4}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none" placeholder="Why you believe in this asset..." />
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
        {filtered.length === 0 && <Card title="No theses"><p className="text-zinc-600 text-sm mt-2">No theses yet.</p></Card>}
        {filtered.map((t) => (
          <Card key={t.id} title={`${t.symbol} — ${t.title}`}
            action={
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant[t.status]}>{t.status}</Badge>
                <button onClick={() => openEdit(t)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                <button onClick={() => c.deleteThesis(t.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
              </div>
            }>
            <div className="mt-2 flex items-center gap-4 text-sm">
              <div><span className="text-zinc-500 text-xs">Conviction </span><span className={`font-semibold ${convictionColor(t.conviction)}`}>{t.conviction}/10</span></div>
              <div><span className="text-zinc-500 text-xs">Timeframe </span><span className="text-zinc-300">{t.timeframe}</span></div>
              {t.target_price && <div><span className="text-zinc-500 text-xs">Target </span><span className="text-amber-400 font-medium">${t.target_price.toLocaleString()}</span></div>}
            </div>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{t.thesis}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
