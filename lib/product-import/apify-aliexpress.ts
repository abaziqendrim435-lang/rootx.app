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
  /** Search cards are display-only and must never be used as product-detail input. */
  importKind?: 'search-card' | 'product-detail';
}

export interface ProductionDiagnostics {
  requestedProductId: string | null;
  matchedProductId: string | null;
  datasetItemCount: number;
  datasetKeys: string[];
  rawGalleryCount: number;
  variantImageCount: number;
  descriptionImageCount: number;
  uniqueExtractedCount: number;
  rawImagesCount?: number;
  acceptedImagesCount?: number;
  persistedImagesCount?: number;
  previewImagesCount?: number;
  shopifyGalleryImagesCount?: number;
}

export interface ApifyDebugTrace {
  sourceUrl: string;
  apifyRunStatus: 'SUCCESS' | 'FALLBACK_ACTIVATED' | 'FAILED';
  actorUsed: string | null;
  requestedProductId?: string | null;
  selectedResultProductId?: string | null;
  matchedProductId?: boolean;
  datasetItemCount?: number;
  rawImageCount: number;
  normalizedImageCount: number;
  validImageCount: number;
  downloadedImageCount: number;
  zipImageCount: number;
  shopifyGalleryCount: number;
  mainGalleryCount?: number;
  variantImageCount?: number;
  descriptionImageCount?: number;
  diagnostics?: ProductionDiagnostics;
  failedImages: Array<{ url: string; reason: string }>;
  failureReasons: string[];
}

export interface ApifyImportResult {
  success: boolean;
  product: ApifyProductData | null;
  trace: ApifyDebugTrace;
  error?: string;
  isFallback?: boolean;
  productIdMismatch?: boolean;
}

export interface ApifySearchResult {
  success: boolean;
  products: ApifyProductData[];
  trace: ApifyDebugTrace;
  error?: string;
}

import { extractAliExpressProductId } from '../product-identity';

export { extractAliExpressProductId };

export interface AliExpressExtractionReport {
  images: string[];
  variantImages: string[];
  mainGallery: string[];
  descriptionImages: string[];
  stats: {
    rawCandidates: number;
    mainGalleryCount: number;
    variantCount: number;
    descriptionCount: number;
    uniqueNormalizedCount: number;
  };
}

const PRIMARY_DIRECT_URL_ACTOR = 'unfenced-group~aliexpress-scraper';

/** Search-card actors must never satisfy a direct product URL import. */
const SEARCH_CARD_ONLY_ACTORS = new Set([
  'devcake~aliexpress-products-scraper',
]);

const DEFAULT_ACTORS = [
  PRIMARY_DIRECT_URL_ACTOR,
  'devcake~aliexpress-products-scraper',
  'cryptosignals~aliexpress-scraper',
  'epctex~aliexpress-scraper',
];

const DIRECT_URL_DETAIL_ACTORS = [
  PRIMARY_DIRECT_URL_ACTOR,
  'cryptosignals~aliexpress-scraper',
  'epctex~aliexpress-scraper',
];

export function getConfiguredActors(options?: { isDirectUrl?: boolean }): string[] {
  if (options?.isDirectUrl) {
    const customActor = process.env.APIFY_ALIEXPRESS_ACTOR_ID?.trim();
    if (
      customActor &&
      customActor !== PRIMARY_DIRECT_URL_ACTOR &&
      !SEARCH_CARD_ONLY_ACTORS.has(customActor)
    ) {
      return [
        PRIMARY_DIRECT_URL_ACTOR,
        customActor,
        ...DIRECT_URL_DETAIL_ACTORS.filter(
          (actor) => actor !== PRIMARY_DIRECT_URL_ACTOR && actor !== customActor
        ),
      ];
    }
    return [...DIRECT_URL_DETAIL_ACTORS];
  }

  const customActor = process.env.APIFY_ALIEXPRESS_ACTOR_ID?.trim();
  if (customActor) {
    return [customActor, ...DEFAULT_ACTORS.filter((a) => a !== customActor)];
  }
  return DEFAULT_ACTORS;
}

