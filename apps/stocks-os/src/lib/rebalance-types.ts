export type RebalanceAction = "Add" | "Trim" | "Hold";

export interface RebalanceTarget {
  id: string;
  portfolioId: string;
  symbol: string;
  targetWeight: number;
  notes?: string;
}

export interface RebalanceRule {
  target: RebalanceTarget;
  currentWeight: number;
  deviation: number;
  action: RebalanceAction;
}
