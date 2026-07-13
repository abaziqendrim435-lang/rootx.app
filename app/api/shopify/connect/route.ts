import { NextRequest, NextResponse } from 'next/server';
import {
  verifyUser,
  getCredentials,
  upsertCredentials,
  deleteCredentials,
  shopifyFetch,
} from '@/lib/shopify-api';
import type { ConnectResponse } from '@/lib/shopify-types';

/** Loose domain validation — myshopify or custom domains */
function isValidDomain(domain: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-.]+\.[a-zA-Z]{2,}$/.test(domain);
}

/**
 * GET /api/shopify/connect
 * Retrieves connection details (storeDomain, shopName) for the authenticated user.
 * Access token is never exposed to the client.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId, error: authErr } = await verifyUser(req);
    if (authErr) {
      return NextResponse.json({ success: false, error: authErr }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ connected: false }); // demo mode
    }

    const creds = await getCredentials(req, userId);
    if (!creds) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      storeDomain: creds.storeDomain,
      shopName: creds.shopName || creds.storeDomain,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/shopify/connect] GET error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/shopify/connect
 * Tests a manual Shopify store connection (fallback for developer/admin use).
 * On success, persists credentials encrypted to Supabase.
 */
export async function POST(req: NextRequest) {
  try {
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
          error: 'Invalid store domain. Use your *.myshopify.com domain or a valid custom domain.',
        },
        { status: 400 }
      );
    }

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
          error: 'Could not connect to Shopify. Please double-check your store domain and access token.',
        },
        { status: 502 }
      );
    }

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
      }
    }

    return NextResponse.json<ConnectResponse>({
      success: true,
      shopName,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/shopify/connect] POST error:', message);
    return NextResponse.json<ConnectResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/shopify/connect
 * Disconnects the user's Shopify store by deleting credentials row in Supabase.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId, error: authErr } = await verifyUser(req);
    if (authErr || !userId) {
      return NextResponse.json(
        { success: false, error: authErr || 'Authentication required to disconnect.' },
        { status: 401 }
      );
    }

    const { error: deleteErr } = await deleteCredentials(userId);
    if (deleteErr) {
      console.error('[/api/shopify/connect] DELETE DB error:', deleteErr);
      return NextResponse.json({ success: false, error: deleteErr }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/shopify/connect] DELETE error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
