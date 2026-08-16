// ============================================================
// RootX — Trace Exact JUNIHUO Product Search & Detail Flow
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

import { fetchAliExpressProductViaApify, extractAliExpressProductId } from '../lib/product-import/apify-aliexpress';
import { POST as apifyRoutePOST } from '../app/api/apify/aliexpress/route';
import { POST as analyzeProductPOST } from '../app/api/agents/analyze-product/route';

async function traceJunihuo() {
  console.log('\n================================================================================');
  console.log('  TRACING EXACT JUNIHUO PRODUCT FROM APIFY SEARCH TO ANALYZE-PRODUCT');
  console.log('================================================================================\n');

  // Step 1: Search via Apify Route (/api/apify/aliexpress)
  console.log('1. Calling /api/apify/aliexpress with searchQuery: "JUNIHUO"...');
  const searchReq = {
    json: async () => ({ searchQuery: 'JUNIHUO' }),
  } as any;
  const searchRes = await apifyRoutePOST(searchReq);
  const searchData = await searchRes.json();

  if (!searchData.success || !searchData.products || searchData.products.length === 0) {
    console.error('Search failed:', searchData);
    process.exit(1);
  }

  const searchProduct = searchData.products[0]; // Selected product from search
  const searchResultProductId = extractAliExpressProductId(searchProduct.url);
  const searchResultImageCount = searchProduct.images ? searchProduct.images.length : 0;
  const searchResultHasFullGallery = searchResultImageCount > 1;

  console.log(`\nSEARCH RESULT:`);
  console.log(`- Title: "${searchProduct.title}"`);
  console.log(`- URL: "${searchProduct.url}"`);
  console.log(`- PRODUCT_ID: ${searchResultProductId}`);
  console.log(`- SEARCH_RESULT_IMAGE_COUNT: ${searchResultImageCount}`);
  console.log(`- SEARCH_RESULT_HAS_FULL_GALLERY: ${searchResultHasFullGallery}`);

  // Step 2: Selected Product Payload (what frontend passes to analyze-product when user clicks product)
  const selectedProductPayload = searchProduct;
  const selectedProductProductId = extractAliExpressProductId(selectedProductPayload.url);
  const selectedProductPayloadImageCount = selectedProductPayload.images ? selectedProductPayload.images.length : 0;

  console.log(`\nSELECTED PRODUCT PAYLOAD:`);
  console.log(`- SELECTED_PRODUCT_PRODUCT_ID: ${selectedProductProductId}`);
  console.log(`- SELECTED_PRODUCT_PAYLOAD_IMAGE_COUNT: ${selectedProductPayloadImageCount}`);

  // Step 3: Direct Full Detail Fetch via Apify for product URL
  console.log(`\n3. Fetching full product detail for URL: ${searchProduct.url}...`);
  let fullDetailFetchTriggered = false;
  let fullDetailImageCount = 0;
  let detailFetchProductId: string | null = null;

  if (searchProduct.url && searchProduct.url.startsWith('http')) {
    fullDetailFetchTriggered = true;
    const detailRes = await fetchAliExpressProductViaApify(searchProduct.url, { isDirectUrl: true });
    if (detailRes.success && detailRes.product) {
      detailFetchProductId = extractAliExpressProductId(detailRes.product.url);
      fullDetailImageCount = detailRes.product.images.length;
    }
  }

  console.log(`- FULL_PRODUCT_DETAIL_FETCH_TRIGGERED: ${fullDetailFetchTriggered}`);
  console.log(`- DETAIL_FETCH_PRODUCT_ID: ${detailFetchProductId}`);
  console.log(`- FULL_PRODUCT_DETAIL_IMAGE_COUNT: ${fullDetailImageCount}`);

  // Step 4: Calling /api/agents/analyze-product with selectedProductPayload
  console.log(`\n4. Calling /api/agents/analyze-product with productData = selectedProductPayload...`);
  const analyzeReq = {
    json: async () => ({
      url: searchProduct.url,
      provider: 'auto',
      productData: selectedProductPayload,
    }),
  } as any;

  const analyzeRes = await analyzeProductPOST(analyzeReq);
  const analyzeData = await analyzeRes.json();

  const analyzeInputImageCount = selectedProductPayload.images ? selectedProductPayload.images.length : 0;
  const analyzeOutputImageCount = analyzeData.analysis?.images ? analyzeData.analysis.images.length : 0;
  const frontendImageCount = analyzeOutputImageCount;

  console.log('\n================================================================================');
  console.log('  EXACT METRICS REPORT FOR JUNIHUO PRODUCT:');
  console.log('================================================================================');
  console.log(`PRODUCT_ID = ${searchResultProductId}`);
  console.log(`SEARCH_RESULT_PRODUCT_ID = ${searchResultProductId}`);
  console.log(`SELECTED_PRODUCT_PRODUCT_ID = ${selectedProductProductId}`);
  console.log(`DETAIL_FETCH_PRODUCT_ID = ${detailFetchProductId}`);
  console.log(`SEARCH_RESULT_IMAGE_COUNT = ${searchResultImageCount}`);
  console.log(`SEARCH_RESULT_HAS_FULL_GALLERY = ${searchResultHasFullGallery}`);
  console.log(`SELECTED_PRODUCT_PAYLOAD_IMAGE_COUNT = ${selectedProductPayloadImageCount}`);
  console.log(`FULL_PRODUCT_DETAIL_FETCH_TRIGGERED = ${fullDetailFetchTriggered}`);
  console.log(`FULL_PRODUCT_DETAIL_IMAGE_COUNT = ${fullDetailImageCount}`);
  console.log(`ANALYZE_PRODUCT_INPUT_IMAGE_COUNT = ${analyzeInputImageCount}`);
  console.log(`ANALYZE_PRODUCT_OUTPUT_IMAGE_COUNT = ${analyzeOutputImageCount}`);
  console.log(`FRONTEND_IMAGE_COUNT = ${frontendImageCount}`);
  console.log('================================================================================\n');
}

traceJunihuo().catch((err) => {
  console.error('Tracing failed:', err);
  process.exit(1);
});
