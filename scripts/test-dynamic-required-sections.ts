// ============================================================
// RootX Dynamic Required Sections Test Suite
// Tests 10 scenarios for section-plan validation & export flow.
// ============================================================

import { runDesignEnginePipeline } from '../lib/design-engine/pipeline';
import { validatePreviewExportParity } from '../lib/parity-validator';
import type { WebsiteGeneration, WebsiteBuilderInput } from '../lib/website-builder-types';
import { THEME_FAMILIES } from '../lib/design-engine/theme-family-types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

function createBaseGen(): WebsiteGeneration {
  return {
    homepage: {
      hero: {
        headline: 'Lumina Skin Radiance Serum',
        subheadline: 'Pure organic botanicals for youthful skin',
        ctaButtons: [],
        backgroundStyle: 'modern',
      },
      features: [
        { title: 'Hydrates Skin', description: 'Deep botanical hydration', icon: 'droplet' },
      ],
      socialProof: '4.9/5 Rating',
    },
    about: { title: 'Story', content: 'Crafted with care', mission: '', vision: '', values: [] },
    services: { title: '', subtitle: '', services: [] },
    pricing: { title: '', subtitle: '', plans: [] },
    faq: {
      title: 'FAQ',
      subtitle: '',
      items: [
        { question: 'How to use?', answer: 'Apply 3 drops daily' },
      ],
    },
    testimonials: { title: '', subtitle: '', testimonials: [] },
    contact: { title: '', subtitle: '', email: 'hello@lumina.com', phone: '', address: '', formFields: [] },
    footer: { columns: [], copyright: '2026 Lumina', socialLinks: [], tagline: '' },
    seo: { title: 'Lumina Skin Care', metaDescription: '', keywords: [], ogTitle: '', ogDescription: '', ogImagePrompt: '', canonicalUrl: '', structuredData: '' },
    branding: { colorPalette: [], typography: { heading: 'Playfair Display', body: 'Outfit', accent: '', googleFontsUrl: '' }, iconSuggestions: [], logoDescription: '' },
    marketing: { googleAdsHeadlines: [], googleAdsDescriptions: [], facebookAdCopy: '', instagramCaption: '', linkedInPost: '', twitterPost: '', emailCampaign: { subject: '', preheader: '', body: '', cta: '' } },
    isDemo: false,
    provider: 'auto',
    ecommerce: {
      announcementBar: 'Free Express Shipping',
      navigation: ['Shop'],
      price: '$59.00',
      compareAtPrice: '$89.00',
      variants: [],
      images: ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e'],
      trustBadges: [],
      shippingText: 'Tracked Delivery',
      featureSections: [],
      specifications: [
        { label: 'Volume', value: '50ml' },
      ],
      howItWorks: [],
      faq: [],
      reviews: [],
      stickyAddToCartText: 'Add to Cart',
    },
  };
}

function createBaseInput(archetype: string): WebsiteBuilderInput {
  return {
    businessName: 'Lumina Skin Care',
    businessType: 'Skincare',
    targetAudience: 'Beauty Enthusiasts',
    brandDescription: 'Organic skincare',
    preferredStyle: archetype as any,
    primaryColor: '#ec4899',
    secondaryColor: '#f43f5e',
    language: 'en',
    country: 'US',
  };
}