export function buildActorPayload(actorId: string, targetUrl: string, limit: number, isDirectUrl: boolean, searchQuery: string) {
  const cleanUrl = targetUrl.trim();
  const queryStr = (searchQuery || targetUrl).trim();
  const productId = extractAliExpressProductId(cleanUrl) || queryStr;

  if (actorId.includes('epctex')) {
    return {
      startUrls: [{ url: cleanUrl }],
      searchTerms: [cleanUrl, productId],
      maxItems: limit,
    };
  }

  if (actorId.includes('devcake')) {
    return {
      startUrls: [{ url: cleanUrl }],
      searchQueries: [cleanUrl, productId],
      maxResults: limit,
      maxItems: limit,
    };
  }

  if (isDirectUrl) {
    return {
      startUrls: [{ url: cleanUrl }],
      productUrls: [cleanUrl],
      searchQueries: [cleanUrl, productId],
      maxResults: limit,
      maxItems: limit,
    };
  }

  return {
    startUrls: [{ url: cleanUrl }],
    productUrls: [cleanUrl],
    searchQueries: [queryStr],
    maxResults: limit,
    maxItems: limit,
  };
}

export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();
  if (clean.length < 5) return false;

  // Base64 image URIs are valid
  if (clean.startsWith('data:image/')) return true;

  // REJECT Webpage HTML URLs
  if (clean.includes('/item/') || clean.includes('/w/wholesale') || clean.endsWith('.html') || clean.endsWith('.htm') || clean.includes('.html?')) {
    return false;
  }

  // Reject tracking / placeholders / tiny icons
  if (
    clean.includes('tracking') ||
    clean.includes('pixel') ||
    clean.includes('spacer') ||
    clean.includes('1x1') ||
    clean.includes('blank.gif') ||
    clean.includes('avatar') ||
    /\/\d{2,4}x\d{2,4}\.(png|gif)(\?|#|$)/i.test(clean)
  ) {
    return false;
  }

  const isUrlScheme = clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('//');
  if (!isUrlScheme) return false;

  const hasImageExt = /\.(jpg|jpeg|png|webp|gif|svg)(\?|#|$)/i.test(clean);
  const isCdnPath = (clean.includes('alicdn.com') || clean.includes('aliexpress-media.com') || clean.includes('aliexpress')) && (clean.includes('/kf/') || clean.includes('/g/') || clean.includes('/item/'));

  return hasImageExt || isCdnPath;
}

export function normalizeAliExpressImageUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim().replace(/[\r\n\t]/g, '').replace(/&amp;/g, '&');

  // Protocol relative fix
  if (url.startsWith('//')) {
    url = `https:${url}`;
  } else if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/')) {
    if (!url.startsWith('/')) {
      url = `https://${url}`;
    }
  }

  if (!isValidImageUrl(url)) return '';

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

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      const paramsToStrip = ['_t', 'utm_source', 'utm_medium', 'utm_campaign', 'spm', 'scm'];
      paramsToStrip.forEach((p) => parsed.searchParams.delete(p));
      url = parsed.toString();
    } catch {
      url = url.replace(/([?&])(_t|spm|scm|utm_[^=]+)=[^&]*&?/gi, '$1').replace(/[?&]$/, '');
    }
  }

  return url;
}

export function extractImagesFromAliExpressHtml(html: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  const addImg = (url: string) => {
    const norm = normalizeAliExpressImageUrl(url);
    if (!norm) return;
    if (seen.has(norm)) return;
    seen.add(norm);
    images.push(norm);
  };

  // 1. Scan for imagePathList or pcDetailUrlList or summaryImageList JSON arrays in script blocks
  const jsonArrayRegex = /"(?:imagePathList|pcDetailUrlList|summaryImageList|summryImageList|summImagePathList|images|gallery)"\s*:\s*(\[[^\]]+\])/gi;
  let arrayMatch: RegExpExecArray | null;
  while ((arrayMatch = jsonArrayRegex.exec(html)) !== null) {
    try {
      const arr = JSON.parse(arrayMatch[1]);
      if (Array.isArray(arr)) {
        arr.forEach((item) => {
          if (typeof item === 'string') addImg(item);
        });
      }
    } catch {
      const strRegex = /https?:\\?\/\\?\/[a-zA-Z0-9_-]+\.(?:alicdn\.com|aliexpress-media\.com)\\?\/[a-zA-Z0-9_\-\/]+\.(?:jpg|jpeg|png|webp)/gi;
      let m: RegExpExecArray | null;
      while ((m = strRegex.exec(arrayMatch[1])) !== null) {
        addImg(m[0].replace(/\\/g, ''));
      }
    }
  }

  // 2. Scan for skuPropertyImagePath in script blocks
  const skuImgRegex = /"skuPropertyImagePath"\s*:\s*"([^"]+)"/gi;
  let skuMatch: RegExpExecArray | null;
  while ((skuMatch = skuImgRegex.exec(html)) !== null) {
    addImg(skuMatch[1].replace(/\\/g, ''));
  }

  // 3. Scan for any alicdn.com image URLs in general HTML / scripts
  const cdnRegex = /https?:\\?\/\\?\/[a-zA-Z0-9_-]+\.(?:alicdn\.com|aliexpress-media\.com)\\?\/kf\\?\/[a-zA-Z0-9_\-\/]+\.(?:jpg|jpeg|png|webp)/gi;
  let cdnMatch: RegExpExecArray | null;
  while ((cdnMatch = cdnRegex.exec(html)) !== null) {
    addImg(cdnMatch[0].replace(/\\/g, ''));
  }

  return images;
}

