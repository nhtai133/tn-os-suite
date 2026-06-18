"use client";

import { useState, useEffect, useCallback } from "react";
import type { DividendEvent } from "@/lib/dividend-types";

const STORAGE_KEY = "stocks_os_dividends_v1";

type StoreData = { events: DividendEvent[] };
const EMPTY: StoreData = { events: [] };

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function load(): StoreData {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<StoreData>;
    return { events: p.events ?? [] };
  } catch {
    return EMPTY;
  }
}

function persist(data: StoreData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useDividendStore() {
  const [data, setData] = useState<StoreData>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(load());
    setHydrated(true);
  }, []);

  const update = useCallback((fn: (prev: StoreData) => StoreData) => {
    setData((prev) => { const next = fn(prev); persist(next); return next; });
  }, []);

  const addDividend = useCallback(
    (e: Omit<DividendEvent, "id">) =>
      update((d) => ({ events: [{ ...e, id: uid() }, ...d.events] })),
    [update]
  );

  const updateDividend = useCallback(
    (e: DividendEvent) =>
      update((d) => ({ events: d.events.map((x) => (x.id === e.id ? e : x)) })),
    [update]
  );

  const deleteDividend = useCallback(
    (id: string) =>
      update((d) => ({ events: d.events.filter((x) => x.id !== id) })),
    [update]
  );

  const getByPortfolio = useCallback(
    (portfolioId: string) => data.events.filter((e) => e.portfolioId === portfolioId),
    [data.events]
  );

  const getBySymbol = useCallback(
    (symbol: string) => data.events.filter((e) => e.symbol === symbol),
    [data.events]
  );

  const getByBroker = useCallback(
    (broker: string) => data.events.filter((e) => (e.broker ?? "Unknown") === broker),
    [data.events]
  );

  return {
    hydrated,
    events: data.events,
    addDividend,
    updateDividend,
    deleteDividend,
    getByPortfolio,
    getBySymbol,
    getByBroker,
  };
}
