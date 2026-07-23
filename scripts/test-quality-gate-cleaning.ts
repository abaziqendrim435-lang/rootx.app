// ============================================================
// RootX Quality Gate Title Cleaning & Export Pass Test Suite
// Verifies product title cleaning, brand name generation, headline truncation (< 60 chars),
// supplier word removal, and Quality Gate 100% pass guarantee.
// ============================================================

import { cleanProductTitle, cleanBrandName, generateCleanHeadlines, buildCleanBrandProfile } from '../lib/title-cleaner';
import { validateStorefrontQualityGateV2 } from '../lib/quality-gate';
import { runDesignEnginePipeline } from '../lib/design-engine/pipeline';
import type { WebsiteGeneration, WebsiteBuilderInput } from '../lib/website-builder-types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

export function runQualityGateCleaningTests() {
  console.log('\n==================================================');
  console.log('  RUNNING QUALITY GATE TITLE CLEANING TEST SUITE');
  console.log('==================================================\n');

  // 1. Title Cleaning & Supplier Buzzword Removal
  console.log('Test 1: Title Cleaning & Supplier Buzzword Removal...');
  const rawSupplierTitle = '2026 New Intelligent Smart Watch Official Factory Direct Hot Sale Best Seller Original HAYLOU Solar Lite 2 Smartwatch 1.43 AMOLED Display 24h Health Monitoring 150+ Sports Modes Voice Calling Smart Watch 1ATM';
  const cleanTitle = cleanProductTitle(rawSupplierTitle);
  assert(!cleanTitle.toLowerCase().includes('2026'), 'Removed "2026" from product title');
  assert(!cleanTitle.toLowerCase().includes('new'), 'Removed "New" from product title');
  assert(!cleanTitle.toLowerCase().includes('intelligent'), 'Removed "Intelligent" from product title');
  assert(!cleanTitle.toLowerCase().includes('smart'), 'Removed "Smart" from product title');
  assert(!cleanTitle.toLowerCase().includes('official'), 'Removed "Official" from product title');
  assert(!cleanTitle.toLowerCase().includes('factory'), 'Removed "Factory" from product title');
  assert(!cleanTitle.toLowerCase().includes('original'), 'Removed "Original" from product title');
  assert(!cleanTitle.toLowerCase().includes('hot sale'), 'Removed "Hot Sale" from product title');
  assert(!cleanTitle.toLowerCase().includes('best seller'), 'Removed "Best Seller" from product title');
  assert(cleanTitle.length <= 45, `Clean product title length is <= 45 chars (Got: ${cleanTitle.length} chars: "${cleanTitle}")`);

  // 2. Brand Name Generation & Fallbacks
  console.log('\nTest 2: Brand Name Cleaning & Generation...');
  const cleanBrand = cleanBrandName('Official Factory Store 2026 Direct', 'tech_futuristic');
  assert(cleanBrand.length >= 3 && cleanBrand.length <= 18, `Brand name is 3-18 chars (Got: "${cleanBrand}" - ${cleanBrand.length} chars)`);
  assert(!cleanBrand.toLowerCase().includes('official'), 'Brand name stripped "Official"');
  assert(!cleanBrand.toLowerCase().includes('factory'), 'Brand name stripped "Factory"');

  const missingBrand = cleanBrandName('', 'soft_lifestyle');
  assert(missingBrand === 'Lumina', 'Generates fallback brand name "Lumina" for missing beauty brand');

  // 3. Marketing Headline Generation (< 60 chars)
  console.log('\nTest 3: Marketing Headline Generation (< 60 chars)...');
  const longRawHeadline = 'This is an extremely long raw hero headline extracted from a supplier store that exceeds sixty characters easily and has dropshipping words 2026';
  const { headline } = generateCleanHeadlines('Wireless Earbuds', 'AeroTech', 'tech_futuristic', longRawHeadline);
  assert(headline.length <= 60, `Headline length is <= 60 chars (Got: ${headline.length} chars: "${headline}")`);
  assert(!headline.toLowerCase().includes('dropshipping'), 'Headline stripped "dropshipping"');
  assert(!headline.toLowerCase().includes('2026'), 'Headline stripped "2026"');

  // 4. Quality Gate 100% Pass Guarantee
  console.log('\nTest 4: Quality Gate 100% Pass Guarantee with Raw Supplier Data...');
  const rawAliExpressData: WebsiteGeneration = {
    homepage: {
      hero: {
        headline: '2026 New Intelligent Smart Watch Official Factory Direct Hot Sale Best Seller Original Dropshipping Smartwatch',
        subheadline: 'High quality AMOLED display health monitoring voice calling sports modes waterproof 1ATM',
        ctaButtons: [],
        backgroundStyle: 'modern',
      },
      features: [],
      socialProof: '4.9/5',
    },
    about: { title: 'About', content: '', mission: '', vision: '', values: [] },
    services: { title: 'Services', subtitle: '', services: [] },
    pricing: { title: 'Pricing', subtitle: '', plans: [] },
    faq: { title: 'FAQ', subtitle: '', items: [] },
    testimonials: { title: 'Reviews', subtitle: '', testimonials: [] },
    contact: { title: 'Contact', subtitle: '', email: 'help@supplier.com', phone: '', address: '', formFields: [] },
    footer: { columns: [], copyright: '2026', socialLinks: [], tagline: '' },
    seo: { title: '2026 New Intelligent Smart Watch Official Factory Direct Hot Sale Best Seller Original', metaDescription: '', keywords: [], ogTitle: '', ogDescription: '', ogImagePrompt: '', canonicalUrl: '', structuredData: '' },
    branding: { colorPalette: [], typography: { heading: 'Inter', body: 'Outfit', accent: '', googleFontsUrl: '' }, iconSuggestions: [], logoDescription: '' },
    marketing: { googleAdsHeadlines: [], googleAdsDescriptions: [], facebookAdCopy: '', instagramCaption: '', linkedInPost: '', twitterPost: '', emailCampaign: { subject: '', preheader: '', body: '', cta: '' } },
    isDemo: false,
    provider: 'auto',
    ecommerce: {
      announcementBar: 'Free Express Delivery',
      navigation: ['Shop'],
      price: '$49.99',
      compareAtPrice: '$99.99',
      variants: [],
      images: ['https://ae01.alicdn.com/kf/S1000.jpg'],
      trustBadges: [],
      shippingText: 'Fast Shipping',
      featureSections: [],
      specifications: [],
      howItWorks: [],
      faq: [],
      reviews: [],
      stickyAddToCartText: 'Add to Cart',
    },
  };

  const rawInput: WebsiteBuilderInput = {
    businessName: '2026 New Intelligent Smart Watch Official Factory Direct Hot Sale Best Seller Original',
    businessType: 'Smartwatch',
    targetAudience: 'Tech Users',
    brandDescription: 'Smart watch',
    preferredStyle: 'modern_tech',
    primaryColor: '#2563eb',
    secondaryColor: '#3b82f6',
    language: 'English',
    country: 'United States',
  };

  const result = runDesignEnginePipeline(rawAliExpressData, rawInput);
  assert(Boolean(result.qualityGateReport), 'Quality Gate report generated');
  assert(result.qualityGateReport?.passed === true, 'Quality Gate passed 100% even with raw supplier input');
  assert((result.qualityGateReport?.overallScore ?? 0) >= 85, `Overall score is >= 85 (Got: ${result.qualityGateReport?.overallScore})`);
  assert(result.brandName.length <= 18, `Cleaned brand name length <= 18 chars (Got: "${result.brandName}")`);
  assert(result.brandSlogan.length <= 60, `Cleaned hero headline length <= 60 chars (Got: "${result.brandSlogan}")`);

  console.log('\n==================================================');
  console.log(' 🎉 ALL QUALITY GATE TITLE CLEANING TESTS PASSED');
  console.log('==================================================\n');
}

runQualityGateCleaningTests();
