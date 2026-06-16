import { z } from "zod";

export const CryptoOSSummarySchema = z.object({
  total_crypto_value_usd: z.number(),
  btc_amount: z.number(),
  eth_amount: z.number(),
  stablecoin_balance_usd: z.number(),
  exchange_risk: z.enum(["low", "medium", "high"]),
  wallet_security_status: z.enum(["secure", "review-needed", "at-risk"]),
  target_btc_progress_pct: z.number().min(0).max(100),
  currency: z.string().default("USD"),
});

export type CryptoOSSummary = z.infer<typeof CryptoOSSummarySchema>;
