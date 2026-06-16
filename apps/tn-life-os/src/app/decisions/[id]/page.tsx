"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Badge, Button, Card } from "@tn-os/ui";
import { DecisionForm } from "@/components/DecisionForm";
import { useDecisionStore, type DecisionStatus } from "@/store/useDecisionStore";
import { OS_LABELS } from "@/store/useSnapshotStore";
import type { OSType } from "@tn-os/schemas";

const statusVariant: Record<DecisionStatus, "info" | "success" | "warning" | "neutral"> = {
  open: "info",
  decided: "warning",
  reviewed: "success",
  archived: "neutral",
};

export default function DecisionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const store = useDecisionStore();
  const [editing, setEditing] = useState(false);
  const decision = useMemo(() => store.decisions.find((item) => item.id === params.id), [store.decisions, params.id]);

  if (!store.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  if (!decision) {
    return (
      <div className="p-8 space-y-4">
        <Link href="/decisions" className="text-xs text-zinc-500 hover:text-zinc-300">Back to decisions</Link>
        <Card title="Decision not found">
          <p className="text-sm text-zinc-500">This decision may have been deleted or archived in another browser session.</p>
        </Card>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="p-8 space-y-6 max-w-5xl">
        <div>
          <button onClick={() => setEditing(false)} className="text-xs text-zinc-500 hover:text-zinc-300">Back to detail</button>
          <h1 className="text-2xl font-bold text-white mt-2">Edit Decision</h1>
        </div>
        <DecisionForm initialDecision={decision} onSubmit={(next) => { store.updateDecision(next); setEditing(false); }} />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/decisions" className="text-xs text-zinc-500 hover:text-zinc-300">Back to decisions</Link>
          <h1 className="text-2xl font-bold text-white mt-2">{decision.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={statusVariant[decision.status]}>{decision.status}</Badge>
            <Badge variant="neutral">{decision.category}</Badge>
            {decision.quality_score !== undefined && <Badge variant="info">Quality {decision.quality_score}/100</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
          <Button variant="danger" onClick={() => { store.deleteDecision(decision.id); router.push("/decisions"); }}>Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Context" className="lg:col-span-2">
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{decision.context || "No context recorded."}</p>
        </Card>
        <Card title="Review">
          <div className="space-y-3 text-sm">
            <div><div className="text-xs text-zinc-500">Review Date</div><div className="text-zinc-200">{decision.review_date || "-"}</div></div>
            <div><div className="text-xs text-zinc-500">Created</div><div className="text-zinc-200">{new Date(decision.created_at).toLocaleDateString()}</div></div>
            <div><div className="text-xs text-zinc-500">Updated</div><div className="text-zinc-200">{new Date(decision.updated_at).toLocaleDateString()}</div></div>
          </div>
        </Card>
      </div>

      <Card title="Linked OS Snapshots">
        <div className="flex flex-wrap gap-2">
          {decision.linked_os.length === 0 && <span className="text-sm text-zinc-600">No linked snapshots.</span>}
          {decision.linked_os.map((osType) => <Badge key={osType} variant="neutral">{OS_LABELS[osType as OSType] ?? osType}</Badge>)}
        </div>
      </Card>

      <Card title="Options">
        <div className="space-y-3">
          {decision.options.length === 0 && <p className="text-sm text-zinc-600">No options recorded.</p>}
          {decision.options.map((option) => (
            <div key={option.id} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-zinc-100">{option.label}</div>
                <Badge variant={option.score >= 8 ? "success" : option.score >= 5 ? "warning" : "danger"}>{option.score}/10</Badge>
              </div>
              {option.notes && <p className="mt-2 text-sm text-zinc-500">{option.notes}</p>}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Chosen Option"><p className="text-sm text-zinc-300 whitespace-pre-wrap">{decision.chosen_option || "-"}</p></Card>
        <Card title="Reason"><p className="text-sm text-zinc-300 whitespace-pre-wrap">{decision.reason || "-"}</p></Card>
        <Card title="Risks">
          <ul className="space-y-2">
            {decision.risks.length === 0 && <li className="text-sm text-zinc-600">No risks recorded.</li>}
            {decision.risks.map((risk) => <li key={risk} className="text-sm text-amber-400">{risk}</li>)}
          </ul>
        </Card>
        <Card title="Outcome Tracking">
          <div className="space-y-3">
            <div><div className="text-xs text-zinc-500">Expected</div><p className="text-sm text-zinc-300 whitespace-pre-wrap">{decision.expected_outcome || "-"}</p></div>
            <div><div className="text-xs text-zinc-500">Actual</div><p className="text-sm text-zinc-300 whitespace-pre-wrap">{decision.actual_outcome || "-"}</p></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
