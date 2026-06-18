export interface WealthPortfolioEntry {
  id: string;
  name: string;
  value: number;
  invested: number;
  unrealizedPL: number;
}

export interface StocksSnapshot {
  version: "1.0";
  generatedAt: string;
  source: "stocks-os";
  totalValue: number;
  investedCapital: number;
  cash: number;
  unrealizedPL: number;
  realizedPL: number;
  dividendIncome: number;
  monthlyIncome: number;
  currency: "USD";
  portfolios: WealthPortfolioEntry[];
}
