"use client";

import { useState } from "react";
import { useBusinessStore } from "@/store/useBusinessStore";
import type { IBAccount } from "@/store/useBusinessStore";
import { Card, Badge, Button } from "@tn-os/ui";

type FormState = { name: string; broker: string; type: IBAccount["type"]; status: IBAccount["status"]; client_count: string; monthly_commission: string; currency: string; commission_rate: string; notes: string };
const emptyForm = (): FormState => ({ name: "", broker: "", type: "forex", status: "active", client_count: "0", monthly_commission: "0", currency: "USD", commission_rate: "", notes: "" });

export default function IBAccountsPage() {
  const b = useBusinessStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IBAccount | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!b.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (a: IBAccount) => {
    setEditing(a);
    setForm({ name: a.name, broker: a.broker, type: a.type, status: a.status, client_count: String(a.client_count), monthly_commission: String(a.monthly_commission), currency: a.currency, commission_rate: String(a.commission_rate ?? ""), notes: a.notes ?? "" });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name.trim(), broker: form.broker.trim(), type: form.type, status: form.status, client_count: parseInt(form.client_count) || 0, monthly_commission: parseFloat(form.monthly_commission) || 0, currency: form.currency, commission_rate: form.commission_rate ? parseFloat(form.commission_rate) : undefined, notes: form.notes.trim() || undefined };
    if (editing) { b.updateIBAccount({ ...editing, ...payload }); } else { b.addIBAccount(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const totalCommission = b.ib_accounts.filter((a) => a.status === "active").reduce((s, a) => s + a.monthly_commission, 0);
  const totalClients = b.ib_accounts.filter((a) => a.status === "active").reduce((s, a) => s + a.client_count, 0);

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">IB Accounts</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Forex and Crypto Introducing Broker programs</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add IB Account</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Total IB Commissions</div>
          <div className="text-lg font-semibold text-violet-400">${totalCommission.toFixed(0)}/mo</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Total IB Clients</div>
          <div className="text-lg font-semibold text-white">{totalClients}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Active Programs</div>
          <div className="text-lg font-semibold text-emerald-400">{b.ib_accounts.filter((a) => a.status === "active").length}</div>
        </div>
      </div>

      {formOpen && (
        <Card title={editing ? "Edit IB Account" : "Add IB Account"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Program Name *</label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="e.g. FTMO Affiliate Program" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Broker *</label>
                <input required value={form.broker} onChange={(e) => set("broker", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="e.g. FTMO" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Type</label>
                <select value={form.type} onChange={(e) => set("type", e.target.value as IBAccount["type"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500">
                  {["forex", "crypto", "stocks"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value as IBAccount["status"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500">
                  {["active", "inactive"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Client Count</label>
                <input type="number" value={form.client_count} onChange={(e) => set("client_count", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Monthly Commission</label>
                <input type="number" value={form.monthly_commission} onChange={(e) => set("monthly_commission", e.target.value)}
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
                <label className="text-xs text-zinc-400 mb-1 block">Commission Rate (%)</label>
                <input type="number" step="0.1" value={form.commission_rate} onChange={(e) => set("commission_rate", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="e.g. 10" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
                <input value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="Optional" />
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
        {b.ib_accounts.length === 0 && <Card title="No IB accounts"><p className="text-zinc-600 text-sm mt-2">No IB accounts added yet.</p></Card>}
        {b.ib_accounts.map((a) => (
          <Card key={a.id} title={a.name}
            action={
              <div className="flex items-center gap-2">
                <Badge variant={a.status === "active" ? "success" : "neutral"}>{a.status}</Badge>
                <Badge variant="neutral">{a.type}</Badge>
                <button onClick={() => openEdit(a)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                <button onClick={() => b.deleteIBAccount(a.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
              </div>
            }>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><div className="text-xs text-zinc-500 mb-0.5">Broker</div><div className="text-zinc-200">{a.broker}</div></div>
              <div><div className="text-xs text-zinc-500 mb-0.5">Clients</div><div className="text-zinc-200 font-semibold">{a.client_count}</div></div>
              <div><div className="text-xs text-zinc-500 mb-0.5">Monthly Commission</div><div className="text-violet-400 font-semibold">${a.monthly_commission}/mo</div></div>
              <div><div className="text-xs text-zinc-500 mb-0.5">Rate</div><div className="text-zinc-300">{a.commission_rate ? `${a.commission_rate}%` : "—"}</div></div>
              {a.notes && <div className="col-span-4 text-xs text-zinc-500 italic">{a.notes}</div>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