export function extractAllAliExpressProductImages(rawProduct: Record<string, unknown>): AliExpressExtractionReport {
  const rawCandidates: string[] = [];
  const mainGallery: string[] = [];
  const variantImages: string[] = [];
  const descriptionImages: string[] = [];

  const addCandidate = (val: unknown, category: 'gallery' | 'variant' | 'description' | 'other' = 'other') => {
    if (!val) return;
    let urlStr = '';
    if (typeof val === 'string') {
      urlStr = val.trim();
    } else if (typeof val === 'object' && val !== null) {
      const obj = val as Record<string, unknown>;
      urlStr = String(
        obj.src || obj.originalSrc || obj.imageUrl || obj.image_url || obj.originalUrl || obj.original ||
        obj.fullUrl || obj.link || obj.path || obj.skuPropertyImagePath || obj.imagePath || obj.image || ''
      ).trim();
    }

    if (urlStr && isValidImageUrl(urlStr)) {
      rawCandidates.push(urlStr);
      if (category === 'gallery') mainGallery.push(urlStr);
      if (category === 'variant') variantImages.push(urlStr);
      if (category === 'description') descriptionImages.push(urlStr);
    }
  };

  // 1. Direct main gallery arrays
  const mainGalleryFields = [
    'images', 'productImages', 'gallery', 'galleryImages', 'media',
    'imageUrls', 'imagePathList', 'pcDetailUrlList', 'summaryImageList',
    'summryImageList', 'detailUrlList', 'picList', 'sliderImages',
    'product_images', 'photos', 'pictures', 'itemGallery'
  ];

  mainGalleryFields.forEach((field) => {
    const val = rawProduct[field];
    if (Array.isArray(val)) val.forEach((v) => addCandidate(v, 'gallery'));
    else if (val) addCandidate(val, 'gallery');
  });

  // 2. Main single image fields (OMIT webpage 'url' / 'productUrl')
  const mainSingleFields = [
    'productMainImageUrl', 'productImage', 'product_image',
    'imageUrl', 'image_url', 'image', 'thumbnail', 'featuredImage',
    'featured_image', 'mainImage', 'main_image', 'src'
  ];

  mainSingleFields.forEach((field) => {
    const val = rawProduct[field];
    if (val) addCandidate(val, 'gallery');
  });

  // 3. Variant and SKU images
  const variantFields = [
    'variants', 'skus', 'skuImages', 'sku_images', 'skuProperties',
    'productSKUPropertyList', 'sku_properties', 'skuList'
  ];

  variantFields.forEach((field) => {
    const val = rawProduct[field];
    if (Array.isArray(val)) {
      val.forEach((item) => {
        if (typeof item === 'object' && item !== null) {
          const obj = item as Record<string, unknown>;
          if (obj.image) addCandidate(obj.image, 'variant');
          if (obj.imageUrl) addCandidate(obj.imageUrl, 'variant');
          if (obj.image_url) addCandidate(obj.image_url, 'variant');
          if (obj.skuImage) addCandidate(obj.skuImage, 'variant');
          if (obj.skuPropertyImagePath) addCandidate(obj.skuPropertyImagePath, 'variant');
          if (Array.isArray(obj.skuPropertyValues)) {
            obj.skuPropertyValues.forEach((spv: unknown) => {
              if (typeof spv === 'object' && spv !== null) {
                const spvObj = spv as Record<string, unknown>;
                if (spvObj.skuPropertyImagePath) addCandidate(spvObj.skuPropertyImagePath, 'variant');
                if (spvObj.skuImage) addCandidate(spvObj.skuImage, 'variant');
              }
            });
          }
        } else {
          addCandidate(item, 'variant');
        }
      });
    }
  });

  // 4. HTML Description image regex scanner
  const descText = String(rawProduct.description || rawProduct.descriptionHtml || rawProduct.detail || '');
  if (descText) {
    const imgRegex = /https?:\/\/[a-zA-Z0-9_-]+\.alicdn\.com\/[a-zA-Z0-9_\-\/]+\.(?:jpg|jpeg|png|webp)/gi;
    let m: RegExpExecArray | null;
    while ((m = imgRegex.exec(descText)) !== null) {
      addCandidate(m[0], 'description');
    }
  }

  // 5. Recursive deep object traversal for remaining uncollected keys
  function deepTraverse(obj: unknown, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 5) return;
    if (Array.isArray(obj)) {
      obj.forEach((item) => deepTraverse(item, depth + 1));
      return;
    }
    const rec = obj as Record<string, unknown>;
    Object.entries(rec).forEach(([key, val]) => {
      const lowerKey = key.toLowerCase();
      // Omit keys like 'url', 'producturl', 'pageurl'
      if (lowerKey === 'url' || lowerKey === 'producturl' || lowerKey === 'pageurl' || lowerKey === 'itemurl' || lowerKey === 'link') {
        return;
      }
      if (lowerKey.includes('image') || lowerKey.includes('img') || lowerKey.includes('photo') || lowerKey.includes('pic') || lowerKey.includes('media') || lowerKey.includes('gallery') || lowerKey.includes('sku')) {
        if (Array.isArray(val)) val.forEach((v) => addCandidate(v, 'other'));
        else addCandidate(val, 'other');
      } else if (typeof val === 'object' && val !== null) {
        deepTraverse(val, depth + 1);
      }
    });
  }

  deepTraverse(rawProduct);

  // 6. Normalize and deduplicate preserving exact first occurrence sequence
  const normalizedImages: string[] = [];
  const seen = new Set<string>();

  rawCandidates.forEach((raw) => {
    const norm = normalizeAliExpressImageUrl(raw);
    if (!norm) return;
    if (seen.has(norm)) return;
    seen.add(norm);
    normalizedImages.push(norm);
  });

  const normMain = mainGallery.map(normalizeAliExpressImageUrl).filter((u) => u && seen.has(u));
  const normVar = variantImages.map(normalizeAliExpressImageUrl).filter((u) => u && seen.has(u));
  const normDesc = descriptionImages.map(normalizeAliExpressImageUrl).filter((u) => u && seen.has(u));

  return {
    images: normalizedImages,
    variantImages: normVar,
    mainGallery: normMain,
    descriptionImages: normDesc,
    stats: {
      rawCandidates: rawCandidates.length,
      mainGalleryCount: [...new Set(normMain)].length,
      variantCount: [...new Set(normVar)].length,
      descriptionCount: [...new Set(normDesc)].length,
      uniqueNormalizedCount: normalizedImages.length,
    },
  };
}

