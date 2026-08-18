/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import {
  extractAliExpressProductId,
  fetchAliExpressProductViaApify,
  fetchAliExpressSearchViaApify,
} from '@/lib/product-import/apify-aliexpress';
import {
  assertLibraryFullyPersisted,
  getPersistedLibraryUrl,
} from '@/lib/image-pipeline';
import { buildCachedProductImageLibrary } from '@/lib/image-pipeline/cached-library';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { searchQuery, productUrl, selectedProductId, selectionSessionId } = await req.json();

    let targetUrl = '';
    let isDirectUrl = false;

    if (productUrl) {
      const urlStr = String(productUrl).trim();
      if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
        return NextResponse.json(
          { error: 'Product URL must start with http:// or https://' },
          { status: 400 }
        );
      }
      targetUrl = urlStr;
      isDirectUrl = true;
    } else if (searchQuery) {
      const query = String(searchQuery).trim();
      if (!query) {
        return NextResponse.json(
          { error: 'Search query cannot be empty.' },
          { status: 400 }
        );
      }
      targetUrl = query;
      isDirectUrl = false;
    } else {
      return NextResponse.json(
        { error: 'Either searchQuery or productUrl must be provided.' },
        { status: 400 }
      );
    }

    // Call server-side Apify Service
    if (!isDirectUrl) {
      const searchResult = await fetchAliExpressSearchViaApify(targetUrl);
      if (!searchResult.success || searchResult.products.length === 0) {
        return NextResponse.json(
          {
            error: searchResult.error || 'Apify search returned no valid product cards.',
            trace: searchResult.trace,
          },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        products: searchResult.products,
        trace: searchResult.trace,
      });
    }

    const apifyResult = await fetchAliExpressProductViaApify(targetUrl, { isDirectUrl });
    const requestedProductId = extractAliExpressProductId(targetUrl);

    // Product-detail hydration is always anchored to the selection made from a
    // search card. A URL without that frozen ID cannot enter the canonical
    // gallery pipeline because there is no identity to verify it against.
    if (!selectedProductId || !requestedProductId) {
      return NextResponse.json(
        {
          error: 'EXACT_PRODUCT_DETAIL_HYDRATION_FAILED: AliExpress product-detail hydration requires selectedProductId and an exact item URL.',
          trace: apifyResult.trace,
        },
        { status: 422 }
      );
    }

    if (selectedProductId && requestedProductId && selectedProductId !== requestedProductId) {
      return NextResponse.json(
        {
          error: `Product ID mismatch: selected "${selectedProductId}", URL is "${requestedProductId}".`,
          trace: apifyResult.trace,
        },
        { status: 422 }
      );
    }

    if (
      !apifyResult.success ||
      !apifyResult.product ||
      apifyResult.productIdMismatch ||
      !requestedProductId ||
      !apifyResult.trace.matchedProductId ||
      apifyResult.trace.selectedResultProductId !== selectedProductId
    ) {
      return NextResponse.json(
        {
          error:
            apifyResult.error ||
            `Requested AliExpress product ID "${requestedProductId}" did not match product-detail extraction.`,
          trace: apifyResult.trace,
        },
        { status: 422 }
      );
    }

    const finalProduct = apifyResult.product;

    // Run Immediate Persistent Image Caching
    const sourceCount = finalProduct.images.length;
    console.log(`[Apify API Route] [Diagnostic] SOURCE: ${sourceCount}`);

    const imageLib = await buildCachedProductImageLibrary({
      images: finalProduct.images,
      title: finalProduct.title,
      productId: selectedProductId,
      sourceUrl: targetUrl,
      selectionSessionId,
    });
    const extractedCount = imageLib.validUniqueCount || imageLib.originalSourceCount;
    const persistedCount = imageLib.cachedImageCount || 0;
    const cachedUrls = imageLib.allValidImages.map((img) => getPersistedLibraryUrl(img)).filter(Boolean);

    console.log(`[Apify API Route] [Diagnostic] EXTRACTED: ${extractedCount}`);
    console.log(`[Apify API Route] [Diagnostic] PERSISTED: ${persistedCount}`);

    apifyResult.trace.downloadedImageCount = persistedCount;
    apifyResult.trace.zipImageCount = persistedCount;
    apifyResult.trace.shopifyGalleryCount = persistedCount;
    if (apifyResult.trace.diagnostics) {
      apifyResult.trace.diagnostics.rawImagesCount = extractedCount;
      apifyResult.trace.diagnostics.acceptedImagesCount = extractedCount;
      apifyResult.trace.diagnostics.persistedImagesCount = persistedCount;
    }

    try {
      assertLibraryFullyPersisted(imageLib, sourceCount);
    } catch (persistErr) {
      const message = persistErr instanceof Error ? persistErr.message : String(persistErr);
      console.error('[Apify API Route] STOP RULE ENGAGED:', message);
      return NextResponse.json(
        {
          error: message,
          trace: apifyResult.trace,
          details: {
            SOURCE: sourceCount,
            EXTRACTED: extractedCount,
            PERSISTED: persistedCount,
            failed: imageLib.rejectedImages,
          },
        },
        { status: 422 }
      );
    }

    const cachedProduct = {
      ...finalProduct,
      images: cachedUrls,
      featuredImage: cachedUrls[0] || null,
      imageLibrary: imageLib,
      importKind: 'product-detail' as const,
    };

    console.log(`[Apify API Route] [Diagnostic] SEARCH_IMAGE_COUNT: ${cachedUrls.length}`);
    console.log(`[Apify API Route] [Diagnostic] PRODUCT_DETAIL_IMAGE_COUNT: ${cachedUrls.length}`);
    console.log(`[Apify API Route] [Diagnostic] APIFY_RAW_IMAGE_COUNT: ${apifyResult.trace.rawImageCount}`);
    console.log(`[Apify API Route] [Diagnostic] NORMALIZED_IMAGE_COUNT: ${apifyResult.trace.normalizedImageCount}`);
    console.log(`[Apify API Route] [Diagnostic] CACHE_WRITE_IMAGE_COUNT: ${cachedUrls.length}`);
    console.log(`[Apify API Route] [Diagnostic] API_RESPONSE_IMAGE_COUNT: ${cachedUrls.length}`);

    return NextResponse.json({
      success: true,
      products: [cachedProduct],
      identity: {
        productId: requestedProductId,
        sourceUrl: targetUrl,
        selectionSessionId: selectionSessionId || null,
      },
      trace: apifyResult.trace,
    });
  } catch (err: any) {
    console.error('[Apify API Route] Fatal error:', err.message);
    return NextResponse.json(
      { error: `Internal server error: ${err.message}` },
      { status: 500 }
    );
  }
}
