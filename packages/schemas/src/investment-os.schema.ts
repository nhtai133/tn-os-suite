import { z } from "zod";

export const FundSchema = z.object({
  id: z.string(),
  name: z.string(),
  ticker: z.string().optional(),
  category: z.enum(["equity", "bond", "etf", "index", "crypto", "cash", "other"]),
  currency: z.string().default("VND"),
  target_allocation_pct: z.number().min(0).max(100),
  current_value: z.number().min(0),
  cost_basis: z.number().min(0),
  units: z.number().optional(),
  conviction: z.enum(["high", "medium", "low"]),
  thesis: z.string().optional(),
  next_buy_zone: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Fund = z.infer<typeof FundSchema>;

export const BuyPlanSchema = z.object({
  id: z.string(),
  fund_id: z.string(),
  amount: z.number().min(0),
  currency: z.string().default("VND"),
  frequency: z.enum(["weekly", "monthly", "quarterly", "one-time"]),
  next_date: z.string(),
  note: z.string().optional(),
});

export type BuyPlan = z.infer<typeof BuyPlanSchema>;

export const WatchlistItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  ticker: z.string().optional(),
  category: z.string(),
  target_price: z.number().optional(),
  current_price: z.number().optional(),
  note: z.string().optional(),
  added_at: z.string().datetime(),
});

export type WatchlistItem = z.infer<typeof WatchlistItemSchema>;

export const RebalancingLogSchema = z.object({
  id: z.string(),
  date: z.string(),
  action: z.string(),
  fund_id: z.string(),
  amount: z.number(),
  reason: z.string().optional(),
});

export type RebalancingLog = z.infer<typeof RebalancingLogSchema>;

export const InvestmentOSSummarySchema = z.object({
  total_invested_capital: z.number(),
  total_current_value: z.number(),
  total_gain_loss: z.number(),
  total_gain_loss_pct: z.number(),
  cash_waiting_deployment: z.number(),
  num_funds: z.number(),
  dca_monthly_amount: z.number(),
  conviction_score: z.enum(["high", "medium", "low"]),
  next_buy_zones: z.array(z.string()),
  fund_review_notes: z.string().optional(),
  currency: z.string().default("VND"),
});

export type InvestmentOSSummary = z.infer<typeof InvestmentOSSummarySchema>;

export const InvestmentOSEntitiesSchema = z.object({
  funds: z.array(FundSchema),
  buy_plans: z.array(BuyPlanSchema),
  watchlist: z.array(WatchlistItemSchema),
  rebalancing_logs: z.array(RebalancingLogSchema),
});

export type InvestmentOSEntities = z.infer<typeof InvestmentOSEntitiesSchema>;
