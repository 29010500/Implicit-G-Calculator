export interface FinancialData {
  stockPrice: number;
  fcfPerShare: number;
  wacc: number;
  currency: string;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface GeminiApiResponse {
  data: FinancialData;
  sources: GroundingSource[];
}