"use client";

import { useState, useEffect, useCallback } from "react";

export type RevenueChannel =
  | "forex-ib" | "crypto-ib" | "tiktok" | "telegram" | "zalo"
  | "affiliate" | "saas" | "coaching" | "consulting" | "other";

export type RevenueStream = {
  id: string;
  name: string;
  channel: RevenueChannel;
  status: "active" | "paused" | "planned";
  monthly_revenue: number;
  currency: string;
  notes?: string;
  created_at: string;
};

export type ClientStatus = "active" | "lead" | "vip" | "inactive";

export type Client = {
  id: string;
  name: string;
  channel: string;
  status: ClientStatus;
  monthly_value: number;
  currency: string;
  joined_date?: string;
  broker?: string;
  pending_issue?: string;
  notes?: string;
  created_at: string;
};

export type IBAccount = {
  id: string;
  name: string;
  broker: string;
  type: "forex" | "crypto" | "stocks";
  status: "active" | "inactive";
  client_count: number;
  monthly_commission: number;
  currency: string;
  commission_rate?: number;
  notes?: string;
  created_at: string;
};

export type Partner = {
  id: string;
  name: string;
  type: "broker" | "affiliate" | "collab" | "sponsor" | "vendor" | "other";
  status: "active" | "inactive" | "prospect";
  monthly_value: number;
  currency: string;
  commission_rate?: number;
  notes?: string;
  created_at: string;
};

export type ContentPlatform =
  | "tiktok" | "youtube" | "telegram" | "zalo" | "facebook" | "instagram" | "blog" | "other";

export type ContentAsset = {
  id: string;
  title: string;
  platform: ContentPlatform;
  type: "video" | "post" | "article" | "live" | "course" | "reel" | "other";
  status: "draft" | "published" | "archived";
  published_date?: string;
  views?: number;
  revenue_attributed?: number;
  notes?: string;
  created_at: string;
};

export type CalendarItem = {
  id: string;
  title: string;
  platform: ContentPlatform;
  type: string;
  planned_date: string;
  status: "planned" | "in-progress" | "done" | "cancelled";
  notes?: string;
  created_at: string;
};

export type Campaign = {
  id: string;
  name: string;
  channel: string;
  status: "active" | "planned" | "completed" | "paused";
  start_date?: string;
  end_date?: string;
  budget: number;
  revenue_generated: number;
  currency: string;
  notes?: string;
  created_at: string;
};

export type TaskCategory = "content" | "client" | "finance" | "growth" | "ops" | "other";
export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "in-progress" | "done" | "blocked";

export type BusinessTask = {
  id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string;
  notes?: string;
  created_at: string;
};

export type Expense = {
  id: string;
  label: string;
  category: "software" | "marketing" | "equipment" | "contractor" | "ads" | "other";
  amount: number;
  currency: string;
  frequency: "monthly" | "annual" | "one-time";
  date?: string;
  notes?: string;
  created_at: string;
};

export type MonthlyPnL = {
  id: string;
  month: string;
  revenue: number;
  expenses: number;
  net_profit: number;
  currency: string;
  notes?: string;
  created_at: string;
};

interface BusinessData {
  revenue_streams: RevenueStream[];
  clients: Client[];
  ib_accounts: IBAccount[];
  partners: Partner[];
  content_assets: ContentAsset[];
  calendar_items: CalendarItem[];
  campaigns: Campaign[];
  tasks: BusinessTask[];
  expenses: Expense[];
  monthly_pnl: MonthlyPnL[];
}

const DEFAULT_DATA: BusinessData = {
  revenue_streams: [],
  clients: [],
  ib_accounts: [],
  partners: [],
  content_assets: [],
  calendar_items: [],
  campaigns: [],
  tasks: [],
  expenses: [],
  monthly_pnl: [],
};

const STORAGE_KEY = "business_os_data";

