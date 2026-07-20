// ============================================================
// RootX Storefront Quality Gate V2 — Title & Brand Cleaner Test Suite
// ============================================================

import { buildCleanBrandProfile, cleanProductTitle, cleanBrandName } from '../lib/title-cleaner';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

function runTitleCleanerTests() {
  console.log('\n==================================================');
  console.log('  RUNNING TITLE & BRAND CLEANER TEST SUITE');
  console.log('==================================================\n');

  // Test 1: Haylou Smartwatch
  console.log('Test 1: Haylou Smartwatch (Raw Supplier Title)');
  const raw1 = 'HAYLOU Solar Lite 2 Smartwatch 1.43 AMOLED Display 24h Health Monitoring 150+ Sports Modes Voice Calling Smart Watch 1ATM';
  const clean1 = cleanProductTitle(raw1);
  const brand1 = cleanBrandName(raw1);
  const profile1 = buildCleanBrandProfile(raw1, raw1, 'tech_futuristic');

  assert(clean1.length <= 45, `Product title length is <= 45 chars (Got ${clean1.length}: "${clean1}")`);
  assert(brand1.length <= 18, `Brand name length is <= 18 chars (Got ${brand1.length}: "${brand1}")`);
  assert(brand1 === 'Haylou', `Brand name extracted correctly as "Haylou" (Got "${brand1}")`);
  assert(profile1.cleanHeroHeadline.length <= 60, `Hero headline is <= 60 chars (Got: "${profile1.cleanHeroHeadline}")`);
  assert(!profile1.cleanBrandName.toLowerCase().includes('smartwatch'), 'Raw supplier words omitted from brand name');

  // Test 2: Beauty Product
  console.log('\nTest 2: Beauty Product (Rosewater Mist)');
  const raw2 = 'Organic Hydrating Rosewater Facial Mist Spray 200ml Daily Moisturizing Skin Glow Spray Free Shipping Factory Price';
  const clean2 = cleanProductTitle(raw2);
  const brand2 = cleanBrandName(raw2);
  const profile2 = buildCleanBrandProfile(raw2, raw2, 'soft_lifestyle');

  assert(clean2.length <= 45, `Product title length <= 45 (Got: "${clean2}")`);
  assert(brand2.length <= 18, `Brand name length <= 18 (Got: "${brand2}")`);
  assert(!clean2.toLowerCase().includes('free shipping'), 'Marketplace SEO phrases removed');

  // Test 3: Home Product
  console.log('\nTest 3: Home Product (Ergonomic Seat Cushion)');
  const raw3 = 'Memory Foam Seat Cushion Ergonomic Back Support Pillow Office Chair Driving Seat Massage Cushion 2026 Hot Selling';
  const clean3 = cleanProductTitle(raw3);
  const brand3 = cleanBrandName(raw3);
  const profile3 = buildCleanBrandProfile(raw3, raw3, 'modern_commerce');

  assert(clean3.length <= 45, `Product title length <= 45 (Got: "${clean3}")`);
  assert(brand3.length <= 18, `Brand name length <= 18 (Got: "${brand3}")`);

  console.log('\n==================================================');
  console.log(' 🎉 ALL TITLE & BRAND CLEANER TESTS PASSED SUCCESSFULY');
  console.log('==================================================\n');
}

runTitleCleanerTests();
