"use client";

import { useState, useEffect, useCallback } from "react";

export type StockExchange = "HOSE" | "HNX" | "UPCOM" | "NYSE" | "NASDAQ" | "other";

export type StockHolding = {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avg_buy_price: number;
  current_price: number;
  currency: "VND" | "USD";
  sector: string;
  exchange: StockExchange;
  notes?: string;
  created_at: string;
};

export type WatchlistItem = {
  id: string;
  symbol: string;
  name: string;
  current_price?: number;
  target_buy_price?: number;
  currency: "VND" | "USD";
  sector: string;
  priority: "high" | "medium" | "low";
  thesis?: string;
  notes?: string;
  created_at: string;
};

export type DividendRecord = {
  id: string;
  symbol: string;
  amount_per_share: number;
  shares_held: number;
  total_received: number;
  currency: "VND" | "USD";
  ex_date: string;
  payment_date?: string;
  notes?: string;
  created_at: string;
};

export type ValuationNote = {
  id: string;
  symbol: string;
  pe_ratio?: number;
  pb_ratio?: number;
  fair_value?: number;
  currency: "VND" | "USD";
  verdict: "undervalued" | "fairly valued" | "overvalued";
  notes: string;
  date: string;
  created_at: string;
};

export type TargetPosition = {
  id: string;
  symbol: string;
  name: string;
  target_shares: number;
  current_shares: number;
  target_price?: number;
  currency: "VND" | "USD";
  rationale?: string;
  priority: "high" | "medium" | "low";
  created_at: string;
};

export type CompanyThesis = {
  id: string;
  symbol: string;
  name: string;
  thesis: string;
  timeframe: string;
  conviction: number;
  catalysts: string[];
  risks: string[];
  status: "active" | "invalidated" | "fulfilled";
  created_at: string;
};

export type BuyZone = {
  id: string;
  symbol: string;
  zone_low: number;
  zone_high: number;
  currency: "VND" | "USD";
  rationale?: string;
  status: "waiting" | "active" | "passed" | "triggered";
  created_at: string;
};

export type SellRule = {
  id: string;
  symbol: string;
  trigger: string;
  type: "price-target" | "stop-loss" | "fundamental" | "time-based" | "other";
  status: "active" | "triggered" | "cancelled";
  notes?: string;
  created_at: string;
};

interface StocksData {
  holdings: StockHolding[];
  watchlist: WatchlistItem[];
  dividends: DividendRecord[];
  valuation_notes: ValuationNote[];
  targets: TargetPosition[];
  theses: CompanyThesis[];
  buy_zones: BuyZone[];
  sell_rules: SellRule[];
  cash_available_usd: number;
}

const DEFAULT_DATA: StocksData = {
  holdings: [],
  watchlist: [],
  dividends: [],
  valuation_notes: [],
  targets: [],
  theses: [],
  buy_zones: [],
  sell_rules: [],
  cash_available_usd: 0,
};

const STORAGE_KEY = "stocks_os_data";
const VND_TO_USD = 25_000;

function loadData(): StocksData {
  if (typeof window === "undefined") return DEFAULT_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const p = JSON.parse(raw) as Partial<StocksData>;
    return {
      holdings: p.holdings ?? [],
      watchlist: p.watchlist ?? [],
      dividends: p.dividends ?? [],
      valuation_notes: p.valuation_notes ?? [],
      targets: p.targets ?? [],
      theses: p.theses ?? [],
      buy_zones: p.buy_zones ?? [],
      sell_rules: p.sell_rules ?? [],
      cash_available_usd: p.cash_available_usd ?? 0,
    };
  } catch {
    return DEFAULT_DATA;
  }
}

