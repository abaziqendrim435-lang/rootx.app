// ============================================================
// RootX — Exact AliExpress product-detail extractor
// Fetches ONLY the frozen product URL. Never searches. Never
// substitutes another dataset item. Gallery comes from that page.
// ============================================================

import {
  belongsToIdentity,
  createCanonicalProductIdentity,
  extractAliExpressProductId,
  type CanonicalProductIdentity,
} from '../product-identity';
import {
  extractImagesFromAliExpressHtml,
  type ApifyImportResult,
  type ApifyProductData,
  type ApifyDebugTrace,
} from './apify-aliexpress';

export interface ExactProductDetailCounts {
  DETAIL_RAW_IMAGES_COUNT: number;
  EXTRACTED_IMAGES_COUNT: number;
  NORMALIZED_IMAGES_COUNT: number;
  VALID_IMAGES_COUNT: number;
  DEDUPED_IMAGES_COUNT: number;
}

export interface ExactProductDetail {
  identity: CanonicalProductIdentity;
  product: ApifyProductData;
  counts: ExactProductDetailCounts;
  extractor: 'exact-product-html';
  finalUrl: string;
}

function emptyTrace(sourceUrl: string, actorUsed: string | null): ApifyDebugTrace {
  return {
    sourceUrl,
    apifyRunStatus: 'FAILED',
    actorUsed,
    requestedProductId: extractAliExpressProductId(sourceUrl),
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
}

function metaContent(html: string, property: string): string {
  const quoted = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    'i'
  );
  const reverse = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    'i'
  );
  return quoted.exec(html)?.[1]?.trim() || reverse.exec(html)?.[1]?.trim() || '';
}

function parseTitle(html: string): string {
  const og = metaContent(html, 'og:title').replace(/\s*-\s*AliExpress.*$/i, '').trim();
  if (og) return og;
  const title = /<title>([^<]+)<\/title>/i.exec(html)?.[1]?.trim() || '';
  return title.replace(/\s*-\s*AliExpress.*$/i, '').trim();
}

function pageLooksBlocked(html: string): boolean {
  const lower = html.toLowerCase();
  return (
    lower.includes('rgv587_cooldown') ||
    lower.includes('bx-punish') ||
    lower.includes('punish') && lower.includes('captcha')
  );
}

