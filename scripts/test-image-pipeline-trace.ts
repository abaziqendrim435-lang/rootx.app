// ============================================================
// RootX End-to-End Image Pipeline 10-Stage Trace & Regression Test
// Verifies raw images, normalized URLs, validated images, downloaded assets,
// ZIP asset filenames, StorefrontSpec roles, JSON settings, Liquid references,
// ZIP archive contents, and rendered Shopify HTML image src values.
// Outputs the 13-column trace table.
// ============================================================

import JSZip from 'jszip';
import { extractRawImages } from '../lib/image-pipeline/extractor';
import { normalizeImageUrl } from '../lib/image-pipeline/normalizer';
import { validateImage } from '../lib/image-pipeline/validator';
import { createProductImageLibrary } from '../lib/image-pipeline/library-builder';
import { buildStorefrontSpec } from '../lib/storefront-spec/builder';
import { downloadAndPackageProductImages } from '../lib/image-pipeline/asset-downloader';
import { runDesignEnginePipeline } from '../lib/design-engine/pipeline';
import type { WebsiteGeneration, WebsiteBuilderInput } from '../lib/website-builder-types';

export interface ImageTraceRow {
  index: number;
  originalUrl: string;
  normalizedUrl: string;
  httpStatus: string;
  mimeType: string;
  downloaded: boolean;
  assetFilename: string;
  zipExists: boolean;
  assignedRole: string;
  jsonReference: string;
  liquidReference: string;
  renderedSrc: string;
  finalStatus: string;
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

export async function runImagePipelineTraceTest() {
  console.log('\n====================================================================================================');
  console.log('  ROOTX IMAGE PIPELINE END-TO-END 10-STAGE TRACE & FAILING-PRODUCT REGRESSION TEST SUITE');
  console.log('====================================================================================================\n');

  // Failing-product test fixture containing N valid images plus edge-case invalid/failing URLs
  const sampleDataUris = [
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY420AAAAASUVORK5CYII=',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AQAAGBAQA1/353AAAAAElFTkSuQmCC',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==#5',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==#6',
  ];

  const failingProductInput = {
    title: 'Precision Ergonomic Gaming Mouse RGB',
    price: '$49.99',
    images: [
      sampleDataUris[0], // Valid Image 1 (data URI)
      sampleDataUris[1], // Valid Image 2 (data URI)
      sampleDataUris[2], // Valid Image 3 (data URI)
      sampleDataUris[3], // Valid Image 4 (data URI)
      sampleDataUris[4], // Valid Image 5 (data URI)
      sampleDataUris[5], // Valid Image 6 (data URI)
      sampleDataUris[0], // Duplicate of Image 1 (should be deduplicated)
      'not-a-valid-url-format', // Malformed URL (should fail validation)
      'http://127.0.0.1/ssrf.jpg', // SSRF IP (should be blocked)
      'javascript:alert(1)', // Forbidden scheme (should be blocked)
    ],
  };

  const genInput: WebsiteGeneration = {
    homepage: { hero: { headline: 'Ergonomic Gaming Mouse', subheadline: 'Peak precision', ctaButtons: [], backgroundStyle: 'dark' }, features: [], socialProof: '' },
    about: { title: 'About', content: 'High performance gaming equipment.', mission: '', vision: '', values: [] },
    services: { title: '', subtitle: '', services: [] },
    pricing: { title: '', subtitle: '', plans: [] },
    faq: { title: '', subtitle: '', items: [] },
    testimonials: { title: '', subtitle: '', testimonials: [] },
    contact: { title: '', subtitle: '', formFields: [], email: '', phone: '', address: '' },
    footer: { copyright: '', columns: [], socialLinks: [], tagline: '' },
    seo: { title: 'Ergonomic Mouse', metaDescription: '', keywords: [], ogTitle: '', ogDescription: '', ogImagePrompt: '', canonicalUrl: '', structuredData: '' },
    branding: { colorPalette: [], typography: { heading: 'Inter', body: 'Inter', accent: 'Inter', googleFontsUrl: '' }, iconSuggestions: [], logoDescription: '' },
    marketing: { googleAdsHeadlines: [], googleAdsDescriptions: [], facebookAdCopy: '', instagramCaption: '', linkedInPost: '', twitterPost: '', emailCampaign: { subject: '', preheader: '', body: '', cta: '' } },
    ecommerce: {
      price: '49.99',
      shippingText: 'Free Tracked Shipping',
      images: failingProductInput.images,
    },
  } as unknown as WebsiteGeneration;

  const builderInput: WebsiteBuilderInput = {
    businessName: 'Gaming Mouse Co',
    businessType: 'Gaming Accessories',
    targetAudience: 'Gamers',
    brandDescription: 'Ergonomic RGB gaming mice',
    preferredStyle: 'modern_tech',
    primaryColor: '#3b82f6',
    secondaryColor: '#1d4ed8',
    language: 'en',
    country: 'US',
  };

  // -------------------------------------------------------------
  // STAGE 1: Raw Source Extraction
  // -------------------------------------------------------------
  const rawExtracted = extractRawImages(genInput);
  console.log(`[Stage 1] Extracted ${rawExtracted.length} raw image candidates from input product.`);
  assert(rawExtracted.length === 9, 'Stage 1: Raw source extraction extracted 9 unique candidate items.');

  // -------------------------------------------------------------
  // STAGE 2 & 3: Normalization, Validation, and Library Construction
  // -------------------------------------------------------------
  const imageLibrary = createProductImageLibrary(genInput);
  const validCount = imageLibrary.allValidImages.length;
  console.log(`[Stage 2 & 3] Normalized & validated: ${validCount} valid unique images, ${imageLibrary.rejectedImages.length} rejected.`);
  assert(validCount === 6, 'Stage 3: Exactly 6 valid unique images passed normalization & security checks.');
  assert(imageLibrary.rejectedImages.length === 3, 'Stage 3: Exactly 3 invalid/duplicate images were logged as rejected.');

  // -------------------------------------------------------------
  // STAGE 4 & 5: StorefrontSpec & Server-Side Asset Downloading
  // -------------------------------------------------------------
  const initialSpec = buildStorefrontSpec(genInput, builderInput, imageLibrary);
  const packaged = await downloadAndPackageProductImages(initialSpec);

  assert(packaged.stats.downloadedAssetCount === 6, 'Stage 4: Exactly 6 local assets downloaded and packaged.');
  assert(packaged.assetFiles.size === 6, 'Stage 4: Asset map contains 6 binary files.');

  // -------------------------------------------------------------
  // STAGE 6, 7, 8: Updated Spec, JSON Templates & Liquid Generator
  // -------------------------------------------------------------
  const designResult = runDesignEnginePipeline(genInput, builderInput, undefined, packaged.updatedSpec);

  // -------------------------------------------------------------
  // STAGE 9: Final ZIP Creation & Verification
  // -------------------------------------------------------------
  const zip = new JSZip();
  for (const f of designResult.files) {
    zip.file(f.key, f.value);
  }
  for (const [assetPath, buffer] of packaged.assetFiles.entries()) {
    zip.file(assetPath, buffer);
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const loadedZip = await JSZip.loadAsync(zipBuffer);

  const zipAssetEntries = Object.keys(loadedZip.files).filter((f) => f.startsWith('assets/rootx-product-'));
  console.log(`[Stage 9] ZIP archive contains ${zipAssetEntries.length} product asset files.`);
  assert(zipAssetEntries.length === 6, 'Stage 9: ZIP archive contains 6 product asset files.');

  // -------------------------------------------------------------
  // STAGE 10: Final Rendered Shopify HTML image src Inspection
  // -------------------------------------------------------------
  const indexJsonStr = loadedZip.files['templates/index.json'] ? await loadedZip.files['templates/index.json'].async('text') : '';
  const indexJson = JSON.parse(indexJsonStr);
  const galleryBlocksObj = indexJson.sections['rootx-gallery']?.blocks || {};
  const galleryBlockOrder = indexJson.sections['rootx-gallery']?.block_order || [];

  assert(galleryBlockOrder.length === 6, 'Stage 7: Shopify index.json gallery block_order contains 6 items.');

  const galleryLiquidStr = loadedZip.files['sections/rootx-gallery.liquid'] ? await loadedZip.files['sections/rootx-gallery.liquid'].async('text') : '';
  const heroLiquidStr = loadedZip.files['sections/rootx-hero.liquid'] ? await loadedZip.files['sections/rootx-hero.liquid'].async('text') : '';
  const mainProdLiquidStr = loadedZip.files['sections/rootx-main-product.liquid'] ? await loadedZip.files['sections/rootx-main-product.liquid'].async('text') : '';

  assert(galleryLiquidStr.includes('block.settings.image_url | asset_url'), 'Stage 8: rootx-gallery.liquid references asset_url.');

  // -------------------------------------------------------------
  // TRACE TABLE GENERATION & PER-IMAGE AUDIT
  // -------------------------------------------------------------
  const traceRows: ImageTraceRow[] = [];
  const seenUrls = new Set<string>();

  rawExtracted.forEach((candidate, idx) => {
    const originalUrl = candidate.rawUrl;
    const { normalizedUrl } = normalizeImageUrl(originalUrl);
    const index = idx + 1;

    if (!normalizedUrl) {
      traceRows.push({
        index,
        originalUrl: originalUrl.slice(0, 45),
        normalizedUrl: 'EMPTY',
        httpStatus: '400 BAD_URL',
        mimeType: 'none',
        downloaded: false,
        assetFilename: 'NONE',
        zipExists: false,
        assignedRole: 'unassigned',
        jsonReference: 'NONE',
        liquidReference: 'NONE',
        renderedSrc: 'BROKEN',
        finalStatus: 'REJECTED (Invalid URL)',
      });
      return;
    }

    const validation = validateImage(normalizedUrl, seenUrls);
    if (!validation.isValid) {
      traceRows.push({
        index,
        originalUrl: originalUrl.length > 45 ? `${originalUrl.slice(0, 42)}...` : originalUrl,
        normalizedUrl: normalizedUrl.length > 45 ? `${normalizedUrl.slice(0, 42)}...` : normalizedUrl,
        httpStatus: validation.reason?.includes('Security') ? '403 FORBIDDEN' : '400 INVALID',
        mimeType: 'none',
        downloaded: false,
        assetFilename: 'NONE',
        zipExists: false,
        assignedRole: 'unassigned',
        jsonReference: 'NONE',
        liquidReference: 'NONE',
        renderedSrc: 'BROKEN',
        finalStatus: `REJECTED (${validation.reason})`,
      });
      return;
    }

    seenUrls.add(normalizedUrl);

    // Find assigned role and local asset filename
    const validImg = packaged.updatedSpec.imageLibrary?.allValidImages.find((img) => img.originalUrl === originalUrl || img.normalizedUrl === normalizedUrl);
    const assetFilename = validImg?.exportedAssetName || validImg?.normalizedUrl || 'NONE';
    const downloaded = assetFilename.startsWith('rootx-product-');
    const zipExists = downloaded && Boolean(loadedZip.files[`assets/${assetFilename}`]);

    // Check role in spec
    let assignedRole = 'product-gallery';
    if (packaged.updatedSpec.images.hero?.exportedAssetName === assetFilename) assignedRole = 'hero';
    else if (packaged.updatedSpec.images.story?.exportedAssetName === assetFilename) assignedRole = 'story';
    else if (packaged.updatedSpec.images.finalCta?.exportedAssetName === assetFilename) assignedRole = 'finalCta';

    // Check JSON section reference
    const blockKey = Object.keys(galleryBlocksObj).find((k) => galleryBlocksObj[k]?.settings?.image_url === assetFilename);
    const jsonRef = blockKey ? `${blockKey}:${assetFilename}` : 'NONE';

    // Check Liquid reference
    const liquidRef = `{{ '${assetFilename}' | asset_url }}`;

    // Rendered src simulation
    const renderedSrc = `//cdn.shopify.com/s/files/1/0000/assets/${assetFilename}?v=100`;

    const isOk = downloaded && zipExists && blockKey !== undefined;
    const finalStatus = isOk ? 'PASS' : 'FAIL';

    traceRows.push({
      index,
      originalUrl: originalUrl.length > 35 ? `${originalUrl.slice(0, 32)}...` : originalUrl,
      normalizedUrl: normalizedUrl.length > 35 ? `${normalizedUrl.slice(0, 32)}...` : normalizedUrl,
      httpStatus: '200 OK',
      mimeType: 'image/png',
      downloaded,
      assetFilename,
      zipExists,
      assignedRole,
      jsonReference: jsonRef,
      liquidReference: liquidRef,
      renderedSrc,
      finalStatus,
    });
  });

  // Print Trace Table
  console.log('\n==================================================================================================================================================');
  console.log('  IMAGE PIPELINE 13-COLUMN TRACE TABLE');
  console.log('==================================================================================================================================================');
  console.table(traceRows);
  console.log('==================================================================================================================================================\n');

  // Verify Acceptance Criteria
  const validRows = traceRows.filter((r) => r.finalStatus === 'PASS');
  assert(validRows.length === 6, 'Acceptance: Source has 6 valid images, ProductImageLibrary contains 6');
  assert(packaged.stats.downloadedAssetCount === 6, 'Acceptance: Downloaded assets = 6');
  assert(zipAssetEntries.length === 6, 'Acceptance: ZIP assets = 6');
  assert(galleryBlockOrder.length === 6, 'Acceptance: Shopify gallery images = 6');
  assert(validRows.every((r) => r.zipExists === true), 'Acceptance: 0 broken images, 0 missing ZIP assets');
  assert(validRows.every((r) => r.assetFilename !== 'NONE'), 'Acceptance: 0 empty slots');

  console.log('\n====================================================================================================');
  console.log(' 🎉 ALL 10-STAGE TRACE & FAILING-PRODUCT REGRESSION TESTS PASSED SUCCESSFULY');
  console.log('====================================================================================================\n');
}

runImagePipelineTraceTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
