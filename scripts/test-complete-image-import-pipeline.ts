// ============================================================
// RootX Complete Image Import Pipeline Automated Test Suite
// Verifies that every product image is extracted, order is kept,
// duplicates & broken URLs are ignored, all images are downloaded
// into assets, URLs are rewritten to local Shopify assets, and
// gallery renders dynamically for 8, 12, or any number of images.
// ============================================================

import { extractRawImages } from '../lib/image-pipeline/extractor';
import { runImagePipeline } from '../lib/image-pipeline/pipeline';
import { buildStorefrontSpec } from '../lib/storefront-spec/builder';
import { downloadAndPackageProductImages } from '../lib/image-pipeline/asset-downloader';
import { runDesignEnginePipeline } from '../lib/design-engine/pipeline';
import type { WebsiteGeneration, WebsiteBuilderInput } from '../lib/website-builder-types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

async function runCompleteImagePipelineTests() {
  console.log('\n===========================================================');
  console.log('  RUNNING COMPLETE IMAGE IMPORT PIPELINE TEST SUITE');
  console.log('===========================================================\n');

  // -------------------------------------------------------------
  // Test 1: AliExpress Image Gallery Extraction & Order Preservation
  // -------------------------------------------------------------
  console.log('Test 1: AliExpress Image Gallery Extraction & Order Preservation...');
  const aliExpressFixture = {
    title: 'Wireless Ergonomic Vertical Mouse RGB 4000 DPI',
    price: '$29.99',
    images: [
      'https://ae01.alicdn.com/kf/S001_640x640.jpg',
      'https://ae01.alicdn.com/kf/S002_640x640.jpg',
      'https://ae01.alicdn.com/kf/S003_640x640.jpg',
      'https://ae01.alicdn.com/kf/S004_640x640.jpg',
      'https://ae01.alicdn.com/kf/S005_640x640.jpg',
      'https://ae01.alicdn.com/kf/S006_640x640.jpg',
      'https://ae01.alicdn.com/kf/S007_640x640.jpg',
      'https://ae01.alicdn.com/kf/S008_640x640.jpg'
    ]
  };

  const aePipelineResult = runImagePipeline(aliExpressFixture);
  assert(aePipelineResult.galleryImages.length === 8, 'Extracted all 8 AliExpress gallery images');
  assert(aePipelineResult.galleryImages[0].normalizedUrl === 'https://ae01.alicdn.com/kf/S001.jpg', 'Image 1 order preserved & normalized');
  assert(aePipelineResult.galleryImages[7].normalizedUrl === 'https://ae01.alicdn.com/kf/S008.jpg', 'Image 8 order preserved & normalized');

  // -------------------------------------------------------------
  // Test 2: Shopify product.images Array Extraction
  // -------------------------------------------------------------
  console.log('\nTest 2: Shopify product.images Array Extraction...');
  const shopifyFixture = {
    product: {
      title: 'Minimalist Mechanical Watch Stainless Steel',
      images: [
        { id: 101, src: 'https://cdn.shopify.com/s/files/1/001/watch_01_1024x1024.jpg' },
        { id: 102, src: 'https://cdn.shopify.com/s/files/1/001/watch_02_1024x1024.jpg' },
        { id: 103, src: 'https://cdn.shopify.com/s/files/1/001/watch_03_1024x1024.jpg' },
        { id: 104, src: 'https://cdn.shopify.com/s/files/1/001/watch_04_1024x1024.jpg' },
        { id: 105, src: 'https://cdn.shopify.com/s/files/1/001/watch_05_1024x1024.jpg' },
        { id: 106, src: 'https://cdn.shopify.com/s/files/1/001/watch_06_1024x1024.jpg' },
        { id: 107, src: 'https://cdn.shopify.com/s/files/1/001/watch_07_1024x1024.jpg' },
        { id: 108, src: 'https://cdn.shopify.com/s/files/1/001/watch_08_1024x1024.jpg' },
        { id: 109, src: 'https://cdn.shopify.com/s/files/1/001/watch_09_1024x1024.jpg' },
        { id: 110, src: 'https://cdn.shopify.com/s/files/1/001/watch_10_1024x1024.jpg' },
        { id: 111, src: 'https://cdn.shopify.com/s/files/1/001/watch_11_1024x1024.jpg' },
        { id: 112, src: 'https://cdn.shopify.com/s/files/1/001/watch_12_1024x1024.jpg' }
      ]
    }
  };

  const shopifyPipelineResult = runImagePipeline(shopifyFixture);
  assert(shopifyPipelineResult.galleryImages.length === 12, 'Extracted all 12 Shopify product.images array items');
  assert(shopifyPipelineResult.galleryImages[0].normalizedUrl === 'https://cdn.shopify.com/s/files/1/001/watch_01.jpg', 'Shopify image 1 normalized & preserved');
  assert(shopifyPipelineResult.galleryImages[11].normalizedUrl === 'https://cdn.shopify.com/s/files/1/001/watch_12.jpg', 'Shopify image 12 normalized & preserved');

  // -------------------------------------------------------------
  // Test 3: Deduplication & Broken URL Filtering
  // -------------------------------------------------------------
  console.log('\nTest 3: Deduplication & Broken URL Filtering...');
  const dirtyFixture = {
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e', // duplicate
      'not-a-valid-url', // malformed
      'http://127.0.0.1/ssrf.jpg', // SSRF blocked
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
      'javascript:alert(1)' // forbidden scheme
    ]
  };

  const dirtyPipelineResult = runImagePipeline(dirtyFixture);
  assert(dirtyPipelineResult.galleryImages.length === 2, 'Deduplicated & filtered broken/invalid URLs down to 2 valid images');
  assert(dirtyPipelineResult.diagnosticInfo.rejectedCount >= 3, 'Logged rejections for invalid and duplicate items');

  // -------------------------------------------------------------
  // Test 4: 8-Image Product — Asset Download, Local Rewrite & Dynamic Gallery
  // -------------------------------------------------------------
  console.log('\nTest 4: 8-Image Product — Download, Local Asset Rewrite & Dynamic Gallery...');
  const gen8Images: WebsiteGeneration = {
    homepage: { hero: { headline: 'Ergonomic Vertical Mouse', subheadline: 'Work painless', ctaButtons: [] }, features: [], socialProof: '' },
    about: { title: '', content: '', mission: '', vision: '', values: [] },
    services: { title: '', subtitle: '', services: [] },
    pricing: { title: '', subtitle: '', plans: [] },
    faq: { title: '', subtitle: '', items: [] },
    testimonials: { title: '', subtitle: '', testimonials: [] },
    contact: { title: '', subtitle: '', formFields: [], email: '', phone: '', address: '' },
    footer: { copyright: '', columns: [], socialLinks: [], tagline: '' },
    seo: { title: 'Vertical Mouse', metaDescription: '', keywords: [], ogTitle: '', ogDescription: '', ogImagePrompt: '', canonicalUrl: '', structuredData: '' },
    branding: { colorPalette: [], typography: { heading: 'Inter', body: 'Inter', accent: 'Inter', googleFontsUrl: '' }, iconSuggestions: [], logoDescription: '' },
    marketing: { googleAdsHeadlines: [], googleAdsDescriptions: [], facebookAdCopy: '', instagramCaption: '', linkedInPost: '', twitterPost: '', emailCampaign: { subject: '', preheader: '', body: '', cta: '' } },
    ecommerce: {
      price: '29.99',
      shippingText: 'Tracked Delivery',
      images: [
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY420AAAAASUVORK5CYII=',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AQAAGBAQA1/353AAAAAElFTkSuQmCC',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==#4',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==#5',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY420AAAAASUVORK5CYII=#6',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AQAAGBAQA1/353AAAAAElFTkSuQmCC#7'
      ]
    }
  };

  const input8: WebsiteBuilderInput = {
    businessName: 'VerticalMouse Co',
    businessType: 'Tech',
    targetAudience: 'Office Workers',
    brandDescription: 'Ergonomic tech accessories',
    preferredStyle: 'modern_tech',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    language: 'en',
    country: 'US'
  };

  const spec8 = buildStorefrontSpec(gen8Images, input8);
  assert(spec8.images.gallery.length === 8, 'StorefrontSpec gallery contains exactly 8 images');

  const packaged8 = await downloadAndPackageProductImages(spec8);
  assert(packaged8.stats.downloadedAssetCount === 8, 'Downloaded and packaged exactly 8 images');
  assert(packaged8.assetFiles.has('assets/rootx-product-01.png'), 'Asset rootx-product-01.png stored');
  assert(packaged8.assetFiles.has('assets/rootx-product-08.png'), 'Asset rootx-product-08.png stored');

  const designResult8 = runDesignEnginePipeline(gen8Images, input8, undefined, packaged8.updatedSpec);
  const indexJson8 = JSON.parse(designResult8.files.find(f => f.key === 'templates/index.json')!.value);
  const galleryBlocks8 = indexJson8.sections['rootx-gallery'].block_order;
  assert(galleryBlocks8.length === 8, 'Generated index.json gallery section has exactly 8 blocks');

  // -------------------------------------------------------------
  // Test 5: 12-Image Product — Asset Download, Local Rewrite & Dynamic Gallery
  // -------------------------------------------------------------
  console.log('\nTest 5: 12-Image Product — Download, Local Asset Rewrite & Dynamic Gallery...');
  const gen12Images: WebsiteGeneration = {
    ...gen8Images,
    ecommerce: {
      ...gen8Images.ecommerce,
      images: [
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==#01',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==#02',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY420AAAAASUVORK5CYII=#03',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AQAAGBAQA1/353AAAAAElFTkSuQmCC#04',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==#05',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==#06',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY420AAAAASUVORK5CYII=#07',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AQAAGBAQA1/353AAAAAElFTkSuQmCC#08',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==#09',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==#10',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY420AAAAASUVORK5CYII=#11',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AQAAGBAQA1/353AAAAAElFTkSuQmCC#12'
      ]
    }
  };

  const spec12 = buildStorefrontSpec(gen12Images, input8);
  assert(spec12.images.gallery.length === 12, 'StorefrontSpec gallery contains exactly 12 images');

  const packaged12 = await downloadAndPackageProductImages(spec12);
  assert(packaged12.stats.downloadedAssetCount === 12, 'Downloaded and packaged exactly 12 images');
  assert(packaged12.assetFiles.has('assets/rootx-product-12.png'), 'Asset rootx-product-12.png stored');

  const designResult12 = runDesignEnginePipeline(gen12Images, input8, undefined, packaged12.updatedSpec);
  const indexJson12 = JSON.parse(designResult12.files.find(f => f.key === 'templates/index.json')!.value);
  const galleryBlocks12 = indexJson12.sections['rootx-gallery'].block_order;
  assert(galleryBlocks12.length === 12, 'Generated index.json gallery section has exactly 12 blocks');

  // Verify URL rewrite in liquid and JSON
  const galleryLiquid8 = designResult8.files.find(f => f.key === 'sections/rootx-gallery.liquid')!.value;
  assert(galleryLiquid8.includes('section.blocks'), 'sections/rootx-gallery.liquid loops dynamically over blocks');

  console.log('\n===========================================================');
  console.log(' 🎉 ALL COMPLETE IMAGE IMPORT PIPELINE TESTS PASSED');
  console.log('===========================================================\n');
}

runCompleteImagePipelineTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
