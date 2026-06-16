"use client";

import { useState } from "react";
import { useBusinessStore } from "@/store/useBusinessStore";
import { Card, Badge, Button } from "@tn-os/ui";

export default function SettingsPage() {
  const b = useBusinessStore();
  const [confirmClear, setConfirmClear] = useState(false);

  if (!b.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const totalRecords =
    b.revenue_streams.length + b.clients.length + b.ib_accounts.length +
    b.partners.length + b.content_assets.length + b.calendar_items.length +
    b.campaigns.length + b.tasks.length + b.expenses.length + b.monthly_pnl.length;

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your Business OS data</p>
      </div>

      <Card title="Data Overview">
        <div className="mt-3 space-y-2 text-sm">
          {[
            ["Revenue Streams", b.revenue_streams.length],
            ["Clients", b.clients.length],
            ["IB Accounts", b.ib_accounts.length],
            ["Partners", b.partners.length],
            ["Content Assets", b.content_assets.length],
            ["Calendar Items", b.calendar_items.length],
            ["Campaigns", b.campaigns.length],
            ["Tasks", b.tasks.length],
            ["Expenses", b.expenses.length],
            ["Monthly P&L Records", b.monthly_pnl.length],
          ].map(([label, count]) => (
            <div key={String(label)} className="flex justify-between py-1 border-b border-zinc-800/60 last:border-0">
              <span className="text-zinc-400">{label}</span>
              <Badge variant={Number(count) > 0 ? "success" : "neutral"}>{count} records</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Sample Data">
        <div className="mt-3 space-y-3">
          <p className="text-sm text-zinc-400">
            Load realistic TNPA business data — Forex IB, Crypto IB, TikTok, Telegram, Zalo, Affiliate channels.
          </p>
          <Button variant="primary" onClick={b.seedSampleData}>
            Load Sample Data
          </Button>
        </div>
      </Card>

      <Card title="Danger Zone">
        <div className="mt-3 space-y-3">
          <p className="text-sm text-zinc-400">
            This will permanently delete all {totalRecords} records from local storage.
          </p>
          {!confirmClear ? (
            <Button variant="ghost" onClick={() => setConfirmClear(true)}>
              Clear All Data
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-red-400">Are you sure? This cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { b.clearAllData(); setConfirmClear(false); }}
                  className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/30 transition-colors"
                >
                  Yes, Delete Everything
                </button>
                <Button variant="ghost" onClick={() => setConfirmClear(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card title="App Info">
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-zinc-500">App</span><span className="text-zinc-200">Business OS</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Version</span><span className="text-zinc-200">0.1.0</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Port</span><span className="text-zinc-200">3004</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Storage</span><span className="text-zinc-200">localStorage (business_os_data)</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Snapshot Format</span><code className="text-violet-400">.tnos.json v1.0.0</code></div>
        </div>
      </Card>
    </div>
  );
}
