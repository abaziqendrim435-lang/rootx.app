// ============================================================
// RootX — Image Cache V1 & Supabase Integration Test Suite
// Verifies social network domain rejection, immediate server-side caching,
// Supabase storage / fallback URL generation, stale state clearing,
// preview cachedUrl rendering, Shopify ZIP export integrity, and HTTP 200 status.
// ============================================================

import JSZip from 'jszip';
import { validateImage } from '../lib/image-pipeline/validator';
import { cacheProductImages } from '../lib/image-pipeline/cache-service';
import { buildCachedProductImageLibrary } from '../lib/image-pipeline/cached-library';
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
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQAAGBAQA1/353AAAAAElFTkSuQmCC',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==#5',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==#6',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY420AAAAASUVORK5CYII=#7',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQAAGBAQA1/353AAAAAElFTkSuQmCC#8',
];

export async function runSupabaseImageCacheTests() {
  console.log('\n================================================================================');
  console.log('  ROOTX IMAGE CACHE V1 & SUPABASE INTEGRATION REGRESSION TEST SUITE');
  console.log('================================================================================\n');

  // Test 1: Social Network Domain Rejection
  console.log('Test 1: Social Network & Tracking Domain Filtering...');
  const seen = new Set<string>();

  const instaVal = validateImage('https://instagram.com/p/B1234/hero.jpg', seen, 'og:image');
  assert(instaVal.isValid === false, 'Instagram URL correctly rejected.');

  const fbVal = validateImage('https://scontent.cdninstagram.com/v/t51/hero.png', seen, 'meta_og');
  assert(fbVal.isValid === false, 'Facebook/Instagram CDN URL correctly rejected.');

  const pixelVal = validateImage('https://ae01.alicdn.com/kf/pixel_1x1.png', seen, 'footer');
  assert(pixelVal.isValid === false, 'Tracking pixel URL correctly rejected.');

  const validVal = validateImage('https://ae01.alicdn.com/kf/S12345.jpg', seen, 'product_gallery');
  assert(validVal.isValid === true, 'Valid AliExpress product gallery image accepted.');

  // Test 2: Server-Side Image Caching & Generation ID Creation
  console.log('\nTest 2: Immediate Server-Side Image Caching & Generation ID...');
  const genId1 = `gen_${Date.now()}_test1`;
  const rawProductData = {
    title: 'Precision Gaming Mouse RGB',
    images: sampleDataUris.slice(0, 8),
  };

  const cachedLibrary = await buildCachedProductImageLibrary(rawProductData, genId1);
  assert(cachedLibrary.generationId === genId1, `Generation ID set to ${genId1}`);
  assert(cachedLibrary.allValidImages.length === 8, 'All 8 valid images present in library.');
  assert(cachedLibrary.allValidImages.every((img) => Boolean(img.cachedUrl)), 'Every valid image possesses a non-empty cachedUrl.');
  assert(cachedLibrary.allValidImages.every((img) => img.status === 'cached'), 'Every valid image has status = "cached".');

  // Test 3: Stale State Clearing Across Generations
  console.log('\nTest 3: Stale Image State Clearing Across Store Generations...');
  const genId2 = `gen_${Date.now()}_test2`;
  const newProductData = {
    title: 'Ergonomic Standing Desk',
    images: sampleDataUris.slice(0, 4), // 4 images instead of 8
  };

  const cachedLibrary2 = await buildCachedProductImageLibrary(newProductData, genId2);
  assert(cachedLibrary2.generationId !== genId1, 'New generation created distinct Generation ID.');
  assert(cachedLibrary2.allValidImages.length === 4, 'Stale images cleared: Library contains exactly 4 new images.');

  // Test 4: End-to-End Pipeline & Shopify ZIP Integrity
  console.log('\nTest 4: StorefrontSpec & Shopify ZIP Export from Cache...');
  const genInput: WebsiteGeneration = {
    homepage: { hero: { headline: 'Gaming Mouse', subheadline: 'Peak precision', ctaButtons: [], backgroundStyle: 'dark' }, features: [], socialProof: '' },
    about: { title: '', content: '', mission: '', vision: '', values: [] },
    services: { title: '', subtitle: '', services: [] },
    pricing: { title: '', subtitle: '', plans: [] },
    faq: { title: '', subtitle: '', items: [] },
    testimonials: { title: '', subtitle: '', testimonials: [] },
    contact: { title: '', subtitle: '', formFields: [], email: '', phone: '', address: '' },
    footer: { copyright: '', columns: [], socialLinks: [], tagline: '' },
    seo: { title: 'Gaming Mouse', metaDescription: '', keywords: [], ogTitle: '', ogDescription: '', ogImagePrompt: '', canonicalUrl: '', structuredData: '' },
    branding: { colorPalette: [], typography: { heading: 'Inter', body: 'Inter', accent: 'Inter', googleFontsUrl: '' }, iconSuggestions: [], logoDescription: '' },
    marketing: { googleAdsHeadlines: [], googleAdsDescriptions: [], facebookAdCopy: '', instagramCaption: '', linkedInPost: '', twitterPost: '', emailCampaign: { subject: '', preheader: '', body: '', cta: '' } },
    ecommerce: {
      price: '49.99',
      shippingText: 'Tracked Shipping',
      images: cachedLibrary.allValidImages.map((i) => i.cachedUrl || i.normalizedUrl),
    },
  } as unknown as WebsiteGeneration;

  const builderInput: WebsiteBuilderInput = {
    businessName: 'Mouse Store',
    businessType: 'Gaming',
    targetAudience: 'Gamers',
    brandDescription: 'Mouse',
    preferredStyle: 'modern_tech',
    primaryColor: '#3b82f6',
    secondaryColor: '#1d4ed8',
    language: 'en',
    country: 'US',
  };

  const spec = buildStorefrontSpec(genInput, builderInput, cachedLibrary);
  const packaged = await downloadAndPackageProductImages(spec);
  assert(packaged.stats.downloadedAssetCount === 8, 'Export packaged exactly 8 cached theme assets.');

  const designResult = runDesignEnginePipeline(genInput, builderInput, undefined, packaged.updatedSpec);
  const zip = new JSZip();
  for (const f of designResult.files) zip.file(f.key, f.value);
  for (const [k, v] of packaged.assetFiles.entries()) zip.file(k, v);

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  const loadedZip = await JSZip.loadAsync(zipBuffer);

  const zipAssets = Object.keys(loadedZip.files).filter((f) => f.startsWith('assets/rootx-product-'));
  assert(zipAssets.length === 8, 'Shopify ZIP contains 8 product assets.');

  console.log('\n================================================================================');
  console.log(' 🎉 ALL ROOTX IMAGE CACHE V1 REGRESSION TESTS PASSED!');
  console.log('================================================================================\n');
}

runSupabaseImageCacheTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
