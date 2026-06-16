"use client";

import { useState } from "react";
import { useBusinessStore } from "@/store/useBusinessStore";
import type { RevenueStream, RevenueChannel } from "@/store/useBusinessStore";
import { Card, Badge, Button } from "@tn-os/ui";

const CHANNELS: RevenueChannel[] = ["forex-ib", "crypto-ib", "tiktok", "telegram", "zalo", "affiliate", "saas", "coaching", "consulting", "other"];
const CHANNEL_LABELS: Record<RevenueChannel, string> = {
  "forex-ib": "Forex IB", "crypto-ib": "Crypto IB", "tiktok": "TikTok",
  "telegram": "Telegram", "zalo": "Zalo", "affiliate": "Affiliate",
  "saas": "SaaS", "coaching": "Coaching", "consulting": "Consulting", "other": "Other",
};

type FormState = { name: string; channel: RevenueChannel; status: RevenueStream["status"]; monthly_revenue: string; currency: string; notes: string };
const emptyForm = (): FormState => ({ name: "", channel: "forex-ib", status: "active", monthly_revenue: "", currency: "USD", notes: "" });

export default function RevenuePage() {
  const b = useBusinessStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RevenueStream | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!b.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (r: RevenueStream) => {
    setEditing(r);
    setForm({ name: r.name, channel: r.channel, status: r.status, monthly_revenue: String(r.monthly_revenue), currency: r.currency, notes: r.notes ?? "" });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name.trim(), channel: form.channel, status: form.status, monthly_revenue: parseFloat(form.monthly_revenue) || 0, currency: form.currency, notes: form.notes.trim() || undefined };
    if (editing) { b.updateRevenueStream({ ...editing, ...payload }); } else { b.addRevenueStream(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const statusColor: Record<RevenueStream["status"], string> = { active: "text-emerald-400", paused: "text-amber-400", planned: "text-blue-400" };

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenue Streams</h1>
          <p className="text-sm text-zinc-500 mt-0.5">All income channels for TNPA</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Stream</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Total Active Revenue</div>
          <div className="text-lg font-semibold text-violet-400">${b.totalMonthlyRevenue.toFixed(0)}/mo</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Active Streams</div>
          <div className="text-lg font-semibold text-white">{b.revenue_streams.filter((r) => r.status === "active").length}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Planned Streams</div>
          <div className="text-lg font-semibold text-blue-400">{b.revenue_streams.filter((r) => r.status === "planned").length}</div>
        </div>
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Revenue Stream" : "Add Revenue Stream"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Name *</label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                  placeholder="e.g. FTMO IB Commission" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Channel</label>
                <select value={form.channel} onChange={(e) => set("channel", e.target.value as RevenueChannel)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500">
                  {CHANNELS.map((c) => <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value as RevenueStream["status"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500">
                  {["active", "paused", "planned"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
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
                <label className="text-xs text-zinc-400 mb-1 block">Monthly Revenue</label>
                <input type="number" value={form.monthly_revenue} onChange={(e) => set("monthly_revenue", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
                <input value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" type="submit">{editing ? "Save" : "Add Stream"}</Button>
              <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title={`All Revenue Streams (${b.revenue_streams.length})`}>
        {b.revenue_streams.length === 0 ? (
          <p className="text-zinc-600 text-sm mt-3">No revenue streams yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Name", "Channel", "Status", "Monthly Revenue", ""].map((h) => (
                    <th key={h} className="text-left py-2 pr-4 text-xs text-zinc-500 uppercase tracking-wide font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.revenue_streams.sort((a, z) => z.monthly_revenue - a.monthly_revenue).map((r) => (
                  <tr key={r.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="py-2.5 pr-4">
                      <div className="text-zinc-200">{r.name}</div>
                      {r.notes && <div className="text-xs text-zinc-600">{r.notes}</div>}
                    </td>
                    <td className="py-2.5 pr-4"><Badge variant="neutral">{CHANNEL_LABELS[r.channel]}</Badge></td>
                    <td className="py-2.5 pr-4"><span className={`text-sm font-medium ${statusColor[r.status]}`}>{r.status}</span></td>
                    <td className="py-2.5 pr-4 text-violet-400 font-medium">{r.monthly_revenue > 0 ? `${r.currency === "USD" ? "$" : ""}${r.monthly_revenue.toLocaleString()} ${r.currency}/mo` : "—"}</td>
                    <td className="py-2.5">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(r)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                        <button onClick={() => b.deleteRevenueStream(r.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-700">
                  <td colSpan={3} className="py-2 text-zinc-500 text-xs font-medium">Active Total</td>
                  <td className="py-2 text-violet-400 font-bold">${b.totalMonthlyRevenue.toFixed(0)} USD/mo</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
