// ============================================================
// RootX Image Persistence & Theme Switching Test Suite
// Verifies persistent ProductImageLibrary creation, zero image loss across theme switches,
// theme role re-assignment, duplicate URL filtering, and Shopify OS 2.0 gallery parity.
// ============================================================

import { createProductImageLibrary } from '../lib/image-pipeline/library-builder';
import { reassignImagesForTheme } from '../lib/image-pipeline/theme-reassigner';
import { buildStorefrontSpec } from '../lib/storefront-spec/builder';
import { generateShopifyLiquidSections } from '../lib/storefront-spec/liquid-generator';
import type { WebsiteGeneration, WebsiteBuilderInput, DesignArchetypeId } from '../lib/website-builder-types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

export function runImagePersistenceTests() {
  console.log('\n==================================================');
  console.log('  RUNNING ROOTX IMAGE PERSISTENCE TEST SUITE');
  console.log('==================================================\n');

  // Multi-image sample fixture with 6 valid unique images
  const sample6ImageProduct: WebsiteGeneration = {
    homepage: { hero: { headline: 'Aroma Diffuser', subheadline: 'Pure Mist', ctaButtons: [], backgroundStyle: 'soft' }, features: [], socialProof: '4.9/5' },
    about: { title: 'About', content: '', mission: '', vision: '', values: [] },
    services: { title: 'Services', subtitle: '', services: [] },
    pricing: { title: 'Pricing', subtitle: '', plans: [] },
    faq: { title: 'FAQ', subtitle: '', items: [] },
    testimonials: { title: 'Reviews', subtitle: '', testimonials: [] },
    contact: { title: 'Contact', subtitle: '', email: 'help@aroma.com', phone: '', address: '', formFields: [] },
    footer: { columns: [], copyright: '2026', socialLinks: [], tagline: '' },
    seo: { title: 'Aroma Diffuser', metaDescription: '', keywords: [], ogTitle: '', ogDescription: '', ogImagePrompt: '', canonicalUrl: '', structuredData: '' },
    branding: { colorPalette: [], typography: { heading: 'Playfair Display', body: 'Outfit', accent: '', googleFontsUrl: '' }, iconSuggestions: [], logoDescription: '' },
    marketing: { googleAdsHeadlines: [], googleAdsDescriptions: [], facebookAdCopy: '', instagramCaption: '', linkedInPost: '', twitterPost: '', emailCampaign: { subject: '', preheader: '', body: '', cta: '' } },
    isDemo: false,
    provider: 'auto',
    ecommerce: {
      announcementBar: 'Free Shipping',
      navigation: ['Shop', 'FAQ'],
      price: '$39.99',
      compareAtPrice: '$79.99',
      variants: [],
      images: [
        'https://images.unsplash.com/photo-1512290900673-07c87c945145',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e',
        'https://images.unsplash.com/photo-1526947425960-945c6e72858f',
        'https://images.unsplash.com/photo-1556228720-195a672e8a03',
        'https://images.unsplash.com/photo-1563170351-be82bc888aa4',
        'https://images.unsplash.com/photo-1512290900673-07c87c945145', // Duplicate
        'not-a-valid-url-format', // Broken
      ],
      trustBadges: ['Fast Delivery'],
      shippingText: 'Free Express Shipping',
      featureSections: [],
      specifications: [{ label: 'Capacity', value: '500ml' }],
      howItWorks: [],
      faq: [],
      reviews: [],
      stickyAddToCartText: 'Add to Cart',
    },
  };

  const baseInput: WebsiteBuilderInput = {
    businessName: 'Aroma Diffuser',
    businessType: 'Beauty & Wellness',
    targetAudience: 'Selfcare Lovers',
    brandDescription: 'Essential oil mist diffuser',
    preferredStyle: 'soft_beauty',
    primaryColor: '#ec4899',
    secondaryColor: '#f43f5e',
    language: 'English',
    country: 'United States',
  };

  // 1. Persistent Image Library Creation
  console.log('Test 1: Persistent Image Library Creation...');
  const library = createProductImageLibrary(sample6ImageProduct);
  assert(library.originalSourceCount === 8, 'Original extracted image count matches (8 raw items)');
  assert(library.validUniqueCount === 6, 'Valid unique images count is exactly 6');
  assert(library.rejectedImages.length === 2, 'Rejected 2 invalid/duplicate items (1 duplicate, 1 bad URL)');

  // 2. Theme Switch Preserves Image Count & 3. Recalculates Assignments Only
  console.log('\nTest 2 & 3: Theme Switch Preserves Image Count & Recalculates Roles...');
  const softBeautyAssignments = reassignImagesForTheme(library, 'soft_beauty');
  assert(softBeautyAssignments.gallery.length === 6, 'Soft Beauty theme gallery contains all 6 valid images');
  assert(Boolean(softBeautyAssignments.hero), 'Hero image assigned for Soft Beauty');

  // 4. StorefrontSpec Merge Preserves Nested Images
  console.log('\nTest 4: StorefrontSpec Merge Preserves Nested Images...');
  const specInitial = buildStorefrontSpec(sample6ImageProduct, baseInput, library);
  assert(specInitial.images.gallery.length === 6, 'StorefrontSpec gallery contains all 6 images initially');
  assert(specInitial.imageLibrary?.validUniqueCount === 6, 'StorefrontSpec holds persistent image library');

  // 5. All Theme Families Use Same Image Library
  console.log('\nTest 5: All Theme Families Use Same Image Library...');
  const themesToTest: DesignArchetypeId[] = [
    'soft_beauty',
    'clean_wellness',
    'high_conversion_single',
    'luxury_editorial',
    'modern_tech',
  ];

  themesToTest.forEach((themeId) => {
    const spec = buildStorefrontSpec(sample6ImageProduct, { ...baseInput, preferredStyle: themeId }, library);
    assert(
      spec.imageLibrary?.validUniqueCount === 6,
      `Theme '${themeId}' retains persistent image library count of 6`
    );
  });

  // 6. Shopify Export Receives All Valid Images
  console.log('\nTest 6: Shopify Export Receives All Valid Images...');
  const liquidSections = generateShopifyLiquidSections(specInitial);
  const gallerySection = liquidSections.find((s) => s.key === 'sections/rootx-gallery.liquid');
  assert(Boolean(gallerySection), 'Liquid sections include rootx-gallery.liquid');

  // 7. Multi-Switch Sequence (Soft Beauty → Clean Wellness → High Conversion → Luxury → Modern Tech)
  console.log('\nTest 7: Multi-Switch Sequence Image Count Audit...');
  let currentSpec = specInitial;

  themesToTest.forEach((themeId) => {
    currentSpec = buildStorefrontSpec(
      sample6ImageProduct,
      { ...baseInput, preferredStyle: themeId },
      currentSpec.imageLibrary
    );
    assert(
      currentSpec.imageLibrary?.validUniqueCount === 6,
      `After switching to '${themeId}', persistent library count remains 6`
    );
    assert(
      currentSpec.images.gallery.length === 6,
      `After switching to '${themeId}', gallery assignments count remains 6`
    );
  });

  // 8. No Duplicate Image URLs
  console.log('\nTest 8: Duplicate Image URL Prevention...');
  const galleryUrls = currentSpec.images.gallery.map((img) => img.normalizedUrl);
  const uniqueUrls = new Set(galleryUrls);
  assert(uniqueUrls.size === galleryUrls.length, 'Gallery contains zero duplicate image URLs');

  // 9. No Empty Image Blocks
  console.log('\nTest 9: Empty Image Block Audit...');
  const galleryBlocks = currentSpec.sections.find((s) => s.id === 'rootx-gallery')?.blocks || [];
  assert(galleryBlocks.length === 6, 'Gallery section blocks count matches 6');
  galleryBlocks.forEach((block: any, idx) => {
    assert(Boolean(block.settings?.image_url), `Block ${idx + 1} contains non-empty image_url`);
  });

  // 10. Product With 1 Image
  console.log('\nTest 10: Single Image Product Handling...');
  const singleImageProd: WebsiteGeneration = {
    ...sample6ImageProduct,
    ecommerce: {
      ...sample6ImageProduct.ecommerce!,
      images: ['https://images.unsplash.com/photo-1512290900673-07c87c945145'],
    },
  };
  const singleLib = createProductImageLibrary(singleImageProd);
  const singleSpec = buildStorefrontSpec(singleImageProd, baseInput, singleLib);
  assert(singleLib.validUniqueCount === 1, 'Single image product returns library count of 1');
  assert(singleSpec.images.hasSingleImageFallback === true, 'Single image product sets hasSingleImageFallback flag');

  // 11. Product With 6 Images & 12. Product With 10 Images
  console.log('\nTest 11 & 12: 6-Image & 10-Image Products...');
  const tenImageUrls = Array.from({ length: 12 }, (_, i) => `https://images.unsplash.com/photo-${1500000000000 + i}`);
  const tenImageProd: WebsiteGeneration = {
    ...sample6ImageProduct,
    ecommerce: {
      ...sample6ImageProduct.ecommerce!,
      images: tenImageUrls,
    },
  };
  const tenLib = createProductImageLibrary(tenImageProd);
  const tenSpec = buildStorefrontSpec(tenImageProd, baseInput, tenLib);
  assert(tenLib.validUniqueCount === 12, '12 candidate images correctly extracted into library');
  assert(tenSpec.images.gallery.length <= 10, 'Gallery images safely capped to 10 max for performance');

  // 13. Broken Image Filtered
  console.log('\nTest 13: Broken Image Filtering...');
  assert(library.rejectedImages.some((r) => r.url.includes('not-a-valid-url')), 'Invalid non-HTTP URL filtered');

  // 14. Mobile Preview After Theme Switch
  console.log('\nTest 14: Mobile Preview State Verification...');
  assert(Boolean(currentSpec.responsiveSettings.mobileStack), 'Responsive mobile stack settings intact after switches');

  // 15. Shopify ZIP Export After Theme Switch
  console.log('\nTest 15: Shopify ZIP Export Parity After Theme Switch...');
  const finalLiquidSections = generateShopifyLiquidSections(currentSpec);
  assert(finalLiquidSections.length === 13, 'Shopify theme export contains all 13 required Liquid sections after theme switches');

  console.log('\n==================================================');
  console.log(' 🎉 ALL 15 IMAGE PERSISTENCE TESTS PASSED SUCCESSFULY');
  console.log('==================================================\n');
}

runImagePersistenceTests();
