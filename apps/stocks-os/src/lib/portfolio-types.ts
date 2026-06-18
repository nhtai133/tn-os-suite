export type PortfolioType =
  | "RETIREMENT_5"
  | "HOLD_10Y"
  | "SWING_3_6M"
  | "MEDIUM_3Y"
  | "FUNDS_ETF";

export type AssetClass =
  | "STOCK"
  | "ETF"
  | "MUTUAL_FUND"
  | "BOND_FUND"
  | "CASH";

export type TransactionType =
  | "BUY"
  | "SELL"
  | "DIVIDEND"
  | "DISTRIBUTION"
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "FEE"
  | "TAX";

export interface StockPortfolio {
  id: string;
  name: string;
  type: PortfolioType;
  description: string;
  objective: string;
  baseCurrency: "VND" | "USD";
  broker?: string;
  targetHoldingPeriod?: string;
  monthlyContribution?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Holding {
  id: string;
  portfolioId: string;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  sector?: string;
  provider?: string;
  broker?: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  currency: "VND" | "USD";
  annualDividend?: number;
  thesis?: string;
  targetPrice?: number;
  stopLoss?: number;
  entryDate?: string;
}

export interface PortfolioTransaction {
  id: string;
  portfolioId: string;
  holdingId?: string;
  symbol?: string;
  type: TransactionType;
  date: string;
  quantity?: number;
  price?: number;
  amount: number;
  fee?: number;
  tax?: number;
  note?: string;
}
