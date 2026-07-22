// ============================================================
// RootX Storefront Pixel Parity Engine V1 — Parity Validator
// Deterministically compares StorefrontSpec vs exported Shopify Theme
// ============================================================

import type { StorefrontSpec } from './storefront-spec/types';
import type { ShopifyThemeFile } from './shopify-types';
import { hasPlaceholderContent } from './placeholder-cleaner';

export interface ParityFieldCheck {
  field: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export interface ParityReport {
  passed: boolean;
  overallScore: number;
  checks: ParityFieldCheck[];
  failures: string[];
}

export function validatePreviewExportParity(
  spec: StorefrontSpec,
  themeFiles: ShopifyThemeFile[]
): ParityReport {
  const checks: ParityFieldCheck[] = [];
  const failures: string[] = [];

  // 1. Archetype Check
  const cssFile = themeFiles.find((f) => f.key === 'assets/theme.css')?.value || '';
  const hasArchetypeInCss = cssFile.includes(spec.archetype) || cssFile.includes('--rx-color-primary');
  checks.push({
    field: 'archetype',
    passed: hasArchetypeInCss,
    expected: spec.archetype,
    actual: hasArchetypeInCss ? spec.archetype : 'Unknown/Missing',
  });
  if (!hasArchetypeInCss) failures.push(`Archetype design tokens missing from theme.css.`);

  // 2. Section Count & Order Check
  const indexJsonFile = themeFiles.find((f) => f.key === 'templates/index.json')?.value || '';
  let exportedOrder: string[] = [];
  try {
    const indexParsed = JSON.parse(indexJsonFile);
    exportedOrder = indexParsed.order || [];
  } catch {}

  const specOrder = spec.sections.map((s) => s.id);
  const sameOrder = JSON.stringify(specOrder) === JSON.stringify(exportedOrder);

  checks.push({
    field: 'sectionOrder',
    passed: sameOrder,
    expected: specOrder.join(','),
    actual: exportedOrder.join(','),
  });
  if (!sameOrder) failures.push(`Section order mismatch between spec and templates/index.json.`);

  // 3. Clean Product Name Parity
  const heroLiquid = themeFiles.find((f) => f.key.includes('hero'))?.value || '';
  const containsCleanTitle = heroLiquid.includes(spec.product.cleanName) || themeFiles.some(f => f.value.includes(spec.product.cleanName));
  checks.push({
    field: 'cleanProductName',
    passed: containsCleanTitle,
    expected: spec.product.cleanName,
    actual: containsCleanTitle ? spec.product.cleanName : 'Missing in Liquid',
  });
  if (!containsCleanTitle) failures.push(`Clean product name "${spec.product.cleanName}" not found in Liquid section.`);

  // 4. Hero Image URL Parity
  const specHeroUrl = spec.images.hero?.normalizedUrl || '';
  const containsHeroImg = !specHeroUrl || themeFiles.some((f) => f.value.includes(specHeroUrl));
  checks.push({
    field: 'heroImageUrl',
    passed: containsHeroImg,
    expected: specHeroUrl || 'None',
    actual: containsHeroImg ? (specHeroUrl || 'None') : 'Missing in Liquid',
  });
  if (!containsHeroImg) failures.push(`Hero image URL "${specHeroUrl}" not found in Liquid theme.`);

  // 5. Product Cart Form Action
  const hasCartForm = themeFiles.some((f) => f.value.includes('action="/cart/add"'));
  checks.push({
    field: 'cartFormAction',
    passed: hasCartForm,
    expected: 'action="/cart/add"',
    actual: hasCartForm ? 'action="/cart/add"' : 'Missing Form Action',
  });
  if (!hasCartForm) failures.push(`Product buy form is missing action="/cart/add".`);

  // 6. Zero Placeholder Content
  let placeholderDetected = false;
  themeFiles.forEach((f) => {
    if (hasPlaceholderContent(f.value)) {
      placeholderDetected = true;
    }
  });

  checks.push({
    field: 'noPlaceholders',
    passed: !placeholderDetected,
    expected: 'Zero Placeholders',
    actual: placeholderDetected ? 'Placeholders Found' : 'Zero Placeholders',
  });
  if (placeholderDetected) failures.push(`Placeholder content detected in exported theme files.`);

  // 7. Section Reference Integrity (JSON & Liquid tags vs. sections/*.liquid)
  const fileKeysSet = new Set(themeFiles.map((f) => f.key));
  let missingRefFound = false;
  themeFiles.forEach((file) => {
    if (file.key.startsWith('templates/') && file.key.endsWith('.json')) {
      try {
        const parsed = JSON.parse(file.value);
        if (parsed.sections) {
          for (const sId of Object.keys(parsed.sections)) {
            const sType = parsed.sections[sId]?.type;
            if (sType && !fileKeysSet.has(`sections/${sType}.liquid`)) {
              missingRefFound = true;
            }
          }
        }
      } catch {}
    }
    if (file.key.endsWith('.liquid')) {
      const matches = file.value.matchAll(/{%\s*section\s*['"]([^'"]+)['"]\s*%}/g);
      for (const m of matches) {
        if (!fileKeysSet.has(`sections/${m[1]}.liquid`)) {
          missingRefFound = true;
        }
      }
    }
  });

  checks.push({
    field: 'sectionReferencesExist',
    passed: !missingRefFound,
    expected: 'All Referenced Sections Exist',
    actual: missingRefFound ? 'Missing Section References' : 'All Referenced Sections Exist',
  });
  if (missingRefFound) failures.push('One or more referenced Liquid section types do not exist in sections/.');

  // Score Calculation
  const passedCount = checks.filter((c) => c.passed).length;
  const overallScore = Math.round((passedCount / checks.length) * 100);
  const passed = failures.length === 0 && overallScore === 100;

  return {
    passed,
    overallScore,
    checks,
    failures,
  };
}
