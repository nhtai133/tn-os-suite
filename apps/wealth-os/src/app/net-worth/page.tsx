"use client";

import { useState } from "react";
import { useWealthStore } from "@/store/useWealthStore";
import type { NetWorthSnapshot } from "@/store/useWealthStore";
import { Card, Button } from "@tn-os/ui";

function fmtB(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  return n.toLocaleString();
}

type FormState = {
  date: string; total_assets: string; total_liabilities: string; currency: string; notes: string;
};

const emptyForm = (): FormState => ({
  date: new Date().toISOString().split("T")[0] ?? "",
  total_assets: "", total_liabilities: "", currency: "VND", notes: "",
});

export default function NetWorthPage() {
  const w = useWealthStore();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!w.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const snapshots = w.net_worth_snapshots;
  const latest = snapshots[0] as NetWorthSnapshot | undefined;
  const previous = snapshots[1] as NetWorthSnapshot | undefined;
  const change = latest && previous ? latest.net_worth - previous.net_worth : null;

  const prefillCurrent = () => {
    setForm({
      date: new Date().toISOString().split("T")[0] ?? "",
      total_assets: String(Math.round(w.totalAssets)),
      total_liabilities: String(Math.round(w.totalLiabilities)),
      currency: "VND",
      notes: "",
    });
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalAssets = parseFloat(form.total_assets) || 0;
    const totalLiabilities = parseFloat(form.total_liabilities) || 0;
    w.addNetWorthSnapshot({
      date: form.date,
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      net_worth: totalAssets - totalLiabilities,
      currency: form.currency,
      notes: form.notes.trim() || undefined,
    });
    setFormOpen(false);
  };

  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Net Worth History</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Track your wealth growth over time</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={prefillCurrent}>Snapshot Today</Button>
          <Button variant="primary" onClick={() => { setForm(emptyForm()); setFormOpen(true); }}>+ Manual Entry</Button>
        </div>
      </div>

      {/* Current state from live data */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-3">
        <div className="text-sm text-zinc-500 uppercase tracking-widest">Live Calculated Net Worth (VND)</div>
        <div className={`text-4xl font-bold ${w.netWorth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {fmtB(w.netWorth)}
        </div>
        <div className="flex gap-6 text-sm">
          <div><span className="text-zinc-500">Assets</span> <span className="text-white font-medium ml-2">{fmtB(w.totalAssets)}</span></div>
          <div><span className="text-zinc-500">Liabilities</span> <span className="text-red-400 font-medium ml-2">-{fmtB(w.totalLiabilities)}</span></div>
          {change !== null && (
            <div>
              <span className="text-zinc-500">Change from last</span>
              <span className={`font-medium ml-2 ${change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {change >= 0 ? "+" : ""}{fmtB(change)}
              </span>
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <Card title="Add Net Worth Snapshot">
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Date *</label>
                <input required type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
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
                <label className="text-xs text-zinc-400 mb-1 block">Total Assets *</label>
                <input required type="number" value={form.total_assets} onChange={(e) => set("total_assets", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Total Liabilities *</label>
                <input required type="number" value={form.total_liabilities} onChange={(e) => set("total_liabilities", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="0" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
                <input value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Q1 2025 snapshot" />
              </div>
            </div>
            {form.total_assets && form.total_liabilities && (
              <div className="rounded-lg bg-zinc-800/60 px-4 py-2 text-sm">
                <span className="text-zinc-500">Net Worth Preview: </span>
                <span className={`font-medium ${parseFloat(form.total_assets) - parseFloat(form.total_liabilities) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {fmtB(parseFloat(form.total_assets) - parseFloat(form.total_liabilities))}
                </span>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="primary" type="submit">Save Snapshot</Button>
              <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Snapshot table */}
      <Card title={`Snapshot History (${snapshots.length})`}>
        {snapshots.length === 0 ? (
          <p className="text-zinc-600 text-sm mt-3">No snapshots yet. Click &ldquo;Snapshot Today&rdquo; to record the current state.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Date", "Assets", "Liabilities", "Net Worth", "Change", "Notes", ""].map((h) => (
                    <th key={h} className="text-left py-2 pr-4 text-xs text-zinc-500 uppercase tracking-wide font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {snapshots.map((s, i) => {
                  const prev = snapshots[i + 1] as NetWorthSnapshot | undefined;
                  const diff = prev ? s.net_worth - prev.net_worth : null;
                  return (
                    <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="py-2.5 pr-4 text-zinc-200 font-medium">{s.date}</td>
                      <td className="py-2.5 pr-4 text-zinc-300">{fmtB(s.total_assets)}</td>
                      <td className="py-2.5 pr-4 text-red-400">{fmtB(s.total_liabilities)}</td>
                      <td className={`py-2.5 pr-4 font-semibold ${s.net_worth >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmtB(s.net_worth)}</td>
                      <td className="py-2.5 pr-4">
                        {diff !== null ? (
                          <span className={diff >= 0 ? "text-emerald-400" : "text-red-400"}>
                            {diff >= 0 ? "+" : ""}{fmtB(diff)}
                          </span>
                        ) : <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="py-2.5 pr-4 text-zinc-500">{s.notes ?? "—"}</td>
                      <td className="py-2.5">
                        <button onClick={() => w.deleteNetWorthSnapshot(s.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
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
