"use client";

import { useState, useEffect, useCallback } from "react";
import type { TNOSSnapshot, OSType } from "@tn-os/schemas";
import { loadAllSnapshots, saveSnapshot, clearSnapshot } from "@tn-os/sync";

const OS_LABELS: Record<OSType, string> = {
  life_os: "Life OS",
  wealth_os: "Wealth OS",
  investment_os: "Investment OS",
  trading_os: "Trading OS",
  crypto_os: "Crypto OS",
  stocks_os: "Stocks OS",
  business_os: "Business OS",
};

export { OS_LABELS };

export type SnapshotMap = Partial<Record<OSType, TNOSSnapshot>>;

export function useSnapshotStore() {
  const [snapshots, setSnapshots] = useState<SnapshotMap>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSnapshots(loadAllSnapshots());
    setHydrated(true);
  }, []);

  const importSnapshot = useCallback((snapshot: TNOSSnapshot) => {
    saveSnapshot(snapshot);
    setSnapshots((prev) => ({ ...prev, [snapshot.os_type]: snapshot }));
  }, []);

  const removeSnapshot = useCallback((osType: OSType) => {
    clearSnapshot(osType);
    setSnapshots((prev) => {
      const next = { ...prev };
      delete next[osType];
      return next;
    });
  }, []);

  return { snapshots, hydrated, importSnapshot, removeSnapshot };
}

export const CHILD_OS_TYPES: OSType[] = [
  "wealth_os", "investment_os", "trading_os",
  "crypto_os", "stocks_os", "business_os",
];
