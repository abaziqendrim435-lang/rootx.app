// ============================================================
// RootX Product Image Pipeline V1 — Real AliExpress Flow Integration Test
// ============================================================

import { extractRawImages } from '../lib/image-pipeline/extractor';
import { runImagePipeline } from '../lib/image-pipeline/pipeline';
import { runDesignEnginePipeline } from '../lib/design-engine/pipeline';
import { generateShopifyThemeV2 } from '../lib/shopify-theme-generator';
import type { WebsiteGeneration, WebsiteBuilderInput } from '../lib/website-builder-types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

async function runAliExpressFlowTest() {
  console.log('\n==================================================');
  console.log('  RUNNING REAL ALIEXPRESS IMAGE FLOW INTEGRATION TEST');
  console.log('==================================================\n');

  // Step 1: Real AliExpress/Apify Scraper Response Fixture
  console.log('Step 1: Inspecting Real AliExpress Scraper Response Fixture');
  const realApifyFixture = {
    title: 'Wireless Active Noise Cancelling Headphones - Premium Bass',
    productMainImageUrl: '//ae01.alicdn.com/kf/S1010101010_50x50.jpg',
    gallery: [
      '//ae01.alicdn.com/kf/S2020202020_220x220.jpg',
      '//ae01.alicdn.com/kf/S3030303030_Q90.jpg'
    ],
    skuImage: '//ae01.alicdn.com/kf/S4040404040.jpg',
    variants: [
      { color: 'Black', image: '//ae01.alicdn.com/kf/S5050505050_800x800.jpg' }
    ]
  };

  const extractedCandidates = extractRawImages(realApifyFixture);
  console.log('Extracted raw candidates count:', extractedCandidates.length);
  assert(extractedCandidates.length >= 4, 'Extracted raw images across all AliExpress fields');
  assert(extractedCandidates.some(c => c.rawUrl.includes('S1010101010')), 'Extracted productMainImageUrl');
  assert(extractedCandidates.some(c => c.rawUrl.includes('S2020202020')), 'Extracted gallery images');

  // Step 2: Image Pipeline Normalization & Security Guardrails
  console.log('\nStep 2: Image Pipeline Normalization & Security Guardrails');
  const pipeRes = runImagePipeline({ item: realApifyFixture });
  assert(pipeRes.images.length >= 4, 'Normalized all valid AliExpress images');
  assert(pipeRes.heroImage !== null, 'Assigned hero image');
  assert(Boolean(pipeRes.heroImage?.normalizedUrl.startsWith('https://')), 'Converted // protocol-relative URL to https://');
  assert(!pipeRes.heroImage?.normalizedUrl.includes('_50x50.jpg'), 'Stripped _50x50 size suffix for full resolution');

  // Step 3: API Payload Preservation (Simulating AI response with missing images)
  console.log('\nStep 3: Simulating AI Response with Missing/Placeholder Images');
  const mockAiOutput = {
    homepage: {
      hero: { headline: 'Experience Wireless Freedom', subheadline: 'Noise cancelling precision', ctaButtons: [] }
    },
    about: { title: 'About Store', content: 'Story' },
    services: { title: 'Why Us', subtitle: '', services: [] },
    pricing: { title: 'Plans', subtitle: '', plans: [] },
    faq: { title: 'FAQ', subtitle: '', items: [] },
    testimonials: { title: 'Reviews', subtitle: '', testimonials: [] },
    contact: { title: 'Contact', subtitle: '', formFields: [] },
    footer: { copyright: 'Store' },
    seo: { title: 'SEO' },
    branding: { typography: { heading: 'Inter', body: 'Inter' } },
    marketing: {},
    ecommerce: {
      images: ['[Image 1]', 'Pick 2-4 exact URLs...'] // Hallucinated AI placeholder strings!
    }
  };

  // Simulate API route image preservation logic
  const scrapedImages = pipeRes.images.map(img => img.normalizedUrl);
  const validAiImgs = mockAiOutput.ecommerce.images.filter(u => u.startsWith('http://') || u.startsWith('https://'));
  const preservedImages = scrapedImages.length > 0 ? [...new Set([...scrapedImages, ...validAiImgs])] : validAiImgs;

  assert(preservedImages.length >= 4, 'Preserved original scraped product images');
  assert(preservedImages[0].startsWith('https://ae01.alicdn.com'), 'Hero image is real AliExpress CDN URL');

  // Step 4: Design Engine Theme Generation
  console.log('\nStep 4: Design Engine Theme Generation');
  const genInput = {
    ...mockAiOutput,
    ecommerce: {
      announcementBar: 'Promo',
      navigation: ['Home', 'Shop'],
      price: '$49.99',
      compareAtPrice: '$79.99',
      preferredStyle: 'modern_tech',
      variants: [],
      images: preservedImages,
      trustBadges: ['Quality'],
      shippingText: 'Tracked shipping',
      featureSections: [],
      specifications: [],
      howItWorks: [],
      faq: [],
      reviews: [],
      stickyAddToCartText: 'Buy'
    }
  } as unknown as WebsiteGeneration;

  const builderInput: WebsiteBuilderInput = {
    businessName: 'Headphones Store',
    businessType: 'Audio',
    targetAudience: 'Music Lovers',
    brandDescription: 'Premium Wireless Active Noise Cancelling Headphones',
    preferredStyle: 'modern_tech',
    primaryColor: '#06b6d4',
    secondaryColor: '#3b82f6',
    language: 'en',
    country: 'US'
  };

  const designRes = runDesignEnginePipeline(genInput, builderInput);
  assert(designRes.imagePipelineResult !== undefined, 'DesignEngineResult includes imagePipelineResult');
  assert(Boolean(designRes.imagePipelineResult?.heroImage?.normalizedUrl.startsWith('https://ae01.alicdn.com')), 'Hero image URL set in imagePipelineResult');

  // Step 5: Liquid Section & ZIP File Output Check
  console.log('\nStep 5: Liquid Section & ZIP Theme File Output');
  const heroLiquid = designRes.files.find(f => f.key.includes('hero'))?.value || '';
  assert(heroLiquid.includes('https://ae01.alicdn.com'), 'Liquid section file contains real AliExpress CDN URL');

  console.log('\n==================================================');
  console.log(' 🎉 ALL REAL ALIEXPRESS FLOW INTEGRATION TESTS PASSED');
  console.log('==================================================\n');
}

runAliExpressFlowTest().catch(err => {
  console.error(err);
  process.exit(1);
});
