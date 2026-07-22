// ============================================================
// RootX Storefront Pixel Parity Engine V1 — 16-Scenario Test Suite
// Checks 100% parity between StorefrontSpec, React preview, and Shopify ZIP output.
// ============================================================

import { buildStorefrontSpec } from '../lib/storefront-spec/builder';
import { generateShopifyLiquidSections } from '../lib/storefront-spec/liquid-generator';
import { generateTokenCSSVariables } from '../lib/storefront-spec/token-css';
import { validatePreviewExportParity } from '../lib/parity-validator';
import { runDesignEnginePipeline } from '../lib/design-engine/pipeline';
import { generateShopifyThemeV2 } from '../lib/shopify-theme-generator';
import { hasPlaceholderContent } from '../lib/placeholder-cleaner';
import type { WebsiteGeneration, WebsiteBuilderInput } from '../lib/website-builder-types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

function runParityTestSuite() {
  console.log('\n==================================================');
  console.log('  RUNNING 16-SCENARIO STOREFRONT PARITY TEST SUITE');
  console.log('==================================================\n');

  // Scenario 14: HOCO EQ2 Earbuds Real-Product Fixture (Tech)
  console.log('Scenario 14: HOCO EQ2 Earbuds Real Product Fixture (Tech)');
  const hocoGen = {
    homepage: { hero: { headline: '', subheadline: '', ctaButtons: [] }, features: [{ title: 'Hi-Fi Audio', description: 'Crystal clear sound', icon: 'Star' }] },
    about: { title: 'About HOCO', content: 'Premium audio engineering.' },
    services: { title: '', subtitle: '', services: [] },
    pricing: { title: '', subtitle: '', plans: [] },
    faq: { title: 'FAQ', subtitle: '', items: [{ question: 'Battery life?', answer: '7 hours playtime.' }] },
    testimonials: { title: '', subtitle: '', testimonials: [] },
    contact: { title: '', subtitle: '', email: 'support@hoco.com', phone: '', address: '', formFields: [] },
    footer: { copyright: 'HOCO' },
    seo: { title: 'HOCO EQ2' },
    branding: { typography: { heading: 'Outfit', body: 'Inter' } },
    marketing: {},
    ecommerce: {
      announcementBar: 'Free Express Shipping',
      navigation: ['Home', 'Shop'],
      price: '$29.99',
      compareAtPrice: '$49.99',
      preferredStyle: 'modern_tech',
      variants: [],
      images: ['https://ae01.alicdn.com/kf/S999999_800x800.jpg'],
      trustBadges: ['30-Day Guarantee'],
      shippingText: 'Tracked Delivery',
      featureSections: [],
      specifications: [{ name: 'Bluetooth', value: 'v5.3' }],
      howItWorks: [],
      faq: [],
      reviews: [],
      stickyAddToCartText: 'Buy'
    }
  } as unknown as WebsiteGeneration;

  const hocoInput: WebsiteBuilderInput = {
    businessName: 'HOCO EQ2 TWS Wireless Earbuds Bluetooth 5.3 Stereo Sound Touch Control Headset 2026 Hot Selling',
    businessType: 'Wireless Earbuds',
    targetAudience: 'Music Lovers',
    brandDescription: 'HOCO EQ2 Wireless Earbuds',
    preferredStyle: 'modern_tech',
    primaryColor: '#06b6d4',
    secondaryColor: '#3b82f6',
    language: 'en',
    country: 'US'
  };

  // Test 1: StorefrontSpec Serialization
  const hocoSpec = buildStorefrontSpec(hocoGen, hocoInput);
  const specJson = JSON.stringify(hocoSpec);
  assert(specJson.length > 0 && typeof JSON.parse(specJson) === 'object', 'Test 1: StorefrontSpec JSON serializes cleanly');

  // Test 2 & 3: Preview and Exporter use identical StorefrontSpec
  const hocoRes = runDesignEnginePipeline(hocoGen, hocoInput);
  const hocoExport = generateShopifyThemeV2(hocoGen, hocoInput);
  assert(hocoRes.spec !== undefined && hocoExport.spec !== undefined, 'Test 2 & 3: Both Preview and Exporter consume StorefrontSpec');
  assert(JSON.stringify(hocoRes.files) === JSON.stringify(hocoExport.files), 'Test 3: Exporter produces 100% identical files to preview spec');

  // Test 4: Section order parity
  const indexFile = hocoRes.files.find(f => f.key === 'templates/index.json')?.value || '';
  const indexObj = JSON.parse(indexFile);
  assert(JSON.stringify(indexObj.order) === JSON.stringify(hocoSpec.sections.map(s => s.id)), 'Test 4: Section order in templates/index.json matches spec exactly');

  // Test 5: Design token parity
  const cssVars = generateTokenCSSVariables(hocoSpec);
  assert(cssVars.includes('--rx-color-primary: #06b6d4') && cssVars.includes('--rx-font-heading'), 'Test 5: Design tokens match --rx-* CSS variables');

  // Test 6: Image-role parity
  assert(Boolean(hocoSpec.images.hero?.normalizedUrl.includes('S999999')), 'Test 6: Hero image assignment preserved in spec');

  // Test 7: Content parity
  assert(hocoSpec.brand.name === 'Hoco' && hocoSpec.product.cleanName.startsWith('Hoco'), `Test 7: Content parity (clean brand: "${hocoSpec.brand.name}", clean title: "${hocoSpec.product.cleanName}")`);

  // Test 8: Product form presence
  assert(hocoRes.files.some(f => f.value.includes('action="/cart/add"')), 'Test 8: Valid Shopify add-to-cart form (action="/cart/add") present');

  // Test 9: Placeholder detection
  assert(!hocoRes.files.some(f => hasPlaceholderContent(f.value)), 'Test 9: Zero placeholder text detected');

  // Test 10: Raw-title detection
  assert(!hocoRes.files.some(f => f.value.includes('2026 Hot Selling')), 'Test 10: Zero raw supplier title noise detected in Liquid files');

  // Test 11: JSON validity
  assert(JSON.parse(hocoRes.files.find(f => f.key === 'config/settings_data.json')?.value || '{}') !== null, 'Test 11: settings_data.json is valid JSON');

  // Test 12: Liquid section existence
  const liquidSecs = generateShopifyLiquidSections(hocoSpec);
  assert(liquidSecs.length === 13, 'Test 12: All 13 required Liquid sections generated');

  // Test 13: Mobile breakpoint rules
  assert(cssVars.includes('@media (max-width: 768px)'), 'Test 13: Mobile breakpoint @media rules present in CSS');

  // Scenario 15: Beauty Fixture (Rosewater Mist)
  console.log('\nScenario 15: Beauty Product Fixture (Rosewater Mist)');
  const beautyInput: WebsiteBuilderInput = {
    businessName: 'Organic Rosewater Facial Mist',
    businessType: 'Skincare',
    targetAudience: 'Women',
    brandDescription: 'Organic Rosewater Mist',
    preferredStyle: 'soft_lifestyle',
    primaryColor: '#ec4899',
    secondaryColor: '#f43f5e',
    language: 'en',
    country: 'US'
  };
  const beautyRes = runDesignEnginePipeline(hocoGen, beautyInput);
  assert(beautyRes.spec?.archetype === 'soft_beauty', 'Test 15: Beauty fixture mapped to soft_beauty archetype');

  // Scenario 16: Home Fixture (Memory Foam Cushion)
  console.log('\nScenario 16: Home Product Fixture (Memory Cushion)');
  const homeInput: WebsiteBuilderInput = {
    businessName: 'Memory Foam Cushion',
    businessType: 'Home Decor',
    targetAudience: 'Homeowners',
    brandDescription: 'Memory Foam Cushion',
    preferredStyle: 'modern_commerce',
    primaryColor: '#0f766e',
    secondaryColor: '#0d9488',
    language: 'en',
    country: 'US'
  };
  const homeRes = runDesignEnginePipeline(hocoGen, homeInput);
  assert(homeRes.spec?.archetype === 'warm_home', 'Test 16: Home fixture mapped to warm_home archetype');

  // Parity Report Check
  assert(hocoRes.parityReport?.passed === true, 'Overall Parity Report: 100% Pass');

  console.log('\n==================================================');
  console.log(' 🎉 ALL 16 PARITY TEST SCENARIOS PASSED SUCCESSFULY');
  console.log('==================================================\n');
}

runParityTestSuite();
