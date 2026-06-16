"use client";

import { useState, useEffect, useCallback } from "react";

export const DECISION_CATEGORIES = [
  "Wealth",
  "Investment",
  "Trading",
  "Business",
  "Crypto",
  "Stocks",
  "Health",
  "Family",
  "Real Estate",
  "Learning",
] as const;

export type DecisionStatus = "open" | "decided" | "reviewed" | "archived";

export type DecisionOption = {
  id: string;
  label: string;
  score: number;
  notes: string;
};

export type Decision = {
  id: string;
  title: string;
  category: string;
  linked_os: string[];
  context: string;
  options: DecisionOption[];
  chosen_option: string;
  reason: string;
  risks: string[];
  expected_outcome: string;
  actual_outcome?: string;
  review_date: string;
  status: DecisionStatus;
  quality_score?: number;
  created_at: string;
  updated_at: string;
};

type LegacyDecision = {
  decision_id?: string;
  title?: string;
  category?: string;
  linked_os?: string;
  context?: string;
  options?: string[];
  chosen_option?: string;
  reason?: string;
  risk?: "low" | "medium" | "high";
  date?: string;
  review_date?: string;
  outcome?: string;
};

const STORAGE_KEY = "tn_life_os_decisions";

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function today(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

export function createEmptyDecision(): Decision {
  const now = new Date().toISOString();
  return {
    id: uid(),
    title: "",
    category: "Investment",
    linked_os: [],
    context: "",
    options: [
      { id: uid(), label: "", score: 5, notes: "" },
      { id: uid(), label: "", score: 5, notes: "" },
    ],
    chosen_option: "",
    reason: "",
    risks: [],
    expected_outcome: "",
    actual_outcome: "",
    review_date: today(),
    status: "open",
    quality_score: undefined,
    created_at: now,
    updated_at: now,
  };
}

function normalizeOption(value: unknown): DecisionOption | null {
  if (typeof value === "string") return { id: uid(), label: value, score: 5, notes: "" };
  if (!value || typeof value !== "object") return null;
  const option = value as Partial<DecisionOption>;
  if (typeof option.label !== "string") return null;
  return {
    id: typeof option.id === "string" ? option.id : uid(),
    label: option.label,
    score: typeof option.score === "number" ? option.score : 5,
    notes: typeof option.notes === "string" ? option.notes : "",
  };
}

function normalizeDecision(value: unknown): Decision | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<Decision> & LegacyDecision;
  const now = new Date().toISOString();

  if (typeof record.id === "string") {
    return {
      id: record.id,
      title: record.title ?? "",
      category: record.category ?? "Investment",
      linked_os: Array.isArray(record.linked_os) ? record.linked_os.filter((x): x is string => typeof x === "string") : [],
      context: record.context ?? "",
      options: Array.isArray(record.options) ? record.options.map(normalizeOption).filter((option): option is DecisionOption => Boolean(option)) : [],
      chosen_option: record.chosen_option ?? "",
      reason: record.reason ?? "",
      risks: Array.isArray(record.risks) ? record.risks.filter((x): x is string => typeof x === "string") : [],
      expected_outcome: record.expected_outcome ?? "",
      actual_outcome: record.actual_outcome ?? "",
      review_date: record.review_date ?? today(),
      status: record.status ?? "open",
      quality_score: typeof record.quality_score === "number" ? record.quality_score : undefined,
      created_at: record.created_at ?? now,
      updated_at: record.updated_at ?? now,
    };
  }

  if (typeof record.decision_id === "string") {
    return {
      id: record.decision_id,
      title: record.title ?? "",
      category: record.category ?? "Investment",
      linked_os: record.linked_os && record.linked_os !== "none" ? [record.linked_os] : [],
      context: record.context ?? "",
      options: Array.isArray(record.options) ? record.options.map(normalizeOption).filter((option): option is DecisionOption => Boolean(option)) : [],
      chosen_option: record.chosen_option ?? "",
      reason: record.reason ?? "",
      risks: record.risk ? [`Legacy risk level: ${record.risk}`] : [],
      expected_outcome: record.outcome ?? "",
      actual_outcome: record.outcome ?? "",
      review_date: record.review_date ?? today(),
      status: record.chosen_option ? "decided" : "open",
      quality_score: undefined,
      created_at: record.date ? new Date(record.date).toISOString() : now,
      updated_at: now,
    };
  }

  return null;
}

function readDecisions(): Decision[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeDecision).filter((d): d is Decision => Boolean(d));
  } catch {
    return [];
  }
}

function persist(list: Decision[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function useDecisionStore() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const list = readDecisions();
    setDecisions(list);
    persist(list);
    setHydrated(true);
  }, []);

  const save = useCallback((list: Decision[]) => {
    persist(list);
    setDecisions(list);
  }, []);

  const addDecision = useCallback((decision: Decision) => {
    const nextDecision = { ...decision, created_at: decision.created_at || new Date().toISOString(), updated_at: new Date().toISOString() };
    setDecisions((prev) => {
      const next = [nextDecision, ...prev];
      persist(next);
      return next;
    });
  }, []);

  const updateDecision = useCallback((decision: Decision) => {
    const nextDecision = { ...decision, updated_at: new Date().toISOString() };
    setDecisions((prev) => {
      const next = prev.map((existing) => (existing.id === nextDecision.id ? nextDecision : existing));
      persist(next);
      return next;
    });
  }, []);

  const deleteDecision = useCallback((id: string) => {
    setDecisions((prev) => {
      const next = prev.filter((decision) => decision.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const getDecision = useCallback((id: string) => decisions.find((decision) => decision.id === id), [decisions]);

  return { decisions, hydrated, addDecision, updateDecision, deleteDecision, getDecision, save };
}
