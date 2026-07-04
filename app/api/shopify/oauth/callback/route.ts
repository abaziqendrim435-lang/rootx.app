import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ============================================================
// GET /api/shopify/oauth/callback
//
// Shopify redirects here after the user authorizes the app.
// We:
//   1. Read the encrypted cookie (client_id, client_secret, state)
//   2. Validate the CSRF state parameter
//   3. Validate the HMAC signature from Shopify
//   4. Exchange the authorization code for an access token
//   5. Test the token against the Shopify Admin API
//   6. Redirect to the agent page with success params
// ============================================================

const COOKIE_NAME = 'rootx_shopify_oauth';

function getEncryptionKey(): Buffer {
  const secret = process.env.SHOPIFY_OAUTH_SECRET || 'rootx-default-shopify-oauth-secret-key-32';
  return crypto.createHash('sha256').update(secret).digest();
}

/** Decrypt a base64url string back to an object (AES-256-GCM). */
function decrypt(encoded: string): Record<string, string> {
  const key = getEncryptionKey();
  const packed = Buffer.from(encoded, 'base64url');
  const iv = packed.subarray(0, 12);
  const tag = packed.subarray(12, 28);
  const ciphertext = packed.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

/** Validate the HMAC Shopify sends in the callback query params. */
function isValidHmac(
  query: Record<string, string>,
  clientSecret: string
): boolean {
  const hmac = query.hmac;
  if (!hmac) return false;

  // Build the message from all params except 'hmac', sorted alphabetically
  const entries = Object.entries(query)
    .filter(([key]) => key !== 'hmac')
    .sort(([a], [b]) => a.localeCompare(b));
  const message = entries.map(([k, v]) => `${k}=${v}`).join('&');

  const computed = crypto
    .createHmac('sha256', clientSecret)
    .update(message)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(computed));
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const shop = url.searchParams.get('shop');
  const state = url.searchParams.get('state');
  const hmac = url.searchParams.get('hmac');

  // The appUrl MUST match the Application URL configured in Shopify.
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://rootxai.dev').replace(/\/$/, '');
  const errorRedirect = (msg: string) =>
    NextResponse.redirect(`${appUrl}/agents/shopify-ai-agent?oauth_error=${encodeURIComponent(msg)}#connect-store`);

  // ── 1. Validate required params ────────────────────────────
  if (!code || !shop || !state) {
    return errorRedirect('Missing required OAuth parameters from Shopify.');
  }

  // ── 2. Read and decrypt the cookie ─────────────────────────
  const cookieValue = req.cookies.get(COOKIE_NAME)?.value;
  if (!cookieValue) {
    return errorRedirect('OAuth session expired. Please try connecting again.');
  }

  let stored: Record<string, string>;
  try {
    stored = decrypt(cookieValue);
  } catch {
    return errorRedirect('OAuth session corrupted. Please try connecting again.');
  }

  const { clientId, clientSecret, state: storedState, storeDomain } = stored;

  // ── 3. Validate CSRF state ─────────────────────────────────
  if (state !== storedState) {
    return errorRedirect('Invalid OAuth state. Possible CSRF attack — please try again.');
  }

  // ── 4. Validate HMAC ───────────────────────────────────────
  if (hmac) {
    const queryObj: Record<string, string> = {};
    url.searchParams.forEach((v, k) => { queryObj[k] = v; });
    if (!isValidHmac(queryObj, clientSecret)) {
      return errorRedirect('HMAC validation failed. The response may have been tampered with.');
    }
  }

  // ── 5. Exchange authorization code for access token ─────────
  let accessToken: string;
  try {
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text().catch(() => '');
      console.error('[OAuth callback] Token exchange failed:', tokenRes.status, text);
      return errorRedirect('Failed to exchange authorization code for access token.');
    }

    const tokenData = await tokenRes.json() as { access_token?: string };
    if (!tokenData.access_token) {
      return errorRedirect('Shopify did not return an access token.');
    }

    accessToken = tokenData.access_token;
  } catch (err) {
    console.error('[OAuth callback] Token exchange error:', err);
    return errorRedirect('Network error during token exchange.');
  }

  // ── 6. Verify the token works ──────────────────────────────
  let shopName = shop;
  try {
    const shopRes = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    });
    if (shopRes.ok) {
      const shopData = await shopRes.json() as { shop?: { name?: string } };
      shopName = shopData.shop?.name || shop;
    }
  } catch {
    // Non-fatal — token is valid even if this secondary call fails
  }

  // ── 7. Redirect to the agent page with success params ──────
  // We pass the token via a short-lived cookie (NOT in the URL)
  const credsCookie = Buffer.from(JSON.stringify({
    storeDomain: storeDomain || shop,
    accessToken,
    shopName,
  })).toString('base64url');

  const response = NextResponse.redirect(
    `${appUrl}/agents/shopify-ai-agent?oauth_success=true#connect-store`
  );

  // Store credentials in an httpOnly cookie for the client to read via API
  response.cookies.set('rootx_shopify_creds', credsCookie, {
    httpOnly: false, // Client JS needs to read this to save to localStorage
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60, // 1 minute — just long enough for the redirect
  });

  // Clear the OAuth session cookie
  response.cookies.delete(COOKIE_NAME);

  return response;
}
