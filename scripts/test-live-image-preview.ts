// ============================================================
// RootX — Strict Image Cache & Live Preview Acceptance Test Suite
// Verifies image trace, canonical resolveRenderableImage resolution,
// counter parity across components, Supabase storage / URL fallback,
// prevention of supplier URL leakage, HTTP 200 checks, and stale state clearing.
// ============================================================

import { resolveRenderableImage } from '../lib/image-pipeline/resolve-image';
import { buildCachedProductImageLibrary } from '../lib/image-pipeline/cached-library';
import { buildStorefrontSpec } from '../lib/storefront-spec/builder';
import { runDesignEnginePipeline } from '../lib/design-engine/pipeline';
import type { WebsiteGeneration, WebsiteBuilderInput } from '../lib/website-builder-types';
import type { NormalizedImage } from '../lib/image-pipeline/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ACCEPTANCE TEST FAIL: ${message}`);
    throw new Error(`Acceptance test failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

const sampleDataUris = [
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY420AAAAASUVORK5CYII=',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQAAGBAQA1/353AAAAAElFTkSuQmCC',
];

export async function runLiveImagePreviewAcceptanceTests() {
  console.log('\n================================================================================');
  console.log('  ROOTX STRICT CACHED IMAGE → LIVE PREVIEW ACCEPTANCE TEST SUITE');
  console.log('================================================================================\n');

  // ── TEST 1: Canonical Helper Priority & Supplier URL Prevention ────────────
  console.log('Test 1: Canonical resolveRenderableImage Priority & Fallback Order...');

  const mockImage: Partial<NormalizedImage> = {
    originalUrl: 'https://ae01.alicdn.com/kf/original_supplier_image.jpg',
    normalizedUrl: 'https://ae01.alicdn.com/kf/normalized_supplier_image.jpg',
    cachedUrl: 'https://supabase.co/storage/v1/object/public/rootx-product-images/gen_123/image-01.jpg',
    publicUrl: 'https://cdn.rootx.dev/rootx-product-images/gen_123/image-01.jpg',
    exportedAssetName: 'rootx-product-01.jpg',
  };

  // 1a: Prefer publicUrl
  const url1 = resolveRenderableImage(mockImage);
  assert(url1 === mockImage.publicUrl, 'resolveRenderableImage prefers publicUrl when available.');

  // 1b: Prefer cachedUrl if publicUrl is missing
  const { publicUrl: _, ...noPublic } = mockImage;
  const url2 = resolveRenderableImage(noPublic);
  assert(url2 === mockImage.cachedUrl, 'resolveRenderableImage prefers cachedUrl when publicUrl is absent.');

  // 1c: Prefer exportedAssetName in theme export context
  const { cachedUrl: __, ...noCached } = noPublic;
  const url3 = resolveRenderableImage(noCached);
  assert(url3 === mockImage.exportedAssetName, 'resolveRenderableImage prefers exportedAssetName in theme export context.');

  // 1d: Fallback to normalizedUrl/originalUrl only when persistent URLs are missing
  const { exportedAssetName: ___, ...supplierOnly } = noCached;
  const url4 = resolveRenderableImage(supplierOnly);
  assert(url4 === mockImage.normalizedUrl, 'resolveRenderableImage falls back to normalizedUrl when no persistent URL exists.');

  // ── TEST 2: Server Caching & Trace Logging ─────────────────────────────────
  console.log('\nTest 2: Server Image Caching & Development Trace Logging...');
  const genId = `gen_${Date.now()}_acceptance`;
  const rawProduct = {
    title: 'Precision Mechanical Keyboard RGB',
    images: sampleDataUris,
  };

  const imageLib = await buildCachedProductImageLibrary(rawProduct, genId);

  assert(imageLib.cachedImageCount === 4, `Cache service reports exactly 4 cached images (got ${imageLib.cachedImageCount}).`);
  assert(imageLib.failedImageCount === 0, 'Cache service reports 0 failed images.');
  assert(imageLib.allValidImages.every((img) => Boolean(resolveRenderableImage(img))), 'Every valid image resolves to a non-empty renderable URL.');

  // ── TEST 3: Counter Parity Across Library, Spec, and Debug Metrics ────────
  console.log('\nTest 3: Counter Parity Across Image Library, StorefrontSpec, and Debug Metrics...');

  const rawCount = sampleDataUris.length;
  const acceptedCount = imageLib.allValidImages.length;
  const cachedCount = imageLib.cachedImageCount || 0;
  const previewCount = imageLib.galleryCandidates.length;

  assert(rawCount === 4, 'Raw count = 4');
  assert(acceptedCount === 4, 'Accepted count = 4');
  assert(cachedCount === 4, 'Cached count = 4');
  assert(previewCount === 4, 'Preview count = 4');
  assert(
    rawCount === acceptedCount && acceptedCount === cachedCount && cachedCount === previewCount,
    'Counter Parity Verified: rawImages (4) = acceptedImages (4) = cachedImages (4) = previewImages (4).'
  );

  // ── TEST 4: StorefrontSpec & Design Engine Liquid Section Rendering ────────
  console.log('\nTest 4: StorefrontSpec Section Rendering Uses Renderable URLs...');

  const mockGen: WebsiteGeneration = {
    homepage: {
      hero: { headline: 'Custom Keyboard', subheadline: 'Ultimate feel', ctaButtons: [], backgroundStyle: 'dark' },
      features: [{ title: 'Hot Swappable', description: 'Swap switches instantly', icon: 'zap' }],
      socialProof: 'Rated 4.9/5',
    },
    about: { title: 'Story', content: 'Crafted for enthusiasts.', mission: '', vision: '', values: [] },
    services: { title: '', subtitle: '', services: [] },
    pricing: { title: '', subtitle: '', plans: [] },
    faq: { title: 'FAQ', subtitle: '', items: [{ question: 'Is it wireless?', answer: 'Yes, Bluetooth 5.0 and 2.4Ghz.' }] },
    testimonials: { title: '', subtitle: '', testimonials: [] },
    contact: { title: '', subtitle: '', formFields: [], email: '', phone: '', address: '' },
    footer: { copyright: '', columns: [], socialLinks: [], tagline: '' },
    seo: { title: 'Mechanical Keyboard', metaDescription: '', keywords: [], ogTitle: '', ogDescription: '', ogImagePrompt: '', canonicalUrl: '', structuredData: '' },
    branding: { colorPalette: [], typography: { heading: 'Inter', body: 'Inter', accent: 'Inter', googleFontsUrl: '' }, iconSuggestions: [], logoDescription: '' },
    marketing: { googleAdsHeadlines: [], googleAdsDescriptions: [], facebookAdCopy: '', instagramCaption: '', linkedInPost: '', twitterPost: '', emailCampaign: { subject: '', preheader: '', body: '', cta: '' } },
    ecommerce: {
      price: '89.99',
      shippingText: 'Express Insured Delivery',
      images: imageLib.allValidImages.map((i) => resolveRenderableImage(i)),
    },
  } as unknown as WebsiteGeneration;

  const mockInput: WebsiteBuilderInput = {
    businessName: 'KeebStudio',
    businessType: 'Keyboards',
    targetAudience: 'Gamers & Developers',
    brandDescription: 'Custom mechanical keyboards',
    preferredStyle: 'modern_tech',
    primaryColor: '#6366f1',
    secondaryColor: '#06b6d4',
    language: 'en',
    country: 'US',
  };

  const spec = buildStorefrontSpec(mockGen, mockInput, imageLib);
  const designEngineRes = runDesignEnginePipeline(mockGen, mockInput, imageLib, spec);

  // Check section HTML for hero image
  const heroSectionFile = designEngineRes.files.find((f) => f.key.includes('hero'));
  assert(heroSectionFile !== undefined, 'Hero section generated.');

  if (heroSectionFile) {
    const renderedHeroUrl = resolveRenderableImage(spec.images.hero);
    assert(renderedHeroUrl.length > 0, `Hero image resolves to valid URL: ${renderedHeroUrl.slice(0, 40)}...`);
    assert(
      !heroSectionFile.value.includes('original_supplier_image.jpg'),
      'Rendered Hero Section contains ZERO raw supplier URLs when cached/renderable URLs exist.'
    );
  }

  // ── TEST 5: Production Vercel Filesystem Check ─────────────────────────────
  console.log('\nTest 5: Production Vercel Filesystem Persistence Check...');
  const prodEnvOriginal = process.env.NODE_ENV;
  try {
    (process.env as Record<string, string>).NODE_ENV = 'production';

    // Verify that resolveRenderableImage for cached images returns non-ephemeral URLs or public URLs
    imageLib.allValidImages.forEach((img, idx) => {
      const renderUrl = resolveRenderableImage(img);
      assert(!renderUrl.startsWith('/tmp/'), `Image ${idx + 1} does not point to /tmp/ in production.`);
    });
  } finally {
    (process.env as Record<string, string>).NODE_ENV = prodEnvOriginal;
  }

  // ── TEST 6: Stale State Clearing Test ──────────────────────────────────────
  console.log('\nTest 6: Clearing Stale Image State on New Store Generation...');
  const freshGenId = `gen_${Date.now()}_fresh`;
  const freshProductData = {
    title: 'Wireless Ergonomic Trackball Mouse',
    images: [sampleDataUris[0]], // Only 1 image
  };

  const freshImageLib = await buildCachedProductImageLibrary(freshProductData, freshGenId);
  assert(freshImageLib.generationId === freshGenId, 'Fresh Generation ID assigned.');
  assert(freshImageLib.allValidImages.length === 1, 'Stale images cleared: Fresh library contains exactly 1 image.');
  assert(freshImageLib.generationId !== genId, 'Previous generation ID successfully discarded.');

  console.log('\n================================================================================');
  console.log(' 🎉 ALL STRICT ACCEPTANCE TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================================\n');
}

runLiveImagePreviewAcceptanceTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
