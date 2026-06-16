"use client";

import { useStocksStore } from "@/store/useStocksStore";
import { Button, Card } from "@tn-os/ui";

export default function SettingsPage() {
  const store = useStocksStore();

  if (!store.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const handleClear = () => {
    if (confirm("Clear all Stocks OS data? This cannot be undone.")) {
      store.clearAllData();
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Local Stocks OS data controls</p>
      </div>

      <Card title="Local Data">
        <div className="space-y-3 text-sm text-zinc-400">
          <div className="flex justify-between">
            <span>Storage key</span>
            <code className="text-sky-400">stocks_os_data</code>
          </div>
          <div className="flex justify-between">
            <span>OS type</span>
            <code className="text-sky-400">stocks_os</code>
          </div>
          <div className="flex justify-between">
            <span>Records</span>
            <span className="text-zinc-200">
              {store.holdings.length + store.watchlist.length + store.dividends.length + store.valuation_notes.length + store.targets.length + store.theses.length + store.buy_zones.length + store.sell_rules.length}
            </span>
          </div>
        </div>
      </Card>

      <Card title="Data Actions">
        <div className="flex gap-3">
          <Button variant="secondary" onClick={store.seedSampleData}>Load Sample Data</Button>
          <Button variant="danger" onClick={handleClear}>Clear Local Data</Button>
        </div>
      </Card>
    </div>
  );
}
