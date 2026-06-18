export interface PortfolioSnapshot {
  id: string;
  portfolioId: string;
  portfolioName: string;
  takenAt: string;
  value: number;
  investedCapital: number;
  unrealizedPnL: number;
  realizedPnL: number;
  dividendIncome: number;
  totalReturnPct: number;
  holdingCount: number;
}

export interface GlobalSnapshot {
  id: string;
  takenAt: string;
  totalValue: number;
  totalInvested: number;
  totalUnrealized: number;
  totalRealized: number;
  totalDividends: number;
  totalHoldings: number;
}

// Normalised display row used by PortfolioHistoryTable for both types
export interface HistoryEntry {
  id: string;
  takenAt: string;
  value: number;
  investedCapital: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalReturnPct: number;
  holdingCount: number;
}

export type SnapshotStoreData = {
  portfolioSnapshots: PortfolioSnapshot[];
  globalSnapshots: GlobalSnapshot[];
};
