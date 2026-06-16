"use client";

import { useInvestmentStore } from "@/store/useInvestmentStore";
import { Card } from "@tn-os/ui";
import { StatWidget } from "@tn-os/ui";
import { Badge } from "@tn-os/ui";
import { Button } from "@tn-os/ui";
import Link from "next/link";

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
}

export default function DashboardPage() {
  const store = useInvestmentStore();

  if (!store.hydrated) {
    return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;
  }

  const totalCost = store.funds.reduce((s, f) => s + f.cost_basis, 0);
  const totalValue = store.funds.reduce((s, f) => s + f.current_value, 0);
  const gainLoss = totalValue - totalCost;
  const gainLossPct = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
  const cashFund = store.funds.find((f) => f.category === "cash");
  const cashWaiting = cashFund?.current_value ?? 0;

  const allocationTotal = store.funds.reduce((s, f) => s + f.target_allocation_pct, 0);

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Investment Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Long-term capital allocation overview</p>
        </div>
        {store.funds.length === 0 && (
          <Button variant="primary" onClick={store.seedSampleData}>
            Load Sample Data
          </Button>
        )}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <StatWidget
            label="Total Value"
            value={formatVND(totalValue)}
            sub={`Cost: ${formatVND(totalCost)}`}
            trend={gainLoss >= 0 ? "up" : "down"}
          />
        </Card>
        <Card>
          <StatWidget
            label="Gain / Loss"
            value={`${gainLoss >= 0 ? "+" : ""}${gainLossPct.toFixed(2)}%`}
            sub={formatVND(gainLoss)}
            trend={gainLoss >= 0 ? "up" : "down"}
          />
        </Card>
        <Card>
          <StatWidget
            label="Funds"
            value={store.funds.length}
            sub={`${allocationTotal}% allocated`}
            trend="neutral"
          />
        </Card>
        <Card>
          <StatWidget
            label="Cash Waiting"
            value={formatVND(cashWaiting)}
            sub="Ready to deploy"
            trend="neutral"
          />
        </Card>
      </div>

      {/* Fund allocation grid */}
      <Card title="Fund Allocation" action={
        <Link href="/funds">
          <Button variant="ghost" size="sm">Manage →</Button>
        </Link>
      }>
        {store.funds.length === 0 ? (
          <p className="text-zinc-600 text-sm py-4">No funds yet. Load sample data or add a fund.</p>
        ) : (
          <div className="space-y-3 mt-2">
            {store.funds.map((fund) => {
              const currentPct = totalValue > 0 ? (fund.current_value / totalValue) * 100 : 0;
              const drift = currentPct - fund.target_allocation_pct;
              return (
                <div key={fund.id} className="flex items-center gap-4">
                  <div className="w-40 shrink-0">
                    <div className="text-sm text-zinc-200 font-medium truncate">{fund.name}</div>
                    <div className="text-xs text-zinc-500">{fund.ticker ?? fund.category}</div>
                  </div>
                  <div className="flex-1">
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${Math.min(currentPct, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-right text-sm text-zinc-300">{currentPct.toFixed(1)}%</div>
                  <div className="w-20 text-right text-xs text-zinc-500">target {fund.target_allocation_pct}%</div>
                  <div className="w-16 text-right">
                    <Badge variant={Math.abs(drift) > 5 ? "warning" : "success"}>
                      {drift >= 0 ? "+" : ""}{drift.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Buy plans & watchlist summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card title="Active Buy Plans" action={
          <Badge variant="info">{store.buy_plans.length}</Badge>
        }>
          {store.buy_plans.length === 0 ? (
            <p className="text-zinc-600 text-sm py-4">No buy plans yet.</p>
          ) : (
            <div className="space-y-2 mt-2">
              {store.buy_plans.map((plan) => {
                const fund = store.funds.find((f) => f.id === plan.fund_id);
                return (
                  <div key={plan.id} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-300">{fund?.name ?? plan.fund_id}</span>
                    <span className="text-zinc-400">{plan.frequency} · {plan.amount.toLocaleString()} {plan.currency}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Watchlist" action={
          <Link href="/watchlist"><Button variant="ghost" size="sm">View →</Button></Link>
        }>
          {store.watchlist.length === 0 ? (
            <p className="text-zinc-600 text-sm py-4">Nothing on watchlist.</p>
          ) : (
            <div className="space-y-2 mt-2">
              {store.watchlist.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300">{item.name}</span>
                  {item.target_price && (
                    <span className="text-zinc-400">
                      target: {item.target_price.toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="flex justify-end">
        <Link href="/export">
          <Button variant="primary">Export Snapshot →</Button>
        </Link>
      </div>
    </div>
  );
}
