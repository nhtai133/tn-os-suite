import { z } from "zod";

export const BusinessOSSummarySchema = z.object({
  monthly_revenue: z.number(),
  revenue_by_channel: z.record(z.number()),
  active_leads: z.number(),
  content_output_this_month: z.number(),
  pending_client_issues: z.array(z.string()),
  business_risk: z.enum(["low", "medium", "high"]),
  next_growth_actions: z.array(z.string()),
  currency: z.string().default("VND"),
});

export type BusinessOSSummary = z.infer<typeof BusinessOSSummarySchema>;
