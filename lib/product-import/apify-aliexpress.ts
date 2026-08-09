// ============================================================
// RootX — Apify AliExpress Product Extraction Module
// Server-side module for importing AliExpress products via Apify Actors.
// Never exposes APIFY_API_TOKEN to client code or debug logs.
// ============================================================

export interface ApifyVariant {
  id?: string;
  name: string;
  price?: string;
  sku?: string;
  imageUrl?: string;
  values?: string[];
}

export interface ApifySpecification {
  label: string;
  value: string;
}

export interface ApifyProductData {
  title: string;
  price: string;
  originalPrice: string;
  discount: string;
  description: string;
  descriptionHtml?: string;
  images: string[];
  featuredImage: string | null;
  variantImages: string[];
  variants: ApifyVariant[];
  specifications: ApifySpecification[];
  rating: number | null;
  orders: number | null;
  seller: string;
  shipping: string;
  url: string;
}

export interface ApifyDebugTrace {
  sourceUrl: string;
  apifyRunStatus: 'SUCCESS' | 'FALLBACK_ACTIVATED' | 'FAILED';
  actorUsed: string | null;
  rawImageCount: number;
  normalizedImageCount: number;
  validImageCount: number;
  downloadedImageCount: number;
  zipImageCount: number;
  shopifyGalleryCount: number;
  failedImages: Array<{ url: string; reason: string }>;
  failureReasons: string[];
}

export interface ApifyImportResult {
  success: boolean;
  product: ApifyProductData | null;
  trace: ApifyDebugTrace;
  error?: string;
  isFallback?: boolean;
}

const DEFAULT_ACTORS = [
  'devcake~aliexpress-products-scraper',
  'unfenced-group~aliexpress-scraper',
  'cryptosignals~aliexpress-scraper',
  'epctex~aliexpress-scraper',
];

export function getConfiguredActors(): string[] {
  const customActor = process.env.APIFY_ALIEXPRESS_ACTOR_ID?.trim();
  if (customActor) {
    // Put custom actor first, followed by default actors as backup
    return [customActor, ...DEFAULT_ACTORS.filter((a) => a !== customActor)];
  }
  return DEFAULT_ACTORS;
}

export function buildActorPayload(actorId: string, targetUrl: string, limit: number, isDirectUrl: boolean, searchQuery: string) {
  if (actorId.includes('epctex')) {
    return isDirectUrl
      ? { startUrls: [{ url: targetUrl }], maxItems: 1 }
      : { searchTerms: [searchQuery], maxItems: limit };
  }
  return isDirectUrl
    ? { startUrls: [{ url: targetUrl }], maxResults: 1 }
    : { searchQueries: [searchQuery], maxResults: limit };
}

export function normalizeAliExpressImageUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim().replace(/[\r\n\t]/g, '').replace(/&amp;/g, '&');

  // Protocol relative fix
  if (url.startsWith('//')) {
    url = `https:${url}`;
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (!url.startsWith('/')) {
      url = `https://${url}`;
    }
  }

  if (url.includes('alicdn.com') || url.includes('aliexpress')) {
    // Strip query / sizing parameters appended after valid image extensions (e.g. .jpg_640x640.jpg -> .jpg)
    url = url.replace(/\.(jpg|jpeg|png|webp)_.*$/gi, '.$1');
    // Convert raw _220x220.jpg -> .jpg
    url = url.replace(/_\d+x\d+\.(jpg|jpeg|png|webp)$/gi, '.$1');
    // Strip trailing _.webp or _Q90.jpg
    url = url.replace(/_\.webp$/gi, '');
    url = url.replace(/_Q\d+\.(jpg|jpeg|png|webp)$/gi, '.$1');
  }

  url = url.replace(/\.(jpg|jpeg|png|webp)\.(jpg|jpeg|png|webp)$/gi, '.$1');

  try {
    const parsed = new URL(url);
    const paramsToStrip = ['_t', 'utm_source', 'utm_medium', 'utm_campaign', 'spm', 'scm'];
    paramsToStrip.forEach((p) => parsed.searchParams.delete(p));
    url = parsed.toString();
  } catch {
    url = url.replace(/([?&])(_t|spm|scm|utm_[^=]+)=[^&]*&?/gi, '$1').replace(/[?&]$/, '');
  }

  return url;
}

