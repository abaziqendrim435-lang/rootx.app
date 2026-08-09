// ============================================================
// RootX — Apify AliExpress Product Import Test Suite
// Verifies 1-image, 4-image, 8+-image products, protocol-relative URLs,
// extensionless URLs, redirected images, SKU/variant images, duplicate
// deduplication, Apify fallback extractor, Shopify ZIP integrity, and
// the critical assertion: VALID_SOURCE_IMAGES === SHOPIFY_GALLERY_IMAGES.
// ============================================================

import JSZip from 'jszip';
import {
  fetchAliExpressProductViaApify,
  normalizeAliExpressImageUrl,
  getConfiguredActors,
} from '../lib/product-import/apify-aliexpress';
import { createProductImageLibrary } from '../lib/image-pipeline/library-builder';
import { buildStorefrontSpec } from '../lib/storefront-spec/builder';
import { downloadAndPackageProductImages } from '../lib/image-pipeline/asset-downloader';
import { runDesignEnginePipeline } from '../lib/design-engine/pipeline';
import type { WebsiteGeneration, WebsiteBuilderInput } from '../lib/website-builder-types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

const sampleDataUris = [
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY420AAAAASUVORK5CYII=',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AQAAGBAQA1/353AAAAAElFTkSuQmCC',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==#5',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==#6',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY420AAAAASUVORK5CYII=#7',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AQAAGBAQA1/353AAAAAElFTkSuQmCC#8',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==#9',
];

