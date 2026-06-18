import type { Holding, PortfolioTransaction } from "./portfolio-types";

export const VND_TO_USD = 25_000;

export function toUSD(amount: number, currency: "VND" | "USD"): number {
  return currency === "USD" ? amount : amount / VND_TO_USD;
}

export function calculatePortfolioValue(holdings: Holding[]): number {
  return holdings.reduce(
    (sum, h) => sum + toUSD(h.quantity * h.currentPrice, h.currency),
    0
  );
}

export function calculateInvestedCapital(holdings: Holding[]): number {
  return holdings.reduce(
    (sum, h) => sum + toUSD(h.quantity * h.averageCost, h.currency),
    0
  );
}

export function calculateUnrealizedPnL(holdings: Holding[]): number {
  return calculatePortfolioValue(holdings) - calculateInvestedCapital(holdings);
}

export function calculateRealizedPnL(transactions: PortfolioTransaction[]): number {
  return transactions
    .filter((tx) => tx.type === "SELL")
    .reduce((sum, tx) => sum + tx.amount - (tx.fee ?? 0) - (tx.tax ?? 0), 0);
}

export function calculateDividendIncome(transactions: PortfolioTransaction[]): number {
  return transactions
    .filter((tx) => tx.type === "DIVIDEND" || tx.type === "DISTRIBUTION")
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function calculateTotalReturn(
  holdings: Holding[],
  transactions: PortfolioTransaction[]
): { amount: number; pct: number } {
  const unrealized = calculateUnrealizedPnL(holdings);
  const realized = calculateRealizedPnL(transactions);
  const dividends = calculateDividendIncome(transactions);
  const invested = calculateInvestedCapital(holdings);
  const amount = unrealized + realized + dividends;
  const pct = invested > 0 ? (amount / invested) * 100 : 0;
  return { amount, pct };
}

export function calculateCAGR(
  investedCapital: number,
  currentValue: number,
  inceptionDate: string
): number {
  if (investedCapital <= 0 || currentValue <= 0) return 0;
  const years =
    (Date.now() - new Date(inceptionDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (years < 0.01) return 0;
  return (Math.pow(currentValue / investedCapital, 1 / years) - 1) * 100;
}

export function calculateAllocationBySymbol(
  holdings: Holding[]
): Record<string, number> {
  return holdings.reduce<Record<string, number>>((acc, h) => {
    const val = toUSD(h.quantity * h.currentPrice, h.currency);
    acc[h.symbol] = (acc[h.symbol] ?? 0) + val;
    return acc;
  }, {});
}

export function calculateAllocationBySector(
  holdings: Holding[]
): Record<string, number> {
  return holdings.reduce<Record<string, number>>((acc, h) => {
    const sector = h.sector ?? "Other";
    const val = toUSD(h.quantity * h.currentPrice, h.currency);
    acc[sector] = (acc[sector] ?? 0) + val;
    return acc;
  }, {});
}

export function calculateAllocationByAssetClass(
  holdings: Holding[]
): Record<string, number> {
  return holdings.reduce<Record<string, number>>((acc, h) => {
    const val = toUSD(h.quantity * h.currentPrice, h.currency);
    acc[h.assetClass] = (acc[h.assetClass] ?? 0) + val;
    return acc;
  }, {});
}

export function calculateAllocationByBroker(
  holdings: Holding[]
): Record<string, number> {
  return holdings.reduce<Record<string, number>>((acc, h) => {
    const broker = h.broker ?? "Unknown";
    const val = toUSD(h.quantity * h.currentPrice, h.currency);
    acc[broker] = (acc[broker] ?? 0) + val;
    return acc;
  }, {});
}

export function calculateLargestPosition(
  holdings: Holding[]
): Holding | undefined {
  if (holdings.length === 0) return undefined;
  return holdings.reduce((top, h) =>
    toUSD(h.quantity * h.currentPrice, h.currency) >
    toUSD(top.quantity * top.currentPrice, top.currency)
      ? h
      : top
  );
}

export function calculateTopWinner(holdings: Holding[]): Holding | undefined {
  const withGain = holdings.filter((h) => h.averageCost > 0);
  if (withGain.length === 0) return undefined;
  return withGain.reduce((top, h) => {
    const pct = (h.currentPrice - h.averageCost) / h.averageCost;
    const topPct = (top.currentPrice - top.averageCost) / top.averageCost;
    return pct > topPct ? h : top;
  });
}

export function calculateTopLoser(holdings: Holding[]): Holding | undefined {
  const withGain = holdings.filter((h) => h.averageCost > 0);
  if (withGain.length === 0) return undefined;
  return withGain.reduce((worst, h) => {
    const pct = (h.currentPrice - h.averageCost) / h.averageCost;
    const worstPct = (worst.currentPrice - worst.averageCost) / worst.averageCost;
    return pct < worstPct ? h : worst;
  });
}

export function calculateProjectedValue(
  investedCapital: number,
  monthlyContribution: number,
  annualReturnPct: number,
  years: number
): number {
  const r = annualReturnPct / 100 / 12;
  const n = years * 12;
  if (r === 0) return investedCapital + monthlyContribution * n;
  const futureExisting = investedCapital * Math.pow(1 + r, n);
  const futureContributions = monthlyContribution * ((Math.pow(1 + r, n) - 1) / r);
  return futureExisting + futureContributions;
}

export function calculateWinRate(transactions: PortfolioTransaction[]): number {
  const sells = transactions.filter((tx) => tx.type === "SELL" && tx.amount !== 0);
  if (sells.length === 0) return 0;
  const wins = sells.filter((tx) => tx.amount > 0).length;
  return (wins / sells.length) * 100;
}
