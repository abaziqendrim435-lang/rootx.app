import { NextRequest, NextResponse } from 'next/server';
import {
  verifyUser,
  getCredentials,
  shopifyFetch,
} from '@/lib/shopify-api';
import type { UpdateResponse } from '@/lib/shopify-types';

// ============================================================
// POST /api/shopify/update
//
// Pushes updated product fields (title, description, tags) back
// to the Shopify Admin API via PUT /products/{id}.json.
//
// In demo mode (no credentials), simulates success with a delay.
// ============================================================

// ── Request shape ─────────────────────────────────────────────

interface UpdateRequest {
  productId: number;
  title?: string;
  body_html?: string;
  tags?: string;
  storeDomain?: string;
  accessToken?: string;
}

// ── Route handler ─────────────────────────────────────────────

/**
 * @description Update a Shopify product's title, description, and/or tags.
 *
 * **Request body**
 * ```json
 * {
 *   "productId": 123,
 *   "title": "New Title",
 *   "body_html": "<p>Updated description</p>",
 *   "tags": "tag1, tag2, tag3"
 * }
 * ```
 *
 * **Response**
 * ```json
 * { "success": true }
 * ```
 */
export async function POST(req: NextRequest) {
  try {
    // ── Parse & validate body ───────────────────────────────
    const body = (await req.json()) as UpdateRequest;

    if (!body.productId || typeof body.productId !== 'number') {
      return NextResponse.json<UpdateResponse>(
        { success: false, error: 'productId (number) is required.' },
        { status: 400 }
      );
    }

    const hasUpdates =
      body.title !== undefined ||
      body.body_html !== undefined ||
      body.tags !== undefined;

    if (!hasUpdates) {
      return NextResponse.json<UpdateResponse>(
        {
          success: false,
          error: 'At least one of title, body_html, or tags must be provided.',
        },
        { status: 400 }
      );
    }

    // ── Auth ────────────────────────────────────────────────
    const { userId, error: authErr } = await verifyUser(req);

    if (authErr) {
      return NextResponse.json<UpdateResponse>(
        { success: false, error: authErr },
        { status: 401 }
      );
    }

    // ── Resolve credentials ─────────────────────────────────
    // For POST we also support body-level creds for localStorage mode
    const bodyDomain = body.storeDomain;
    const bodyToken = body.accessToken;

    const creds = await getCredentials(req, userId);

    // Override with explicit body params when present
    const storeDomain = bodyDomain ?? creds?.storeDomain;
    const accessToken = bodyToken ?? creds?.accessToken;

    if (!storeDomain || !accessToken) {
      // Demo mode — simulate a successful update
      console.log(
        '[/api/shopify/update] Demo mode — simulating product update for',
        body.productId
      );
      await new Promise((r) => setTimeout(r, 800));
      return NextResponse.json<UpdateResponse>({ success: true });
    }

    // ── Build Shopify payload ───────────────────────────────
    const productPayload: Record<string, unknown> = {
      id: body.productId,
    };
    if (body.title !== undefined) productPayload.title = body.title;
    if (body.body_html !== undefined) productPayload.body_html = body.body_html;
    if (body.tags !== undefined) productPayload.tags = body.tags;

    // ── Push to Shopify ─────────────────────────────────────
    try {
      await shopifyFetch({
        storeDomain,
        accessToken,
        endpoint: `products/${body.productId}.json`,
        method: 'PUT',
        body: { product: productPayload },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[/api/shopify/update] Shopify PUT failed:', msg);
      return NextResponse.json<UpdateResponse>(
        { success: false, error: msg },
        { status: 502 }
      );
    }

    return NextResponse.json<UpdateResponse>({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/shopify/update]', message);
    return NextResponse.json<UpdateResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
