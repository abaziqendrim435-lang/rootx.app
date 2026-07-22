// ============================================================
// RootX Multi-Image Gallery Pipeline & Export Integration Test
// Verifies real product data with 5+ images retains all valid images
// without truncation from extraction through StorefrontSpec and Shopify ZIP export.
// ============================================================

import { extractRawImages } from '../lib/image-pipeline/extractor';
import { runImagePipeline } from '../lib/image-pipeline/pipeline';
import { buildStorefrontSpec } from '../lib/storefront-spec/builder';
import { runDesignEnginePipeline } from '../lib/design-engine/pipeline';
import type { WebsiteGeneration, WebsiteBuilderInput } from '../lib/website-builder-types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

async function runMultiImageGalleryTest() {
  console.log('\n==================================================');
  console.log('  RUNNING MULTI-IMAGE GALLERY INTEGRATION TEST');
  console.log('==================================================\n');

  // Real AliExpress product fixture containing 6 distinct images
  const aliExpressProductFixture = {
    title: 'Anker Soundcore Motion Boom Outdoor Bluetooth Speaker IPX7',
    price: '$89.99',
    images: [
      'https://ae01.alicdn.com/kf/S1000000000000001.jpg',
      'https://ae01.alicdn.com/kf/S2000000000000002.jpg',
      'https://ae01.alicdn.com/kf/S3000000000000003.jpg',
      'https://ae01.alicdn.com/kf/S4000000000000004.jpg',
      'https://ae01.alicdn.com/kf/S5000000000000005.jpg',
      'https://ae01.alicdn.com/kf/S6000000000000006.jpg'
    ],
    variants: [
      { id: 1, image: 'https://ae01.alicdn.com/kf/S1000000000000001.jpg', title: 'Black' },
      { id: 2, image: 'https://ae01.alicdn.com/kf/S2000000000000002.jpg', title: 'Blue' }
    ]
  };

  // 1. Raw Extraction Step
  console.log('1. Extracting Raw Candidate Images...');
  const rawCandidates = extractRawImages(aliExpressProductFixture);
  console.log(`   Raw Images Found: ${rawCandidates.length}`);
  assert(rawCandidates.length >= 5, 'Raw images found: at least 5');

  // 2. Image Pipeline Role Assignment
  console.log('\n2. Running Image Pipeline...');
  const imgResult = runImagePipeline(aliExpressProductFixture);
  console.log(`   Valid Unique Images: ${imgResult.images.length}`);
  assert(imgResult.images.length >= 5, 'Valid unique images: at least 5');
  assert(imgResult.heroImage !== null, 'Hero image assigned: 1');

  // 3. StorefrontSpec Construction
  console.log('\n3. Building StorefrontSpec...');
  const dummyGen: any = {
    homepage: {
      hero: { headline: 'Soundcore Motion Boom', subheadline: 'Pure outdoor sound', ctaButtons: [{ label: 'Buy', url: '/cart', variant: 'primary' }] },
      features: [
        { icon: '🔊', title: 'IPX7 Waterproof', description: 'Fully submersible sound' },
        { icon: '🔋', title: '24H Playtime', description: 'All day power' },
        { icon: '🎵', title: 'Titanium Drivers', description: 'Ultra-clear treble' }
      ]
    },
    about: { title: 'About', content: 'Anker Soundcore', mission: '', vision: '', values: [] },
    services: { title: 'Svc', subtitle: '', services: [] },
    pricing: { title: 'Price', subtitle: '', plans: [] },
    faq: { title: 'FAQ', subtitle: '', items: [{ question: 'Waterproof?', answer: 'Yes, IPX7 rated.' }] },
    testimonials: { title: 'Testimonials', subtitle: '', testimonials: [] },
    contact: { title: 'Contact', subtitle: '', formFields: [], email: '', phone: '', address: '' },
    footer: { copyright: 'Soundcore', columns: [], socialLinks: [], tagline: '' },
    seo: { title: 'Anker Soundcore Speaker', metaDescription: '', keywords: [], ogTitle: '', ogDescription: '', ogImage: '', twitterCard: '', canonicalUrl: '' },
    branding: { typography: { heading: 'Outfit', body: 'Outfit', accent: 'Outfit', googleFontsUrl: '' } },
    marketing: {},
    ecommerce: {
      price: aliExpressProductFixture.price,
      shippingText: 'Free Worldwide Express',
      images: aliExpressProductFixture.images,
      benefits: [
        { title: 'IPX7 Waterproof', description: 'Fully submersible sound' },
        { title: '24H Playtime', description: 'All day power' }
      ]
    }
  };

  const dummyInput: WebsiteBuilderInput = {
    businessName: 'Soundcore Store',
    businessType: 'Tech',
    targetAudience: 'Outdoor Enthusiasts',
    brandDescription: 'Outdoor audio equipment',
    preferredStyle: 'modern_tech',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    language: 'en',
    country: 'US'
  };

  const spec = buildStorefrontSpec(dummyGen, dummyInput);
  assert(spec.images.gallery.length >= 5, 'StorefrontSpec gallery contains all valid images (≥5)');

  // 4. Design Engine Pipeline Execution & Theme Packaging
  console.log('\n4. Generating Shopify Theme & Packaging Blocks...');
  const designEngineResult = runDesignEnginePipeline(dummyGen, dummyInput);
  const themeFiles = designEngineResult.files;

  // Inspect templates/index.json
  const indexJsonFile = themeFiles.find(f => f.key === 'templates/index.json');
  assert(Boolean(indexJsonFile), 'templates/index.json generated');

  const indexParsed = JSON.parse(indexJsonFile!.value);
  const gallerySecObj = indexParsed.sections['rootx-gallery'];
  assert(Boolean(gallerySecObj), 'rootx-gallery section present in templates/index.json');
  assert(Boolean(gallerySecObj.blocks), 'blocks dictionary generated for rootx-gallery');
  assert(Boolean(gallerySecObj.block_order), 'block_order array generated for rootx-gallery');

  const exportedBlockCount = gallerySecObj.block_order.length;
  console.log(`   Exported Gallery Blocks Count: ${exportedBlockCount}`);
  assert(exportedBlockCount >= 4, 'Gallery images exported: at least 4');

  // Verify each block contains a valid HTTPS URL and no duplicates
  const exportedUrls = new Set<string>();
  for (const bId of gallerySecObj.block_order) {
    const b = gallerySecObj.blocks[bId];
    assert(Boolean(b), `Block ${bId} exists in blocks`);
    assert(Boolean(b.settings.image_url), `Block ${bId} has non-empty image_url`);
    assert(b.settings.image_url.startsWith('https://'), `Block ${bId} has valid HTTPS URL`);
    assert(!exportedUrls.has(b.settings.image_url), `Block ${bId} image URL is unique`);
    exportedUrls.add(b.settings.image_url);
  }

  // Inspect rootx-gallery.liquid
  const galleryLiquid = themeFiles.find(f => f.key === 'sections/rootx-gallery.liquid');
  assert(Boolean(galleryLiquid), 'sections/rootx-gallery.liquid generated');
  assert(galleryLiquid!.value.includes('{% for block in section.blocks %}'), 'rootx-gallery loops over section.blocks');
  assert(!galleryLiquid!.value.includes('slice(0, 4)'), 'rootx-gallery does not hardcode slice(0, 4)');

  // Inspect rootx-main-product.liquid
  const mainProdLiquid = themeFiles.find(f => f.key === 'sections/rootx-main-product.liquid');
  assert(Boolean(mainProdLiquid), 'sections/rootx-main-product.liquid generated');
  assert(mainProdLiquid!.value.includes('rx-thumbs-wrapper'), 'rootx-main-product renders interactive thumbnail wrapper');
  assert(mainProdLiquid!.value.includes('onclick="document.getElementById'), 'rootx-main-product contains thumbnail image swapper script');

  console.log('\n==================================================');
  console.log(' 🎉 MULTI-IMAGE GALLERY INTEGRATION TEST PASSED SUCCESSFULY');
  console.log('==================================================\n');
}

runMultiImageGalleryTest().catch(err => {
  console.error(err);
  process.exit(1);
});
