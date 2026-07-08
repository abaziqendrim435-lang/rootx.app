import { NextRequest, NextResponse } from 'next/server';
import {
  verifyUser,
  getCredentials,
  shopifyFetch,
} from '@/lib/shopify-api';
import type {
  ShopifyThemeFile,
  ThemeCreateResponse,
  ThemePublishResponse,
} from '@/lib/shopify-types';

// ============================================================
// POST /api/shopify/theme
//
// Unified endpoint for Shopify theme deployment. Dispatches on
// the `action` field in the request body:
//
//   • "create"  — Create a new theme and upload all asset files
//   • "publish" — Promote a theme to the live (main) role
//   • "status"  — Fetch current theme metadata (processing state)
//
// All actions resolve Shopify credentials using the same pattern
// as /api/shopify/update: body params → Supabase DB → query
// string, in that priority order.
// ============================================================

// ── Request shapes ───────────────────────────────────────────

interface CreateRequest {
  action: 'create';
  storeDomain?: string;
  accessToken?: string;
  themeName: string;
  files: ShopifyThemeFile[];
}

interface PublishRequest {
  action: 'publish';
  storeDomain?: string;
  accessToken?: string;
  themeId: number;
}

interface StatusRequest {
  action: 'status';
  storeDomain?: string;
  accessToken?: string;
  themeId: number;
}

type ThemeRequest = CreateRequest | PublishRequest | StatusRequest;

// ── Shopify API response shapes ──────────────────────────────

interface ShopifyThemeObject {
  id: number;
  name: string;
  role: string;
  processing: boolean;
  previewable: boolean;
}

// ── Constants ────────────────────────────────────────────────

/** Delay between sequential file uploads (ms) */
const UPLOAD_DELAY_MS = 500;

/** Maximum retries on 429 rate-limit responses */
const MAX_RATE_LIMIT_RETRIES = 3;

/** Base backoff delay for 429 retries (ms) — doubles each attempt */
const BASE_BACKOFF_MS = 1000;

// ── Helpers ──────────────────────────────────────────────────

/**
 * Sleep for `ms` milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Upload a single theme asset with retry logic for Shopify rate limits.
 *
 * On a 429 response the function retries with exponential backoff
 * (1 s → 2 s → 4 s). After `MAX_RATE_LIMIT_RETRIES` consecutive 429s
 * the error is re-thrown.
 *
 * @returns `null` on success, or an error string on non-429 failure.
 */
async function uploadAssetWithRetry(
  storeDomain: string,
  accessToken: string,
  themeId: number,
  file: ShopifyThemeFile
): Promise<string | null> {
  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
    try {
      await shopifyFetch({
        storeDomain,
        accessToken,
        endpoint: `themes/${themeId}/assets.json`,
        method: 'PUT',
        body: { asset: { key: file.key, value: file.value } },
      });
      return null; // success
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      // Detect 429 rate-limit responses
      if (message.includes('429')) {
        if (attempt < MAX_RATE_LIMIT_RETRIES) {
          const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt);
          console.log(
            `[/api/shopify/theme] Rate limited on "${file.key}", retrying in ${backoff}ms (attempt ${attempt + 1}/${MAX_RATE_LIMIT_RETRIES})…`
          );
          await delay(backoff);
          continue;
        }
        // Exhausted retries
        console.error(
          `[/api/shopify/theme] Rate limit retries exhausted for "${file.key}"`
        );
        return `Rate limit exceeded for ${file.key} after ${MAX_RATE_LIMIT_RETRIES} retries`;
      }

      // Non-429 error — log and return the message
      console.error(
        `[/api/shopify/theme] Failed to upload "${file.key}":`,
        message
      );
      return `Failed to upload ${file.key}: ${message}`;
    }
  }

  // Should not be reached, but satisfy the compiler
  return `Unexpected retry state for ${file.key}`;
}

// ── Action handlers ──────────────────────────────────────────

/**
 * **create** — Create a blank theme on Shopify, then upload every
 * asset file sequentially with a small inter-request delay.
 *
 * Returns a `ThemeCreateResponse` with upload statistics and a
 * preview URL.
 */