export const extractAllProductImages = extractAllAliExpressProductImages;

export function matchDatasetItemByProductId(
  datasetItems: Record<string, unknown>[],
  requestedProductId: string | null,
  options?: { requireExactMatch?: boolean }
): {
  item: Record<string, unknown>;
  matched: boolean;
  requestedProductId: string | null;
  selectedResultProductId: string | null;
  datasetItemCount: number;
} {
  if (datasetItems.length === 0) {
    return {
      item: {},
      matched: false,
      requestedProductId,
      selectedResultProductId: null,
      datasetItemCount: 0,
    };
  }

  if (requestedProductId) {
    for (const candidate of datasetItems) {
      const idsToTest = [
        String(candidate.id || ''),
        String(candidate.productId || ''),
        String(candidate.itemId || ''),
        String(candidate.product_id || ''),
        String(candidate.item_id || ''),
        String(candidate.url || ''),
        String(candidate.productUrl || ''),
        String(candidate.link || ''),
      ];

      for (const idStr of idsToTest) {
        const foundId = extractAliExpressProductId(idStr);
        if (foundId && foundId === requestedProductId) {
          return {
            item: candidate,
            matched: true,
            requestedProductId,
            selectedResultProductId: foundId,
            datasetItemCount: datasetItems.length,
          };
        }
      }
    }

    return {
      item: {},
      matched: false,
      requestedProductId,
      selectedResultProductId: null,
      datasetItemCount: datasetItems.length,
    };
  }

  return {
    item: {},
    matched: false,
    requestedProductId,
    selectedResultProductId: null,
    datasetItemCount: datasetItems.length,
  };
}

