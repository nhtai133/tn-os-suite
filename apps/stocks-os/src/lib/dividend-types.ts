export type DividendStatus = "expected" | "received";

export interface DividendEvent {
  id: string;
  portfolioId: string;
  symbol: string;
  broker?: string;
  exDate: string;
  recordDate?: string;
  paymentDate?: string;
  amountPerShare: number;
  shares: number;
  grossAmount: number;
  tax?: number;
  netAmount: number;
  currency: "VND" | "USD";
  status: DividendStatus;
  note?: string;
}
