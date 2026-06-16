"use client";

import { useState } from "react";
import { useWealthStore } from "@/store/useWealthStore";
import type { FamilySupport } from "@/store/useWealthStore";
import { Card, Button } from "@tn-os/ui";

function fmtB(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  return n.toLocaleString();
}

type FormState = {
  label: string; recipient: string; amount_per_month: string; currency: string; notes: string;
};

const emptyForm = (): FormState => ({ label: "", recipient: "", amount_per_month: "", currency: "VND", notes: "" });

export default function FamilySupportPage() {
  const w = useWealthStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FamilySupport | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!w.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (f: FamilySupport) => {
    setEditing(f);
    setForm({ label: f.label, recipient: f.recipient, amount_per_month: String(f.amount_per_month), currency: f.currency, notes: f.notes ?? "" });
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      label: form.label.trim(), recipient: form.recipient.trim(),
      amount_per_month: parseFloat(form.amount_per_month) || 0,
      currency: form.currency, notes: form.notes.trim() || undefined,
    };
    if (editing) { w.updateFamilySupport({ ...editing, ...payload }); }
    else { w.addFamilySupport(payload); }
    setFormOpen(false);
  };

  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Family Support</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Monthly financial support to family members</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Item</Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Monthly Total</div>
          <div className="text-lg font-semibold text-amber-400">{fmtB(w.monthlyFamilySupport)} VND</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Annual Commitment</div>
          <div className="text-lg font-semibold text-zinc-200">{fmtB(w.monthlyFamilySupport * 12)} VND</div>
        </div>
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Support Item" : "Add Support Item"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Label *</label>
                <input required value={form.label} onChange={(e) => set("label", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Monthly parents allowance" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Recipient *</label>
                <input required value={form.recipient} onChange={(e) => set("recipient", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Parents" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Amount per Month *</label>
                <input required type="number" value={form.amount_per_month} onChange={(e) => set("amount_per_month", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Currency</label>
                <select value={form.currency} onChange={(e) => set("currency", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
                <input value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Optional note" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" type="submit">{editing ? "Save" : "Add"}</Button>
              <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title={`Support Items (${w.family_support.length})`}>
        {w.family_support.length === 0 ? (
          <p className="text-zinc-600 text-sm mt-3">No family support items added.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {w.family_support.map((f) => (
              <div key={f.id} className="flex items-center justify-between py-3 border-b border-zinc-800/60 last:border-0">
                <div>
                  <div className="text-sm text-zinc-200 font-medium">{f.recipient}</div>
                  <div className="text-xs text-zinc-500">{f.label}</div>
                  {f.notes && <div className="text-xs text-zinc-600 mt-0.5 italic">{f.notes}</div>}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-amber-400 font-medium">{fmtB(f.amount_per_month)} {f.currency}/mo</div>
                    <div className="text-xs text-zinc-500">{fmtB(f.amount_per_month * 12)}/yr</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(f)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                    <button onClick={() => w.deleteFamilySupport(f.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-2">
              <span className="text-zinc-500 font-medium">Monthly Total</span>
              <span className="text-amber-400 font-bold">{fmtB(w.monthlyFamilySupport)} VND</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
