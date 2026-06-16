"use client";

import { useState } from "react";
import { useWealthStore } from "@/store/useWealthStore";
import type { Liability } from "@/store/useWealthStore";
import { Card, Badge, Button } from "@tn-os/ui";

function fmtB(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  return n.toLocaleString();
}

const LIABILITY_TYPES: Liability["type"][] = ["mortgage", "car-loan", "personal-loan", "credit-card", "family-debt", "other"];

type FormState = {
  label: string; creditor: string; type: Liability["type"];
  principal: string; monthly_payment: string; interest_rate: string;
  due_date: string; currency: string;
};

const emptyForm = (): FormState => ({
  label: "", creditor: "", type: "personal-loan",
  principal: "", monthly_payment: "", interest_rate: "", due_date: "", currency: "VND",
});

export default function LiabilitiesPage() {
  const w = useWealthStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Liability | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!w.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (l: Liability) => {
    setEditing(l);
    setForm({
      label: l.label, creditor: l.creditor, type: l.type,
      principal: String(l.principal), monthly_payment: String(l.monthly_payment ?? ""),
      interest_rate: String(l.interest_rate ?? ""), due_date: l.due_date ?? "", currency: l.currency,
    });
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      label: form.label.trim(), creditor: form.creditor.trim(), type: form.type,
      principal: parseFloat(form.principal) || 0,
      monthly_payment: form.monthly_payment ? parseFloat(form.monthly_payment) : undefined,
      interest_rate: form.interest_rate ? parseFloat(form.interest_rate) : undefined,
      due_date: form.due_date || undefined, currency: form.currency,
    };
    if (editing) { w.updateLiability({ ...editing, ...payload }); }
    else { w.addLiability(payload); }
    setFormOpen(false);
  };

  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Liabilities</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Mortgages, loans, and debts</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Liability</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Total Debt</div>
          <div className="text-lg font-semibold text-red-400">{fmtB(w.totalLiabilities)} VND</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Monthly Payments</div>
          <div className="text-lg font-semibold text-amber-400">{fmtB(w.monthlyDebtPayments)} VND</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Debt-to-Asset Ratio</div>
          <div className="text-lg font-semibold text-white">
            {w.totalAssets > 0 ? ((w.totalLiabilities / w.totalAssets) * 100).toFixed(1) : "0"}%
          </div>
        </div>
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Liability" : "Add Liability"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Label *</label>
                <input required value={form.label} onChange={(e) => set("label", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Apartment Mortgage" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Creditor *</label>
                <input required value={form.creditor} onChange={(e) => set("creditor", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Vietcombank" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Type</label>
                <select value={form.type} onChange={(e) => set("type", e.target.value as Liability["type"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                  {LIABILITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Currency</label>
                <select value={form.currency} onChange={(e) => set("currency", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Principal *</label>
                <input required type="number" value={form.principal} onChange={(e) => set("principal", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Monthly Payment</label>
                <input type="number" value={form.monthly_payment} onChange={(e) => set("monthly_payment", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Interest Rate (%)</label>
                <input type="number" step="0.01" value={form.interest_rate} onChange={(e) => set("interest_rate", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="e.g. 9.5" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Due Date</label>
                <input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" type="submit">{editing ? "Save" : "Add Liability"}</Button>
              <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title={`All Liabilities (${w.liabilities.length})`}>
        {w.liabilities.length === 0 ? (
          <p className="text-zinc-600 text-sm mt-3">No liabilities added.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Label", "Creditor", "Type", "Principal", "Monthly", "Rate", "Due Date", ""].map((h) => (
                    <th key={h} className="text-left py-2 pr-4 text-xs text-zinc-500 uppercase tracking-wide font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {w.liabilities.map((l) => (
                  <tr key={l.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="py-2.5 pr-4 text-zinc-200">{l.label}</td>
                    <td className="py-2.5 pr-4 text-zinc-400">{l.creditor}</td>
                    <td className="py-2.5 pr-4"><Badge variant="neutral">{l.type}</Badge></td>
                    <td className="py-2.5 pr-4 text-red-400 font-medium">{fmtB(l.principal)} {l.currency}</td>
                    <td className="py-2.5 pr-4 text-amber-400">{l.monthly_payment ? `${fmtB(l.monthly_payment)}` : "—"}</td>
                    <td className="py-2.5 pr-4 text-zinc-400">{l.interest_rate ? `${l.interest_rate}%` : "—"}</td>
                    <td className="py-2.5 pr-4 text-zinc-400">{l.due_date ?? "—"}</td>
                    <td className="py-2.5">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(l)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                        <button onClick={() => w.deleteLiability(l.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-700">
                  <td colSpan={3} className="py-2 text-zinc-500 text-xs font-medium">Total</td>
                  <td className="py-2 text-red-400 font-bold">{fmtB(w.totalLiabilities)} VND</td>
                  <td className="py-2 text-amber-400 font-bold">{fmtB(w.monthlyDebtPayments)}/mo</td>
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
