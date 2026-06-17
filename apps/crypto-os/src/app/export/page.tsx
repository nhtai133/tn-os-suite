"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useCryptoStore } from "@/store/useCryptoStore";
import { buildSnapshot, downloadSnapshot, snapshotToJSON } from "@tn-os/sync";
import { Card, Button, Badge } from "@tn-os/ui";
import { CryptoOSSummarySchema, type CryptoOSSummary } from "@tn-os/schemas";

type CryptoStore = ReturnType<typeof useCryptoStore>;

function buildCryptoSnapshot(store: CryptoStore) {
  const topHoldings = [...store.holdings]
    .sort((a, b) => b.amount * b.current_price - a.amount * a.current_price)
    .slice(0, 5)
    .map((h) => h.symbol);

  const cryptoRiskNotes: string[] = [];
  if (store.exchangeRisk === "high") cryptoRiskNotes.push("High exchange counterparty risk detected");
  if (store.securityScore < 80) cryptoRiskNotes.push(`Security checklist is ${store.securityScore}% complete — review open items`);
  store.exchanges
    .filter((e) => e.status === "active" && e.risk_level === "high")
    .forEach((e) => cryptoRiskNotes.push(`${e.name} is marked high risk`));

  const nextActions: string[] = [];
  if (store.btcAmount < store.target_btc_amount) {
    nextActions.push(`Accumulate BTC: ${store.btcAmount.toFixed(4)} / ${store.target_btc_amount} (${store.targetBTCProgressPct.toFixed(0)}%)`);
  }
  store.theses
    .filter((t) => t.status === "active" && t.conviction >= 8)
    .slice(0, 2)
    .forEach((t) => nextActions.push(`Monitor ${t.symbol}: ${t.title}`));
  if (store.securityScore < 100) nextActions.push("Complete security checklist items");

  const summary: CryptoOSSummary = {
    total_crypto_value_usd: store.totalCryptoValueUSD,
    btc_amount: store.btcAmount,
    eth_amount: store.ethAmount,
    stablecoin_balance_usd: store.stablecoinBalanceUSD,
    wallet_count: store.wallets.length,
    exchange_count: store.exchanges.filter((e) => e.status === "active").length,
    holding_count: store.holdings.length,
    defi_exposure_usd: store.defiExposureUSD,
    cold_wallet_value_usd: store.coldWalletValueUSD,
    exchange_risk: store.exchangeRisk,
    wallet_security_score: store.securityScore,
    target_btc_amount: store.target_btc_amount,
    target_btc_progress_pct: store.targetBTCProgressPct,
    top_holdings: topHoldings,
    crypto_risk_notes: cryptoRiskNotes,
    next_actions: nextActions,
    currency: "USD",
  };

  CryptoOSSummarySchema.parse(summary);

  return buildSnapshot({
    osType: "crypto_os",
    owner: "nhtai133",
    summary: summary as unknown as Record<string, unknown>,
    entities: {
      holdings: store.holdings,
      wallets: store.wallets,
      exchanges: store.exchanges,
      stablecoins: store.stablecoins,
      defi_positions: store.defi_positions,
      theses: store.theses,
    },
    metrics: {
      total_crypto_value_usd: store.totalCryptoValueUSD,
      btc_amount: store.btcAmount,
      eth_amount: store.ethAmount,
      defi_exposure_usd: store.defiExposureUSD,
      cold_wallet_value_usd: store.coldWalletValueUSD,
      wallet_security_score: store.securityScore,
    },
    risks: cryptoRiskNotes,
    aiContext: {
      portfolio_summary: `${store.holdings.length} holdings worth $${store.totalCryptoValueUSD.toFixed(0)}, ${store.defi_positions.filter((p) => p.status === "active").length} active DeFi positions`,
      btc_target: `${store.btcAmount.toFixed(4)} BTC (${store.targetBTCProgressPct.toFixed(0)}% of ${store.target_btc_amount} target)`,
      security: `${store.securityScore}% security score, ${store.exchangeRisk} exchange risk`,
      top_holdings: topHoldings.join(", "),
    },
  });
}

type ExportStatus = { type: "idle" } | { type: "success" } | { type: "error"; message: string };

export default function ExportPage() {
  const store = useCryptoStore();
  const storeRef = useRef(store);
  storeRef.current = store;
  const [exportStatus, setExportStatus] = useState<ExportStatus>({ type: "idle" });
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!store.hydrated) return;
    if (window.parent !== window) window.parent.postMessage({ type: "TNOS_READY" }, "*");
  }, [store.hydrated]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if ((event.data as { type?: string }).type !== "TNOS_SNAPSHOT_REQUEST") return;
      try {
        const snapshot = buildCryptoSnapshot(storeRef.current);
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
      const snap = buildCryptoSnapshot(store);
      setPreview(snapshotToJSON(snap));
      setExportStatus({ type: "success" });
    } catch (err) {
      setExportStatus({ type: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  }, [store]);

  const handleDownload = useCallback(() => {
    try {
      const snap = buildCryptoSnapshot(store);
      downloadSnapshot(snap);
      setExportStatus({ type: "success" });
    } catch (err) {
      setExportStatus({ type: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  }, [store]);

  if (!store.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const hasData = store.holdings.length > 0 || store.wallets.length > 0;

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Export Snapshot</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Generate a <code className="text-amber-400">.tnos.json</code> file to import into TN Life OS
        </p>
      </div>

      {exportStatus.type === "success" && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
          ✓ Snapshot built successfully — import into TN Life OS to see your crypto data.
        </div>
      )}
      {exportStatus.type === "error" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          ✗ Error: {exportStatus.message}
        </div>
      )}

      {!hasData && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
          ⚠ No data loaded yet. Load sample data or add holdings first.
        </div>
      )}

      <Card title="Data Inventory">
        <div className="mt-3 space-y-2">
          {([
            ["Holdings", store.holdings.length],
            ["Wallets", store.wallets.length],
            ["Exchanges", store.exchanges.length],
            ["Stablecoins", store.stablecoins.length],
            ["DeFi Positions", store.defi_positions.length],
            ["Theses", store.theses.length],
          ] as [string, number][]).map(([label, count]) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-zinc-800/60 last:border-0">
              <span className="text-sm text-zinc-400">{label}</span>
              <Badge variant={count > 0 ? "success" : "neutral"}>{count} records</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Crypto Summary">
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {([
            ["Total Value", `$${store.totalCryptoValueUSD.toFixed(0)}`],
            ["BTC Holdings", `${store.btcAmount.toFixed(4)} BTC`],
            ["ETH Holdings", `${store.ethAmount.toFixed(4)} ETH`],
            ["Stablecoins", `$${store.stablecoinBalanceUSD.toFixed(0)}`],
            ["DeFi Exposure", `$${store.defiExposureUSD.toFixed(0)}`],
            ["Security Score", `${store.securityScore}%`],
            ["Exchange Risk", store.exchangeRisk.toUpperCase()],
            ["BTC Target", `${store.targetBTCProgressPct.toFixed(0)}% of ${store.target_btc_amount}`],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-zinc-500">{label}</span>
              <span className="text-zinc-200 font-medium">{value}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={handlePreview}>Preview JSON</Button>
        <Button variant="primary" onClick={handleDownload} disabled={!hasData}>Download .tnos.json</Button>
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
          <li>The CEO Dashboard Crypto widget will populate.</li>
        </ol>
      </Card>
    </div>
  );
}
