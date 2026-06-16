"use client";

import { useState } from "react";
import { useBusinessStore } from "@/store/useBusinessStore";
import type { MonthlyPnL } from "@/store/useBusinessStore";
import { Card, Button } from "@tn-os/ui";

type FormState = { month: string; revenue: string; expenses: string; currency: string; notes: string };
const emptyForm = (): FormState => ({
  month: new Date().toISOString().slice(0, 7),
  revenue: "", expenses: "", currency: "USD", notes: "",
});

export default function PnLPage() {
  const b = useBusinessStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MonthlyPnL | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!b.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (p: MonthlyPnL) => {
    setEditing(p);
    setForm({ month: p.month, revenue: String(p.revenue), expenses: String(p.expenses), currency: p.currency, notes: p.notes ?? "" });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const revenue = parseFloat(form.revenue) || 0;
    const expenses = parseFloat(form.expenses) || 0;
    const payload = { month: form.month, revenue, expenses, net_profit: revenue - expenses, currency: form.currency, notes: form.notes.trim() || undefined };
    if (editing) { b.updateMonthlyPnL({ ...editing, ...payload }); } else { b.addMonthlyPnL(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const snapshotNow = () => {
    setForm({ month: new Date().toISOString().slice(0, 7), revenue: b.totalMonthlyRevenue.toFixed(2), expenses: b.monthlyExpenses.toFixed(2), currency: "USD", notes: "Auto-captured from live data" });
    setEditing(null);
    setFormOpen(true);
  };

  const totalNetProfit = b.monthly_pnl.reduce((s, p) => s + p.net_profit, 0);
  const avgMonthly = b.monthly_pnl.length > 0 ? totalNetProfit / b.monthly_pnl.length : 0;

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Monthly P&L</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Business profit and loss history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={snapshotNow}>Snapshot Now</Button>
          <Button variant="primary" onClick={openAdd}>+ Add Month</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Live Monthly Net Profit</div>
          <div className={`text-lg font-semibold ${b.netProfit >= 0 ? "text-violet-400" : "text-red-400"}`}>${b.netProfit.toFixed(2)}/mo</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Avg Monthly Profit (history)</div>
          <div className={`text-lg font-semibold ${avgMonthly >= 0 ? "text-emerald-400" : "text-red-400"}`}>${avgMonthly.toFixed(0)}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Total Recorded</div>
          <div className="text-lg font-semibold text-white">${totalNetProfit.toFixed(0)}</div>
        </div>
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Month" : "Add Monthly P&L"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Month *</label>
                <input required type="month" value={form.month} onChange={(e) => set("month", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" />
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
                <label className="text-xs text-zinc-400 mb-1 block">Revenue *</label>
                <input required type="number" step="0.01" value={form.revenue} onChange={(e) => set("revenue", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Expenses *</label>
                <input required type="number" step="0.01" value={form.expenses} onChange={(e) => set("expenses", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="0" />
              </div>
              {form.revenue && form.expenses && (
                <div className="col-span-2 rounded-lg bg-zinc-800/60 px-4 py-2 text-sm">
                  <span className="text-zinc-500">Net Profit: </span>
                  <span className={`font-medium ${parseFloat(form.revenue) - parseFloat(form.expenses) >= 0 ? "text-violet-400" : "text-red-400"}`}>
                    ${(parseFloat(form.revenue) - parseFloat(form.expenses)).toFixed(2)}
                  </span>
                  <span className="text-zinc-600 ml-2">({form.revenue && parseFloat(form.revenue) > 0 ? (((parseFloat(form.revenue) - parseFloat(form.expenses)) / parseFloat(form.revenue)) * 100).toFixed(0) : 0}% margin)</span>
                </div>
              )}
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
                <input value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="e.g. Best month so far" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" type="submit">{editing ? "Save" : "Add Month"}</Button>
              <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title={`P&L History (${b.monthly_pnl.length} months)`}>
        {b.monthly_pnl.length === 0 ? (
          <p className="text-zinc-600 text-sm mt-3">No P&L records yet. Click &ldquo;Snapshot Now&rdquo; to record the current month.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Month", "Revenue", "Expenses", "Net Profit", "Margin", "Notes", ""].map((h) => (
                    <th key={h} className="text-left py-2 pr-4 text-xs text-zinc-500 uppercase tracking-wide font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.monthly_pnl.map((p) => {
                  const margin = p.revenue > 0 ? (p.net_profit / p.revenue) * 100 : 0;
                  return (
                    <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="py-2.5 pr-4 text-zinc-200 font-medium">{p.month}</td>
                      <td className="py-2.5 pr-4 text-violet-400">${p.revenue.toFixed(0)}</td>
                      <td className="py-2.5 pr-4 text-red-400">-${p.expenses.toFixed(0)}</td>
                      <td className={`py-2.5 pr-4 font-semibold ${p.net_profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>${p.net_profit.toFixed(0)}</td>
                      <td className="py-2.5 pr-4 text-zinc-400">{margin.toFixed(0)}%</td>
                      <td className="py-2.5 pr-4 text-zinc-500 text-xs">{p.notes ?? "—"}</td>
                      <td className="py-2.5">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(p)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                          <button onClick={() => b.deleteMonthlyPnL(p.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
