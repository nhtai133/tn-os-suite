"use client";

import { useState, useEffect, useCallback } from "react";
import type { CompanyThesis } from "@/lib/thesis-types";

const STORAGE_KEY = "stocks_os_thesis_v2";

type StoreData = { theses: CompanyThesis[] };
const EMPTY: StoreData = { theses: [] };

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function load(): StoreData {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<StoreData>;
    return { theses: p.theses ?? [] };
  } catch {
    return EMPTY;
  }
}

function persist(data: StoreData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useThesisStore() {
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

  const addThesis = useCallback(
    (t: Omit<CompanyThesis, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      update((d) => ({
        theses: [{ ...t, id: uid(), createdAt: now, updatedAt: now }, ...d.theses],
      }));
    },
    [update]
  );

  const updateThesis = useCallback(
    (t: CompanyThesis) =>
      update((d) => ({
        theses: d.theses.map((x) =>
          x.id === t.id ? { ...t, updatedAt: new Date().toISOString() } : x
        ),
      })),
    [update]
  );

  const deleteThesis = useCallback(
    (id: string) => update((d) => ({ theses: d.theses.filter((x) => x.id !== id) })),
    [update]
  );

  const getBySymbol = useCallback(
    (symbol: string) => data.theses.find((x) => x.symbol === symbol),
    [data.theses]
  );

  const getDueForReview = useCallback(() => {
    const today = new Date().toISOString().split("T")[0]!;
    return data.theses.filter((x) => x.nextReviewDate && x.nextReviewDate <= today);
  }, [data.theses]);

  return {
    hydrated,
    theses: data.theses,
    addThesis,
    updateThesis,
    deleteThesis,
    getBySymbol,
    getDueForReview,
  };
}
