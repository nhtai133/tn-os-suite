"use client";

import { useState } from "react";
import { useStocksStore } from "@/store/useStocksStore";
import type { SellRule } from "@/store/useStocksStore";
import { Badge, Button, Card } from "@tn-os/ui";

type FormState = {
  symbol: string;
  trigger: string;
  type: SellRule["type"];
  status: SellRule["status"];
  notes: string;
};

const emptyForm = (): FormState => ({
  symbol: "",
  trigger: "",
  type: "price-target",
  status: "active",
  notes: "",
});

const statusVariant: Record<SellRule["status"], "success" | "warning" | "danger"> = {
  active: "success",
  triggered: "warning",
  cancelled: "danger",
};

export default function SellRulesPage() {
  const store = useStocksStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SellRule | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [filterStatus, setFilterStatus] = useState<SellRule["status"] | "all">("all");

  if (!store.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (rule: SellRule) => {
    setEditing(rule);
    setForm({
      symbol: rule.symbol,
      trigger: rule.trigger,
      type: rule.type,
      status: rule.status,
      notes: rule.notes ?? "",
    });
    setFormOpen(true);
  };

  const set = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      symbol: form.symbol.toUpperCase().trim(),
      trigger: form.trigger.trim(),
      type: form.type,
      status: form.status,
      notes: form.notes.trim() || undefined,
    };

    if (editing) {
      store.updateSellRule({ ...editing, ...payload });
    } else {
      store.addSellRule(payload);
    }

    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm());
  };

  const filtered = filterStatus === "all"
    ? store.sell_rules
    : store.sell_rules.filter((rule) => rule.status === filterStatus);
  const activeRules = store.sell_rules.filter((rule) => rule.status === "active");
  const triggeredRules = store.sell_rules.filter((rule) => rule.status === "triggered");

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sell Rules</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Exit criteria and risk controls for stock positions</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Rule</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Active Rules</div>
          <div className="text-lg font-semibold text-emerald-400">{activeRules.length}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Triggered</div>
          <div className="text-lg font-semibold text-amber-400">{triggeredRules.length}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Total Rules</div>
          <div className="text-lg font-semibold text-white">{store.sell_rules.length}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "active", "triggered", "cancelled"] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === status
                ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                : "text-zinc-500 hover:text-zinc-300 border border-transparent"
            }`}
          >
            {status === "all"
              ? `All (${store.sell_rules.length})`
              : `${status.charAt(0).toUpperCase() + status.slice(1)} (${store.sell_rules.filter((rule) => rule.status === status).length})`}
          </button>
        ))}
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Sell Rule" : "Add Sell Rule"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Symbol *</label>
                <input
                  required
                  value={form.symbol}
                  onChange={(event) => set("symbol", event.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  placeholder="VCB"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Rule Type</label>
                <select
                  value={form.type}
                  onChange={(event) => set("type", event.target.value as SellRule["type"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="price-target">Price target</option>
                  <option value="stop-loss">Stop loss</option>
                  <option value="fundamental">Fundamental</option>
                  <option value="time-based">Time based</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Status</label>
                <select
                  value={form.status}
                  onChange={(event) => set("status", event.target.value as SellRule["status"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="active">Active</option>
                  <option value="triggered">Triggered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
                <input
                  value={form.notes}
                  onChange={(event) => set("notes", event.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  placeholder="Optional"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Trigger *</label>
                <textarea
                  required
                  value={form.trigger}
                  onChange={(event) => set("trigger", event.target.value)}
                  rows={3}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 resize-none"
                  placeholder="Sell 25% if price exceeds target, or exit if thesis is invalidated."
                />
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
        {filtered.length === 0 && (
          <Card title="No Sell Rules">
            <p className="text-zinc-600 text-sm mt-2">No sell rules match this filter.</p>
          </Card>
        )}
        {filtered.map((rule) => (
          <Card
            key={rule.id}
            title={rule.symbol}
            action={
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant[rule.status]}>{rule.status}</Badge>
                <button onClick={() => openEdit(rule)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                <button onClick={() => store.deleteSellRule(rule.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
              </div>
            }
          >
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Badge variant="neutral">{rule.type}</Badge>
              <span>Created {new Date(rule.created_at).toLocaleDateString()}</span>
            </div>
            <p className="mt-3 text-sm text-zinc-200">{rule.trigger}</p>
            {rule.notes && <p className="mt-2 text-sm text-zinc-500">{rule.notes}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
