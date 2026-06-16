"use client";

import { useState, useEffect, useCallback } from "react";

export type CryptoHolding = {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  avg_buy_price: number;
  current_price: number;
  location: string;
  category: "layer1" | "layer2" | "defi" | "stablecoin" | "meme" | "other";
  notes?: string;
  created_at: string;
};

export type CryptoWallet = {
  id: string;
  name: string;
  type: "hot" | "cold" | "hardware" | "exchange";
  chain: string;
  balance_usd: number;
  notes?: string;
  created_at: string;
};

export type CryptoExchange = {
  id: string;
  name: string;
  status: "active" | "inactive";
  balance_usd: number;
  risk_level: "low" | "medium" | "high";
  notes?: string;
  created_at: string;
};

export type Stablecoin = {
  id: string;
  symbol: string;
  amount: number;
  location: string;
  purpose: string;
  notes?: string;
  created_at: string;
};

export type DeFiPosition = {
  id: string;
  protocol: string;
  chain: string;
  type: "lp" | "lending" | "staking" | "yield" | "other";
  value_usd: number;
  apy?: number;
  risk: "low" | "medium" | "high";
  status: "active" | "closed";
  notes?: string;
  created_at: string;
};

export type CryptoTransaction = {
  id: string;
  type: "buy" | "sell" | "transfer" | "swap" | "stake" | "earn";
  symbol: string;
  amount: number;
  price_usd: number;
  date: string;
  fee_usd?: number;
  notes?: string;
  created_at: string;
};

export type ColdWalletNote = {
  id: string;
  label: string;
  hint: string;
  last_verified?: string;
  created_at: string;
};

export type SecurityCheckItem = {
  id: string;
  label: string;
  done: boolean;
  notes?: string;
  created_at: string;
};

export type CryptoThesis = {
  id: string;
  symbol: string;
  title: string;
  timeframe: string;
  conviction: number;
  target_price?: number;
  thesis: string;
  status: "active" | "invalidated" | "fulfilled";
  created_at: string;
};

interface CryptoData {
  holdings: CryptoHolding[];
  wallets: CryptoWallet[];
  exchanges: CryptoExchange[];
  stablecoins: Stablecoin[];
  defi_positions: DeFiPosition[];
  transactions: CryptoTransaction[];
  cold_wallet_notes: ColdWalletNote[];
  security_checklist: SecurityCheckItem[];
  theses: CryptoThesis[];
  target_btc_amount: number;
}

const DEFAULT_DATA: CryptoData = {
  holdings: [],
  wallets: [],
  exchanges: [],
  stablecoins: [],
  defi_positions: [],
  transactions: [],
  cold_wallet_notes: [],
  security_checklist: [],
  theses: [],
  target_btc_amount: 1.0,
};

const STORAGE_KEY = "crypto_os_data";

function loadData(): CryptoData {
  if (typeof window === "undefined") return DEFAULT_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const p = JSON.parse(raw) as Partial<CryptoData>;
    return {
      holdings: p.holdings ?? [],
      wallets: p.wallets ?? [],
      exchanges: p.exchanges ?? [],
      stablecoins: p.stablecoins ?? [],
      defi_positions: p.defi_positions ?? [],
      transactions: p.transactions ?? [],
      cold_wallet_notes: p.cold_wallet_notes ?? [],
      security_checklist: p.security_checklist ?? [],
      theses: p.theses ?? [],
      target_btc_amount: p.target_btc_amount ?? 1.0,
    };
  } catch {
    return DEFAULT_DATA;
  }
}

