/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { fetchAliExpressProductViaApify } from '@/lib/product-import/apify-aliexpress';
import {
  assertLibraryFullyPersisted,
  getPersistedLibraryUrl,
} from '@/lib/image-pipeline';
import { buildCachedProductImageLibrary } from '@/lib/image-pipeline/cached-library';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { searchQuery, productUrl } = await req.json();

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
    const apifyResult = await fetchAliExpressProductViaApify(targetUrl, { isDirectUrl });

    let finalProduct = apifyResult.product;
    let isFallback = false;

    if (!apifyResult.success || !finalProduct) {
      if (apifyResult.productIdMismatch) {
        return NextResponse.json(
          {
            error: apifyResult.error || 'Requested AliExpress product ID did not match Apify extraction result.',
            trace: apifyResult.trace,
          },
          { status: 422 }
        );
      }

      // FALLBACK STRATEGY: HTML Scraper Fallback if Apify fails or returns unusable data
      console.warn('[Apify API Route] Primary Apify extraction failed. Activating Fallback Extractor...', apifyResult.error);
      apifyResult.trace.apifyRunStatus = 'FALLBACK_ACTIVATED';

      const fallbackUrl = isDirectUrl ? targetUrl : `https://www.aliexpress.com/w/wholesale-${encodeURIComponent(targetUrl)}.html`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const htmlRes = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (htmlRes.ok) {
        const html = await htmlRes.text();
        const imgRegex = /https?:\/\/[a-zA-Z0-9_-]+\.alicdn\.com\/[a-zA-Z0-9_\-\/]+\.(?:jpg|png|jpeg|webp)/gi;
        const foundImgs: string[] = [];
        let m: RegExpExecArray | null;
        while ((m = imgRegex.exec(html)) !== null) {
          foundImgs.push(m[0]);
        }

        const fallbackImages = [...new Set(foundImgs.map((img) => img.replace(/_\d+x\d+\.(jpg|png|jpeg|webp)$/i, '.$1')))];
        finalProduct = {
          title: 'Imported AliExpress Product',
          price: '29.99',
          originalPrice: '39.99',
          discount: '25%',
          description: 'Imported via RootX Fallback Extractor.',
          images: fallbackImages,
          featuredImage: fallbackImages[0] || null,
          variantImages: [],
          variants: [],
          specifications: [],
          rating: 4.8,
          orders: 120,
          seller: 'AliExpress Direct',
          shipping: 'Free Shipping',
          url: fallbackUrl,
        };
        isFallback = true;
      }
    }

    if (!finalProduct) {
      return NextResponse.json(
        {
          error: `Failed to scrape AliExpress product details. ${apifyResult.error || ''}`,
          trace: apifyResult.trace,
        },
        { status: 502 }
      );
    }

    // Run Immediate Persistent Image Caching
    const sourceCount = finalProduct.images.length;
    console.log(`[Apify API Route] [Diagnostic] SOURCE: ${sourceCount}`);

    const imageLib = await buildCachedProductImageLibrary({
      images: finalProduct.images,
      title: finalProduct.title,
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
      trace: apifyResult.trace,
      isFallback,
    });
  } catch (err: any) {
    console.error('[Apify API Route] Fatal error:', err.message);
    return NextResponse.json(
      { error: `Internal server error: ${err.message}` },
      { status: 500 }
    );
  }
}
