"use client";

import { useState } from "react";
import { useStocksStore } from "@/store/useStocksStore";
import type { ValuationNote } from "@/store/useStocksStore";
import { Card, Badge, Button } from "@tn-os/ui";

type FormState = { symbol: string; pe_ratio: string; pb_ratio: string; fair_value: string; currency: "VND" | "USD"; verdict: ValuationNote["verdict"]; notes: string; date: string };
const emptyForm = (): FormState => ({ symbol: "", pe_ratio: "", pb_ratio: "", fair_value: "", currency: "VND", verdict: "fairly valued", notes: "", date: new Date().toISOString().split("T")[0] ?? "" });

const verdictVariant: Record<ValuationNote["verdict"], "success" | "neutral" | "danger"> = { undervalued: "success", "fairly valued": "neutral", overvalued: "danger" };

export default function ValuationPage() {
  const s = useStocksStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ValuationNote | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!s.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (v: ValuationNote) => {
    setEditing(v);
    setForm({ symbol: v.symbol, pe_ratio: String(v.pe_ratio ?? ""), pb_ratio: String(v.pb_ratio ?? ""), fair_value: String(v.fair_value ?? ""), currency: v.currency, verdict: v.verdict, notes: v.notes, date: v.date });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { symbol: form.symbol.toUpperCase().trim(), pe_ratio: form.pe_ratio ? parseFloat(form.pe_ratio) : undefined, pb_ratio: form.pb_ratio ? parseFloat(form.pb_ratio) : undefined, fair_value: form.fair_value ? parseFloat(form.fair_value) : undefined, currency: form.currency, verdict: form.verdict, notes: form.notes.trim(), date: form.date };
    if (editing) { s.updateValuationNote({ ...editing, ...payload }); } else { s.addValuationNote(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Valuation Notes</h1>
          <p className="text-sm text-zinc-500 mt-0.5">P/E, P/B, fair value assessments</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Note</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          ["Undervalued", s.valuation_notes.filter((v) => v.verdict === "undervalued").length, "text-emerald-400"],
          ["Fairly Valued", s.valuation_notes.filter((v) => v.verdict === "fairly valued").length, "text-zinc-300"],
          ["Overvalued", s.valuation_notes.filter((v) => v.verdict === "overvalued").length, "text-red-400"],
        ].map(([label, count, color]) => (
          <div key={String(label)} className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <div className="text-xs text-zinc-500 mb-1">{label}</div>
            <div className={`text-lg font-semibold ${color}`}>{count}</div>
          </div>
        ))}
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Valuation Note" : "Add Valuation Note"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Symbol *</label>
                <input required value={form.symbol} onChange={(e) => set("symbol", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="VCB" />
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
                <label className="text-xs text-zinc-400 mb-1 block">P/E Ratio</label>
                <input type="number" step="0.1" value={form.pe_ratio} onChange={(e) => set("pe_ratio", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="12.5" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">P/B Ratio</label>
                <input type="number" step="0.1" value={form.pb_ratio} onChange={(e) => set("pb_ratio", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="2.1" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Fair Value</label>
                <input type="number" step="any" value={form.fair_value} onChange={(e) => set("fair_value", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="95000" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Verdict</label>
                <select value={form.verdict} onChange={(e) => set("verdict", e.target.value as ValuationNote["verdict"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500">
                  {["undervalued", "fairly valued", "overvalued"].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Date</label>
                <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Notes *</label>
                <input required value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="Valuation rationale..." />
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
        {s.valuation_notes.length === 0 && <Card title="No notes"><p className="text-zinc-600 text-sm mt-2">No valuation notes yet.</p></Card>}
        {[...s.valuation_notes].sort((a, b) => b.date.localeCompare(a.date)).map((v) => (
          <Card key={v.id} title={v.symbol}
            action={
              <div className="flex items-center gap-2">
                <Badge variant={verdictVariant[v.verdict]}>{v.verdict}</Badge>
                <button onClick={() => openEdit(v)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                <button onClick={() => s.deleteValuationNote(v.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
              </div>
            }>
            <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
              {v.pe_ratio && <div><div className="text-xs text-zinc-500">P/E</div><div className="font-medium text-zinc-200">{v.pe_ratio}x</div></div>}
              {v.pb_ratio && <div><div className="text-xs text-zinc-500">P/B</div><div className="font-medium text-zinc-200">{v.pb_ratio}x</div></div>}
              {v.fair_value && <div><div className="text-xs text-zinc-500">Fair Value</div><div className="font-medium text-sky-400">{v.fair_value.toLocaleString()} {v.currency}</div></div>}
            </div>
            <div className="mt-2 text-sm text-zinc-400">{v.notes}</div>
            <div className="mt-1 text-xs text-zinc-600">{v.date}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
