"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useWealthStore } from "@/store/useWealthStore";
import { buildSnapshot, downloadSnapshot, snapshotToJSON } from "@tn-os/sync";
import { Card, Button, Badge } from "@tn-os/ui";
import type { WealthOSSummary } from "@tn-os/schemas";

function buildWealthSnapshot(w: ReturnType<typeof useWealthStore>) {
  const risks: string[] = [];

  if (w.emergencyMonths < w.emergency_fund.target_months) {
    risks.push(`Emergency fund only covers ${w.emergencyMonths.toFixed(1)} months (target: ${w.emergency_fund.target_months})`);
  }
  if (w.totalLiabilities > 0 && w.totalAssets > 0 && w.totalLiabilities / w.totalAssets > 0.5) {
    risks.push(`High debt-to-asset ratio: ${((w.totalLiabilities / w.totalAssets) * 100).toFixed(1)}%`);
  }
  w.upcomingMaturities.forEach((m) => risks.push(`Upcoming maturity: ${m}`));

  const summary: WealthOSSummary = {
    total_net_worth: w.netWorth,
    total_assets: w.totalAssets,
    total_liabilities: w.totalLiabilities,
    cash_balance: w.totalBankBalance,
    total_real_estate_value: w.totalRealEstateValue,
    total_vehicle_value: w.totalVehicleValue,
    emergency_fund_months: w.emergencyMonths,
    emergency_fund_target_months: w.emergency_fund.target_months,
    bank_account_count: w.bank_accounts.length,
    real_estate_count: w.real_estate.length,
    vehicle_count: w.vehicles.length,
    liability_count: w.liabilities.length,
    family_support_count: w.family_support.length,
    monthly_family_support: w.monthlyFamilySupport,
    monthly_debt_payments: w.monthlyDebtPayments,
    upcoming_maturities: w.upcomingMaturities,
    currency: "VND",
  };

  return buildSnapshot({
    osType: "wealth_os",
    owner: "nhtai133",
    summary: summary as unknown as Record<string, unknown>,
    entities: {
      bank_accounts: w.bank_accounts,
      real_estate: w.real_estate,
      vehicles: w.vehicles,
      liabilities: w.liabilities,
      family_support: w.family_support,
    },
    metrics: {
      net_worth: w.netWorth,
      total_assets: w.totalAssets,
      total_liabilities: w.totalLiabilities,
      debt_to_asset_ratio: w.totalAssets > 0 ? (w.totalLiabilities / w.totalAssets) * 100 : 0,
      emergency_fund_coverage_months: w.emergencyMonths,
      monthly_obligations: w.monthlyDebtPayments + w.monthlyFamilySupport,
    },
    risks,
    aiContext: {
      wealth_summary: `Net worth ${w.netWorth.toLocaleString()} VND across ${w.bank_accounts.length} bank accounts, ${w.real_estate.length} properties, ${w.vehicles.length} vehicles`,
      debt_summary: `${w.liabilities.length} liabilities totalling ${w.totalLiabilities.toLocaleString()} VND, monthly payments ${w.monthlyDebtPayments.toLocaleString()} VND`,
      emergency_fund: `${w.emergencyMonths.toFixed(1)} months covered (target: ${w.emergency_fund.target_months})`,
      family_obligations: `${w.family_support.length} family support items, ${w.monthlyFamilySupport.toLocaleString()} VND/month`,
    },
  });
}

type Status = { type: "idle" } | { type: "success" } | { type: "error"; message: string };

