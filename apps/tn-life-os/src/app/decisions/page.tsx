"use client";

import { useState } from "react";
import { useDecisionStore, type Decision } from "@/store/useDecisionStore";
import { Card, Badge, Button, Table } from "@tn-os/ui";

const CATEGORIES = ["Investing", "Trading", "Crypto", "Business", "Life", "Tech", "Real Estate", "Other"];
const OS_OPTIONS = ["investment_os", "trading_os", "crypto_os", "stocks_os", "business_os", "wealth_os", "none"];

const riskVariant = { low: "success" as const, medium: "warning" as const, high: "danger" as const };

const EMPTY_FORM: Omit<Decision, "decision_id"> = {
  title: "", category: "Investing", linked_os: "investment_os",
  context: "", options: ["", ""], chosen_option: "", reason: "",
  risk: "medium", date: new Date().toISOString().split("T")[0] ?? "",
  review_date: "", outcome: "",
};

export default function DecisionsPage() {
  const store = useDecisionStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Decision | null>(null);
  const [form, setForm] = useState<Omit<Decision, "decision_id">>(EMPTY_FORM);

  function handleEdit(d: Decision) {
    setEditing(d);
    const { decision_id, ...rest } = d;
    void decision_id;
    setForm(rest);
    setShowForm(true);
  }

  function handleSubmit() {
    if (editing) {
      store.updateDecision({ ...form, decision_id: editing.decision_id, options: form.options.filter(Boolean) });
    } else {
      store.addDecision({ ...form, decision_id: crypto.randomUUID(), options: form.options.filter(Boolean) });
    }
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(false);
  }

  if (!store.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Decision Registry</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{store.decisions.length} decisions tracked</p>
        </div>
        <Button variant="primary" onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}>+ Add Decision</Button>
      </div>

      {showForm && (
        <Card title={editing ? "Edit Decision" : "New Decision"}>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">Title</label>
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500" placeholder="e.g. Buy BTC or wait?" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Linked OS</label>
              <select value={form.linked_os} onChange={(e) => setForm((p) => ({ ...p, linked_os: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500">
                {OS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Risk</label>
              <select value={form.risk} onChange={(e) => setForm((p) => ({ ...p, risk: e.target.value as Decision["risk"] }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Review Date</label>
              <input type="date" value={form.review_date} onChange={(e) => setForm((p) => ({ ...p, review_date: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">Context</label>
              <textarea value={form.context} onChange={(e) => setForm((p) => ({ ...p, context: e.target.value }))} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">Options (one per line)</label>
              <textarea
                value={form.options.join("\n")}
                onChange={(e) => setForm((p) => ({ ...p, options: e.target.value.split("\n") }))}
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Chosen Option</label>
              <input value={form.chosen_option} onChange={(e) => setForm((p) => ({ ...p, chosen_option: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Outcome (filled later)</label>
              <input value={form.outcome} onChange={(e) => setForm((p) => ({ ...p, outcome: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">Reason</label>
              <textarea value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 resize-none" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="primary" onClick={handleSubmit}>{editing ? "Update" : "Add Decision"}</Button>
            <Button variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
          </div>
        </Card>
      )}

      <Card>
        <Table<Decision>
          data={store.decisions}
          keyExtractor={(d) => d.decision_id}
          emptyMessage="No decisions recorded yet."
          columns={[
            { key: "title", header: "Decision", render: (d) => (
              <div>
                <div className="font-medium text-zinc-100">{d.title}</div>
                <div className="text-xs text-zinc-500">{d.context.slice(0, 60)}{d.context.length > 60 ? "…" : ""}</div>
              </div>
            )},
            { key: "category", header: "Category", render: (d) => <Badge variant="neutral">{d.category}</Badge> },
            { key: "risk", header: "Risk", render: (d) => <Badge variant={riskVariant[d.risk]}>{d.risk}</Badge> },
            { key: "chosen_option", header: "Chosen", render: (d) => <span className="text-zinc-300">{d.chosen_option || "—"}</span> },
            { key: "date", header: "Date", render: (d) => <span className="text-zinc-500 text-xs">{d.date}</span> },
            { key: "review_date", header: "Review", render: (d) => <span className="text-zinc-500 text-xs">{d.review_date || "—"}</span> },
            { key: "actions", header: "", render: (d) => (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(d)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => store.deleteDecision(d.decision_id)}>Del</Button>
              </div>
            )},
          ]}
        />
      </Card>
    </div>
  );
}
