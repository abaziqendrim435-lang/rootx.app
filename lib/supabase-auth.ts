// ============================================================
// RootX — Supabase Auth Client (browser-side)
//
// This file is safe to import in 'use client' components.
// It creates a single shared Supabase client for auth.
// ============================================================

import { createClient, type User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const hasSupabaseConfig =
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your_supabase') &&
  supabaseAnonKey.length > 10;

/**
 * Browser-side Supabase client (uses anon key).
 * Null when credentials are missing — components must check hasSupabaseConfig.
 */
export const supabaseClient = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ── Mock Auth for Demo Mode ────────────────────────────────────
let mockUser: User | null = null;
const listeners = new Set<(user: User | null) => void>();

function getMockUser() {
  if (typeof window === 'undefined') return null;
  if (mockUser) return mockUser;
  try {
    const saved = localStorage.getItem('rootx_mock_user');
    if (saved) {
      mockUser = JSON.parse(saved);
      return mockUser;
    }
  } catch {
    // ignore
  }
  return null;
}

function setMockUser(user: User | null) {
  mockUser = user;
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem('rootx_mock_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('rootx_mock_user');
    }
  }
  listeners.forEach(cb => cb(user));
}

// ── Auth helpers ──────────────────────────────────────────────

/** Get the currently authenticated user, or null */
export async function getCurrentUser() {
  if (!supabaseClient) {
    return getMockUser();
  }
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}

/** Sign up with email + password */
export async function signUp(email: string, password: string) {
  if (!supabaseClient) {
    const user = {
      id: 'mock-user-id',
      email,
      user_metadata: { display_name: email.split('@')[0] },
      created_at: new Date().toISOString(),
    };
    setMockUser(user as unknown as User);
    return { data: { user: user as unknown as User }, error: null };
  }
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  return { data, error: error?.message ?? null };
}

/** Sign in with email + password */
export async function signIn(email: string, password: string) {
  if (!supabaseClient) {
    const user = {
      id: 'mock-user-id',
      email,
      user_metadata: { display_name: email.split('@')[0] },
      created_at: new Date().toISOString(),
    };
    setMockUser(user as unknown as User);
    return { data: { user: user as unknown as User }, error: null };
  }
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  return { data, error: error?.message ?? null };
}

/** Sign out the current user */
export async function signOut() {
  if (!supabaseClient) {
    setMockUser(null);
    return;
  }
  await supabaseClient.auth.signOut();
}

/** Send password reset email */
export async function resetPasswordForEmail(email: string) {
  if (!supabaseClient) return { error: null };
  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/reset-password`
      : '/reset-password';
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });
  return { error: error?.message ?? null };
}

/** Update password (called after reset email link) */
export async function updatePassword(newPassword: string) {
  if (!supabaseClient) return { error: null };
  const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
  return { error: error?.message ?? null };
}

/** Update user display name */
export async function updateProfile(displayName: string) {
  if (!supabaseClient) {
    const current = getMockUser();
    if (current) {
      const updated = {
        ...current,
        user_metadata: { ...current.user_metadata, display_name: displayName }
      };
      setMockUser(updated);
    }
    return { error: null };
  }
  const { error } = await supabaseClient.auth.updateUser({
    data: { display_name: displayName },
  });
  return { error: error?.message ?? null };
}

/** Listen for auth state changes */
export function onAuthStateChange(callback: (user: unknown) => void) {
  if (!supabaseClient) {
    listeners.add(callback);
    // Call callback immediately with initial user state
    callback(getMockUser());
    return () => {
      listeners.delete(callback);
    };
  }
  const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
    (_event, session) => callback(session?.user ?? null)
  );
  return () => subscription.unsubscribe();
}
