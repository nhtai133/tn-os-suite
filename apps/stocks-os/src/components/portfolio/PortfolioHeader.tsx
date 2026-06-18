import { Badge } from "@tn-os/ui";
import type { PortfolioDefinition } from "@/lib/portfolio-registry";

const TYPE_LABEL: Record<string, string> = {
  RETIREMENT_5: "Retirement",
  HOLD_10Y: "Long-Term Hold",
  SWING_3_6M: "Swing Trade",
  MEDIUM_3Y: "Medium-Term",
  FUNDS_ETF: "Funds & ETF",
};

const TYPE_VARIANT: Record<string, "success" | "warning" | "info" | "neutral"> = {
  RETIREMENT_5: "success",
  HOLD_10Y: "info",
  SWING_3_6M: "warning",
  MEDIUM_3Y: "neutral",
  FUNDS_ETF: "info",
};

interface Props {
  definition: PortfolioDefinition;
}

export function PortfolioHeader({ definition }: Props) {
  return (
    <div className="px-8 pt-7 pb-5 border-b border-zinc-800">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={TYPE_VARIANT[definition.type] ?? "neutral"}>
              {TYPE_LABEL[definition.type] ?? definition.type}
            </Badge>
            {definition.targetHoldingPeriod && (
              <span className="text-xs text-zinc-600 font-medium">{definition.targetHoldingPeriod}</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">{definition.name}</h1>
          <p className="text-sm text-zinc-500 mt-0.5 max-w-lg">{definition.objective}</p>
        </div>
        {definition.broker && (
          <div className="text-right shrink-0">
            <div className="text-xs text-zinc-600 uppercase tracking-widest mb-0.5">Broker</div>
            <div className="text-sm text-zinc-300 font-medium">{definition.broker}</div>
          </div>
        )}
      </div>
    </div>
  );
}
