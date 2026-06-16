import { z } from "zod";

export const StocksOSSummarySchema = z.object({
  total_stock_value: z.number(),
  top_holdings: z.array(z.object({ ticker: z.string(), value: z.number(), pct: z.number() })),
  sector_allocation: z.record(z.number()),
  dividend_income_annual: z.number(),
  target_vcb_progress_pct: z.number().min(0).max(100).optional(),
  target_acb_progress_pct: z.number().min(0).max(100).optional(),
  valuation_risk_notes: z.string().optional(),
  currency: z.string().default("VND"),
});

export type StocksOSSummary = z.infer<typeof StocksOSSummarySchema>;
