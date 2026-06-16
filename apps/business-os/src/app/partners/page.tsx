"use client";

import { useState } from "react";
import { useBusinessStore } from "@/store/useBusinessStore";
import type { Partner } from "@/store/useBusinessStore";
import { Card, Badge, Button } from "@tn-os/ui";

type FormState = { name: string; type: Partner["type"]; status: Partner["status"]; monthly_value: string; currency: string; commission_rate: string; notes: string };
const emptyForm = (): FormState => ({ name: "", type: "broker", status: "active", monthly_value: "0", currency: "USD", commission_rate: "", notes: "" });

export default function PartnersPage() {
  const b = useBusinessStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!b.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (p: Partner) => {
    setEditing(p);
    setForm({ name: p.name, type: p.type, status: p.status, monthly_value: String(p.monthly_value), currency: p.currency, commission_rate: String(p.commission_rate ?? ""), notes: p.notes ?? "" });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name.trim(), type: form.type, status: form.status, monthly_value: parseFloat(form.monthly_value) || 0, currency: form.currency, commission_rate: form.commission_rate ? parseFloat(form.commission_rate) : undefined, notes: form.notes.trim() || undefined };
    if (editing) { b.updatePartner({ ...editing, ...payload }); } else { b.addPartner(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Partners</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Brokers, affiliates, collaborators, and vendors</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Partner</Button>
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Partner" : "Add Partner"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Partner Name *</label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="e.g. FTMO" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Type</label>
                <select value={form.type} onChange={(e) => set("type", e.target.value as Partner["type"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500">
                  {["broker", "affiliate", "collab", "sponsor", "vendor", "other"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value as Partner["status"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500">
                  {["active", "inactive", "prospect"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Monthly Value</label>
                <input type="number" value={form.monthly_value} onChange={(e) => set("monthly_value", e.target.value)}
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
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="Optional" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
                <input value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" type="submit">{editing ? "Save" : "Add Partner"}</Button>
              <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title={`All Partners (${b.partners.length})`}>
        {b.partners.length === 0 ? (
          <p className="text-zinc-600 text-sm mt-3">No partners added yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Partner", "Type", "Status", "Monthly Value", "Rate", ""].map((h) => (
                    <th key={h} className="text-left py-2 pr-4 text-xs text-zinc-500 uppercase tracking-wide font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.partners.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="py-2.5 pr-4">
                      <div className="text-zinc-200">{p.name}</div>
                      {p.notes && <div className="text-xs text-zinc-600">{p.notes}</div>}
                    </td>
                    <td className="py-2.5 pr-4"><Badge variant="neutral">{p.type}</Badge></td>
                    <td className="py-2.5 pr-4"><Badge variant={p.status === "active" ? "success" : p.status === "prospect" ? "warning" : "neutral"}>{p.status}</Badge></td>
                    <td className="py-2.5 pr-4 text-violet-400 font-medium">{p.monthly_value > 0 ? `$${p.monthly_value}/mo` : "—"}</td>
                    <td className="py-2.5 pr-4 text-zinc-400">{p.commission_rate ? `${p.commission_rate}%` : "—"}</td>
                    <td className="py-2.5">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                        <button onClick={() => b.deletePartner(p.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
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
