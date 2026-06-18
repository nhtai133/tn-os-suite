import type { CIOAlert, AlertSeverity } from "@/lib/cio-engine";

const SEVERITY_STYLE: Record<AlertSeverity, { border: string; icon: string; title: string }> = {
  critical: { border: "border-red-500/40 bg-red-500/5",   icon: "🔴", title: "text-red-400" },
  warning:  { border: "border-amber-500/40 bg-amber-500/5", icon: "🟡", title: "text-amber-400" },
  info:     { border: "border-sky-500/40 bg-sky-500/5",    icon: "🔵", title: "text-sky-400" },
};

const CATEGORY_LABEL: Record<CIOAlert["category"], string> = {
  risk:      "Risk",
  dividend:  "Dividend",
  buyzone:   "Buy Zone",
  rebalance: "Rebalance",
  thesis:    "Thesis",
};

interface Props {
  alerts: CIOAlert[];
}

export function RiskAlertCard({ alerts }: Props) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 text-sm text-emerald-400">
        ✓ No active alerts — portfolio is healthy
      </div>
    );
  }

  const critical = alerts.filter((a) => a.severity === "critical");
  const warnings = alerts.filter((a) => a.severity === "warning");
  const infos    = alerts.filter((a) => a.severity === "info");
  const ordered  = [...critical, ...warnings, ...infos];

  return (
    <div className="space-y-2">
      {ordered.map((alert) => {
        const style = SEVERITY_STYLE[alert.severity];
        return (
          <div key={alert.id} className={`rounded-xl border px-4 py-3 ${style.border}`}>
            <div className="flex items-start gap-2">
              <span className="text-sm mt-0.5">{style.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-medium ${style.title}`}>{alert.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500">
                    {CATEGORY_LABEL[alert.category]}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">{alert.detail}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
