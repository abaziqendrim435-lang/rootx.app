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

const DEFAULT_ACTORS = [
  'devcake~aliexpress-products-scraper',
  'unfenced-group~aliexpress-scraper',
  'cryptosignals~aliexpress-scraper',
  'epctex~aliexpress-scraper',
];

export function getConfiguredActors(): string[] {
  const customActor = process.env.APIFY_ALIEXPRESS_ACTOR_ID?.trim();
  if (customActor) {
    return [customActor, ...DEFAULT_ACTORS.filter((a) => a !== customActor)];
  }
  return DEFAULT_ACTORS;
}

export function buildActorPayload(actorId: string, targetUrl: string, limit: number, isDirectUrl: boolean, searchQuery: string) {
  const cleanUrl = targetUrl.trim();
  const queryStr = (searchQuery || targetUrl).trim();

  if (actorId.includes('epctex')) {
    return {
      startUrls: [{ url: cleanUrl }],
      searchTerms: [queryStr],
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

export function extractAliExpressProductId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/(?:item\/|_|id=)(\d{10,16})/i) || url.match(/\b(\d{10,16})\b/);
  return match ? match[1] : null;
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
        obj.src || obj.originalSrc || obj.url || obj.originalUrl || obj.original ||
        obj.image_url || obj.imageUrl || obj.fullUrl || obj.link || obj.path ||
        obj.skuPropertyImagePath || obj.imagePath || ''
      ).trim();
    }

    if (urlStr) {
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

  // 2. Main single image fields
  const mainSingleFields = [
    'productMainImageUrl', 'productImage', 'product_image',
    'imageUrl', 'image_url', 'image', 'thumbnail', 'featuredImage',
    'featured_image', 'mainImage', 'main_image', 'src', 'url'
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
      if (lowerKey.includes('image') || lowerKey.includes('img') || lowerKey.includes('photo') || lowerKey.includes('pic')) {
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

export function matchDatasetItemByProductId(
  datasetItems: Record<string, unknown>[],
  requestedProductId: string | null
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
        if (idStr.includes(requestedProductId)) {
          const foundId = extractAliExpressProductId(idStr) || requestedProductId;
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
  }

  // Fallback: If no exact product ID match, select item with highest image count
  let bestItem = datasetItems[0];
  let maxImgCount = -1;

  datasetItems.forEach((candidate) => {
    const extracted = extractAllAliExpressProductImages(candidate);
    if (extracted.images.length > maxImgCount) {
      maxImgCount = extracted.images.length;
      bestItem = candidate;
    }
  });

  const selectedId = extractAliExpressProductId(
    String(bestItem.id || bestItem.productId || bestItem.itemId || bestItem.url || bestItem.productUrl || '')
  );

  return {
    item: bestItem,
    matched: false,
    requestedProductId,
    selectedResultProductId: selectedId,
    datasetItemCount: datasetItems.length,
  };
}

export async function fetchAliExpressProductViaApify(
  targetUrlOrQuery: string,
  options?: { isDirectUrl?: boolean }
): Promise<ApifyImportResult> {
  const isDirectUrl = options?.isDirectUrl ?? (targetUrlOrQuery.startsWith('http://') || targetUrlOrQuery.startsWith('https://'));
  const targetUrl = isDirectUrl ? targetUrlOrQuery.trim() : `https://www.aliexpress.com/w/wholesale-${encodeURIComponent(targetUrlOrQuery.trim())}.html`;
  const requestedProductId = extractAliExpressProductId(targetUrl);

  const trace: ApifyDebugTrace = {
    sourceUrl: targetUrl,
    apifyRunStatus: 'FAILED',
    actorUsed: null,
    requestedProductId,
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

  // Exact Product ID Matcher
  const matchRes = matchDatasetItemByProductId(datasetItems, requestedProductId);
  const item = matchRes.item;

  trace.requestedProductId = matchRes.requestedProductId;
  trace.selectedResultProductId = matchRes.selectedResultProductId;
  trace.matchedProductId = matchRes.matched;
  trace.datasetItemCount = matchRes.datasetItemCount;

  console.log(`[Apify Service] Product ID Matcher: requested="${requestedProductId}", selected="${matchRes.selectedResultProductId}", matched=${matchRes.matched}, datasetItemCount=${matchRes.datasetItemCount}`);

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

  // Deep canonical image extraction across all dataset product fields
  const report = extractAllAliExpressProductImages(item);

  trace.rawImageCount = report.stats.rawCandidates;
  trace.normalizedImageCount = report.stats.uniqueNormalizedCount;
  trace.validImageCount = report.stats.uniqueNormalizedCount;
  trace.mainGalleryCount = report.stats.mainGalleryCount;
  trace.variantImageCount = report.stats.variantCount;
  trace.descriptionImageCount = report.stats.descriptionCount;

  console.log(`[Apify Service] Image Extraction Report: rawCandidates=${report.stats.rawCandidates}, mainGallery=${report.stats.mainGalleryCount}, variants=${report.stats.variantCount}, description=${report.stats.descriptionCount}, uniqueNormalized=${report.stats.uniqueNormalizedCount}`);

  // Extract structured variants
  const variants: ApifyVariant[] = [];
  if (Array.isArray(item.variants)) {
    item.variants.forEach((v: Record<string, unknown>, idx: number) => {
      const vName = String(v.name || v.title || v.optionValue || v.color || `Variant ${idx + 1}`);
      const vPrice = v.price ? String(v.price) : price;
      const vSku = v.sku ? String(v.sku) : `SKU-${idx + 1}`;
      let vImg = '';
      if (v.image) vImg = String(v.image);
      else if (v.imageUrl) vImg = String(v.imageUrl);
      else if (v.image_url) vImg = String(v.image_url);
      variants.push({
        id: `var-${idx + 1}`,
        name: vName,
        price: vPrice,
        sku: vSku,
        imageUrl: vImg ? normalizeAliExpressImageUrl(vImg) : undefined,
      });
    });
  }

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
    images: report.images, // Full normalized images list
    featuredImage: report.images.length > 0 ? report.images[0] : null,
    variantImages: report.variantImages,
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
