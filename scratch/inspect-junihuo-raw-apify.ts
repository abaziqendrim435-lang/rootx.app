// ============================================================
// RootX — Inspect Raw Apify Dataset Items for JUNIHUO
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

import { fetchAliExpressProductViaApify, extractAliExpressProductId, extractAllAliExpressProductImages } from '../lib/product-import/apify-aliexpress';

async function inspectJunihuo() {
  console.log('\n================================================================================');
  console.log('  INSPECTING RAW APIFY DATASET ITEMS FOR JUNIHUO');
  console.log('================================================================================\n');

  // 1. Search JUNIHUO via Apify
  const searchRes = await fetchAliExpressProductViaApify('JUNIHUO', { isDirectUrl: false });
  console.log('SEARCH RESULT SUCCESS:', searchRes.success);
  if (!searchRes.product) {
    console.error('No product returned from search');
    return;
  }

  const searchProduct = searchRes.product;
  const searchProductId = extractAliExpressProductId(searchProduct.url);
  console.log('\nSEARCH PRODUCT DETAILS:');
  console.log('- Title:', searchProduct.title);
  console.log('- URL:', searchProduct.url);
  console.log('- PRODUCT_ID:', searchProductId);
  console.log('- Search Product Images Count:', searchProduct.images.length);
  console.log('- Search Product Image URLs:', searchProduct.images);

  // 2. Direct Product Detail Fetch for searchProduct.url
  if (searchProduct.url) {
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`FETCHING DIRECT FULL PRODUCT DETAIL FOR URL: ${searchProduct.url}`);
    console.log(`--------------------------------------------------------------------------------\n`);

    const detailRes = await fetchAliExpressProductViaApify(searchProduct.url, { isDirectUrl: true });
    console.log('DIRECT DETAIL FETCH SUCCESS:', detailRes.success);
    if (detailRes.product) {
      const detailProduct = detailRes.product;
      const detailProductId = extractAliExpressProductId(detailProduct.url);
      console.log('\nDIRECT DETAIL PRODUCT DETAILS:');
      console.log('- Title:', detailProduct.title);
      console.log('- URL:', detailProduct.url);
      console.log('- PRODUCT_ID:', detailProductId);
      console.log('- Direct Detail Images Count:', detailProduct.images.length);
      console.log('- Direct Detail Image URLs:', detailProduct.images);
    } else {
      console.error('Direct detail fetch returned null product:', detailRes.error);
    }
  }
}

inspectJunihuo().catch((err) => {
  console.error('Inspection failed:', err);
  process.exit(1);
});
