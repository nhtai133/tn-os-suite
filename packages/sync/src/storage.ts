import type { TNOSSnapshot, OSType } from "@tn-os/schemas";

const STORAGE_KEY_PREFIX = "tnos_snapshot_";

export function saveSnapshot(snapshot: TNOSSnapshot): void {
  const key = `${STORAGE_KEY_PREFIX}${snapshot.os_type}`;
  localStorage.setItem(key, JSON.stringify(snapshot));
}

export function loadSnapshot(osType: OSType): TNOSSnapshot | null {
  const key = `${STORAGE_KEY_PREFIX}${osType}`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TNOSSnapshot;
  } catch {
    return null;
  }
}

export function loadAllSnapshots(): Partial<Record<OSType, TNOSSnapshot>> {
  const osTypes: OSType[] = [
    "wealth_os", "investment_os", "trading_os",
    "crypto_os", "stocks_os", "business_os",
  ];
  const result: Partial<Record<OSType, TNOSSnapshot>> = {};
  for (const osType of osTypes) {
    const snap = loadSnapshot(osType);
    if (snap) result[osType] = snap;
  }
  return result;
}

export function clearSnapshot(osType: OSType): void {
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${osType}`);
}
