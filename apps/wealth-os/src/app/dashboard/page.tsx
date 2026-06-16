"use client";

import Link from "next/link";
import { useWealthStore } from "@/store/useWealthStore";
import { Card, StatWidget, Badge, Button } from "@tn-os/ui";

function fmtB(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  return n.toLocaleString();
}

export default function DashboardPage() {
  const w = useWealthStore();

  if (!w.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const hasData = w.bank_accounts.length > 0 || w.real_estate.length > 0;
  const efMonthsTarget = w.emergency_fund.target_months;
  const efCoverage = efMonthsTarget > 0 ? Math.min((w.emergencyMonths / efMonthsTarget) * 100, 100) : 0;
  const monthlyObligations = w.monthlyDebtPayments + w.monthlyFamilySupport;

  return (
    <div className="p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Wealth Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Net worth, assets, and liabilities overview</p>
        </div>
        {!hasData && (
          <Button variant="primary" onClick={w.seedSampleData}>Load Sample Data</Button>
        )}
      </div>

      {/* Net worth hero */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
        <div className="text-sm text-emerald-400/70 uppercase tracking-widest mb-1">Total Net Worth (VND)</div>
        <div className={`text-4xl font-bold ${w.netWorth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {fmtB(w.netWorth)}
        </div>
        <div className="mt-3 flex gap-6 text-sm">
          <div><span className="text-zinc-500">Assets</span> <span className="text-white font-medium ml-2">{fmtB(w.totalAssets)}</span></div>
          <div><span className="text-zinc-500">Liabilities</span> <span className="text-red-400 font-medium ml-2">-{fmtB(w.totalLiabilities)}</span></div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatWidget label="Cash & Bank" value={fmtB(w.totalBankBalance)} trend="neutral" />
        <StatWidget label="Real Estate" value={fmtB(w.totalRealEstateValue)} trend="up" />
        <StatWidget label="Vehicles" value={fmtB(w.totalVehicleValue)} trend="neutral" />
        <StatWidget label="Monthly Obligations" value={fmtB(monthlyObligations)} trend="down" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Emergency Fund */}
        <Card title="Emergency Fund">
          <div className="space-y-3 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Coverage</span>
              <span className={`font-medium ${w.emergencyMonths >= efMonthsTarget ? "text-emerald-400" : "text-amber-400"}`}>
                {w.emergencyMonths.toFixed(1)} / {efMonthsTarget} months
              </span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${w.emergencyMonths >= efMonthsTarget ? "bg-emerald-500" : "bg-amber-500"}`}
                style={{ width: `${efCoverage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Current: {fmtB(w.emergency_fund.current_amount)}</span>
              <span>Target: {fmtB(w.emergency_fund.monthly_expenses * efMonthsTarget)}</span>
            </div>
            {w.emergencyMonths < efMonthsTarget && (
              <Badge variant="warning">Below {efMonthsTarget}-month target</Badge>
            )}
            {w.emergencyMonths >= efMonthsTarget && (
              <Badge variant="success">Fully funded</Badge>
            )}
          </div>
        </Card>

        {/* Bank Accounts */}
        <Card
          title="Bank Accounts"
          action={<span className="text-xs text-zinc-500">{w.bank_accounts.length} accounts</span>}
        >
          <div className="mt-2 space-y-2">
            {w.bank_accounts.slice(0, 4).map((a) => (
              <div key={a.id} className="flex justify-between text-sm">
                <div>
                  <div className="text-zinc-200">{a.name}</div>
                  <div className="text-xs text-zinc-600">{a.bank} · {a.type}</div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-medium">{fmtB(a.balance)}</div>
                  {a.interest_rate && <div className="text-xs text-zinc-500">{a.interest_rate}%</div>}
                </div>
              </div>
            ))}
            {w.bank_accounts.length === 0 && <p className="text-zinc-600 text-sm">No accounts added.</p>}
            {w.bank_accounts.length > 4 && <div className="text-xs text-zinc-600">+{w.bank_accounts.length - 4} more</div>}
            <div className="border-t border-zinc-800 pt-2 flex justify-between text-sm">
              <span className="text-zinc-500">Total</span>
              <span className="text-white font-medium">{fmtB(w.totalBankBalance)}</span>
            </div>
          </div>
        </Card>

        {/* Real Estate */}
        <Card
          title="Real Estate"
          action={<span className="text-xs text-zinc-500">{w.real_estate.length} properties</span>}
        >
          <div className="mt-2 space-y-2">
            {w.real_estate.slice(0, 3).map((r) => (
              <div key={r.id} className="flex justify-between text-sm">
                <div>
                  <div className="text-zinc-200">{r.name}</div>
                  <div className="text-xs text-zinc-600">{r.type}{r.monthly_rent ? ` · ${fmtB(r.monthly_rent)}/mo rent` : ""}</div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-medium">{fmtB(r.current_value)}</div>
                  {r.purchase_price > 0 && (
                    <div className={`text-xs ${r.current_value >= r.purchase_price ? "text-emerald-600" : "text-red-600"}`}>
                      {r.current_value >= r.purchase_price ? "+" : ""}{(((r.current_value - r.purchase_price) / r.purchase_price) * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
            {w.real_estate.length === 0 && <p className="text-zinc-600 text-sm">No properties added.</p>}
            <div className="border-t border-zinc-800 pt-2 flex justify-between text-sm">
              <span className="text-zinc-500">Total Value</span>
              <span className="text-white font-medium">{fmtB(w.totalRealEstateValue)}</span>
            </div>
          </div>
        </Card>

        {/* Liabilities */}
        <Card
          title="Liabilities"
          action={<span className="text-xs text-zinc-500">{w.liabilities.length} debts</span>}
        >
          <div className="mt-2 space-y-2">
            {w.liabilities.slice(0, 4).map((l) => (
              <div key={l.id} className="flex justify-between text-sm">
                <div>
                  <div className="text-zinc-200">{l.label}</div>
                  <div className="text-xs text-zinc-600">{l.creditor} · {l.interest_rate ?? 0}%</div>
                </div>
                <div className="text-right">
                  <div className="text-red-400 font-medium">{fmtB(l.principal)}</div>
                  {l.monthly_payment && <div className="text-xs text-zinc-500">{fmtB(l.monthly_payment)}/mo</div>}
                </div>
              </div>
            ))}
            {w.liabilities.length === 0 && <p className="text-zinc-600 text-sm">No liabilities added.</p>}
            <div className="border-t border-zinc-800 pt-2 flex justify-between text-sm">
              <span className="text-zinc-500">Total Debt</span>
              <span className="text-red-400 font-medium">{fmtB(w.totalLiabilities)}</span>
            </div>
          </div>
        </Card>

        {/* Family Support */}
        <Card
          title="Family Support"
          action={<span className="text-xs text-zinc-500">{w.family_support.length} items</span>}
        >
          <div className="mt-2 space-y-2">
            {w.family_support.map((f) => (
              <div key={f.id} className="flex justify-between text-sm">
                <div>
                  <div className="text-zinc-200">{f.recipient}</div>
                  <div className="text-xs text-zinc-600">{f.label}</div>
                </div>
                <div className="text-amber-400 font-medium">{fmtB(f.amount_per_month)}/mo</div>
              </div>
            ))}
            {w.family_support.length === 0 && <p className="text-zinc-600 text-sm">No family support items.</p>}
            {w.family_support.length > 0 && (
              <div className="border-t border-zinc-800 pt-2 flex justify-between text-sm">
                <span className="text-zinc-500">Monthly Total</span>
                <span className="text-amber-400 font-medium">{fmtB(w.monthlyFamilySupport)}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming Maturities */}
        <Card title="Upcoming Maturities">
          <div className="mt-2 space-y-2">
            {w.upcomingMaturities.length === 0 && (
              <p className="text-zinc-600 text-sm">No upcoming term deposit maturities.</p>
            )}
            {w.upcomingMaturities.map((m, i) => (
              <div key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">◆</span>
                <span>{m}</span>
              </div>
            ))}
            {w.liabilities.filter((l) => l.due_date).slice(0, 2).map((l) => (
              <div key={l.id} className="text-sm text-zinc-300 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">◆</span>
                <span>{l.label} due {l.due_date}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/bank-accounts", label: "Bank Accounts", count: w.bank_accounts.length },
          { href: "/real-estate", label: "Real Estate", count: w.real_estate.length },
          { href: "/liabilities", label: "Liabilities", count: w.liabilities.length },
          { href: "/net-worth", label: "NW History", count: w.net_worth_snapshots.length },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors"
          >
            <div className="text-xs text-zinc-500 mb-1">{item.label}</div>
            <div className="text-lg font-semibold text-white">{item.count}</div>
            <div className="text-xs text-zinc-600">records</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
