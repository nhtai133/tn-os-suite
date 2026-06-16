"use client";

import { useState } from "react";
import { useWealthStore } from "@/store/useWealthStore";
import type { BankAccount } from "@/store/useWealthStore";
import { Card, Badge, Button } from "@tn-os/ui";

function fmtB(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  return n.toLocaleString();
}

const ACCOUNT_TYPES: BankAccount["type"][] = ["checking", "savings", "term-deposit", "e-wallet"];

type FormState = {
  name: string;
  bank: string;
  type: BankAccount["type"];
  balance: string;
  currency: string;
  interest_rate: string;
  maturity_date: string;
  note: string;
};

const emptyForm = (): FormState => ({
  name: "", bank: "", type: "savings", balance: "", currency: "VND",
  interest_rate: "", maturity_date: "", note: "",
});

export default function BankAccountsPage() {
  const w = useWealthStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!w.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (a: BankAccount) => {
    setEditing(a);
    setForm({
      name: a.name, bank: a.bank, type: a.type, balance: String(a.balance),
      currency: a.currency, interest_rate: String(a.interest_rate ?? ""),
      maturity_date: a.maturity_date ?? "", note: a.note ?? "",
    });
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      bank: form.bank.trim(),
      type: form.type,
      balance: parseFloat(form.balance) || 0,
      currency: form.currency,
      interest_rate: form.interest_rate ? parseFloat(form.interest_rate) : undefined,
      maturity_date: form.maturity_date || undefined,
      note: form.note.trim() || undefined,
    };
    if (editing) {
      w.updateBankAccount({ ...editing, ...payload });
    } else {
      w.addBankAccount(payload);
    }
    setFormOpen(false);
  };

  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bank Accounts</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Cash, savings, term deposits, e-wallets</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Account</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {ACCOUNT_TYPES.map((t) => {
          const accounts = w.bank_accounts.filter((a) => a.type === t);
          const total = accounts.reduce((s, a) => s + a.balance, 0);
          return (
            <div key={t} className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
              <div className="text-xs text-zinc-500 capitalize mb-1">{t}</div>
              <div className="text-lg font-semibold text-white">{fmtB(total)}</div>
              <div className="text-xs text-zinc-600">{accounts.length} accounts</div>
            </div>
          );
        })}
      </div>

      {/* Form */}
      {formOpen && (
        <Card title={editing ? "Edit Account" : "Add Bank Account"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Account Name *</label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Vietcombank Savings" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Bank / Provider *</label>
                <input required value={form.bank} onChange={(e) => set("bank", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Vietcombank" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Type</label>
                <select value={form.type} onChange={(e) => set("type", e.target.value as BankAccount["type"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                  {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
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
                <label className="text-xs text-zinc-400 mb-1 block">Balance *</label>
                <input required type="number" value={form.balance} onChange={(e) => set("balance", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Interest Rate (%)</label>
                <input type="number" step="0.01" value={form.interest_rate} onChange={(e) => set("interest_rate", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. 5.5" />
              </div>
              {form.type === "term-deposit" && (
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Maturity Date</label>
                  <input type="date" value={form.maturity_date} onChange={(e) => set("maturity_date", e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
                </div>
              )}
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Note</label>
                <input value={form.note} onChange={(e) => set("note", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Optional note" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" type="submit">{editing ? "Save Changes" : "Add Account"}</Button>
              <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Table */}
      <Card title={`All Accounts (${w.bank_accounts.length})`}>
        {w.bank_accounts.length === 0 ? (
          <p className="text-zinc-600 text-sm mt-3">No accounts yet. Click &ldquo;Add Account&rdquo; to get started.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Name", "Bank", "Type", "Balance", "Rate", "Maturity", ""].map((h) => (
                    <th key={h} className="text-left py-2 pr-4 text-xs text-zinc-500 uppercase tracking-wide font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {w.bank_accounts.map((a) => (
                  <tr key={a.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="py-2.5 pr-4 text-zinc-200">{a.name}</td>
                    <td className="py-2.5 pr-4 text-zinc-400">{a.bank}</td>
                    <td className="py-2.5 pr-4"><Badge variant="neutral">{a.type}</Badge></td>
                    <td className="py-2.5 pr-4 text-emerald-400 font-medium">{fmtB(a.balance)} {a.currency}</td>
                    <td className="py-2.5 pr-4 text-zinc-400">{a.interest_rate ? `${a.interest_rate}%` : "—"}</td>
                    <td className="py-2.5 pr-4 text-zinc-400">{a.maturity_date ?? "—"}</td>
                    <td className="py-2.5">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(a)} className="text-xs text-zinc-400 hover:text-white transition-colors">Edit</button>
                        <button onClick={() => w.deleteBankAccount(a.id)} className="text-xs text-red-500 hover:text-red-400 transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-700">
                  <td colSpan={3} className="py-2 text-zinc-500 text-xs font-medium">Total</td>
                  <td className="py-2 text-white font-bold">{fmtB(w.totalBankBalance)} VND</td>
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
