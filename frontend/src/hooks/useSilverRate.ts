'use client';

import { useEffect } from 'react';
import { useSilverRateStore } from '@/stores/silverRateStore';

export function useSilverRate() {
  const store = useSilverRateStore();

  useEffect(() => {
    store.fetchRate();
  }, []);

  return store;
}
