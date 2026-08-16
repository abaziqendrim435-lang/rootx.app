// ============================================================
// RootX — Product Cache V2 Double-Request Verification Test
// Verifies cache miss (1st request) and cache hit (2nd request)
// both preserve identical product.images arrays.
// ============================================================

import fs from 'fs';

// Load environment variables if present
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

import { POST as analyzeProductPOST } from '../app/api/agents/analyze-product/route';
import { extractAliExpressProductId } from '../lib/product-import/apify-aliexpress';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

async function runCacheV2Test() {
  console.log('\n================================================================================');
  console.log('  ROOTX PRODUCT CACHE V2 DOUBLE-REQUEST VERIFICATION TEST');
  console.log('================================================================================\n');

  const testProductUrl = 'https://www.aliexpress.com/item/3256810034178226.html';
  const productId = extractAliExpressProductId(testProductUrl);
  const expectedCacheKey = `product:v2:${productId || '3256810034178226'}`;

  console.log(`Target URL: ${testProductUrl}`);
  console.log(`Extracted Product ID: ${productId}`);
  console.log(`Expected Versioned Cache Key: ${expectedCacheKey}\n`);

  // Request 1: Expect CACHE_MISS
  console.log('--- FIRST REQUEST (Expecting CACHE_MISS) ---');
  const req1 = {
    json: async () => ({
      url: testProductUrl,
      provider: 'auto',
    }),
  } as any;

  const res1 = await analyzeProductPOST(req1);
  const data1 = await res1.json();

  assert(data1.success === true, 'Request 1 succeeded');
  assert(data1.analysis !== undefined, 'Request 1 returned analysis object');
  assert(Array.isArray(data1.analysis.images), 'Request 1 analysis.images is an array');
  const req1ImageCount = data1.analysis.images.length;
  console.log(`Request 1 Image Count: ${req1ImageCount}`);
  assert(req1ImageCount > 1, `Request 1 extracted multiple images (got ${req1ImageCount})`);

  // Request 2: Expect CACHE_HIT
  console.log('\n--- SECOND REQUEST (Expecting CACHE_HIT) ---');
  const req2 = {
    json: async () => ({
      url: testProductUrl,
      provider: 'auto',
    }),
  } as any;

  const res2 = await analyzeProductPOST(req2);
  const data2 = await res2.json();

  assert(data2.success === true, 'Request 2 succeeded');
  assert(data2.analysis !== undefined, 'Request 2 returned analysis object');
  assert(Array.isArray(data2.analysis.images), 'Request 2 analysis.images is an array');
  const req2ImageCount = data2.analysis.images.length;
  console.log(`Request 2 Image Count: ${req2ImageCount}`);

  // Parity Assertion: Both requests must return identical image counts & arrays
  assert(
    req1ImageCount === req2ImageCount,
    `CACHE_MISS image count (${req1ImageCount}) equals CACHE_HIT image count (${req2ImageCount})`
  );

  assert(
    JSON.stringify(data1.analysis.images) === JSON.stringify(data2.analysis.images),
    'CACHE_MISS and CACHE_HIT return identical product.images[] arrays'
  );

  console.log('\n================================================================================');
  console.log(` 🎉 TEST PASSED: Cache v2 double-request parity verified (${req1ImageCount} images)`);
  console.log('================================================================================\n');
}

runCacheV2Test().catch((err) => {
  console.error('❌ Test execution failed:', err);
  process.exit(1);
});
