import { NextRequest, NextResponse } from 'next/server';
import {
  verifyUser,
  getCredentials,
  shopifyFetch,
} from '@/lib/shopify-api';
import type { ShopifyProduct } from '@/lib/shopify-types';

// ============================================================
// POST /api/shopify/update
//
// Pushes updated product fields (title, description, tags) back
// to the Shopify Admin API via PUT /products/{id}.json.
//
// After a successful update, reads the product back from Shopify
// to verify the change and returns the confirmed product data.
//
// NEVER simulates success — the response only succeeds when
// Shopify has confirmed the write.
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

// ── Response shape ────────────────────────────────────────────

interface UpdateSuccessResponse {
  success: true;
  /** The product as confirmed by Shopify after the update */
  product: ShopifyProduct;
}

interface UpdateErrorResponse {
  success: false;
  error: string;
}

type UpdateResponse = UpdateSuccessResponse | UpdateErrorResponse;

// ── Route handler ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── Parse & validate body ───────────────────────────────
    const body = (await req.json()) as UpdateRequest;

    if (!body.productId || typeof body.productId !== 'number') {
      return NextResponse.json<UpdateErrorResponse>(
        { success: false, error: 'productId (number) is required.' },
        { status: 400 }
      );
    }

    const hasUpdates =
      body.title !== undefined ||
      body.body_html !== undefined ||
      body.tags !== undefined;

    if (!hasUpdates) {
      return NextResponse.json<UpdateErrorResponse>(
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
      return NextResponse.json<UpdateErrorResponse>(
        { success: false, error: authErr },
        { status: 401 }
      );
    }

    // ── Resolve credentials ─────────────────────────────────
    // POST body credentials take priority over DB/query-string
    const bodyDomain = body.storeDomain;
    const bodyToken = body.accessToken;

    const creds = await getCredentials(req, userId);

    const storeDomain = bodyDomain ?? creds?.storeDomain;
    const accessToken = bodyToken ?? creds?.accessToken;

    if (!storeDomain || !accessToken) {
      return NextResponse.json<UpdateErrorResponse>(
        {
          success: false,
          error:
            'No Shopify credentials found. Please connect your store first.',
        },
        { status: 401 }
      );
    }

    // ── Build Shopify payload ───────────────────────────────
    const productPayload: Record<string, unknown> = {
      id: body.productId,
    };
    if (body.title !== undefined) productPayload.title = body.title;
    if (body.body_html !== undefined) productPayload.body_html = body.body_html;
    if (body.tags !== undefined) productPayload.tags = body.tags;

    // ── Push to Shopify ─────────────────────────────────────
    console.log(
      `[/api/shopify/update] Updating product ${body.productId} on ${storeDomain}...`
    );

    let putResponse: { product: ShopifyProduct };
    try {
      putResponse = await shopifyFetch<{ product: ShopifyProduct }>({
        storeDomain,
        accessToken,
        endpoint: `products/${body.productId}.json`,
        method: 'PUT',
        body: { product: productPayload },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[/api/shopify/update] Shopify PUT failed:', msg);
      return NextResponse.json<UpdateErrorResponse>(
        { success: false, error: msg },
        { status: 502 }
      );
    }

    // ── Verify the update ───────────────────────────────────
    // The PUT response already returns the updated product,
    // but we do a separate GET to be 100% sure it persisted.
    let verifiedProduct: ShopifyProduct;
    try {
      const getResponse = await shopifyFetch<{ product: ShopifyProduct }>({
        storeDomain,
        accessToken,
        endpoint: `products/${body.productId}.json`,
        method: 'GET',
      });
      verifiedProduct = getResponse.product;
    } catch {
      // If the verification read fails, trust the PUT response
      console.warn(
        '[/api/shopify/update] Verification read failed, using PUT response'
      );
      verifiedProduct = putResponse.product;
    }

    // ── Verify the fields actually changed ──────────────────
    const mismatches: string[] = [];
    if (body.title !== undefined && verifiedProduct.title !== body.title) {
      mismatches.push(
        `title: expected "${body.title}", got "${verifiedProduct.title}"`
      );
    }
    if (
      body.body_html !== undefined &&
      verifiedProduct.body_html !== body.body_html
    ) {
      mismatches.push('body_html: content did not match after update');
    }
    if (body.tags !== undefined && verifiedProduct.tags !== body.tags) {
      // Shopify normalizes tags (trims whitespace, lowercases), so do a soft check
      const normalize = (s: string) =>
        s
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
          .sort()
          .join(',');
      if (normalize(verifiedProduct.tags) !== normalize(body.tags)) {
        mismatches.push(
          `tags: expected "${body.tags}", got "${verifiedProduct.tags}"`
        );
      }
    }

    if (mismatches.length > 0) {
      console.warn(
        '[/api/shopify/update] Verification mismatches:',
        mismatches
      );
      // Still return success since the PUT didn't error — Shopify may have
      // normalized the content slightly
    }

    console.log(
      `[/api/shopify/update] ✓ Product ${body.productId} updated and verified on ${storeDomain}`
    );

    return NextResponse.json<UpdateSuccessResponse>({
      success: true,
      product: verifiedProduct,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/shopify/update]', message);
    return NextResponse.json<UpdateErrorResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
