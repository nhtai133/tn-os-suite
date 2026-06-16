"use client";

import React from "react";
import { useSnapshotStore, CHILD_OS_TYPES, OS_LABELS } from "@/store/useSnapshotStore";
import { isStale } from "@tn-os/sync";
import { Card, Badge } from "@tn-os/ui";

function ScalarEntry({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs text-zinc-500 uppercase tracking-wider">{label}</div>
      <div className="text-sm text-zinc-200 font-medium mt-0.5">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

function extractScalarEntries(summary: Record<string, unknown>): Array<{ key: string; value: string | number }> {
  return Object.entries(summary)
    .filter((e): e is [string, string | number] => typeof e[1] === "number" || typeof e[1] === "string")
    .slice(0, 6)
    .map(([key, value]) => ({ key, value }));
}

export default function WeeklyReviewPage() {
  const { snapshots, hydrated } = useSnapshotStore();

  if (!hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);

  const hasAny = CHILD_OS_TYPES.some((t) => !!snapshots[t]);

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Weekly Review</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Week of {weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {CHILD_OS_TYPES.map((osType) => {
        const snap = snapshots[osType];
        if (!snap) return null;

        const stale = isStale(snap);
        const risks: string[] = Array.isArray(snap.risks) ? (snap.risks as string[]) : [];
        const summary = snap.summary as Record<string, unknown>;
        const aiContext = snap.ai_context as Record<string, unknown>;
        const scalarEntries = extractScalarEntries(summary);
        const portfolioNote = typeof aiContext["portfolio_summary"] === "string" ? aiContext["portfolio_summary"] : null;

        return (
          <Card
            key={osType}
            title={OS_LABELS[osType]}
            action={
              <div className="flex items-center gap-2">
                <Badge variant={stale ? "warning" : "success"}>{stale ? "Stale" : "Current"}</Badge>
                <span className="text-xs text-zinc-600">{new Date(snap.generated_at).toLocaleDateString()}</span>
              </div>
            }
          >
            <div className="mt-2 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
                {scalarEntries.map(({ key, value }) => (
                  <ScalarEntry key={key} label={key.replace(/_/g, " ")} value={value} />
                ))}
              </div>

              {risks.length > 0 && (
                <div>
                  <div className="text-xs text-zinc-600 uppercase tracking-wider mb-1">Risks</div>
                  <ul className="space-y-1">
                    {risks.map((r, i) => (
                      <li key={i} className="text-sm text-amber-400 flex items-start gap-2">
                        <span className="mt-0.5">⚠</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {portfolioNote !== null && (
                <div className="text-xs text-zinc-500 italic border-t border-zinc-800 pt-2 mt-2">
                  {portfolioNote}
                </div>
              )}
            </div>
          </Card>
        );
      })}

      {!hasAny && (
        <div className="border border-dashed border-zinc-800 rounded-xl p-10 text-center">
          <p className="text-zinc-600">No snapshots imported yet. Import at least one OS snapshot to see your weekly review.</p>
        </div>
      )}
    </div>
  );
}
