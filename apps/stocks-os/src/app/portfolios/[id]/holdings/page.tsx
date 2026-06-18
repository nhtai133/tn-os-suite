"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { PORTFOLIO_MAP } from "@/lib/portfolio-registry";
import { toUSD } from "@/lib/portfolio-metrics";
import type { Holding, AssetClass } from "@/lib/portfolio-types";

const ASSET_CLASSES: AssetClass[] = ["STOCK", "ETF", "MUTUAL_FUND", "BOND_FUND", "CASH"];

type HoldingForm = Omit<Holding, "id" | "portfolioId">;

const EMPTY_FORM: HoldingForm = {
  symbol: "",
  name: "",
  assetClass: "STOCK",
  sector: "",
  provider: "",
  broker: "",
  quantity: 0,
  averageCost: 0,
  currentPrice: 0,
  currency: "VND",
  annualDividend: 0,
  thesis: "",
  targetPrice: 0,
  stopLoss: 0,
  entryDate: new Date().toISOString().split("T")[0] ?? "",
};

function fmtPrice(price: number, currency: "VND" | "USD"): string {
  if (currency === "VND") return `${price.toLocaleString()}₫`;
  return `$${price.toLocaleString()}`;
}

function fmtUSD(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export default function HoldingsPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const store = usePortfolioStore();
  const def = PORTFOLIO_MAP[id];

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Holding | null>(null);
  const [form, setForm] = useState<HoldingForm>(EMPTY_FORM);

  if (!store.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;
  if (!def) return null;

  const holdings = store.getPortfolioHoldings(id);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, currency: def?.baseCurrency ?? "VND" });
    setShowModal(true);
  }

  function openEdit(h: Holding) {
    setEditing(h);
    setForm({
      symbol: h.symbol,
      name: h.name,
      assetClass: h.assetClass,
      sector: h.sector ?? "",
      provider: h.provider ?? "",
      broker: h.broker ?? "",
      quantity: h.quantity,
      averageCost: h.averageCost,
      currentPrice: h.currentPrice,
      currency: h.currency,
      annualDividend: h.annualDividend ?? 0,
      thesis: h.thesis ?? "",
      targetPrice: h.targetPrice ?? 0,
      stopLoss: h.stopLoss ?? 0,
      entryDate: h.entryDate ?? "",
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
  }

  function handleSave() {
    if (!form.symbol.trim()) return;
    const clean: HoldingForm = {
      ...form,
      sector: form.sector || undefined,
      provider: form.provider || undefined,
      broker: form.broker || undefined,
      annualDividend: form.annualDividend || undefined,
      thesis: form.thesis || undefined,
      targetPrice: form.targetPrice || undefined,
      stopLoss: form.stopLoss || undefined,
      entryDate: form.entryDate || undefined,
    };
    if (editing) {
      store.updateHolding({ ...clean, id: editing.id, portfolioId: id });
    } else {
      store.addHolding({ ...clean, portfolioId: id });
    }
    closeModal();
  }

  function field<K extends keyof HoldingForm>(key: K, value: HoldingForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const sortedHoldings = [...holdings].sort(
    (a, b) => toUSD(b.quantity * b.currentPrice, b.currency) - toUSD(a.quantity * a.currentPrice, a.currency)
  );

  return (
    <div className="p-8 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Holdings</h2>
          <p className="text-sm text-zinc-500">{holdings.length} position{holdings.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 rounded-lg bg-sky-600 text-sm font-medium text-white hover:bg-sky-500 transition-colors"
        >
          + Add Holding
        </button>
      </div>

      {holdings.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-xl p-10 text-center">
          <p className="text-zinc-400 font-medium mb-1">No holdings yet</p>
          <p className="text-zinc-600 text-sm mb-4">Track your first position in this portfolio.</p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 transition-colors"
          >
            Add Holding →
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60">
                  {["Symbol", "Name", "Class", "Qty", "Avg Cost", "Current", "Value (USD)", "P/L", "P/L %", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-zinc-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedHoldings.map((h) => {
                  const valueUSD = toUSD(h.quantity * h.currentPrice, h.currency);
                  const costUSD = toUSD(h.quantity * h.averageCost, h.currency);
                  const pnl = valueUSD - costUSD;
                  const pnlPct = h.averageCost > 0 ? ((h.currentPrice - h.averageCost) / h.averageCost) * 100 : 0;
                  return (
                    <tr key={h.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="px-4 py-3">
                        <div className="font-bold text-sky-400">{h.symbol}</div>
                        {h.entryDate && <div className="text-xs text-zinc-600">{h.entryDate}</div>}
                      </td>
                      <td className="px-4 py-3 text-zinc-300 max-w-[140px] truncate">{h.name}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">{h.assetClass}</td>
                      <td className="px-4 py-3 text-zinc-200">{h.quantity.toLocaleString()}</td>
                      <td className="px-4 py-3 text-zinc-400">{fmtPrice(h.averageCost, h.currency)}</td>
                      <td className="px-4 py-3 text-zinc-200">{fmtPrice(h.currentPrice, h.currency)}</td>
                      <td className="px-4 py-3 text-sky-400 font-medium">{fmtUSD(valueUSD)}</td>
                      <td className={`px-4 py-3 font-medium ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {pnl >= 0 ? "+" : ""}{fmtUSD(pnl)}
                      </td>
                      <td className={`px-4 py-3 font-medium ${pnlPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(h)}
                            className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { if (confirm(`Delete ${h.symbol}?`)) store.deleteHolding(h.id); }}
                            className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">{editing ? "Edit Holding" : "Add Holding"}</h3>
              <button onClick={closeModal} className="text-zinc-500 hover:text-zinc-200 text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Symbol *</label>
                  <input
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                    value={form.symbol}
                    onChange={(e) => field("symbol", e.target.value.toUpperCase())}
                    placeholder="VCB"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Name</label>
                  <input
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                    value={form.name}
                    onChange={(e) => field("name", e.target.value)}
                    placeholder="Vietcombank"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Asset Class</label>
                  <select
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                    value={form.assetClass}
                    onChange={(e) => field("assetClass", e.target.value as AssetClass)}
                  >
                    {ASSET_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Currency</label>
                  <select
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                    value={form.currency}
                    onChange={(e) => field("currency", e.target.value as "VND" | "USD")}
                  >
                    <option value="VND">VND</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Sector</label>
                  <input
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                    value={form.sector}
                    onChange={(e) => field("sector", e.target.value)}
                    placeholder="Banking"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Quantity *</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                    value={form.quantity || ""}
                    onChange={(e) => field("quantity", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Avg Cost *</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                    value={form.averageCost || ""}
                    onChange={(e) => field("averageCost", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Current Price *</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                    value={form.currentPrice || ""}
                    onChange={(e) => field("currentPrice", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Broker</label>
                  <input
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                    value={form.broker}
                    onChange={(e) => field("broker", e.target.value)}
                    placeholder="SSI"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Entry Date</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                    value={form.entryDate}
                    onChange={(e) => field("entryDate", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Annual Dividend</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                    value={form.annualDividend || ""}
                    onChange={(e) => field("annualDividend", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Target Price</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                    value={form.targetPrice || ""}
                    onChange={(e) => field("targetPrice", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Stop Loss</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                    value={form.stopLoss || ""}
                    onChange={(e) => field("stopLoss", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">Thesis / Notes</label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-sky-500 resize-none"
                  value={form.thesis}
                  onChange={(e) => field("thesis", e.target.value)}
                  placeholder="Why are you holding this position?"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.symbol.trim()}
                className="px-5 py-2 rounded-lg bg-sky-600 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {editing ? "Save Changes" : "Add Holding"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
