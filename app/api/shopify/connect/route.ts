import { NextRequest, NextResponse } from 'next/server';
import {
  verifyUser,
  upsertCredentials,
  shopifyFetch,
} from '@/lib/shopify-api';
import type { ConnectResponse } from '@/lib/shopify-types';

// ============================================================
// POST /api/shopify/connect
//
// Tests a Shopify store connection by verifying the provided
// credentials against the Shopify Admin API.  On success the
// credentials are persisted to the `shopify_stores` table when
// Supabase is configured and the caller is authenticated.
// ============================================================

/** Loose domain validation — myshopify or custom domains */
function isValidDomain(domain: string): boolean {
  // Must look like a hostname (no protocol, no path)
  return /^[a-zA-Z0-9][a-zA-Z0-9\-.]+\.[a-zA-Z]{2,}$/.test(domain);
}

/**
 * @description Connect and verify Shopify store credentials.
 *
 * **Request body**
 * ```json
 * { "storeDomain": "my-store.myshopify.com", "accessToken": "shpat_..." }
 * ```
 *
 * **Response**
 * ```json
 * { "success": true, "shopName": "My Store" }
 * ```
 */
export async function POST(req: NextRequest) {
  try {
    // ── Parse body ──────────────────────────────────────────
    const body = (await req.json()) as {
      storeDomain?: string;
      accessToken?: string;
    };

    const storeDomain = body.storeDomain?.trim();
    const accessToken = body.accessToken?.trim();

    if (!storeDomain || !accessToken) {
      return NextResponse.json<ConnectResponse>(
        { success: false, error: 'storeDomain and accessToken are required.' },
        { status: 400 }
      );
    }

    if (!isValidDomain(storeDomain)) {
      return NextResponse.json<ConnectResponse>(
        {
          success: false,
          error:
            'Invalid store domain. Use your *.myshopify.com domain or a valid custom domain.',
        },
        { status: 400 }
      );
    }

    // ── Test credentials against Shopify ────────────────────
    let shopName: string;

    try {
      const data = await shopifyFetch<{ shop: { name: string } }>({
        storeDomain,
        accessToken,
        endpoint: 'shop.json',
      });
      shopName = data.shop.name;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[/api/shopify/connect] Shopify verification failed:', msg);
      return NextResponse.json<ConnectResponse>(
        {
          success: false,
          error:
            'Could not connect to Shopify. Please double-check your store domain and access token.',
        },
        { status: 502 }
      );
    }

    // ── Persist credentials (if Supabase + auth available) ──
    const { userId } = await verifyUser(req);

    if (userId) {
      const { error: upsertErr } = await upsertCredentials(
        userId,
        storeDomain,
        accessToken,
        shopName
      );
      if (upsertErr) {
        console.error('[/api/shopify/connect] DB upsert error:', upsertErr);
        // Non-fatal — the connection itself succeeded
      }
    }

    return NextResponse.json<ConnectResponse>({
      success: true,
      shopName,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/shopify/connect]', message);
    return NextResponse.json<ConnectResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
