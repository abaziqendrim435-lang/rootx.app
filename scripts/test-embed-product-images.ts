// ============================================================
// RootX Automated Test Suite — Embed Product Images into Shopify ZIP
// Validates server-side downloader, local asset packaging,
// StorefrontSpec mapping, Liquid asset_url filters, fallback rules,
// and pre-export remote URL leakage audit.
// ============================================================

import { buildStorefrontSpec } from '../lib/storefront-spec/builder';
import { downloadAndPackageProductImages } from '../lib/image-pipeline/asset-downloader';
import { runDesignEnginePipeline } from '../lib/design-engine/pipeline';
import type { WebsiteGeneration, WebsiteBuilderInput } from '../lib/website-builder-types';
import type { NormalizedImage } from '../lib/image-pipeline/types';
import JSZip from 'jszip';

function createMockImage(id: string, url: string, role: NormalizedImage['role'] = 'product-gallery'): NormalizedImage {
  return {
    id,
    originalUrl: url,
    normalizedUrl: url,
    width: 800,
    height: 800,
    aspectRatio: 1.0,
    source: 'remote',
    altText: `Mock Image ${id}`,
    role,
    qualityScore: 90,
    isValid: true,
  };
}

function createBaseGen(): WebsiteGeneration {
  return {
    homepage: {
      hero: {
        headline: 'Transform Your Skin Routine Today',
        subheadline: 'Experience luminous skin with our clinically proven organic elixir formula.',
        ctaButtons: [{ label: 'Shop Now', url: '/cart', variant: 'primary' }],
        backgroundStyle: 'clean',
      },
      features: [{ title: 'Organic', description: 'Natural formula', icon: '✨' }],
      socialProof: 'Loved by thousands of happy customers',
    },
    ecommerce: {
      productTitle: 'Radiant Glow Organic Serum',
      productSubtitle: 'Pure Organic Elixir Formula',
      productDescription: 'High quality organic serum for glowing radiant skin.',
      productPrice: '$49.99',
      comparePrice: '$69.99',
      rating: 4.9,
      reviewCount: 128,
      inStock: true,
      sku: 'RG-01',
      images: [SAMPLE_PNG_BASE64, SAMPLE_WEBP_BASE64],
      keyBenefits: ['100% Organic', 'Dermatologist Tested'],
      trustBadges: ['Cruelty Free', 'Dermatologist Approved'],
      shippingText: 'Free Express Shipping',
      featureSections: [],
      specifications: [{ label: 'Volume', value: '50ml' }],
      howItWorks: [],
      faq: [{ question: 'How often should I use this?', answer: 'Apply twice daily' }],
      reviews: [],
      stickyAddToCartText: 'Buy Now',
    },
  } as unknown as WebsiteGeneration;
}

function createBaseInput(): WebsiteBuilderInput {
  return {
    businessName: 'Radiant Glow',
    brandDescription: 'High quality organic serum for glowing radiant skin.',
    businessType: 'Beauty & Skincare',
    targetAudience: 'Skincare Enthusiasts',
    language: 'en',
    country: 'US',
    primaryColor: '#ec4899',
    secondaryColor: '#f43f5e',
    preferredStyle: 'soft_beauty',
  };
}

