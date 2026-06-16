"use client";

import { useState } from "react";
import { useWealthStore } from "@/store/useWealthStore";
import type { Vehicle } from "@/store/useWealthStore";
import { Card, Button } from "@tn-os/ui";

function fmtB(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  return n.toLocaleString();
}

type FormState = {
  name: string; make: string; model: string; year: string;
  purchase_price: string; current_value: string; currency: string; note: string;
};

const emptyForm = (): FormState => ({
  name: "", make: "", model: "", year: "",
  purchase_price: "", current_value: "", currency: "VND", note: "",
});

export default function VehiclesPage() {
  const w = useWealthStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!w.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm({
      name: v.name, make: v.make ?? "", model: v.model ?? "", year: String(v.year ?? ""),
      purchase_price: String(v.purchase_price), current_value: String(v.current_value),
      currency: v.currency, note: v.note ?? "",
    });
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(), make: form.make.trim() || undefined, model: form.model.trim() || undefined,
      year: form.year ? parseInt(form.year) : undefined,
      purchase_price: parseFloat(form.purchase_price) || 0,
      current_value: parseFloat(form.current_value) || 0,
      currency: form.currency, note: form.note.trim() || undefined,
    };
    if (editing) { w.updateVehicle({ ...editing, ...payload }); }
    else { w.addVehicle(payload); }
    setFormOpen(false);
  };

  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vehicles</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Cars, motorcycles, and other vehicles</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Vehicle</Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Total Current Value</div>
          <div className="text-lg font-semibold text-emerald-400">{fmtB(w.totalVehicleValue)} VND</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Fleet Size</div>
          <div className="text-lg font-semibold text-white">{w.vehicles.length} vehicles</div>
        </div>
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Vehicle" : "Add Vehicle"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Name *</label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Honda City 2022" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Year</label>
                <input type="number" value={form.year} onChange={(e) => set("year", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. 2022" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Make</label>
                <input value={form.make} onChange={(e) => set("make", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Honda" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Model</label>
                <input value={form.model} onChange={(e) => set("model", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. City" />
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
                <label className="text-xs text-zinc-400 mb-1 block">Note</label>
                <input value={form.note} onChange={(e) => set("note", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" type="submit">{editing ? "Save" : "Add Vehicle"}</Button>
              <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title={`All Vehicles (${w.vehicles.length})`}>
        {w.vehicles.length === 0 ? (
          <p className="text-zinc-600 text-sm mt-3">No vehicles added yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Name", "Make / Model", "Year", "Purchase Price", "Current Value", "Depreciation", ""].map((h) => (
                    <th key={h} className="text-left py-2 pr-4 text-xs text-zinc-500 uppercase tracking-wide font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {w.vehicles.map((v) => {
                  const depr = v.current_value - v.purchase_price;
                  return (
                    <tr key={v.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="py-2.5 pr-4 text-zinc-200">{v.name}</td>
                      <td className="py-2.5 pr-4 text-zinc-400">{[v.make, v.model].filter(Boolean).join(" ") || "—"}</td>
                      <td className="py-2.5 pr-4 text-zinc-400">{v.year ?? "—"}</td>
                      <td className="py-2.5 pr-4 text-zinc-300">{fmtB(v.purchase_price)}</td>
                      <td className="py-2.5 pr-4 text-emerald-400 font-medium">{fmtB(v.current_value)}</td>
                      <td className={`py-2.5 pr-4 ${depr >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {depr >= 0 ? "+" : ""}{fmtB(depr)}
                      </td>
                      <td className="py-2.5">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(v)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                          <button onClick={() => w.deleteVehicle(v.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
