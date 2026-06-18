export type ReviewFrequency = "Monthly" | "Quarterly" | "Semi-Annual" | "Annual";

export interface CompanyThesis {
  id: string;
  symbol: string;
  companyName?: string;
  sector?: string;
  whyBuy?: string;
  risks?: string;
  catalysts?: string;
  valuationNotes?: string;
  dividendPolicy?: string;
  exitRule?: string;
  reviewFrequency?: ReviewFrequency;
  nextReviewDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
