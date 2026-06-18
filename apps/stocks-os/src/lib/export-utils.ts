import type { Holding, PortfolioTransaction, StockPortfolio } from "./portfolio-types";

function csvEscape(val: unknown): string {
  if (val === undefined || val === null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(fields: unknown[]): string {
  return fields.map(csvEscape).join(",");
}

// ── Holdings ─────────────────────────────────────────────────────────────────

const HOLDING_HEADERS = [
  "Portfolio ID", "Symbol", "Name", "Asset Class", "Sector", "Provider",
  "Broker", "Quantity", "Avg Cost", "Current Price", "Currency",
  "Annual Dividend", "Entry Date", "Target Price", "Stop Loss",
];

export function holdingsToCsv(holdings: Holding[]): string {
  const lines = [
    HOLDING_HEADERS.join(","),
    ...holdings.map((h) =>
      row([
        h.portfolioId, h.symbol, h.name, h.assetClass, h.sector ?? "",
        h.provider ?? "", h.broker ?? "", h.quantity, h.averageCost,
        h.currentPrice, h.currency, h.annualDividend ?? "", h.entryDate ?? "",
        h.targetPrice ?? "", h.stopLoss ?? "",
      ])
    ),
  ];
  return lines.join("\n");
}

// ── Transactions ──────────────────────────────────────────────────────────────

const TX_HEADERS = [
  "Portfolio ID", "Holding ID", "Symbol", "Type", "Date",
  "Quantity", "Price", "Amount", "Fee", "Tax", "Note",
];

export function transactionsToCsv(transactions: PortfolioTransaction[]): string {
  const lines = [
    TX_HEADERS.join(","),
    ...transactions.map((t) =>
      row([
        t.portfolioId, t.holdingId ?? "", t.symbol ?? "", t.type, t.date,
        t.quantity ?? "", t.price ?? "", t.amount, t.fee ?? "", t.tax ?? "", t.note ?? "",
      ])
    ),
  ];
  return lines.join("\n");
}

// ── JSON exports ──────────────────────────────────────────────────────────────

export function portfolioToJson(
  portfolio: StockPortfolio,
  holdings: Holding[],
  transactions: PortfolioTransaction[]
): string {
  return JSON.stringify(
    { exportedAt: new Date().toISOString(), portfolio, holdings, transactions },
    null,
    2
  );
}

export function allPortfoliosToJson(
  portfolios: StockPortfolio[],
  holdings: Holding[],
  transactions: PortfolioTransaction[]
): string {
  return JSON.stringify(
    { exportedAt: new Date().toISOString(), portfolios, holdings, transactions },
    null,
    2
  );
}

// ── Download trigger ──────────────────────────────────────────────────────────

export function downloadFile(content: string, filename: string, mimeType: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function fileTimestamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
}
