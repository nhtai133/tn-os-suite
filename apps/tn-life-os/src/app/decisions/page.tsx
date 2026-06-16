"use client";

import Link from "next/link";
import { Badge, Card, Table } from "@tn-os/ui";
import { useDecisionStore, type Decision, type DecisionStatus } from "@/store/useDecisionStore";
import { OS_LABELS } from "@/store/useSnapshotStore";
import type { OSType } from "@tn-os/schemas";

const statusVariant: Record<DecisionStatus, "info" | "success" | "warning" | "neutral"> = {
  open: "info",
  decided: "warning",
  reviewed: "success",
  archived: "neutral",
};

function isDue(reviewDate: string): boolean {
  if (!reviewDate) return false;
  return new Date(`${reviewDate}T23:59:59`).getTime() <= Date.now();
}

export default function DecisionsPage() {
  const store = useDecisionStore();
  const openCount = store.decisions.filter((decision) => decision.status === "open").length;
  const dueCount = store.decisions.filter((decision) => decision.status !== "archived" && isDue(decision.review_date)).length;
  const reviewedCount = store.decisions.filter((decision) => decision.status === "reviewed").length;

  if (!store.hydrated) return <div className="p-4 md:p-8 text-zinc-600 animate-pulse">Loading...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Decision Registry</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Track major decisions, review outcomes, and improve decision quality.</p>
        </div>
        <Link href="/decisions/new" className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500">
          New Decision
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Total"><div className="text-2xl font-bold text-white">{store.decisions.length}</div></Card>
        <Card title="Open"><div className="text-2xl font-bold text-blue-400">{openCount}</div></Card>
        <Card title="Due Review"><div className="text-2xl font-bold text-amber-400">{dueCount}</div></Card>
        <Card title="Reviewed"><div className="text-2xl font-bold text-emerald-400">{reviewedCount}</div></Card>
      </div>

      <Card>
        <Table<Decision>
          data={store.decisions}
          keyExtractor={(decision) => decision.id}
          emptyMessage="No decisions recorded yet."
          columns={[
            {
              key: "title",
              header: "Decision",
              render: (decision) => (
                <div>
                  <Link href={`/decisions/${decision.id}`} className="font-medium text-zinc-100 hover:text-blue-400">
                    {decision.title}
                  </Link>
                  <div className="text-xs text-zinc-500">{decision.context.slice(0, 80)}{decision.context.length > 80 ? "..." : ""}</div>
                </div>
              ),
            },
            { key: "category", header: "Category", render: (decision) => <Badge variant="neutral">{decision.category}</Badge> },
            { key: "status", header: "Status", render: (decision) => <Badge variant={statusVariant[decision.status]}>{decision.status}</Badge> },
            {
              key: "linked_os",
              header: "Linked OS",
              render: (decision) => (
                <div className="flex flex-wrap gap-1">
                  {decision.linked_os.length === 0 && <span className="text-zinc-600">-</span>}
                  {decision.linked_os.map((osType) => (
                    <Badge key={osType} variant="neutral">{OS_LABELS[osType as OSType] ?? osType}</Badge>
                  ))}
                </div>
              ),
            },
            { key: "review_date", header: "Review", render: (decision) => <span className={isDue(decision.review_date) ? "text-amber-400 text-xs" : "text-zinc-500 text-xs"}>{decision.review_date || "-"}</span> },
            { key: "quality_score", header: "Quality", render: (decision) => <span className="text-zinc-300">{decision.quality_score ?? "-"}</span> },
            {
              key: "actions",
              header: "",
              render: (decision) => (
                <Link href={`/decisions/${decision.id}`} className="text-xs text-blue-400 hover:text-blue-300">Open</Link>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