// 1x1 1-byte PNG base64 helper
const SAMPLE_PNG_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const SAMPLE_WEBP_BASE64 = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
const SAMPLE_JPG_BASE64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail: string = '') {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName} — ${detail}`);
    failed++;
  }
}

async function runTests() {
  console.log('============================================================');
  console.log('RUNNING ROOTX EMBED PRODUCT IMAGES TEST SUITE');
  console.log('============================================================\n');

  // Scenario 1: 1 Valid Image
  try {
    const gen = createBaseGen();
    const input = createBaseInput();
    const mockImages = [createMockImage('1', SAMPLE_PNG_BASE64, 'hero')];
    const spec = buildStorefrontSpec(gen, input, {
      allValidImages: mockImages,
      heroCandidates: mockImages,
      galleryCandidates: mockImages,
      lifestyleCandidates: [],
      detailCandidates: [],
      rejectedImages: [],
      imageMetadata: {},
      originalSourceCount: 1,
      validUniqueCount: 1,
    });

    const packaged = await downloadAndPackageProductImages(spec);
    assert(packaged.stats.downloadedAssetCount === 1, '1 Valid Image: Asset Count', `Expected 1, got ${packaged.stats.downloadedAssetCount}`);
    assert(packaged.assetFiles.has('assets/rootx-product-01.png'), '1 Valid Image: Filename', 'Expected assets/rootx-product-01.png');
    assert(packaged.updatedSpec.images.hero?.exportedAssetName === 'rootx-product-01.png', '1 Valid Image: Spec Hero Asset', 'Hero asset missing');
  } catch (err: any) {
    assert(false, '1 Valid Image Exception', err?.stack || String(err));
  }

  // Scenario 2: 6 Valid Images
  try {
    const gen = createBaseGen();
    const input = createBaseInput();
    const mockImages = Array.from({ length: 6 }, (_, i) =>
      createMockImage(String(i + 1), SAMPLE_PNG_BASE64.replace('iVBORw0KGgo', `iVBORw0KGg${i}`), i === 0 ? 'hero' : 'product-gallery')
    );

    const spec = buildStorefrontSpec(gen, input, {
      allValidImages: mockImages,
      heroCandidates: [mockImages[0]],
      galleryCandidates: mockImages.slice(1),
      lifestyleCandidates: [],
      detailCandidates: [],
      rejectedImages: [],
      imageMetadata: {},
      originalSourceCount: 6,
      validUniqueCount: 6,
    });

    const packaged = await downloadAndPackageProductImages(spec);
    assert(packaged.stats.downloadedAssetCount === 6, '6 Valid Images: Asset Count', `Expected 6, got ${packaged.stats.downloadedAssetCount}`);
    assert(packaged.stats.generatedAssetFilenames.length === 6, '6 Valid Images: Generated Filenames', `Expected 6 filenames, got ${packaged.stats.generatedAssetFilenames.length}`);
    assert(packaged.assetFiles.has('assets/rootx-product-06.png'), '6 Valid Images: Asset 06 Exists', 'Missing rootx-product-06.png');
  } catch (err: unknown) {
    assert(false, '6 Valid Images Exception', String(err));
  }

  // Scenario 3: Duplicate Images Handling
  try {
    const gen = createBaseGen();
    const input = createBaseInput();
    const mockImages = [
      createMockImage('1', SAMPLE_PNG_BASE64, 'hero'),
      createMockImage('2', SAMPLE_PNG_BASE64, 'product-gallery'), // Duplicate URL
      createMockImage('3', SAMPLE_WEBP_BASE64, 'product-gallery'),
    ];

    const spec = buildStorefrontSpec(gen, input, {
      allValidImages: mockImages,
      heroCandidates: [mockImages[0]],
      galleryCandidates: mockImages.slice(1),
      lifestyleCandidates: [],
      detailCandidates: [],
      rejectedImages: [],
      imageMetadata: {},
      originalSourceCount: 3,
      validUniqueCount: 3,
    });

    const packaged = await downloadAndPackageProductImages(spec);
    assert(packaged.stats.downloadedAssetCount === 2, 'Duplicate Images: Unique Asset Count', `Expected 2 unique assets, got ${packaged.stats.downloadedAssetCount}`);
  } catch (err: unknown) {
    assert(false, 'Duplicate Images Exception', String(err));
  }

  // Scenario 4: One Failed Image Download Fallback
  try {
    const gen = createBaseGen();
    const input = createBaseInput();
    const mockImages = [
      createMockImage('1', SAMPLE_PNG_BASE64, 'hero'),
      createMockImage('2', 'https://invalid-nonexistent-domain-404.org/image.jpg', 'product-gallery'), // Will fail fetch
      createMockImage('3', SAMPLE_WEBP_BASE64, 'product-gallery'),
    ];

    const spec = buildStorefrontSpec(gen, input, {
      allValidImages: mockImages,
      heroCandidates: [mockImages[0]],
      galleryCandidates: mockImages.slice(1),
      lifestyleCandidates: [],
      detailCandidates: [],
      rejectedImages: [],
      imageMetadata: {},
      originalSourceCount: 3,
      validUniqueCount: 3,
    });

    const packaged = await downloadAndPackageProductImages(spec);
    assert(packaged.stats.downloadedAssetCount === 2, 'One Failed Download: Downloaded Count', `Expected 2 succeeded, got ${packaged.stats.downloadedAssetCount}`);
    assert(packaged.stats.failedImageCount === 1, 'One Failed Download: Failed Count', `Expected 1 failed, got ${packaged.stats.failedImageCount}`);
    assert(packaged.updatedSpec.images.gallery.length === 2, 'One Failed Download: Gallery Length', `Expected 2 gallery images remaining, got ${packaged.updatedSpec.images.gallery.length}`);
  } catch (err: unknown) {
    assert(false, 'One Failed Download Exception', String(err));
  }

  // Scenario 5: All Downloads Failed Exception
  try {
    const gen = createBaseGen();
    const input = createBaseInput();
    const mockImages = [
      createMockImage('1', 'https://invalid-nonexistent-domain-404.org/1.jpg', 'hero'),
      createMockImage('2', 'https://invalid-nonexistent-domain-404.org/2.jpg', 'product-gallery'),
    ];

    const spec = buildStorefrontSpec(gen, input, {
      allValidImages: mockImages,
      heroCandidates: [mockImages[0]],
      galleryCandidates: [mockImages[1]],
      lifestyleCandidates: [],
      detailCandidates: [],
      rejectedImages: [],
      imageMetadata: {},
      originalSourceCount: 2,
      validUniqueCount: 2,
    });

    let caughtError = false;
    try {
      await downloadAndPackageProductImages(spec);
    } catch (err: unknown) {
      caughtError = true;
      assert(String(err).includes('Export Failed'), 'All Downloads Failed: Clear Error Message', String(err));
    }
    assert(caughtError, 'All Downloads Failed: Exception Thrown', 'Should have thrown exception when all downloads fail');
  } catch (err: unknown) {
    assert(false, 'All Downloads Failed Exception', String(err));
  }

  // Scenario 6: WEBP & JPG Support
  try {
    const gen = createBaseGen();
    const input = createBaseInput();
    const mockImages = [
      createMockImage('1', SAMPLE_JPG_BASE64, 'hero'),
      createMockImage('2', SAMPLE_WEBP_BASE64, 'product-gallery'),
    ];

    const spec = buildStorefrontSpec(gen, input, {
      allValidImages: mockImages,
      heroCandidates: [mockImages[0]],
      galleryCandidates: [mockImages[1]],
      lifestyleCandidates: [],
      detailCandidates: [],
      rejectedImages: [],
      imageMetadata: {},
      originalSourceCount: 2,
      validUniqueCount: 2,
    });

    const packaged = await downloadAndPackageProductImages(spec);
    assert(packaged.assetFiles.has('assets/rootx-product-01.jpg'), 'WEBP & JPG Support: JPG Ext', 'Missing rootx-product-01.jpg');
    assert(packaged.assetFiles.has('assets/rootx-product-02.webp'), 'WEBP & JPG Support: WEBP Ext', 'Missing rootx-product-02.webp');
  } catch (err: unknown) {
    assert(false, 'WEBP & JPG Support Exception', String(err));
  }

  // Scenario 7: Asset Filename Mapping (exportedAssetName)
  try {
    const gen = createBaseGen();
    const input = createBaseInput();
    const mockImages = [
      createMockImage('1', SAMPLE_PNG_BASE64, 'hero'),
      createMockImage('2', SAMPLE_WEBP_BASE64, 'product-gallery'),
    ];

    const spec = buildStorefrontSpec(gen, input, {
      allValidImages: mockImages,
      heroCandidates: [mockImages[0]],
      galleryCandidates: [mockImages[1]],
      lifestyleCandidates: [],
      detailCandidates: [],
      rejectedImages: [],
      imageMetadata: {},
      originalSourceCount: 2,
      validUniqueCount: 2,
    });

    const packaged = await downloadAndPackageProductImages(spec);
    assert(packaged.updatedSpec.images.hero?.exportedAssetName === 'rootx-product-01.png', 'Asset Mapping: Hero exportedAssetName', 'Hero mapping failed');
    assert(packaged.updatedSpec.images.gallery.some(img => img.exportedAssetName === 'rootx-product-02.webp'), 'Asset Mapping: Gallery exportedAssetName', 'Gallery mapping failed');
  } catch (err: any) {
    assert(false, 'Asset Mapping Exception', err?.stack || String(err));
  }

  // Scenario 8: ZIP Packaging & Liquid asset_url Filters
  try {
    const gen = createBaseGen();
    const input = createBaseInput();
    const mockImages = [
      createMockImage('1', SAMPLE_PNG_BASE64, 'hero'),
      createMockImage('2', SAMPLE_WEBP_BASE64, 'product-gallery'),
    ];

    const spec = buildStorefrontSpec(gen, input, {
      allValidImages: mockImages,
      heroCandidates: [mockImages[0]],
      galleryCandidates: [mockImages[1]],
      lifestyleCandidates: [],
      detailCandidates: [],
      rejectedImages: [],
      imageMetadata: {},
      originalSourceCount: 2,
      validUniqueCount: 2,
    });

    const packaged = await downloadAndPackageProductImages(spec);
    const designResult = runDesignEnginePipeline(gen, input, undefined, packaged.updatedSpec);

    const fileMap = new Map<string, string>();
    designResult.files.forEach(f => fileMap.set(f.key, f.value));

    // Check Liquid files for asset_url filter
    const heroLiquid = fileMap.get('sections/rootx-hero.liquid') || '';
    assert(heroLiquid.includes("rootx-product-01.png' | asset_url"), 'Liquid Filter: rootx-hero.liquid asset_url', 'Hero liquid missing asset_url filter');

    const galleryLiquid = fileMap.get('sections/rootx-gallery.liquid') || '';
    assert(galleryLiquid.includes("asset_url"), 'Liquid Filter: rootx-gallery.liquid asset_url', 'Gallery liquid missing asset_url filter');

    // Create JSZip to test zip packaging
    const zip = new JSZip();
    fileMap.forEach((val, key) => zip.file(key, val));
    packaged.assetFiles.forEach((buf, path) => zip.file(path, buf));

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    assert(zipBuffer.length > 0, 'ZIP Packaging: Non-zero ZIP size', `ZIP size is ${zipBuffer.length} bytes`);
    assert(zip.file('assets/rootx-product-01.png') !== null, 'ZIP Packaging: asset 01 in zip', 'Missing rootx-product-01.png in ZIP');
    assert(zip.file('assets/rootx-product-02.webp') !== null, 'ZIP Packaging: asset 02 in zip', 'Missing rootx-product-02.webp in ZIP');
  } catch (err: any) {
    assert(false, 'ZIP Packaging & Liquid Filter Exception', err?.stack || String(err));
  }

  // Scenario 9: Zero Remote CDN Leakage Audit
  try {
    const gen = createBaseGen();
    const input = createBaseInput();
    const mockImages = [
      createMockImage('1', SAMPLE_PNG_BASE64, 'hero'),
      createMockImage('2', SAMPLE_WEBP_BASE64, 'product-gallery'),
    ];

    const spec = buildStorefrontSpec(gen, input, {
      allValidImages: mockImages,
      heroCandidates: [mockImages[0]],
      galleryCandidates: [mockImages[1]],
      lifestyleCandidates: [],
      detailCandidates: [],
      rejectedImages: [],
      imageMetadata: {},
      originalSourceCount: 2,
      validUniqueCount: 2,
    });

    const packaged = await downloadAndPackageProductImages(spec);
    const designResult = runDesignEnginePipeline(gen, input, undefined, packaged.updatedSpec);

    const remoteCdnRegex = /(https?:\/\/)?([a-zA-Z0-9-]+\.)*(alicdn\.com|aliexpress\.com|ae-pic|ae01\.alicdn)/i;
    let leaksFound = 0;

    for (const f of designResult.files) {
      if (typeof f.value === 'string' && remoteCdnRegex.test(f.value)) {
        leaksFound++;
        console.error(`Leak detected in ${f.key}`);
      }
    }

    assert(leaksFound === 0, 'Zero Remote URL Leakage Audit', `Found ${leaksFound} CDN domain leaks in exported theme files`);
  } catch (err: any) {
    assert(false, 'Zero Remote URL Leakage Exception', err?.stack || String(err));
  }

  console.log('\n============================================================');
  console.log(`TEST RESULTS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
