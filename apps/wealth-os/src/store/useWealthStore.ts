"use client";

import { useState, useEffect, useCallback } from "react";

export type BankAccount = {
  id: string;
  name: string;
  bank: string;
  type: "checking" | "savings" | "term-deposit" | "e-wallet";
  balance: number;
  currency: string;
  interest_rate?: number;
  maturity_date?: string;
  note?: string;
  created_at: string;
};

export type RealEstate = {
  id: string;
  name: string;
  address?: string;
  type: "apartment" | "house" | "land" | "commercial" | "other";
  purchase_price: number;
  current_value: number;
  currency: string;
  purchase_date?: string;
  monthly_rent?: number;
  mortgage_remaining?: number;
  note?: string;
  created_at: string;
};

export type Vehicle = {
  id: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  purchase_price: number;
  current_value: number;
  currency: string;
  note?: string;
  created_at: string;
};

export type Liability = {
  id: string;
  label: string;
  creditor: string;
  type: "mortgage" | "car-loan" | "personal-loan" | "credit-card" | "family-debt" | "other";
  principal: number;
  monthly_payment?: number;
  interest_rate?: number;
  due_date?: string;
  currency: string;
  created_at: string;
};

export type EmergencyFund = {
  monthly_expenses: number;
  target_months: number;
  current_amount: number;
  currency: string;
  updated_at: string;
};

export type FamilySupport = {
  id: string;
  label: string;
  recipient: string;
  amount_per_month: number;
  currency: string;
  notes?: string;
  created_at: string;
};

export type NetWorthSnapshot = {
  id: string;
  date: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  currency: string;
  notes?: string;
  created_at: string;
};

interface WealthData {
  bank_accounts: BankAccount[];
  real_estate: RealEstate[];
  vehicles: Vehicle[];
  liabilities: Liability[];
  emergency_fund: EmergencyFund;
  family_support: FamilySupport[];
  net_worth_snapshots: NetWorthSnapshot[];
}

const DEFAULT_EMERGENCY_FUND: EmergencyFund = {
  monthly_expenses: 0,
  target_months: 6,
  current_amount: 0,
  currency: "VND",
  updated_at: new Date().toISOString(),
};

const DEFAULT_DATA: WealthData = {
  bank_accounts: [],
  real_estate: [],
  vehicles: [],
  liabilities: [],
  emergency_fund: DEFAULT_EMERGENCY_FUND,
  family_support: [],
  net_worth_snapshots: [],
};

const STORAGE_KEY = "wealth_os_data";

function loadData(): WealthData {
  if (typeof window === "undefined") return DEFAULT_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const parsed = JSON.parse(raw) as Partial<WealthData>;
    return {
      bank_accounts: parsed.bank_accounts ?? [],
      real_estate: parsed.real_estate ?? [],
      vehicles: parsed.vehicles ?? [],
      liabilities: parsed.liabilities ?? [],
      emergency_fund: parsed.emergency_fund ?? DEFAULT_EMERGENCY_FUND,
      family_support: parsed.family_support ?? [],
      net_worth_snapshots: parsed.net_worth_snapshots ?? [],
    };
  } catch {
    return DEFAULT_DATA;
  }
}

