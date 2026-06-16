"use client";

import { useState } from "react";
import { useCryptoStore } from "@/store/useCryptoStore";
import type { CryptoTransaction } from "@/store/useCryptoStore";
import { Card, Badge, Button } from "@tn-os/ui";

type FormState = { type: CryptoTransaction["type"]; symbol: string; amount: string; price_usd: string; date: string; fee_usd: string; notes: string };
const emptyForm = (): FormState => ({ type: "buy", symbol: "", amount: "", price_usd: "", date: new Date().toISOString().split("T")[0] ?? "", fee_usd: "", notes: "" });

const typeColor: Record<CryptoTransaction["type"], string> = { buy: "text-emerald-400", sell: "text-red-400", transfer: "text-blue-400", swap: "text-amber-400", stake: "text-purple-400", earn: "text-sky-400" };

export default function TransactionsPage() {
  const c = useCryptoStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CryptoTransaction | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!c.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (t: CryptoTransaction) => {
    setEditing(t);
    setForm({ type: t.type, symbol: t.symbol, amount: String(t.amount), price_usd: String(t.price_usd), date: t.date, fee_usd: String(t.fee_usd ?? ""), notes: t.notes ?? "" });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { type: form.type, symbol: form.symbol.toUpperCase().trim(), amount: parseFloat(form.amount) || 0, price_usd: parseFloat(form.price_usd) || 0, date: form.date, fee_usd: form.fee_usd ? parseFloat(form.fee_usd) : undefined, notes: form.notes.trim() || undefined };
    if (editing) { c.updateTransaction({ ...editing, ...payload }); } else { c.addTransaction(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Buy, sell, transfer, swap history</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Transaction</Button>
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Transaction" : "Add Transaction"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Type</label>
                <select value={form.type} onChange={(e) => set("type", e.target.value as CryptoTransaction["type"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                  {["buy", "sell", "transfer", "swap", "stake", "earn"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Symbol *</label>
                <input required value={form.symbol} onChange={(e) => set("symbol", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="BTC" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Amount *</label>
                <input required type="number" step="any" value={form.amount} onChange={(e) => set("amount", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Price (USD)</label>
                <input type="number" step="any" value={form.price_usd} onChange={(e) => set("price_usd", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Date *</label>
                <input required type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Fee (USD)</label>
                <input type="number" step="0.01" value={form.fee_usd} onChange={(e) => set("fee_usd", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="0" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
                <input value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" type="submit">{editing ? "Save" : "Add"}</Button>
              <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title={`History (${c.transactions.length})`}>
        {c.transactions.length === 0 ? (
          <p className="text-zinc-600 text-sm mt-3">No transactions yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Date", "Type", "Symbol", "Amount", "Price", "Total", "Fee", ""].map((h) => (
                    <th key={h} className="text-left py-2 pr-4 text-xs text-zinc-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.transactions.map((t) => (
                  <tr key={t.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="py-2.5 pr-4 text-zinc-400 text-xs">{t.date}</td>
                    <td className="py-2.5 pr-4"><span className={`font-medium text-xs uppercase ${typeColor[t.type]}`}>{t.type}</span></td>
                    <td className="py-2.5 pr-4 font-bold text-amber-400">{t.symbol}</td>
                    <td className="py-2.5 pr-4 text-zinc-200">{t.amount}</td>
                    <td className="py-2.5 pr-4 text-zinc-400">${t.price_usd.toLocaleString()}</td>
                    <td className="py-2.5 pr-4 text-zinc-200">${(t.amount * t.price_usd).toFixed(0)}</td>
                    <td className="py-2.5 pr-4 text-zinc-500 text-xs">{t.fee_usd ? `$${t.fee_usd}` : "—"}</td>
                    <td className="py-2.5">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(t)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                        <button onClick={() => c.deleteTransaction(t.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
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
