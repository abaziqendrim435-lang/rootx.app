// ============================================================
// RootX Design Engine V1 — 10-Stage Pipeline Orchestrator
// Coordinates analysis, category detection, archetype selection,
// design token generation, section variant rendering, and
// automated quality scoring with remediation.
// ============================================================

import type { WebsiteGeneration, WebsiteBuilderInput, DesignEngineResult, ModelLog } from '../website-builder-types';
import { analyzeAndDetectArchetype } from './category-detector';
import { generateDesignTokens, tokensToCSSVariables, tokensToShopifySettings } from './design-tokens';
import { createSectionPlan } from './section-sequencer';
import { renderSectionVariant } from './section-library';
import { validateAndScoreDesign } from './quality-validator';
import { getModelForTask, logModelCall } from './model-router';
import { getArchetype } from './archetypes';

export function runDesignEnginePipeline(
  gen: WebsiteGeneration,
  input: WebsiteBuilderInput
): DesignEngineResult {
  const modelLogs: ModelLog[] = [];

  // Stage 1-5: Product Analysis, Category, Target Customer, Personality, Archetype Selection
  const textToScan = `${input.businessType} ${input.brandDescription} ${input.businessName} ${gen.ecommerce?.shippingText || ''}`;
  const startCategoryTime = Date.now();
  const analysis = analyzeAndDetectArchetype(textToScan, input.preferredStyle);
  const categoryTarget = getModelForTask('category_detection');
  modelLogs.push(
    logModelCall('category_detection', categoryTarget, Date.now() - startCategoryTime, 120, 45, false)
  );

  let currentArchetypeId = analysis.selectedArchetype;
  let iterations = 0;
  let finalResult: DesignEngineResult | null = null;

  // Maximum 3 passes (1 initial + 2 remediation passes if quality score < 85)
  while (iterations < 3) {
    iterations++;

    // Stage 6: Generate Design Tokens
    const tokens = generateDesignTokens(
      currentArchetypeId,
      input.primaryColor,
      input.secondaryColor
    );

    // Stage 7: Select Section Structure
    const sectionPlan = createSectionPlan(currentArchetypeId);

    // Stage 8 & 9: Render Sections and Theme Files
    const archDef = getArchetype(currentArchetypeId);
    const brandName = input.businessName.replace(/\s+Store$/i, '').trim();
    const brandSlogan = gen.homepage.hero.subheadline || archDef.tagline;

    // Render section liquid files
    const renderedSections: { key: string; value: string }[] = sectionPlan.sections.map((sec) => {
      const liquidContent = renderSectionVariant(sec.sectionType, sec.variantId, gen, input);
      return {
        key: `sections/${sec.sectionId}.liquid`,
        value: liquidContent,
      };
    });

    // Render index template JSON
    const indexTemplateJson = {
      sections: sectionPlan.sections.reduce((acc, sec) => {
        acc[sec.sectionId] = { type: sec.sectionId, settings: {} };
        return acc;
      }, {} as Record<string, unknown>),
      order: sectionPlan.sections.map((sec) => sec.sectionId),
    };

    // Render layout/theme.liquid
    const cssVars = tokensToCSSVariables(tokens);
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
<body class="archetype-${currentArchetypeId}">
  {% section 'header' %}
  <main id="MainContent" role="main">
    {{ content_for_layout }}
  </main>
  {% section 'footer' %}
  {{ 'theme.js' | asset_url | script_tag }}
</body>
</html>`;

    // Package all theme files
    const themeFiles: { key: string; value: string }[] = [
      { key: 'layout/theme.liquid', value: themeLiquid },
      { key: 'templates/index.json', value: JSON.stringify(indexTemplateJson, null, 2) },
      ...renderedSections,
      { key: 'assets/theme.css', value: `/* RootX Design Engine V1 — ${archDef.name} */\n${cssVars}` },
      { key: 'assets/theme.js', value: 'console.log("RootX Theme Engine Active");' },
      { key: 'config/settings_data.json', value: JSON.stringify(tokensToShopifySettings(tokens), null, 2) },
    ];

    // Stage 10: Run Quality Validation
    const startValTime = Date.now();
    const score = validateAndScoreDesign(gen, input, tokens, analysis.category, currentArchetypeId);
    const valTarget = getModelForTask('layout_validation');
    modelLogs.push(
      logModelCall('layout_validation', valTarget, Date.now() - startValTime, 240, 80, false)
    );

    finalResult = {
      files: themeFiles,
      score,
      archetype: currentArchetypeId,
      tokens,
      brandName,
      brandSlogan,
      fonts: {
        heading: archDef.typography.headingFont,
        body: archDef.typography.bodyFont,
      },
      modelLogs,
      sectionPlan,
      iterations,
    };

    // If score passes (>= 85) or max iterations reached, finish
    if (score.passed || iterations >= 3) {
      break;
    }

    // Auto-remediation: switch to alternative archetype if confidence low
    if (analysis.alternativeArchetypes.length > 0) {
      currentArchetypeId = analysis.alternativeArchetypes[iterations - 1] || 'high_conversion_landing';
    }
  }

  return finalResult!;
}
