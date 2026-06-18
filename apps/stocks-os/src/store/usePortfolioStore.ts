"use client";

import { useState, useEffect, useCallback } from "react";
import type { StockPortfolio, Holding, PortfolioTransaction } from "@/lib/portfolio-types";
import { seedPortfolios, STOCK_PORTFOLIOS } from "@/lib/portfolio-registry";
import {
  calculatePortfolioValue,
  calculateInvestedCapital,
  calculateUnrealizedPnL,
  calculateRealizedPnL,
  calculateDividendIncome,
  calculateTotalReturn,
  calculateAllocationBySymbol,
  calculateAllocationBySector,
  calculateAllocationByAssetClass,
  calculateAllocationByBroker,
} from "@/lib/portfolio-metrics";

const STORAGE_KEY = "stocks_os_portfolio_store_v1";

type PortfolioStoreData = {
  portfolios: StockPortfolio[];
  holdings: Holding[];
  transactions: PortfolioTransaction[];
};

const EMPTY: PortfolioStoreData = {
  portfolios: [],
  holdings: [],
  transactions: [],
};

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function today(): string {
  return new Date().toISOString().split("T")[0] ?? new Date().toISOString();
}

function loadData(): PortfolioStoreData {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<PortfolioStoreData>;
    return {
      portfolios: p.portfolios ?? [],
      holdings: p.holdings ?? [],
      transactions: p.transactions ?? [],
    };
  } catch {
    return EMPTY;
  }
}

function persist(data: PortfolioStoreData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function usePortfolioStore() {
  const [data, setData] = useState<PortfolioStoreData>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadData();
    // Seed five default portfolios on first load
    if (loaded.portfolios.length === 0) {
      const seeded: PortfolioStoreData = {
        portfolios: seedPortfolios(),
        holdings: [],
        transactions: [],
      };
      persist(seeded);
      setData(seeded);
    } else {
      setData(loaded);
    }
    setHydrated(true);
  }, []);

  const update = useCallback((updater: (prev: PortfolioStoreData) => PortfolioStoreData) => {
    setData((prev) => {
      const next = updater(prev);
      persist(next);
      return next;
    });
  }, []);

  // ── Portfolio CRUD ────────────────────────────────────────────────────────

  const updatePortfolio = useCallback(
    (portfolio: StockPortfolio) => {
      update((d) => ({
        ...d,
        portfolios: d.portfolios.map((p) =>
          p.id === portfolio.id ? { ...portfolio, updatedAt: new Date().toISOString() } : p
        ),
      }));
    },
    [update]
  );

  // ── Holding CRUD ──────────────────────────────────────────────────────────

  const addHolding = useCallback(
    (h: Omit<Holding, "id">) => {
      const now = new Date().toISOString();
      update((d) => ({
        ...d,
        holdings: [...d.holdings, { ...h, id: uid() }],
        portfolios: d.portfolios.map((p) =>
          p.id === h.portfolioId ? { ...p, updatedAt: now } : p
        ),
      }));
    },
    [update]
  );

  const updateHolding = useCallback(
    (h: Holding) => {
      update((d) => ({
        ...d,
        holdings: d.holdings.map((x) => (x.id === h.id ? h : x)),
      }));
    },
    [update]
  );

  const deleteHolding = useCallback(
    (id: string) => {
      update((d) => ({
        ...d,
        holdings: d.holdings.filter((x) => x.id !== id),
        transactions: d.transactions.filter((tx) => tx.holdingId !== id),
      }));
    },
    [update]
  );

  // ── Transaction CRUD ──────────────────────────────────────────────────────

  const addTransaction = useCallback(
    (tx: Omit<PortfolioTransaction, "id">) => {
      update((d) => ({
        ...d,
        transactions: [
          ...d.transactions,
          { ...tx, id: uid(), date: tx.date || today() },
        ],
      }));
    },
    [update]
  );

  const updateTransaction = useCallback(
    (tx: PortfolioTransaction) => {
      update((d) => ({
        ...d,
        transactions: d.transactions.map((x) => (x.id === tx.id ? tx : x)),
      }));
    },
    [update]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      update((d) => ({
        ...d,
        transactions: d.transactions.filter((x) => x.id !== id),
      }));
    },
    [update]
  );

  // ── Per-portfolio selectors ───────────────────────────────────────────────

  const getPortfolioHoldings = useCallback(
    (portfolioId: string) => data.holdings.filter((h) => h.portfolioId === portfolioId),
    [data.holdings]
  );

  const getPortfolioTransactions = useCallback(
    (portfolioId: string) =>
      data.transactions.filter((tx) => tx.portfolioId === portfolioId),
    [data.transactions]
  );

  const getPortfolioMetrics = useCallback(
    (portfolioId: string) => {
      const holdings = data.holdings.filter((h) => h.portfolioId === portfolioId);
      const transactions = data.transactions.filter((tx) => tx.portfolioId === portfolioId);
      return {
        value: calculatePortfolioValue(holdings),
        investedCapital: calculateInvestedCapital(holdings),
        unrealizedPnL: calculateUnrealizedPnL(holdings),
        realizedPnL: calculateRealizedPnL(transactions),
        dividendIncome: calculateDividendIncome(transactions),
        totalReturn: calculateTotalReturn(holdings, transactions),
        holdingCount: holdings.length,
        allocationBySymbol: calculateAllocationBySymbol(holdings),
        allocationBySector: calculateAllocationBySector(holdings),
        allocationByAssetClass: calculateAllocationByAssetClass(holdings),
        allocationByBroker: calculateAllocationByBroker(holdings),
      };
    },
    [data.holdings, data.transactions]
  );

  // ── Global aggregates ─────────────────────────────────────────────────────

  const globalMetrics = {
    totalValue: calculatePortfolioValue(data.holdings),
    totalInvested: calculateInvestedCapital(data.holdings),
    totalUnrealized: calculateUnrealizedPnL(data.holdings),
    totalRealized: calculateRealizedPnL(data.transactions),
    totalDividends: calculateDividendIncome(data.transactions),
    totalHoldings: data.holdings.length,
    portfolioCount: STOCK_PORTFOLIOS.length,
  };

  return {
    hydrated,
    portfolios: data.portfolios,
    holdings: data.holdings,
    transactions: data.transactions,
    // portfolio CRUD
    updatePortfolio,
    // holding CRUD
    addHolding,
    updateHolding,
    deleteHolding,
    // transaction CRUD
    addTransaction,
    updateTransaction,
    deleteTransaction,
    // selectors
    getPortfolioHoldings,
    getPortfolioTransactions,
    getPortfolioMetrics,
    // global
    globalMetrics,
  };
}
