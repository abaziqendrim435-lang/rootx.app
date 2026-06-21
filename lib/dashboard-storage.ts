// ============================================================
// RootX — Dashboard Storage v2
//
// Unified async API that:
//   1. Saves to Supabase when authenticated + configured
//   2. Falls back to localStorage in every other case
//
// Column mapping (Supabase snake_case ↔ JS camelCase):
//   agent_type  ↔ agentType
//   agent_name  ↔ agentName
//   agent_icon  ↔ agentIcon
//   is_saved    ↔ isSaved
//   created_at  ↔ createdAt
//   user_id     ↔ (server-side, from auth.uid())
// ============================================================

import { supabaseClient, hasSupabaseConfig } from './supabase-auth';

export type AgentType = 'content-creator' | 'shopify' | string;

export interface GenerationRecord {
  id: string;
  agentType: AgentType;
  agentName: string;
  agentIcon: string;
  inputs: Record<string, string>;
  outputs: Record<string, unknown>;
  createdAt: string;   // ISO string
  isSaved: boolean;
}

export interface DashboardStats {
  totalGenerations: number;
  savedItems: number;
  agentsUsed: number;
  thisWeek: number;
}

// ── Supabase row type (matches our schema exactly) ────────────

interface SupabaseRow {
  id: string;
  user_id: string;
  agent_type: string;
  agent_name: string;
  agent_icon: string;
  inputs: Record<string, string>;
  outputs: Record<string, unknown>;
  is_saved: boolean;
  created_at: string;
}

function rowToRecord(row: SupabaseRow): GenerationRecord {
  return {
    id: row.id,
    agentType: row.agent_type,
    agentName: row.agent_name,
    agentIcon: row.agent_icon,
    inputs: row.inputs,
    outputs: row.outputs,
    isSaved: row.is_saved,
    createdAt: row.created_at,
  };
}

// ── localStorage fallback ─────────────────────────────────────

const LS_KEY = 'rootx_generations';

function lsRead(): GenerationRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as GenerationRecord[];
  } catch {
    return [];
  }
}

function lsWrite(records: GenerationRecord[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(records.slice(0, 200)));
}

// ── Helper: is the user currently authenticated? ──────────────

async function getAuthUserId(): Promise<string | null> {
  if (!hasSupabaseConfig || !supabaseClient) return null;
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user?.id ?? null;
}

// ── Public async API ──────────────────────────────────────────

/**
 * Save a new generation to Supabase (if authenticated) or localStorage.
 * Returns the saved record including its server-assigned id.
 */
export async function saveGeneration(
  partial: Omit<GenerationRecord, 'id' | 'createdAt'>
): Promise<GenerationRecord> {
  const userId = await getAuthUserId();

  if (userId && supabaseClient) {
    // ── Supabase path ──
    const { data, error } = await supabaseClient
      .from('generations')
      .insert([{
        user_id: userId,
        agent_type: partial.agentType,
        agent_name: partial.agentName,
        agent_icon: partial.agentIcon,
        inputs: partial.inputs,
        outputs: partial.outputs,
        is_saved: partial.isSaved ?? false,
      }])
      .select()
      .single();

    if (!error && data) {
      return rowToRecord(data as SupabaseRow);
    }
    // Fall through to localStorage on error
    console.warn('[RootX] Supabase insert failed, using localStorage:', error?.message);
  }

  // ── localStorage path ──
  const record: GenerationRecord = {
    ...partial,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const all = lsRead();
  lsWrite([record, ...all]);
  return record;
}

/**
 * Fetch all generations, newest first.
 * Uses Supabase when authenticated, localStorage otherwise.
 */
export async function getAllGenerations(): Promise<GenerationRecord[]> {
  const userId = await getAuthUserId();

  if (userId && supabaseClient) {
    const { data, error } = await supabaseClient
      .from('generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (!error && data) {
      return (data as SupabaseRow[]).map(rowToRecord);
    }
    console.warn('[RootX] Supabase select failed, using localStorage:', error?.message);
  }

  return lsRead();
}

/**
 * Toggle saved/bookmarked state.
 */
export async function toggleSaved(id: string): Promise<boolean> {
  const userId = await getAuthUserId();

  if (userId && supabaseClient) {
    // Fetch current value
    const { data: current } = await supabaseClient
      .from('generations')
      .select('is_saved')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    const newValue = !(current as { is_saved: boolean } | null)?.is_saved;

    const { error } = await supabaseClient
      .from('generations')
      .update({ is_saved: newValue })
      .eq('id', id)
      .eq('user_id', userId);

    if (!error) return newValue;
  }

  // localStorage fallback
  const all = lsRead();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  all[idx].isSaved = !all[idx].isSaved;
  lsWrite(all);
  return all[idx].isSaved;
}

/**
 * Delete a generation by id.
 */
export async function deleteGeneration(id: string): Promise<void> {
  const userId = await getAuthUserId();

  if (userId && supabaseClient) {
    await supabaseClient
      .from('generations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    return;
  }

  lsWrite(lsRead().filter((r) => r.id !== id));
}

/**
 * Clear all generations for the current user.
 */
export async function clearAllGenerations(): Promise<void> {
  const userId = await getAuthUserId();

  if (userId && supabaseClient) {
    await supabaseClient
      .from('generations')
      .delete()
      .eq('user_id', userId);
    return;
  }

  lsWrite([]);
}

/**
 * Compute dashboard stats from fetched records.
 * Pass the already-loaded records to avoid a second fetch.
 */
export function computeStats(records: GenerationRecord[]): DashboardStats {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return {
    totalGenerations: records.length,
    savedItems: records.filter((r) => r.isSaved).length,
    agentsUsed: new Set(records.map((r) => r.agentType)).size,
    thisWeek: records.filter((r) => new Date(r.createdAt).getTime() > weekAgo).length,
  };
}

/**
 * Sync stats — fetches all records and computes.
 * @deprecated Use getAllGenerations() + computeStats() for better perf.
 */
export async function getStats(): Promise<DashboardStats> {
  return computeStats(await getAllGenerations());
}

// ── Synchronous localStorage shim (for backward compat) ───────
// Only used by legacy code that hasn't been updated to async yet.
export function saveGenerationSync(
  partial: Omit<GenerationRecord, 'id' | 'createdAt'>
): GenerationRecord {
  const record: GenerationRecord = {
    ...partial,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const all = lsRead();
  lsWrite([record, ...all]);
  return record;
}
