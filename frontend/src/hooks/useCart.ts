'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';

export function useCart() {
  const store = useCartStore();

  useEffect(() => {
    store.fetchCart();
  }, []);

  return store;
}
