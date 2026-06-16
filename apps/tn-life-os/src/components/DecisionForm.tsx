"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card } from "@tn-os/ui";
import { CHILD_OS_TYPES, OS_LABELS } from "@/store/useSnapshotStore";
import {
  DECISION_CATEGORIES,
  createEmptyDecision,
  type Decision,
  type DecisionOption,
  type DecisionStatus,
} from "@/store/useDecisionStore";

type DecisionFormProps = {
  initialDecision?: Decision;
  onSubmit: (decision: Decision) => void;
};

const statusOptions: DecisionStatus[] = ["open", "decided", "reviewed", "archived"];

function optionScoreTone(score: number): "success" | "warning" | "danger" | "neutral" {
  if (score >= 8) return "success";
  if (score >= 5) return "warning";
  if (score > 0) return "danger";
  return "neutral";
}

export function DecisionForm({ initialDecision, onSubmit }: DecisionFormProps) {
  const router = useRouter();
  const [decision, setDecision] = useState<Decision>(() => initialDecision ?? createEmptyDecision());
  const optionAverage = useMemo(() => {
    const scored = decision.options.filter((option) => option.label.trim());
    if (scored.length === 0) return 0;
    return Math.round(scored.reduce((sum, option) => sum + option.score, 0) / scored.length);
  }, [decision.options]);

  function setField<K extends keyof Decision>(key: K, value: Decision[K]) {
    setDecision((prev) => ({ ...prev, [key]: value }));
  }

  function updateOption(id: string, patch: Partial<DecisionOption>) {
    setDecision((prev) => ({
      ...prev,
      options: prev.options.map((option) => (option.id === id ? { ...option, ...patch } : option)),
    }));
  }

  function addOption() {
    setDecision((prev) => ({
      ...prev,
      options: [...prev.options, { id: crypto.randomUUID(), label: "", score: 5, notes: "" }],
    }));
  }

  function removeOption(id: string) {
    setDecision((prev) => ({ ...prev, options: prev.options.filter((option) => option.id !== id) }));
  }

  function toggleOs(osType: string) {
    setDecision((prev) => ({
      ...prev,
      linked_os: prev.linked_os.includes(osType)
        ? prev.linked_os.filter((item) => item !== osType)
        : [...prev.linked_os, osType],
    }));
  }

  function submit() {
    const cleaned: Decision = {
      ...decision,
      title: decision.title.trim(),
      context: decision.context.trim(),
      chosen_option: decision.chosen_option.trim(),
      reason: decision.reason.trim(),
      risks: decision.risks.map((risk) => risk.trim()).filter(Boolean),
      expected_outcome: decision.expected_outcome.trim(),
      actual_outcome: decision.actual_outcome?.trim() || undefined,
      quality_score: decision.quality_score,
      options: decision.options
        .map((option) => ({ ...option, label: option.label.trim(), notes: option.notes.trim() }))
        .filter((option) => option.label),
    };
    onSubmit(cleaned);
    router.push(`/decisions/${cleaned.id}`);
  }

  return (
    <div className="space-y-5">
      <Card title="Decision">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs text-zinc-500 mb-1">Title</label>
            <input value={decision.title} onChange={(e) => setField("title", e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
              placeholder="e.g. Should I add to VCB this month?" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Category</label>
            <select value={decision.category} onChange={(e) => setField("category", e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500">
              {DECISION_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Status</label>
            <select value={decision.status} onChange={(e) => setField("status", e.target.value as DecisionStatus)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500">
              {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Review Date</label>
            <input type="date" value={decision.review_date} onChange={(e) => setField("review_date", e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Quality Score</label>
            <input type="number" min="0" max="100" value={decision.quality_score ?? ""}
              onChange={(e) => setField("quality_score", e.target.value === "" ? undefined : Number(e.target.value))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
              placeholder="0-100 after review" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-zinc-500 mb-1">Linked OS Snapshots</label>
            <div className="flex flex-wrap gap-2">
              {CHILD_OS_TYPES.map((osType) => {
                const active = decision.linked_os.includes(osType);
                return (
                  <button key={osType} type="button" onClick={() => toggleOs(osType)}
                    className={`rounded border px-3 py-1.5 text-xs transition-colors ${active ? "border-blue-500/40 bg-blue-500/10 text-blue-400" : "border-zinc-700 text-zinc-500 hover:text-zinc-300"}`}>
                    {OS_LABELS[osType]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-zinc-500 mb-1">Context</label>
            <textarea value={decision.context} onChange={(e) => setField("context", e.target.value)} rows={4}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Relevant facts from snapshots, constraints, and decision timing." />
          </div>
        </div>
      </Card>

      <Card title="Options" action={<Badge variant={optionScoreTone(optionAverage)}>Avg score {optionAverage || "-"}</Badge>}>
        <div className="space-y-3">
          {decision.options.map((option, index) => (
            <div key={option.id} className="grid grid-cols-1 md:grid-cols-[1fr_96px_1fr_auto] gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
              <input value={option.label} onChange={(e) => updateOption(option.id, { label: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                placeholder={`Option ${index + 1}`} />
              <input type="number" min="0" max="10" value={option.score} onChange={(e) => updateOption(option.id, { score: Number(e.target.value) })}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500" />
              <input value={option.notes} onChange={(e) => updateOption(option.id, { notes: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                placeholder="Pros, cons, or assumptions" />
              <Button variant="ghost" size="sm" onClick={() => removeOption(option.id)}>Remove</Button>
            </div>
          ))}
          <Button variant="secondary" onClick={addOption}>Add Option</Button>
        </div>
      </Card>

      <Card title="Decision Record">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Chosen Option</label>
            <input value={decision.chosen_option} onChange={(e) => setField("chosen_option", e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Risks (one per line)</label>
            <textarea value={decision.risks.join("\n")} onChange={(e) => setField("risks", e.target.value.split("\n"))} rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 resize-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-zinc-500 mb-1">Reason</label>
            <textarea value={decision.reason} onChange={(e) => setField("reason", e.target.value)} rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Expected Outcome</label>
            <textarea value={decision.expected_outcome} onChange={(e) => setField("expected_outcome", e.target.value)} rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Actual Outcome</label>
            <textarea value={decision.actual_outcome ?? ""} onChange={(e) => setField("actual_outcome", e.target.value)} rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 resize-none" />
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="primary" onClick={submit} disabled={!decision.title.trim()}>Save Decision</Button>
        <Button variant="ghost" onClick={() => router.push("/decisions")}>Cancel</Button>
      </div>
    </div>
  );
}