function loadData(): BusinessData {
  if (typeof window === "undefined") return DEFAULT_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const p = JSON.parse(raw) as Partial<BusinessData>;
    return {
      revenue_streams: p.revenue_streams ?? [],
      clients: p.clients ?? [],
      ib_accounts: p.ib_accounts ?? [],
      partners: p.partners ?? [],
      content_assets: p.content_assets ?? [],
      calendar_items: p.calendar_items ?? [],
      campaigns: p.campaigns ?? [],
      tasks: p.tasks ?? [],
      expenses: p.expenses ?? [],
      monthly_pnl: p.monthly_pnl ?? [],
    };
  } catch {
    return DEFAULT_DATA;
  }
}

function persist(data: BusinessData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const toUSD = (amount: number, currency: string) => currency === "USD" ? amount : amount / 25_000;

export function useBusinessStore() {
  const [data, setData] = useState<BusinessData>(DEFAULT_DATA);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(loadData());
    setHydrated(true);
  }, []);

  const update = useCallback((updater: (prev: BusinessData) => BusinessData) => {
    setData((prev) => {
      const next = updater(prev);
      persist(next);
      return next;
    });
  }, []);

  // Revenue Streams
  const addRevenueStream = useCallback((r: Omit<RevenueStream, "id" | "created_at">) => {
    update((d) => ({ ...d, revenue_streams: [...d.revenue_streams, { ...r, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updateRevenueStream = useCallback((r: RevenueStream) => {
    update((d) => ({ ...d, revenue_streams: d.revenue_streams.map((x) => (x.id === r.id ? r : x)) }));
  }, [update]);
  const deleteRevenueStream = useCallback((id: string) => {
    update((d) => ({ ...d, revenue_streams: d.revenue_streams.filter((x) => x.id !== id) }));
  }, [update]);

  // Clients
  const addClient = useCallback((c: Omit<Client, "id" | "created_at">) => {
    update((d) => ({ ...d, clients: [...d.clients, { ...c, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updateClient = useCallback((c: Client) => {
    update((d) => ({ ...d, clients: d.clients.map((x) => (x.id === c.id ? c : x)) }));
  }, [update]);
  const deleteClient = useCallback((id: string) => {
    update((d) => ({ ...d, clients: d.clients.filter((x) => x.id !== id) }));
  }, [update]);

  // IB Accounts
  const addIBAccount = useCallback((a: Omit<IBAccount, "id" | "created_at">) => {
    update((d) => ({ ...d, ib_accounts: [...d.ib_accounts, { ...a, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updateIBAccount = useCallback((a: IBAccount) => {
    update((d) => ({ ...d, ib_accounts: d.ib_accounts.map((x) => (x.id === a.id ? a : x)) }));
  }, [update]);
  const deleteIBAccount = useCallback((id: string) => {
    update((d) => ({ ...d, ib_accounts: d.ib_accounts.filter((x) => x.id !== id) }));
  }, [update]);

  // Partners
  const addPartner = useCallback((p: Omit<Partner, "id" | "created_at">) => {
    update((d) => ({ ...d, partners: [...d.partners, { ...p, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updatePartner = useCallback((p: Partner) => {
    update((d) => ({ ...d, partners: d.partners.map((x) => (x.id === p.id ? p : x)) }));
  }, [update]);
  const deletePartner = useCallback((id: string) => {
    update((d) => ({ ...d, partners: d.partners.filter((x) => x.id !== id) }));
  }, [update]);

  // Content Assets
  const addContentAsset = useCallback((c: Omit<ContentAsset, "id" | "created_at">) => {
    update((d) => ({ ...d, content_assets: [...d.content_assets, { ...c, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updateContentAsset = useCallback((c: ContentAsset) => {
    update((d) => ({ ...d, content_assets: d.content_assets.map((x) => (x.id === c.id ? c : x)) }));
  }, [update]);
  const deleteContentAsset = useCallback((id: string) => {
    update((d) => ({ ...d, content_assets: d.content_assets.filter((x) => x.id !== id) }));
  }, [update]);

  // Calendar
  const addCalendarItem = useCallback((c: Omit<CalendarItem, "id" | "created_at">) => {
    update((d) => ({ ...d, calendar_items: [...d.calendar_items, { ...c, id: uid(), created_at: new Date().toISOString() }].sort((a, b) => a.planned_date.localeCompare(b.planned_date)) }));
  }, [update]);
  const updateCalendarItem = useCallback((c: CalendarItem) => {
    update((d) => ({ ...d, calendar_items: d.calendar_items.map((x) => (x.id === c.id ? c : x)) }));
  }, [update]);
  const deleteCalendarItem = useCallback((id: string) => {
    update((d) => ({ ...d, calendar_items: d.calendar_items.filter((x) => x.id !== id) }));
  }, [update]);

  // Campaigns
  const addCampaign = useCallback((c: Omit<Campaign, "id" | "created_at">) => {
    update((d) => ({ ...d, campaigns: [...d.campaigns, { ...c, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updateCampaign = useCallback((c: Campaign) => {
    update((d) => ({ ...d, campaigns: d.campaigns.map((x) => (x.id === c.id ? c : x)) }));
  }, [update]);
  const deleteCampaign = useCallback((id: string) => {
    update((d) => ({ ...d, campaigns: d.campaigns.filter((x) => x.id !== id) }));
  }, [update]);

  // Tasks
  const addTask = useCallback((t: Omit<BusinessTask, "id" | "created_at">) => {
    update((d) => ({ ...d, tasks: [...d.tasks, { ...t, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updateTask = useCallback((t: BusinessTask) => {
    update((d) => ({ ...d, tasks: d.tasks.map((x) => (x.id === t.id ? t : x)) }));
  }, [update]);
  const deleteTask = useCallback((id: string) => {
    update((d) => ({ ...d, tasks: d.tasks.filter((x) => x.id !== id) }));
  }, [update]);

  // Expenses
  const addExpense = useCallback((e: Omit<Expense, "id" | "created_at">) => {
    update((d) => ({ ...d, expenses: [...d.expenses, { ...e, id: uid(), created_at: new Date().toISOString() }] }));
  }, [update]);
  const updateExpense = useCallback((e: Expense) => {
    update((d) => ({ ...d, expenses: d.expenses.map((x) => (x.id === e.id ? e : x)) }));
  }, [update]);
  const deleteExpense = useCallback((id: string) => {
    update((d) => ({ ...d, expenses: d.expenses.filter((x) => x.id !== id) }));
  }, [update]);

  // Monthly PnL
  const addMonthlyPnL = useCallback((p: Omit<MonthlyPnL, "id" | "created_at">) => {
    update((d) => ({
      ...d,
      monthly_pnl: [...d.monthly_pnl, { ...p, id: uid(), created_at: new Date().toISOString() }].sort((a, b) => b.month.localeCompare(a.month)),
    }));
  }, [update]);
  const updateMonthlyPnL = useCallback((p: MonthlyPnL) => {
    update((d) => ({ ...d, monthly_pnl: d.monthly_pnl.map((x) => (x.id === p.id ? p : x)) }));
  }, [update]);
  const deleteMonthlyPnL = useCallback((id: string) => {
    update((d) => ({ ...d, monthly_pnl: d.monthly_pnl.filter((x) => x.id !== id) }));
  }, [update]);

  const seedSampleData = useCallback(() => {
    const hasExistingData = data.revenue_streams.length > 0 || data.clients.length > 0 || data.expenses.length > 0 || data.tasks.length > 0 || data.monthly_pnl.length > 0;
    if (hasExistingData && !confirm("Load sample Business OS data? This replaces current local data.")) return;
    const now = new Date().toISOString();
    const sample: BusinessData = {
      revenue_streams: [
        { id: uid(), name: "FTMO IB Commission", channel: "forex-ib", status: "active", monthly_revenue: 800, currency: "USD", notes: "Primary IB channel via FTMO affiliate program", created_at: now },
        { id: uid(), name: "Binance Crypto IB", channel: "crypto-ib", status: "active", monthly_revenue: 350, currency: "USD", notes: "Crypto referral commissions", created_at: now },
        { id: uid(), name: "TikTok Trading Content", channel: "tiktok", status: "active", monthly_revenue: 200, currency: "USD", notes: "Monetization + brand deals", created_at: now },
        { id: uid(), name: "Telegram Trading Community", channel: "telegram", status: "active", monthly_revenue: 150, currency: "USD", notes: "Premium signal group subscription", created_at: now },
        { id: uid(), name: "Zalo Community", channel: "zalo", status: "active", monthly_revenue: 100, currency: "USD", notes: "VN market community group", created_at: now },
        { id: uid(), name: "Affiliate Marketing", channel: "affiliate", status: "active", monthly_revenue: 120, currency: "USD", notes: "VPS, tools, course referrals", created_at: now },
        { id: uid(), name: "TNPA SaaS Platform", channel: "saas", status: "planned", monthly_revenue: 0, currency: "USD", notes: "Future trading OS subscription product", created_at: now },
      ],
      clients: [
        { id: uid(), name: "Nguyen Van A", channel: "forex-ib", status: "vip", monthly_value: 120, currency: "USD", broker: "FTMO", joined_date: "2024-01-10", created_at: now },
        { id: uid(), name: "Tran Thi B", channel: "telegram", status: "active", monthly_value: 15, currency: "USD", joined_date: "2024-03-05", created_at: now },
        { id: uid(), name: "Le Van C", channel: "forex-ib", status: "active", monthly_value: 80, currency: "USD", broker: "FTMO", created_at: now },
        { id: uid(), name: "Pham Thi D", channel: "crypto-ib", status: "active", monthly_value: 45, currency: "USD", broker: "Binance", created_at: now },
        { id: uid(), name: "Hoang Van E", channel: "coaching", status: "lead", monthly_value: 0, currency: "USD", notes: "Interested in 1:1 coaching", created_at: now },
        { id: uid(), name: "Do Thi F", channel: "telegram", status: "active", monthly_value: 15, currency: "USD", created_at: now },
        { id: uid(), name: "Vu Van G", channel: "forex-ib", status: "active", monthly_value: 60, currency: "USD", broker: "FTMO", pending_issue: "KYC not completed", created_at: now },
        { id: uid(), name: "Nguyen Thi H", channel: "zalo", status: "lead", monthly_value: 0, currency: "USD", notes: "Requested demo call", created_at: now },
      ],
      ib_accounts: [
        { id: uid(), name: "FTMO Affiliate Program", broker: "FTMO", type: "forex", status: "active", client_count: 18, monthly_commission: 800, currency: "USD", commission_rate: 10, notes: "10% of client challenge fees", created_at: now },
        { id: uid(), name: "Binance Referral", broker: "Binance", type: "crypto", status: "active", client_count: 12, monthly_commission: 350, currency: "USD", commission_rate: 20, notes: "20% of trading fees", created_at: now },
        { id: uid(), name: "Exness Affiliate", broker: "Exness", type: "forex", status: "inactive", client_count: 3, monthly_commission: 0, currency: "USD", commission_rate: 15, notes: "Paused — low conversion", created_at: now },
      ],
      partners: [
        { id: uid(), name: "FTMO", type: "broker", status: "active", monthly_value: 800, currency: "USD", commission_rate: 10, notes: "Primary forex prop firm partner", created_at: now },
        { id: uid(), name: "Binance", type: "broker", status: "active", monthly_value: 350, currency: "USD", commission_rate: 20, notes: "Crypto exchange affiliate", created_at: now },
        { id: uid(), name: "TradingView", type: "affiliate", status: "active", monthly_value: 40, currency: "USD", notes: "Tool referral commissions", created_at: now },
        { id: uid(), name: "VPS Provider", type: "vendor", status: "active", monthly_value: 0, currency: "USD", notes: "EA hosting partner", created_at: now },
      ],
      content_assets: [
        { id: uid(), title: "FTMO Challenge Strategy 2025", platform: "tiktok", type: "video", status: "published", published_date: "2025-06-01", views: 45000, revenue_attributed: 120, created_at: now },
        { id: uid(), title: "Crypto IB Guide for Beginners", platform: "youtube", type: "video", status: "published", published_date: "2025-05-20", views: 8500, revenue_attributed: 60, created_at: now },
        { id: uid(), title: "Weekly Market Analysis #24", platform: "telegram", type: "post", status: "published", published_date: "2025-06-10", created_at: now },
        { id: uid(), title: "How to Pass FTMO in 30 Days", platform: "tiktok", type: "video", status: "published", published_date: "2025-05-15", views: 120000, revenue_attributed: 300, created_at: now },
        { id: uid(), title: "Zalo Community Welcome Guide", platform: "zalo", type: "article", status: "published", published_date: "2025-04-01", created_at: now },
        { id: uid(), title: "Trading OS Demo Video", platform: "youtube", type: "video", status: "draft", notes: "Record with new UI", created_at: now },
      ],
      calendar_items: [
        { id: uid(), title: "FTMO Review June 2025", platform: "tiktok", type: "video", planned_date: "2025-06-20", status: "planned", created_at: now },
        { id: uid(), title: "Crypto IB Monthly Update", platform: "telegram", type: "post", planned_date: "2025-06-22", status: "in-progress", created_at: now },
        { id: uid(), title: "Top 5 Prop Firms 2025", platform: "youtube", type: "video", planned_date: "2025-06-28", status: "planned", created_at: now },
        { id: uid(), title: "Zalo Weekly Signal", platform: "zalo", type: "post", planned_date: "2025-06-17", status: "done", created_at: now },
        { id: uid(), title: "TNPA Business OS Showcase", platform: "tiktok", type: "reel", planned_date: "2025-07-05", status: "planned", created_at: now },
      ],
      campaigns: [
        { id: uid(), name: "FTMO Summer Challenge Push", channel: "tiktok", status: "active", start_date: "2025-06-01", end_date: "2025-07-31", budget: 200, revenue_generated: 420, currency: "USD", notes: "Targeting aspiring prop traders", created_at: now },
        { id: uid(), name: "Binance Referral Drive Q2", channel: "telegram", status: "active", start_date: "2025-04-01", end_date: "2025-06-30", budget: 50, revenue_generated: 280, currency: "USD", notes: "Shared in Telegram + Zalo", created_at: now },
        { id: uid(), name: "TradingView Tool Affiliate", channel: "affiliate", status: "completed", start_date: "2025-03-01", end_date: "2025-05-31", budget: 0, revenue_generated: 85, currency: "USD", notes: "Free organic posts only", created_at: now },
      ],
      tasks: [
        { id: uid(), title: "Record FTMO June review video", category: "content", priority: "high", status: "todo", due_date: "2025-06-20", created_at: now },
        { id: uid(), title: "Follow up with Vu Van G on KYC", category: "client", priority: "high", status: "todo", due_date: "2025-06-17", created_at: now },
        { id: uid(), title: "Update TNPA Telegram pinned message", category: "ops", priority: "medium", status: "in-progress", created_at: now },
        { id: uid(), title: "Set up TNPA SaaS landing page", category: "growth", priority: "medium", status: "todo", notes: "Phase 1 only — email capture", created_at: now },
        { id: uid(), title: "Q2 PnL reconciliation", category: "finance", priority: "high", status: "todo", due_date: "2025-07-01", created_at: now },
        { id: uid(), title: "Onboard 3 new Telegram members", category: "growth", priority: "medium", status: "todo", created_at: now },
        { id: uid(), title: "Review Exness affiliate terms", category: "finance", priority: "low", status: "todo", created_at: now },
      ],
      expenses: [
        { id: uid(), label: "TradingView Premium", category: "software", amount: 15.45, currency: "USD", frequency: "monthly", created_at: now },
        { id: uid(), label: "Notion Team", category: "software", amount: 10, currency: "USD", frequency: "monthly", created_at: now },
        { id: uid(), label: "VPS for EA", category: "software", amount: 12, currency: "USD", frequency: "monthly", created_at: now },
        { id: uid(), label: "Video editing software", category: "software", amount: 20, currency: "USD", frequency: "monthly", created_at: now },
        { id: uid(), label: "Microphone (DJI Mic)", category: "equipment", amount: 150, currency: "USD", frequency: "one-time", date: "2025-03-01", created_at: now },
        { id: uid(), label: "TikTok Ads test", category: "ads", amount: 50, currency: "USD", frequency: "one-time", date: "2025-05-15", notes: "A/B test campaign", created_at: now },
      ],
      monthly_pnl: [
        { id: uid(), month: "2025-04", revenue: 1550, expenses: 107, net_profit: 1443, currency: "USD", notes: "Strong FTMO month", created_at: now },
        { id: uid(), month: "2025-05", revenue: 1680, expenses: 257, net_profit: 1423, currency: "USD", notes: "Mic equipment purchase", created_at: now },
        { id: uid(), month: "2025-06", revenue: 1720, expenses: 107, net_profit: 1613, currency: "USD", notes: "Q2 best month so far", created_at: now },
      ],
    };
    persist(sample);
    setData(sample);
  }, [data]);

  const clearAllData = useCallback(() => {
    persist(DEFAULT_DATA);
    setData(DEFAULT_DATA);
  }, []);

  // Derived metrics
  const totalMonthlyRevenue = data.revenue_streams
    .filter((r) => r.status === "active")
    .reduce((s, r) => s + toUSD(r.monthly_revenue, r.currency), 0);

  const monthlyExpenses = data.expenses
    .filter((e) => e.frequency === "monthly")
    .reduce((s, e) => s + toUSD(e.amount, e.currency), 0);

  const netProfit = totalMonthlyRevenue - monthlyExpenses;

  const revenueByChannel = data.revenue_streams
    .filter((r) => r.status === "active")
    .reduce<Record<string, number>>((acc, r) => {
      const ch = r.channel;
      acc[ch] = (acc[ch] ?? 0) + toUSD(r.monthly_revenue, r.currency);
      return acc;
    }, {});

  const activeClients = data.clients.filter((c) => c.status === "active" || c.status === "vip").length;
  const activeLeads = data.clients.filter((c) => c.status === "lead").length;
  const pendingIssues = data.clients.filter((c) => !!c.pending_issue).length;
  const publishedThisMonth = data.content_assets.filter((c) => {
    if (c.status !== "published" || !c.published_date) return false;
    const d = new Date(c.published_date);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const activeCampaigns = data.campaigns.filter((c) => c.status === "active").length;
  const openTasks = data.tasks.filter((t) => t.status !== "done").length;
  const highPriorityTasks = data.tasks.filter((t) => t.priority === "high" && t.status !== "done").length;

  return {
    ...data,
    hydrated,
    // CRUD
    addRevenueStream, updateRevenueStream, deleteRevenueStream,
    addClient, updateClient, deleteClient,
    addIBAccount, updateIBAccount, deleteIBAccount,
    addPartner, updatePartner, deletePartner,
    addContentAsset, updateContentAsset, deleteContentAsset,
    addCalendarItem, updateCalendarItem, deleteCalendarItem,
    addCampaign, updateCampaign, deleteCampaign,
    addTask, updateTask, deleteTask,
    addExpense, updateExpense, deleteExpense,
    addMonthlyPnL, updateMonthlyPnL, deleteMonthlyPnL,
    seedSampleData,
    clearAllData,
    // Derived
    totalMonthlyRevenue,
    monthlyExpenses,
    netProfit,
    revenueByChannel,
    activeClients,
    activeLeads,
    pendingIssues,
    publishedThisMonth,
    activeCampaigns,
    openTasks,
    highPriorityTasks,
  };
}
