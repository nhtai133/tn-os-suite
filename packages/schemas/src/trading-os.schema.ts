import { z } from "zod";

export const TradingRiskStatusSchema = z.enum(["Safe", "Warning", "Danger", "Breach"]);
export type TradingRiskStatus = z.infer<typeof TradingRiskStatusSchema>;

export const TradingAccountSummarySchema = z.object({
  account_name: z.string(),
  account_size: z.number(),
  lifecycle_type: z.string(),
  lifecycle_status: z.string(),
  equity: z.number().optional(),
  net_profit: z.number().optional(),
  daily_loss_usage_pct: z.number().min(0).optional(),
  max_loss_usage_pct: z.number().min(0).optional(),
  risk_status: TradingRiskStatusSchema.optional(),
});
export type TradingAccountSummary = z.infer<typeof TradingAccountSummarySchema>;

export const TradingOSSummarySchema = z.object({
  total_equity: z.number(),
  account_count: z.number().int().min(0),
  prop_account_count: z.number().int().min(0),
  weekly_pnl: z.number(),
  monthly_pnl: z.number(),
  total_net_profit: z.number(),
  max_drawdown_pct: z.number().min(0),
  ftmo_risk_status: TradingRiskStatusSchema,
  daily_loss_usage_pct: z.number().min(0),
  max_loss_usage_pct: z.number().min(0),
  discipline_score: z.number().min(0).max(100),
  best_setup: z.string().optional(),
  best_setup_win_rate_pct: z.number().min(0).max(100).optional(),
  worst_mistake: z.string().optional(),
  rule_violations: z.array(z.string()),
  focus_setup_next_week: z.string().optional(),
  win_rate_pct: z.number().min(0).max(100),
  profit_factor: z.number().min(0),
  total_trades: z.number().int().min(0),
  closed_trades: z.number().int().min(0),
  open_positions: z.number().int().min(0),
  currency: z.string().default("USD"),
  accounts: z.array(TradingAccountSummarySchema),
});

export type TradingOSSummary = z.infer<typeof TradingOSSummarySchema>;
