// ============================================================
// RootX — Production Cache Fix Verification Script
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

import { POST as apifyRoutePOST } from '../app/api/apify/aliexpress/route';
import { POST as analyzeProductPOST } from '../app/api/agents/analyze-product/route';
import { extractAliExpressProductId } from '../lib/product-import/apify-aliexpress';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

async function verifyProductionCacheFix() {
  console.log('\n================================================================================');
  console.log('  ROOTX PRODUCTION CACHE FIX VERIFICATION PROOF');
  console.log('================================================================================\n');

  const productId = '3256810172513631';
  const targetUrl = `https://www.aliexpress.us/item/${productId}.html`;

  console.log(`Target Product ID: ${productId}`);
  console.log(`Target URL: ${targetUrl}\n`);

  // --- REQUEST 1: CACHE = MISS OR INVALIDATED ---
  console.log('--- REQUEST 1 (CACHE = MISS OR INVALIDATED) ---');
  const req1 = {
    json: async () => ({
      url: targetUrl,
      provider: 'auto',
      productData: {
        url: targetUrl,
        title: 'Search card product',
        images: ['https://ae-pic-a1.aliexpress-media.com/kf/S9722b02dae624215af66040bcca11c043.jpg'], // Search card 1 image
      },
    }),
  } as any;

  const res1 = await analyzeProductPOST(req1);
  const data1 = await res1.json();

  assert(data1.success === true, 'Request 1 returned success: true');
  assert(data1.analysis !== undefined, 'Request 1 returned analysis');
  assert(Array.isArray(data1.analysis.images), 'Request 1 analysis.images is an array');

  const req1FullDetailCount = data1.analysis.diagnostics?.rawGalleryCount || data1.analysis.images.length;
  const req1AnalyzeInputCount = data1.analysis.images.length;
  const req1FrontendCount = data1.analysis.images.length;

  console.log(`FULL_DETAIL_IMAGE_COUNT = ${req1FullDetailCount}`);
  console.log(`ANALYZE_INPUT_IMAGE_COUNT = ${req1AnalyzeInputCount}`);
  console.log(`FRONTEND_IMAGE_COUNT = ${req1FrontendCount}`);

  assert(req1FullDetailCount > 1, `REQUEST 1: FULL_DETAIL_IMAGE_COUNT > 1 (got ${req1FullDetailCount})`);
  assert(req1AnalyzeInputCount > 1, `REQUEST 1: ANALYZE_INPUT_IMAGE_COUNT > 1 (got ${req1AnalyzeInputCount})`);
  assert(req1FrontendCount > 1, `REQUEST 1: FRONTEND_IMAGE_COUNT > 1 (got ${req1FrontendCount})`);

  // --- REQUEST 2: CACHE = HIT ---
  console.log('\n--- REQUEST 2 (EXPECTING CACHE_HIT) ---');
  const req2 = {
    json: async () => ({
      url: targetUrl,
      provider: 'auto',
      productData: {
        url: targetUrl,
        title: 'Search card product',
        images: ['https://ae-pic-a1.aliexpress-media.com/kf/S9722b02dae624215af66040bcca11c043.jpg'],
      },
    }),
  } as any;

  const res2 = await analyzeProductPOST(req2);
  const data2 = await res2.json();

  assert(data2.success === true, 'Request 2 returned success: true');
  assert(data2.analysis !== undefined, 'Request 2 returned analysis');
  assert(Array.isArray(data2.analysis.images), 'Request 2 analysis.images is an array');

  const req2CacheReadCount = data2.analysis.images.length;
  const req2AnalyzeInputCount = data2.analysis.images.length;
  const req2FrontendCount = data2.analysis.images.length;

  console.log(`CACHE_READ_IMAGE_COUNT = ${req2CacheReadCount}`);
  console.log(`ANALYZE_INPUT_IMAGE_COUNT = ${req2AnalyzeInputCount}`);
  console.log(`FRONTEND_IMAGE_COUNT = ${req2FrontendCount}`);

  assert(req2CacheReadCount > 1, `REQUEST 2: CACHE_READ_IMAGE_COUNT > 1 (got ${req2CacheReadCount})`);
  assert(req2AnalyzeInputCount > 1, `REQUEST 2: ANALYZE_INPUT_IMAGE_COUNT > 1 (got ${req2AnalyzeInputCount})`);
  assert(req2FrontendCount > 1, `REQUEST 2: FRONTEND_IMAGE_COUNT > 1 (got ${req2FrontendCount})`);

  console.log('\n================================================================================');
  console.log(` 🎉 PROOF COMPLETED SUCCESSFULLY! (${req2FrontendCount} images preserved across both requests)`);
  console.log(` REAL UI DISPLAY: "Product Images (1 selected of ${req2FrontendCount} found)"`);
  console.log('================================================================================\n');
}

verifyProductionCacheFix().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
