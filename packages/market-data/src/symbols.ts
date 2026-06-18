export const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  USDC: "usd-coin",
  DAI: "dai",
  BNB: "binancecoin",
  SOL: "solana",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  AVAX: "avalanche-2",
  DOT: "polkadot",
  LINK: "chainlink",
  MATIC: "matic-network",
  POL: "polygon-ecosystem-token",
  TON: "the-open-network",
  TRX: "tron",
  LTC: "litecoin",
};

export function toCoinGeckoId(symbol: string): string | undefined {
  return COINGECKO_IDS[symbol.trim().toUpperCase()];
}
