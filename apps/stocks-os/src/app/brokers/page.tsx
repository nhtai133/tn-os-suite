"use client";

import { useState } from "react";
import { useBrokerStore } from "@/store/useBrokerStore";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { useDividendStore } from "@/store/useDividendStore";
import type { BrokerAccount } from "@/lib/broker-types";
import { BrokerCard } from "@/components/brokers/BrokerCard";
import { BrokerTable } from "@/components/brokers/BrokerTable";

const VND_TO_USD = 25_000;
function toUSD(n: number, c: "VND" | "USD") { return c === "VND" ? n / VND_TO_USD : n; }

const TABS = ["Dashboard", "Holdings", "Performance"] as const;
type Tab = (typeof TABS)[number];

const KNOWN_BROKERS = ["VCBS", "ACBS", "SSI", "Dragon Capital"];

type FormState = {
  name: string; cash: string; currency: "VND" | "USD";
  fees: string; taxes: string; notes: string;
};
function emptyForm(): FormState {
  return { name: "", cash: "0", currency: "VND", fees: "", taxes: "", notes: "" };
}
function accountToForm(a: BrokerAccount): FormState {
  return { name: a.name, cash: String(a.cash), currency: a.currency, fees: a.fees != null ? String(a.fees) : "", taxes: a.taxes != null ? String(a.taxes) : "", notes: a.notes ?? "" };
}

