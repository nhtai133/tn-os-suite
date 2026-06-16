"use client";

import { useState } from "react";
import { useStocksStore } from "@/store/useStocksStore";
import type { CompanyThesis } from "@/store/useStocksStore";
import { Card, Badge, Button } from "@tn-os/ui";

type FormState = { symbol: string; name: string; thesis: string; timeframe: string; conviction: string; catalysts: string; risks: string; status: CompanyThesis["status"] };
const emptyForm = (): FormState => ({ symbol: "", name: "", thesis: "", timeframe: "12m", conviction: "7", catalysts: "", risks: "", status: "active" });

const convictionColor = (n: number) => n >= 8 ? "text-emerald-400" : n >= 5 ? "text-sky-400" : "text-red-400";
const statusVariant: Record<CompanyThesis["status"], "success" | "neutral" | "danger"> = { active: "success", fulfilled: "neutral", invalidated: "danger" };

export default function ThesisPage() {
  const s = useStocksStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyThesis | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [filter, setFilter] = useState<CompanyThesis["status"] | "all">("all");

  if (!s.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (t: CompanyThesis) => {
    setEditing(t);
    setForm({ symbol: t.symbol, name: t.name, thesis: t.thesis, timeframe: t.timeframe, conviction: String(t.conviction), catalysts: t.catalysts.join(", "), risks: t.risks.join(", "), status: t.status });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      symbol: form.symbol.toUpperCase().trim(), name: form.name.trim(), thesis: form.thesis.trim(), timeframe: form.timeframe.trim(),
      conviction: parseInt(form.conviction) || 5,
      catalysts: form.catalysts.split(",").map((s) => s.trim()).filter(Boolean),
      risks: form.risks.split(",").map((s) => s.trim()).filter(Boolean),
      status: form.status,
    };
    if (editing) { s.updateThesis({ ...editing, ...payload }); } else { s.addThesis(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const filtered = filter === "all" ? s.theses : s.theses.filter((t) => t.status === filter);

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Company Thesis</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Investment theses with catalysts and risks</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Thesis</Button>
      </div>

      <div className="flex gap-2">
        {(["all", "active", "fulfilled", "invalidated"] as const).map((st) => (
          <button key={st} onClick={() => setFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === st ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" : "text-zinc-500 hover:text-zinc-300 border border-transparent"}`}>
            {st === "all" ? `All (${s.theses.length})` : `${st.charAt(0).toUpperCase() + st.slice(1)} (${s.theses.filter((t) => t.status === st).length})`}
          </button>
        ))}
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Thesis" : "Add Company Thesis"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Symbol *</label>
                <input required value={form.symbol} onChange={(e) => set("symbol", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="VCB" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Company Name *</label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="Vietcombank" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Timeframe</label>
                <input value={form.timeframe} onChange={(e) => set("timeframe", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="12m / 3y" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Conviction (1–10)</label>
                <input type="number" min="1" max="10" value={form.conviction} onChange={(e) => set("conviction", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value as CompanyThesis["status"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500">
                  {["active", "fulfilled", "invalidated"].map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Thesis *</label>
                <textarea required value={form.thesis} onChange={(e) => set("thesis", e.target.value)} rows={3}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 resize-none" placeholder="Why you believe in this company..." />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Catalysts (comma-separated)</label>
                <input value={form.catalysts} onChange={(e) => set("catalysts", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="Credit growth, Dividend, NIM expansion" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Risks (comma-separated)</label>
                <input value={form.risks} onChange={(e) => set("risks", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="NPL rise, Rate cuts, Regulation" />
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
          <Card key={t.id} title={`${t.symbol} — ${t.name}`}
            action={
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant[t.status]}>{t.status}</Badge>
                <button onClick={() => openEdit(t)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                <button onClick={() => s.deleteThesis(t.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
              </div>
            }>
            <div className="mt-2 flex items-center gap-4 text-sm">
              <div><span className="text-zinc-500 text-xs">Conviction </span><span className={`font-semibold ${convictionColor(t.conviction)}`}>{t.conviction}/10</span></div>
              <div><span className="text-zinc-500 text-xs">Timeframe </span><span className="text-zinc-300">{t.timeframe}</span></div>
            </div>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{t.thesis}</p>
            {t.catalysts.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-zinc-500 mb-1">Catalysts</div>
                <div className="flex flex-wrap gap-1">{t.catalysts.map((c, i) => <span key={i} className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">{c}</span>)}</div>
              </div>
            )}
            {t.risks.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-zinc-500 mb-1">Risks</div>
                <div className="flex flex-wrap gap-1">{t.risks.map((r, i) => <span key={i} className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded">{r}</span>)}</div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
