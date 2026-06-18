"use client";

import { useEffect, useMemo, useState } from "react";
import type { PriceMap } from "@tn-os/market-data";

type PriceApiResponse = {
  prices: PriceMap;
  error?: string;
};

type LivePricesState = {
  prices: PriceMap;
  loading: boolean;
  error: string | null;
};

function normalizeSymbols(symbols: string[]): string[] {
  return Array.from(
    new Set(symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean)),
  ).sort();
}

export function useLivePrices(symbols: string[]): LivePricesState {
  const normalizedSymbols = useMemo(() => normalizeSymbols(symbols), [symbols]);
  const symbolKey = normalizedSymbols.join(",");
  const [state, setState] = useState<LivePricesState>({
    prices: {},
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!symbolKey) {
      setState({ prices: {}, loading: false, error: null });
      return;
    }

    const controller = new AbortController();
    const loadPrices = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await fetch(`/api/prices?symbols=${encodeURIComponent(symbolKey)}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as PriceApiResponse;
        if (!response.ok) {
          throw new Error(payload.error ?? `Price request failed with ${response.status}`);
        }
        setState({ prices: payload.prices, loading: false, error: null });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        const message = error instanceof Error ? error.message : "Unable to load live prices";
        setState((prev) => ({ ...prev, loading: false, error: message }));
      }
    };

    void loadPrices();
    const interval = window.setInterval(() => {
      void loadPrices();
    }, 60_000);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [symbolKey]);

  return state;
}
