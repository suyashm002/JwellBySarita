'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    if (!store.user && store.isLoading) {
      store.fetchUser();
    }
  }, []);

  return store;
}

// No redirects - open access for testing
export function useRequireAuth() {
  return useAuth();
}

export function useRequireAdmin() {
  return useAuth();
}
