import { z } from "zod";

export const WealthOSSummarySchema = z.object({
  total_net_worth: z.number(),
  total_assets: z.number(),
  total_liabilities: z.number(),
  cash_balance: z.number(),
  emergency_fund_months: z.number(),
  upcoming_maturities: z.array(z.string()),
  wealth_risk_notes: z.string().optional(),
  currency: z.string().default("VND"),
});

export type WealthOSSummary = z.infer<typeof WealthOSSummarySchema>;
