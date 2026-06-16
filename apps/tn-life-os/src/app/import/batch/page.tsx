"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card } from "@tn-os/ui";
import { importSnapshotFromFile, isStale } from "@tn-os/sync";
import type { OSType, TNOSSnapshot } from "@tn-os/schemas";
import { CHILD_OS_TYPES, OS_LABELS, useSnapshotStore } from "@/store/useSnapshotStore";

type BatchResult = {
  fileName: string;
  status: "imported" | "replaced" | "skipped" | "rejected";
  osType?: OSType;
  generatedAt?: string;
  message: string;
  stale?: boolean;
};

function newerSnapshot(a: TNOSSnapshot, b: TNOSSnapshot): TNOSSnapshot {
  return new Date(a.generated_at).getTime() >= new Date(b.generated_at).getTime() ? a : b;
}

export default function BatchImportPage() {
  const { snapshots, hydrated, importSnapshot } = useSnapshotStore();
  const [results, setResults] = useState<BatchResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const summary = useMemo(() => ({
    imported: results.filter((result) => result.status === "imported").length,
    replaced: results.filter((result) => result.status === "replaced").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    rejected: results.filter((result) => result.status === "rejected").length,
  }), [results]);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    setProcessing(true);
    setResults([]);

    const selectedByOs = new Map<OSType, { fileName: string; snapshot: TNOSSnapshot }>();
    const nextResults: BatchResult[] = [];

    for (const file of fileArray) {
      const validation = await importSnapshotFromFile(file);
      if (!validation.success) {
        nextResults.push({
          fileName: file.name,
          status: "rejected",
          message: validation.errors.join(" | "),
        });
        continue;
      }

      const snapshot = validation.snapshot;
      const previous = selectedByOs.get(snapshot.os_type);
      if (previous) {
        const winner = newerSnapshot(snapshot, previous.snapshot);
        const loser = winner === snapshot ? previous : { fileName: file.name, snapshot };
        selectedByOs.set(snapshot.os_type, { fileName: winner === snapshot ? file.name : previous.fileName, snapshot: winner });
        nextResults.push({
          fileName: loser.fileName,
          status: "skipped",
          osType: loser.snapshot.os_type,
          generatedAt: loser.snapshot.generated_at,
          stale: isStale(loser.snapshot),
          message: `Duplicate ${OS_LABELS[loser.snapshot.os_type]} snapshot skipped; newer file in this batch will be used.`,
        });
        continue;
      }

      selectedByOs.set(snapshot.os_type, { fileName: file.name, snapshot });
    }

    for (const { fileName, snapshot } of selectedByOs.values()) {
      const existing = snapshots[snapshot.os_type];
      importSnapshot(snapshot);
      nextResults.push({
        fileName,
        status: existing ? "replaced" : "imported",
        osType: snapshot.os_type,
        generatedAt: snapshot.generated_at,
        stale: isStale(snapshot),
        message: existing
          ? `Replaced existing ${OS_LABELS[snapshot.os_type]} snapshot.`
          : `Imported ${OS_LABELS[snapshot.os_type]} snapshot.`,
      });
    }

    setResults(nextResults);
    setProcessing(false);
  }, [importSnapshot, snapshots]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    if (event.dataTransfer.files.length > 0) void processFiles(event.dataTransfer.files);
  }, [processFiles]);

  if (!hydrated) return <div className="p-4 md:p-8 text-zinc-600 animate-pulse">Loading...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/import" className="text-xs text-zinc-500 hover:text-zinc-300">Back to single import</Link>
          <h1 className="text-2xl font-bold text-white mt-2">Batch Snapshot Import</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Upload multiple `.tnos.json` files, validate them, and update TN Life OS snapshots in one pass.</p>
        </div>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${dragOver ? "border-blue-500 bg-blue-500/5" : "border-zinc-700 hover:border-zinc-600"}`}
      >
        <div className="text-3xl mb-3">↙</div>
        <p className="text-zinc-300 font-medium mb-1">Drop multiple .tnos.json files here</p>
        <p className="text-sm text-zinc-600 mb-4">Duplicate OS snapshots are resolved by newest generated timestamp.</p>
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-lg cursor-pointer border border-zinc-700 transition-colors">
          {processing ? "Processing..." : "Choose Files"}
          <input
            type="file"
            accept=".json"
            multiple
            className="hidden"
            disabled={processing}
            onChange={(event) => {
              const files = event.target.files;
              if (files) void processFiles(files);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Imported"><div className="text-2xl font-bold text-emerald-400">{summary.imported}</div></Card>
        <Card title="Replaced"><div className="text-2xl font-bold text-blue-400">{summary.replaced}</div></Card>
        <Card title="Skipped"><div className="text-2xl font-bold text-amber-400">{summary.skipped}</div></Card>
        <Card title="Rejected"><div className="text-2xl font-bold text-red-400">{summary.rejected}</div></Card>
      </div>

      <Card title="Connection Status">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CHILD_OS_TYPES.map((osType) => {
            const snapshot = snapshots[osType];
            const stale = snapshot ? isStale(snapshot) : false;
            return (
              <div key={osType} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
                <div>
                  <div className="text-sm text-zinc-200">{OS_LABELS[osType]}</div>
                  <div className="text-xs text-zinc-600">{snapshot ? new Date(snapshot.generated_at).toLocaleString() : "Not imported"}</div>
                </div>
                <Badge variant={!snapshot ? "neutral" : stale ? "warning" : "success"}>{!snapshot ? "Offline" : stale ? "Stale" : "Current"}</Badge>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Import Summary">
        <div className="space-y-3">
          {results.length === 0 && <p className="text-sm text-zinc-600">No batch import results yet.</p>}
          {results.map((result, index) => (
            <div key={`${result.fileName}-${index}`} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-zinc-100">{result.fileName}</div>
                  <div className="text-xs text-zinc-500">{result.message}</div>
                </div>
                <div className="flex items-center gap-2">
                  {result.osType && <Badge variant="neutral">{OS_LABELS[result.osType]}</Badge>}
                  {result.stale && <Badge variant="warning">Stale</Badge>}
                  <Badge variant={result.status === "rejected" ? "danger" : result.status === "skipped" ? "warning" : "success"}>{result.status}</Badge>
                </div>
              </div>
              {result.generatedAt && <div className="mt-2 text-xs text-zinc-600">Generated {new Date(result.generatedAt).toLocaleString()}</div>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
