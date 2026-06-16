"use client";

import { useMemo } from "react";
import { Badge, Card, StatWidget } from "@tn-os/ui";
import { useSnapshotStore } from "@/store/useSnapshotStore";
import { useDecisionStore } from "@/store/useDecisionStore";
import { generateCeoBriefing, type BriefingSection, type BriefingTone } from "@/lib/ai-ceo/generate-ceo-briefing";

const toneBadge: Record<BriefingTone, "success" | "warning" | "danger" | "neutral"> = {
  good: "success",
  watch: "warning",
  risk: "danger",
  neutral: "neutral",
};

const toneText: Record<BriefingTone, string> = {
  good: "Good",
  watch: "Watch",
  risk: "Risk",
  neutral: "Neutral",
};

function BriefingSectionCard({ section }: { section: BriefingSection }) {
  return (
    <Card title={section.title} action={<Badge variant={toneBadge[section.tone]}>{toneText[section.tone]}</Badge>}>
      <div className="space-y-4">
        <p className="text-sm text-zinc-300 leading-relaxed">{section.summary}</p>
        <div className="grid grid-cols-2 gap-4">
          {section.metrics.map((metric) => (
            <StatWidget
              key={`${section.title}-${metric.label}`}
              label={metric.label}
              value={metric.value}
              trend={metric.tone === "good" ? "up" : metric.tone === "risk" ? "down" : "neutral"}
              className="min-w-0"
            />
          ))}
        </div>
        <ul className="space-y-2 border-t border-zinc-800 pt-3">
          {section.notes.map((note) => (
            <li key={note} className="text-sm text-zinc-400 leading-relaxed">
              {note}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function RankedList({ title, items, variant = "neutral" }: { title: string; items: string[]; variant?: "success" | "warning" | "danger" | "neutral" | "info" }) {
  return (
    <Card title={title}>
      <ol className="space-y-3">
        {items.map((item, index) => (
          <li key={`${title}-${item}`} className="flex gap-3 text-sm text-zinc-300 leading-relaxed">
            <Badge variant={variant}>{index + 1}</Badge>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export default function AiCeoPage() {
  const { snapshots, hydrated } = useSnapshotStore();
  const decisionStore = useDecisionStore();
  const briefing = useMemo(() => generateCeoBriefing(snapshots), [snapshots]);
  const openDecisions = decisionStore.decisions.filter((decision) => decision.status === "open").slice(0, 5);
  const sections = [
    briefing.sections.netWorthSummary,
    briefing.sections.allocationDrift,
    briefing.sections.tradingRisk,
    briefing.sections.businessPerformance,
    briefing.sections.cryptoExposure,
    briefing.sections.stocksExposure,
  ];

  if (!hydrated || !decisionStore.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs text-zinc-600 uppercase tracking-widest mb-1">Template AI Layer</div>
          <h1 className="text-2xl font-bold text-white">AI CEO Briefing</h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
            Deterministic executive briefing generated from imported child OS snapshots. No API key required.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={briefing.connectedSystems === 6 ? "success" : briefing.connectedSystems > 0 ? "warning" : "neutral"}>
            {briefing.connectedSystems}/6 connected
          </Badge>
          <Badge variant="info">{new Date(briefing.generatedAt).toLocaleString()}</Badge>
        </div>
      </div>

      <Card title="Executive Summary">
        <div className="space-y-3">
          <p className="text-lg text-zinc-100 leading-relaxed">{briefing.executiveSummary}</p>
          {briefing.missingSystems.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {briefing.missingSystems.map((system) => (
                <Badge key={system} variant="neutral">{system} missing</Badge>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {sections.map((section) => (
          <BriefingSectionCard key={section.title} section={section} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <RankedList title="Top 3 Risks" items={briefing.topRisks} variant="danger" />
        <RankedList title="Top 3 Opportunities" items={briefing.topOpportunities} variant="success" />
        <RankedList title="Top 3 Priorities This Week" items={briefing.topPriorities} variant="warning" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <RankedList title="Suggested Decisions" items={briefing.suggestedDecisions} variant="info" />
        <Card title="Open Decisions">
          <div className="space-y-3">
            {openDecisions.length === 0 && <p className="text-sm text-zinc-600">No open decisions.</p>}
            {openDecisions.map((decision) => (
              <a key={decision.id} href={`/decisions/${decision.id}`} className="block rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 transition-colors hover:border-blue-500/40">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-zinc-100">{decision.title}</span>
                  <Badge variant="info">{decision.category}</Badge>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{decision.context.slice(0, 120)}{decision.context.length > 120 ? "..." : ""}</p>
              </a>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <RankedList title="Weekly Action Plan" items={briefing.weeklyActionPlan} variant="neutral" />
      </div>
    </div>
  );
}