export default function ExportPage() {
  const w = useWealthStore();
  const wRef = useRef(w);
  wRef.current = w;
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!w.hydrated) return;
    if (window.parent !== window) window.parent.postMessage({ type: "TNOS_READY" }, "*");
  }, [w.hydrated]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if ((event.data as { type?: string }).type !== "TNOS_SNAPSHOT_REQUEST") return;
      try {
        const snapshot = buildWealthSnapshot(wRef.current);
        (event.source as Window | null)?.postMessage(
          { type: "TNOS_SNAPSHOT_RESPONSE", payload: JSON.stringify(snapshot) },
          event.origin
        );
      } catch {
        (event.source as Window | null)?.postMessage(
          { type: "TNOS_SNAPSHOT_RESPONSE", payload: null },
          event.origin
        );
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handlePreview = useCallback(() => {
    try {
      const snap = buildWealthSnapshot(w);
      setPreview(snapshotToJSON(snap));
      setStatus({ type: "success" });
    } catch (err) {
      setStatus({ type: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  }, [w]);

  const handleDownload = useCallback(() => {
    try {
      const snap = buildWealthSnapshot(w);
      downloadSnapshot(snap);
      setStatus({ type: "success" });
    } catch (err) {
      setStatus({ type: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  }, [w]);

  if (!w.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const hasData = w.bank_accounts.length > 0 || w.real_estate.length > 0;

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Export Snapshot</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Generate a <code className="text-emerald-400">.tnos.json</code> file to import into TN Life OS
        </p>
      </div>

      {status.type === "success" && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
          ✓ Snapshot built successfully — import into TN Life OS to see your wealth data.
        </div>
      )}
      {status.type === "error" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          ✗ Error: {status.message}
        </div>
      )}

      {!hasData && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
          ⚠ No data loaded yet. Load sample data from Settings or add your own assets first.
        </div>
      )}

      {/* Data inventory */}
      <Card title="Data Inventory">
        <div className="mt-3 space-y-2">
          {[
            ["Bank Accounts", w.bank_accounts.length],
            ["Real Estate", w.real_estate.length],
            ["Vehicles", w.vehicles.length],
            ["Liabilities", w.liabilities.length],
            ["Family Support", w.family_support.length],
            ["Net Worth Snapshots", w.net_worth_snapshots.length],
          ].map(([label, count]) => (
            <div key={String(label)} className="flex items-center justify-between py-1.5 border-b border-zinc-800/60 last:border-0">
              <span className="text-sm text-zinc-400">{label}</span>
              <Badge variant={Number(count) > 0 ? "success" : "neutral"}>{count} records</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Summary preview */}
      <Card title="Computed Summary">
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {[
            ["Net Worth", `${(w.netWorth / 1_000_000_000).toFixed(2)}B VND`],
            ["Total Assets", `${(w.totalAssets / 1_000_000_000).toFixed(2)}B VND`],
            ["Total Liabilities", `${(w.totalLiabilities / 1_000_000_000).toFixed(2)}B VND`],
            ["Cash Balance", `${(w.totalBankBalance / 1_000_000).toFixed(0)}M VND`],
            ["Emergency Fund", `${w.emergencyMonths.toFixed(1)} months`],
            ["Monthly Obligations", `${((w.monthlyDebtPayments + w.monthlyFamilySupport) / 1_000_000).toFixed(1)}M VND`],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex justify-between">
              <span className="text-zinc-500">{label}</span>
              <span className="text-zinc-200 font-medium">{value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Exported fields list */}
      <Card title="Exported Summary Fields">
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-zinc-500">
          {[
            "total_net_worth", "total_assets", "total_liabilities",
            "cash_balance", "total_real_estate_value", "total_vehicle_value",
            "emergency_fund_months", "emergency_fund_target_months",
            "bank_account_count", "real_estate_count", "vehicle_count",
            "liability_count", "family_support_count",
            "monthly_family_support", "monthly_debt_payments",
            "upcoming_maturities", "currency",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 py-0.5">
              <span className="text-emerald-600">✓</span>
              <code className="text-zinc-400">{f}</code>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handlePreview}
          className="px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          Preview JSON
        </button>
        <button
          onClick={handleDownload}
          disabled={!hasData}
          className="px-4 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-sm text-emerald-300 hover:bg-emerald-500/20 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Download .tnos.json
        </button>
      </div>

      {preview && (
        <Card title="JSON Preview">
          <pre className="mt-3 text-xs text-zinc-400 overflow-auto max-h-96 font-mono leading-relaxed">{preview}</pre>
        </Card>
      )}

      <Card title="How to sync with TN Life OS">
        <ol className="mt-3 space-y-2 text-sm text-zinc-400 list-decimal list-inside">
          <li>Click <strong className="text-zinc-200">Download .tnos.json</strong> above.</li>
          <li>Open <strong className="text-zinc-200">TN Life OS</strong> on port 3000.</li>
          <li>Go to <strong className="text-zinc-200">Import Snapshots</strong>.</li>
          <li>Drop the downloaded file or click Browse.</li>
          <li>The CEO Dashboard Wealth widget will populate.</li>
        </ol>
      </Card>
    </div>
  );
}