function persist(data: CryptoData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function useCryptoStore() {
  const [data, setData] = useState<CryptoData>(DEFAULT_DATA);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(loadData());
    setHydrated(true);
  }, []);

  const update = useCallback((updater: (prev: CryptoData) => CryptoData) => {
    setData((prev) => {
      const next = updater(prev);
      persist(next);
      return next;
    });
  }, []);

  const addHolding = useCallback((h: Omit<CryptoHolding, "id" | "created_at">) => {
    update((d) => ({ ...d, holdings: [...d.holdings, { ...h, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updateHolding = useCallback((h: CryptoHolding) => {
    update((d) => ({ ...d, holdings: d.holdings.map((x) => (x.id === h.id ? h : x)) }));
  }, [update]);
  const deleteHolding = useCallback((id: string) => {
    update((d) => ({ ...d, holdings: d.holdings.filter((x) => x.id !== id) }));
  }, [update]);

  const addWallet = useCallback((w: Omit<CryptoWallet, "id" | "created_at">) => {
    update((d) => ({ ...d, wallets: [...d.wallets, { ...w, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updateWallet = useCallback((w: CryptoWallet) => {
    update((d) => ({ ...d, wallets: d.wallets.map((x) => (x.id === w.id ? w : x)) }));
  }, [update]);
  const deleteWallet = useCallback((id: string) => {
    update((d) => ({ ...d, wallets: d.wallets.filter((x) => x.id !== id) }));
  }, [update]);

  const addExchange = useCallback((e: Omit<CryptoExchange, "id" | "created_at">) => {
    update((d) => ({ ...d, exchanges: [...d.exchanges, { ...e, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updateExchange = useCallback((e: CryptoExchange) => {
    update((d) => ({ ...d, exchanges: d.exchanges.map((x) => (x.id === e.id ? e : x)) }));
  }, [update]);
  const deleteExchange = useCallback((id: string) => {
    update((d) => ({ ...d, exchanges: d.exchanges.filter((x) => x.id !== id) }));
  }, [update]);

  const addStablecoin = useCallback((s: Omit<Stablecoin, "id" | "created_at">) => {
    update((d) => ({ ...d, stablecoins: [...d.stablecoins, { ...s, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updateStablecoin = useCallback((s: Stablecoin) => {
    update((d) => ({ ...d, stablecoins: d.stablecoins.map((x) => (x.id === s.id ? s : x)) }));
  }, [update]);
  const deleteStablecoin = useCallback((id: string) => {
    update((d) => ({ ...d, stablecoins: d.stablecoins.filter((x) => x.id !== id) }));
  }, [update]);

  const addDeFiPosition = useCallback((p: Omit<DeFiPosition, "id" | "created_at">) => {
    update((d) => ({ ...d, defi_positions: [...d.defi_positions, { ...p, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updateDeFiPosition = useCallback((p: DeFiPosition) => {
    update((d) => ({ ...d, defi_positions: d.defi_positions.map((x) => (x.id === p.id ? p : x)) }));
  }, [update]);
  const deleteDeFiPosition = useCallback((id: string) => {
    update((d) => ({ ...d, defi_positions: d.defi_positions.filter((x) => x.id !== id) }));
  }, [update]);

  const addTransaction = useCallback((t: Omit<CryptoTransaction, "id" | "created_at">) => {
    update((d) => ({ ...d, transactions: [{ ...t, id: uid(), created_at: new Date().toISOString() }, ...d.transactions] }));
  }, [update]);
  const updateTransaction = useCallback((t: CryptoTransaction) => {
    update((d) => ({ ...d, transactions: d.transactions.map((x) => (x.id === t.id ? t : x)) }));
  }, [update]);
  const deleteTransaction = useCallback((id: string) => {
    update((d) => ({ ...d, transactions: d.transactions.filter((x) => x.id !== id) }));
  }, [update]);

  const addColdWalletNote = useCallback((n: Omit<ColdWalletNote, "id" | "created_at">) => {
    update((d) => ({ ...d, cold_wallet_notes: [...d.cold_wallet_notes, { ...n, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updateColdWalletNote = useCallback((n: ColdWalletNote) => {
    update((d) => ({ ...d, cold_wallet_notes: d.cold_wallet_notes.map((x) => (x.id === n.id ? n : x)) }));
  }, [update]);
  const deleteColdWalletNote = useCallback((id: string) => {
    update((d) => ({ ...d, cold_wallet_notes: d.cold_wallet_notes.filter((x) => x.id !== id) }));
  }, [update]);

  const toggleSecurityCheck = useCallback((id: string) => {
    update((d) => ({ ...d, security_checklist: d.security_checklist.map((x) => (x.id === id ? { ...x, done: !x.done } : x)) }));
  }, [update]);
  const addSecurityCheck = useCallback((s: Omit<SecurityCheckItem, "id" | "created_at">) => {
    update((d) => ({ ...d, security_checklist: [...d.security_checklist, { ...s, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const deleteSecurityCheck = useCallback((id: string) => {
    update((d) => ({ ...d, security_checklist: d.security_checklist.filter((x) => x.id !== id) }));
  }, [update]);

  const addThesis = useCallback((t: Omit<CryptoThesis, "id" | "created_at">) => {
    update((d) => ({ ...d, theses: [...d.theses, { ...t, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updateThesis = useCallback((t: CryptoThesis) => {
    update((d) => ({ ...d, theses: d.theses.map((x) => (x.id === t.id ? t : x)) }));
  }, [update]);
  const deleteThesis = useCallback((id: string) => {
    update((d) => ({ ...d, theses: d.theses.filter((x) => x.id !== id) }));
  }, [update]);

  const setTargetBTC = useCallback((amount: number) => {
    update((d) => ({ ...d, target_btc_amount: amount }));
  }, [update]);

  const seedSampleData = useCallback(() => {
    const now = new Date().toISOString();
    const sample: CryptoData = {
      target_btc_amount: 1.0,
      holdings: [
        { id: uid(), symbol: "BTC", name: "Bitcoin", amount: 0.15, avg_buy_price: 42000, current_price: 68000, location: "Ledger", category: "layer1", notes: "Long-term hold", created_at: now },
        { id: uid(), symbol: "ETH", name: "Ethereum", amount: 2.5, avg_buy_price: 2200, current_price: 3800, location: "MetaMask", category: "layer1", created_at: now },
        { id: uid(), symbol: "BNB", name: "BNB", amount: 8, avg_buy_price: 280, current_price: 550, location: "Binance", category: "layer1", created_at: now },
        { id: uid(), symbol: "SOL", name: "Solana", amount: 15, avg_buy_price: 85, current_price: 175, location: "Phantom", category: "layer1", created_at: now },
        { id: uid(), symbol: "USDT", name: "Tether", amount: 1500, avg_buy_price: 1, current_price: 1, location: "Binance", category: "stablecoin", created_at: now },
        { id: uid(), symbol: "USDC", name: "USD Coin", amount: 500, avg_buy_price: 1, current_price: 1, location: "MetaMask", category: "stablecoin", created_at: now },
      ],
      wallets: [
        { id: uid(), name: "Ledger Nano X", type: "hardware", chain: "BTC/ETH/multi", balance_usd: 10200, notes: "Primary cold storage — BTC + ETH", created_at: now },
        { id: uid(), name: "MetaMask ETH", type: "hot", chain: "ETH/EVM", balance_usd: 10000, notes: "DeFi & ETH hot wallet", created_at: now },
        { id: uid(), name: "Phantom SOL", type: "hot", chain: "Solana", balance_usd: 2625, notes: "Solana ecosystem wallet", created_at: now },
        { id: uid(), name: "Binance Account", type: "exchange", chain: "Multi", balance_usd: 5900, notes: "Trading + IB commissions", created_at: now },
      ],
      exchanges: [
        { id: uid(), name: "Binance", status: "active", balance_usd: 5900, risk_level: "low", notes: "Primary exchange — IB account active", created_at: now },
        { id: uid(), name: "OKX", status: "active", balance_usd: 800, risk_level: "low", notes: "Secondary exchange", created_at: now },
      ],
      stablecoins: [
        { id: uid(), symbol: "USDT", amount: 1500, location: "Binance", purpose: "Reserve & trading capital", created_at: now },
        { id: uid(), symbol: "USDC", amount: 500, location: "MetaMask", purpose: "DeFi yield farming", created_at: now },
      ],
      defi_positions: [
        { id: uid(), protocol: "PancakeSwap", chain: "BSC", type: "lp", value_usd: 450, apy: 22, risk: "medium", status: "active", notes: "BNB/CAKE LP position", created_at: now },
        { id: uid(), protocol: "Lido", chain: "ETH", type: "staking", value_usd: 800, apy: 3.8, risk: "low", status: "active", notes: "stETH — liquid staking", created_at: now },
      ],
      transactions: [
        { id: uid(), type: "buy", symbol: "BTC", amount: 0.05, price_usd: 65000, date: "2025-06-01", fee_usd: 2.50, notes: "DCA buy", created_at: now },
        { id: uid(), type: "buy", symbol: "ETH", amount: 1.0, price_usd: 3600, date: "2025-05-15", fee_usd: 1.80, created_at: now },
        { id: uid(), type: "sell", symbol: "BNB", amount: 2, price_usd: 530, date: "2025-05-20", fee_usd: 1.06, notes: "Profit taking", created_at: now },
        { id: uid(), type: "stake", symbol: "ETH", amount: 0.5, price_usd: 3750, date: "2025-06-05", created_at: now },
      ],
      cold_wallet_notes: [
        { id: uid(), label: "Ledger Nano X — Primary", hint: "24-word phrase. Location: home safe drawer 2. Last checked: June 2025.", last_verified: "2025-06-01", created_at: now },
        { id: uid(), label: "Paper Backup — BTC", hint: "Encrypted paper. Location: bank safety deposit box.", last_verified: "2025-03-01", created_at: now },
      ],
      security_checklist: [
        { id: uid(), label: "Hardware wallet purchased & set up", done: true, created_at: now },
        { id: uid(), label: "Seed phrase stored securely (not digital)", done: true, created_at: now },
        { id: uid(), label: "2FA enabled on all exchanges", done: true, created_at: now },
        { id: uid(), label: "Withdrawal whitelist enabled on Binance", done: true, created_at: now },
        { id: uid(), label: "Cold wallet recovery tested", done: false, notes: "Due: Q3 2025", created_at: now },
        { id: uid(), label: "Ledger firmware up to date", done: false, created_at: now },
        { id: uid(), label: "Anti-phishing code set on Binance", done: true, created_at: now },
        { id: uid(), label: "No crypto apps on phone used for banking", done: false, notes: "Separate device recommended", created_at: now },
      ],
      theses: [
        { id: uid(), symbol: "BTC", title: "Digital Gold — Long-Term Store of Value", timeframe: "3-5 years", conviction: 9, target_price: 250000, thesis: "Bitcoin is the only credibly neutral, hard-capped digital asset. Institutional adoption via ETFs, halving supply dynamics, and global macro instability all support long-term appreciation. Target: 1 full BTC.", status: "active", created_at: now },
        { id: uid(), symbol: "ETH", title: "EVM Dominance — Smart Contract Platform", timeframe: "2-4 years", conviction: 8, target_price: 8000, thesis: "Ethereum remains the dominant smart contract platform with the deepest DeFi/NFT ecosystem. Post-merge deflation + layer-2 scaling thesis intact.", status: "active", created_at: now },
        { id: uid(), symbol: "SOL", title: "High-Performance L1 Alternative", timeframe: "1-3 years", conviction: 6, target_price: 500, thesis: "Solana's speed and low fees make it competitive for consumer-facing apps and DePIN. Risk: centralization concerns, validator count.", status: "active", created_at: now },
      ],
    };
    persist(sample);
    setData(sample);
  }, []);

  const clearAllData = useCallback(() => {
    persist(DEFAULT_DATA);
    setData(DEFAULT_DATA);
  }, []);

  // Derived
  const totalCryptoValueUSD = data.holdings.reduce((s, h) => s + h.amount * h.current_price, 0);
  const btcAmount = data.holdings.filter((h) => h.symbol === "BTC").reduce((s, h) => s + h.amount, 0);
  const ethAmount = data.holdings.filter((h) => h.symbol === "ETH").reduce((s, h) => s + h.amount, 0);
  const stablecoinBalanceUSD = data.stablecoins.reduce((s, sc) => s + sc.amount, 0);
  const defiExposureUSD = data.defi_positions.filter((p) => p.status === "active").reduce((s, p) => s + p.value_usd, 0);
  const coldWalletValueUSD = data.wallets.filter((w) => w.type === "cold" || w.type === "hardware").reduce((s, w) => s + w.balance_usd, 0);
  const securityScore = data.security_checklist.length > 0
    ? Math.round((data.security_checklist.filter((c) => c.done).length / data.security_checklist.length) * 100)
    : 0;
  const exchangeRisk: "low" | "medium" | "high" = (() => {
    const active = data.exchanges.filter((e) => e.status === "active");
    if (active.some((e) => e.risk_level === "high")) return "high";
    if (active.some((e) => e.risk_level === "medium")) return "medium";
    return "low";
  })();
  const targetBTCProgressPct = data.target_btc_amount > 0 ? Math.min((btcAmount / data.target_btc_amount) * 100, 100) : 0;

  return {
    ...data,
    hydrated,
    addHolding, updateHolding, deleteHolding,
    addWallet, updateWallet, deleteWallet,
    addExchange, updateExchange, deleteExchange,
    addStablecoin, updateStablecoin, deleteStablecoin,
    addDeFiPosition, updateDeFiPosition, deleteDeFiPosition,
    addTransaction, updateTransaction, deleteTransaction,
    addColdWalletNote, updateColdWalletNote, deleteColdWalletNote,
    toggleSecurityCheck, addSecurityCheck, deleteSecurityCheck,
    addThesis, updateThesis, deleteThesis,
    setTargetBTC,
    seedSampleData,
    clearAllData,
    totalCryptoValueUSD,
    btcAmount,
    ethAmount,
    stablecoinBalanceUSD,
    defiExposureUSD,
    coldWalletValueUSD,
    securityScore,
    exchangeRisk,
    targetBTCProgressPct,
  };
}
