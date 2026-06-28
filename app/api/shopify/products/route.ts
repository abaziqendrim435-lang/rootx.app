import { NextRequest, NextResponse } from 'next/server';
import {
  verifyUser,
  getCredentials,
  shopifyFetch,
} from '@/lib/shopify-api';
import type {
  ShopifyProduct,
  ShopifyVariant,
  ShopifyImage,
  ProductsResponse,
} from '@/lib/shopify-types';

// ============================================================
// GET /api/shopify/products
//
// Returns the product catalogue for the authenticated user's
// connected Shopify store.  Falls back to demo products when
// no credentials are available.
// ============================================================

// ── Demo products ─────────────────────────────────────────────

function getDemoProducts(): ShopifyProduct[] {
  const now = new Date().toISOString();

  const variant = (
    id: number,
    price: string,
    compare: string | null,
    sku: string,
    qty: number
  ): ShopifyVariant => ({
    id,
    title: 'Default',
    price,
    compare_at_price: compare,
    sku,
    inventory_quantity: qty,
  });

  const image = (
    id: number,
    seed: number,
    alt: string
  ): ShopifyImage => ({
    id,
    src: `https://picsum.photos/seed/${seed}/800/800`,
    alt,
    width: 800,
    height: 800,
  });

  return [
    {
      id: 100001,
      title: 'Minimalist Leather Wallet',
      body_html:
        '<p>Slim-profile genuine leather wallet with RFID blocking. Holds up to 8 cards and features a quick-access cash slot.</p>',
      vendor: 'RootX Goods',
      product_type: 'Accessories',
      tags: 'wallet, leather, rfid, minimalist, edc',
      status: 'active',
      created_at: now,
      updated_at: now,
      variants: [variant(200001, '49.99', '64.99', 'WALLET-BLK-01', 124)],
      images: [image(300001, 42, 'Minimalist leather wallet front view')],
    },
    {
      id: 100002,
      title: 'Organic Cotton Hoodie — Midnight Black',
      body_html:
        '<p>Ultra-soft 100% organic cotton hoodie. Pre-shrunk, enzyme-washed for a vintage feel. Unisex relaxed fit.</p>',
      vendor: 'RootX Apparel',
      product_type: 'Clothing',
      tags: 'hoodie, organic, cotton, unisex, streetwear',
      status: 'active',
      created_at: now,
      updated_at: now,
      variants: [variant(200002, '79.00', null, 'HOODIE-BLK-M', 58)],
      images: [image(300002, 88, 'Black organic cotton hoodie')],
    },
    {
      id: 100003,
      title: 'Bamboo Wireless Charging Pad',
      body_html:
        '<p>Eco-friendly Qi-certified 15 W fast charger with a natural bamboo surface. Compatible with all Qi-enabled devices.</p>',
      vendor: 'RootX Tech',
      product_type: 'Electronics',
      tags: 'charger, wireless, bamboo, eco, qi',
      status: 'active',
      created_at: now,
      updated_at: now,
      variants: [variant(200003, '34.95', '44.95', 'CHRG-BAMB-01', 212)],
      images: [image(300003, 137, 'Bamboo wireless charging pad')],
    },
    {
      id: 100004,
      title: 'Artisan Soy Candle — Cedar & Sage',
      body_html:
        '<p>Hand-poured 8 oz soy wax candle with natural cedar and sage essential oils. 45-hour burn time. Reusable ceramic vessel.</p>',
      vendor: 'RootX Home',
      product_type: 'Home & Garden',
      tags: 'candle, soy, aromatherapy, handmade, gift',
      status: 'draft',
      created_at: now,
      updated_at: now,
      variants: [variant(200004, '28.00', null, 'CNDL-CDS-08', 0)],
      images: [image(300004, 201, 'Cedar and sage soy candle')],
    },
  ];
}

// ── Route handler ─────────────────────────────────────────────

/**
 * @description Fetch products from the user's connected Shopify store.
 *
 * **Query params** (localStorage mode)
 * - `storeDomain` — Shopify store domain
 * - `accessToken` — Admin API access token
 *
 * **Response**
 * ```json
 * { "products": [...], "shopName": "My Store" }
 * ```
 */
export async function GET(req: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────
    const { userId, error: authErr } = await verifyUser(req);

    if (authErr) {
      return NextResponse.json<ProductsResponse>(
        { products: [], shopName: '', error: authErr },
        { status: 401 }
      );
    }

    // ── Resolve credentials ─────────────────────────────────
    const creds = await getCredentials(req, userId);

    if (!creds) {
      // Demo mode — return mock products
      return NextResponse.json<ProductsResponse>({
        products: getDemoProducts(),
        shopName: 'RootX Demo Store',
      });
    }

    // ── Fetch products from Shopify ─────────────────────────
    const fields = [
      'id',
      'title',
      'body_html',
      'vendor',
      'product_type',
      'tags',
      'status',
      'created_at',
      'updated_at',
      'variants',
      'images',
    ].join(',');

    const data = await shopifyFetch<{ products: ShopifyProduct[] }>({
      storeDomain: creds.storeDomain,
      accessToken: creds.accessToken,
      endpoint: `products.json?limit=50&fields=${fields}`,
    });

    return NextResponse.json<ProductsResponse>({
      products: data.products,
      shopName: creds.shopName ?? creds.storeDomain,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/shopify/products]', message);

    const isShopifyError = message.includes('Shopify API');
    return NextResponse.json<ProductsResponse>(
      { products: [], shopName: '', error: message },
      { status: isShopifyError ? 502 : 500 }
    );
  }
}