export default function BrokersPage() {
  const brokerStore = useBrokerStore();
  const portfolioStore = usePortfolioStore();
  const dividendStore = useDividendStore();

  const [tab, setTab] = useState<Tab>("Dashboard");
  const [selectedBroker, setSelectedBroker] = useState<string>("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BrokerAccount | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!brokerStore.hydrated || !portfolioStore.hydrated || !dividendStore.hydrated) {
    return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;
  }

  const { accounts, addAccount, updateAccount, deleteAccount } = brokerStore;

  // Derive broker names from holdings (auto-discovered + registered accounts)
  const holdingBrokers = [...new Set(portfolioStore.holdings.map((h) => h.broker ?? "Unknown"))];
  const accountNames = accounts.map((a) => a.name);
  const allBrokerNames = [...new Set([...accountNames, ...holdingBrokers])].sort();

  // Holdings by broker
  const holdingsByBroker = (brokerName: string) =>
    portfolioStore.holdings.filter((h) => (h.broker ?? "Unknown") === brokerName);

  // Dividends by broker
  const dividendsByBroker = (brokerName: string) =>
    dividendStore.events.filter((e) => (e.broker ?? "Unknown") === brokerName && e.status === "received");

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (a: BrokerAccount) => { setEditing(a); setForm(accountToForm(a)); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const payload = {
      name: form.name.trim(),
      cash: parseFloat(form.cash) || 0,
      currency: form.currency,
      fees: form.fees ? parseFloat(form.fees) : undefined,
      taxes: form.taxes ? parseFloat(form.taxes) : undefined,
      notes: form.notes.trim() || undefined,
    };
    if (editing) updateAccount({ ...payload, id: editing.id, createdAt: editing.createdAt, updatedAt: editing.updatedAt });
    else addAccount(payload);
    closeModal();
  };

  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  // Build broker rows for Holdings tab
  const filteredHoldings = selectedBroker === "All"
    ? portfolioStore.holdings
    : portfolioStore.holdings.filter((h) => (h.broker ?? "Unknown") === selectedBroker);

  const brokerTableRows = filteredHoldings.map((h) => ({
    brokerName: h.broker ?? "Unknown",
    symbol: h.symbol,
    quantity: h.quantity,
    avgCost: h.averageCost,
    currentPrice: h.currentPrice,
    currency: h.currency,
    unrealizedPL: (h.currentPrice - h.averageCost) * h.quantity,
    unrealizedPct: h.averageCost > 0 ? ((h.currentPrice - h.averageCost) / h.averageCost) * 100 : 0,
  }));

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Broker Layer</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Track assets across brokers</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition-colors">
          + Add Broker
        </button>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 border-b border-zinc-800">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t ? "border-sky-500 text-sky-400" : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}>{t}</button>
        ))}
      </div>

      {/* ── Dashboard ── */}
      {tab === "Dashboard" && (
        <div className="space-y-4">
          {accounts.length === 0 && allBrokerNames.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center text-sm text-zinc-500">
              No brokers registered. Add a broker account or assign broker names to your holdings.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Registered accounts */}
              {accounts.map((a) => {
                const holdings = holdingsByBroker(a.name);
                const value = holdings.reduce((s, h) => s + toUSD(h.currentPrice * h.quantity, h.currency), 0);
                const VND_TO_USD2 = 25_000;
                const valueInCurrency = a.currency === "VND" ? value * VND_TO_USD2 : value;
                const divs = dividendsByBroker(a.name).reduce((s, e) => s + toUSD(e.netAmount, e.currency), 0);
                const divsInCurrency = a.currency === "VND" ? divs * VND_TO_USD2 : divs;
                return (
                  <BrokerCard key={a.id} account={a} holdingCount={holdings.length}
                    holdingValue={valueInCurrency} dividendIncome={divsInCurrency} onEdit={openEdit} />
                );
              })}
              {/* Auto-discovered brokers from holdings */}
              {holdingBrokers.filter((b) => !accountNames.includes(b)).map((brokerName) => {
                const holdings = holdingsByBroker(brokerName);
                const value = holdings.reduce((s, h) => s + toUSD(h.currentPrice * h.quantity, h.currency), 0);
                return (
                  <div key={brokerName} className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/20 px-5 py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-zinc-400">{brokerName}</div>
                      <span className="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">auto-detected</span>
                    </div>
                    <div className="text-xs text-zinc-500">{holdings.length} holdings · ${value.toFixed(0)} USD</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Holdings ── */}
      {tab === "Holdings" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select value={selectedBroker} onChange={(e) => setSelectedBroker(e.target.value)}
              className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-sky-500">
              <option value="All">All Brokers</option>
              {allBrokerNames.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <span className="text-xs text-zinc-500">{filteredHoldings.length} holdings</span>
          </div>
          <BrokerTable rows={brokerTableRows} />
        </div>
      )}

      {/* ── Performance ── */}
      {tab === "Performance" && (
        <div className="space-y-4">
          {allBrokerNames.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-10 text-center text-sm text-zinc-500">
              No broker data available.
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Broker</th>
                    <th className="px-4 py-3 text-right">Holdings</th>
                    <th className="px-4 py-3 text-right">Value (USD)</th>
                    <th className="px-4 py-3 text-right">Dividends (USD)</th>
                    <th className="px-4 py-3 text-right">Unrealized P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {allBrokerNames.map((brokerName) => {
                    const holdings = holdingsByBroker(brokerName);
                    const value = holdings.reduce((s, h) => s + toUSD(h.currentPrice * h.quantity, h.currency), 0);
                    const cost = holdings.reduce((s, h) => s + toUSD(h.averageCost * h.quantity, h.currency), 0);
                    const pl = value - cost;
                    const divs = dividendsByBroker(brokerName).reduce((s, e) => s + toUSD(e.netAmount, e.currency), 0);
                    return (
                      <tr key={brokerName} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{brokerName}</td>
                        <td className="px-4 py-3 text-right text-zinc-400">{holdings.length}</td>
                        <td className="px-4 py-3 text-right text-sky-400">${value.toFixed(0)}</td>
                        <td className="px-4 py-3 text-right text-emerald-400">${divs.toFixed(0)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={pl >= 0 ? "text-emerald-400" : "text-red-400"}>
                            {pl >= 0 ? "+" : ""}${pl.toFixed(0)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
            <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">{editing ? "Edit Broker" : "Add Broker"}</h2>
              <button onClick={closeModal} className="text-zinc-500 hover:text-zinc-300 text-lg">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Broker Name *</label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                  list="known-brokers" placeholder="VCBS, SSI..."
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" />
                <datalist id="known-brokers">
                  {KNOWN_BROKERS.map((b) => <option key={b} value={b} />)}
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Currency</label>
                  <select value={form.currency} onChange={(e) => set("currency", e.target.value as "VND" | "USD")}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500">
                    <option value="VND">VND</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Cash Balance</label>
                  <input type="number" step="any" value={form.cash} onChange={(e) => set("cash", e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Total Fees</label>
                  <input type="number" step="any" value={form.fees} onChange={(e) => set("fees", e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Total Taxes</label>
                  <input type="number" step="any" value={form.taxes} onChange={(e) => set("taxes", e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
                <input value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition-colors">
                  {editing ? "Save" : "Add"}
                </button>
                {editing && (
                  <button type="button" onClick={() => { deleteAccount(editing.id); closeModal(); }}
                    className="px-5 py-2 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-400 text-sm font-medium transition-colors">
                    Delete
                  </button>
                )}
                <button type="button" onClick={closeModal}
                  className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
