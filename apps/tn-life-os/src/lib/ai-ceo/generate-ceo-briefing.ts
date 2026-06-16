import type { OSType, TNOSSnapshot } from "@tn-os/schemas";

export type SnapshotMap = Partial<Record<OSType, TNOSSnapshot>>;

export type BriefingTone = "good" | "watch" | "risk" | "neutral";

export type BriefingSection = {
  title: string;
  tone: BriefingTone;
  summary: string;
  metrics: Array<{ label: string; value: string; tone?: BriefingTone }>;
  notes: string[];
};

export type CeoBriefing = {
  generatedAt: string;
  connectedSystems: number;
  missingSystems: string[];
  executiveSummary: string;
  sections: {
    netWorthSummary: BriefingSection;
    allocationDrift: BriefingSection;
    tradingRisk: BriefingSection;
    businessPerformance: BriefingSection;
    cryptoExposure: BriefingSection;
    stocksExposure: BriefingSection;
  };
  topRisks: string[];
  topOpportunities: string[];
  topPriorities: string[];
  suggestedDecisions: string[];
  weeklyActionPlan: string[];
};

const CHILD_SYSTEMS: Array<{ osType: OSType; label: string }> = [
  { osType: "wealth_os", label: "Wealth OS" },
  { osType: "investment_os", label: "Investment OS" },
  { osType: "trading_os", label: "Trading OS" },
  { osType: "business_os", label: "Business OS" },
  { osType: "crypto_os", label: "Crypto OS" },
  { osType: "stocks_os", label: "Stocks OS" },
];

function summary(snapshot: TNOSSnapshot | undefined): Record<string, unknown> {
  return snapshot?.summary ?? {};
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function str(value: unknown, fallback = "-"): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function money(value: number, currency = "USD"): string {
  const compact = Math.abs(value) >= 1_000_000;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? "compact" : "standard",
  }).format(value);
}

function pct(value: number): string {
  return `${value.toFixed(1)}%`;
}

function riskTone(value: string): BriefingTone {
  const normalized = value.toLowerCase();
  if (["safe", "low"].includes(normalized)) return "good";
  if (["warning", "medium"].includes(normalized)) return "watch";
  if (["danger", "breach", "high"].includes(normalized)) return "risk";
  return "neutral";
}

function uniqTake(items: string[], count: number, fallback: string[]): string[] {
  const seen = new Set<string>();
  const unique = items.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return [...unique, ...fallback].slice(0, count);
}

function missingSection(title: string, osLabel: string): BriefingSection {
  return {
    title,
    tone: "neutral",
    summary: `${osLabel} snapshot is not imported yet.`,
    metrics: [{ label: "Status", value: "Offline", tone: "neutral" }],
    notes: [`Import a fresh ${osLabel} .tnos.json snapshot to activate this section.`],
  };
}

