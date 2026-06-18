"use client";

import { useState } from "react";
import { useDividendStore } from "@/store/useDividendStore";
import { STOCK_PORTFOLIOS } from "@/lib/portfolio-registry";
import type { DividendEvent } from "@/lib/dividend-types";
import { DividendCard } from "@/components/dividends/DividendCard";
import { DividendCalendarTable } from "@/components/dividends/DividendCalendarTable";
import { DividendHistoryTable } from "@/components/dividends/DividendHistoryTable";
import { DividendSummaryCard } from "@/components/dividends/DividendSummaryCard";

const VND_TO_USD = 25_000;

function toUSD(amount: number, currency: "VND" | "USD") {
  return currency === "VND" ? amount / VND_TO_USD : amount;
}

const VND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
const USD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
function fmt(amount: number, currency: "VND" | "USD") {
  return currency === "VND" ? VND(amount) : USD(amount);
}

const TABS = ["Dashboard", "Calendar", "History", "By Symbol", "By Portfolio"] as const;
type Tab = (typeof TABS)[number];

type FormState = {
  portfolioId: string;
  symbol: string;
  broker: string;
  exDate: string;
  recordDate: string;
  paymentDate: string;
  amountPerShare: string;
  shares: string;
  tax: string;
  currency: "VND" | "USD";
  status: "expected" | "received";
  note: string;
};

function emptyForm(): FormState {
  return {
    portfolioId: STOCK_PORTFOLIOS[0]?.id ?? "",
    symbol: "",
    broker: "",
    exDate: "",
    recordDate: "",
    paymentDate: "",
    amountPerShare: "",
    shares: "",
    tax: "",
    currency: "VND",
    status: "received",
    note: "",
  };
}

function formToEvent(form: FormState, existing?: DividendEvent): Omit<DividendEvent, "id"> {
  const aps = parseFloat(form.amountPerShare) || 0;
  const sh = parseFloat(form.shares) || 0;
  const gross = aps * sh;
  const tax = form.tax ? parseFloat(form.tax) : undefined;
  const net = tax != null ? gross - tax : gross;
  return {
    portfolioId: form.portfolioId,
    symbol: form.symbol.toUpperCase().trim(),
    broker: form.broker.trim() || undefined,
    exDate: form.exDate,
    recordDate: form.recordDate || undefined,
    paymentDate: form.paymentDate || undefined,
    amountPerShare: aps,
    shares: sh,
    grossAmount: gross,
    tax,
    netAmount: net,
    currency: form.currency,
    status: form.status,
    note: form.note.trim() || undefined,
  };
}

function eventToForm(e: DividendEvent): FormState {
  return {
    portfolioId: e.portfolioId,
    symbol: e.symbol,
    broker: e.broker ?? "",
    exDate: e.exDate,
    recordDate: e.recordDate ?? "",
    paymentDate: e.paymentDate ?? "",
    amountPerShare: String(e.amountPerShare),
    shares: String(e.shares),
    tax: e.tax != null ? String(e.tax) : "",
    currency: e.currency,
    status: e.status,
    note: e.note ?? "",
  };
}

