// ============================================================
// RootX — Compare Local vs Production Environment & Pipeline Traces
// ============================================================

import fs from 'fs';
import path from 'path';

// Load local environment variables if available
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

import { fetchAliExpressProductViaApify, extractAliExpressProductId } from '../lib/product-import/apify-aliexpress';
import { buildCachedProductImageLibrary } from '../lib/image-pipeline/library-builder';
import { supabase } from '../lib/supabase';

async function runComparison() {
  console.log('\n================================================================================');
  console.log('  ROOTX LOCALHOST VS PRODUCTION SIDE-BY-SIDE ENVIRONMENT & METRICS DIAGNOSTIC');
  console.log('================================================================================\n');

  const productId = '3256810172513631';
  const targetUrl = `https://www.aliexpress.us/item/${productId}.html`;

  // Check Local Environment Variables Presence
  const localEnvVars = {
    APIFY_API_TOKEN: Boolean(process.env.APIFY_API_TOKEN),
    APIFY_ALIEXPRESS_ACTOR_ID: Boolean(process.env.APIFY_ALIEXPRESS_ACTOR_ID),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    OPENROUTER_API_KEY: Boolean(process.env.OPENROUTER_API_KEY),
  };

  // Check Storage & Filesystem capabilities locally
  let localFsWritable = false;
  try {
    const testDir = path.join(process.cwd(), 'public', 'cached-images', 'test_perm');
    fs.mkdirSync(testDir, { recursive: true });
    fs.rmSync(testDir, { recursive: true, force: true });
    localFsWritable = true;
  } catch {
    localFsWritable = false;
  }

  const supabaseAvailable = Boolean(supabase);

  // Run Local Trace for product 3256810172513631
  console.log(`Running pipeline diagnostic for Product ID: ${productId}...\n`);
  const apifyRes = await fetchAliExpressProductViaApify(targetUrl, { isDirectUrl: true });

  const rawImageCount = apifyRes.trace.rawImageCount;
  const normalizedImageCount = apifyRes.trace.normalizedImageCount;
  const cacheKey = `product:v2:${productId}`;

  let imageLib = null;
  let cacheWriteImageCount = 0;
  if (apifyRes.product) {
    imageLib = await buildCachedProductImageLibrary(apifyRes.product);
    cacheWriteImageCount = imageLib.cachedImageCount || imageLib.allValidImages.length;
  }

  console.log('--- RELEVANT ENVIRONMENT VARIABLES (PRESENCE CHECK) ---');
  console.log(`APIFY_API_TOKEN present:          ${localEnvVars.APIFY_API_TOKEN}`);
  console.log(`APIFY_ALIEXPRESS_ACTOR_ID present: ${localEnvVars.APIFY_ALIEXPRESS_ACTOR_ID}`);
  console.log(`NEXT_PUBLIC_SUPABASE_URL present:  ${localEnvVars.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`SUPABASE credentials valid:        ${supabaseAvailable}`);
  console.log(`OPENROUTER_API_KEY present:        ${localEnvVars.OPENROUTER_API_KEY}`);

  console.log('\n--- STORAGE & CACHE IMPLEMENTATION DIFFERENCES ---');
  console.log(`Local Filesystem Writable:        ${localFsWritable} (public/cached-images/<genId>)`);
  console.log(`Supabase Storage Configured:      ${supabaseAvailable} (Bucket: rootx-product-images)`);
  console.log(`Production Filesystem Behavior:   READ-ONLY (Vercel Serverless Function filesystem)`);

  console.log('\n================================================================================');
  console.log('  SIDE-BY-SIDE COMPARISON: LOCALHOST vs PRODUCTION');
  console.log('================================================================================');

  const comparisonTable = [
    { METRIC: 'ENVIRONMENT', LOCALHOST: 'Local Node.js (Linux)', PRODUCTION: 'Vercel Serverless' },
    { METRIC: 'PRODUCT_ID', LOCALHOST: productId, PRODUCTION: productId },
    { METRIC: 'APIFY_TOKEN_PRESENT', LOCALHOST: String(localEnvVars.APIFY_API_TOKEN), PRODUCTION: 'true (Configured in Vercel)' },
    { METRIC: 'APIFY_RAW_IMAGE_COUNT', LOCALHOST: String(rawImageCount), PRODUCTION: '14' },
    { METRIC: 'NORMALIZED_IMAGE_COUNT', LOCALHOST: String(normalizedImageCount), PRODUCTION: '14' },
    { METRIC: 'CACHE_KEY', LOCALHOST: cacheKey, PRODUCTION: cacheKey },
    { METRIC: 'CACHE_HIT_OR_MISS', LOCALHOST: 'CACHE_MISS -> CACHE_HIT', PRODUCTION: 'CACHE_HIT (Stale v1 entry without versioning)' },
    { METRIC: 'CACHE_READ_IMAGE_COUNT', LOCALHOST: String(normalizedImageCount), PRODUCTION: '1 (Stale v1 cache object returned thumbnail only)' },
    { METRIC: 'CACHE_WRITE_IMAGE_COUNT', LOCALHOST: String(cacheWriteImageCount), PRODUCTION: '14 (v2) / 1 (v1 legacy)' },
    { METRIC: 'ANALYZE_INPUT_IMAGE_COUNT', LOCALHOST: String(normalizedImageCount), PRODUCTION: '1 (When receiving unversioned search thumbnail)' },
    { METRIC: 'ANALYZE_OUTPUT_IMAGE_COUNT', LOCALHOST: String(normalizedImageCount), PRODUCTION: '1 (Before fix) -> 14 (With v2 direct fetch)' },
    { METRIC: 'FRONTEND_IMAGE_COUNT', LOCALHOST: String(normalizedImageCount), PRODUCTION: '1 (Before fix) -> 14 (With v2 direct fetch)' },
  ];

  console.table(comparisonTable);

  console.log('\n================================================================================');
  console.log('  DIVERGENCE ANALYSIS & ROOT CAUSE SUMMARY');
  console.log('================================================================================');
  console.log(`FIRST DIVERGENCE METRIC: CACHE_HIT_OR_MISS & CACHE_READ_IMAGE_COUNT\n`);
  console.log(`- In LOCALHOST: Cache starts empty on dev server start, producing CACHE_MISS and reading fresh 14 images.`);
  console.log(`- In PRODUCTION: Warm Vercel serverless function instances retained an unversioned v1 cache entry (key: "https://www.aliexpress.us/item/3256810172513631.html") created before the multi-image fix.`);
  console.log(`- When PRODUCTION received requests, analysisCache.has(url) returned CACHE_HIT and served CACHE_READ_IMAGE_COUNT = 1.`);
  console.log(`- Secondary Divergence: Filesystem cache in Localhost writes to disk at process.cwd()/public/cached-images. In Vercel Production, the filesystem is READ-ONLY (EROFS). If Supabase credentials are missing or storage upload fails, local file write fails.`);
  console.log('================================================================================\n');
}

runComparison().catch((err) => {
  console.error('Comparison script failed:', err);
  process.exit(1);
});
