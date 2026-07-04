// ============================================================
// RootX — Shopify API Helpers (server-side)
//
// Shared utilities for the /api/shopify/* route handlers:
//   • JWT extraction + Supabase auth verification
//   • Credential lookup (DB → query params → null)
//   • Typed Shopify Admin API fetch wrapper
// ============================================================

import { NextRequest } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { ShopifyCredentials } from './shopify-types';

// ── Supabase bootstrap ────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True when the env vars look like real credentials */
export const hasSupabase =
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your_supabase') &&
  supabaseAnonKey.length > 10;

/** Lazily-created Supabase client (null when not configured) */
function getSupabase(): SupabaseClient | null {
  if (!hasSupabase) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

// ── Auth ──────────────────────────────────────────────────────

/**
 * Extract the raw JWT from the `Authorization: Bearer <token>` header.
 * Returns `null` when the header is missing or malformed.
 */
export function extractBearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization') ?? '';
  if (!header.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

/**
 * Verify a JWT via Supabase `auth.getUser()`.
 *
 * @returns The authenticated user ID, or `null` when Supabase is not
 *          configured or the token is invalid.
 */
export async function verifyUser(
  req: NextRequest
): Promise<{ userId: string | null; error: string | null }> {
  const token = extractBearerToken(req);
  const sb = getSupabase();

  if (!sb || !token) {
    return { userId: null, error: null }; // no auth required in demo mode
  }

  const {
    data: { user },
    error,
  } = await sb.auth.getUser(token);

  if (error || !user) {
    return { userId: null, error: error?.message ?? 'Invalid or expired token' };
  }

  return { userId: user.id, error: null };
}

// ── Credential lookup ─────────────────────────────────────────

/**
 * Look up Shopify credentials for the current user.
 *
 * 1. If Supabase is configured **and** a valid user ID is provided,
 *    query the `shopify_stores` table.
 * 2. Fall back to query-string params (`storeDomain` / `accessToken`).
 * 3. Return `null` when nothing is found (triggers demo mode).
 */
export async function getCredentials(
  req: NextRequest,
  userId: string | null
): Promise<ShopifyCredentials | null> {
  const sb = getSupabase();

  // 1. Try Supabase
  if (sb && userId) {
    const { data, error } = await sb
      .from('shopify_stores')
      .select('store_domain, access_token, shop_name')
      .eq('user_id', userId)
      .single();

    if (!error && data) {
      return {
        storeDomain: data.store_domain as string,
        accessToken: data.access_token as string,
        shopName: (data.shop_name as string) ?? undefined,
      };
    }
  }

  // 2. Try query params (localStorage mode)
  const url = new URL(req.url);
  const storeDomain = url.searchParams.get('storeDomain');
  const accessToken = url.searchParams.get('accessToken');

  if (storeDomain && accessToken) {
    return { storeDomain, accessToken };
  }

  return null;
}

/**
 * Upsert Shopify credentials into the `shopify_stores` table.
 *
 * No-ops gracefully when Supabase is not configured.
 */
export async function upsertCredentials(
  userId: string,
  storeDomain: string,
  accessToken: string,
  shopName: string
): Promise<{ error: string | null }> {
  const sb = getSupabase();
  if (!sb) return { error: null }; // nothing to persist — that's fine

  const { error } = await sb.from('shopify_stores').upsert(
    {
      user_id: userId,
      store_domain: storeDomain,
      access_token: accessToken,
      shop_name: shopName,
    },
    { onConflict: 'user_id' }
  );

  return { error: error?.message ?? null };
}

// ── Shopify Admin API wrapper ─────────────────────────────────

const SHOPIFY_API_VERSION = '2025-07';

/** Options for a Shopify Admin API call */
interface ShopifyFetchOptions {
  /** The store domain, e.g. `my-store.myshopify.com` */
  storeDomain: string;
  /** Admin API access token */
  accessToken: string;
  /** REST endpoint path (without leading slash), e.g. `products.json` */
  endpoint: string;
  /** HTTP method — defaults to GET */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** JSON body (for POST / PUT) */
  body?: Record<string, unknown>;
}

/**
 * Execute a request against the Shopify Admin REST API.
 *
 * Returns the parsed JSON response on success.
 * Throws an `Error` with a human-readable message on failure.
 */
export async function shopifyFetch<T = Record<string, unknown>>(
  opts: ShopifyFetchOptions
): Promise<T> {
  const { storeDomain, accessToken, endpoint, method = 'GET', body } = opts;

  const url = `https://${storeDomain}/admin/api/${SHOPIFY_API_VERSION}/${endpoint}`;

  const headers: Record<string, string> = {
    'X-Shopify-Access-Token': accessToken,
    'Content-Type': 'application/json',
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '(no body)');
    throw new Error(
      `Shopify API ${method} /${endpoint} returned ${res.status}: ${text}`
    );
  }

  return (await res.json()) as T;
}
