"use client";

import { useState } from "react";
import { useCryptoStore } from "@/store/useCryptoStore";
import type { CryptoWallet } from "@/store/useCryptoStore";
import { Card, Badge, Button } from "@tn-os/ui";

type FormState = { name: string; type: CryptoWallet["type"]; chain: string; balance_usd: string; notes: string };
const emptyForm = (): FormState => ({ name: "", type: "hardware", chain: "", balance_usd: "", notes: "" });

const typeColor: Record<CryptoWallet["type"], string> = { cold: "text-blue-400", hardware: "text-purple-400", hot: "text-amber-400", exchange: "text-zinc-400" };

export default function WalletsPage() {
  const c = useCryptoStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CryptoWallet | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!c.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (w: CryptoWallet) => {
    setEditing(w);
    setForm({ name: w.name, type: w.type, chain: w.chain, balance_usd: String(w.balance_usd), notes: w.notes ?? "" });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name.trim(), type: form.type, chain: form.chain.trim(), balance_usd: parseFloat(form.balance_usd) || 0, notes: form.notes.trim() || undefined };
    if (editing) { c.updateWallet({ ...editing, ...payload }); } else { c.addWallet(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const totalBalance = c.wallets.reduce((s, w) => s + w.balance_usd, 0);

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Wallets</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Hot, cold, hardware, and exchange wallets</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Wallet</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Total Balance</div>
          <div className="text-lg font-semibold text-amber-400">${totalBalance.toFixed(0)}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Cold Storage</div>
          <div className="text-lg font-semibold text-purple-400">${c.coldWalletValueUSD.toFixed(0)}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Total Wallets</div>
          <div className="text-lg font-semibold text-white">{c.wallets.length}</div>
        </div>
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Wallet" : "Add Wallet"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Wallet Name *</label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="e.g. Ledger Nano X" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Type</label>
                <select value={form.type} onChange={(e) => set("type", e.target.value as CryptoWallet["type"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                  {["hardware", "cold", "hot", "exchange"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Chain / Network</label>
                <input value={form.chain} onChange={(e) => set("chain", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="BTC / ETH / multi" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Balance (USD)</label>
                <input type="number" step="0.01" value={form.balance_usd} onChange={(e) => set("balance_usd", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="0" />
              </div>
              <div>
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

      <div className="space-y-3">
        {c.wallets.length === 0 && <Card title="No wallets"><p className="text-zinc-600 text-sm mt-2">No wallets added yet.</p></Card>}
        {c.wallets.map((w) => (
          <Card key={w.id} title={w.name}
            action={
              <div className="flex items-center gap-2">
                <Badge variant="neutral">{w.type}</Badge>
                <button onClick={() => openEdit(w)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                <button onClick={() => c.deleteWallet(w.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
              </div>
            }>
            <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
              <div><div className="text-xs text-zinc-500">Chain</div><div className={`font-medium mt-0.5 ${typeColor[w.type]}`}>{w.chain || "—"}</div></div>
              <div><div className="text-xs text-zinc-500">Balance</div><div className="font-medium mt-0.5 text-amber-400">${w.balance_usd.toFixed(0)}</div></div>
              <div><div className="text-xs text-zinc-500">Type</div><div className={`font-medium mt-0.5 capitalize ${typeColor[w.type]}`}>{w.type}</div></div>
              {w.notes && <div className="col-span-3 text-xs text-zinc-500 italic">{w.notes}</div>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
