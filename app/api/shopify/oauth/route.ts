import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyUser } from '@/lib/shopify-api';

const SCOPES = 'read_products,write_products,read_themes,write_themes';
const COOKIE_NAME = 'rootx_shopify_oauth';
const COOKIE_MAX_AGE = 600; // 10 minutes

function getEncryptionKey(): Buffer {
  const secret = process.env.SHOPIFY_CLIENT_SECRET || 'rootx-default-shopify-oauth-secret-key-32';
  return crypto.createHash('sha256').update(secret).digest();
}

/** Encrypt session variables into a secure cookie value */
function encrypt(data: Record<string, string>): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = JSON.stringify(data);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const packed = Buffer.concat([iv, tag, encrypted]);
  return packed.toString('base64url');
}

function isValidShopifyDomain(domain: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(domain);
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify caller is authenticated
    const { userId, error: authErr } = await verifyUser(req);
    if (authErr || !userId) {
      return NextResponse.json(
        { error: authErr || 'You must be logged in to connect a Shopify store.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({})) as {
      storeDomain?: string;
      redirectPath?: string;
    };

    let storeDomain = body.storeDomain?.trim();
    if (!storeDomain) {
      return NextResponse.json(
        { error: 'storeDomain is required.' },
        { status: 400 }
      );
    }

    // Clean domain
    storeDomain = storeDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Allow user to enter "my-store" instead of "my-store.myshopify.com"
    if (!storeDomain.includes('.')) {
      storeDomain = `${storeDomain}.myshopify.com`;
    }

    if (!isValidShopifyDomain(storeDomain)) {
      return NextResponse.json(
        { error: 'Invalid store domain. Use your *.myshopify.com domain.' },
        { status: 400 }
      );
    }

    const shopifyApiKey = process.env.SHOPIFY_CLIENT_ID;
    if (!shopifyApiKey) {
      return NextResponse.json(
        { error: 'Shopify Client ID (API Key) is not configured on the server.' },
        { status: 500 }
      );
    }

    const state = crypto.randomBytes(16).toString('hex');
    const redirectPath = body.redirectPath || '/agents/shopify-ai-agent';

    // Encrypt oauth parameters in the cookie
    const cookieValue = encrypt({
      storeDomain,
      state,
      userId,
      redirectPath,
    });

    const appUrl = (process.env.SHOPIFY_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://rootxai.dev').replace(/\/$/, '');
    const redirectUri = `${appUrl}/api/shopify/oauth/callback`;

    const authUrl = new URL(`https://${storeDomain}/admin/oauth/authorize`);
    authUrl.searchParams.set('client_id', shopifyApiKey);
    authUrl.searchParams.set('scope', SCOPES);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);

    const response = NextResponse.json({
      success: true,
      redirectUrl: authUrl.toString(),
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

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
