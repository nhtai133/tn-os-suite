export type PriceSource = "Manual" | "Mock" | "TradingViewAdapter" | "SSIAdapter";

export interface PriceEntry {
  id: string;
  symbol: string;
  date: string;
  price: number;
  currency: "VND" | "USD";
  source: PriceSource;
}

export interface PriceProvider {
  id: PriceSource;
  name: string;
  description: string;
  status: "active" | "stub" | "disabled";
}

export const PRICE_PROVIDERS: PriceProvider[] = [
  { id: "Manual", name: "Manual Entry", description: "Enter prices manually", status: "active" },
  { id: "Mock", name: "Mock Provider", description: "Generates random prices for testing", status: "active" },
  { id: "TradingViewAdapter", name: "TradingView Adapter", description: "Future integration with TradingView data feed", status: "stub" },
  { id: "SSIAdapter", name: "SSI Adapter", description: "Future integration with SSI Securities API", status: "stub" },
];
