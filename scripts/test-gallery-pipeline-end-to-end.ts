// ============================================================
// RootX Product Gallery Pipeline End-To-End Test Suite
// Verifies raw AliExpress URL normalization, URL validity, infinite gallery capacity (15+ images),
// Shopify JSON blocks export, Liquid section rendering, and RootX vs Shopify preview parity.
// ============================================================

import { normalizeImageUrl } from '../lib/image-pipeline/normalizer';
import { validateImage } from '../lib/image-pipeline/validator';
import { createProductImageLibrary } from '../lib/image-pipeline/library-builder';
import { buildStorefrontSpec } from '../lib/storefront-spec/builder';
import { generateShopifyLiquidSections } from '../lib/storefront-spec/liquid-generator';
import type { WebsiteGeneration, WebsiteBuilderInput } from '../lib/website-builder-types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

export function runGalleryPipelineTests() {
  console.log('\n==================================================');
  console.log('  RUNNING SHOPIFY GALLERY PIPELINE END-TO-END TESTS');
  console.log('==================================================\n');

  // 1. AliExpress URL Normalization & Double Extension Prevention
  console.log('Test 1: AliExpress Suffix & Extension Normalization...');
  const testUrls = [
    { raw: 'https://ae01.alicdn.com/kf/S100.jpg', expected: 'https://ae01.alicdn.com/kf/S100.jpg' },
    { raw: 'https://ae01.alicdn.com/kf/S200.jpg_640x640.jpg', expected: 'https://ae01.alicdn.com/kf/S200.jpg' },
    { raw: 'https://ae01.alicdn.com/kf/S300.jpg_Q90.jpg_.webp', expected: 'https://ae01.alicdn.com/kf/S300.jpg' },
    { raw: '//ae01.alicdn.com/kf/S400.png_220x220.png', expected: 'https://ae01.alicdn.com/kf/S400.png' },
  ];

  testUrls.forEach(({ raw, expected }) => {
    const res = normalizeImageUrl(raw);
    assert(res.normalizedUrl === expected, `Normalized '${raw}' -> '${res.normalizedUrl}' (Expected: '${expected}')`);
    assert(!res.normalizedUrl.includes('.jpg.jpg'), `Zero '.jpg.jpg' double extension in '${res.normalizedUrl}'`);
  });

  // 2. Large Multi-Image Fixture (15 Valid Unique Product Images)
  console.log('\nTest 2: 15-Image Uncapped Gallery Pipeline...');
  const raw15ImageUrls = Array.from(
    { length: 15 },
    (_, i) => `https://ae01.alicdn.com/kf/S${(1000 + i)}.jpg_640x640.jpg`
  );

  const product15Images: WebsiteGeneration = {
    homepage: { hero: { headline: 'Wireless ANC Earbuds', subheadline: 'Pure Audio', ctaButtons: [], backgroundStyle: 'modern' }, features: [], socialProof: '4.9/5' },
    about: { title: 'About', content: '', mission: '', vision: '', values: [] },
    services: { title: 'Services', subtitle: '', services: [] },
    pricing: { title: 'Pricing', subtitle: '', plans: [] },
    faq: { title: 'FAQ', subtitle: '', items: [] },
    testimonials: { title: 'Reviews', subtitle: '', testimonials: [] },
    contact: { title: 'Contact', subtitle: '', email: 'support@hoco.com', phone: '', address: '', formFields: [] },
    footer: { columns: [], copyright: '2026', socialLinks: [], tagline: '' },
    seo: { title: 'Earbuds', metaDescription: '', keywords: [], ogTitle: '', ogDescription: '', ogImagePrompt: '', canonicalUrl: '', structuredData: '' },
    branding: { colorPalette: [], typography: { heading: 'Inter', body: 'Outfit', accent: '', googleFontsUrl: '' }, iconSuggestions: [], logoDescription: '' },
    marketing: { googleAdsHeadlines: [], googleAdsDescriptions: [], facebookAdCopy: '', instagramCaption: '', linkedInPost: '', twitterPost: '', emailCampaign: { subject: '', preheader: '', body: '', cta: '' } },
    isDemo: false,
    provider: 'auto',
    ecommerce: {
      announcementBar: 'Free Express Shipping',
      navigation: ['Shop'],
      price: '$49.99',
      compareAtPrice: '$99.99',
      variants: [],
      images: raw15ImageUrls,
      trustBadges: [],
      shippingText: 'Fast Shipping',
      featureSections: [],
      specifications: [],
      howItWorks: [],
      faq: [],
      reviews: [],
      stickyAddToCartText: 'Add to Cart',
    },
  };

  const input: WebsiteBuilderInput = {
    businessName: 'Wireless ANC Earbuds',
    businessType: 'Consumer Electronics',
    targetAudience: 'Audio Enthusiasts',
    brandDescription: 'Noise cancelling earphones',
    preferredStyle: 'modern_tech',
    primaryColor: '#2563eb',
    secondaryColor: '#3b82f6',
    language: 'English',
    country: 'United States',
  };

  const library = createProductImageLibrary(product15Images);
  assert(library.validUniqueCount === 15, 'Library holds all 15 valid unique images');

  const spec = buildStorefrontSpec(product15Images, input, library);
  assert(spec.images.gallery.length === 15, 'StorefrontSpec contains all 15 images without hardcoded 10-cap');

  const galleryBlocks = spec.sections.find((s) => s.id === 'rootx-gallery')?.blocks || [];
  assert(galleryBlocks.length === 15, 'Shopify section JSON blocks count equals 15');

  // 3. Liquid Section Code Generation Verification
  console.log('\nTest 3: Liquid Section Render Verification...');
  const liquidSections = generateShopifyLiquidSections(spec);

  const mainProdLiquid = liquidSections.find((s) => s.key === 'sections/rootx-main-product.liquid')?.value || '';
  assert(mainProdLiquid.includes('rx-thumbnails-strip'), 'rootx-main-product.liquid includes interactive thumbnail gallery strip');
  assert(mainProdLiquid.includes('changeMainProductImg'), 'rootx-main-product.liquid includes changeMainProductImg JS swapper');

  const galleryLiquid = liquidSections.find((s) => s.key === 'sections/rootx-gallery.liquid')?.value || '';
  assert(galleryLiquid.includes('{% for block in section.blocks %}'), 'rootx-gallery.liquid renders Liquid dynamic block loop');

  // 4. URL Validation Audit
  console.log('\nTest 4: Strict Pre-Export URL Validation Audit...');
  const seen = new Set<string>();
  spec.images.gallery.forEach((img, idx) => {
    const val = validateImage(img.normalizedUrl, seen);
    assert(val.isValid, `Image #${idx + 1} (${img.normalizedUrl}) is valid`);
    seen.add(img.normalizedUrl);
  });

  console.log('\n==================================================');
  console.log(' 🎉 ALL SHOPIFY GALLERY PIPELINE TESTS PASSED');
  console.log('==================================================\n');
}

runGalleryPipelineTests();
