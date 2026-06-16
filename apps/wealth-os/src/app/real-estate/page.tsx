"use client";

import { useState } from "react";
import { useWealthStore } from "@/store/useWealthStore";
import type { RealEstate } from "@/store/useWealthStore";
import { Card, Badge, Button } from "@tn-os/ui";

function fmtB(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  return n.toLocaleString();
}

const RE_TYPES: RealEstate["type"][] = ["apartment", "house", "land", "commercial", "other"];

type FormState = {
  name: string; address: string; type: RealEstate["type"];
  purchase_price: string; current_value: string; currency: string;
  purchase_date: string; monthly_rent: string; mortgage_remaining: string; note: string;
};

const emptyForm = (): FormState => ({
  name: "", address: "", type: "apartment",
  purchase_price: "", current_value: "", currency: "VND",
  purchase_date: "", monthly_rent: "", mortgage_remaining: "", note: "",
});

export default function RealEstatePage() {
  const w = useWealthStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RealEstate | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!w.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (r: RealEstate) => {
    setEditing(r);
    setForm({
      name: r.name, address: r.address ?? "", type: r.type,
      purchase_price: String(r.purchase_price), current_value: String(r.current_value),
      currency: r.currency, purchase_date: r.purchase_date ?? "",
      monthly_rent: String(r.monthly_rent ?? ""), mortgage_remaining: String(r.mortgage_remaining ?? ""),
      note: r.note ?? "",
    });
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(), address: form.address.trim() || undefined, type: form.type,
      purchase_price: parseFloat(form.purchase_price) || 0,
      current_value: parseFloat(form.current_value) || 0,
      currency: form.currency, purchase_date: form.purchase_date || undefined,
      monthly_rent: form.monthly_rent ? parseFloat(form.monthly_rent) : undefined,
      mortgage_remaining: form.mortgage_remaining ? parseFloat(form.mortgage_remaining) : undefined,
      note: form.note.trim() || undefined,
    };
    if (editing) { w.updateRealEstate({ ...editing, ...payload }); }
    else { w.addRealEstate(payload); }
    setFormOpen(false);
  };

  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const totalMonthlyRent = w.real_estate.reduce((s, r) => s + (r.monthly_rent ?? 0), 0);
  const totalGain = w.real_estate.reduce((s, r) => s + (r.current_value - r.purchase_price), 0);

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Real Estate</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Properties, land, and rental assets</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Property</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Total Value</div>
          <div className="text-lg font-semibold text-emerald-400">{fmtB(w.totalRealEstateValue)}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Total Gain/Loss</div>
          <div className={`text-lg font-semibold ${totalGain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {totalGain >= 0 ? "+" : ""}{fmtB(totalGain)}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Monthly Rent Income</div>
          <div className="text-lg font-semibold text-white">{fmtB(totalMonthlyRent)}</div>
        </div>
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Property" : "Add Property"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Property Name *</label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. District 7 Apartment" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Type</label>
                <select value={form.type} onChange={(e) => set("type", e.target.value as RealEstate["type"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                  {RE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Address</label>
                <input value={form.address} onChange={(e) => set("address", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Optional" />
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
                <label className="text-xs text-zinc-400 mb-1 block">Purchase Date</label>
                <input type="date" value={form.purchase_date} onChange={(e) => set("purchase_date", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Purchase Price *</label>
                <input required type="number" value={form.purchase_price} onChange={(e) => set("purchase_price", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Current Value *</label>
                <input required type="number" value={form.current_value} onChange={(e) => set("current_value", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Monthly Rent Income</label>
                <input type="number" value={form.monthly_rent} onChange={(e) => set("monthly_rent", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="0 if not rented" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Mortgage Remaining</label>
                <input type="number" value={form.mortgage_remaining} onChange={(e) => set("mortgage_remaining", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="0 if paid off" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Note</label>
                <input value={form.note} onChange={(e) => set("note", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" type="submit">{editing ? "Save" : "Add Property"}</Button>
              <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {w.real_estate.length === 0 && (
          <Card title="No properties"><p className="text-zinc-600 text-sm mt-2">No real estate added yet.</p></Card>
        )}
        {w.real_estate.map((r) => {
          const gain = r.current_value - r.purchase_price;
          const gainPct = r.purchase_price > 0 ? (gain / r.purchase_price) * 100 : 0;
          return (
            <Card
              key={r.id}
              title={r.name}
              action={
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">{r.type}</Badge>
                  <button onClick={() => openEdit(r)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                  <button onClick={() => w.deleteRealEstate(r.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                </div>
              }
            >
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-xs text-zinc-500 mb-0.5">Current Value</div>
                  <div className="text-emerald-400 font-semibold">{fmtB(r.current_value)} {r.currency}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-0.5">Purchase Price</div>
                  <div className="text-zinc-300">{fmtB(r.purchase_price)} {r.currency}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-0.5">Gain / Loss</div>
                  <div className={gain >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {gain >= 0 ? "+" : ""}{fmtB(gain)} ({gainPct.toFixed(1)}%)
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-0.5">Monthly Rent</div>
                  <div className="text-zinc-300">{r.monthly_rent ? `${fmtB(r.monthly_rent)} ${r.currency}` : "—"}</div>
                </div>
                {r.address && (
                  <div className="col-span-2">
                    <div className="text-xs text-zinc-500 mb-0.5">Address</div>
                    <div className="text-zinc-400 text-xs">{r.address}</div>
                  </div>
                )}
                {r.mortgage_remaining && (
                  <div>
                    <div className="text-xs text-zinc-500 mb-0.5">Mortgage Remaining</div>
                    <div className="text-amber-400">{fmtB(r.mortgage_remaining)} {r.currency}</div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
