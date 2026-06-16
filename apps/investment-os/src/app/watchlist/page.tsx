"use client";

import { useState } from "react";
import { useInvestmentStore } from "@/store/useInvestmentStore";
import { Card, Badge, Button, Table } from "@tn-os/ui";
import type { WatchlistItem } from "@tn-os/schemas";

export default function WatchlistPage() {
  const store = useInvestmentStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", ticker: "", category: "equity", target_price: "", current_price: "", note: "" });

  function handleAdd() {
    const now = new Date().toISOString();
    store.addWatchlistItem({
      id: crypto.randomUUID(),
      name: form.name,
      ticker: form.ticker || undefined,
      category: form.category,
      target_price: form.target_price ? parseFloat(form.target_price) : undefined,
      current_price: form.current_price ? parseFloat(form.current_price) : undefined,
      note: form.note || undefined,
      added_at: now,
    });
    setForm({ name: "", ticker: "", category: "equity", target_price: "", current_price: "", note: "" });
    setShowForm(false);
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Watchlist</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{store.watchlist.length} items being monitored</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>+ Add Item</Button>
      </div>

      {showForm && (
        <Card title="Add to Watchlist">
          <div className="grid grid-cols-2 gap-4 mt-2">
            {([["name","Name","text"],["ticker","Ticker","text"],["category","Category","text"],["target_price","Target Price","number"],["current_price","Current Price","number"]] as [string,string,string][]).map(([k,l,t]) => (
              <div key={k}>
                <label className="block text-xs text-zinc-500 mb-1">{l}</label>
                <input type={t} value={(form as Record<string,string>)[k]} onChange={(e) => setForm((p) => ({...p,[k]:e.target.value}))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500" />
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">Note</label>
              <input type="text" value={form.note} onChange={(e) => setForm((p) => ({...p,note:e.target.value}))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="primary" onClick={handleAdd}>Add</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <Card>
        <Table<WatchlistItem>
          data={store.watchlist}
          keyExtractor={(w) => w.id}
          emptyMessage="Watchlist is empty."
          columns={[
            { key: "name", header: "Name", render: (w) => (
              <div>
                <div className="font-medium text-zinc-100">{w.name}</div>
                {w.ticker && <div className="text-xs text-zinc-500">{w.ticker}</div>}
              </div>
            )},
            { key: "category", header: "Type", render: (w) => <Badge variant="neutral">{w.category}</Badge> },
            { key: "current_price", header: "Current", render: (w) => w.current_price?.toLocaleString() ?? "—" },
            { key: "target_price", header: "Target", render: (w) => w.target_price ? <span className="text-emerald-400">{w.target_price.toLocaleString()}</span> : "—" },
            { key: "note", header: "Note", render: (w) => <span className="text-zinc-500 text-xs">{w.note ?? "—"}</span> },
            { key: "remove", header: "", render: (w) => (
              <Button variant="danger" size="sm" onClick={() => store.removeWatchlistItem(w.id)}>Remove</Button>
            )},
          ]}
        />
      </Card>
    </div>
  );
}
