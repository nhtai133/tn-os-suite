import { z } from "zod";

export const StocksRiskSchema = z.enum(["low", "medium", "high"]);
export type StocksRisk = z.infer<typeof StocksRiskSchema>;

export const StocksOSSummarySchema = z.object({
  total_stock_value_usd: z.number(),
  total_positions: z.number().int().min(0),
  cash_available_usd: z.number(),
  annual_dividend_income_usd: z.number(),
  sector_allocation: z.record(z.number()),
  top_holdings: z.array(z.string()),
  target_vcb_shares: z.number(),
  target_vcb_progress_pct: z.number().min(0),
  target_acb_shares: z.number(),
  target_acb_progress_pct: z.number().min(0),
  valuation_risk: StocksRiskSchema,
  watchlist_count: z.number().int().min(0),
  buy_zones_active: z.number().int().min(0),
  stocks_risk_notes: z.array(z.string()),
  next_actions: z.array(z.string()),
  currency: z.string().default("USD"),
});

export type StocksOSSummary = z.infer<typeof StocksOSSummarySchema>;
