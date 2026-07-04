import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ============================================================
// POST /api/shopify/oauth
//
// Starts the Shopify OAuth authorization-code flow.
// The user provides their app Client ID, Client Secret, and
// store domain. We store the secrets in an encrypted httpOnly
// cookie, then return the Shopify OAuth authorization URL.
//
// The user's browser will redirect to Shopify for consent,
// then Shopify redirects to /api/shopify/oauth/callback.
// ============================================================

const SCOPES = 'read_products,write_products';
const COOKIE_NAME = 'rootx_shopify_oauth';
const COOKIE_MAX_AGE = 600; // 10 minutes — more than enough for the redirect

// AES-256-GCM encryption key derived from a secret.
// In production set SHOPIFY_OAUTH_SECRET env var (32+ chars).
function getEncryptionKey(): Buffer {
  const secret = process.env.SHOPIFY_OAUTH_SECRET || 'rootx-default-shopify-oauth-secret-key-32';
  return crypto.createHash('sha256').update(secret).digest();
}

/** Encrypt an object into a base64 string (AES-256-GCM). */
function encrypt(data: Record<string, string>): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = JSON.stringify(data);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Pack: iv (12) + tag (16) + ciphertext
  const packed = Buffer.concat([iv, tag, encrypted]);
  return packed.toString('base64url');
}

/** Loose domain validation */
function isValidDomain(domain: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-.]+\.[a-zA-Z]{2,}$/.test(domain);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      storeDomain?: string;
      clientId?: string;
      clientSecret?: string;
    };

    const storeDomain = body.storeDomain?.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const clientId = body.clientId?.trim();
    const clientSecret = body.clientSecret?.trim();

    if (!storeDomain || !clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'storeDomain, clientId, and clientSecret are required.' },
        { status: 400 }
      );
    }

    if (!isValidDomain(storeDomain)) {
      return NextResponse.json(
        { error: 'Invalid store domain. Use your *.myshopify.com domain.' },
        { status: 400 }
      );
    }

    // ── Generate CSRF state nonce ─────────────────────────────
    const state = crypto.randomBytes(16).toString('hex');

    // ── Encrypt credentials + state into a cookie ─────────────
    const cookieValue = encrypt({
      storeDomain,
      clientId,
      clientSecret,
      state,
    });

    // ── Build the Shopify OAuth authorization URL ─────────────
    // The redirect_uri MUST match the "Allowed redirection URL" in the
    // Shopify app settings exactly — including protocol and host.
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://rootxai.dev').replace(/\/$/, '');
    const redirectUri = `${appUrl}/api/shopify/oauth/callback`;

    const authUrl = new URL(`https://${storeDomain}/admin/oauth/authorize`);
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('scope', SCOPES);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);

    // ── Set the encrypted cookie and return the URL ───────────
    const response = NextResponse.json({
      authUrl: authUrl.toString(),
      redirectUri,
    });

    response.cookies.set(COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/shopify/oauth]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Only POST is allowed
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