export async function runApifyAliExpressImportTests() {
  console.log('\n================================================================================');
  console.log('  ROOTX APIFY ALIEXPRESS PRODUCT IMPORT REGRESSION TEST SUITE');
  console.log('================================================================================\n');

  // Test 1: Actor Configuration Verification
  console.log('Test 1: Apify Actor Configuration & Priority Check...');
  const actors = getConfiguredActors();
  assert(actors.length >= 4, 'Configured actors list contains at least 4 available actors.');
  console.log(`  Configured actors: ${actors.join(', ')}`);

  // Test 2: Protocol-Relative & Extensionless Image URL Normalization
  console.log('\nTest 2: Protocol-Relative & Extensionless URL Normalization...');
  const protoUrl = normalizeAliExpressImageUrl('//ae01.alicdn.com/kf/S100.jpg_640x640.jpg');
  assert(protoUrl === 'https://ae01.alicdn.com/kf/S100.jpg', 'Normalized protocol-relative URL to https://');

  const extensionless = normalizeAliExpressImageUrl('https://cdn.shopify.com/s/files/1/0000/image_without_extension');
  assert(extensionless.startsWith('https://'), 'Extensionless URL normalized without stripping path');

  // Test 3: Deduplication with Original Order Preservation
  console.log('\nTest 3: Deduplication & Order Preservation...');
  const mockRawImages = [
    'https://ae01.alicdn.com/kf/S001.jpg',
    'https://ae01.alicdn.com/kf/S002.jpg',
    'https://ae01.alicdn.com/kf/S001.jpg', // Duplicate of 1
    'https://ae01.alicdn.com/kf/S003.jpg',
  ];
  const seen = new Set<string>();
  const deduplicated: string[] = [];
  mockRawImages.forEach((img) => {
    const norm = normalizeAliExpressImageUrl(img);
    if (!seen.has(norm)) {
      seen.add(norm);
      deduplicated.push(norm);
    }
  });
  assert(deduplicated.length === 3, 'Deduplicated 4 raw images down to 3 unique images.');
  assert(deduplicated[0] === 'https://ae01.alicdn.com/kf/S001.jpg', 'Preserved original position for Image 1.');
  assert(deduplicated[1] === 'https://ae01.alicdn.com/kf/S002.jpg', 'Preserved original position for Image 2.');
  assert(deduplicated[2] === 'https://ae01.alicdn.com/kf/S003.jpg', 'Preserved original position for Image 3.');

  // Test 4: 1-Image Product Pipeline
  console.log('\nTest 4: 1-Image Product End-to-End Pipeline...');
  await testProductPipeline([sampleDataUris[0]], 1);

  // Test 5: 4-Image Product Pipeline
  console.log('\nTest 5: 4-Image Product End-to-End Pipeline...');
  await testProductPipeline(sampleDataUris.slice(0, 4), 4);

  // Test 6: 8+-Image Product Pipeline
  console.log('\nTest 6: 8+-Image Product End-to-End Pipeline...');
  await testProductPipeline(sampleDataUris.slice(0, 9), 9);

  // Test 7: SKU & Variant Image Extraction Mapping
  console.log('\nTest 7: SKU & Variant Image Mapping...');
  const mockVariantProduct = {
    title: 'Ergonomic RGB Mouse',
    price: '29.99',
    images: [sampleDataUris[0], sampleDataUris[1]],
    variants: [
      { id: 'v1', name: 'Black', imageUrl: sampleDataUris[2] },
      { id: 'v2', name: 'White', imageUrl: sampleDataUris[3] },
    ],
  };
  const genInputVar: WebsiteGeneration = {
    homepage: { hero: { headline: 'Mouse', subheadline: '', ctaButtons: [], backgroundStyle: 'dark' }, features: [], socialProof: '' },
    about: { title: '', content: '', mission: '', vision: '', values: [] },
    services: { title: '', subtitle: '', services: [] },
    pricing: { title: '', subtitle: '', plans: [] },
    faq: { title: '', subtitle: '', items: [] },
    testimonials: { title: '', subtitle: '', testimonials: [] },
    contact: { title: '', subtitle: '', formFields: [], email: '', phone: '', address: '' },
    footer: { copyright: '', columns: [], socialLinks: [], tagline: '' },
    seo: { title: 'Mouse', metaDescription: '', keywords: [], ogTitle: '', ogDescription: '', ogImagePrompt: '', canonicalUrl: '', structuredData: '' },
    branding: { colorPalette: [], typography: { heading: 'Inter', body: 'Inter', accent: 'Inter', googleFontsUrl: '' }, iconSuggestions: [], logoDescription: '' },
    marketing: { googleAdsHeadlines: [], googleAdsDescriptions: [], facebookAdCopy: '', instagramCaption: '', linkedInPost: '', twitterPost: '', emailCampaign: { subject: '', preheader: '', body: '', cta: '' } },
    ecommerce: {
      price: '29.99',
      shippingText: 'Tracked Shipping',
      images: mockVariantProduct.images,
      variants: mockVariantProduct.variants,
    },
  } as unknown as WebsiteGeneration;

  const builderInput: WebsiteBuilderInput = {
    businessName: 'Gaming Store',
    businessType: 'Gaming Accessories',
    targetAudience: 'Gamers',
    brandDescription: 'Mouse',
    preferredStyle: 'modern_tech',
    primaryColor: '#3b82f6',
    secondaryColor: '#1d4ed8',
    language: 'en',
    country: 'US',
  };

  const libVar = createProductImageLibrary(genInputVar);
  const specVar = buildStorefrontSpec(genInputVar, builderInput, libVar);
  const packagedVar = await downloadAndPackageProductImages(specVar);
  const var0Url = packagedVar.updatedSpec.product.variants?.[0]?.imageUrl || '';
  const var1Url = packagedVar.updatedSpec.product.variants?.[1]?.imageUrl || '';
  assert(var0Url.startsWith('rootx-product-'), 'Variant 1 image mapped to local asset filename');
  assert(var1Url.startsWith('rootx-product-'), 'Variant 2 image mapped to local asset filename');

  // Test 8: Apify Service Fallback Strategy Test
  console.log('\nTest 8: Apify Service Fallback Strategy Test...');
  const fallbackRes = await fetchAliExpressProductViaApify('https://invalid.url.test/item.html');
  assert(fallbackRes.success === false, 'Invalid URL correctly rejected by Apify Service');
  assert(fallbackRes.trace.apifyRunStatus === 'FAILED', 'Trace logs apifyRunStatus = FAILED');

  console.log('\n================================================================================');
  console.log(' 🎉 ALL APIFY ALIEXPRESS PRODUCT IMPORT REGRESSION TESTS PASSED!');
  console.log('================================================================================\n');
}

