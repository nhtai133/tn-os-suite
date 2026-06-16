import { z } from "zod";

export const BusinessRiskSchema = z.enum(["low", "medium", "high"]);
export type BusinessRisk = z.infer<typeof BusinessRiskSchema>;

export const BusinessOSSummarySchema = z.object({
  monthly_revenue: z.number(),
  monthly_expenses: z.number(),
  net_profit: z.number(),
  net_profit_margin_pct: z.number(),
  revenue_by_channel: z.record(z.number()),
  active_clients: z.number().int().min(0),
  active_leads: z.number().int().min(0),
  total_clients: z.number().int().min(0),
  content_output_count: z.number().int().min(0),
  pending_client_issues: z.number().int().min(0),
  active_campaigns: z.number().int().min(0),
  ib_account_count: z.number().int().min(0),
  partner_count: z.number().int().min(0),
  open_tasks: z.number().int().min(0),
  high_priority_tasks: z.number().int().min(0),
  business_risk: BusinessRiskSchema,
  business_risk_notes: z.array(z.string()),
  next_growth_actions: z.array(z.string()),
  currency: z.string().default("USD"),
});

export type BusinessOSSummary = z.infer<typeof BusinessOSSummarySchema>;
