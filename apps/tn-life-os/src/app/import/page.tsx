"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useSnapshotStore, CHILD_OS_TYPES, OS_LABELS } from "@/store/useSnapshotStore";
import { importSnapshotFromFile, isStale, syncAllLocalSnapshots, type LocalSyncResult } from "@tn-os/sync";
import { Card, Badge, Button } from "@tn-os/ui";
import type { OSType } from "@tn-os/schemas";
import { getOSAppUrl } from "@/lib/os-app-links";

const SYNC_STATUS_LABEL: Record<LocalSyncResult["status"], string> = {
  synced: "Synced",
  not_found: "No local data",
  validation_failed: "Validation failed",
  timeout: "Timeout",
};

const SYNC_STATUS_VARIANT: Record<LocalSyncResult["status"], "success" | "neutral" | "danger" | "warning"> = {
  synced: "success",
  not_found: "neutral",
  validation_failed: "danger",
  timeout: "warning",
};

export default function ImportPage() {
  const { snapshots, hydrated, importSnapshot, removeSnapshot } = useSnapshotStore();
  const [dragOver, setDragOver] = useState(false);
  const [fileStatus, setFileStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<LocalSyncResult[] | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setFileStatus(null);
    const result = await importSnapshotFromFile(file);
    if (result.success) {
      importSnapshot(result.snapshot);
      setFileStatus({ type: "success", message: `Imported ${OS_LABELS[result.snapshot.os_type]} snapshot (${new Date(result.snapshot.generated_at).toLocaleString()})` });
    } else {
      setFileStatus({ type: "error", message: result.errors.join(" · ") });
    }
  }, [importSnapshot]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  }, [handleFile]);

  const handleAutoSync = useCallback(async () => {
    setSyncing(true);
    setSyncResults(null);
    setFileStatus(null);
    const results = await syncAllLocalSnapshots(CHILD_OS_TYPES);
    for (const result of results) {
      if (result.status === "synced" && result.snapshot) {
        importSnapshot(result.snapshot);
      }
    }
    setSyncResults(results);
    setSyncing(false);
  }, [importSnapshot]);

  if (!hydrated) return <div className="p-4 md:p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const allNotFound = syncResults !== null && syncResults.every((r) => r.status === "not_found" || r.status === "timeout");
  const syncedCount = syncResults?.filter((r) => r.status === "synced").length ?? 0;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Import Snapshots</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Import <code className="text-blue-400">.tnos.json</code> exports from child OS apps</p>
      </div>

      {/* Auto Sync */}
      <Card title="Auto Sync">
        <div className="space-y-4 mt-2">
          <p className="text-sm text-zinc-400">
            Automatically pull snapshots from all child OS apps running in this browser. No file upload needed.
          </p>
          <button
            onClick={() => { void handleAutoSync(); }}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing && (
              <span className="inline-block w-3.5 h-3.5 border-2 border-emerald-400/40 border-t-emerald-400 rounded-full animate-spin" />
            )}
            {syncing ? "Syncing…" : "Sync All Local Apps"}
          </button>

          {syncResults && (
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">
                Sync Results — {syncedCount} synced
              </div>
              {syncResults.map((result) => (
                <div key={result.osType} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-zinc-300">{OS_LABELS[result.osType]}</span>
                  <div className="flex items-center gap-2">
                    {result.status === "validation_failed" && result.errors && (
                      <span className="text-xs text-red-400 max-w-[180px] truncate" title={result.errors.join("; ")}>
                        {result.errors[0]}
                      </span>
                    )}
                    <Badge variant={SYNC_STATUS_VARIANT[result.status]}>
                      {SYNC_STATUS_LABEL[result.status]}
                    </Badge>
                  </div>
                </div>
              ))}

              {allNotFound && (
                <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-500 space-y-1">
                  <p className="font-medium text-zinc-400">No local data found in any child app.</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs mt-2">
                    <li>Open each child OS app using the links below or in the dashboard.</li>
                    <li>Add or load sample data inside the app.</li>
                    <li>Return here and click <strong className="text-zinc-300">Sync All Local Apps</strong> again.</li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Batch Import */}
      <Card title="Batch Import">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">Import multiple child OS snapshots at once and replace older snapshots by OS type.</p>
          <Link href="/import/batch" className="shrink-0 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/20">
            Open Batch Import
          </Link>
        </div>
      </Card>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${dragOver ? "border-blue-500 bg-blue-500/5" : "border-zinc-700 hover:border-zinc-600"}`}
      >
        <div className="text-3xl mb-3">↙</div>
        <p className="text-zinc-300 font-medium mb-1">Drop a .tnos.json file here</p>
        <p className="text-sm text-zinc-600 mb-4">or click to browse</p>
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-lg cursor-pointer border border-zinc-700 transition-colors">
          Choose File
          <input type="file" accept=".json" className="hidden" onChange={handleFileInput} />
        </label>
      </div>

      {/* File import status */}
      {fileStatus && (
        <div className={`px-4 py-3 rounded-lg text-sm border ${fileStatus.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
          {fileStatus.type === "success" ? "✓ " : "✗ "}{fileStatus.message}
        </div>
      )}

      {/* Connected OS list */}
      <Card title="Connected OS Snapshots">
        <div className="space-y-3 mt-2">
          {CHILD_OS_TYPES.map((osType: OSType) => {
            const snap = snapshots[osType];
            const stale = snap ? isStale(snap) : false;
            return (
              <div key={osType} className="flex items-center justify-between py-2 border-b border-zinc-800/60 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${snap ? "bg-emerald-400" : "bg-zinc-700"}`} />
                  <div>
                    <div className="text-sm text-zinc-200">{OS_LABELS[osType]}</div>
                    {snap && (
                      <div className="text-xs text-zinc-500">
                        {new Date(snap.generated_at).toLocaleString()}
                        {stale && " · "}
                        {stale && <span className="text-amber-400">stale</span>}
                      </div>
                    )}
                    {!snap && <div className="text-xs text-zinc-600">Not imported</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={getOSAppUrl(osType)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Open App →
                  </a>
                  {snap && (
                    <>
                      <Badge variant={stale ? "warning" : "success"}>{stale ? "Stale" : "Current"}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => removeSnapshot(osType)}>Remove</Button>
                    </>
                  )}
                  {!snap && <Badge variant="neutral">Offline</Badge>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Protocol Info">
        <div className="space-y-2 mt-2 text-sm text-zinc-400">
          <div className="flex justify-between"><span>File extension</span><code className="text-blue-400">.tnos.json</code></div>
          <div className="flex justify-between"><span>Schema version</span><code className="text-zinc-200">1.0.0</code></div>
          <div className="flex justify-between"><span>Stale threshold</span><span className="text-zinc-200">7 days</span></div>
          <div className="flex justify-between"><span>Data ownership</span><span className="text-zinc-200">Read-only</span></div>
        </div>
      </Card>
    </div>
  );
}
