// ============================================================
// RootX Storefront Image Assignment Audit & Diagnostics Test
// Tests image assignments for the real AliExpress product visible in RootX.
// ============================================================

import fs from 'fs';

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

import { fetchAliExpressProductViaApify } from '../lib/product-import/apify-aliexpress';
import { buildCachedProductImageLibrary } from '../lib/image-pipeline/library-builder';
import { buildStorefrontSpec } from '../lib/storefront-spec/builder';
import { resolveRenderableImage } from '../lib/image-pipeline/resolve-image';
import { calculateStorefrontImageDiagnostics } from '../lib/storefront-spec/diagnostics';
import { runDesignEnginePipeline } from '../lib/design-engine/pipeline';
import type { WebsiteGeneration, WebsiteBuilderInput } from '../lib/website-builder-types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

async function auditRealProductAssignments() {
  console.log('\n================================================================================');
  console.log('  ROOTX REAL PRODUCT STOREFRONT IMAGE ASSIGNMENTS AUDIT');
  console.log('================================================================================\n');

  const realProductUrl = 'https://www.aliexpress.com/item/3256810034178226.html';
  console.log(`Fetching real product payload from Apify for: ${realProductUrl}`);

  const apifyResult = await fetchAliExpressProductViaApify(realProductUrl, { isDirectUrl: true });
  assert(apifyResult.success, 'Apify product extraction returned success.');
  assert(apifyResult.product !== null, 'Apify product payload is non-null.');

  const product = apifyResult.product!;
  const imageLib = await buildCachedProductImageLibrary(product);

  console.log(`\nProductImageLibrary.length: ${imageLib.allValidImages.length}`);
  assert(imageLib.allValidImages.length > 1, `ProductImageLibrary.length > 1 (got ${imageLib.allValidImages.length}).`);

  console.log('\nProductImageLibrary URLs:');
  imageLib.allValidImages.forEach((img, idx) => {
    console.log(`  [${idx}] ${resolveRenderableImage(img)}`);
  });

  const mockGenInput: WebsiteGeneration = {
    homepage: { hero: { headline: product.title, subheadline: '', ctaButtons: [], backgroundStyle: 'dark' }, features: [], socialProof: '' },
    about: { title: 'Story', content: product.description || 'Keyboard story', mission: '', vision: '', values: [] },
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
  const designResult = runDesignEnginePipeline(mockGenInput, mockBuilderInput, imageLib, spec);

  const diagnostics = calculateStorefrontImageDiagnostics(spec);

  console.log('\n================================================================================');
  console.log('  EXACT SECTION -> IMAGE MAPPING');
  console.log('================================================================================');
  console.log(`hero image assignment:            ${diagnostics.exactMapping.hero}`);
  console.log(`image-story assignment:           ${diagnostics.exactMapping.story}`);
  console.log(`product-showcase assignment:      ${diagnostics.exactMapping.featured}`);
  console.log(`final CTA image assignment:       ${diagnostics.exactMapping.finalCta}`);
  console.log(`gallery image assignments (${(diagnostics.exactMapping.gallery as string[]).length} images):`);
  (diagnostics.exactMapping.gallery as string[]).forEach((url, i) => {
    console.log(`  gallery[${i}]: ${url}`);
  });

  console.log('\n================================================================================');
  console.log('  REQUIRED DIAGNOSTIC METRICS');
  console.log('================================================================================');
  console.log(`LIBRARY_IMAGES:    ${diagnostics.libraryImagesCount}`);
  console.log(`ASSIGNED_IMAGES:   ${diagnostics.assignedImagesCount}`);
  console.log(`UNASSIGNED_IMAGES: ${diagnostics.unassignedImagesCount}`);
  console.log(`EMPTY_IMAGE_SLOTS: ${diagnostics.emptyImageSlotsCount}`);

  assert(diagnostics.libraryImagesCount > 1, `LIBRARY_IMAGES > 1 (got ${diagnostics.libraryImagesCount}).`);
  assert(diagnostics.assignedImagesCount > 1, `ASSIGNED_IMAGES > 1 (got ${diagnostics.assignedImagesCount}).`);
  assert(diagnostics.emptyImageSlotsCount === 0, `EMPTY_IMAGE_SLOTS === 0 (got ${diagnostics.emptyImageSlotsCount}).`);

  const indexJsonFile = designResult.files.find((f) => f.key === 'templates/index.json');
  const indexJson = indexJsonFile ? JSON.parse(indexJsonFile.value) : { sections: {} };
  const shopifyGalleryCount = indexJson.sections?.['rootx-gallery']?.block_order?.length || 0;

  console.log(`\nSHOPIFY_GALLERY_COUNT: ${shopifyGalleryCount}`);
  assert(shopifyGalleryCount === imageLib.allValidImages.length, `SHOPIFY_GALLERY_COUNT (${shopifyGalleryCount}) equals ProductImageLibrary.length (${imageLib.allValidImages.length}).`);

  console.log('\n================================================================================');
  console.log(' 🎉 STOREFRONT IMAGE ASSIGNMENT AUDIT PASSED WITH ZERO EMPTY SLOTS!');
  console.log('================================================================================\n');
}

auditRealProductAssignments().catch((err) => {
  console.error('❌ Audit Failed:', err);
  process.exit(1);
});
