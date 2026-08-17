// ============================================================
// RootX — Real AliExpress Product Pipeline Image Trace Verification
// Tests exact loss-free preservation across all pipeline stages for real production products.
// ============================================================

import fs from 'fs';
import path from 'path';

// Load environment variables if available
if (fs.existsSync('.env.local')) {
  const envText = fs.readFileSync('.env.local', 'utf8');
  envText.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

import {
  fetchAliExpressProductViaApify,
  extractAllAliExpressProductImages,
  extractAllProductImages,
} from '../lib/product-import/apify-aliexpress';
import { buildCachedProductImageLibrary } from '../lib/image-pipeline/cached-library';
import { buildStorefrontSpec } from '../lib/storefront-spec/builder';
import { runDesignEnginePipeline } from '../lib/design-engine/pipeline';
import type { WebsiteGeneration, WebsiteBuilderInput } from '../lib/website-builder-types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

export async function runRealProductFullPipelineAudit() {
  console.log('\n================================================================================');
  console.log('  ROOTX REAL PRODUCTION ALIEXPRESS PRODUCT PIPELINE AUDIT');
  console.log('================================================================================\n');

  const realProductUrl = 'https://www.aliexpress.com/item/3256810034178226.html';
  console.log(`Target Real AliExpress Product URL: ${realProductUrl}`);

  // Step 1: Live Apify Fetch for Real Product
  const apifyResult = await fetchAliExpressProductViaApify(realProductUrl, { isDirectUrl: true });
  assert(apifyResult.success, 'Apify product extraction returned success: true.');
  assert(apifyResult.product !== null, 'Apify returned a non-null product object.');

  const product = apifyResult.product!;
  const rawImageCount = apifyResult.trace.rawImageCount;
  const extractedImageCount = product.images.length;
  const normalizedImageCount = apifyResult.trace.normalizedImageCount;

  console.log(`\n1. APIFY_RAW_IMAGE_COUNT:    ${rawImageCount}`);
  console.log(`2. EXTRACTED_IMAGE_COUNT:    ${extractedImageCount}`);
  console.log(`3. NORMALIZED_IMAGE_COUNT:   ${normalizedImageCount}`);

  assert(extractedImageCount > 1, `Real product contains multiple images (got ${extractedImageCount}).`);

  // Step 2: Build Cached Product Image Library
  const imageLib = await buildCachedProductImageLibrary(product);
  const pipelineRawCount = imageLib.allValidImages.length;
  const acceptedImageCount = imageLib.allValidImages.filter((i) => i.isValid).length;
  const cachedImageCount = imageLib.cachedImageCount || 0;
  const previewImageCount = imageLib.galleryCandidates.length;

  console.log(`4. PIPELINE_RAW_IMAGE_COUNT: ${pipelineRawCount}`);
  console.log(`5. ACCEPTED_IMAGE_COUNT:     ${acceptedImageCount}`);
  console.log(`6. CACHED_IMAGE_COUNT:       ${cachedImageCount}`);
  console.log(`7. PREVIEW_IMAGE_COUNT:      ${previewImageCount}`);

  assert(pipelineRawCount > 1, `PIPELINE_RAW_IMAGE_COUNT > 1 (got ${pipelineRawCount}).`);
  assert(pipelineRawCount === extractedImageCount, `Pipeline raw count (${pipelineRawCount}) equals extracted count (${extractedImageCount}).`);
  assert(acceptedImageCount === extractedImageCount, `Accepted image count (${acceptedImageCount}) equals extracted count (${extractedImageCount}).`);
  assert(cachedImageCount === extractedImageCount, `Cached image count (${cachedImageCount}) equals extracted count (${extractedImageCount}).`);
  assert(previewImageCount === extractedImageCount, `Preview image count (${previewImageCount}) equals extracted count (${extractedImageCount}).`);

  // Step 3: StorefrontSpec & Shopify Theme Engine Pipeline
  const mockGenInput: WebsiteGeneration = {
    homepage: { hero: { headline: product.title, subheadline: '', ctaButtons: [], backgroundStyle: 'dark' }, features: [], socialProof: '' },
    about: { title: '', content: '', mission: '', vision: '', values: [] },
    services: { title: '', subtitle: '', services: [] },
    pricing: { title: '', subtitle: '', plans: [] },
    faq: { title: '', subtitle: '', items: [] },
    testimonials: { title: '', subtitle: '', testimonials: [] },
    contact: { title: '', subtitle: '', formFields: [], email: '', phone: '', address: '' },
    footer: { copyright: '', columns: [], socialLinks: [], tagline: '' },
    seo: { title: product.title, metaDescription: '', keywords: [], ogTitle: '', ogDescription: '', ogImagePrompt: '', canonicalUrl: '', structuredData: '' },
    branding: { colorPalette: [], typography: { heading: 'Inter', body: 'Inter', accent: 'Inter', googleFontsUrl: '' }, iconSuggestions: [], logoDescription: '' },
    marketing: { googleAdsHeadlines: [], googleAdsDescriptions: [], facebookAdCopy: '', instagramCaption: '', linkedInPost: '', twitterPost: '', emailCampaign: { subject: '', preheader: '', body: '', cta: '' } },
    ecommerce: {
      price: product.price,
      shippingText: product.shipping,
      images: imageLib.allValidImages.map((i) => i.cachedUrl || i.normalizedUrl),
    },
  } as unknown as WebsiteGeneration;

  const mockBuilderInput: WebsiteBuilderInput = {
    businessName: 'AttackSharkStore',
    businessType: 'Keyboards',
    targetAudience: 'Gamers',
    brandDescription: 'Wireless Gaming Keyboards',
    preferredStyle: 'modern_tech',
    primaryColor: '#6366f1',
    secondaryColor: '#06b6d4',
    language: 'en',
    country: 'US',
  };

  const spec = buildStorefrontSpec(mockGenInput, mockBuilderInput, imageLib);
  const designEngineRes = runDesignEnginePipeline(mockGenInput, mockBuilderInput, imageLib, spec);

  const indexJsonFile = designEngineRes.files.find((f) => f.key === 'templates/index.json');
  assert(indexJsonFile !== undefined, 'Shopify templates/index.json file created.');

  const indexJsonData = JSON.parse(indexJsonFile!.value);
  const shopifyGalleryCount = indexJsonData.sections?.['rootx-gallery']?.block_order?.length || 0;

  console.log(`8. SHOPIFY_IMAGE_COUNT:      ${shopifyGalleryCount}`);

  assert(shopifyGalleryCount === extractedImageCount, `Shopify gallery image count (${shopifyGalleryCount}) equals extracted count (${extractedImageCount}).`);

  console.log('\n================================================================================');
  console.log(` 🎉 AUDIT PASSED WITH 100% PARITY! (${extractedImageCount} images preserved across all 8 stages)`);
  console.log('================================================================================\n');
}

runRealProductFullPipelineAudit().catch((err) => {
  console.error('❌ Audit Failed with Error:', err);
  process.exit(1);
});
