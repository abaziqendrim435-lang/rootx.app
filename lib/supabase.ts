// ============================================================
// RootX — Supabase Client
// 
// SETUP REQUIRED:
// 1. Create a project at https://supabase.com
// 2. Go to Settings > API and copy your URL and anon key
// 3. Create a .env.local file with:
//    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
//    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
// 4. Run the SQL in /db/schema.sql in your Supabase SQL editor
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Same check as lib/supabase-auth.ts — must be consistent
const hasValidCredentials =
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your_supabase') &&
  supabaseAnonKey.length > 10;

export const supabase = hasValidCredentials
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;


// ============================================================
// Database helpers
// ============================================================

export interface RequestInsert {
  name: string;
  email: string;
  business_type: string;
  selected_agent: string;
  message: string;
}

/**
 * Submit a new customer request to Supabase.
 * Returns { success: true } or { success: false, error: string }
 */
export async function submitRequest(data: RequestInsert) {
  if (!supabase) {
    // Demo mode — log and return success
    console.log('[RootX DEMO] Request would be saved:', data);
    return { success: true, demo: true };
  }

  const { error } = await supabase.from('requests').insert([
    { ...data, status: 'pending' },
  ]);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Fetch all requests — used in the /admin page (server-side).
 */
export async function getRequests() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[RootX] Failed to fetch requests:', error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Update the status of a request.
 */
export async function updateRequestStatus(
  id: string,
  status: 'pending' | 'in_progress' | 'completed'
) {
  if (!supabase) return { success: false, error: 'No Supabase connection' };

  const { error } = await supabase
    .from('requests')
    .update({ status })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
