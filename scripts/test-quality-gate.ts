// ============================================================
// RootX Storefront Quality Gate V2 — Quality Gate Engine Test
// ============================================================

import { validateStorefrontQualityGateV2 } from '../lib/quality-gate';
import type { DesignEngineResult, WebsiteBuilderInput } from '../lib/website-builder-types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

function runQualityGateTests() {
  console.log('\n==================================================');
  console.log('  RUNNING STOREFRONT QUALITY GATE V2 TEST SUITE');
  console.log('==================================================\n');

  const mockValidResult = {
    brandName: 'Haylou',
    brandSlogan: 'Smarter Health. Better Every Day.',
    files: [
      { key: 'layout/theme.liquid', value: '<html><body>{% section "hero" %}</body></html>' },
      { key: 'templates/index.json', value: '{"sections":{}}' },
      { key: 'sections/hero.liquid', value: '<form action="/cart/add" method="post"><button>Buy</button></form>' },
      { key: 'assets/theme.css', value: ':root { --color-primary: #06b6d4; }' },
    ],
    imagePipelineResult: {
      images: [{ id: '1', rawUrl: 'https://ae01.alicdn.com/1.jpg', normalizedUrl: 'https://ae01.alicdn.com/1.jpg', source: 'aliexpress', qualityScore: 90, status: 'valid', roles: ['hero'] }],
      heroImage: { id: '1', rawUrl: 'https://ae01.alicdn.com/1.jpg', normalizedUrl: 'https://ae01.alicdn.com/1.jpg', source: 'aliexpress', qualityScore: 90, status: 'valid', roles: ['hero'] },
      lifestyleImage: null,
      featuredImage: null,
      galleryImages: [],
      hasSingleImageFallback: true,
      diagnosticInfo: { totalExtracted: 1, validCount: 1, rejectedCount: 0, selectedHeroUrl: 'https://ae01.alicdn.com/1.jpg', sources: { aliexpress: 1, shopify: 0, manual: 0, remote: 0, unknown: 0 }, rejections: [] },
    },
  } as unknown as DesignEngineResult;

  const mockInput: WebsiteBuilderInput = {
    businessName: 'Haylou Solar Lite 2',
    businessType: 'Smartwatch',
    targetAudience: 'Athletes',
    brandDescription: 'Smartwatch',
    preferredStyle: 'modern_tech',
    primaryColor: '#06b6d4',
    secondaryColor: '#3b82f6',
    language: 'en',
    country: 'US',
  };

  const report = validateStorefrontQualityGateV2(mockValidResult, mockInput);

  assert(report.passed === true, 'Quality Gate V2 passed valid storefront');
  assert(report.overallScore >= 85, `Overall Quality Gate score is >= 85 (Got: ${report.overallScore})`);
  assert(report.checks.every(c => c.passed), 'All individual Quality Gate checks passed');

  // Auto-cleaning test: Raw supplier title automatically cleaned
  const mockRawSupplierResult = {
    ...mockValidResult,
    brandName: 'HAYLOU Solar Lite 2 Smartwatch 1.43 AMOLED Display 24h Health Monitoring 150+ Sports Modes Voice Calling Smart Watch 1ATM 2026 New Intelligent Smart Watch Official Factory Direct Hot Sale Best Seller Original',
  };
  const cleanedReport = validateStorefrontQualityGateV2(mockRawSupplierResult, mockInput);
  assert(cleanedReport.passed === true, 'Quality Gate V2 automatically cleans raw supplier title and passes');
  assert(mockRawSupplierResult.brandName.length <= 18, `Cleaned brand name "${mockRawSupplierResult.brandName}" is <= 18 chars`);
  assert(!mockRawSupplierResult.brandName.includes('2026'), 'Cleaned brand name does not contain 2026');

  console.log('\n==================================================');
  console.log(' 🎉 ALL QUALITY GATE V2 CLEANING TESTS PASSED SUCCESSFULY');
  console.log('==================================================\n');
}

runQualityGateTests();
