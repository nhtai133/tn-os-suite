"use client";

import { useState, useEffect, useCallback } from "react";
import type { RebalanceTarget } from "@/lib/rebalance-types";

const STORAGE_KEY = "stocks_os_rebalance_v1";

type StoreData = { targets: RebalanceTarget[] };
const EMPTY: StoreData = { targets: [] };

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function load(): StoreData {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<StoreData>;
    return { targets: p.targets ?? [] };
  } catch {
    return EMPTY;
  }
}

function persist(data: StoreData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useRebalanceStore() {
  const [data, setData] = useState<StoreData>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(load());
    setHydrated(true);
  }, []);

  const update = useCallback((fn: (prev: StoreData) => StoreData) => {
    setData((prev) => { const next = fn(prev); persist(next); return next; });
  }, []);

  const addTarget = useCallback(
    (t: Omit<RebalanceTarget, "id">) =>
      update((d) => ({ targets: [{ ...t, id: uid() }, ...d.targets] })),
    [update]
  );

  const updateTarget = useCallback(
    (t: RebalanceTarget) =>
      update((d) => ({ targets: d.targets.map((x) => (x.id === t.id ? t : x)) })),
    [update]
  );

  const deleteTarget = useCallback(
    (id: string) => update((d) => ({ targets: d.targets.filter((x) => x.id !== id) })),
    [update]
  );

  const getByPortfolio = useCallback(
    (portfolioId: string) => data.targets.filter((x) => x.portfolioId === portfolioId),
    [data.targets]
  );

  return { hydrated, targets: data.targets, addTarget, updateTarget, deleteTarget, getByPortfolio };
}
