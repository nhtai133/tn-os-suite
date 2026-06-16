import { z } from "zod";

export const TradingOSSummarySchema = z.object({
  equity: z.number(),
  drawdown_pct: z.number(),
  weekly_pnl: z.number(),
  monthly_pnl: z.number(),
  risk_status: z.enum(["safe", "caution", "danger"]),
  rule_violations: z.array(z.string()),
  best_setup: z.string().optional(),
  worst_mistake: z.string().optional(),
  focus_setup_next_week: z.string().optional(),
  currency: z.string().default("USD"),
});

export type TradingOSSummary = z.infer<typeof TradingOSSummarySchema>;
