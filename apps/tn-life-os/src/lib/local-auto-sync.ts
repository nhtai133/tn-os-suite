import type { OSType, TNOSSnapshot } from "@tn-os/schemas";
import { validateSnapshot } from "@tn-os/sync";

export type LocalSyncStatus = "synced" | "not_found" | "validation_failed" | "timeout";

export type LocalSyncResult = {
  osType: OSType;
  status: LocalSyncStatus;
  snapshot?: TNOSSnapshot;
  errors?: string[];
};

const CHILD_ORIGINS: Partial<Record<OSType, string>> = {
  wealth_os:    process.env.NEXT_PUBLIC_WEALTH_OS_URL    ?? "http://localhost:3003",
  investment_os:process.env.NEXT_PUBLIC_INVESTMENT_OS_URL ?? "http://localhost:3001",
  trading_os:   process.env.NEXT_PUBLIC_TRADING_OS_URL   ?? "http://localhost:3002",
  crypto_os:    process.env.NEXT_PUBLIC_CRYPTO_OS_URL    ?? "http://localhost:3005",
  stocks_os:    process.env.NEXT_PUBLIC_STOCKS_OS_URL    ?? "http://localhost:3006",
  business_os:  process.env.NEXT_PUBLIC_BUSINESS_OS_URL  ?? "http://localhost:3004",
};

const SYNC_TIMEOUT_MS = 8000;

type SnapshotRequestMessage = { type: "TNOS_SNAPSHOT_REQUEST" };
type ReadyMessage = { type: "TNOS_READY" };
type SnapshotResponseMessage = { type: "TNOS_SNAPSHOT_RESPONSE"; payload?: unknown };

export function discoverLocalChildOSData(osType: OSType): Promise<string | null> {
  const origin = CHILD_ORIGINS[osType];
  if (!origin) return Promise.resolve(null);

  return new Promise<string | null>((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none;";
    iframe.src = `${origin}/export`;

    let done = false;
    let awaitingResponse = false;
    const timeoutId = setTimeout(() => finish(null), SYNC_TIMEOUT_MS);

    function finish(payload: string | null) {
      if (done) return;
      done = true;
      clearTimeout(timeoutId);
      window.removeEventListener("message", onMessage);
      try { iframe.remove(); } catch { /* already removed */ }
      resolve(payload);
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== origin) return;
      const data = event.data as ReadyMessage | SnapshotResponseMessage | unknown;

      if (!awaitingResponse && (data as ReadyMessage).type === "TNOS_READY") {
        awaitingResponse = true;
        const req: SnapshotRequestMessage = { type: "TNOS_SNAPSHOT_REQUEST" };
        iframe.contentWindow?.postMessage(req, origin);
        return;
      }

      if (awaitingResponse && (data as SnapshotResponseMessage).type === "TNOS_SNAPSHOT_RESPONSE") {
        const { payload } = data as SnapshotResponseMessage;
        finish(typeof payload === "string" ? payload : null);
      }
    }

    window.addEventListener("message", onMessage);
    document.body.appendChild(iframe);
    iframe.onerror = () => finish(null);
  });
}

export async function buildLocalSnapshotForOS(osType: OSType): Promise<LocalSyncResult> {
  try {
    const raw = await discoverLocalChildOSData(osType);
    if (raw === null) return { osType, status: "not_found" };

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      return { osType, status: "validation_failed", errors: ["Response is not valid JSON"] };
    }

    const result = validateSnapshot(parsed);
    if (!result.success) {
      return { osType, status: "validation_failed", errors: result.errors };
    }

    return { osType, status: "synced", snapshot: result.snapshot };
  } catch {
    return { osType, status: "timeout" };
  }
}

export function syncAllLocalSnapshots(osTypes: OSType[]): Promise<LocalSyncResult[]> {
  return Promise.all(osTypes.map((t) => buildLocalSnapshotForOS(t)));
}
