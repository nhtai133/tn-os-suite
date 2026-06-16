"use client";

import { useState, useEffect, useCallback } from "react";

export interface Decision {
  decision_id: string;
  title: string;
  category: string;
  linked_os: string;
  context: string;
  options: string[];
  chosen_option: string;
  reason: string;
  risk: "low" | "medium" | "high";
  date: string;
  review_date: string;
  outcome: string;
}

const STORAGE_KEY = "tn_life_os_decisions";

export function useDecisionStore() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setDecisions(raw ? (JSON.parse(raw) as Decision[]) : []);
    } catch {
      setDecisions([]);
    }
    setHydrated(true);
  }, []);

  const save = useCallback((list: Decision[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    setDecisions(list);
  }, []);

  const addDecision = useCallback((d: Decision) => {
    setDecisions((prev) => {
      const next = [...prev, d];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateDecision = useCallback((d: Decision) => {
    setDecisions((prev) => {
      const next = prev.map((x) => (x.decision_id === d.decision_id ? d : x));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteDecision = useCallback((id: string) => {
    setDecisions((prev) => {
      const next = prev.filter((x) => x.decision_id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { decisions, hydrated, addDecision, updateDecision, deleteDecision, save };
}