export function resolveDatasetItemProductId(item: Record<string, unknown>): string | null {
  const candidates = [
    item.productId,
    item.id,
    item.itemId,
    item.product_id,
    item.item_id,
    item.url,
    item.productUrl,
    item.link,
  ];

  for (const val of candidates) {
    const id = extractAliExpressProductId(String(val || ''));
    if (id) return id;
  }

  return null;
}

export function resolveDatasetItemProductUrl(
  item: Record<string, unknown>,
  productId?: string | null
): string {
  const pid = productId || resolveDatasetItemProductId(item);

  for (const field of ['url', 'productUrl', 'link']) {
    const raw = String(item[field] || '').trim();
    if (raw.startsWith('http') && pid && raw.includes(pid)) {
      return raw;
    }
  }

  if (pid) {
    return `https://www.aliexpress.com/item/${pid}.html`;
  }

  return String(item.url || item.productUrl || item.link || '').trim();
}

function parsePriceFields(item: Record<string, unknown>): {
  price: string;
  originalPrice: string;
  discount: string;
} {
  let price = '0.00';
  if (item.priceCurrent) price = String(item.priceCurrent).replace(/[^0-9.]/g, '');
  else if (item.priceText) price = String(item.priceText).replace(/[^0-9.]/g, '');
  else if (item.price) {
    price = typeof item.price === 'object'
      ? String((item.price as any).value || (item.price as any).amount || '0.00')
      : String(item.price);
  } else if (item.salePrice) {
    price = typeof item.salePrice === 'object'
      ? String((item.salePrice as any).value || (item.salePrice as any).amount || '0.00')
      : String(item.salePrice);
  } else if (item.priceRange) {
    price = typeof item.priceRange === 'object'
      ? String((item.priceRange as any).value || (item.priceRange as any).amount || '0.00')
      : String(item.priceRange);
  }

  let originalPrice = '';
  if (item.priceOriginal) originalPrice = String(item.priceOriginal).replace(/[^0-9.]/g, '');
  else if (item.originalPrice) {
    originalPrice = typeof item.originalPrice === 'object'
      ? String((item.originalPrice as any).value || (item.originalPrice as any).amount || '')
      : String(item.originalPrice);
  } else if (item.compareAtPrice) {
    originalPrice = typeof item.compareAtPrice === 'object'
      ? String((item.compareAtPrice as any).value || (item.compareAtPrice as any).amount || '')
      : String(item.compareAtPrice);
  }

  const discount = String(item.priceDiscount || item.discount || item.discountPercentage || '');

  return { price, originalPrice, discount };
}

export function mapDatasetItemToApifyProduct(
  item: Record<string, unknown>,
  options?: { thumbnailOnly?: boolean }
): ApifyProductData | null {
  const productId = resolveDatasetItemProductId(item);
  if (!productId) return null;

  const pageUrl = resolveDatasetItemProductUrl(item, productId);
  const title = String(item.title || item.productTitle || item.name || item.subject || 'Imported Product').trim();
  const { price, originalPrice, discount } = parsePriceFields(item);
  const report = extractAllAliExpressProductImages(item);
  const galleryImages = options?.thumbnailOnly
    ? report.images.slice(0, 1)
    : report.images;

  const rating = item.ratingValue || item.rating || item.stars || (item.aggregateRating as any)?.ratingValue
    ? parseFloat(String(item.ratingValue || item.rating || item.stars || (item.aggregateRating as any)?.ratingValue))
    : null;
  const orders = item.orders || item.orderCount || item.sales || item.soldCount
    ? parseInt(String(item.orders || item.orderCount || item.sales || item.soldCount).replace(/[^0-9]/g, ''), 10)
    : null;
  const seller = String(item.storeName || (item.seller as any)?.name || (item.store as any)?.name || item.seller || 'AliExpress Supplier');
  const shipping = String(item.shippingInfo || (item.shipping as any)?.name || item.shipping || 'Tracked Shipping');
  const description = String(item.description || item.descriptionHtml || title);

  return {
    title,
    price,
    originalPrice,
    discount,
    description,
    descriptionHtml: String(item.descriptionHtml || ''),
    images: galleryImages,
    featuredImage: galleryImages[0] || null,
    variantImages: options?.thumbnailOnly ? [] : report.variantImages,
    variants: [],
    specifications: [],
    rating,
    orders,
    seller,
    shipping,
    url: pageUrl.includes(productId) ? pageUrl : `https://www.aliexpress.com/item/${productId}.html`,
    importKind: options?.thumbnailOnly ? 'search-card' : 'product-detail',
  };
}

