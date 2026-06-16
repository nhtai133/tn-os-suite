"use client";

import { useState } from "react";
import { useBusinessStore } from "@/store/useBusinessStore";
import type { Client, ClientStatus } from "@/store/useBusinessStore";
import { Card, Badge, Button } from "@tn-os/ui";

type FormState = {
  name: string; channel: string; status: ClientStatus; monthly_value: string;
  currency: string; joined_date: string; broker: string; pending_issue: string; notes: string;
};
const emptyForm = (): FormState => ({ name: "", channel: "forex-ib", status: "lead", monthly_value: "0", currency: "USD", joined_date: "", broker: "", pending_issue: "", notes: "" });

const statusVariant: Record<ClientStatus, "success" | "warning" | "neutral" | "danger"> = {
  vip: "success", active: "success", lead: "neutral", inactive: "danger",
};

export default function ClientsPage() {
  const b = useBusinessStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [filter, setFilter] = useState<ClientStatus | "all">("all");

  if (!b.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({ name: c.name, channel: c.channel, status: c.status, monthly_value: String(c.monthly_value), currency: c.currency, joined_date: c.joined_date ?? "", broker: c.broker ?? "", pending_issue: c.pending_issue ?? "", notes: c.notes ?? "" });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name.trim(), channel: form.channel, status: form.status, monthly_value: parseFloat(form.monthly_value) || 0, currency: form.currency, joined_date: form.joined_date || undefined, broker: form.broker.trim() || undefined, pending_issue: form.pending_issue.trim() || undefined, notes: form.notes.trim() || undefined };
    if (editing) { b.updateClient({ ...editing, ...payload }); } else { b.addClient(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const filtered = filter === "all" ? b.clients : b.clients.filter((c) => c.status === filter);
  const totalValue = b.clients.filter((c) => c.status === "active" || c.status === "vip").reduce((s, c) => s + c.monthly_value, 0);

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients & Leads</h1>
          <p className="text-sm text-zinc-500 mt-0.5">IB clients, coaching clients, community members</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Client</Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {(["vip", "active", "lead", "inactive"] as ClientStatus[]).map((s) => (
          <button key={s} onClick={() => setFilter(s === filter ? "all" : s)}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${filter === s ? "border-violet-500/50 bg-violet-500/10" : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"}`}>
            <div className="text-xs text-zinc-500 capitalize mb-1">{s}</div>
            <div className={`text-lg font-semibold ${s === "vip" ? "text-amber-400" : s === "active" ? "text-emerald-400" : s === "lead" ? "text-blue-400" : "text-zinc-600"}`}>
              {b.clients.filter((c) => c.status === s).length}
            </div>
          </button>
        ))}
      </div>

      {b.pendingIssues > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
          ⚠ {b.pendingIssues} client{b.pendingIssues > 1 ? "s have" : " has"} pending issues requiring attention.
        </div>
      )}

      {formOpen && (
        <Card title={editing ? "Edit Client" : "Add Client"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Name *</label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="Client name" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Channel</label>
                <input value={form.channel} onChange={(e) => set("channel", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="e.g. forex-ib, coaching" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value as ClientStatus)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500">
                  {["vip", "active", "lead", "inactive"].map((s) => <option key={s} value={s}>{s}</option>)}
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
                <label className="text-xs text-zinc-400 mb-1 block">Broker (IB clients)</label>
                <input value={form.broker} onChange={(e) => set("broker", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="e.g. FTMO, Binance" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Joined Date</label>
                <input type="date" value={form.joined_date} onChange={(e) => set("joined_date", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Pending Issue</label>
                <input value={form.pending_issue} onChange={(e) => set("pending_issue", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="Leave blank if none" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
                <input value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" type="submit">{editing ? "Save" : "Add Client"}</Button>
              <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title={`Clients (${filtered.length}${filter !== "all" ? ` · ${filter}` : ""})`}
        action={filter !== "all" ? <button onClick={() => setFilter("all")} className="text-xs text-zinc-400 hover:text-white">Clear filter</button> : undefined}>
        {filtered.length === 0 ? (
          <p className="text-zinc-600 text-sm mt-3">No clients in this category.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {filtered.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-200">{c.name}</span>
                    <Badge variant={statusVariant[c.status]}>{c.status}</Badge>
                    {c.pending_issue && <Badge variant="warning">!</Badge>}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {c.channel}{c.broker ? ` · ${c.broker}` : ""}{c.joined_date ? ` · since ${c.joined_date}` : ""}
                  </div>
                  {c.pending_issue && <div className="text-xs text-amber-400 mt-0.5">⚠ {c.pending_issue}</div>}
                </div>
                <div className="flex items-center gap-3 ml-4">
                  {c.monthly_value > 0 && <span className="text-sm text-violet-400 font-medium">${c.monthly_value}/mo</span>}
                  <button onClick={() => openEdit(c)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                  <button onClick={() => b.deleteClient(c.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                </div>
              </div>
            ))}
            {filter === "all" && totalValue > 0 && (
              <div className="flex justify-between text-sm pt-2">
                <span className="text-zinc-500">Active monthly value</span>
                <span className="text-violet-400 font-bold">${totalValue}/mo USD</span>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
