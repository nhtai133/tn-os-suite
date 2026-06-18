import { toCoinGeckoId } from "./symbols";

export type PriceQuote = {
  usd: number;
  change24h: number;
  change7d: number;
  marketCap: number;
};

export type PriceMap = Record<string, PriceQuote>;

type CoinGeckoMarketRow = {
  id: string;
  symbol: string;
  current_price: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency: number | null;
  market_cap: number | null;
};

type CacheEntry = {
  expiresAt: number;
  prices: PriceMap;
};

export type PriceFetchOptions = {
  fetchFn?: typeof fetch;
  now?: () => number;
  ttlMs?: number;
};

const DEFAULT_TTL_MS = 60_000;
const cache = new Map<string, CacheEntry>();

function uniqueSymbols(symbols: string[]): string[] {
  return Array.from(
    new Set(symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean)),
  );
}

function cacheKey(symbols: string[]): string {
  return uniqueSymbols(symbols).sort().join(",");
}

function rowToQuote(row: CoinGeckoMarketRow): PriceQuote {
  return {
    usd: row.current_price ?? 0,
    change24h: row.price_change_percentage_24h ?? 0,
    change7d: row.price_change_percentage_7d_in_currency ?? 0,
    marketCap: row.market_cap ?? 0,
  };
}

export async function getPrices(symbols: string[], options: PriceFetchOptions = {}): Promise<PriceMap> {
  const normalized = uniqueSymbols(symbols);
  if (normalized.length === 0) return {};

  const key = cacheKey(normalized);
  const now = options.now?.() ?? Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached.prices;

  const idEntries = normalized
    .map((symbol) => [symbol, toCoinGeckoId(symbol)] as const)
    .filter((entry): entry is readonly [string, string] => Boolean(entry[1]));

  if (idEntries.length === 0) return {};

  const ids = idEntries.map(([, id]) => id);
  const fetchFn = options.fetchFn ?? fetch;
  const url = new URL("https://api.coingecko.com/api/v3/coins/markets");
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("ids", ids.join(","));
  url.searchParams.set("price_change_percentage", "24h,7d");
  url.searchParams.set("order", "market_cap_desc");
  url.searchParams.set("per_page", String(ids.length));
  url.searchParams.set("page", "1");
  url.searchParams.set("sparkline", "false");

  const response = await fetchFn(url);
  if (!response.ok) {
    throw new Error(`CoinGecko request failed with ${response.status}`);
  }

  const rows = (await response.json()) as CoinGeckoMarketRow[];
  const byId = new Map(rows.map((row) => [row.id, row]));
  const prices: PriceMap = {};

  for (const [symbol, id] of idEntries) {
    const row = byId.get(id);
    if (row) prices[symbol] = rowToQuote(row);
  }

  cache.set(key, {
    expiresAt: now + (options.ttlMs ?? DEFAULT_TTL_MS),
    prices,
  });

  return prices;
}

export function clearPriceCache(): void {
  cache.clear();
}

export { COINGECKO_IDS, toCoinGeckoId } from "./symbols";
