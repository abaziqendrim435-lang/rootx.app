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
  /** Granted OAuth scopes */
  scopes?: string[];
  /** Connection status */
  status?: string;
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

// ── AI-generated content types ──────────────────────────────

/** AI analysis of a product image */
export interface ImageAnalysis {
  /** What the AI sees in the image */
  description: string;
  /** Detected dominant color palette */
  dominantColors: string[];
  /** Image style classification */
  style: string;
  /** Image quality assessment */
  quality: 'high' | 'medium' | 'low';
  /** Photo improvement suggestions */
  suggestions: string[];
}

/** AI-powered price analysis and suggestion */
export interface PriceAnalysis {
  /** AI-suggested optimal price */
  suggestedPrice: string;
  /** Current product price echoed back */
  currentPrice: string;
  /** Reasoning behind the price suggestion */
  reasoning: string;
  /** Suggested price range */
  priceRange: { min: string; max: string };
  /** Market positioning */
  competitivePosition: 'premium' | 'mid-range' | 'budget';
}

/** AI-suggested product category */
export interface CategorySuggestion {
  /** Best-fit category */
  primary: string;
  /** 2-3 alternative categories */
  alternatives: string[];
  /** Reasoning for the suggestion */
  reasoning: string;
}

/** Individual upsell or cross-sell suggestion */
export interface ProductSuggestion {
  /** Suggested product title */
  title: string;
  /** Why this product pairs well */
  reason: string;
  /** Suggested price point */
  pricePoint: string;
}

/** AI-generated upsell and cross-sell recommendations */
export interface UpsellCrossSell {
  /** Higher-value alternatives the customer might prefer */
  upsell: ProductSuggestion[];
  /** Complementary products to buy alongside */
  crossSell: ProductSuggestion[];
  /** A bundle/kit idea combining related products */
  bundleIdea: string;
}

/** Complete result returned by the AI content generation endpoint */
export interface AIProductGeneration {
  /** AI-generated product title */
  title: string;
  /** AI-generated product description (HTML) */
  bodyHtml: string;
  /** SEO meta title (≤60 chars) */
  seoTitle: string;
  /** SEO meta description (≤155 chars) */
  seoDescription: string;
  /** Generated product tags */
  tags: string[];
  /** Whether this is mock/demo content */
  isDemo: boolean;

  /** AI analysis of the product image (null if no image) */
  imageAnalysis: ImageAnalysis | null;
  /** AI-powered price suggestion (null if no price data) */
  priceAnalysis: PriceAnalysis | null;
  /** Suggested product category */
  categorySuggestion: CategorySuggestion;
  /** Upsell and cross-sell recommendations */
  upsellCrossSell: UpsellCrossSell;
}

// ── API response types ──────────────────────────────────────

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

/** Field-by-field verification result after pushing to Shopify */
export interface VerificationResult {
  /** Human-readable field name */
  field: string;
  /** What we sent to Shopify */
  expected: string;
  /** What Shopify returned after the update */
  actual: string;
  /** Whether the field matches */
  match: boolean;
}

/** Response from POST /api/shopify/update */
export interface UpdateResponse {
  success: boolean;
  /** The product as confirmed by Shopify after update (only on success) */
  product?: ShopifyProduct;
  /** Field-by-field verification results */
  verification?: VerificationResult[];
  error?: string;
}

// ── Shopify Theme Deployment types ──────────────────────────

/** A single file in a Shopify theme (key = path, value = content) */
export interface ShopifyThemeFile {
  /** Theme asset key, e.g. "layout/theme.liquid" */
  key: string;
  /** File content (Liquid, JSON, CSS, JS) */
  value: string;
}

/** Response from POST /api/shopify/theme (action: create) */
export interface ThemeCreateResponse {
  success: boolean;
  themeId?: number;
  themeName?: string;
  previewUrl?: string;
  /** Number of files successfully uploaded */
  uploadedCount?: number;
  /** Total number of files to upload */
  totalCount?: number;
  /** Individual file upload errors (non-fatal) */
  errors?: string[];
  /** Fatal error message */
  error?: string;
}

/** Response from POST /api/shopify/theme (action: publish) */
export interface ThemePublishResponse {
  success: boolean;
  error?: string;
}

/** UI state machine for the deploy modal */
export type ThemeDeployStatus =
  | 'idle'
  | 'connecting'
  | 'generating-files'
  | 'creating'
  | 'uploading'
  | 'done'
  | 'publishing'
  | 'published'
  | 'error';
