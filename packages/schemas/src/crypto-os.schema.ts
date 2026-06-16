import { z } from "zod";

export const CryptoRiskSchema = z.enum(["low", "medium", "high"]);
export type CryptoRisk = z.infer<typeof CryptoRiskSchema>;

export const CryptoOSSummarySchema = z.object({
  total_crypto_value_usd: z.number(),
  btc_amount: z.number(),
  eth_amount: z.number(),
  stablecoin_balance_usd: z.number(),
  wallet_count: z.number().int().min(0),
  exchange_count: z.number().int().min(0),
  holding_count: z.number().int().min(0),
  defi_exposure_usd: z.number(),
  cold_wallet_value_usd: z.number(),
  exchange_risk: CryptoRiskSchema,
  wallet_security_score: z.number().min(0).max(100),
  target_btc_amount: z.number(),
  target_btc_progress_pct: z.number().min(0),
  top_holdings: z.array(z.string()),
  crypto_risk_notes: z.array(z.string()),
  next_actions: z.array(z.string()),
  currency: z.string().default("USD"),
});

export type CryptoOSSummary = z.infer<typeof CryptoOSSummarySchema>;
