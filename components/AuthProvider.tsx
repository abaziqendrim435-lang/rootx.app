'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { getCurrentUser, onAuthStateChange, signOut, hasSupabaseConfig } from '@/lib/supabase-auth';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isSupabaseEnabled: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isSupabaseEnabled: false,
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const u = await getCurrentUser();
    setUser(u);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial load
    refresh();

    // Subscribe to auth state changes (login / logout / token refresh)
    const unsubscribe = onAuthStateChange((u) => {
      setUser(u as User | null);
      setLoading(false);
    });

    return unsubscribe;
  }, [refresh]);

  async function logout() {
    await signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, isSupabaseEnabled: hasSupabaseConfig, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
