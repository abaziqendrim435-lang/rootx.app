// ============================================================
// RootX — Supabase Auth Client (browser-side)
//
// This file is safe to import in 'use client' components.
// It creates a single shared Supabase client for auth.
// ============================================================

import { createClient } from '@supabase/supabase-js';

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

// ── Auth helpers ──────────────────────────────────────────────

/** Get the currently authenticated user, or null */
export async function getCurrentUser() {
  if (!supabaseClient) return null;
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}

/** Sign up with email + password */
export async function signUp(email: string, password: string) {
  if (!supabaseClient) return { error: 'Supabase not configured' };
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  return { data, error: error?.message ?? null };
}

/** Sign in with email + password */
export async function signIn(email: string, password: string) {
  if (!supabaseClient) return { error: 'Supabase not configured' };
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  return { data, error: error?.message ?? null };
}

/** Sign out the current user */
export async function signOut() {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
}

/** Send password reset email */
export async function resetPasswordForEmail(email: string) {
  if (!supabaseClient) return { error: 'Supabase not configured' };
  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/reset-password`
      : '/reset-password';
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });
  return { error: error?.message ?? null };
}

/** Update password (called after reset email link) */
export async function updatePassword(newPassword: string) {
  if (!supabaseClient) return { error: 'Supabase not configured' };
  const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
  return { error: error?.message ?? null };
}

/** Update user display name */
export async function updateProfile(displayName: string) {
  if (!supabaseClient) return { error: 'Supabase not configured' };
  const { error } = await supabaseClient.auth.updateUser({
    data: { display_name: displayName },
  });
  return { error: error?.message ?? null };
}

/** Listen for auth state changes */
export function onAuthStateChange(callback: (user: unknown) => void) {
  if (!supabaseClient) return () => {};
  const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
    (_event, session) => callback(session?.user ?? null)
  );
  return () => subscription.unsubscribe();
}