function persist(data: WealthData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function useWealthStore() {
  const [data, setData] = useState<WealthData>(DEFAULT_DATA);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(loadData());
    setHydrated(true);
  }, []);

  const update = useCallback((updater: (prev: WealthData) => WealthData) => {
    setData((prev) => {
      const next = updater(prev);
      persist(next);
      return next;
    });
  }, []);

  const addBankAccount = useCallback((a: Omit<BankAccount, "id" | "created_at">) => {
    update((d) => ({ ...d, bank_accounts: [...d.bank_accounts, { ...a, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);

  const updateBankAccount = useCallback((a: BankAccount) => {
    update((d) => ({ ...d, bank_accounts: d.bank_accounts.map((x) => (x.id === a.id ? a : x)) }));
  }, [update]);

  const deleteBankAccount = useCallback((id: string) => {
    update((d) => ({ ...d, bank_accounts: d.bank_accounts.filter((x) => x.id !== id) }));
  }, [update]);

  const addRealEstate = useCallback((r: Omit<RealEstate, "id" | "created_at">) => {
    update((d) => ({ ...d, real_estate: [...d.real_estate, { ...r, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);

  const updateRealEstate = useCallback((r: RealEstate) => {
    update((d) => ({ ...d, real_estate: d.real_estate.map((x) => (x.id === r.id ? r : x)) }));
  }, [update]);

  const deleteRealEstate = useCallback((id: string) => {
    update((d) => ({ ...d, real_estate: d.real_estate.filter((x) => x.id !== id) }));
  }, [update]);

  const addVehicle = useCallback((v: Omit<Vehicle, "id" | "created_at">) => {
    update((d) => ({ ...d, vehicles: [...d.vehicles, { ...v, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);

  const updateVehicle = useCallback((v: Vehicle) => {
    update((d) => ({ ...d, vehicles: d.vehicles.map((x) => (x.id === v.id ? v : x)) }));
  }, [update]);

  const deleteVehicle = useCallback((id: string) => {
    update((d) => ({ ...d, vehicles: d.vehicles.filter((x) => x.id !== id) }));
  }, [update]);

  const addLiability = useCallback((l: Omit<Liability, "id" | "created_at">) => {
    update((d) => ({ ...d, liabilities: [...d.liabilities, { ...l, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);

  const updateLiability = useCallback((l: Liability) => {
    update((d) => ({ ...d, liabilities: d.liabilities.map((x) => (x.id === l.id ? l : x)) }));
  }, [update]);

  const deleteLiability = useCallback((id: string) => {
    update((d) => ({ ...d, liabilities: d.liabilities.filter((x) => x.id !== id) }));
  }, [update]);

  const updateEmergencyFund = useCallback((ef: Partial<Omit<EmergencyFund, "updated_at">>) => {
    update((d) => ({ ...d, emergency_fund: { ...d.emergency_fund, ...ef, updated_at: new Date().toISOString() } }));
  }, [update]);

  const addFamilySupport = useCallback((f: Omit<FamilySupport, "id" | "created_at">) => {
    update((d) => ({ ...d, family_support: [...d.family_support, { ...f, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);

  const updateFamilySupport = useCallback((f: FamilySupport) => {
    update((d) => ({ ...d, family_support: d.family_support.map((x) => (x.id === f.id ? f : x)) }));
  }, [update]);

  const deleteFamilySupport = useCallback((id: string) => {
    update((d) => ({ ...d, family_support: d.family_support.filter((x) => x.id !== id) }));
  }, [update]);

  const addNetWorthSnapshot = useCallback((s: Omit<NetWorthSnapshot, "id" | "created_at">) => {
    update((d) => ({
      ...d,
      net_worth_snapshots: [...d.net_worth_snapshots, { ...s, id: uid(), created_at: new Date().toISOString() }].sort(
        (a, b) => b.date.localeCompare(a.date),
      ),
    }));
  }, [update]);

  const deleteNetWorthSnapshot = useCallback((id: string) => {
    update((d) => ({ ...d, net_worth_snapshots: d.net_worth_snapshots.filter((x) => x.id !== id) }));
  }, [update]);

  const seedSampleData = useCallback(() => {
    const now = new Date().toISOString();
    const sample: WealthData = {
      bank_accounts: [
        { id: uid(), name: "Vietcombank Savings", bank: "Vietcombank", type: "savings", balance: 150_000_000, currency: "VND", interest_rate: 4.5, created_at: now },
        { id: uid(), name: "Techcombank Checking", bank: "Techcombank", type: "checking", balance: 30_000_000, currency: "VND", created_at: now },
        { id: uid(), name: "BIDV Term Deposit 6M", bank: "BIDV", type: "term-deposit", balance: 200_000_000, currency: "VND", interest_rate: 6.8, maturity_date: "2025-09-15", created_at: now },
        { id: uid(), name: "MOMO Wallet", bank: "MOMO", type: "e-wallet", balance: 5_000_000, currency: "VND", created_at: now },
      ],
      real_estate: [
        { id: uid(), name: "District 7 Apartment", address: "45 Nguyen Thi Thap, Q7, HCMC", type: "apartment", purchase_price: 2_800_000_000, current_value: 3_200_000_000, currency: "VND", purchase_date: "2021-05-01", monthly_rent: 12_000_000, mortgage_remaining: 1_500_000_000, created_at: now },
        { id: uid(), name: "Long An Land Plot", address: "Duc Hoa, Long An", type: "land", purchase_price: 500_000_000, current_value: 750_000_000, currency: "VND", purchase_date: "2022-03-15", created_at: now },
      ],
      vehicles: [
        { id: uid(), name: "Honda City 2022", make: "Honda", model: "City", year: 2022, purchase_price: 550_000_000, current_value: 420_000_000, currency: "VND", created_at: now },
        { id: uid(), name: "Honda SH 150i 2021", make: "Honda", model: "SH 150i", year: 2021, purchase_price: 85_000_000, current_value: 65_000_000, currency: "VND", created_at: now },
      ],
      liabilities: [
        { id: uid(), label: "Apartment Mortgage", creditor: "Vietcombank", type: "mortgage", principal: 1_500_000_000, monthly_payment: 12_500_000, interest_rate: 9.5, currency: "VND", created_at: now },
        { id: uid(), label: "Car Loan", creditor: "VPBank", type: "car-loan", principal: 250_000_000, monthly_payment: 7_800_000, interest_rate: 8.2, due_date: "2027-06-01", currency: "VND", created_at: now },
      ],
      emergency_fund: {
        monthly_expenses: 15_000_000,
        target_months: 6,
        current_amount: 90_000_000,
        currency: "VND",
        updated_at: now,
      },
      family_support: [
        { id: uid(), label: "Monthly parents allowance", recipient: "Parents", amount_per_month: 5_000_000, currency: "VND", created_at: now },
        { id: uid(), label: "Sibling support", recipient: "Younger brother", amount_per_month: 2_000_000, currency: "VND", notes: "School fees support", created_at: now },
      ],
      net_worth_snapshots: [
        { id: uid(), date: "2025-01-01", total_assets: 4_800_000_000, total_liabilities: 1_750_000_000, net_worth: 3_050_000_000, currency: "VND", notes: "Q1 2025", created_at: now },
        { id: uid(), date: "2025-04-01", total_assets: 5_100_000_000, total_liabilities: 1_720_000_000, net_worth: 3_380_000_000, currency: "VND", notes: "Q2 2025", created_at: now },
      ],
    };
    persist(sample);
    setData(sample);
  }, []);

  const clearAllData = useCallback(() => {
    persist(DEFAULT_DATA);
    setData(DEFAULT_DATA);
  }, []);

  const toVND = (amount: number, currency: string) => currency === "VND" ? amount : amount * 25_000;

  const totalBankBalance = data.bank_accounts.reduce((s, a) => s + toVND(a.balance, a.currency), 0);
  const totalRealEstateValue = data.real_estate.reduce((s, r) => s + toVND(r.current_value, r.currency), 0);
  const totalVehicleValue = data.vehicles.reduce((s, v) => s + toVND(v.current_value, v.currency), 0);
  const totalLiabilities = data.liabilities.reduce((s, l) => s + toVND(l.principal, l.currency), 0);
  const totalAssets = totalBankBalance + totalRealEstateValue + totalVehicleValue;
  const netWorth = totalAssets - totalLiabilities;
  const emergencyMonths =
    data.emergency_fund.monthly_expenses > 0
      ? data.emergency_fund.current_amount / data.emergency_fund.monthly_expenses
      : 0;
  const monthlyFamilySupport = data.family_support.reduce((s, f) => s + toVND(f.amount_per_month, f.currency), 0);
  const monthlyDebtPayments = data.liabilities.reduce((s, l) => s + toVND(l.monthly_payment ?? 0, l.currency), 0);
  const upcomingMaturities = data.bank_accounts
    .filter((a): a is BankAccount & { maturity_date: string } => !!a.maturity_date)
    .sort((a, b) => a.maturity_date.localeCompare(b.maturity_date))
    .slice(0, 5)
    .map((a) => `${a.name} matures ${a.maturity_date}`);

  return {
    ...data,
    hydrated,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    addRealEstate,
    updateRealEstate,
    deleteRealEstate,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    addLiability,
    updateLiability,
    deleteLiability,
    updateEmergencyFund,
    addFamilySupport,
    updateFamilySupport,
    deleteFamilySupport,
    addNetWorthSnapshot,
    deleteNetWorthSnapshot,
    seedSampleData,
    clearAllData,
    totalBankBalance,
    totalRealEstateValue,
    totalVehicleValue,
    totalLiabilities,
    totalAssets,
    netWorth,
    emergencyMonths,
    monthlyFamilySupport,
    monthlyDebtPayments,
    upcomingMaturities,
  };
}
