import type { PortfolioType, StockPortfolio } from "./portfolio-types";

export type PortfolioDefinition = {
  id: string;
  name: string;
  type: PortfolioType;
  objective: string;
  description: string;
  baseCurrency: "VND" | "USD";
  targetHoldingPeriod?: string;
  monthlyContribution?: number;
  broker?: string;
};

export const STOCK_PORTFOLIOS: PortfolioDefinition[] = [
  {
    id: "retirement-5",
    name: "Retirement 5%",
    type: "RETIREMENT_5",
    objective: "Monthly DCA retirement accumulation",
    description:
      "Long-term retirement account. Contribute a fixed monthly amount. Buy consistently every month. Mostly no selling. Focus on durable assets and long-term compounding.",
    baseCurrency: "VND",
    targetHoldingPeriod: "10Y+",
    monthlyContribution: 0,
  },
  {
    id: "hold-10y",
    name: "Hold 10Y",
    type: "HOLD_10Y",
    objective: "Long-term compounder account funded by profits",
    description:
      "Long-term holding account for profits generated from Trading OS, Crypto OS, and Business OS. Buy quality companies and hold through full market cycles.",
    baseCurrency: "VND",
    targetHoldingPeriod: "10Y",
  },
  {
    id: "swing-3-6m",
    name: "Swing Trade 3-6M",
    type: "SWING_3_6M",
    objective: "Active tactical stock trading",
    description:
      "Active swing trading account. Focus on market cycles, technical setups, catalysts, earnings, and momentum. Each position requires stop loss, target, thesis, and review.",
    baseCurrency: "VND",
    targetHoldingPeriod: "3-6M",
  },
  {
    id: "medium-3y",
    name: "Medium-Term 3Y",
    type: "MEDIUM_3Y",
    objective: "Cycle-based medium-term investing",
    description:
      "Medium-term cyclical investing. Focus on macro cycles, sector cycles, and valuation rerating. Hold 1-3 years. Exit when thesis is complete.",
    baseCurrency: "VND",
    targetHoldingPeriod: "1-3Y",
  },
  {
    id: "funds-etf",
    name: "CCQ & ETF",
    type: "FUNDS_ETF",
    objective: "Mutual funds, ETFs, and fund DCA",
    description:
      "Mutual funds, bond funds, balanced funds, equity funds, and ETFs. Tracks Dragon Capital and other fund providers. DCA and long-term accumulation supported.",
    baseCurrency: "VND",
    targetHoldingPeriod: "5Y+",
    monthlyContribution: 0,
  },
];

export const PORTFOLIO_MAP: Record<string, PortfolioDefinition> = Object.fromEntries(
  STOCK_PORTFOLIOS.map((p) => [p.id, p])
);

export type PortfolioId = "retirement-5" | "hold-10y" | "swing-3-6m" | "medium-3y" | "funds-etf";

export function seedPortfolios(): StockPortfolio[] {
  const now = new Date().toISOString();
  return STOCK_PORTFOLIOS.map((def) => ({
    id: def.id,
    name: def.name,
    type: def.type,
    description: def.description,
    objective: def.objective,
    baseCurrency: def.baseCurrency,
    targetHoldingPeriod: def.targetHoldingPeriod,
    monthlyContribution: def.monthlyContribution,
    broker: def.broker,
    createdAt: now,
    updatedAt: now,
  }));
}
