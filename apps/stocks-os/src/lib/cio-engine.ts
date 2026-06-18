import type { Holding } from "@/lib/portfolio-types";
import type { WatchlistItem } from "@/lib/watchlist-types";
import type { CompanyThesis } from "@/lib/thesis-types";
import type { DividendEvent } from "@/lib/dividend-types";
import type { RebalanceTarget } from "@/lib/rebalance-types";

export type AlertSeverity = "critical" | "warning" | "info";

export interface CIOAlert {
  id: string;
  category: "risk" | "dividend" | "buyzone" | "rebalance" | "thesis";
  severity: AlertSeverity;
  title: string;
  detail: string;
}

export interface HealthScore {
  total: number;
  breakdown: {
    label: string;
    score: number;
    max: number;
    detail: string;
  }[];
}

export interface ReviewCheckItem {
  symbol: string;
  type: "thesis" | "watchlist" | "dividend";
  detail: string;
  urgent: boolean;
}

// ── Health score (0–100) ──────────────────────────────────────────────────

export function computeHealthScore(
  holdings: Holding[],
  theses: CompanyThesis[],
  dividends: DividendEvent[],
  watchlistItems: WatchlistItem[]
): HealthScore {
  const thesisSymbols = new Set(theses.map((t) => t.symbol));
  const heldSymbols = [...new Set(holdings.map((h) => h.symbol))];

  // 1. Diversification (0–20): portfolios with ≥3 holdings
  const diversificationScore = Math.min(20, holdings.length >= 10 ? 20 : holdings.length >= 5 ? 14 : holdings.length >= 3 ? 8 : 4);

  // 2. Documentation (0–25): % of held symbols with thesis
  const documented = heldSymbols.filter((s) => thesisSymbols.has(s)).length;
  const docPct = heldSymbols.length > 0 ? documented / heldSymbols.length : 0;
  const documentationScore = Math.round(docPct * 25);

  // 3. Income tracking (0–20): has received dividends
  const hasIncome = dividends.filter((e) => e.status === "received").length > 0;
  const incomeScore = hasIncome ? 20 : 0;

  // 4. Hunting activity (0–20): watchlist not empty + has items in Accumulating
  const huntingScore = watchlistItems.length === 0 ? 0
    : watchlistItems.some((w) => w.status === "Accumulating") ? 20
    : 12;

  // 5. Review health (0–15): no overdue thesis reviews
  const today = new Date().toISOString().split("T")[0]!;
  const overdueCount = theses.filter((t) => t.nextReviewDate && t.nextReviewDate < today).length;
  const reviewScore = overdueCount === 0 ? 15 : overdueCount <= 2 ? 8 : 0;

  const total = diversificationScore + documentationScore + incomeScore + huntingScore + reviewScore;

  return {
    total,
    breakdown: [
      { label: "Diversification", score: diversificationScore, max: 20, detail: `${holdings.length} holdings across portfolios` },
      { label: "Documentation", score: documentationScore, max: 25, detail: `${documented}/${heldSymbols.length} held symbols have thesis` },
      { label: "Income Tracking", score: incomeScore, max: 20, detail: hasIncome ? "Dividend records present" : "No dividend records" },
      { label: "Hunting Activity", score: huntingScore, max: 20, detail: `${watchlistItems.length} stocks tracked, ${watchlistItems.filter((w) => w.status === "Accumulating").length} accumulating` },
      { label: "Review Health", score: reviewScore, max: 15, detail: overdueCount === 0 ? "No overdue reviews" : `${overdueCount} overdue review${overdueCount !== 1 ? "s" : ""}` },
    ],
  };
}

// ── Risk alerts ───────────────────────────────────────────────────────────

