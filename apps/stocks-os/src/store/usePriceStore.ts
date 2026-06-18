"use client";

import { useState, useEffect, useCallback } from "react";
import type { PriceEntry, PriceSource } from "@/lib/price-types";

const STORAGE_KEY = "stocks_os_prices_v1";

type StoreData = { entries: PriceEntry[] };
const EMPTY: StoreData = { entries: [] };

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function load(): StoreData {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<StoreData>;
    return { entries: p.entries ?? [] };
  } catch {
    return EMPTY;
  }
}

function persist(data: StoreData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function usePriceStore() {
  const [data, setData] = useState<StoreData>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(load());
    setHydrated(true);
  }, []);

  const update = useCallback((fn: (prev: StoreData) => StoreData) => {
    setData((prev) => { const next = fn(prev); persist(next); return next; });
  }, []);

  const addEntry = useCallback(
    (e: Omit<PriceEntry, "id">) =>
      update((d) => ({ entries: [{ ...e, id: uid() }, ...d.entries] })),
    [update]
  );

  const deleteEntry = useCallback(
    (id: string) => update((d) => ({ entries: d.entries.filter((x) => x.id !== id) })),
    [update]
  );

  const getLatestPrice = useCallback(
    (symbol: string) =>
      data.entries
        .filter((e) => e.symbol === symbol)
        .sort((a, b) => b.date.localeCompare(a.date))[0],
    [data.entries]
  );

  const getHistory = useCallback(
    (symbol: string) =>
      data.entries
        .filter((e) => e.symbol === symbol)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.entries]
  );

  const addMockPrices = useCallback(
    (symbols: { symbol: string; basePrice: number; currency: "VND" | "USD" }[]) => {
      const today = new Date().toISOString().split("T")[0]!;
      update((d) => {
        const newEntries: PriceEntry[] = symbols.map(({ symbol, basePrice, currency }) => ({
          id: uid(),
          symbol,
          date: today,
          price: Math.round(basePrice * (0.97 + Math.random() * 0.06)),
          currency,
          source: "Mock" as PriceSource,
        }));
        return { entries: [...newEntries, ...d.entries] };
      });
    },
    [update]
  );

  return { hydrated, entries: data.entries, addEntry, deleteEntry, getLatestPrice, getHistory, addMockPrices };
}
