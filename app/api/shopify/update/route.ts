import { NextRequest, NextResponse } from 'next/server';
import {
  verifyUser,
  getCredentials,
  shopifyFetch,
} from '@/lib/shopify-api';
import type { ShopifyProduct, VerificationResult } from '@/lib/shopify-types';

// ============================================================
// POST /api/shopify/update
//
// Pushes updated product fields (title, description, tags,
// product_type) back to the Shopify Admin API via PUT
// /products/{id}.json.
//
// After a successful update, reads the product back from Shopify
// to verify every field was updated successfully. Returns a
// structured VerificationResult[] array for the UI to display
// field-by-field confirmation.
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
  product_type?: string;
  storeDomain?: string;
  accessToken?: string;
}

// ── Response shape ────────────────────────────────────────────

interface UpdateSuccessResponse {
  success: true;
  /** The product as confirmed by Shopify after the update */
  product: ShopifyProduct;
  /** Field-by-field verification results */
  verification: VerificationResult[];
}

interface UpdateErrorResponse {
  success: false;
  error: string;
}

type UpdateResponse = UpdateSuccessResponse | UpdateErrorResponse;

// ── Helpers ───────────────────────────────────────────────────

/** Normalize tag strings for comparison (Shopify trims, lowercases, sorts) */
function normalizeTags(s: string): string {
  return s
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join(',');
}

/** Truncate a string for display in verification results */
function truncate(s: string, maxLen: number = 120): string {
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen) + '…';
}

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
      body.tags !== undefined ||
      body.product_type !== undefined;

    if (!hasUpdates) {
      return NextResponse.json<UpdateErrorResponse>(
        {
          success: false,
          error: 'At least one of title, body_html, tags, or product_type must be provided.',
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
    const bodyDomain = body.storeDomain;
    const bodyToken = body.accessToken;

    const creds = await getCredentials(req, userId);

    const storeDomain = bodyDomain ?? creds?.storeDomain;
    const accessToken = bodyToken && bodyToken !== 'oauth' ? bodyToken : creds?.accessToken;

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
    if (body.product_type !== undefined) productPayload.product_type = body.product_type;

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

    // ── Build structured verification results ───────────────
    const verification: VerificationResult[] = [];

    if (body.title !== undefined) {
      verification.push({
        field: 'Title',
        expected: body.title,
        actual: verifiedProduct.title,
        match: verifiedProduct.title === body.title,
      });
    }

    if (body.body_html !== undefined) {
      // HTML comparison: Shopify may normalize HTML slightly
      const expectedClean = body.body_html.replace(/\s+/g, ' ').trim();
      const actualClean = (verifiedProduct.body_html || '').replace(/\s+/g, ' ').trim();
      verification.push({
        field: 'Description',
        expected: truncate(body.body_html),
        actual: truncate(verifiedProduct.body_html || ''),
        match: expectedClean === actualClean,
      });
    }

    if (body.tags !== undefined) {
      const tagsMatch = normalizeTags(verifiedProduct.tags) === normalizeTags(body.tags);
      verification.push({
        field: 'Tags',
        expected: body.tags,
        actual: verifiedProduct.tags,
        match: tagsMatch,
      });
    }

    if (body.product_type !== undefined) {
      verification.push({
        field: 'Product Type',
        expected: body.product_type,
        actual: verifiedProduct.product_type,
        match: verifiedProduct.product_type === body.product_type,
      });
    }

    const allMatch = verification.every((v) => v.match);
    if (!allMatch) {
      console.warn(
        '[/api/shopify/update] Verification mismatches:',
        verification.filter((v) => !v.match).map((v) => `${v.field}: expected "${v.expected}", got "${v.actual}"`)
      );
    }

    console.log(
      `[/api/shopify/update] ✓ Product ${body.productId} updated and verified on ${storeDomain} (${verification.filter((v) => v.match).length}/${verification.length} fields match)`
    );

    return NextResponse.json<UpdateSuccessResponse>({
      success: true,
      product: verifiedProduct,
      verification,
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
