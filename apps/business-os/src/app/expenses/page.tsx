"use client";

import { useState } from "react";
import { useBusinessStore } from "@/store/useBusinessStore";
import type { Expense } from "@/store/useBusinessStore";
import { Card, Badge, Button } from "@tn-os/ui";

type FormState = { label: string; category: Expense["category"]; amount: string; currency: string; frequency: Expense["frequency"]; date: string; notes: string };
const emptyForm = (): FormState => ({ label: "", category: "software", amount: "", currency: "USD", frequency: "monthly", date: "", notes: "" });

export default function ExpensesPage() {
  const b = useBusinessStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!b.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (e: Expense) => {
    setEditing(e);
    setForm({ label: e.label, category: e.category, amount: String(e.amount), currency: e.currency, frequency: e.frequency, date: e.date ?? "", notes: e.notes ?? "" });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { label: form.label.trim(), category: form.category, amount: parseFloat(form.amount) || 0, currency: form.currency, frequency: form.frequency, date: form.date || undefined, notes: form.notes.trim() || undefined };
    if (editing) { b.updateExpense({ ...editing, ...payload }); } else { b.addExpense(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const annualCost = b.expenses.reduce((s, e) => {
    const usd = e.currency === "USD" ? e.amount : e.amount / 25_000;
    return s + (e.frequency === "monthly" ? usd * 12 : e.frequency === "annual" ? usd : 0);
  }, 0);

  const byCategory = b.expenses.reduce<Record<string, number>>((acc, e) => {
    const usd = e.currency === "USD" ? e.amount : e.amount / 25_000;
    const monthly = e.frequency === "monthly" ? usd : e.frequency === "annual" ? usd / 12 : 0;
    acc[e.category] = (acc[e.category] ?? 0) + monthly;
    return acc;
  }, {});

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Expenses</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Business costs — software, ads, equipment, contractors</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Expense</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Monthly Recurring</div>
          <div className="text-lg font-semibold text-red-400">${b.monthlyExpenses.toFixed(2)}/mo</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Annual Cost</div>
          <div className="text-lg font-semibold text-amber-400">${annualCost.toFixed(0)}/yr</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Total Items</div>
          <div className="text-lg font-semibold text-white">{b.expenses.length}</div>
        </div>
      </div>

      {Object.keys(byCategory).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(byCategory).sort((a, z) => z[1] - a[1]).map(([cat, monthly]) => (
            <div key={cat} className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
              <div className="text-xs text-zinc-500 capitalize mb-0.5">{cat}</div>
              <div className="text-sm font-medium text-zinc-200">${monthly.toFixed(2)}/mo</div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <Card title={editing ? "Edit Expense" : "Add Expense"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Label *</label>
                <input required value={form.label} onChange={(e) => set("label", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="e.g. TradingView Premium" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Category</label>
                <select value={form.category} onChange={(e) => set("category", e.target.value as Expense["category"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500">
                  {["software", "marketing", "equipment", "contractor", "ads", "other"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Frequency</label>
                <select value={form.frequency} onChange={(e) => set("frequency", e.target.value as Expense["frequency"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500">
                  {["monthly", "annual", "one-time"].map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Amount *</label>
                <input required type="number" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Currency</label>
                <select value={form.currency} onChange={(e) => set("currency", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500">
                  <option value="USD">USD</option>
                  <option value="VND">VND</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Date (one-time)</label>
                <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
                <input value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" type="submit">{editing ? "Save" : "Add Expense"}</Button>
              <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title={`All Expenses (${b.expenses.length})`}>
        {b.expenses.length === 0 ? (
          <p className="text-zinc-600 text-sm mt-3">No expenses added yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Label", "Category", "Amount", "Frequency", ""].map((h) => (
                    <th key={h} className="text-left py-2 pr-4 text-xs text-zinc-500 uppercase tracking-wide font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.expenses.map((e) => (
                  <tr key={e.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="py-2.5 pr-4">
                      <div className="text-zinc-200">{e.label}</div>
                      {e.date && <div className="text-xs text-zinc-600">{e.date}</div>}
                    </td>
                    <td className="py-2.5 pr-4"><Badge variant="neutral">{e.category}</Badge></td>
                    <td className="py-2.5 pr-4 text-red-400 font-medium">${e.amount} {e.currency}</td>
                    <td className="py-2.5 pr-4 text-zinc-400">{e.frequency}</td>
                    <td className="py-2.5">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(e)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                        <button onClick={() => b.deleteExpense(e.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-700">
                  <td colSpan={2} className="py-2 text-zinc-500 text-xs font-medium">Monthly Recurring</td>
                  <td className="py-2 text-red-400 font-bold">${b.monthlyExpenses.toFixed(2)} USD/mo</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
