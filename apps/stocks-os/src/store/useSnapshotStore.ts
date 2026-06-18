"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  PortfolioSnapshot,
  GlobalSnapshot,
  SnapshotStoreData,
} from "@/lib/snapshot-types";

const STORAGE_KEY = "stocks_os_snapshots_v1";

const EMPTY: SnapshotStoreData = {
  portfolioSnapshots: [],
  globalSnapshots: [],
};

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadData(): SnapshotStoreData {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<SnapshotStoreData>;
    return {
      portfolioSnapshots: p.portfolioSnapshots ?? [],
      globalSnapshots: p.globalSnapshots ?? [],
    };
  } catch {
    return EMPTY;
  }
}

function persist(data: SnapshotStoreData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Shape expected from getPortfolioMetrics()
type PortfolioMetricsInput = {
  value: number;
  investedCapital: number;
  unrealizedPnL: number;
  realizedPnL: number;
  dividendIncome: number;
  totalReturn: { pct: number };
  holdingCount: number;
};

// Shape expected from globalMetrics
type GlobalMetricsInput = {
  totalValue: number;
  totalInvested: number;
  totalUnrealized: number;
  totalRealized: number;
  totalDividends: number;
  totalHoldings: number;
};

export function useSnapshotStore() {
  const [data, setData] = useState<SnapshotStoreData>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(loadData());
    setHydrated(true);
  }, []);

  const update = useCallback(
    (updater: (prev: SnapshotStoreData) => SnapshotStoreData) => {
      setData((prev) => {
        const next = updater(prev);
        persist(next);
        return next;
      });
    },
    []
  );

  const takePortfolioSnapshot = useCallback(
    (portfolioId: string, portfolioName: string, metrics: PortfolioMetricsInput) => {
      const snapshot: PortfolioSnapshot = {
        id: uid(),
        portfolioId,
        portfolioName,
        takenAt: new Date().toISOString(),
        value: metrics.value,
        investedCapital: metrics.investedCapital,
        unrealizedPnL: metrics.unrealizedPnL,
        realizedPnL: metrics.realizedPnL,
        dividendIncome: metrics.dividendIncome,
        totalReturnPct: metrics.totalReturn.pct,
        holdingCount: metrics.holdingCount,
      };
      update((prev) => ({
        ...prev,
        portfolioSnapshots: [snapshot, ...prev.portfolioSnapshots],
      }));
    },
    [update]
  );

  const takeGlobalSnapshot = useCallback(
    (metrics: GlobalMetricsInput) => {
      const snapshot: GlobalSnapshot = {
        id: uid(),
        takenAt: new Date().toISOString(),
        totalValue: metrics.totalValue,
        totalInvested: metrics.totalInvested,
        totalUnrealized: metrics.totalUnrealized,
        totalRealized: metrics.totalRealized,
        totalDividends: metrics.totalDividends,
        totalHoldings: metrics.totalHoldings,
      };
      update((prev) => ({
        ...prev,
        globalSnapshots: [snapshot, ...prev.globalSnapshots],
      }));
    },
    [update]
  );

  const deletePortfolioSnapshot = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        portfolioSnapshots: prev.portfolioSnapshots.filter((s) => s.id !== id),
      }));
    },
    [update]
  );

  const deleteGlobalSnapshot = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        globalSnapshots: prev.globalSnapshots.filter((s) => s.id !== id),
      }));
    },
    [update]
  );

  const getPortfolioSnapshots = useCallback(
    (portfolioId: string) =>
      data.portfolioSnapshots.filter((s) => s.portfolioId === portfolioId),
    [data.portfolioSnapshots]
  );

  return {
    hydrated,
    portfolioSnapshots: data.portfolioSnapshots,
    globalSnapshots: data.globalSnapshots,
    takePortfolioSnapshot,
    takeGlobalSnapshot,
    deletePortfolioSnapshot,
    deleteGlobalSnapshot,
    getPortfolioSnapshots,
  };
}
