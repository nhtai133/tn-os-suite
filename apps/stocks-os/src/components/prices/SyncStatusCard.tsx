import type { PriceProvider } from "@/lib/price-types";

const STATUS_COLOR = {
  active:   "text-emerald-400 bg-emerald-400/10",
  stub:     "text-amber-400 bg-amber-400/10",
  disabled: "text-zinc-500 bg-zinc-700/30",
};
const STATUS_LABEL = { active: "Active", stub: "Coming Soon", disabled: "Disabled" };

interface Props {
  provider: PriceProvider;
  lastSync?: string;
  entryCount?: number;
}

export function SyncStatusCard({ provider, lastSync, entryCount = 0 }: Props) {
  return (
    <div className={`rounded-xl border bg-zinc-900/40 px-4 py-4 space-y-2 ${
      provider.status === "active" ? "border-zinc-800" : "border-zinc-800/50 opacity-70"
    }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium text-white">{provider.name}</div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLOR[provider.status]}`}>
          {STATUS_LABEL[provider.status]}
        </span>
      </div>
      <div className="text-xs text-zinc-500">{provider.description}</div>
      {provider.status === "active" && (
        <div className="flex gap-4 text-xs text-zinc-600">
          {lastSync && <span>Last sync: {lastSync}</span>}
          <span>{entryCount} prices logged</span>
        </div>
      )}
    </div>
  );
}
