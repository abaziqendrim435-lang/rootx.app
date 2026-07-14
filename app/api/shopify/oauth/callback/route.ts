import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { upsertCredentials } from '@/lib/shopify-api';

const COOKIE_NAME = 'rootx_shopify_oauth';

function getEncryptionKey(): Buffer {
  const secret = process.env.SHOPIFY_CLIENT_SECRET || 'rootx-default-shopify-oauth-secret-key-32';
  return crypto.createHash('sha256').update(secret).digest();
}

function isValidShopifyDomain(domain: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(domain);
}

/** Decrypt base64url cookie data */
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

/** Validate the HMAC Shopify sends in callback query parameters */
function isValidHmac(
  query: Record<string, string>,
  clientSecret: string
): boolean {
  const hmac = query.hmac;
  if (!hmac) return false;

  // Sort and build message from all parameters except 'hmac'
  const entries = Object.entries(query)
    .filter(([key]) => key !== 'hmac')
    .sort(([a], [b]) => a.localeCompare(b));
  const message = entries.map(([k, v]) => `${k}=${v}`).join('&');

  const computed = crypto
    .createHmac('sha256', clientSecret)
    .update(message)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(computed));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const shop = url.searchParams.get('shop');
  const state = url.searchParams.get('state');
  const hmac = url.searchParams.get('hmac');

  const appUrl = (process.env.SHOPIFY_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://rootxai.dev').replace(/\/$/, '');

  // Default path if session decryption fails
  let redirectPath = '/agents/shopify-ai-agent';

  const getErrorRedirect = (msg: string) =>
    NextResponse.redirect(`${appUrl}${redirectPath}?shopify_error=${encodeURIComponent(msg)}#connect-store`);

  // 1. Verify basic callback query params
  if (!code || !shop || !state) {
    return getErrorRedirect('Missing required OAuth parameters from Shopify.');
  }

  // Validate shopify domain format
  if (!isValidShopifyDomain(shop)) {
    return getErrorRedirect('Invalid Shopify shop domain received.');
  }

  // 2. Read and decrypt session cookie
  const cookieValue = req.cookies.get(COOKIE_NAME)?.value;
  if (!cookieValue) {
    return getErrorRedirect('OAuth session expired. Please connect your store again.');
  }

  let stored: Record<string, string>;
  try {
    stored = decrypt(cookieValue);
  } catch (err) {
    console.error('[OAuth callback] Decryption failed:', err);
    return getErrorRedirect('OAuth session corrupted. Please try again.');
  }

  const { state: storedState, userId, storeDomain, redirectPath: storedRedirect } = stored;
  if (storedRedirect) {
    redirectPath = storedRedirect;
  }

  // 3. Validate CSRF state nonce and domain match
  if (state !== storedState) {
    return getErrorRedirect('Invalid OAuth state. Possible CSRF attack detected.');
  }

  if (shop !== storeDomain) {
    return getErrorRedirect('Callback shop domain does not match session store domain.');
  }

  const shopifyApiKey = process.env.SHOPIFY_CLIENT_ID;
  const shopifyApiSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!shopifyApiKey || !shopifyApiSecret) {
    return getErrorRedirect('Shopify credentials not configured on the server.');
  }

  // 4. Validate HMAC signature from Shopify
  const queryObj: Record<string, string> = {};
  url.searchParams.forEach((v, k) => { queryObj[k] = v; });
  if (!isValidHmac(queryObj, shopifyApiSecret)) {
    return getErrorRedirect('HMAC signature verification failed.');
  }

  // 5. Exchange code for access token
  let accessToken: string;
  try {
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: shopifyApiKey,
        client_secret: shopifyApiSecret,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text().catch(() => '');
      console.error('[OAuth callback] Token exchange status:', tokenRes.status, text);
      return getErrorRedirect('Failed to exchange authorization code for access token.');
    }

    const tokenData = await tokenRes.json() as { access_token?: string };
    if (!tokenData.access_token) {
      return getErrorRedirect('Shopify did not return an access token.');
    }

    accessToken = tokenData.access_token;
  } catch (err) {
    console.error('[OAuth callback] Token exchange error:', err);
    return getErrorRedirect('Network error during token exchange.');
  }

  // 6. Fetch shop name to confirm the connection works
  let shopName = shop;
  try {
    const shopRes = await fetch(`https://${shop}/admin/api/2025-07/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });
    if (shopRes.ok) {
      const shopData = await shopRes.json() as { shop?: { name?: string } };
      shopName = shopData.shop?.name || shop;
    }
  } catch (err) {
    console.warn('[OAuth callback] Failed to fetch shop name details:', err);
  }

  // 7. Store encrypted token in Supabase
  if (userId) {
    const { error: dbErr } = await upsertCredentials(
      userId,
      storeDomain || shop,
      accessToken,
      shopName,
      ['read_products', 'write_products', 'read_themes', 'write_themes']
    );

    if (dbErr) {
      console.error('[OAuth callback] Database upsert error:', dbErr);
      return getErrorRedirect(`Failed to save Shopify credentials: ${dbErr}`);
    }
  }

  // 8. Redirect back to client dashboard page with success flag
  const response = NextResponse.redirect(
    `${appUrl}${redirectPath}?oauth_success=true#connect-store`
  );

  // Clear session cookie
  response.cookies.delete(COOKIE_NAME);

  return response;
}