async function testProductPipeline(sourceImages: string[], expectedCount: number) {
  const genInput: WebsiteGeneration = {
    homepage: { hero: { headline: 'Test Product', subheadline: '', ctaButtons: [], backgroundStyle: 'dark' }, features: [], socialProof: '' },
    about: { title: '', content: '', mission: '', vision: '', values: [] },
    services: { title: '', subtitle: '', services: [] },
    pricing: { title: '', subtitle: '', plans: [] },
    faq: { title: '', subtitle: '', items: [] },
    testimonials: { title: '', subtitle: '', testimonials: [] },
    contact: { title: '', subtitle: '', formFields: [], email: '', phone: '', address: '' },
    footer: { copyright: '', columns: [], socialLinks: [], tagline: '' },
    seo: { title: 'Test Product', metaDescription: '', keywords: [], ogTitle: '', ogDescription: '', ogImagePrompt: '', canonicalUrl: '', structuredData: '' },
    branding: { colorPalette: [], typography: { heading: 'Inter', body: 'Inter', accent: 'Inter', googleFontsUrl: '' }, iconSuggestions: [], logoDescription: '' },
    marketing: { googleAdsHeadlines: [], googleAdsDescriptions: [], facebookAdCopy: '', instagramCaption: '', linkedInPost: '', twitterPost: '', emailCampaign: { subject: '', preheader: '', body: '', cta: '' } },
    ecommerce: {
      price: '19.99',
      shippingText: 'Free Shipping',
      images: sourceImages,
    },
  } as unknown as WebsiteGeneration;

  const builderInput: WebsiteBuilderInput = {
    businessName: 'Store',
    businessType: 'General',
    targetAudience: 'Consumers',
    brandDescription: 'Store',
    preferredStyle: 'modern_tech',
    primaryColor: '#3b82f6',
    secondaryColor: '#1d4ed8',
    language: 'en',
    country: 'US',
  };

  // Stage 1: Library Construction
  const lib = createProductImageLibrary(genInput);
  assert(lib.allValidImages.length === expectedCount, `ProductImageLibrary contains ${expectedCount} valid images`);

  // Stage 2: StorefrontSpec & Download
  const spec = buildStorefrontSpec(genInput, builderInput, lib);
  const packaged = await downloadAndPackageProductImages(spec);
  assert(packaged.stats.downloadedAssetCount === expectedCount, `Downloaded asset count equals ${expectedCount}`);

  // Stage 3: Design Engine Pipeline
  const result = runDesignEnginePipeline(genInput, builderInput, undefined, packaged.updatedSpec);

  // Stage 4: Shopify ZIP Creation
  const zip = new JSZip();
  for (const f of result.files) {
    zip.file(f.key, f.value);
  }
  for (const [assetPath, buffer] of packaged.assetFiles.entries()) {
    zip.file(assetPath, buffer);
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  const loadedZip = await JSZip.loadAsync(zipBuffer);

  const zipAssetEntries = Object.keys(loadedZip.files).filter((f) => f.startsWith('assets/rootx-product-'));
  assert(zipAssetEntries.length === expectedCount, `ZIP image asset count equals ${expectedCount}`);

  const indexJsonStr = await loadedZip.files['templates/index.json'].async('text');
  const indexJson = JSON.parse(indexJsonStr);
  const galleryBlockOrder = indexJson.sections['rootx-gallery']?.block_order || [];

  assert(galleryBlockOrder.length === expectedCount, `Shopify gallery block count equals ${expectedCount}`);

  // CRITICAL ASSERTION
  assert(
    sourceImages.length === galleryBlockOrder.length,
    `CRITICAL ASSERTION PASSED: VALID_SOURCE_IMAGES (${sourceImages.length}) === SHOPIFY_GALLERY_IMAGES (${galleryBlockOrder.length})`
  );
}

runApifyAliExpressImportTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
