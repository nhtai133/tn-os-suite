"use client";

import { useState, useEffect, useCallback } from "react";
import type { BrokerAccount } from "@/lib/broker-types";

const STORAGE_KEY = "stocks_os_brokers_v1";

type StoreData = { accounts: BrokerAccount[] };
const EMPTY: StoreData = { accounts: [] };

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function load(): StoreData {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<StoreData>;
    return { accounts: p.accounts ?? [] };
  } catch {
    return EMPTY;
  }
}

function persist(data: StoreData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useBrokerStore() {
  const [data, setData] = useState<StoreData>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(load());
    setHydrated(true);
  }, []);

  const update = useCallback((fn: (prev: StoreData) => StoreData) => {
    setData((prev) => { const next = fn(prev); persist(next); return next; });
  }, []);

  const addAccount = useCallback(
    (a: Omit<BrokerAccount, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      update((d) => ({ accounts: [{ ...a, id: uid(), createdAt: now, updatedAt: now }, ...d.accounts] }));
    },
    [update]
  );

  const updateAccount = useCallback(
    (a: BrokerAccount) =>
      update((d) => ({ accounts: d.accounts.map((x) => (x.id === a.id ? { ...a, updatedAt: new Date().toISOString() } : x)) })),
    [update]
  );

  const deleteAccount = useCallback(
    (id: string) => update((d) => ({ accounts: d.accounts.filter((x) => x.id !== id) })),
    [update]
  );

  return { hydrated, accounts: data.accounts, addAccount, updateAccount, deleteAccount };
}
