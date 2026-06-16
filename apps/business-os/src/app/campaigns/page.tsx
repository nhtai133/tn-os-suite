"use client";

import { useState } from "react";
import { useBusinessStore } from "@/store/useBusinessStore";
import type { Campaign } from "@/store/useBusinessStore";
import { Card, Badge, Button } from "@tn-os/ui";

type FormState = { name: string; channel: string; status: Campaign["status"]; start_date: string; end_date: string; budget: string; revenue_generated: string; currency: string; notes: string };
const emptyForm = (): FormState => ({ name: "", channel: "tiktok", status: "planned", start_date: "", end_date: "", budget: "0", revenue_generated: "0", currency: "USD", notes: "" });

export default function CampaignsPage() {
  const b = useBusinessStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!b.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (c: Campaign) => {
    setEditing(c);
    setForm({ name: c.name, channel: c.channel, status: c.status, start_date: c.start_date ?? "", end_date: c.end_date ?? "", budget: String(c.budget), revenue_generated: String(c.revenue_generated), currency: c.currency, notes: c.notes ?? "" });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name.trim(), channel: form.channel.trim(), status: form.status, start_date: form.start_date || undefined, end_date: form.end_date || undefined, budget: parseFloat(form.budget) || 0, revenue_generated: parseFloat(form.revenue_generated) || 0, currency: form.currency, notes: form.notes.trim() || undefined };
    if (editing) { b.updateCampaign({ ...editing, ...payload }); } else { b.addCampaign(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const totalRevenue = b.campaigns.reduce((s, c) => s + c.revenue_generated, 0);
  const totalBudget = b.campaigns.reduce((s, c) => s + c.budget, 0);

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaigns</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Marketing campaigns and promotions</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ New Campaign</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Total Revenue Generated</div>
          <div className="text-lg font-semibold text-violet-400">${totalRevenue.toFixed(0)}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Total Budget Spent</div>
          <div className="text-lg font-semibold text-amber-400">${totalBudget.toFixed(0)}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Overall ROI</div>
          <div className="text-lg font-semibold text-emerald-400">{totalBudget > 0 ? `${(((totalRevenue - totalBudget) / totalBudget) * 100).toFixed(0)}%` : "—"}</div>
        </div>
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Campaign" : "New Campaign"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Campaign Name *</label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="e.g. FTMO Summer Push" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Channel</label>
                <input value={form.channel} onChange={(e) => set("channel", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="e.g. tiktok" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value as Campaign["status"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500">
                  {["active", "planned", "completed", "paused"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Start Date</label>
                <input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">End Date</label>
                <input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Budget (USD)</label>
                <input type="number" value={form.budget} onChange={(e) => set("budget", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Revenue Generated (USD)</label>
                <input type="number" value={form.revenue_generated} onChange={(e) => set("revenue_generated", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="0" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
                <input value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" type="submit">{editing ? "Save" : "Create Campaign"}</Button>
              <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {b.campaigns.length === 0 && <Card title="No campaigns"><p className="text-zinc-600 text-sm mt-2">No campaigns yet.</p></Card>}
        {b.campaigns.map((c) => {
          const roi = c.budget > 0 ? ((c.revenue_generated - c.budget) / c.budget) * 100 : null;
          return (
            <Card key={c.id} title={c.name}
              action={
                <div className="flex items-center gap-2">
                  <Badge variant={c.status === "active" ? "success" : c.status === "completed" ? "neutral" : c.status === "paused" ? "warning" : "neutral"}>{c.status}</Badge>
                  <button onClick={() => openEdit(c)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                  <button onClick={() => b.deleteCampaign(c.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                </div>
              }>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><div className="text-xs text-zinc-500 mb-0.5">Channel</div><div className="text-zinc-200">{c.channel}</div></div>
                <div><div className="text-xs text-zinc-500 mb-0.5">Budget</div><div className="text-amber-400">${c.budget}</div></div>
                <div><div className="text-xs text-zinc-500 mb-0.5">Revenue</div><div className="text-emerald-400 font-semibold">${c.revenue_generated}</div></div>
                <div><div className="text-xs text-zinc-500 mb-0.5">ROI</div><div className={roi !== null ? (roi >= 0 ? "text-emerald-400" : "text-red-400") : "text-zinc-600"}>{roi !== null ? `${roi.toFixed(0)}%` : "—"}</div></div>
                {(c.start_date ?? c.end_date) && (
                  <div className="col-span-2 text-xs text-zinc-500">{c.start_date} → {c.end_date ?? "ongoing"}</div>
                )}
                {c.notes && <div className="col-span-4 text-xs text-zinc-500 italic">{c.notes}</div>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
