// ============================================================
// RootX — Shopify AI Agent Types
//
// Shared TypeScript types for the Shopify integration feature.
// Used across all /api/shopify/* routes and client components.
// ============================================================

/** Shopify store credentials stored per-user */
export interface ShopifyCredentials {
  /** Shopify store domain, e.g. 'my-store.myshopify.com' */
  storeDomain: string;
  /** Shopify Admin API access token */
  accessToken: string;
  /** Resolved shop name after a successful connection test */
  shopName?: string;
}

/** Shopify product from the Admin API (REST) */
export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string | null;
  vendor: string;
  product_type: string;
  tags: string;
  status: 'active' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

/** A single product variant */
export interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  sku: string | null;
  inventory_quantity: number;
}

/** A product image */
export interface ShopifyImage {
  id: number;
  src: string;
  alt: string | null;
  width: number;
  height: number;
}

/** Result returned by the AI content generation endpoint */
export interface AIProductGeneration {
  title: string;
  bodyHtml: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  isDemo: boolean;
}

/** Response from POST /api/shopify/connect */
export interface ConnectResponse {
  success: boolean;
  shopName?: string;
  error?: string;
}

/** Response from GET /api/shopify/products */
export interface ProductsResponse {
  products: ShopifyProduct[];
  shopName: string;
  error?: string;
}

/** Response from POST /api/shopify/update */
export interface UpdateResponse {
  success: boolean;
  error?: string;
}
