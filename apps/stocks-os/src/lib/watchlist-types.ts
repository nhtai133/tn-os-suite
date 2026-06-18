export type WatchlistStatus = "Watching" | "Accumulating" | "Hold" | "Overvalued" | "Sold";

export interface WatchlistItem {
  id: string;
  symbol: string;
  sector?: string;
  portfolioType?: string;
  currentPrice: number;
  fairValue?: number;
  buyZoneLow?: number;
  buyZoneHigh?: number;
  targetPrice?: number;
  priorityScore?: number;
  status: WatchlistStatus;
  currency: "VND" | "USD";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