export async function fetchAliExpressProductViaApify(
  targetUrlOrQuery: string,
  options?: { isDirectUrl?: boolean }
): Promise<ApifyImportResult> {
  const isDirectUrl = options?.isDirectUrl ?? (targetUrlOrQuery.startsWith('http://') || targetUrlOrQuery.startsWith('https://'));
  const targetUrl = isDirectUrl ? targetUrlOrQuery.trim() : `https://www.aliexpress.com/w/wholesale-${encodeURIComponent(targetUrlOrQuery.trim())}.html`;

  const trace: ApifyDebugTrace = {
    sourceUrl: targetUrl,
    apifyRunStatus: 'FAILED',
    actorUsed: null,
    rawImageCount: 0,
    normalizedImageCount: 0,
    validImageCount: 0,
    downloadedImageCount: 0,
    zipImageCount: 0,
    shopifyGalleryCount: 0,
    failedImages: [],
    failureReasons: [],
  };

  const apifyToken = process.env.APIFY_API_TOKEN;
  if (!apifyToken) {
    const errMsg = 'APIFY_API_TOKEN is missing in server environment.';
    trace.failureReasons.push(errMsg);
    return { success: false, product: null, trace, error: errMsg };
  }

  const actors = getConfiguredActors();
  let lastError = '';
  let datasetItems: Record<string, unknown>[] = [];

  for (const actorId of actors) {
    try {
      console.log(`[Apify Service] Invoking Actor: ${actorId} for URL: ${targetUrl.slice(0, 80)}...`);
      const runUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apifyToken}&timeout=60`;
      const payload = buildActorPayload(actorId, targetUrl, 8, isDirectUrl, targetUrlOrQuery);

      const response = await fetch(runUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Apify Actor ${actorId} HTTP ${response.status}: ${errText.slice(0, 150)}`);
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        datasetItems = data as Record<string, unknown>[];
        trace.actorUsed = actorId;
        trace.apifyRunStatus = 'SUCCESS';
        console.log(`[Apify Service] Actor ${actorId} successfully returned ${datasetItems.length} items.`);
        break;
      } else {
        trace.failureReasons.push(`Actor ${actorId} returned empty dataset.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Apify Service] Actor ${actorId} failed:`, msg);
      lastError = msg;
      trace.failureReasons.push(`Actor ${actorId}: ${msg}`);
    }
  }

  if (datasetItems.length === 0) {
    return {
      success: false,
      product: null,
      trace,
      error: `Apify extraction returned no dataset items. ${lastError}`,
    };
  }

  // Parse the primary item from Apify dataset
  const item = datasetItems[0];
  const title = String(item.title || item.productTitle || item.name || item.subject || 'Imported Product').trim();

  // Price parsing
  let price = '0.00';
  if (item.priceCurrent) price = String(item.priceCurrent).replace(/[^0-9.]/g, '');
  else if (item.priceText) price = String(item.priceText).replace(/[^0-9.]/g, '');
  else if (item.price) price = typeof item.price === 'object' ? String((item.price as any).value || (item.price as any).amount || '0.00') : String(item.price);
  else if (item.salePrice) price = typeof item.salePrice === 'object' ? String((item.salePrice as any).value || (item.salePrice as any).amount || '0.00') : String(item.salePrice);
  else if (item.priceRange) price = typeof item.priceRange === 'object' ? String((item.priceRange as any).value || (item.priceRange as any).amount || '0.00') : String(item.priceRange);

  // Original price
  let originalPrice = '';
  if (item.priceOriginal) originalPrice = String(item.priceOriginal).replace(/[^0-9.]/g, '');
  else if (item.originalPrice) originalPrice = typeof item.originalPrice === 'object' ? String((item.originalPrice as any).value || (item.originalPrice as any).amount || '') : String(item.originalPrice);
  else if (item.compareAtPrice) originalPrice = typeof item.compareAtPrice === 'object' ? String((item.compareAtPrice as any).value || (item.compareAtPrice as any).amount || '') : String(item.compareAtPrice);

  const discount = String(item.priceDiscount || item.discount || item.discountPercentage || '');

  // Raw Image Extraction across all candidate fields
  const rawImageCandidates: string[] = [];
  const variantImages: string[] = [];

  const addRawImg = (val: unknown, isVariant = false) => {
    if (!val) return;
    let str = '';
    if (typeof val === 'string') str = val.trim();
    else if (typeof val === 'object' && val !== null) {
      const obj = val as Record<string, unknown>;
      str = String(obj.src || obj.originalSrc || obj.url || obj.originalUrl || obj.image_url || obj.imageUrl || obj.fullUrl || obj.link || '').trim();
    }
    if (str) {
      rawImageCandidates.push(str);
      if (isVariant) variantImages.push(str);
    }
  };

  const imageFields = [
    'images', 'productImages', 'gallery', 'galleryImages', 'media',
    'imageUrls', 'productMainImageUrl', 'productImage', 'product_image',
    'imageUrl', 'image_url', 'image', 'thumbnail', 'skuImage', 'sku_image',
    'pcDetailUrlList', 'summaryImageList', 'detailUrlList', 'picList'
  ];

  imageFields.forEach((field) => {
    const val = item[field];
    if (Array.isArray(val)) val.forEach((v) => addRawImg(v));
    else if (val) addRawImg(val);
  });

  // Extract variant images
  const variants: ApifyVariant[] = [];
  if (Array.isArray(item.variants)) {
    item.variants.forEach((v: Record<string, unknown>, idx: number) => {
      const vName = String(v.name || v.title || v.optionValue || v.color || `Variant ${idx + 1}`);
      const vPrice = v.price ? String(v.price) : price;
      const vSku = v.sku ? String(v.sku) : `SKU-${idx + 1}`;
      let vImg = '';
      if (v.image) { addRawImg(v.image, true); vImg = String(v.image); }
      if (v.imageUrl) { addRawImg(v.imageUrl, true); vImg = String(v.imageUrl); }
      if (v.image_url) { addRawImg(v.image_url, true); vImg = String(v.image_url); }
      variants.push({
        id: `var-${idx + 1}`,
        name: vName,
        price: vPrice,
        sku: vSku,
        imageUrl: vImg ? normalizeAliExpressImageUrl(vImg) : undefined,
      });
    });
  }

  trace.rawImageCount = rawImageCandidates.length;

  // Normalize image URLs and deduplicate PRESERVING ORIGINAL ORDER
  const normalizedImages: string[] = [];
  const seenUrls = new Set<string>();

  rawImageCandidates.forEach((raw) => {
    const norm = normalizeAliExpressImageUrl(raw);
    if (!norm) {
      trace.failedImages.push({ url: raw, reason: 'Empty or invalid URL format' });
      return;
    }
    if (seenUrls.has(norm)) return; // Duplicate check preserving first occurrence order
    seenUrls.add(norm);
    normalizedImages.push(norm);
  });

  trace.normalizedImageCount = normalizedImages.length;
  trace.validImageCount = normalizedImages.length;

  // Specifications
  let specifications: ApifySpecification[] = [];
  if (Array.isArray(item.specifications)) {
    specifications = item.specifications
      .map((s: unknown) => {
        if (typeof s === 'object' && s !== null) {
          const obj = s as Record<string, unknown>;
          return { label: String(obj.label || obj.name || obj.key || ''), value: String(obj.value || obj.val || '') };
        }
        return { label: 'Spec', value: String(s) };
      })
      .filter((s) => Boolean(s.label && s.value));
  } else if (item.specifications && typeof item.specifications === 'object') {
    specifications = Object.entries(item.specifications as Record<string, unknown>).map(([label, value]) => ({
      label,
      value: String(value),
    }));
  }

  // Seller, shipping, rating, orders
  const rating = item.ratingValue || item.rating || item.stars || (item.aggregateRating as any)?.ratingValue ? parseFloat(String(item.ratingValue || item.rating || item.stars || (item.aggregateRating as any)?.ratingValue)) : null;
  const orders = item.orders || item.orderCount || item.sales || item.soldCount ? parseInt(String(item.orders || item.orderCount || item.sales || item.soldCount).replace(/[^0-9]/g, ''), 10) : null;
  const seller = String(item.storeName || (item.seller as any)?.name || (item.store as any)?.name || item.seller || 'AliExpress Supplier');
  const shipping = String(item.shippingInfo || (item.shipping as any)?.name || item.shipping || 'Tracked Shipping');
  const description = String(item.description || item.descriptionHtml || title);

  const productData: ApifyProductData = {
    title,
    price,
    originalPrice,
    discount,
    description,
    descriptionHtml: String(item.descriptionHtml || ''),
    images: normalizedImages,
    featuredImage: normalizedImages.length > 0 ? normalizedImages[0] : null,
    variantImages: variantImages.map(normalizeAliExpressImageUrl).filter(Boolean),
    variants,
    specifications,
    rating,
    orders,
    seller,
    shipping,
    url: String(item.url || item.productUrl || targetUrl),
  };

  return {
    success: true,
    product: productData,
    trace,
  };
}
