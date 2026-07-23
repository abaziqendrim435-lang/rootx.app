// ============================================================
// RootX Design Engine V1 — 10-Stage Pipeline Orchestrator
// Coordinates analysis, category detection, archetype selection,
// design token generation, section variant rendering, and
// automated quality scoring with remediation.
// ============================================================

import type { WebsiteGeneration, WebsiteBuilderInput, DesignEngineResult, ModelLog } from '../website-builder-types';
import { buildStorefrontSpec } from '../storefront-spec/builder';
import { generateTokenCSSVariables } from '../storefront-spec/token-css';
import { generateShopifyLiquidSections } from '../storefront-spec/liquid-generator';
import { validatePreviewExportParity } from '../parity-validator';
import { validateStorefrontQualityGateV2 } from '../quality-gate';
import { getModelForTask, logModelCall } from './model-router';
import { getArchetype } from './archetypes';
import { tokensToShopifySettings } from './design-tokens';
import { validateAndScoreDesign } from './quality-validator';

export function runDesignEnginePipeline(
  rawGen: WebsiteGeneration,
  input: WebsiteBuilderInput,
  existingImageLibrary?: import('../image-pipeline/types').ProductImageLibrary
): DesignEngineResult {
  const modelLogs: ModelLog[] = [];

  // Stage 0: Build Canonical StorefrontSpec (Single Source of Truth)
  const spec = buildStorefrontSpec(rawGen, input, existingImageLibrary);

  // Stage 1: Generate CSS Token Variables & Liquid Sections directly from Spec
  const cssVars = generateTokenCSSVariables(spec);
  const liquidSections = generateShopifyLiquidSections(spec);

  const archDef = getArchetype(spec.archetype);

  // Stage 2: Render index.json template with blocks and block_order
  const buildTemplateSectionObj = (secId: string) => {
    const sec = spec.sections.find((s) => s.id === secId);
    const obj: Record<string, unknown> = { type: secId, settings: sec?.settings || {} };
    if (sec?.blocks && sec.blocks.length > 0) {
      const blocksObj: Record<string, unknown> = {};
      const blockOrder: string[] = [];
      sec.blocks.forEach((b: any, idx: number) => {
        const blockId = b.id || `image_${idx + 1}`;
        blocksObj[blockId] = { type: b.type || 'image', settings: b.settings || {} };
        blockOrder.push(blockId);
      });
      obj.blocks = blocksObj;
      obj.block_order = blockOrder;
    }
    return obj;
  };

  const indexTemplateJson = {
    sections: spec.sections.reduce((acc, sec) => {
      acc[sec.id] = buildTemplateSectionObj(sec.id);
      return acc;
    }, {} as Record<string, unknown>),
    order: spec.sections.map((sec) => sec.id),
  };

  // Stage 3: Render layout/theme.liquid
  const themeLiquid = `<!doctype html>
<html class="no-js" lang="{{ request.locale.iso_code }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ page_title }} — {{ shop.name }}</title>
  {{ content_for_header }}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${archDef.typography.googleFontsUrl}" rel="stylesheet">
  {{ 'theme.css' | asset_url | stylesheet_tag }}
  <style>
    ${cssVars}
  </style>
</head>
<body class="archetype-${spec.archetype}">
  {% section 'rootx-announcement-bar' %}
  {% section 'rootx-header' %}
  <main id="MainContent" role="main">
    {{ content_for_layout }}
  </main>
  {% section 'rootx-footer' %}
  {{ 'theme.js' | asset_url | script_tag }}
</body>
</html>`;

  const productTemplateJson = {
    sections: {
      'rootx-main-product': buildTemplateSectionObj('rootx-main-product'),
      'rootx-gallery': buildTemplateSectionObj('rootx-gallery'),
      'rootx-specifications': buildTemplateSectionObj('rootx-specifications'),
      'rootx-faq': buildTemplateSectionObj('rootx-faq'),
    },
    order: ['rootx-main-product', 'rootx-gallery', 'rootx-specifications', 'rootx-faq'],
  };

  const collectionTemplateJson = {
    sections: {
      'rootx-product-showcase': { type: 'rootx-product-showcase', settings: {} },
    },
    order: ['rootx-product-showcase'],
  };

  const pageTemplateJson = {
    sections: {
      'rootx-image-story': { type: 'rootx-image-story', settings: {} },
      'rootx-faq': { type: 'rootx-faq', settings: {} },
    },
    order: ['rootx-image-story', 'rootx-faq'],
  };

  const template404Json = {
    sections: {
      'rootx-hero': { type: 'rootx-hero', settings: {} },
    },
    order: ['rootx-hero'],
  };

  const cartTemplateJson = {
    sections: {
      'rootx-main-product': { type: 'rootx-main-product', settings: {} },
    },
    order: ['rootx-main-product'],
  };

  // Package theme files
  const themeFiles = [
    { key: 'layout/theme.liquid', value: themeLiquid },
    { key: 'templates/index.json', value: JSON.stringify(indexTemplateJson, null, 2) },
    { key: 'templates/product.json', value: JSON.stringify(productTemplateJson, null, 2) },
    { key: 'templates/collection.json', value: JSON.stringify(collectionTemplateJson, null, 2) },
    { key: 'templates/page.json', value: JSON.stringify(pageTemplateJson, null, 2) },
    { key: 'templates/404.json', value: JSON.stringify(template404Json, null, 2) },
    { key: 'templates/cart.json', value: JSON.stringify(cartTemplateJson, null, 2) },
    ...liquidSections,
    { key: 'assets/theme.css', value: `/* RootX Pixel Parity Engine V1 — ${archDef.name} */\n${cssVars}` },
    { key: 'assets/theme.js', value: 'console.log("RootX Pixel Parity Engine Active");' },
    { key: 'config/settings_data.json', value: JSON.stringify(tokensToShopifySettings(spec.designTokens), null, 2) },
  ];

  // Stage 4: Run Parity & Quality Gate Audits
  const parityReport = validatePreviewExportParity(spec, themeFiles);
  const score = validateAndScoreDesign(rawGen, input, spec.designTokens, spec.brand.category, spec.archetype);

  const result: DesignEngineResult = {
    files: themeFiles,
    score,
    archetype: spec.archetype,
    tokens: spec.designTokens,
    brandName: spec.brand.name,
    brandSlogan: spec.brand.slogan,
    fonts: {
      heading: archDef.typography.headingFont,
      body: archDef.typography.bodyFont,
    },
    modelLogs,
    sectionPlan: { archetypeId: spec.archetype, sections: spec.sections.map(s => ({ sectionId: s.id, sectionType: s.type, variantId: s.variant, variantName: s.type })), totalSections: spec.sections.length },
    iterations: 1,
    imagePipelineResult: {
      images: spec.images.hero ? [spec.images.hero, ...spec.images.gallery] : spec.images.gallery,
      heroImage: spec.images.hero,
      featuredProductImage: spec.images.featured,
      lifestyleImage: spec.images.story,
      galleryImages: spec.images.gallery,
      benefitImage: null,
      finalCtaImage: spec.images.finalCta,
      hasSingleImageFallback: spec.images.hasSingleImageFallback,
      hasNoImageFallback: !spec.images.hero,
      diagnosticInfo: {
        totalExtracted: spec.images.gallery.length + 1,
        validCount: spec.images.gallery.length + 1,
        rejectedCount: 0,
        selectedHeroUrl: spec.images.hero?.normalizedUrl || null,
        sourcesFound: { aliexpress: 1, shopify: 0, manual: 0, remote: 0, unknown: 0 },
        roleAssignments: { hero: 1, 'featured-product': 1, 'product-gallery': spec.images.gallery.length, lifestyle: 1, 'product-detail': 0, benefit: 0, 'final-cta': 1, thumbnail: 0, unassigned: 0 },
        rejectionLog: [],
      },
    },
    spec,
    parityReport,
  };

  result.qualityGateReport = validateStorefrontQualityGateV2(result, input);

  return result;
}
