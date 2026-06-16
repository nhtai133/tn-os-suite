"use client";

import { useState, useEffect, useCallback } from "react";
import type { Fund, BuyPlan, WatchlistItem, RebalancingLog } from "@tn-os/schemas";

const STORAGE_KEY = "investment_os_data";

interface InvestmentData {
  funds: Fund[];
  buy_plans: BuyPlan[];
  watchlist: WatchlistItem[];
  rebalancing_logs: RebalancingLog[];
}

const DEFAULT_DATA: InvestmentData = {
  funds: [],
  buy_plans: [],
  watchlist: [],
  rebalancing_logs: [],
};

function loadData(): InvestmentData {
  if (typeof window === "undefined") return DEFAULT_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as InvestmentData) : DEFAULT_DATA;
  } catch {
    return DEFAULT_DATA;
  }
}

function saveData(data: InvestmentData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useInvestmentStore() {
  const [data, setData] = useState<InvestmentData>(DEFAULT_DATA);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(loadData());
    setHydrated(true);
  }, []);

  const updateData = useCallback((updater: (prev: InvestmentData) => InvestmentData) => {
    setData((prev) => {
      const next = updater(prev);
      saveData(next);
      return next;
    });
  }, []);

  const addFund = useCallback((fund: Fund) => {
    updateData((prev) => ({ ...prev, funds: [...prev.funds, fund] }));
  }, [updateData]);

  const updateFund = useCallback((fund: Fund) => {
    updateData((prev) => ({
      ...prev,
      funds: prev.funds.map((f) => (f.id === fund.id ? fund : f)),
    }));
  }, [updateData]);

  const deleteFund = useCallback((id: string) => {
    updateData((prev) => ({ ...prev, funds: prev.funds.filter((f) => f.id !== id) }));
  }, [updateData]);

  const addWatchlistItem = useCallback((item: WatchlistItem) => {
    updateData((prev) => ({ ...prev, watchlist: [...prev.watchlist, item] }));
  }, [updateData]);

  const removeWatchlistItem = useCallback((id: string) => {
    updateData((prev) => ({ ...prev, watchlist: prev.watchlist.filter((w) => w.id !== id) }));
  }, [updateData]);

  const seedSampleData = useCallback(() => {
    const now = new Date().toISOString();
    const sampleData: InvestmentData = {
      funds: [
        {
          id: "f1", name: "VN-Index ETF", ticker: "E1VFVN30", category: "etf",
          currency: "VND", target_allocation_pct: 40, current_value: 150000000,
          cost_basis: 120000000, conviction: "high",
          thesis: "Long-term Vietnam equity exposure via index",
          next_buy_zone: "1,150-1,180 points",
          created_at: now, updated_at: now,
        },
        {
          id: "f2", name: "VCB Bank", ticker: "VCB", category: "equity",
          currency: "VND", target_allocation_pct: 25, current_value: 80000000,
          cost_basis: 65000000, conviction: "high",
          thesis: "Largest state bank, quality at fair value",
          next_buy_zone: "85,000 VND/share",
          created_at: now, updated_at: now,
        },
        {
          id: "f3", name: "Bitcoin", ticker: "BTC", category: "crypto",
          currency: "USD", target_allocation_pct: 20, current_value: 50000000,
          cost_basis: 35000000, conviction: "high",
          thesis: "Digital gold, long-term store of value",
          next_buy_zone: "$55,000-60,000",
          created_at: now, updated_at: now,
        },
        {
          id: "f4", name: "USD Cash Reserve", ticker: undefined, category: "cash",
          currency: "USD", target_allocation_pct: 15, current_value: 30000000,
          cost_basis: 30000000, conviction: "medium",
          thesis: "Dry powder for opportunities",
          created_at: now, updated_at: now,
        },
      ],
      buy_plans: [
        {
          id: "bp1", fund_id: "f1", amount: 5000000, currency: "VND",
          frequency: "monthly", next_date: "2026-07-01",
          note: "DCA into VFMVN30 monthly",
        },
        {
          id: "bp2", fund_id: "f3", amount: 100, currency: "USD",
          frequency: "monthly", next_date: "2026-07-01",
          note: "Monthly BTC accumulation",
        },
      ],
      watchlist: [
        {
          id: "w1", name: "ACB Bank", ticker: "ACB", category: "equity",
          target_price: 25000, current_price: 28000,
          note: "Wait for pullback to 25k zone",
          added_at: now,
        },
        {
          id: "w2", name: "Ethereum", ticker: "ETH", category: "crypto",
          target_price: 2800, current_price: 3200,
          note: "Buy on next correction below 2,800",
          added_at: now,
        },
      ],
      rebalancing_logs: [
        {
          id: "r1", date: "2026-05-15", action: "Buy", fund_id: "f1",
          amount: 5000000, reason: "Monthly DCA",
        },
        {
          id: "r2", date: "2026-06-01", action: "Buy", fund_id: "f3",
          amount: 100, reason: "Monthly BTC accumulation",
        },
      ],
    };
    setData(sampleData);
    saveData(sampleData);
  }, []);

  return {
    ...data,
    hydrated,
    addFund,
    updateFund,
    deleteFund,
    addWatchlistItem,
    removeWatchlistItem,
    seedSampleData,
  };
}
