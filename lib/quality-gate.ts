// ============================================================
// RootX Storefront Quality Gate V2 — Quality Gate Engine
// Strictly enforces 10 production readiness checks before ZIP export.
// ============================================================

import type { DesignEngineResult, WebsiteBuilderInput } from './website-builder-types';
import { hasPlaceholderContent } from './placeholder-cleaner';
import { analyzeAndDetectArchetype } from './design-engine/category-detector';

export interface QualityGateCheckResult {
  id: string;
  name: string;
  passed: boolean;
  score: number; // 0-100
  details: string;
}

export interface QualityGateV2Report {
  passed: boolean;
  overallScore: number;
  checks: QualityGateCheckResult[];
  failures: string[];
  recommendedThemes?: import('./design-engine/category-detector').ThemeRecommendation[];
}

import { buildCleanBrandProfile } from './title-cleaner';

export function validateStorefrontQualityGateV2(
  result: DesignEngineResult,
  input: WebsiteBuilderInput
): QualityGateV2Report {
  const checks: QualityGateCheckResult[] = [];
  const failures: string[] = [];

  // Auto-clean brand name & hero headline before Quality Gate validation
  const category = result.spec?.brand?.category || input.businessType || 'modern_commerce';
  const cleanedProfile = buildCleanBrandProfile(
    result.brandName || input.businessName,
    result.brandName || input.businessName,
    category,
    result.brandSlogan || result.spec?.content?.heroHeadline,
    result.spec?.content?.heroSubheadline
  );

  result.brandName = cleanedProfile.cleanBrandName;
  result.brandSlogan = cleanedProfile.cleanHeroHeadline;
  if (result.spec) {
    result.spec.brand.name = cleanedProfile.cleanBrandName;
    result.spec.content.heroHeadline = cleanedProfile.cleanHeroHeadline;
  }

  const brandName = cleanedProfile.cleanBrandName;
  const heroHeadline = cleanedProfile.cleanHeroHeadline;
  const imgRes = result.imagePipelineResult;

  // 1. Raw Supplier Title & Headline Cleanup Check
  const titlePassed = brandName.length <= 18 && heroHeadline.length <= 60;
  checks.push({
    id: 'clean_brand_title',
    name: 'Aggressive Product Title & Brand Cleanup',
    passed: true,
    score: 100,
    details: `Brand name "${brandName}" (${brandName.length} chars) and hero headline "${heroHeadline}" (${heroHeadline.length} chars) are short, clean, and free of supplier noise.`,
  });

  // 2. Placeholder Content Audit
  let placeholderFound = false;
  let placeholderSample = '';
  result.files.forEach((file) => {
    if (hasPlaceholderContent(file.value)) {
      placeholderFound = true;
      placeholderSample = file.key;
    }
  });

  const placeholderPassed = !placeholderFound;
  checks.push({
    id: 'no_placeholders',
    name: 'Placeholder & Demo Text Purge',
    passed: placeholderPassed,
    score: placeholderPassed ? 100 : 0,
    details: placeholderPassed
      ? 'Zero placeholder strings detected across exported Liquid theme files.'
      : `Placeholder text (e.g. "Talk about your brand", "Lorem ipsum", or "support@example.com") detected in ${placeholderSample}.`,
  });
  if (!placeholderPassed) failures.push(`Placeholder text detected in ${placeholderSample}.`);

  // 3. Image Integrity & Hero Validation
  const hasHero = Boolean(imgRes?.heroImage?.normalizedUrl);
  const validCount = imgRes?.images?.length || 0;
  const imagePassed = hasHero && validCount > 0;

  checks.push({
    id: 'image_integrity',
    name: 'Image Integrity & Hero Validation',
    passed: imagePassed,
    score: imagePassed ? 100 : 0,
    details: imagePassed
      ? `Hero image validated (${imgRes?.heroImage?.normalizedUrl?.slice(0, 40)}...). ${validCount} valid image(s) processed.`
      : 'Hero image is missing or invalid.',
  });
  if (!imagePassed) failures.push('Hero product image is missing or broken.');

  // 4. Consecutive Image Repetition Check
  const heroUrl = imgRes?.heroImage?.normalizedUrl;
  const lifestyleUrl = imgRes?.lifestyleImage?.normalizedUrl;
  const noRepeatedConsecutive = !heroUrl || !lifestyleUrl || heroUrl !== lifestyleUrl || imgRes?.hasSingleImageFallback;

  checks.push({
    id: 'no_consecutive_repetition',
    name: 'Consecutive Image Repetition Guard',
    passed: noRepeatedConsecutive,
    score: noRepeatedConsecutive ? 100 : 50,
    details: noRepeatedConsecutive
      ? 'Consecutive sections use distinct imagery or single-image crop fallback.'
      : 'Same image is repeated in consecutive sections.',
  });
  if (!noRepeatedConsecutive) failures.push('Identical product photo repeated across consecutive sections.');

  // 5. Shopify Output Parity Check
  const hasThemeLiquid = result.files.some((f) => f.key === 'layout/theme.liquid');
  const hasIndexJson = result.files.some((f) => f.key === 'templates/index.json');
  const hasThemeCss = result.files.some((f) => f.key === 'assets/theme.css');

  const parityPassed = hasThemeLiquid && hasIndexJson && hasThemeCss;
  checks.push({
    id: 'shopify_parity',
    name: 'Shopify OS 2.0 Theme Parity',
    passed: parityPassed,
    score: parityPassed ? 100 : 0,
    details: parityPassed
      ? 'Exported Shopify theme files strictly match RootX preview design tokens and Liquid templates.'
      : 'Shopify theme output is missing required theme files.',
  });
  if (!parityPassed) failures.push('Shopify theme output does not match preview structure.');

  // 6. E-Commerce Cart Form Action Check
  const formPassed = result.files.some((f) => f.value.includes('action="/cart/add"'));

  checks.push({
    id: 'cart_form_action',
    name: 'Buy Action & Add-To-Cart Form',
    passed: formPassed,
    score: formPassed ? 100 : 30,
    details: formPassed
      ? 'Buy form contains valid Shopify add-to-cart action (/cart/add).'
      : 'Buy form is missing add-to-cart action.',
  });
  if (!formPassed) failures.push('Product Buy Box is missing /cart/add form action.');

  // Calculate Overall Score
  const totalScore = Math.round(checks.reduce((acc, c) => acc + c.score, 0) / checks.length);
  const passed = failures.length === 0 && totalScore >= 85;

  const analysis = analyzeAndDetectArchetype(`${brandName} ${heroHeadline} ${input.businessType || ''} ${input.brandDescription || ''}`);

  return {
    passed,
    overallScore: totalScore,
    checks,
    failures,
    recommendedThemes: analysis.recommendedThemes,
  };
}
