export interface BrokerAccount {
  id: string;
  name: string;
  cash: number;
  currency: "VND" | "USD";
  fees?: number;
  taxes?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