async function handleCreate(
  storeDomain: string,
  accessToken: string,
  body: CreateRequest
): Promise<NextResponse<ThemeCreateResponse>> {
  const { themeName, files } = body;

  if (!themeName || typeof themeName !== 'string') {
    return NextResponse.json<ThemeCreateResponse>(
      { success: false, error: 'themeName (string) is required.' },
      { status: 400 }
    );
  }

  if (!Array.isArray(files) || files.length === 0) {
    return NextResponse.json<ThemeCreateResponse>(
      { success: false, error: 'files (non-empty array) is required.' },
      { status: 400 }
    );
  }

  // 1. Create a blank theme
  console.log(
    `[/api/shopify/theme] Creating theme "${themeName}" on ${storeDomain}…`
  );

  let themeId: number;
  try {
    const createRes = await shopifyFetch<{ theme: ShopifyThemeObject }>({
      storeDomain,
      accessToken,
      endpoint: 'themes.json',
      method: 'POST',
      body: { theme: { name: themeName } },
    });
    themeId = createRes.theme.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/shopify/theme] Theme creation failed:', msg);
    return NextResponse.json<ThemeCreateResponse>(
      { success: false, error: msg },
      { status: 502 }
    );
  }

  console.log(
    `[/api/shopify/theme] Theme created with id ${themeId}, uploading ${files.length} files…`
  );

  // 2. Upload each file sequentially
  const errors: string[] = [];
  let uploadedCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    const uploadError = await uploadAssetWithRetry(
      storeDomain,
      accessToken,
      themeId,
      file
    );

    if (uploadError) {
      errors.push(uploadError);
    } else {
      uploadedCount++;
    }

    // Throttle between uploads (skip after the last file)
    if (i < files.length - 1) {
      await delay(UPLOAD_DELAY_MS);
    }
  }

  // 3. Build preview URL
  const previewUrl = `https://${storeDomain}/?preview_theme_id=${themeId}`;

  console.log(
    `[/api/shopify/theme] ✓ Upload complete: ${uploadedCount}/${files.length} files succeeded` +
      (errors.length > 0 ? `, ${errors.length} errors` : '')
  );

  return NextResponse.json<ThemeCreateResponse>({
    success: true,
    themeId,
    themeName,
    previewUrl,
    uploadedCount,
    totalCount: files.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}

/**
 * **publish** — Promote a theme to the live (main) role by
 * setting `role: 'main'` on the theme resource.
 */
async function handlePublish(
  storeDomain: string,
  accessToken: string,
  body: PublishRequest
): Promise<NextResponse<ThemePublishResponse>> {
  const { themeId } = body;

  if (!themeId || typeof themeId !== 'number') {
    return NextResponse.json<ThemePublishResponse>(
      { success: false, error: 'themeId (number) is required.' },
      { status: 400 }
    );
  }

  console.log(
    `[/api/shopify/theme] Publishing theme ${themeId} on ${storeDomain}…`
  );

  try {
    await shopifyFetch({
      storeDomain,
      accessToken,
      endpoint: `themes/${themeId}.json`,
      method: 'PUT',
      body: { theme: { id: themeId, role: 'main' } },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/shopify/theme] Publish failed:', msg);
    return NextResponse.json<ThemePublishResponse>(
      { success: false, error: msg },
      { status: 502 }
    );
  }

  console.log(
    `[/api/shopify/theme] ✓ Theme ${themeId} published on ${storeDomain}`
  );

  return NextResponse.json<ThemePublishResponse>({ success: true });
}

/**
 * **status** — Retrieve current metadata for a theme, including
 * its processing state and role.
 */
async function handleStatus(
  storeDomain: string,
  accessToken: string,
  body: StatusRequest
): Promise<NextResponse> {
  const { themeId } = body;

  if (!themeId || typeof themeId !== 'number') {
    return NextResponse.json(
      { success: false, error: 'themeId (number) is required.' },
      { status: 400 }
    );
  }

  console.log(
    `[/api/shopify/theme] Fetching status for theme ${themeId} on ${storeDomain}…`
  );

  try {
    const res = await shopifyFetch<{ theme: ShopifyThemeObject }>({
      storeDomain,
      accessToken,
      endpoint: `themes/${themeId}.json`,
      method: 'GET',
    });

    return NextResponse.json({
      success: true,
      theme: {
        id: res.theme.id,
        name: res.theme.name,
        role: res.theme.role,
        processing: res.theme.processing,
        previewable: res.theme.previewable,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/shopify/theme] Status fetch failed:', msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 502 }
    );
  }
}

// ── Route handler ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── Parse & validate body ───────────────────────────────
    const body = (await req.json()) as ThemeRequest;

    if (!body.action) {
      return NextResponse.json(
        { success: false, error: 'action is required (create | publish | status).' },
        { status: 400 }
      );
    }

    // ── Auth ────────────────────────────────────────────────
    const { userId, error: authErr } = await verifyUser(req);

    if (authErr) {
      return NextResponse.json(
        { success: false, error: authErr },
        { status: 401 }
      );
    }

    // ── Resolve credentials ─────────────────────────────────
    // Priority: request body → Supabase DB → query string
    const bodyDomain = body.storeDomain;
    const bodyToken = body.accessToken;

    const creds = await getCredentials(req, userId);

    const storeDomain = bodyDomain ?? creds?.storeDomain;
    const accessToken = bodyToken ?? creds?.accessToken;

    if (!storeDomain || !accessToken) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No Shopify credentials found. Please connect your store first.',
        },
        { status: 401 }
      );
    }

    // ── Dispatch action ─────────────────────────────────────
    switch (body.action) {
      case 'create':
        return handleCreate(storeDomain, accessToken, body);

      case 'publish':
        return handlePublish(storeDomain, accessToken, body);

      case 'status':
        return handleStatus(storeDomain, accessToken, body);

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action "${(body as { action: string }).action}". Expected: create | publish | status.`,
          },
          { status: 400 }
        );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/shopify/theme]', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
