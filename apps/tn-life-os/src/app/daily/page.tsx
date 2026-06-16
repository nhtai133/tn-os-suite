"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Card } from "@tn-os/ui";
import { useSnapshotStore } from "@/store/useSnapshotStore";
import { useDecisionStore } from "@/store/useDecisionStore";
import { generateCeoBriefing } from "@/lib/ai-ceo/generate-ceo-briefing";

const STORAGE_KEY = "tn_life_os_daily_command";

type DailyNote = {
  date: string;
  personalNote: string;
  reflection: string;
};

function todayKey(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

function readDailyNote(): DailyNote {
  const fallback = { date: todayKey(), personalNote: "", reflection: "" };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<DailyNote>;
    return {
      date: typeof parsed.date === "string" ? parsed.date : fallback.date,
      personalNote: typeof parsed.personalNote === "string" ? parsed.personalNote : "",
      reflection: typeof parsed.reflection === "string" ? parsed.reflection : "",
    };
  } catch {
    return fallback;
  }
}

function writeDailyNote(note: DailyNote): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(note));
}

function summaryText(value: string | undefined, fallback: string): string {
  return value && value.trim() ? value : fallback;
}

export default function DailyCommandPage() {
  const snapshotStore = useSnapshotStore();
  const decisionStore = useDecisionStore();
  const briefing = useMemo(() => generateCeoBriefing(snapshotStore.snapshots), [snapshotStore.snapshots]);
  const [note, setNote] = useState<DailyNote>(() => ({ date: todayKey(), personalNote: "", reflection: "" }));

  useEffect(() => {
    setNote(readDailyNote());
  }, []);

  useEffect(() => {
    if (snapshotStore.hydrated && decisionStore.hydrated) writeDailyNote(note);
  }, [note, snapshotStore.hydrated, decisionStore.hydrated]);

  if (!snapshotStore.hydrated || !decisionStore.hydrated) return <div className="p-4 md:p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const tradingSection = briefing.sections.tradingRisk;
  const businessSection = briefing.sections.businessPerformance;
  const wealthSection = briefing.sections.netWorthSummary;
  const allocationSection = briefing.sections.allocationDrift;
  const openDecision = decisionStore.decisions.find((decision) => decision.status === "open");

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs text-zinc-600 uppercase tracking-widest mb-1">Daily Operating Rhythm</div>
          <h1 className="text-2xl font-bold text-white">Daily Command Center</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
        </div>
        <Badge variant={briefing.connectedSystems === 6 ? "success" : "warning"}>{briefing.connectedSystems}/6 systems connected</Badge>
      </div>

      <Card title="Today Focus">
        <p className="text-lg text-zinc-100 leading-relaxed">{briefing.topPriorities[0]}</p>
        {openDecision && (
          <Link href={`/decisions/${openDecision.id}`} className="mt-3 inline-flex text-sm text-blue-400 hover:text-blue-300">
            Open decision to resolve: {openDecision.title}
          </Link>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Top 3 Priorities">
          <ol className="space-y-3">
            {briefing.topPriorities.map((priority, index) => (
              <li key={priority} className="flex gap-3 text-sm text-zinc-300">
                <Badge variant="warning">{index + 1}</Badge>
                <span>{priority}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card title="Trading Risk Reminder" action={<Badge variant={tradingSection.tone === "risk" ? "danger" : tradingSection.tone === "watch" ? "warning" : "success"}>{tradingSection.tone}</Badge>}>
          <p className="text-sm text-zinc-300 leading-relaxed">{summaryText(tradingSection.notes[0], tradingSection.summary)}</p>
        </Card>

        <Card title="Business Action" action={<Badge variant={businessSection.tone === "risk" ? "danger" : businessSection.tone === "watch" ? "warning" : "success"}>{businessSection.tone}</Badge>}>
          <p className="text-sm text-zinc-300 leading-relaxed">{summaryText(businessSection.notes.at(-1), businessSection.summary)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Wealth / Investment Note">
          <div className="space-y-3">
            <p className="text-sm text-zinc-300 leading-relaxed">{wealthSection.summary}</p>
            <p className="text-sm text-zinc-500 leading-relaxed">{allocationSection.summary}</p>
          </div>
        </Card>

        <Card title="Personal Note">
          <textarea
            value={note.personalNote}
            onChange={(event) => setNote((prev) => ({ ...prev, date: todayKey(), personalNote: event.target.value }))}
            rows={6}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500 resize-none"
            placeholder="What matters personally today?"
          />
        </Card>
      </div>

      <Card title="End-of-day Reflection">
        <textarea
          value={note.reflection}
          onChange={(event) => setNote((prev) => ({ ...prev, date: todayKey(), reflection: event.target.value }))}
          rows={5}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500 resize-none"
          placeholder="What happened, what changed, and what should tomorrow inherit?"
        />
      </Card>
    </div>
  );
}
