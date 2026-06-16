"use client";

import { useState } from "react";
import { useWealthStore } from "@/store/useWealthStore";
import { Card, Button, Badge } from "@tn-os/ui";

function fmtB(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  return n.toLocaleString();
}

export default function EmergencyFundPage() {
  const w = useWealthStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ monthly_expenses: "", target_months: "", current_amount: "", currency: "VND" });

  if (!w.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const ef = w.emergency_fund;
  const coverage = ef.target_months > 0 ? Math.min((w.emergencyMonths / ef.target_months) * 100, 100) : 0;
  const targetAmount = ef.monthly_expenses * ef.target_months;
  const gap = targetAmount - ef.current_amount;

  const openEdit = () => {
    setForm({
      monthly_expenses: String(ef.monthly_expenses),
      target_months: String(ef.target_months),
      current_amount: String(ef.current_amount),
      currency: ef.currency,
    });
    setEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    w.updateEmergencyFund({
      monthly_expenses: parseFloat(form.monthly_expenses) || 0,
      target_months: parseFloat(form.target_months) || 6,
      current_amount: parseFloat(form.current_amount) || 0,
      currency: form.currency,
    });
    setEditing(false);
  };

  const set = (key: keyof typeof form, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const statusVariant = w.emergencyMonths >= ef.target_months ? "success" : w.emergencyMonths >= ef.target_months * 0.5 ? "warning" : "danger";
  const statusLabel = w.emergencyMonths >= ef.target_months ? "Fully Funded" : w.emergencyMonths >= ef.target_months * 0.5 ? "Partially Funded" : "Under-funded";

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Emergency Fund</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Liquid reserves to cover essential expenses</p>
        </div>
        <Button variant="primary" onClick={openEdit}>Edit</Button>
      </div>

      {/* Hero */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-500 mb-1">Coverage</div>
            <div className="text-3xl font-bold text-white">
              {w.emergencyMonths.toFixed(1)} <span className="text-lg text-zinc-400">/ {ef.target_months} months</span>
            </div>
          </div>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>{fmtB(ef.current_amount)} {ef.currency}</span>
            <span>Target: {fmtB(targetAmount)} {ef.currency}</span>
          </div>
          <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${w.emergencyMonths >= ef.target_months ? "bg-emerald-500" : w.emergencyMonths >= ef.target_months * 0.5 ? "bg-amber-500" : "bg-red-500"}`}
              style={{ width: `${coverage}%` }}
            />
          </div>
          <div className="text-xs text-zinc-500 mt-1">{coverage.toFixed(0)}% funded</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card title="Current Amount">
          <div className="mt-2 text-2xl font-bold text-emerald-400">{fmtB(ef.current_amount)}</div>
          <div className="text-xs text-zinc-500 mt-0.5">{ef.currency}</div>
        </Card>
        <Card title="Target Amount">
          <div className="mt-2 text-2xl font-bold text-zinc-200">{fmtB(targetAmount)}</div>
          <div className="text-xs text-zinc-500 mt-0.5">{ef.target_months} × {fmtB(ef.monthly_expenses)}/mo</div>
        </Card>
        <Card title="Monthly Expenses">
          <div className="mt-2 text-2xl font-bold text-zinc-200">{fmtB(ef.monthly_expenses)}</div>
          <div className="text-xs text-zinc-500 mt-0.5">{ef.currency} / month</div>
        </Card>
        <Card title={gap > 0 ? "Gap to Fill" : "Surplus"}>
          <div className={`mt-2 text-2xl font-bold ${gap > 0 ? "text-amber-400" : "text-emerald-400"}`}>{fmtB(Math.abs(gap))}</div>
          <div className="text-xs text-zinc-500 mt-0.5">{ef.currency} {gap > 0 ? "still needed" : "above target"}</div>
        </Card>
      </div>

      {editing && (
        <Card title="Update Emergency Fund">
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Monthly Expenses</label>
                <input type="number" required value={form.monthly_expenses} onChange={(e) => set("monthly_expenses", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Target Months</label>
                <input type="number" required value={form.target_months} onChange={(e) => set("target_months", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="6" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Current Amount</label>
                <input type="number" required value={form.current_amount} onChange={(e) => set("current_amount", e.target.value)}
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
            </div>
            <div className="flex gap-3">
              <Button variant="primary" type="submit">Save</Button>
              <Button variant="ghost" type="button" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title="About Emergency Fund">
        <div className="mt-2 space-y-2 text-sm text-zinc-400">
          <p>An emergency fund should cover <strong className="text-zinc-200">3–6 months</strong> of essential expenses.</p>
          <p>Keep it in <strong className="text-zinc-200">liquid, low-risk</strong> accounts — savings or short-term deposits.</p>
          <p>Last updated: {new Date(ef.updated_at).toLocaleDateString()}</p>
        </div>
      </Card>
    </div>
  );
}
