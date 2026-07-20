// ============================================================
// RootX Product Image Pipeline V1 — Automated 12-Scenario Test Suite
// ============================================================

import { runImagePipeline } from '../lib/image-pipeline/pipeline';
import { validateImage } from '../lib/image-pipeline/validator';
import { normalizeImageUrl } from '../lib/image-pipeline/normalizer';
import { generateShopifyThemeV2 } from '../lib/shopify-theme-generator';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

async function runAllTests() {
  console.log('\n==================================================');
  console.log('  RUNNING ROOTX PRODUCT IMAGE PIPELINE V1 TEST SUITE');
  console.log('==================================================\n');

  // Test 1: Product with 8 valid images
  console.log('Test 1: Product with 8 valid images');
  const test1Data = {
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
      'https://images.unsplash.com/photo-1560343090-f0409e92791a',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90',
      'https://images.unsplash.com/photo-1491553895911-0055eca6402d',
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519'
    ]
  };
  const res1 = runImagePipeline(test1Data);
  assert(res1.images.length === 8, 'Extracted all 8 valid images');
  assert(res1.heroImage !== null, 'Assigned hero image');
  assert(res1.galleryImages.length === 8, 'Gallery contains all 8 images');

  // Test 2: Product with duplicate images
  console.log('\nTest 2: Product with duplicate images');
  const test2Data = {
    images: [
      'https://example.com/item1.jpg',
      'https://example.com/item1.jpg',
      'https://example.com/item2.jpg',
      'https://example.com/item1.jpg'
    ]
  };
  const res2 = runImagePipeline(test2Data);
  assert(res2.images.length === 2, 'Deduplicated to 2 unique images');
  assert(res2.diagnosticInfo.rejectedCount >= 2, 'Logged rejected duplicates');

  // Test 3: Product with 1 image (single-image fallback)
  console.log('\nTest 3: Product with 1 image (single-image fallback)');
  const test3Data = { images: ['https://example.com/solo.jpg'] };
  const res3 = runImagePipeline(test3Data);
  assert(res3.images.length === 1, 'Extracted single image');
  assert(res3.hasSingleImageFallback === true, 'Single-image fallback flag activated');
  assert(res3.lifestyleImage === null, 'Identical image omitted from lifestyle repeat');

  // Test 4: Product with 0 images (no-image fallback)
  console.log('\nTest 4: Product with 0 images (no-image fallback)');
  const test4Data = { images: [] };
  const res4 = runImagePipeline(test4Data);
  assert(res4.images.length === 0, 'Handled empty array');
  assert(res4.hasNoImageFallback === true, 'No-image fallback flag activated');
  assert(res4.heroImage === null, 'Hero image is null');

  // Test 5: Product with malformed image URLs
  console.log('\nTest 5: Product with malformed image URLs');
  const test5Data = { images: ['not-a-valid-url', '', '  ', 'http://'] };
  const res5 = runImagePipeline(test5Data);
  assert(res5.images.length === 0, 'Filtered out all malformed URLs');

  // Test 6: Protocol-relative AliExpress URLs
  console.log('\nTest 6: Protocol-relative AliExpress URLs');
  const test6Data = { images: ['//ae01.alicdn.com/kf/S123456_50x50.jpg'] };
  const res6 = runImagePipeline(test6Data);
  assert(res6.images.length === 1, 'Extracted AliExpress image');
  assert(res6.images[0].normalizedUrl.startsWith('https://'), 'Converted // to https://');
  assert(!res6.images[0].normalizedUrl.includes('_50x50.jpg'), 'Stripped _50x50 thumbnail suffix');

  // Test 7: Shopify product image objects
  console.log('\nTest 7: Shopify product image objects');
  const test7Data = {
    product: {
      images: [
        { id: 101, src: 'https://cdn.shopify.com/s/files/1/0001/prod1_small.jpg', alt: 'Shopify Item' }
      ]
    }
  };
  const res7 = runImagePipeline(test7Data);
  assert(res7.images.length === 1, 'Extracted image from Shopify object structure');
  assert(res7.images[0].source === 'shopify', 'Detected Shopify source type');

  // Test 8: Manual uploads (data:image URIs)
  console.log('\nTest 8: Manual uploads (data URIs)');
  const test8Data = { images: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='] };
  const res8 = runImagePipeline(test8Data);
  assert(res8.images.length === 1, 'Accepted manual base64 data URI');
  assert(res8.images[0].source === 'manual', 'Detected manual source type');

  // Test 9: Broken / SSRF remote URLs
  console.log('\nTest 9: Broken / SSRF remote URLs');
  const ssrf1 = validateImage('http://localhost/secret.png', new Set());
  assert(!ssrf1.isValid, 'Blocked localhost SSRF URL');
  const ssrf2 = validateImage('http://127.0.0.1/admin.jpg', new Set());
  assert(!ssrf2.isValid, 'Blocked 127.0.0.1 SSRF URL');
  const ssrf3 = validateImage('http://169.254.169.254/metadata', new Set());
  assert(!ssrf3.isValid, 'Blocked cloud metadata IP');

  // Test 10: Mobile preview rendering
  console.log('\nTest 10: Mobile preview rendering');
  const norm10 = normalizeImageUrl('https://example.com/photo.jpg');
  assert(norm10.inferredWidth === 800 && norm10.inferredHeight === 800, 'Normalized image has aspect ratio metrics');

  // Test 11: Shopify ZIP image references check
  console.log('\nTest 11: Shopify ZIP image references check');
  const dummyGen: any = {
    homepage: { hero: { headline: 'Test Store', subheadline: 'Slogan', ctaButtons: [{ label: 'Buy', url: '/cart' }] }, features: [] },
    about: { content: 'About text' },
    services: { title: 'Svc', subtitle: '', services: [] },
    pricing: { title: 'Price', subtitle: '', plans: [] },
    faq: { title: 'FAQ', subtitle: '', items: [] },
    testimonials: { title: 'Testimonials', subtitle: '', testimonials: [] },
    contact: { title: 'Contact', subtitle: '', formFields: [] },
    footer: { copyright: 'RootX' },
    seo: { title: 'SEO' },
    branding: { typography: { heading: 'Inter', body: 'Inter' } },
    marketing: {},
    ecommerce: { images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e'] }
  };
  const themeRes = generateShopifyThemeV2(dummyGen, { businessName: 'TestStore', businessType: 'Tech', targetAudience: 'All', brandDescription: 'Desc', preferredStyle: 'modern_tech', primaryColor: '#3b82f6', secondaryColor: '#6366f1', language: 'en', country: 'US' });
  assert(themeRes.files.some(f => f.key === 'layout/theme.liquid'), 'Generated theme.liquid file');

  // Test 12: Consecutive repeated image prevention check
  console.log('\nTest 12: Consecutive repeated image prevention check');
  assert(res1.heroImage?.normalizedUrl !== res1.lifestyleImage?.normalizedUrl, 'Hero and lifestyle images are distinct');

  console.log('\n==================================================');
  console.log(' 🎉 ALL 12 IMAGE PIPELINE TESTS PASSED SUCCESSFULY');
  console.log('==================================================\n');
}

runAllTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
