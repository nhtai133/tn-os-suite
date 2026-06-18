"use client";

import { useDividendStore } from "@/store/useDividendStore";
import { STOCK_PORTFOLIOS } from "@/lib/portfolio-registry";
import { IncomeCard } from "@/components/income/IncomeCard";
import { IncomeTable } from "@/components/income/IncomeTable";
import { IncomeProjectionChart } from "@/components/income/IncomeProjectionChart";
import { IncomePortfolioTable } from "@/components/income/IncomePortfolioTable";
import { BrokerIncomeTable } from "@/components/income/BrokerIncomeTable";

const VND_TO_USD = 25_000;

function toUSD(amount: number, currency: "VND" | "USD") {
  return currency === "VND" ? amount / VND_TO_USD : amount;
}

const USD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

export default function IncomePage() {
  const store = useDividendStore();

  if (!store.hydrated) {
    return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;
  }

  const { events } = store;

  const received = events.filter((e) => e.status === "received");

  // Time buckets
  const now = new Date();
  const currentYear = now.getFullYear();
  const prevYear = currentYear - 1;

  const thisYearEvents = received.filter((e) => e.exDate.startsWith(String(currentYear)));
  const prevYearEvents = received.filter((e) => e.exDate.startsWith(String(prevYear)));

  const annualUSD = thisYearEvents.reduce((sum, e) => sum + toUSD(e.netAmount, e.currency), 0);
  const prevAnnualUSD = prevYearEvents.reduce((sum, e) => sum + toUSD(e.netAmount, e.currency), 0);

  const monthlyAvgUSD = annualUSD / 12;
  const quarterlyAvgUSD = annualUSD / 4;

  // Run rate: last 12 months from today
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
  const runRateUSD = received
    .filter((e) => new Date(e.exDate) >= twelveMonthsAgo)
    .reduce((sum, e) => sum + toUSD(e.netAmount, e.currency), 0);

  const yoyChange =
    prevAnnualUSD > 0
      ? ((annualUSD - prevAnnualUSD) / prevAnnualUSD) * 100
      : null;

  // Per-portfolio income
  const portfolioRows = STOCK_PORTFOLIOS.map((p) => {
    const portEvents = received.filter((e) => e.portfolioId === p.id);
    const annual = portEvents.reduce((sum, e) => sum + toUSD(e.netAmount, e.currency), 0);
    return {
      portfolioId: p.id,
      portfolioName: p.name,
      annualIncome: annual,
      currency: "USD" as const,
      eventCount: portEvents.length,
    };
  }).filter((r) => r.annualIncome > 0);

  // Broker income
  const brokerMap: Record<string, number> = {};
  let brokerTotal = 0;
  for (const e of received) {
    const broker = e.broker ?? "Unknown";
    const usd = toUSD(e.netAmount, e.currency);
    brokerMap[broker] = (brokerMap[broker] ?? 0) + usd;
    brokerTotal += usd;
  }
  const brokerRows = Object.entries(brokerMap)
    .sort((a, b) => b[1] - a[1])
    .map(([broker, annual]) => ({
      broker,
      annualIncome: annual,
      currency: "USD" as const,
      eventCount: received.filter((e) => (e.broker ?? "Unknown") === broker).length,
      pct: brokerTotal > 0 ? (annual / brokerTotal) * 100 : 0,
    }));

  // Monthly breakdown (last 12 months)
  const monthLabels: string[] = [];
  const monthValues: number[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthLabels.push(ym);
    const total = received
      .filter((e) => e.exDate.startsWith(ym))
      .reduce((sum, e) => sum + toUSD(e.netAmount, e.currency), 0);
    monthValues.push(total);
  }

  const monthlyTableRows = monthLabels.map((label, i) => ({
    label,
    monthly: monthValues[i] ?? 0,
    quarterly: (monthValues[i] ?? 0) * 3,
    annual: (monthValues[i] ?? 0) * 12,
    currency: "USD" as const,
  })).filter((r) => r.monthly > 0);

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Income Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Dividend income analytics and projections</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <IncomeCard
          label="Annual Income (YTD)"
          value={USD(annualUSD)}
          sub={`${currentYear} calendar year`}
          valueColor="text-emerald-400"
        />
        <IncomeCard
          label="Monthly Average"
          value={USD(monthlyAvgUSD)}
          sub="Based on YTD"
        />
        <IncomeCard
          label="Quarterly Average"
          value={USD(quarterlyAvgUSD)}
          sub="Based on YTD"
        />
        <IncomeCard
          label="Run Rate (12M)"
          value={USD(runRateUSD)}
          sub="Last 12 months"
          valueColor="text-sky-400"
        />
        <IncomeCard
          label="YoY Change"
          value={yoyChange != null ? `${yoyChange >= 0 ? "+" : ""}${yoyChange.toFixed(1)}%` : "—"}
          sub={`vs ${prevYear}`}
          valueColor={yoyChange == null ? "text-zinc-400" : yoyChange >= 0 ? "text-emerald-400" : "text-red-400"}
        />
        <IncomeCard
          label="Total Events"
          value={String(received.length)}
          sub="Received dividends"
        />
      </div>

      {/* Projection Chart */}
      <div>
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Income Projection</div>
        <IncomeProjectionChart annualIncome={runRateUSD > 0 ? runRateUSD : annualUSD} />
      </div>

      {/* Monthly Breakdown */}
      {monthlyTableRows.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Monthly Breakdown</div>
          <IncomeTable rows={monthlyTableRows} title="Income by Month (Last 12M)" />
        </div>
      )}

      {/* By Portfolio */}
      <div>
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Income by Portfolio</div>
        <IncomePortfolioTable rows={portfolioRows} />
      </div>

      {/* By Broker */}
      <div>
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Income by Broker</div>
        <BrokerIncomeTable rows={brokerRows} />
      </div>
    </div>
  );
}
