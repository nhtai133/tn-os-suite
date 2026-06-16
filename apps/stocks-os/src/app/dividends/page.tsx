"use client";

import { useState } from "react";
import { useStocksStore, toUSD } from "@/store/useStocksStore";
import type { DividendRecord } from "@/store/useStocksStore";
import { Card, Button } from "@tn-os/ui";

type FormState = { symbol: string; amount_per_share: string; shares_held: string; currency: "VND" | "USD"; ex_date: string; payment_date: string; notes: string };
const emptyForm = (): FormState => ({ symbol: "", amount_per_share: "", shares_held: "", currency: "VND", ex_date: "", payment_date: "", notes: "" });

export default function DividendsPage() {
  const s = useStocksStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DividendRecord | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!s.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (d: DividendRecord) => {
    setEditing(d);
    setForm({ symbol: d.symbol, amount_per_share: String(d.amount_per_share), shares_held: String(d.shares_held), currency: d.currency, ex_date: d.ex_date, payment_date: d.payment_date ?? "", notes: d.notes ?? "" });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const aps = parseFloat(form.amount_per_share) || 0;
    const sh = parseFloat(form.shares_held) || 0;
    const payload = { symbol: form.symbol.toUpperCase().trim(), amount_per_share: aps, shares_held: sh, total_received: aps * sh, currency: form.currency, ex_date: form.ex_date, payment_date: form.payment_date || undefined, notes: form.notes.trim() || undefined };
    if (editing) { s.updateDividend({ ...editing, ...payload }); } else { s.addDividend(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const bySymbol = s.dividends.reduce<Record<string, number>>((acc, d) => {
    acc[d.symbol] = (acc[d.symbol] ?? 0) + toUSD(d.total_received, d.currency);
    return acc;
  }, {});

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dividends</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Cash and stock dividend income records</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Record</Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Total Dividend Income</div>
          <div className="text-lg font-semibold text-emerald-400">${s.annualDividendIncomeUSD.toFixed(0)}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Records</div>
          <div className="text-lg font-semibold text-white">{s.dividends.length}</div>
        </div>
      </div>

      {Object.keys(bySymbol).length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(bySymbol).sort((a, b) => b[1] - a[1]).map(([sym, usd]) => (
            <div key={sym} className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
              <div className="text-xs text-zinc-500 mb-0.5">{sym}</div>
              <div className="text-sm font-medium text-emerald-400">${usd.toFixed(0)}</div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <Card title={editing ? "Edit Record" : "Add Dividend Record"}>
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
                <label className="text-xs text-zinc-400 mb-1 block">Amount Per Share *</label>
                <input required type="number" step="any" value={form.amount_per_share} onChange={(e) => set("amount_per_share", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="1800" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Shares Held *</label>
                <input required type="number" value={form.shares_held} onChange={(e) => set("shares_held", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="50" />
              </div>
              {form.amount_per_share && form.shares_held && (
                <div className="col-span-2 rounded-lg bg-zinc-800/60 px-4 py-2 text-sm">
                  <span className="text-zinc-500">Total: </span>
                  <span className="font-medium text-emerald-400">{(parseFloat(form.amount_per_share) * parseFloat(form.shares_held)).toLocaleString()} {form.currency}</span>
                </div>
              )}
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Ex-Dividend Date *</label>
                <input required type="date" value={form.ex_date} onChange={(e) => set("ex_date", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Payment Date</label>
                <input type="date" value={form.payment_date} onChange={(e) => set("payment_date", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
                <input value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="Cash dividend 2025" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" type="submit">{editing ? "Save" : "Add"}</Button>
              <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title={`All Records (${s.dividends.length})`}>
        {s.dividends.length === 0 ? (
          <p className="text-zinc-600 text-sm mt-3">No dividend records yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Symbol", "Per Share", "Shares", "Total", "Ex-Date", "Pay Date", ""].map((h) => (
                    <th key={h} className="text-left py-2 pr-4 text-xs text-zinc-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...s.dividends].sort((a, b) => b.ex_date.localeCompare(a.ex_date)).map((d) => (
                  <tr key={d.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="py-2.5 pr-4 font-bold text-sky-400">{d.symbol}</td>
                    <td className="py-2.5 pr-4 text-zinc-400">{d.amount_per_share.toLocaleString()} {d.currency}</td>
                    <td className="py-2.5 pr-4 text-zinc-200">{d.shares_held}</td>
                    <td className="py-2.5 pr-4 text-emerald-400 font-medium">{d.total_received.toLocaleString()} {d.currency}</td>
                    <td className="py-2.5 pr-4 text-zinc-400">{d.ex_date}</td>
                    <td className="py-2.5 pr-4 text-zinc-500">{d.payment_date ?? "—"}</td>
                    <td className="py-2.5">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(d)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                        <button onClick={() => s.deleteDividend(d.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