export default function DividendsPage() {
  const store = useDividendStore();
  const [tab, setTab] = useState<Tab>("Dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DividendEvent | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!store.hydrated) {
    return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;
  }

  const { events, addDividend, updateDividend, deleteDividend } = store;

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (e: DividendEvent) => {
    setEditing(e);
    setForm(eventToForm(e));
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const payload = formToEvent(form, editing ?? undefined);
    if (editing) {
      updateDividend({ ...payload, id: editing.id });
    } else {
      addDividend(payload);
    }
    closeModal();
  };

  const set = (key: keyof FormState, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const aps = parseFloat(form.amountPerShare) || 0;
  const sh = parseFloat(form.shares) || 0;
  const gross = aps * sh;
  const taxVal = form.tax ? parseFloat(form.tax) : 0;
  const net = gross - taxVal;

  // Dashboard KPIs
  const received = events.filter((e) => e.status === "received");
  const expected = events.filter((e) => e.status === "expected");
  const totalReceivedUSD = received.reduce((sum, e) => sum + toUSD(e.netAmount, e.currency), 0);
  const totalExpectedUSD = expected.reduce((sum, e) => sum + toUSD(e.grossAmount, e.currency), 0);
  const currentYear = new Date().getFullYear().toString();
  const ytdUSD = received
    .filter((e) => e.exDate.startsWith(currentYear))
    .reduce((sum, e) => sum + toUSD(e.netAmount, e.currency), 0);

  // By Symbol
  type SymbolAgg = { received: number; expected: number; count: number; lastDate?: string; currency: "VND" | "USD" };
  const bySymbol: Record<string, SymbolAgg> = {};
  for (const e of events) {
    if (!bySymbol[e.symbol]) {
      bySymbol[e.symbol] = { received: 0, expected: 0, count: 0, currency: e.currency };
    }
    const agg = bySymbol[e.symbol]!;
    if (e.status === "received") agg.received += e.netAmount;
    else agg.expected += e.grossAmount;
    agg.count++;
    if (!agg.lastDate || e.exDate > agg.lastDate) agg.lastDate = e.exDate;
  }

  // By Portfolio
  type PortAgg = { received: number; expected: number; count: number; currency: "VND" | "USD"; name: string };
  const byPortfolio: Record<string, PortAgg> = {};
  for (const p of STOCK_PORTFOLIOS) {
    byPortfolio[p.id] = { received: 0, expected: 0, count: 0, currency: p.baseCurrency, name: p.name };
  }
  for (const e of events) {
    const agg = byPortfolio[e.portfolioId];
    if (!agg) continue;
    if (e.status === "received") agg.received += e.netAmount;
    else agg.expected += e.grossAmount;
    agg.count++;
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dividends</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Dividend income tracking across all portfolios</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition-colors"
        >
          + Add Dividend
        </button>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 border-b border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {tab === "Dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <DividendCard
              label="Total Received (Net)"
              value={`$${totalReceivedUSD.toFixed(0)}`}
              sub="All time, in USD"
              valueColor="text-emerald-400"
            />
            <DividendCard
              label="YTD Received"
              value={`$${ytdUSD.toFixed(0)}`}
              sub={`${currentYear} calendar year`}
              valueColor="text-sky-400"
            />
            <DividendCard
              label="Upcoming (Expected)"
              value={`$${totalExpectedUSD.toFixed(0)}`}
              sub={`${expected.length} event${expected.length !== 1 ? "s" : ""}`}
              valueColor="text-amber-400"
            />
            <DividendCard
              label="Total Events"
              value={String(events.length)}
              sub={`${received.length} received · ${expected.length} expected`}
            />
          </div>

          {events.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center">
              <div className="text-zinc-500 text-sm">No dividend records yet. Click + Add Dividend to start.</div>
            </div>
          ) : (
            <div>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Recent Activity</div>
              <DividendHistoryTable
                events={events.slice(0, 10)}
                onEdit={openEdit}
                onDelete={deleteDividend}
              />
            </div>
          )}
        </div>
      )}

      {/* Calendar Tab */}
      {tab === "Calendar" && (
        <div className="space-y-4">
          <div className="text-sm text-zinc-400">Upcoming dividend events (status: expected), sorted by ex-date.</div>
          <DividendCalendarTable events={events} />
        </div>
      )}

      {/* History Tab */}
      {tab === "History" && (
        <div className="space-y-4">
          <div className="text-sm text-zinc-400">{events.length} total records</div>
          <DividendHistoryTable events={events} onEdit={openEdit} onDelete={deleteDividend} />
        </div>
      )}

      {/* By Symbol Tab */}
      {tab === "By Symbol" && (
        <div className="space-y-4">
          {Object.keys(bySymbol).length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-10 text-center text-sm text-zinc-500">
              No data
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(bySymbol)
                .sort((a, b) => b[1].received - a[1].received)
                .map(([symbol, agg]) => (
                  <DividendSummaryCard
                    key={symbol}
                    symbol={symbol}
                    totalReceived={agg.received}
                    totalExpected={agg.expected}
                    eventCount={agg.count}
                    currency={agg.currency}
                    lastDate={agg.lastDate}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {/* By Portfolio Tab */}
      {tab === "By Portfolio" && (
        <div className="space-y-4">
          {STOCK_PORTFOLIOS.map((p) => {
            const agg = byPortfolio[p.id]!;
            const portEvents = events.filter((e) => e.portfolioId === p.id);
            return (
              <div key={p.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-zinc-300">{p.name}</div>
                  <div className="text-xs text-zinc-500">{agg.count} event{agg.count !== 1 ? "s" : ""}</div>
                </div>
                {portEvents.length === 0 ? (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 text-sm text-zinc-600">
                    No dividends for this portfolio
                  </div>
                ) : (
                  <DividendHistoryTable events={portEvents} onEdit={openEdit} onDelete={deleteDividend} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                {editing ? "Edit Dividend" : "Add Dividend"}
              </h2>
              <button onClick={closeModal} className="text-zinc-500 hover:text-zinc-300 text-lg">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Portfolio */}
                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 mb-1 block">Portfolio *</label>
                  <select
                    required
                    value={form.portfolioId}
                    onChange={(e) => set("portfolioId", e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    {STOCK_PORTFOLIOS.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Symbol */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Symbol *</label>
                  <input
                    required
                    value={form.symbol}
                    onChange={(e) => set("symbol", e.target.value)}
                    placeholder="VCB"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Broker */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Broker</label>
                  <input
                    value={form.broker}
                    onChange={(e) => set("broker", e.target.value)}
                    placeholder="VPS, SSI..."
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Amount per Share */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Amount per Share *</label>
                  <input
                    required
                    type="number"
                    step="any"
                    value={form.amountPerShare}
                    onChange={(e) => set("amountPerShare", e.target.value)}
                    placeholder="1800"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Shares */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Shares *</label>
                  <input
                    required
                    type="number"
                    step="any"
                    value={form.shares}
                    onChange={(e) => set("shares", e.target.value)}
                    placeholder="100"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Tax */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Tax (optional)</label>
                  <input
                    type="number"
                    step="any"
                    value={form.tax}
                    onChange={(e) => set("tax", e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => set("currency", e.target.value as "VND" | "USD")}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="VND">VND</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                {/* Gross / Net preview */}
                {aps > 0 && sh > 0 && (
                  <div className="col-span-2 rounded-lg bg-zinc-800/60 px-4 py-2.5 text-sm flex gap-6">
                    <div>
                      <span className="text-zinc-500">Gross: </span>
                      <span className="text-zinc-200 font-medium">{fmt(gross, form.currency)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Net: </span>
                      <span className="text-emerald-400 font-medium">{fmt(net, form.currency)}</span>
                    </div>
                  </div>
                )}

                {/* Ex Date */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Ex-Dividend Date *</label>
                  <input
                    required
                    type="date"
                    value={form.exDate}
                    onChange={(e) => set("exDate", e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Payment Date */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Payment Date</label>
                  <input
                    type="date"
                    value={form.paymentDate}
                    onChange={(e) => set("paymentDate", e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Record Date */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Record Date</label>
                  <input
                    type="date"
                    value={form.recordDate}
                    onChange={(e) => set("recordDate", e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value as "expected" | "received")}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="received">Received</option>
                    <option value="expected">Expected</option>
                  </select>
                </div>

                {/* Note */}
                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 mb-1 block">Note</label>
                  <input
                    value={form.note}
                    onChange={(e) => set("note", e.target.value)}
                    placeholder="Cash dividend Q2 2025..."
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition-colors"
                >
                  {editing ? "Save Changes" : "Add Dividend"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
                >
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
