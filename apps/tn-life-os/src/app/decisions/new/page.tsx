"use client";

import Link from "next/link";
import { DecisionForm } from "@/components/DecisionForm";
import { useDecisionStore } from "@/store/useDecisionStore";

export default function NewDecisionPage() {
  const store = useDecisionStore();

  if (!store.hydrated) return <div className="p-4 md:p-8 text-zinc-600 animate-pulse">Loading...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl">
      <div>
        <Link href="/decisions" className="text-xs text-zinc-500 hover:text-zinc-300">Back to decisions</Link>
        <h1 className="text-2xl font-bold text-white mt-2">New Decision</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Capture context, options, risks, expected outcome, and review plan.</p>
      </div>
      <DecisionForm onSubmit={store.addDecision} />
    </div>
  );
}