export function runDynamicRequiredSectionsTests() {
  console.log('\n==================================================');
  console.log('  RUNNING DYNAMIC REQUIRED SECTIONS TEST SUITE');
  console.log('==================================================\n');

  // Test 1: Soft Beauty without FAQ
  console.log('Test 1: Soft Beauty without FAQ...');
  const genNoFaq = createBaseGen();
  genNoFaq.faq = { title: '', subtitle: '', items: [] };
  const result1 = runDesignEnginePipeline(genNoFaq, createBaseInput('soft_beauty'));
  const spec1FaqSec = result1.spec?.sections.find((s) => s.id === 'rootx-faq');
  assert(spec1FaqSec?.enabled === false, 'Soft Beauty without FAQ sets rootx-faq enabled = false');
  assert(spec1FaqSec?.required === false, 'Soft Beauty without FAQ sets rootx-faq required = false');

  const indexJson1 = JSON.parse(result1.files.find((f) => f.key === 'templates/index.json')?.value || '{}');
  assert(!indexJson1.sections['rootx-faq'], 'index.json omits rootx-faq when FAQ content is missing');
  assert(!indexJson1.order.includes('rootx-faq'), 'index.json order omits rootx-faq');

  // Test 2: Soft Beauty with FAQ
  console.log('\nTest 2: Soft Beauty with FAQ...');
  const genWithFaq = createBaseGen();
  const result2 = runDesignEnginePipeline(genWithFaq, createBaseInput('soft_beauty'));
  const spec2FaqSec = result2.spec?.sections.find((s) => s.id === 'rootx-faq');
  assert(spec2FaqSec?.enabled === true, 'Soft Beauty with FAQ sets rootx-faq enabled = true');
  const indexJson2 = JSON.parse(result2.files.find((f) => f.key === 'templates/index.json')?.value || '{}');
  assert(Boolean(indexJson2.sections['rootx-faq']), 'index.json includes rootx-faq when FAQ content exists');

  // Test 3: Modern Technology without specifications
  console.log('\nTest 3: Modern Technology without specifications...');
  const genNoSpecs = createBaseGen();
  if (genNoSpecs.ecommerce) genNoSpecs.ecommerce.specifications = [];
  const result3 = runDesignEnginePipeline(genNoSpecs, createBaseInput('modern_tech'));
  const spec3SpecsSec = result3.spec?.sections.find((s) => s.id === 'rootx-specifications');
  assert(spec3SpecsSec?.enabled === false, 'Modern Tech without specs sets rootx-specifications enabled = false');
  assert(spec3SpecsSec?.required === false, 'Modern Tech without specs sets rootx-specifications required = false');
  const indexJson3 = JSON.parse(result3.files.find((f) => f.key === 'templates/index.json')?.value || '{}');
  assert(!indexJson3.sections['rootx-specifications'], 'index.json omits rootx-specifications when specs are missing');

  // Test 4: Modern Technology with specifications
  console.log('\nTest 4: Modern Technology with specifications...');
  const genWithSpecs = createBaseGen();
  const result4 = runDesignEnginePipeline(genWithSpecs, createBaseInput('modern_tech'));
  const spec4SpecsSec = result4.spec?.sections.find((s) => s.id === 'rootx-specifications');
  assert(spec4SpecsSec?.enabled === true, 'Modern Tech with specs sets rootx-specifications enabled = true');

  // Test 5: High Conversion with required benefits and FAQ
  console.log('\nTest 5: High Conversion with required benefits and FAQ...');
  const genHighConv = createBaseGen();
  const result5 = runDesignEnginePipeline(genHighConv, createBaseInput('high_conversion_single'));
  const spec5Benefits = result5.spec?.sections.find((s) => s.id === 'rootx-benefits');
  const spec5Faq = result5.spec?.sections.find((s) => s.id === 'rootx-faq');
  assert(spec5Benefits?.enabled === true && spec5Benefits?.required === true, 'High Conversion sets rootx-benefits enabled and required');
  assert(spec5Faq?.enabled === true && spec5Faq?.required === true, 'High Conversion sets rootx-faq enabled and required');

  // Test 6: Luxury Editorial without benefits
  console.log('\nTest 6: Luxury Editorial without benefits...');
  const genNoBenefits = createBaseGen();
  genNoBenefits.homepage.features = [];
  const result6 = runDesignEnginePipeline(genNoBenefits, createBaseInput('luxury_editorial'));
  const spec6Benefits = result6.spec?.sections.find((s) => s.id === 'rootx-benefits');
  assert(!spec6Benefits || spec6Benefits.enabled === false, 'Luxury Editorial omits/disables rootx-benefits');
  const indexJson6 = JSON.parse(result6.files.find((f) => f.key === 'templates/index.json')?.value || '{}');
  assert(!indexJson6.sections['rootx-benefits'], 'index.json for Luxury Editorial does not contain rootx-benefits');

  // Test 7: Theme switch followed by export
  console.log('\nTest 7: Theme switch followed by export...');
  const inputHighConv = createBaseInput('high_conversion_single');
  const resultHighConv = runDesignEnginePipeline(createBaseGen(), inputHighConv);
  const specHighConvReq = resultHighConv.spec?.sections.filter((s) => s.enabled && s.required).map((s) => s.type);

  const inputSoftBeauty = createBaseInput('soft_beauty');
  const resultSoftBeauty = runDesignEnginePipeline(createBaseGen(), inputSoftBeauty, resultHighConv.spec?.imageLibrary);
  const specSoftBeautyReq = resultSoftBeauty.spec?.sections.filter((s) => s.enabled && s.required).map((s) => s.type);

  assert(JSON.stringify(specHighConvReq) !== JSON.stringify(specSoftBeautyReq), 'Theme switch updates required sections dynamically');
  assert(!specSoftBeautyReq?.includes('rootx-faq'), 'Soft Beauty does not mandate rootx-faq as required section');

  // Test 8: Regenerate store followed by export
  console.log('\nTest 8: Regenerate store followed by export...');
  const resultRegen = runDesignEnginePipeline(createBaseGen(), createBaseInput('modern_tech'), resultSoftBeauty.spec?.imageLibrary);
  assert(resultRegen.spec?.archetype === 'modern_tech', 'Regenerate store updates StorefrontSpec archetype to modern_tech');
  assert(Boolean(resultRegen.files.find((f) => f.key === 'templates/index.json')), 'Regenerate store produces fresh templates/index.json');

  // Test 9: No stale section requirements
  console.log('\nTest 9: No stale section requirements audit...');
  const themeFamilyKeys = Object.keys(THEME_FAMILIES);
  themeFamilyKeys.forEach((tKey) => {
    const res = runDesignEnginePipeline(createBaseGen(), createBaseInput(tKey));
    const parityReport = validatePreviewExportParity(res.spec!, res.files);
    assert(parityReport.passed === true, `Parity validator passes for theme '${tKey}' without stale section requirement errors`);
  });

  // Test 10: index.json sections/order consistency
  console.log('\nTest 10: index.json sections/order consistency...');
  const resConsistent = runDesignEnginePipeline(createBaseGen(), createBaseInput('warm_home'));
  const idxJson = JSON.parse(resConsistent.files.find((f) => f.key === 'templates/index.json')?.value || '{}');
  const sectionKeys = Object.keys(idxJson.sections);
  const orderList = idxJson.order;

  assert(JSON.stringify(sectionKeys) === JSON.stringify(orderList), 'index.json sections keys match order array exactly');
  assert(sectionKeys.every((k) => idxJson.sections[k].type), 'Every section in index.json sections has valid type');

  console.log('\n==================================================');
  console.log(' 🎉 ALL 10 DYNAMIC REQUIRED SECTIONS TESTS PASSED');
  console.log('==================================================\n');
}

runDynamicRequiredSectionsTests();
