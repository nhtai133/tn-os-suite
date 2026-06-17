import type { TNOSSnapshot, OSType } from "@tn-os/schemas";

export interface ExportSnapshotOptions {
  osType: OSType;
  owner: string;
  summary: Record<string, unknown>;
  entities: Record<string, unknown>;
  metrics?: Record<string, unknown>;
  risks?: string[];
  decisions?: Record<string, unknown>[];
  aiContext?: Record<string, unknown>;
}

export function buildSnapshot(opts: ExportSnapshotOptions): TNOSSnapshot {
  return {
    schema_version: "1.0.0",
    os_type: opts.osType,
    generated_at: new Date().toISOString(),
    owner: opts.owner,
    summary: opts.summary,
    entities: opts.entities,
    metrics: opts.metrics ?? {},
    risks: opts.risks ?? [],
    decisions: opts.decisions ?? [],
    ai_context: opts.aiContext ?? {},
  };
}

export function snapshotToJSON(snapshot: TNOSSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export function snapshotFilename(osType: OSType): string {
  const date = new Date().toISOString().split("T")[0];
  return `${osType.replace(/_/g, "-")}-export-${date}.tnos.json`;
}

export function downloadSnapshot(snapshot: TNOSSnapshot): void {
  const json = snapshotToJSON(snapshot);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = snapshotFilename(snapshot.os_type);
  a.click();
  URL.revokeObjectURL(url);
}
