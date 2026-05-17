export interface SilverRate {
  ratePerGram: number;
  ratePerKg: number;
  effectiveRate: number;
  bufferPercent: number;
  source: 'API' | 'MANUAL' | 'SIMULATED';
  updatedAt: string;
}

export interface SilverRateHistory {
  id: string;
  ratePerGram: number;
  effectiveRate: number;
  source: string;
  createdAt: string;
}
