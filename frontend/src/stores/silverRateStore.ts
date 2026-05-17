import { create } from 'zustand';
import { SilverRate } from '@/types/pricing';
import { pricingAPI } from '@/lib/api';

interface SilverRateState {
  rate: SilverRate | null;
  isLoading: boolean;
  fetchRate: () => Promise<void>;
}

export const useSilverRateStore = create<SilverRateState>((set) => ({
  rate: null,
  isLoading: true,

  fetchRate: async () => {
    try {
      set({ isLoading: true });
      const { data } = await pricingAPI.getSilverRate();
      set({ rate: data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
