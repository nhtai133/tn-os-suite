"use client";

import { useState } from "react";
import { useWealthStore } from "@/store/useWealthStore";
import { Card, Button, Badge } from "@tn-os/ui";

export default function SettingsPage() {
  const w = useWealthStore();
  const [confirmClear, setConfirmClear] = useState(false);

  if (!w.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const totalRecords =
    w.bank_accounts.length + w.real_estate.length + w.vehicles.length +
    w.liabilities.length + w.family_support.length + w.net_worth_snapshots.length;

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your Wealth OS data</p>
      </div>

      <Card title="Data Overview">
        <div className="mt-3 space-y-2 text-sm">
          {[
            ["Bank Accounts", w.bank_accounts.length],
            ["Real Estate", w.real_estate.length],
            ["Vehicles", w.vehicles.length],
            ["Liabilities", w.liabilities.length],
            ["Family Support", w.family_support.length],
            ["Net Worth Snapshots", w.net_worth_snapshots.length],
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
            Load sample Vietnamese wealth data to explore all features.
          </p>
          <Button variant="primary" onClick={w.seedSampleData}>
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
                  onClick={() => { w.clearAllData(); setConfirmClear(false); }}
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
          <div className="flex justify-between"><span className="text-zinc-500">App</span><span className="text-zinc-200">Wealth OS</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Version</span><span className="text-zinc-200">0.1.0</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Port</span><span className="text-zinc-200">3003</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Storage</span><span className="text-zinc-200">localStorage (wealth_os_data)</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Snapshot Format</span><code className="text-blue-400">.tnos.json v1.0.0</code></div>
        </div>
      </Card>
    </div>
  );
}
