"use client";

import { useCallback, useState } from "react";
import { useSnapshotStore, CHILD_OS_TYPES, OS_LABELS } from "@/store/useSnapshotStore";
import { importSnapshotFromFile, isStale } from "@tn-os/sync";
import { Card, Badge, Button } from "@tn-os/ui";
import type { OSType } from "@tn-os/schemas";

export default function ImportPage() {
  const { snapshots, hydrated, importSnapshot, removeSnapshot } = useSnapshotStore();
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setStatus(null);
    const result = await importSnapshotFromFile(file);
    if (result.success) {
      importSnapshot(result.snapshot);
      setStatus({ type: "success", message: `Imported ${OS_LABELS[result.snapshot.os_type]} snapshot (${new Date(result.snapshot.generated_at).toLocaleString()})` });
    } else {
      setStatus({ type: "error", message: result.errors.join(" · ") });
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

  if (!hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Import Snapshots</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Import <code className="text-blue-400">.tnos.json</code> exports from child OS apps</p>
      </div>

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

      {/* Status */}
      {status && (
        <div className={`px-4 py-3 rounded-lg text-sm border ${status.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
          {status.type === "success" ? "✓ " : "✗ "}{status.message}
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