export function getRiskAlerts(
  holdings: Holding[],
  theses: CompanyThesis[],
  watchlistItems: WatchlistItem[],
  rebalanceTargets: RebalanceTarget[],
  dividends: DividendEvent[]
): CIOAlert[] {
  const alerts: CIOAlert[] = [];
  const thesisSymbols = new Set(theses.map((t) => t.symbol));
  const today = new Date().toISOString().split("T")[0]!;

  // Concentration risk: any single holding > 25% of total portfolio value
  const totalValue = holdings.reduce((s, h) => s + h.currentPrice * h.quantity, 0);
  const symbolValues: Record<string, number> = {};
  for (const h of holdings) {
    symbolValues[h.symbol] = (symbolValues[h.symbol] ?? 0) + h.currentPrice * h.quantity;
  }
  Object.entries(symbolValues).forEach(([symbol, val]) => {
    const pct = totalValue > 0 ? (val / totalValue) * 100 : 0;
    if (pct > 25) {
      alerts.push({ id: `conc-${symbol}`, category: "risk", severity: "critical", title: `${symbol} concentration`, detail: `${pct.toFixed(1)}% of total portfolio — above 25% threshold` });
    }
  });

  // Missing thesis for held symbols
  const heldSymbols = [...new Set(holdings.map((h) => h.symbol))];
  const missing = heldSymbols.filter((s) => !thesisSymbols.has(s));
  if (missing.length > 0) {
    alerts.push({ id: "missing-thesis", category: "thesis", severity: "warning", title: "Missing investment thesis", detail: `${missing.join(", ")} held without documented thesis` });
  }

  // Overdue thesis reviews
  const overdue = theses.filter((t) => t.nextReviewDate && t.nextReviewDate < today);
  overdue.forEach((t) => {
    alerts.push({ id: `review-${t.id}`, category: "thesis", severity: "warning", title: `${t.symbol} review overdue`, detail: `Next review was ${t.nextReviewDate}` });
  });

  // Buy zone alerts
  const inZone = watchlistItems.filter(
    (w) => w.buyZoneLow != null && w.buyZoneHigh != null && w.currentPrice >= w.buyZoneLow && w.currentPrice <= w.buyZoneHigh && w.status !== "Sold"
  );
  inZone.forEach((w) => {
    alerts.push({ id: `bz-${w.id}`, category: "buyzone", severity: "info", title: `${w.symbol} in buy zone`, detail: `Current: ${w.currentPrice.toLocaleString()} — Zone: ${w.buyZoneLow!.toLocaleString()}–${w.buyZoneHigh!.toLocaleString()} ${w.currency}` });
  });

  // Rebalance actions needed
  const rebalanceNeeded = rebalanceTargets.filter((t) => {
    const symbolVal = symbolValues[t.symbol] ?? 0;
    const currentPct = totalValue > 0 ? (symbolVal / totalValue) * 100 : 0;
    const deviation = currentPct - t.targetWeight;
    return Math.abs(deviation) > 5;
  });
  if (rebalanceNeeded.length > 0) {
    alerts.push({ id: "rebalance", category: "rebalance", severity: "warning", title: "Rebalance needed", detail: `${rebalanceNeeded.length} position${rebalanceNeeded.length !== 1 ? "s" : ""} deviate more than 5% from target` });
  }

  // No dividends this year
  const currentYear = new Date().getFullYear().toString();
  const ytdDivs = dividends.filter((e) => e.status === "received" && e.exDate.startsWith(currentYear));
  if (holdings.length > 0 && ytdDivs.length === 0) {
    alerts.push({ id: "no-divs", category: "dividend", severity: "info", title: "No dividends received this year", detail: "Consider tracking dividend income in the Dividends section" });
  }

  return alerts;
}

// ── Review checklist ──────────────────────────────────────────────────────

export function getReviewChecklist(
  theses: CompanyThesis[],
  watchlistItems: WatchlistItem[]
): ReviewCheckItem[] {
  const today = new Date().toISOString().split("T")[0]!;
  const items: ReviewCheckItem[] = [];

  theses.forEach((t) => {
    if (t.nextReviewDate) {
      const overdue = t.nextReviewDate < today;
      const soon = !overdue && t.nextReviewDate <= new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]!;
      if (overdue || soon) {
        items.push({ symbol: t.symbol, type: "thesis", detail: `Review due ${t.nextReviewDate}`, urgent: overdue });
      }
    }
    if (!t.exitRule) {
      items.push({ symbol: t.symbol, type: "thesis", detail: "No exit rule defined", urgent: false });
    }
  });

  watchlistItems.filter((w) => w.status === "Accumulating").forEach((w) => {
    items.push({ symbol: w.symbol, type: "watchlist", detail: `Accumulating — check latest price vs buy zone`, urgent: false });
  });

  return items;
}