export async function fetchAliExpressSearchViaApify(searchQuery: string): Promise<ApifySearchResult> {
  const query = searchQuery.trim();
  const targetUrl = `https://www.aliexpress.com/w/wholesale-${encodeURIComponent(query)}.html`;

  const trace: ApifyDebugTrace = {
    sourceUrl: targetUrl,
    apifyRunStatus: 'FAILED',
    actorUsed: null,
    requestedProductId: null,
    selectedResultProductId: null,
    matchedProductId: false,
    datasetItemCount: 0,
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
    return { success: false, products: [], trace, error: errMsg };
  }

  const actors = getConfiguredActors({ isDirectUrl: false });
  let lastError = '';

  for (const actorId of actors) {
    try {
      console.log(`[Apify Service] Search Actor: ${actorId} for query: ${query.slice(0, 80)}...`);
      const runUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apifyToken}&timeout=60`;
      const payload = buildActorPayload(actorId, targetUrl, 12, false, query);

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
      if (!Array.isArray(data) || data.length === 0) {
        trace.failureReasons.push(`Actor ${actorId} returned empty dataset.`);
        continue;
      }

      const datasetItems = data as Record<string, unknown>[];
      const products: ApifyProductData[] = [];
      const seenProductIds = new Set<string>();

      for (const item of datasetItems) {
        const mapped = mapDatasetItemToApifyProduct(item, { thumbnailOnly: true });
        if (!mapped) continue;

        const productId = resolveDatasetItemProductId(item);
        if (!productId || seenProductIds.has(productId)) continue;

        seenProductIds.add(productId);
        products.push(mapped);
      }

      if (products.length === 0) {
        trace.failureReasons.push(`Actor ${actorId} returned ${datasetItems.length} items but none had a valid product ID.`);
        continue;
      }

      trace.actorUsed = actorId;
      trace.apifyRunStatus = 'SUCCESS';
      trace.datasetItemCount = datasetItems.length;
      trace.rawImageCount = products.reduce((sum, product) => sum + product.images.length, 0);
      trace.normalizedImageCount = trace.rawImageCount;
      trace.validImageCount = trace.rawImageCount;

      console.log(`[Apify Service] Search mapped ${products.length} unique product cards from ${datasetItems.length} dataset items.`);
      return { success: true, products, trace };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Apify Service] Search actor ${actorId} failed:`, msg);
      lastError = msg;
      trace.failureReasons.push(`Actor ${actorId}: ${msg}`);
    }
  }

  return {
    success: false,
    products: [],
    trace,
    error: `Apify search returned no valid product cards. ${lastError}`,
  };
}

export async function fetchAliExpressProductViaApify(
  targetUrlOrQuery: string,
  options?: { isDirectUrl?: boolean }
): Promise<ApifyImportResult> {
  const isDirectUrl =
    options?.isDirectUrl ??
    (targetUrlOrQuery.startsWith('http://') || targetUrlOrQuery.startsWith('https://'));

  if (!isDirectUrl) {
    const errMsg =
      'Product-detail extraction cannot run a search. Use fetchAliExpressSearchViaApify for search cards.';
    return {
      success: false,
      product: null,
      trace: {
        sourceUrl: targetUrlOrQuery,
        apifyRunStatus: 'FAILED',
        actorUsed: null,
        requestedProductId: extractAliExpressProductId(targetUrlOrQuery),
        selectedResultProductId: null,
        matchedProductId: false,
        datasetItemCount: 0,
        rawImageCount: 0,
        normalizedImageCount: 0,
        validImageCount: 0,
        downloadedImageCount: 0,
        zipImageCount: 0,
        shopifyGalleryCount: 0,
        failedImages: [],
        failureReasons: [errMsg],
      },
      error: errMsg,
      productIdMismatch: true,
    };
  }

  const { fetchExactAliExpressProduct } = await import('./exact-product-detail');
  return fetchExactAliExpressProduct(targetUrlOrQuery.trim());
}
