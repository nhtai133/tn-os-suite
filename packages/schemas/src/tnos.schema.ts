import { z } from "zod";

export const OSTypeSchema = z.enum([
  "life_os",
  "wealth_os",
  "investment_os",
  "trading_os",
  "crypto_os",
  "stocks_os",
  "business_os",
]);

export type OSType = z.infer<typeof OSTypeSchema>;

export const TNOSSnapshotSchema = z.object({
  schema_version: z.literal("1.0.0"),
  os_type: OSTypeSchema,
  generated_at: z.string().datetime(),
  owner: z.string(),
  summary: z.record(z.unknown()),
  entities: z.record(z.unknown()),
  metrics: z.record(z.unknown()),
  risks: z.array(z.string()),
  decisions: z.array(z.record(z.unknown())),
  ai_context: z.record(z.unknown()),
});

export type TNOSSnapshot = z.infer<typeof TNOSSnapshotSchema>;
