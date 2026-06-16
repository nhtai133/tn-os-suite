import { z } from "zod";

export const WealthOSSummarySchema = z.object({
  total_net_worth: z.number(),
  total_assets: z.number(),
  total_liabilities: z.number(),
  cash_balance: z.number(),
  total_real_estate_value: z.number(),
  total_vehicle_value: z.number(),
  emergency_fund_months: z.number(),
  emergency_fund_target_months: z.number(),
  bank_account_count: z.number().int().min(0),
  real_estate_count: z.number().int().min(0),
  vehicle_count: z.number().int().min(0),
  liability_count: z.number().int().min(0),
  family_support_count: z.number().int().min(0),
  monthly_family_support: z.number(),
  monthly_debt_payments: z.number(),
  upcoming_maturities: z.array(z.string()),
  wealth_risk_notes: z.string().optional(),
  currency: z.string().default("VND"),
});

export type WealthOSSummary = z.infer<typeof WealthOSSummarySchema>;
