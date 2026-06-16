"use client";

import React from "react";

interface StatWidgetProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatWidget({ label, value, sub, trend, className = "" }: StatWidgetProps) {
  const trendColor =
    trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-zinc-400";

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs text-zinc-500 uppercase tracking-widest">{label}</span>
      <span className={`text-2xl font-bold ${trendColor}`}>{value}</span>
      {sub && <span className="text-xs text-zinc-500">{sub}</span>}
    </div>
  );
}
