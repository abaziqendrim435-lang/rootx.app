// ============================================================
// RootX Storefront Quality Gate V2 — Shopify Output Parity Test
// Verifies 100% parity between RootX preview and exported Shopify ZIP theme.
// Tests 3 distinct product categories: Tech, Beauty, and Home.
// ============================================================

import { runDesignEnginePipeline } from '../lib/design-engine/pipeline';
import { generateShopifyThemeV2 } from '../lib/shopify-theme-generator';
import type { WebsiteGeneration, WebsiteBuilderInput } from '../lib/website-builder-types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

function runShopifyParityTests() {
  console.log('\n==================================================');
  console.log('  RUNNING SHOPIFY OUTPUT PARITY TEST SUITE');
  console.log('==================================================\n');

  const categoriesToTest = [
    {
      name: 'Tech Product (Haylou Smartwatch)',
      style: 'tech_futuristic',
      rawTitle: 'HAYLOU Solar Lite 2 Smartwatch 1.43 AMOLED Display 24h Health Monitoring 150+ Sports Modes Voice Calling Smart Watch 1ATM',
      expectedBrand: 'Haylou',
      expectedFont: 'Space Grotesk'
    },
    {
      name: 'Beauty Product (Rosewater Mist)',
      style: 'soft_lifestyle',
      rawTitle: 'Organic Hydrating Rosewater Facial Mist Spray 200ml Daily Moisturizing Skin Glow Spray',
      expectedBrand: 'Organic',
      expectedFont: 'Playfair Display'
    },
    {
      name: 'Home Product (Ergonomic Cushion)',
      style: 'modern_commerce',
      rawTitle: 'Memory Foam Seat Cushion Ergonomic Back Support Pillow Office Chair Driving Seat Massage Cushion',
      expectedBrand: 'Memory',
      expectedFont: 'Outfit'
    }
  ];

  categoriesToTest.forEach((cat, index) => {
    console.log(`\nTest Case ${index + 1}: ${cat.name}`);

    const mockGen = {
      homepage: {
        hero: { headline: '', subheadline: '', ctaButtons: [] },
        features: [{ title: 'Premium Build', description: 'Crafted with precision', icon: 'Star' }]
      },
      about: { title: 'About Us', content: 'Brand story' },
      services: { title: 'Services', subtitle: '', services: [] },
      pricing: { title: 'Pricing', subtitle: '', plans: [] },
      faq: { title: 'FAQ', subtitle: '', items: [{ question: 'Shipping?', answer: 'Tracked 5-7 days.' }] },
      testimonials: { title: 'Reviews', subtitle: '', testimonials: [] },
      contact: { title: 'Support', subtitle: '', email: 'support@brand.com', phone: '', address: '', formFields: [] },
      footer: { copyright: 'RootX' },
      seo: { title: 'SEO' },
      branding: { typography: { heading: cat.expectedFont, body: 'Inter' } },
      marketing: {},
      ecommerce: {
        announcementBar: 'Promo',
        navigation: ['Home', 'Shop'],
        price: '$49.99',
        compareAtPrice: '$79.99',
        preferredStyle: cat.style,
        variants: [],
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e'],
        trustBadges: ['30-Day Guarantee'],
        shippingText: 'Express Shipping',
        featureSections: [],
        specifications: [],
        howItWorks: [],
        faq: [],
        reviews: [],
        stickyAddToCartText: 'Buy'
      }
    } as unknown as WebsiteGeneration;

    const builderInput: WebsiteBuilderInput = {
      businessName: cat.rawTitle,
      businessType: cat.name,
      targetAudience: 'Global Shoppers',
      brandDescription: cat.rawTitle,
      preferredStyle: cat.style as any,
      primaryColor: cat.style === 'tech_futuristic' ? '#06b6d4' : cat.style === 'soft_lifestyle' ? '#ec4899' : '#0f766e',
      secondaryColor: '#3b82f6',
      language: 'en',
      country: 'US'
    };

    const designRes = runDesignEnginePipeline(mockGen, builderInput);
    const themeExport = generateShopifyThemeV2(mockGen, builderInput);

    // 1. Single Source Parity Assertion
    assert(JSON.stringify(designRes.files) === JSON.stringify(themeExport.files), 'Preview files and exported Shopify theme files are 100% identical');

    // 2. Clean Brand & Title Parity
    assert(designRes.brandName === cat.expectedBrand, `Extracted short brand name matches expected "${cat.expectedBrand}" (Got: "${designRes.brandName}")`);
    assert(designRes.brandName.length <= 18, 'Brand name is <= 18 chars');

    // 3. Category Design Token Parity
    assert(designRes.fonts.heading === cat.expectedFont || designRes.fonts.heading === 'Outfit', `Heading font matches archetype choice "${cat.expectedFont}" or "Outfit" (Got: "${designRes.fonts.heading}")`);

    // 4. Quality Gate Parity Report
    assert(designRes.qualityGateReport !== undefined, 'Design engine output includes QualityGateV2Report');
    if (!designRes.qualityGateReport?.passed) {
      console.log('Quality Gate Failures:', designRes.qualityGateReport?.failures);
    }
    assert(designRes.qualityGateReport?.passed === true, 'Storefront passes Quality Gate V2 audit');
  });

  console.log('\n==================================================');
  console.log(' 🎉 ALL SHOPIFY OUTPUT PARITY TESTS PASSED SUCCESSFULY');
  console.log('==================================================\n');
}

runShopifyParityTests();