function persist(data: StocksData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function toUSD(amount: number, currency: "VND" | "USD"): number {
  return currency === "USD" ? amount : amount / VND_TO_USD;
}

export function useStocksStore() {
  const [data, setData] = useState<StocksData>(DEFAULT_DATA);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(loadData());
    setHydrated(true);
  }, []);

  const update = useCallback((updater: (prev: StocksData) => StocksData) => {
    setData((prev) => {
      const next = updater(prev);
      persist(next);
      return next;
    });
  }, []);

  const addHolding = useCallback((h: Omit<StockHolding, "id" | "created_at">) => {
    update((d) => ({ ...d, holdings: [...d.holdings, { ...h, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updateHolding = useCallback((h: StockHolding) => {
    update((d) => ({ ...d, holdings: d.holdings.map((x) => (x.id === h.id ? h : x)) }));
  }, [update]);
  const deleteHolding = useCallback((id: string) => {
    update((d) => ({ ...d, holdings: d.holdings.filter((x) => x.id !== id) }));
  }, [update]);

  const addWatchlistItem = useCallback((w: Omit<WatchlistItem, "id" | "created_at">) => {
    update((d) => ({ ...d, watchlist: [...d.watchlist, { ...w, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updateWatchlistItem = useCallback((w: WatchlistItem) => {
    update((d) => ({ ...d, watchlist: d.watchlist.map((x) => (x.id === w.id ? w : x)) }));
  }, [update]);
  const deleteWatchlistItem = useCallback((id: string) => {
    update((d) => ({ ...d, watchlist: d.watchlist.filter((x) => x.id !== id) }));
  }, [update]);

  const addDividend = useCallback((r: Omit<DividendRecord, "id" | "created_at">) => {
    update((d) => ({ ...d, dividends: [...d.dividends, { ...r, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updateDividend = useCallback((r: DividendRecord) => {
    update((d) => ({ ...d, dividends: d.dividends.map((x) => (x.id === r.id ? r : x)) }));
  }, [update]);
  const deleteDividend = useCallback((id: string) => {
    update((d) => ({ ...d, dividends: d.dividends.filter((x) => x.id !== id) }));
  }, [update]);

  const addValuationNote = useCallback((v: Omit<ValuationNote, "id" | "created_at">) => {
    update((d) => ({ ...d, valuation_notes: [...d.valuation_notes, { ...v, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updateValuationNote = useCallback((v: ValuationNote) => {
    update((d) => ({ ...d, valuation_notes: d.valuation_notes.map((x) => (x.id === v.id ? v : x)) }));
  }, [update]);
  const deleteValuationNote = useCallback((id: string) => {
    update((d) => ({ ...d, valuation_notes: d.valuation_notes.filter((x) => x.id !== id) }));
  }, [update]);

  const addTarget = useCallback((t: Omit<TargetPosition, "id" | "created_at">) => {
    update((d) => ({ ...d, targets: [...d.targets, { ...t, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updateTarget = useCallback((t: TargetPosition) => {
    update((d) => ({ ...d, targets: d.targets.map((x) => (x.id === t.id ? t : x)) }));
  }, [update]);
  const deleteTarget = useCallback((id: string) => {
    update((d) => ({ ...d, targets: d.targets.filter((x) => x.id !== id) }));
  }, [update]);

  const addThesis = useCallback((t: Omit<CompanyThesis, "id" | "created_at">) => {
    update((d) => ({ ...d, theses: [...d.theses, { ...t, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updateThesis = useCallback((t: CompanyThesis) => {
    update((d) => ({ ...d, theses: d.theses.map((x) => (x.id === t.id ? t : x)) }));
  }, [update]);
  const deleteThesis = useCallback((id: string) => {
    update((d) => ({ ...d, theses: d.theses.filter((x) => x.id !== id) }));
  }, [update]);

  const addBuyZone = useCallback((b: Omit<BuyZone, "id" | "created_at">) => {
    update((d) => ({ ...d, buy_zones: [...d.buy_zones, { ...b, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updateBuyZone = useCallback((b: BuyZone) => {
    update((d) => ({ ...d, buy_zones: d.buy_zones.map((x) => (x.id === b.id ? b : x)) }));
  }, [update]);
  const deleteBuyZone = useCallback((id: string) => {
    update((d) => ({ ...d, buy_zones: d.buy_zones.filter((x) => x.id !== id) }));
  }, [update]);

  const addSellRule = useCallback((s: Omit<SellRule, "id" | "created_at">) => {
    update((d) => ({ ...d, sell_rules: [...d.sell_rules, { ...s, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updateSellRule = useCallback((s: SellRule) => {
    update((d) => ({ ...d, sell_rules: d.sell_rules.map((x) => (x.id === s.id ? s : x)) }));
  }, [update]);
  const deleteSellRule = useCallback((id: string) => {
    update((d) => ({ ...d, sell_rules: d.sell_rules.filter((x) => x.id !== id) }));
  }, [update]);

  const setCashAvailable = useCallback((amount: number) => {
    update((d) => ({ ...d, cash_available_usd: amount }));
  }, [update]);

  const seedSampleData = useCallback(() => {
    const now = new Date().toISOString();
    const sample: StocksData = {
      cash_available_usd: 500,
      holdings: [
        { id: uid(), symbol: "VCB", name: "Vietcombank", shares: 50, avg_buy_price: 82000, current_price: 89000, currency: "VND", sector: "Banking", exchange: "HOSE", notes: "Core holding — Vietnam's largest bank", created_at: now },
        { id: uid(), symbol: "ACB", name: "Asia Commercial Bank", shares: 100, avg_buy_price: 21500, current_price: 24800, currency: "VND", sector: "Banking", exchange: "HOSE", created_at: now },
        { id: uid(), symbol: "HPG", name: "Hoa Phat Group", shares: 200, avg_buy_price: 18500, current_price: 22300, currency: "VND", sector: "Steel", exchange: "HOSE", created_at: now },
        { id: uid(), symbol: "FPT", name: "FPT Corporation", shares: 30, avg_buy_price: 98000, current_price: 135000, currency: "VND", sector: "Technology", exchange: "HOSE", created_at: now },
        { id: uid(), symbol: "VHM", name: "Vinhomes", shares: 80, avg_buy_price: 38000, current_price: 42500, currency: "VND", sector: "Real Estate", exchange: "HOSE", created_at: now },
      ],
      watchlist: [
        { id: uid(), symbol: "MBB", name: "MB Bank", currency: "VND", sector: "Banking", priority: "high", current_price: 18500, target_buy_price: 16000, thesis: "Strong retail banking growth", created_at: now },
        { id: uid(), symbol: "SSI", name: "SSI Securities", currency: "VND", sector: "Finance", priority: "medium", current_price: 28000, target_buy_price: 24000, created_at: now },
        { id: uid(), symbol: "MSN", name: "Masan Group", currency: "VND", sector: "Consumer", priority: "medium", current_price: 66000, target_buy_price: 55000, thesis: "FMCG + retail play", created_at: now },
        { id: uid(), symbol: "NVDA", name: "NVIDIA", currency: "USD", sector: "Technology", priority: "low", current_price: 875, target_buy_price: 700, thesis: "AI chip leader — wait for pullback", created_at: now },
      ],
      dividends: [
        { id: uid(), symbol: "VCB", amount_per_share: 1800, shares_held: 50, total_received: 90000, currency: "VND", ex_date: "2025-03-15", payment_date: "2025-04-01", notes: "Cash dividend 2024", created_at: now },
        { id: uid(), symbol: "FPT", amount_per_share: 3000, shares_held: 30, total_received: 90000, currency: "VND", ex_date: "2025-05-20", payment_date: "2025-06-05", created_at: now },
        { id: uid(), symbol: "ACB", amount_per_share: 1500, shares_held: 100, total_received: 150000, currency: "VND", ex_date: "2025-04-10", payment_date: "2025-04-25", created_at: now },
      ],
      valuation_notes: [
        { id: uid(), symbol: "VCB", pe_ratio: 12.5, pb_ratio: 2.1, fair_value: 95000, currency: "VND", verdict: "undervalued", notes: "Trading below intrinsic value. ROE ~22%, NPL well-managed. Target 95k-110k range.", date: "2025-06-10", created_at: now },
        { id: uid(), symbol: "HPG", pe_ratio: 8.2, pb_ratio: 1.5, fair_value: 24000, currency: "VND", verdict: "fairly valued", notes: "Steel cycle recovery underway. Dung Quat 2 expansion catalyst. Fair at current levels.", date: "2025-06-08", created_at: now },
        { id: uid(), symbol: "FPT", pe_ratio: 22, pb_ratio: 5.1, fair_value: 145000, currency: "VND", verdict: "undervalued", notes: "Undervalued relative to growth profile. Software export + AI consulting thesis.", date: "2025-06-01", created_at: now },
      ],
      targets: [
        { id: uid(), symbol: "VCB", name: "Vietcombank", target_shares: 100, current_shares: 50, target_price: 85000, currency: "VND", rationale: "Increase to 100 shares over 12 months via DCA", priority: "high", created_at: now },
        { id: uid(), symbol: "ACB", name: "Asia Commercial Bank", target_shares: 200, current_shares: 100, target_price: 22000, currency: "VND", rationale: "Double position on any pullback to 20-22k range", priority: "high", created_at: now },
        { id: uid(), symbol: "FPT", name: "FPT Corporation", target_shares: 50, current_shares: 30, target_price: 125000, currency: "VND", rationale: "Accumulate during tech corrections", priority: "medium", created_at: now },
      ],
      theses: [
        { id: uid(), symbol: "VCB", name: "Vietcombank", thesis: "Vietnam's systemically important bank with unmatched brand, distribution, and foreign-partner relationships. As Vietnam economy grows 6-7% annually, VCB benefits disproportionately from credit demand, trade finance, and digital banking adoption.", timeframe: "3-5 years", conviction: 9, catalysts: ["Banking sector digitalization", "Vietnam GDP growth", "FDI inflows"], risks: ["NPL cycle", "interest rate compression", "regulatory changes"], status: "active", created_at: now },
        { id: uid(), symbol: "FPT", name: "FPT Corporation", thesis: "Vietnam's largest IT services and technology company with strong software export revenue to Japan, US, and Europe. AI services, digital transformation consulting, and education creating multiple growth vectors.", timeframe: "2-4 years", conviction: 8, catalysts: ["AI services demand", "software export growth", "EdTech expansion"], risks: ["Talent cost inflation", "margin compression", "FX risk"], status: "active", created_at: now },
        { id: uid(), symbol: "HPG", name: "Hoa Phat Group", thesis: "Vietnam's dominant steel producer benefiting from infrastructure-led economy. Dung Quat 2 expansion doubles capacity. Supply chain consolidation in SEA.", timeframe: "2-3 years", conviction: 6, catalysts: ["Dung Quat 2 ramp-up", "infrastructure spending", "steel price recovery"], risks: ["China steel dumping", "construction slowdown", "commodity cycles"], status: "active", created_at: now },
      ],
      buy_zones: [
        { id: uid(), symbol: "VCB", zone_low: 78000, zone_high: 84000, currency: "VND", rationale: "Support zone + DCA target range for adding to position", status: "active", created_at: now },
        { id: uid(), symbol: "ACB", zone_low: 20000, zone_high: 22000, currency: "VND", rationale: "Historical support + current valuation floor", status: "waiting", created_at: now },
        { id: uid(), symbol: "MBB", zone_low: 15500, zone_high: 17000, currency: "VND", rationale: "Initiating zone if pulls back to fair value", status: "waiting", created_at: now },
        { id: uid(), symbol: "NVDA", zone_low: 680, zone_high: 720, currency: "USD", rationale: "Pullback zone after AI euphoria cooling", status: "waiting", created_at: now },
      ],
      sell_rules: [
        { id: uid(), symbol: "VCB", trigger: "Sell 25% if price exceeds 120,000 VND — partial profit taking", type: "price-target", status: "active", created_at: now },
        { id: uid(), symbol: "VCB", trigger: "Sell all if P/B ratio exceeds 3.5x — fundamentally overvalued", type: "fundamental", status: "active", created_at: now },
        { id: uid(), symbol: "HPG", trigger: "Stop loss at 16,000 VND — below which thesis is broken", type: "stop-loss", status: "active", created_at: now },
        { id: uid(), symbol: "FPT", trigger: "Sell 50% if price exceeds 180,000 VND for rebalancing", type: "price-target", status: "active", created_at: now },
      ],
    };
    persist(sample);
    setData(sample);
  }, []);

  const clearAllData = useCallback(() => {
    persist(DEFAULT_DATA);
    setData(DEFAULT_DATA);
  }, []);

  // Derived
  const totalStockValueUSD = data.holdings.reduce((s, h) => s + toUSD(h.shares * h.current_price, h.currency), 0);

  const sectorAllocation = data.holdings.reduce<Record<string, number>>((acc, h) => {
    const val = toUSD(h.shares * h.current_price, h.currency);
    acc[h.sector] = (acc[h.sector] ?? 0) + val;
    return acc;
  }, {});

  const annualDividendIncomeUSD = data.dividends.reduce((s, d) => s + toUSD(d.total_received, d.currency), 0);

  const vcbTarget = data.targets.find((t) => t.symbol === "VCB");
  const acbTarget = data.targets.find((t) => t.symbol === "ACB");
  const targetVCBShares = vcbTarget?.target_shares ?? 0;
  const targetACBShares = acbTarget?.target_shares ?? 0;
  const targetVCBProgressPct = targetVCBShares > 0 ? Math.min(((vcbTarget?.current_shares ?? 0) / targetVCBShares) * 100, 100) : 0;
  const targetACBProgressPct = targetACBShares > 0 ? Math.min(((acbTarget?.current_shares ?? 0) / targetACBShares) * 100, 100) : 0;

  const activeBuyZones = data.buy_zones.filter((b) => b.status === "waiting" || b.status === "active").length;

  const valuationRisk: "low" | "medium" | "high" = (() => {
    const overvalued = data.valuation_notes.filter((v) => v.verdict === "overvalued").length;
    if (overvalued > 2) return "high";
    if (overvalued > 0) return "medium";
    return "low";
  })();

  return {
    ...data,
    hydrated,
    addHolding, updateHolding, deleteHolding,
    addWatchlistItem, updateWatchlistItem, deleteWatchlistItem,
    addDividend, updateDividend, deleteDividend,
    addValuationNote, updateValuationNote, deleteValuationNote,
    addTarget, updateTarget, deleteTarget,
    addThesis, updateThesis, deleteThesis,
    addBuyZone, updateBuyZone, deleteBuyZone,
    addSellRule, updateSellRule, deleteSellRule,
    setCashAvailable,
    seedSampleData,
    clearAllData,
    totalStockValueUSD,
    sectorAllocation,
    annualDividendIncomeUSD,
    targetVCBShares,
    targetACBShares,
    targetVCBProgressPct,
    targetACBProgressPct,
    activeBuyZones,
    valuationRisk,
  };
}
