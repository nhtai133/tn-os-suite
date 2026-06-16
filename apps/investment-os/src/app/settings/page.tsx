"use client";

import { useInvestmentStore } from "@/store/useInvestmentStore";
import { Card, Button } from "@tn-os/ui";

export default function SettingsPage() {
  const store = useInvestmentStore();

  function handleClear() {
    if (confirm("Clear all Investment OS data? This cannot be undone.")) {
      localStorage.removeItem("investment_os_data");
      window.location.reload();
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Investment OS configuration</p>
      </div>

      <Card title="Data Management">
        <div className="space-y-4 mt-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-zinc-200">Storage</div>
              <div className="text-xs text-zinc-500">localStorage · local-first · no server</div>
            </div>
            <span className="text-xs text-zinc-600">Browser</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-zinc-200">Records</div>
              <div className="text-xs text-zinc-500">{store.funds.length} funds, {store.buy_plans.length} buy plans, {store.watchlist.length} watchlist</div>
            </div>
          </div>
          <div className="border-t border-zinc-800 pt-4 flex gap-3">
            <Button variant="secondary" onClick={store.seedSampleData}>Load Sample Data</Button>
            <Button variant="danger" onClick={handleClear}>Clear All Data</Button>
          </div>
        </div>
      </Card>

      <Card title="App Info">
        <div className="space-y-2 mt-2 text-sm text-zinc-400">
          <div className="flex justify-between"><span>App</span><span className="text-zinc-200">Investment OS</span></div>
          <div className="flex justify-between"><span>Version</span><span className="text-zinc-200">0.1.0</span></div>
          <div className="flex justify-between"><span>Schema</span><span className="text-zinc-200">1.0.0</span></div>
          <div className="flex justify-between"><span>OS Type</span><span className="text-zinc-200">investment_os</span></div>
          <div className="flex justify-between"><span>Suite</span><span className="text-zinc-200">TN OS Suite</span></div>
        </div>
      </Card>
    </div>
  );
}