export function generateCeoBriefing(snapshots: SnapshotMap): CeoBriefing {
  const wealth = summary(snapshots.wealth_os);
  const investment = summary(snapshots.investment_os);
  const trading = summary(snapshots.trading_os);
  const business = summary(snapshots.business_os);
  const crypto = summary(snapshots.crypto_os);
  const stocks = summary(snapshots.stocks_os);

  const missingSystems = CHILD_SYSTEMS
    .filter((system) => !snapshots[system.osType])
    .map((system) => system.label);
  const connectedSystems = CHILD_SYSTEMS.length - missingSystems.length;

  const wealthCurrency = str(wealth.currency, "VND");
  const netWorth = num(wealth.total_net_worth);
  const assets = num(wealth.total_assets);
  const liabilities = num(wealth.total_liabilities);
  const emergencyMonths = num(wealth.emergency_fund_months);
  const emergencyTarget = num(wealth.emergency_fund_target_months) || 6;

  const investmentValue = num(investment.total_current_value);
  const investmentGainPct = num(investment.total_gain_loss_pct);
  const cashWaiting = num(investment.cash_waiting_deployment);
  const conviction = str(investment.conviction_score, "unknown");

  const ftmoRisk = str(trading.ftmo_risk_status, str(trading.risk_status, "Safe"));
  const weeklyPnl = num(trading.weekly_pnl);
  const monthlyPnl = num(trading.monthly_pnl);
  const dailyLossUsage = num(trading.daily_loss_usage_pct);
  const maxLossUsage = num(trading.max_loss_usage_pct);
  const disciplineScore = num(trading.discipline_score);

  const monthlyRevenue = num(business.monthly_revenue);
  const netProfit = num(business.net_profit);
  const marginPct = num(business.net_profit_margin_pct);
  const businessRisk = str(business.business_risk, "low");
  const openTasks = num(business.open_tasks);
  const highPriorityTasks = num(business.high_priority_tasks);

  const cryptoValue = num(crypto.total_crypto_value_usd);
  const stablecoinBalance = num(crypto.stablecoin_balance_usd);
  const defiExposure = num(crypto.defi_exposure_usd);
  const walletSecurityScore = num(crypto.wallet_security_score);
  const exchangeRisk = str(crypto.exchange_risk, "low");
  const btcProgress = num(crypto.target_btc_progress_pct);

  const stockValue = num(stocks.total_stock_value_usd);
  const stockCash = num(stocks.cash_available_usd);
  const dividendIncome = num(stocks.annual_dividend_income_usd);
  const valuationRisk = str(stocks.valuation_risk, "low");
  const activeBuyZones = num(stocks.buy_zones_active);

  const netWorthSummary: BriefingSection = snapshots.wealth_os
    ? {
        title: "Net Worth Summary",
        tone: emergencyMonths >= emergencyTarget && liabilities <= assets * 0.4 ? "good" : "watch",
        summary:
          netWorth > 0
            ? `Net worth is ${money(netWorth, wealthCurrency)} with ${money(assets, wealthCurrency)} in assets and ${money(liabilities, wealthCurrency)} in liabilities.`
            : "Wealth snapshot is connected, but net worth is not positive yet.",
        metrics: [
          { label: "Net Worth", value: money(netWorth, wealthCurrency), tone: netWorth >= 0 ? "good" : "risk" },
          { label: "Assets", value: money(assets, wealthCurrency) },
          { label: "Liabilities", value: money(liabilities, wealthCurrency), tone: liabilities > assets * 0.5 ? "watch" : "neutral" },
          { label: "Emergency Fund", value: `${emergencyMonths.toFixed(1)} mo`, tone: emergencyMonths >= emergencyTarget ? "good" : "watch" },
        ],
        notes: [
          emergencyMonths < emergencyTarget ? "Emergency fund is below target; protect liquidity before adding new risk." : "Emergency fund is at or above target.",
          liabilities > assets * 0.5 ? "Debt load is elevated relative to assets." : "Debt load is within the current asset base.",
        ],
      }
    : missingSection("Net Worth Summary", "Wealth OS");

  const totalPublicMarketExposure = investmentValue + stockValue + cryptoValue;
  const cryptoShare = totalPublicMarketExposure > 0 ? (cryptoValue / totalPublicMarketExposure) * 100 : 0;
  const stockShare = totalPublicMarketExposure > 0 ? (stockValue / totalPublicMarketExposure) * 100 : 0;
  const investmentShare = totalPublicMarketExposure > 0 ? (investmentValue / totalPublicMarketExposure) * 100 : 0;
  const cashDeploymentPct = investmentValue > 0 ? (cashWaiting / investmentValue) * 100 : 0;

  const allocationDrift: BriefingSection = {
    title: "Allocation Drift",
    tone: cryptoShare > 35 || cashDeploymentPct > 25 ? "watch" : "neutral",
    summary:
      totalPublicMarketExposure > 0
        ? `Tracked market exposure is split across investments (${pct(investmentShare)}), stocks (${pct(stockShare)}), and crypto (${pct(cryptoShare)}).`
        : "No investment, stocks, or crypto snapshots are connected yet.",
    metrics: [
      { label: "Investment OS", value: money(investmentValue, str(investment.currency, "VND")) },
      { label: "Stocks OS", value: money(stockValue) },
      { label: "Crypto OS", value: money(cryptoValue) },
      { label: "Idle Capital", value: money(cashWaiting, str(investment.currency, "VND")), tone: cashDeploymentPct > 25 ? "watch" : "neutral" },
    ],
    notes: [
      cryptoShare > 35 ? "Crypto is a large share of tracked market exposure; review downside tolerance." : "Crypto exposure is not dominating tracked market exposure.",
      cashDeploymentPct > 25 ? "Cash waiting deployment is high; review buy zones and DCA plan." : `Investment conviction is ${conviction}.`,
    ],
  };

  const tradingRisk: BriefingSection = snapshots.trading_os
    ? {
        title: "Trading Risk",
        tone: riskTone(ftmoRisk),
        summary: `Trading risk is ${ftmoRisk} with weekly PnL ${money(weeklyPnl)} and monthly PnL ${money(monthlyPnl)}.`,
        metrics: [
          { label: "FTMO Risk", value: ftmoRisk, tone: riskTone(ftmoRisk) },
          { label: "Weekly PnL", value: money(weeklyPnl), tone: weeklyPnl >= 0 ? "good" : "risk" },
          { label: "Daily DD Used", value: pct(dailyLossUsage), tone: dailyLossUsage >= 70 ? "risk" : dailyLossUsage >= 50 ? "watch" : "neutral" },
          { label: "Discipline", value: `${disciplineScore}/100`, tone: disciplineScore >= 75 ? "good" : "watch" },
        ],
        notes: [
          dailyLossUsage >= 70 || maxLossUsage >= 70 ? "Drawdown usage is elevated; reduce size until risk normalizes." : "Drawdown usage is under control.",
          str(trading.focus_setup_next_week, "No focus setup set for next week."),
          ...list(trading.rule_violations).slice(0, 2),
        ],
      }
    : missingSection("Trading Risk", "Trading OS");

  const businessPerformance: BriefingSection = snapshots.business_os
    ? {
        title: "Business Performance",
        tone: netProfit > 0 && businessRisk === "low" ? "good" : riskTone(businessRisk),
        summary: `Business generated ${money(monthlyRevenue)} revenue and ${money(netProfit)} net profit at ${pct(marginPct)} margin.`,
        metrics: [
          { label: "Revenue", value: money(monthlyRevenue) },
          { label: "Net Profit", value: money(netProfit), tone: netProfit >= 0 ? "good" : "risk" },
          { label: "Margin", value: pct(marginPct), tone: marginPct >= 30 ? "good" : marginPct >= 10 ? "watch" : "risk" },
          { label: "High Priority Tasks", value: String(highPriorityTasks), tone: highPriorityTasks > 3 ? "watch" : "neutral" },
        ],
        notes: [
          openTasks > 10 ? "Open task load is high; prune or delegate before adding new work." : "Open task load is manageable.",
          ...list(business.business_risk_notes).slice(0, 2),
          ...list(business.next_growth_actions).slice(0, 2),
        ],
      }
    : missingSection("Business Performance", "Business OS");

  const cryptoExposure: BriefingSection = snapshots.crypto_os
    ? {
        title: "Crypto Exposure",
        tone: riskTone(exchangeRisk) === "risk" || walletSecurityScore < 70 ? "risk" : cryptoShare > 35 ? "watch" : "neutral",
        summary: `Crypto exposure is ${money(cryptoValue)}, with ${money(stablecoinBalance)} in stablecoins and BTC target progress at ${pct(btcProgress)}.`,
        metrics: [
          { label: "Total Crypto", value: money(cryptoValue) },
          { label: "Stablecoins", value: money(stablecoinBalance) },
          { label: "DeFi Exposure", value: money(defiExposure), tone: defiExposure > cryptoValue * 0.25 ? "watch" : "neutral" },
          { label: "Security Score", value: `${walletSecurityScore}/100`, tone: walletSecurityScore >= 80 ? "good" : "watch" },
        ],
        notes: [
          exchangeRisk !== "low" ? `Exchange risk is ${exchangeRisk}; reduce exchange custody or review controls.` : "Exchange risk is low.",
          ...list(crypto.crypto_risk_notes).slice(0, 2),
          ...list(crypto.next_actions).slice(0, 2),
        ],
      }
    : missingSection("Crypto Exposure", "Crypto OS");

  const stocksExposure: BriefingSection = snapshots.stocks_os
    ? {
        title: "Stocks Exposure",
        tone: riskTone(valuationRisk),
        summary: `Stocks exposure is ${money(stockValue)} with ${money(stockCash)} cash available and ${money(dividendIncome)} annual dividend income tracked.`,
        metrics: [
          { label: "Total Stocks", value: money(stockValue) },
          { label: "Cash Available", value: money(stockCash) },
          { label: "Dividend Income", value: money(dividendIncome) },
          { label: "Active Buy Zones", value: String(activeBuyZones), tone: activeBuyZones > 0 ? "good" : "neutral" },
        ],
        notes: [
          valuationRisk !== "low" ? `Valuation risk is ${valuationRisk}; review entries before adding size.` : "Valuation risk is low.",
          ...list(stocks.stocks_risk_notes).slice(0, 2),
          ...list(stocks.next_actions).slice(0, 2),
        ],
      }
    : missingSection("Stocks Exposure", "Stocks OS");

  const riskCandidates = [
    emergencyMonths < emergencyTarget ? `Emergency fund below target (${emergencyMonths.toFixed(1)} / ${emergencyTarget.toFixed(1)} months).` : "",
    ftmoRisk !== "Safe" ? `Trading risk status is ${ftmoRisk}.` : "",
    dailyLossUsage >= 70 ? `Trading daily drawdown usage is high at ${pct(dailyLossUsage)}.` : "",
    businessRisk !== "low" ? `Business risk is ${businessRisk}.` : "",
    marginPct < 10 && monthlyRevenue > 0 ? `Business margin is thin at ${pct(marginPct)}.` : "",
    exchangeRisk !== "low" ? `Crypto exchange risk is ${exchangeRisk}.` : "",
    walletSecurityScore > 0 && walletSecurityScore < 80 ? `Crypto wallet security score is ${walletSecurityScore}/100.` : "",
    valuationRisk !== "low" ? `Stocks valuation risk is ${valuationRisk}.` : "",
    ...list(trading.rule_violations),
    ...list(business.business_risk_notes),
    ...list(crypto.crypto_risk_notes),
    ...list(stocks.stocks_risk_notes),
  ].filter(Boolean);

  const opportunityCandidates = [
    cashWaiting > 0 ? `${money(cashWaiting, str(investment.currency, "VND"))} is waiting deployment in Investment OS.` : "",
    activeBuyZones > 0 ? `${activeBuyZones} stock buy zone${activeBuyZones === 1 ? "" : "s"} are active or waiting.` : "",
    btcProgress < 100 && snapshots.crypto_os ? `BTC target is ${pct(btcProgress)} complete; continue disciplined accumulation if risk budget allows.` : "",
    marginPct >= 30 ? `Business margin is strong at ${pct(marginPct)}; consider scaling the highest ROI channel.` : "",
    weeklyPnl > 0 && disciplineScore >= 75 ? "Trading performance and discipline are aligned this week." : "",
    ...list(investment.next_buy_zones).slice(0, 2),
    ...list(business.next_growth_actions).slice(0, 2),
    ...list(crypto.next_actions).slice(0, 2),
    ...list(stocks.next_actions).slice(0, 2),
  ].filter(Boolean);

  const priorityCandidates = [
    missingSystems.length > 0 ? `Import missing snapshots: ${missingSystems.join(", ")}.` : "",
    emergencyMonths < emergencyTarget ? "Close the emergency fund gap before taking new discretionary risk." : "",
    ftmoRisk !== "Safe" || dailyLossUsage >= 50 ? "Review trading risk and size down until risk status is Safe." : "",
    highPriorityTasks > 0 ? `Clear ${highPriorityTasks} high-priority business task${highPriorityTasks === 1 ? "" : "s"}.` : "",
    walletSecurityScore > 0 && walletSecurityScore < 80 ? "Complete the crypto security checklist before adding exposure." : "",
    valuationRisk !== "low" ? "Review stock valuation notes before deploying new capital." : "",
    cashWaiting > 0 ? "Turn idle investment cash into a specific DCA or buy-zone plan." : "",
  ].filter(Boolean);

  const decisionCandidates = [
    cashWaiting > 0 ? "Decide how much idle investment cash should be deployed this month versus held for liquidity." : "",
    cryptoShare > 35 ? "Decide whether crypto exposure should be capped as a percentage of tracked market assets." : "",
    ftmoRisk !== "Safe" ? "Decide whether trading should pause until drawdown and rule violations are reviewed." : "",
    businessRisk !== "low" || highPriorityTasks > 3 ? "Decide which business initiative should be delayed or delegated this week." : "",
    valuationRisk !== "low" ? "Decide whether stock entries need stricter buy-zone discipline." : "",
    missingSystems.length > 0 ? "Decide a weekly snapshot import cadence so the CEO layer stays current." : "",
  ].filter(Boolean);

  const topRisks = uniqTake(riskCandidates, 3, ["No major cross-system risks detected from connected snapshots."]);
  const topOpportunities = uniqTake(opportunityCandidates, 3, ["Import more snapshots to surface better opportunity signals."]);
  const topPriorities = uniqTake(priorityCandidates, 3, ["Review the CEO Dashboard and confirm this week's single most important outcome."]);
  const suggestedDecisions = uniqTake(decisionCandidates, 4, ["Choose one decision to document in the Decision Registry this week."]);
  const primaryPriority = topPriorities[0] ?? "Review the CEO Dashboard and confirm this week's single most important outcome.";
  const primaryRisk = topRisks[0] ?? "No major cross-system risks detected from connected snapshots.";
  const primaryOpportunity = topOpportunities[0] ?? "Import more snapshots to surface better opportunity signals.";

  return {
    generatedAt: new Date().toISOString(),
    connectedSystems,
    missingSystems,
    executiveSummary:
      connectedSystems === 0
        ? "No child OS snapshots are imported yet. Import snapshots to generate a complete CEO briefing."
        : `${connectedSystems}/6 operating systems are connected. Main focus: ${primaryPriority}`,
    sections: {
      netWorthSummary,
      allocationDrift,
      tradingRisk,
      businessPerformance,
      cryptoExposure,
      stocksExposure,
    },
    topRisks,
    topOpportunities,
    topPriorities,
    suggestedDecisions,
    weeklyActionPlan: [
      primaryPriority,
      primaryRisk === "No major cross-system risks detected from connected snapshots." ? "Confirm snapshots are fresh and complete." : `Mitigate: ${primaryRisk}`,
      primaryOpportunity === "Import more snapshots to surface better opportunity signals." ? "Import missing child OS snapshots." : `Capture: ${primaryOpportunity}`,
      "Record one decision or review note before the next weekly review.",
    ],
  };
}
