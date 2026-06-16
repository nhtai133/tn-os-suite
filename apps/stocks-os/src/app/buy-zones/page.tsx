"use client";

import { useState } from "react";
import { useStocksStore } from "@/store/useStocksStore";
import type { BuyZone } from "@/store/useStocksStore";
import { Card, Badge, Button } from "@tn-os/ui";

type FormState = { symbol: string; zone_low: string; zone_high: string; currency: "VND" | "USD"; rationale: string; status: BuyZone["status"] };
const emptyForm = (): FormState => ({ symbol: "", zone_low: "", zone_high: "", currency: "VND", rationale: "", status: "waiting" });

const statusVariant: Record<BuyZone["status"], "success" | "neutral" | "warning" | "danger"> = { waiting: "neutral", active: "success", passed: "warning", triggered: "danger" };

function fmtPrice(val: number, currency: "VND" | "USD") {
  return currency === "VND" ? `${val.toLocaleString()} VND` : `$${val.toLocaleString()}`;
}

export default function BuyZonesPage() {
  const s = useStocksStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BuyZone | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [filterStatus, setFilterStatus] = useState<BuyZone["status"] | "all">("all");

  if (!s.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (z: BuyZone) => {
    setEditing(z);
    setForm({ symbol: z.symbol, zone_low: String(z.zone_low), zone_high: String(z.zone_high), currency: z.currency, rationale: z.rationale ?? "", status: z.status });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { symbol: form.symbol.toUpperCase().trim(), zone_low: parseFloat(form.zone_low) || 0, zone_high: parseFloat(form.zone_high) || 0, currency: form.currency, rationale: form.rationale.trim() || undefined, status: form.status };
    if (editing) { s.updateBuyZone({ ...editing, ...payload }); } else { s.addBuyZone(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const filtered = filterStatus === "all" ? s.buy_zones : s.buy_zones.filter((z) => z.status === filterStatus);
  const active = s.buy_zones.filter((z) => z.status === "active" || z.status === "waiting");

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Buy Zones</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Price zones for planned entries</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Zone</Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Active / Waiting</div>
          <div className="text-lg font-semibold text-sky-400">{active.length}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Total Zones</div>
          <div className="text-lg font-semibold text-white">{s.buy_zones.length}</div>
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "waiting", "active", "passed", "triggered"] as const).map((st) => (
          <button key={st} onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === st ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" : "text-zinc-500 hover:text-zinc-300 border border-transparent"}`}>
            {st === "all" ? `All (${s.buy_zones.length})` : `${st.charAt(0).toUpperCase() + st.slice(1)} (${s.buy_zones.filter((z) => z.status === st).length})`}
          </button>
        ))}
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Buy Zone" : "Add Buy Zone"}>
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
                <label className="text-xs text-zinc-400 mb-1 block">Zone Low *</label>
                <input required type="number" step="any" value={form.zone_low} onChange={(e) => set("zone_low", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="80000" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Zone High *</label>
                <input required type="number" step="any" value={form.zone_high} onChange={(e) => set("zone_high", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="85000" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value as BuyZone["status"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500">
                  {["waiting", "active", "passed", "triggered"].map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Rationale</label>
                <input value={form.rationale} onChange={(e) => set("rationale", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="Support level, DCF range..." />
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
        {filtered.length === 0 && <Card title="No zones"><p className="text-zinc-600 text-sm mt-2">No buy zones found.</p></Card>}
        {filtered.map((z) => (
          <Card key={z.id} title={z.symbol}
            action={
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant[z.status]}>{z.status}</Badge>
                <button onClick={() => openEdit(z)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                <button onClick={() => s.deleteBuyZone(z.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
              </div>
            }>
            <div className="mt-2 flex items-center gap-4 text-sm">
              <div>
                <div className="text-xs text-zinc-500">Zone</div>
                <div className="font-medium text-sky-400">{fmtPrice(z.zone_low, z.currency)} – {fmtPrice(z.zone_high, z.currency)}</div>
              </div>
            </div>
            {z.rationale && <p className="mt-2 text-sm text-zinc-400">{z.rationale}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