async function fetchExactProductHtml(sourceUrl: string): Promise<{ html: string; finalUrl: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(sourceUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Exact product page HTTP ${response.status}`);
    }
    const html = await response.text();
    if (pageLooksBlocked(html)) {
      throw new Error('AliExpress blocked the exact product-detail fetch (anti-bot).');
    }
    return { html, finalUrl: response.url || sourceUrl };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchExactAliExpressProduct(
  identityInput: CanonicalProductIdentity | string,
  selectionSessionId?: string
): Promise<ApifyImportResult & { exactDetail?: ExactProductDetail }> {
  const identity =
    typeof identityInput === 'string'
      ? createCanonicalProductIdentity(identityInput, selectionSessionId)
      : identityInput;

  const trace = emptyTrace(identity.sourceUrl, 'exact-product-html');
  trace.requestedProductId = identity.productId;

  if (extractAliExpressProductId(identity.sourceUrl) !== identity.productId) {
    const error = `Product ID mismatch: identity.productId "${identity.productId}" does not match sourceUrl.`;
    trace.failureReasons.push(error);
    return { success: false, product: null, trace, error, productIdMismatch: true };
  }

  let html: string;
  let finalUrl: string;
  try {
    const page = await fetchExactProductHtml(identity.sourceUrl);
    html = page.html;
    finalUrl = page.finalUrl;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    trace.failureReasons.push(error);
    return { success: false, product: null, trace, error };
  }

  const resolvedProductId = extractAliExpressProductId(finalUrl);
  identity.resolvedProductId = resolvedProductId && resolvedProductId !== identity.productId ? resolvedProductId : null;

  // A redirect to a differently numbered item is a different supplier product for
  // RootX purposes. Never relabel it as the selected product or cache its gallery
  // under the selected product's identity.
  if (resolvedProductId && resolvedProductId !== identity.productId) {
    const error = `Product ID mismatch: requested "${identity.productId}", returned "${resolvedProductId}".`;
    trace.selectedResultProductId = resolvedProductId;
    trace.matchedProductId = false;
    trace.failureReasons.push(error);
    return { success: false, product: null, trace, error, productIdMismatch: true };
  }

  if (!/\/item\/\d{10,16}/i.test(finalUrl) && !finalUrl.includes(identity.productId)) {
    const error = `Exact product-detail fetch did not land on an AliExpress item page for "${identity.productId}".`;
    trace.failureReasons.push(error);
    return { success: false, product: null, trace, error, productIdMismatch: true };
  }

  const pageIds = new Set(
    [...html.matchAll(/(?:item\/|productId["']?\s*[:=]\s*["']?)(\d{10,16})/gi)].map((m) => m[1])
  );
  const pageBelongsToSelection =
    pageIds.has(identity.productId) ||
    belongsToIdentity(resolvedProductId, identity) ||
    finalUrl.includes(identity.productId);

  if (!pageBelongsToSelection) {
    const returnedId = resolvedProductId || [...pageIds][0] || null;
    const error = `Product ID mismatch: requested "${identity.productId}", returned "${returnedId}".`;
    trace.selectedResultProductId = returnedId;
    trace.matchedProductId = false;
    trace.failureReasons.push(error);
    return { success: false, product: null, trace, error, productIdMismatch: true };
  }

  const images = extractImagesFromAliExpressHtml(html);
  if (images.length === 0) {
    const error = `Exact product-detail page for "${identity.productId}" contained no gallery images.`;
    trace.failureReasons.push(error);
    return { success: false, product: null, trace, error };
  }
  const title = parseTitle(html) || 'Imported Product';
  const ogUrl = metaContent(html, 'og:url');
  const canonicalSourceUrl = identity.sourceUrl;

  const product: ApifyProductData = {
    title,
    price: '0.00',
    originalPrice: '',
    discount: '',
    description: title,
    descriptionHtml: '',
    images,
    featuredImage: images[0] || null,
    variantImages: [],
    variants: [],
    specifications: [],
    rating: null,
    orders: null,
    seller: 'AliExpress Supplier',
    shipping: 'Tracked Shipping',
    url: canonicalSourceUrl,
    importKind: 'product-detail',
  };

  trace.actorUsed = 'exact-product-html';
  trace.apifyRunStatus = 'SUCCESS';
  trace.selectedResultProductId = identity.productId;
  trace.matchedProductId = true;
  trace.datasetItemCount = 1;
  trace.rawImageCount = images.length;
  trace.normalizedImageCount = images.length;
  trace.validImageCount = images.length;
  trace.diagnostics = {
    requestedProductId: identity.productId,
    matchedProductId: identity.productId,
    datasetItemCount: 1,
    datasetKeys: ['html', 'imagePathList', 'og:title', 'og:url'],
    rawGalleryCount: images.length,
    variantImageCount: 0,
    descriptionImageCount: 0,
    uniqueExtractedCount: images.length,
  };

  console.log(
    `[Exact Product Detail] REQUESTED_PRODUCT_ID=${identity.productId} RETURNED_PRODUCT_ID=${identity.productId} RESOLVED_PRODUCT_ID=${identity.resolvedProductId || identity.productId} ID_MATCH=true EXTRACTOR=exact-product-html RAW_GALLERY_COUNT=${images.length} FINAL_URL=${finalUrl} OG_URL=${ogUrl || 'n/a'}`
  );

  return {
    success: true,
    product,
    trace,
    exactDetail: {
      identity,
      product,
      extractor: 'exact-product-html',
      finalUrl,
      counts: {
        DETAIL_RAW_IMAGES_COUNT: images.length,
        EXTRACTED_IMAGES_COUNT: images.length,
        NORMALIZED_IMAGES_COUNT: images.length,
        VALID_IMAGES_COUNT: images.length,
        DEDUPED_IMAGES_COUNT: images.length,
      },
    },
  };
}
