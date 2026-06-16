"use client";

import { useState } from "react";
import { useInvestmentStore } from "@/store/useInvestmentStore";
import { Card, Badge, Button, Table } from "@tn-os/ui";
import type { Fund } from "@tn-os/schemas";

function formatVND(n: number) {
  return (n / 1_000_000).toFixed(1) + "M";
}

const convictionVariant = {
  high: "success" as const,
  medium: "warning" as const,
  low: "neutral" as const,
};

export default function FundsPage() {
  const store = useInvestmentStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Fund | null>(null);

  const [form, setForm] = useState({
    name: "", ticker: "", category: "equity" as Fund["category"],
    currency: "VND", target_allocation_pct: 0,
    current_value: 0, cost_basis: 0,
    conviction: "medium" as Fund["conviction"],
    thesis: "", next_buy_zone: "",
  });

  function resetForm() {
    setForm({ name: "", ticker: "", category: "equity", currency: "VND", target_allocation_pct: 0, current_value: 0, cost_basis: 0, conviction: "medium", thesis: "", next_buy_zone: "" });
    setEditing(null);
    setShowForm(false);
  }

  function handleEdit(fund: Fund) {
    setEditing(fund);
    setForm({
      name: fund.name, ticker: fund.ticker ?? "", category: fund.category,
      currency: fund.currency, target_allocation_pct: fund.target_allocation_pct,
      current_value: fund.current_value, cost_basis: fund.cost_basis,
      conviction: fund.conviction, thesis: fund.thesis ?? "",
      next_buy_zone: fund.next_buy_zone ?? "",
    });
    setShowForm(true);
  }

  function handleSubmit() {
    const now = new Date().toISOString();
    if (editing) {
      store.updateFund({ ...editing, ...form, ticker: form.ticker || undefined, thesis: form.thesis || undefined, next_buy_zone: form.next_buy_zone || undefined, updated_at: now });
    } else {
      store.addFund({ ...form, id: crypto.randomUUID(), ticker: form.ticker || undefined, thesis: form.thesis || undefined, next_buy_zone: form.next_buy_zone || undefined, units: undefined, created_at: now, updated_at: now });
    }
    resetForm();
  }

  const totalValue = store.funds.reduce((s, f) => s + f.current_value, 0);
  const totalCost = store.funds.reduce((s, f) => s + f.cost_basis, 0);

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Funds</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{store.funds.length} positions · Total {formatVND(totalValue)} VND</p>
        </div>
        <div className="flex gap-2">
          {store.funds.length === 0 && (
            <Button variant="secondary" onClick={store.seedSampleData}>Load Sample Data</Button>
          )}
          <Button variant="primary" onClick={() => setShowForm(true)}>+ Add Fund</Button>
        </div>
      </div>

      {showForm && (
        <Card title={editing ? "Edit Fund" : "New Fund"}>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {([
              ["name", "Fund Name", "text"],
              ["ticker", "Ticker (optional)", "text"],
              ["target_allocation_pct", "Target %", "number"],
              ["current_value", "Current Value", "number"],
              ["cost_basis", "Cost Basis", "number"],
              ["next_buy_zone", "Next Buy Zone", "text"],
            ] as [keyof typeof form, string, string][]).map(([key, label, type]) => (
              <div key={key}>
                <label className="block text-xs text-zinc-500 mb-1">{label}</label>
                <input
                  type={type}
                  value={String(form[key])}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as Fund["category"] }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
              >
                {["equity", "bond", "etf", "index", "crypto", "cash", "other"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Conviction</label>
              <select
                value={form.conviction}
                onChange={(e) => setForm((p) => ({ ...p, conviction: e.target.value as Fund["conviction"] }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">Investment Thesis</label>
              <textarea
                value={form.thesis}
                onChange={(e) => setForm((p) => ({ ...p, thesis: e.target.value }))}
                rows={2}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="primary" onClick={handleSubmit}>{editing ? "Update" : "Add Fund"}</Button>
            <Button variant="ghost" onClick={resetForm}>Cancel</Button>
          </div>
        </Card>
      )}

      <Card>
        <Table
          data={store.funds}
          keyExtractor={(f) => f.id}
          emptyMessage="No funds yet. Add a fund or load sample data."
          columns={[
            { key: "name", header: "Fund", render: (f) => (
              <div>
                <div className="font-medium text-zinc-100">{f.name}</div>
                <div className="text-xs text-zinc-500">{f.ticker ?? f.category}</div>
              </div>
            )},
            { key: "current_value", header: "Value", render: (f) => (
              <span className="font-mono">{formatVND(f.current_value)}</span>
            )},
            { key: "gain", header: "Gain", render: (f) => {
              const g = f.current_value - f.cost_basis;
              const pct = f.cost_basis > 0 ? (g / f.cost_basis) * 100 : 0;
              return (
                <span className={g >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {g >= 0 ? "+" : ""}{pct.toFixed(1)}%
                </span>
              );
            }},
            { key: "target_allocation_pct", header: "Target %", render: (f) => `${f.target_allocation_pct}%` },
            { key: "current_pct", header: "Current %", render: (f) => {
              const pct = totalValue > 0 ? (f.current_value / totalValue * 100).toFixed(1) : "0.0";
              return `${pct}%`;
            }},
            { key: "conviction", header: "Conviction", render: (f) => (
              <Badge variant={convictionVariant[f.conviction]}>{f.conviction}</Badge>
            )},
            { key: "actions", header: "", render: (f) => (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(f)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => store.deleteFund(f.id)}>Del</Button>
              </div>
            )},
          ]}
        />
      </Card>
    </div>
  );
}
