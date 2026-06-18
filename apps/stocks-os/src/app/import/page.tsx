"use client";

import { useState } from "react";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { useDividendStore } from "@/store/useDividendStore";
import { STOCK_PORTFOLIOS } from "@/lib/portfolio-registry";
import type { Holding } from "@/lib/portfolio-types";
import type { DividendEvent } from "@/lib/dividend-types";
import { ImportPreviewTable } from "@/components/import/ImportPreviewTable";

type ImportType = "holdings" | "transactions" | "dividends";

const TEMPLATES: Record<ImportType, { headers: string[]; example: string }> = {
  holdings: {
    headers: ["portfolioId", "symbol", "name", "assetClass", "sector", "broker", "quantity", "averageCost", "currentPrice", "currency"],
    example: "retirement-5,VCB,Vietcombank,STOCK,Banking,VCBS,100,85000,90000,VND",
  },
  transactions: {
    headers: ["portfolioId", "symbol", "type", "date", "quantity", "price", "amount", "fee", "tax", "note"],
    example: "retirement-5,VCB,BUY,2025-01-15,100,85000,8500000,42500,,Monthly DCA",
  },
  dividends: {
    headers: ["portfolioId", "symbol", "broker", "exDate", "paymentDate", "amountPerShare", "shares", "grossAmount", "tax", "netAmount", "currency", "status"],
    example: "retirement-5,VCB,VCBS,2025-06-01,2025-06-20,1800,100,180000,0,180000,VND,received",
  },
};

function parseCsv(raw: string): string[][] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => line.split(",").map((cell) => cell.trim()));
}

function validateHoldings(rows: string[][]): Record<number, string> {
  const errors: Record<number, string> = {};
  const portfolioIds = new Set(STOCK_PORTFOLIOS.map((p) => p.id));
  rows.forEach((row, i) => {
    if (!row[0] || !portfolioIds.has(row[0])) errors[i] = "Invalid portfolioId";
    else if (!row[1]) errors[i] = "Symbol required";
    else if (!row[6] || isNaN(Number(row[6]))) errors[i] = "Invalid quantity";
    else if (!row[7] || isNaN(Number(row[7]))) errors[i] = "Invalid avgCost";
    else if (!row[8] || isNaN(Number(row[8]))) errors[i] = "Invalid currentPrice";
  });
  return errors;
}

function validateTransactions(rows: string[][]): Record<number, string> {
  const errors: Record<number, string> = {};
  const portfolioIds = new Set(STOCK_PORTFOLIOS.map((p) => p.id));
  const validTypes = ["BUY", "SELL", "DIVIDEND", "DISTRIBUTION", "DEPOSIT", "WITHDRAWAL", "FEE", "TAX"];
  rows.forEach((row, i) => {
    if (!row[0] || !portfolioIds.has(row[0])) errors[i] = "Invalid portfolioId";
    else if (!row[2] || !validTypes.includes(row[2].toUpperCase())) errors[i] = `Invalid type (use: ${validTypes.join(", ")})`;
    else if (!row[3] || !/^\d{4}-\d{2}-\d{2}$/.test(row[3])) errors[i] = "Date must be YYYY-MM-DD";
  });
  return errors;
}

function validateDividends(rows: string[][]): Record<number, string> {
  const errors: Record<number, string> = {};
  const portfolioIds = new Set(STOCK_PORTFOLIOS.map((p) => p.id));
  rows.forEach((row, i) => {
    if (!row[0] || !portfolioIds.has(row[0])) errors[i] = "Invalid portfolioId";
    else if (!row[1]) errors[i] = "Symbol required";
    else if (!row[3] || !/^\d{4}-\d{2}-\d{2}$/.test(row[3])) errors[i] = "exDate must be YYYY-MM-DD";
  });
  return errors;
}

