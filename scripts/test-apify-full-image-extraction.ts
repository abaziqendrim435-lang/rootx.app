// ============================================================
// RootX — Upstream AliExpress Full Image Extraction Acceptance Test Suite
// Verifies product ID extraction & dataset matching, deep field image extraction,
// URL normalization & order-preserving deduplication, prevention of single-image
// fallbacks, and end-to-end counter parity (N = N = N = N = N = N).
// ============================================================

import {
  extractAliExpressProductId,
  matchDatasetItemByProductId,
  extractAllAliExpressProductImages,
  normalizeAliExpressImageUrl,
  fetchAliExpressProductViaApify,
} from '../lib/product-import/apify-aliexpress';
import { createProductImageLibrary } from '../lib/image-pipeline/library-builder';
import { buildStorefrontSpec } from '../lib/storefront-spec/builder';
import { runDesignEnginePipeline } from '../lib/design-engine/pipeline';
import type { WebsiteGeneration, WebsiteBuilderInput } from '../lib/website-builder-types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ACCEPTANCE FAIL: ${message}`);
    throw new Error(`Acceptance test failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

export async function runApifyFullImageExtractionAcceptanceTests() {
  console.log('\n================================================================================');
  console.log('  ROOTX UPSTREAM ALIEXPRESS FULL IMAGE EXTRACTION ACCEPTANCE TEST SUITE');
  console.log('================================================================================\n');

  // ── TEST 1: Product ID Extraction ─────────────────────────────────────────
  console.log('Test 1: AliExpress Product ID Extraction from Target URLs...');
  const testUrl1 = 'https://www.aliexpress.com/item/1005007891234567.html?spm=a2g0o.detail';
  const pid1 = extractAliExpressProductId(testUrl1);
  assert(pid1 === '1005007891234567', `Extracted product ID 1005007891234567 (got ${pid1})`);

  const testUrl2 = 'https://aliexpress.us/item/3256801234567890.html';
  const pid2 = extractAliExpressProductId(testUrl2);
  assert(pid2 === '3256801234567890', `Extracted US product ID 3256801234567890 (got ${pid2})`);

  // ── TEST 2: Product ID Dataset Matcher ────────────────────────────────────
  console.log('\nTest 2: Apify Dataset Item Product ID Matcher...');
  const requestedId = '1005007891234567';
  const mockDatasetItems = [
    {
      id: 'search_card_01',
      title: 'Related Search Product',
      images: ['https://ae01.alicdn.com/kf/search_thumb.jpg'],
    },
    {
      productId: '1005007891234567',
      title: 'Target Precision Keyboard RGB',
      productUrl: 'https://www.aliexpress.com/item/1005007891234567.html',
      images: [
        '//ae01.alicdn.com/kf/target_01.jpg_640x640.jpg',
        'https://ae01.alicdn.com/kf/target_02.jpg',
        'https://ae01.alicdn.com/kf/target_03.jpg',
      ],
      productSKUPropertyList: [
        {
          skuPropertyValues: [
            { skuPropertyImagePath: 'https://ae01.alicdn.com/kf/target_var01.jpg' },
            { skuPropertyImagePath: 'https://ae01.alicdn.com/kf/target_var02.jpg' },
          ],
        },
      ],
    },
    {
      itemId: '9999999999999999',
      title: 'Recommended Accessory',
      images: ['https://ae01.alicdn.com/kf/reco_01.jpg'],
    },
  ];

  const matchResult = matchDatasetItemByProductId(mockDatasetItems, requestedId);
  assert(matchResult.matched === true, 'Dataset matcher returned matched: true for exact product ID.');
  assert(matchResult.requestedProductId === requestedId, `Requested product ID matches: ${requestedId}`);
  assert(matchResult.selectedResultProductId === requestedId, `Selected result product ID matches: ${requestedId}`);
  assert(matchResult.datasetItemCount === 3, 'Dataset item count equals 3.');
  assert(matchResult.item.title === 'Target Precision Keyboard RGB', 'Selected the correct target product object instead of datasetItems[0].');

  // ── TEST 3: Deep Image Extraction across All Fields ───────────────────────
  console.log('\nTest 3: Canonical extractAllAliExpressProductImages Deep Field Traversal...');
  const mockRawAliExpressProduct = {
    productId: '1005007891234567',
    title: 'Wireless Mechanical Keyboard RGB',
    productMainImageUrl: 'https://ae01.alicdn.com/kf/main_01.jpg',
    images: [
      '//ae01.alicdn.com/kf/gallery_01.jpg_640x640.jpg',
      'https://ae01.alicdn.com/kf/gallery_02.jpg_Q90.jpg',
      'https://ae01.alicdn.com/kf/gallery_03.jpg',
    ],
    productSKUPropertyList: [
      {
        skuPropertyValues: [
          { skuPropertyImagePath: 'https://ae01.alicdn.com/kf/variant_black.jpg' },
          { skuPropertyImagePath: 'https://ae01.alicdn.com/kf/variant_white.jpg' },
        ],
      },
    ],
    descriptionHtml: `
      <div>
        <p>Product Details</p>
        <img src="https://ae01.alicdn.com/kf/desc_spec01.jpg" />
        <img src="https://ae01.alicdn.com/kf/desc_spec02.jpg" />
      </div>
    `,
  };

  const report = extractAllAliExpressProductImages(mockRawAliExpressProduct);
  console.log('  [Extraction Report]', JSON.stringify(report.stats, null, 2));

  assert(report.stats.rawCandidates >= 8, `Extracted ${report.stats.rawCandidates} raw candidates (expected >= 8).`);
  assert(report.stats.uniqueNormalizedCount === 8, `Unique normalized count is exactly 8 (got ${report.stats.uniqueNormalizedCount}).`);
  assert(report.stats.mainGalleryCount >= 3, `Main gallery count >= 3 (got ${report.stats.mainGalleryCount}).`);
  assert(report.stats.variantCount >= 2, `Variant image count >= 2 (got ${report.stats.variantCount}).`);
  assert(report.stats.descriptionCount >= 2, `Description image count >= 2 (got ${report.stats.descriptionCount}).`);

  // Verify first-seen position order preservation
  assert(report.images[0] === 'https://ae01.alicdn.com/kf/gallery_01.jpg', 'Image 1 normalized correctly and preserved position 0.');
  assert(report.images[1] === 'https://ae01.alicdn.com/kf/gallery_02.jpg', 'Image 2 normalized correctly and preserved position 1.');
  assert(report.images[2] === 'https://ae01.alicdn.com/kf/gallery_03.jpg', 'Image 3 preserved position 2.');
  assert(report.images[3] === 'https://ae01.alicdn.com/kf/main_01.jpg', 'Main image present in sequence.');

  // ── TEST 4: Zero Single-Image Fallback Verification ────────────────────────
  console.log('\nTest 4: Verification of Zero Single-Image Fallback Regressions...');
  assert(report.images.length > 1, `Extracted ${report.images.length} images; verified single-image truncation is eliminated.`);

  // ── TEST 5: End-to-End Image Counter Parity (N = N = N = N = N = N) ────────
  console.log('\nTest 5: End-to-End Image Counter Parity Verification (N = 8)...');
  const sourceN = report.images.length; // 8

  const sampleDataUris = report.images.map((url, idx) => `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==#img_${idx + 1}`);

  const mockGenInput: WebsiteGeneration = {
    homepage: { hero: { headline: 'Keyboard', subheadline: '', ctaButtons: [], backgroundStyle: 'dark' }, features: [], socialProof: '' },
    about: { title: '', content: '', mission: '', vision: '', values: [] },
    services: { title: '', subtitle: '', services: [] },
    pricing: { title: '', subtitle: '', plans: [] },
    faq: { title: '', subtitle: '', items: [] },
    testimonials: { title: '', subtitle: '', testimonials: [] },
    contact: { title: '', subtitle: '', formFields: [], email: '', phone: '', address: '' },
    footer: { copyright: '', columns: [], socialLinks: [], tagline: '' },
    seo: { title: 'Keyboard', metaDescription: '', keywords: [], ogTitle: '', ogDescription: '', ogImagePrompt: '', canonicalUrl: '', structuredData: '' },
    branding: { colorPalette: [], typography: { heading: 'Inter', body: 'Inter', accent: 'Inter', googleFontsUrl: '' }, iconSuggestions: [], logoDescription: '' },
    marketing: { googleAdsHeadlines: [], googleAdsDescriptions: [], facebookAdCopy: '', instagramCaption: '', linkedInPost: '', twitterPost: '', emailCampaign: { subject: '', preheader: '', body: '', cta: '' } },
    ecommerce: {
      price: '89.99',
      shippingText: 'Insured Delivery',
      images: sampleDataUris,
    },
  } as unknown as WebsiteGeneration;

  const mockBuilderInput: WebsiteBuilderInput = {
    businessName: 'KeebStore',
    businessType: 'Keyboards',
    targetAudience: 'Gamers',
    brandDescription: 'Custom keyboards',
    preferredStyle: 'modern_tech',
    primaryColor: '#3b82f6',
    secondaryColor: '#1d4ed8',
    language: 'en',
    country: 'US',
  };

  const lib = createProductImageLibrary(mockGenInput);
  const rawCount = lib.allValidImages.length;
  const acceptedCount = lib.allValidImages.filter((i) => i.isValid).length;

  const spec = buildStorefrontSpec(mockGenInput, mockBuilderInput, lib);
  const designEngineRes = runDesignEnginePipeline(mockGenInput, mockBuilderInput, lib, spec);

  const indexJsonFile = designEngineRes.files.find((f) => f.key === 'templates/index.json');
  assert(indexJsonFile !== undefined, 'Shopify templates/index.json generated.');

  const indexData = JSON.parse(indexJsonFile!.value);
  const galleryBlockOrder = indexData.sections['rootx-gallery']?.block_order || [];

  console.log(`  AliExpress gallery images = ${sourceN}`);
  console.log(`  RootX raw images         = ${rawCount}`);
  console.log(`  Accepted images          = ${acceptedCount}`);
  console.log(`  Persistent images        = ${lib.cachedImageCount ?? acceptedCount}`);
  console.log(`  Preview images           = ${lib.galleryCandidates.length}`);
  console.log(`  Shopify gallery images   = ${galleryBlockOrder.length}`);

  assert(
    sourceN === rawCount &&
    rawCount === acceptedCount &&
    acceptedCount === lib.galleryCandidates.length &&
    lib.galleryCandidates.length === galleryBlockOrder.length,
    `PARITY VERIFIED: AliExpress (${sourceN}) === Raw (${rawCount}) === Accepted (${acceptedCount}) === Preview (${lib.galleryCandidates.length}) === Shopify Gallery (${galleryBlockOrder.length}).`
  );

  console.log('\n================================================================================');
  console.log(' 🎉 ALL UPSTREAM ALIEXPRESS FULL IMAGE EXTRACTION TESTS PASSED!');
  console.log('================================================================================\n');
}

runApifyFullImageExtractionAcceptanceTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
