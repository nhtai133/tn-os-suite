"use client";

import { useState, useEffect, useCallback } from "react";
import type { WatchlistItem, WatchlistStatus } from "@/lib/watchlist-types";

const STORAGE_KEY = "stocks_os_watchlist_v2";

type StoreData = { items: WatchlistItem[] };
const EMPTY: StoreData = { items: [] };

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function load(): StoreData {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<StoreData>;
    return { items: p.items ?? [] };
  } catch {
    return EMPTY;
  }
}

function persist(data: StoreData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useWatchlistStore() {
  const [data, setData] = useState<StoreData>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(load());
    setHydrated(true);
  }, []);

  const update = useCallback((fn: (prev: StoreData) => StoreData) => {
    setData((prev) => {
      const next = fn(prev);
      persist(next);
      return next;
    });
  }, []);

  const addItem = useCallback(
    (item: Omit<WatchlistItem, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      update((d) => ({
        items: [{ ...item, id: uid(), createdAt: now, updatedAt: now }, ...d.items],
      }));
    },
    [update]
  );

  const updateItem = useCallback(
    (item: WatchlistItem) =>
      update((d) => ({
        items: d.items.map((x) =>
          x.id === item.id ? { ...item, updatedAt: new Date().toISOString() } : x
        ),
      })),
    [update]
  );

  const deleteItem = useCallback(
    (id: string) => update((d) => ({ items: d.items.filter((x) => x.id !== id) })),
    [update]
  );

  const getByStatus = useCallback(
    (status: WatchlistStatus) => data.items.filter((x) => x.status === status),
    [data.items]
  );

  const getByPortfolioType = useCallback(
    (portfolioType: string) => data.items.filter((x) => x.portfolioType === portfolioType),
    [data.items]
  );

  return {
    hydrated,
    items: data.items,
    addItem,
    updateItem,
    deleteItem,
    getByStatus,
    getByPortfolioType,
  };
}