function detectDuplicates(importType: ImportType, rows: string[][], existing: { symbol?: string; exDate?: string }[]): Set<number> {
  const dupes = new Set<number>();
  if (importType === "dividends") {
    const existingKeys = new Set(existing.map((e) => `${e.symbol ?? ""}::${e.exDate ?? ""}`));
    rows.forEach((row, i) => {
      const key = `${row[1] ?? ""}::${row[3] ?? ""}`;
      if (existingKeys.has(key)) dupes.add(i);
    });
  }
  return dupes;
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function ImportPage() {
  const portfolioStore = usePortfolioStore();
  const dividendStore = useDividendStore();

  const [importType, setImportType] = useState<ImportType>("holdings");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [csvText, setCsvText] = useState("");
  const [parsed, setParsed] = useState<string[][]>([]);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [duplicates, setDuplicates] = useState<Set<number>>(new Set());
  const [importDone, setImportDone] = useState(false);
  const [importCount, setImportCount] = useState(0);

  if (!portfolioStore.hydrated || !dividendStore.hydrated) {
    return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;
  }

  const template = TEMPLATES[importType];

  const handleParse = () => {
    const rows = parseCsv(csvText);
    let errs: Record<number, string> = {};
    let dupes = new Set<number>();
    if (importType === "holdings") errs = validateHoldings(rows);
    else if (importType === "transactions") errs = validateTransactions(rows);
    else errs = validateDividends(rows);

    const existingForDupe = importType === "dividends"
      ? dividendStore.events.map((e) => ({ symbol: e.symbol, exDate: e.exDate }))
      : [];
    dupes = detectDuplicates(importType, rows, existingForDupe);

    setParsed(rows);
    setErrors(errs);
    setDuplicates(dupes);
    setStep(2);
    setImportDone(false);
  };

  const validRows = parsed.filter((_, i) => !errors[i] && !duplicates.has(i));

  const handleImport = () => {
    let count = 0;
    if (importType === "holdings") {
      validRows.forEach((row) => {
        const h: Omit<Holding, "id"> = {
          portfolioId: row[0]!,
          symbol: (row[1] ?? "").toUpperCase(),
          name: row[2] ?? "",
          assetClass: (row[3] as Holding["assetClass"]) ?? "STOCK",
          sector: row[4] || undefined,
          broker: row[5] || undefined,
          quantity: parseFloat(row[6] ?? "0"),
          averageCost: parseFloat(row[7] ?? "0"),
          currentPrice: parseFloat(row[8] ?? "0"),
          currency: (row[9] as "VND" | "USD") ?? "VND",
        };
        portfolioStore.addHolding(h);
        count++;
      });
    } else if (importType === "transactions") {
      validRows.forEach((row) => {
        portfolioStore.addTransaction({
          portfolioId: row[0]!,
          symbol: row[1] || undefined,
          type: (row[2]?.toUpperCase() as "BUY") ?? "BUY",
          date: row[3] ?? new Date().toISOString().split("T")[0]!,
          quantity: row[4] ? parseFloat(row[4]) : undefined,
          price: row[5] ? parseFloat(row[5]) : undefined,
          amount: parseFloat(row[6] ?? "0"),
          fee: row[7] ? parseFloat(row[7]) : undefined,
          tax: row[8] ? parseFloat(row[8]) : undefined,
          note: row[9] || undefined,
        });
        count++;
      });
    } else {
      validRows.forEach((row) => {
        const aps = parseFloat(row[5] ?? "0");
        const sh = parseFloat(row[6] ?? "0");
        const event: Omit<DividendEvent, "id"> = {
          portfolioId: row[0]!,
          symbol: (row[1] ?? "").toUpperCase(),
          broker: row[2] || undefined,
          exDate: row[3] ?? "",
          paymentDate: row[4] || undefined,
          amountPerShare: aps,
          shares: sh,
          grossAmount: parseFloat(row[7] ?? "0"),
          tax: row[8] ? parseFloat(row[8]) : undefined,
          netAmount: parseFloat(row[9] ?? "0"),
          currency: (row[10] as "VND" | "USD") ?? "VND",
          status: (row[11] as "received" | "expected") ?? "received",
        };
        dividendStore.addDividend(event);
        count++;
      });
    }
    setImportCount(count);
    setImportDone(true);
    setStep(3);
  };

  const reset = () => {
    setCsvText("");
    setParsed([]);
    setErrors({});
    setDuplicates(new Set());
    setImportDone(false);
    setStep(1);
  };

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Import</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Bulk import Holdings, Transactions, or Dividends via CSV</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step === s ? "bg-sky-500 text-white" : step > s ? "bg-emerald-500/30 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>
              {step > s ? "✓" : s}
            </div>
            <span className={step === s ? "text-white" : "text-zinc-600"}>
              {s === 1 ? "Setup" : s === 2 ? "Preview" : "Done"}
            </span>
            {s < 3 && <div className="w-8 h-px bg-zinc-800" />}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 mb-2 block">Import Type</label>
            <div className="flex gap-2">
              {(["holdings", "transactions", "dividends"] as ImportType[]).map((t) => (
                <button key={t} onClick={() => { setImportType(t); setCsvText(""); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${importType === t ? "bg-sky-500/20 text-sky-400 border border-sky-500/40" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-zinc-800/60 px-4 py-3 space-y-1">
            <div className="text-xs text-zinc-500 font-medium">Expected columns:</div>
            <div className="text-xs text-zinc-400 font-mono">{template.headers.join(", ")}</div>
            <div className="text-xs text-zinc-600 mt-1">Example:</div>
            <div className="text-xs text-zinc-500 font-mono">{template.example}</div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Paste CSV (one row per line, no header row)</label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={8}
              placeholder={template.example}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-300 font-mono focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>

          <button
            onClick={handleParse}
            disabled={!csvText.trim()}
            className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            Preview →
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-zinc-400">{parsed.length} rows parsed</span>
            <span className="text-emerald-400">{validRows.length} valid</span>
            {Object.keys(errors).length > 0 && <span className="text-red-400">{Object.keys(errors).length} errors</span>}
            {duplicates.size > 0 && <span className="text-amber-400">{duplicates.size} duplicates (will skip)</span>}
          </div>

          <ImportPreviewTable headers={template.headers} rows={parsed} errors={errors} duplicates={duplicates} />

          <div className="flex gap-3">
            <button onClick={handleImport} disabled={validRows.length === 0}
              className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors">
              Import {validRows.length} rows
            </button>
            <button onClick={() => setStep(1)} className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors">
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && importDone && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-6 py-8 text-center space-y-3">
          <div className="text-3xl">✓</div>
          <div className="text-white font-semibold">Import Complete</div>
          <div className="text-sm text-zinc-400">{importCount} {importType} imported successfully</div>
          <button onClick={reset} className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition-colors">
            Import More
          </button>
        </div>
      )}
    </div>
  );
}
