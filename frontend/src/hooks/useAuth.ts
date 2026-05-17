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

export function useRequireAuth() {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      window.location.href = '/login';
    }
  }, [auth.isLoading, auth.isAuthenticated]);

  return auth;
}

export function useRequireAdmin() {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading) {
      if (!auth.isAuthenticated) {
        window.location.href = '/login';
      } else if (auth.user?.role !== 'ADMIN' && auth.user?.role !== 'STAFF') {
        window.location.href = '/';
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.user?.role]);

  return auth;
}
