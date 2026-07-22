// ============================================================
// RootX Design Engine V1 — Section Sequencer
// Determines section layout, dynamic order, and variant selections.
// ============================================================

import type { DesignArchetypeId, SectionPlan, SectionVariantSelection } from '../website-builder-types';

export function createSectionPlan(archetypeId: DesignArchetypeId): SectionPlan {
  let heroVariant = 'split';
  if (archetypeId === 'luxury_editorial') heroVariant = 'editorial';
  else if (archetypeId === 'modern_tech' || archetypeId === 'bold_fitness') heroVariant = 'split';
  else if (archetypeId === 'soft_beauty' || archetypeId === 'friendly_pet') heroVariant = 'minimal';
  else if (archetypeId === 'high_conversion_landing') heroVariant = 'full-bleed';

  const selections: SectionVariantSelection[] = [
    { sectionId: 'rootx-hero', sectionType: 'rootx-hero', variantId: heroVariant, variantName: 'RootX Hero' },
    { sectionId: 'rootx-trust-strip', sectionType: 'rootx-trust-strip', variantId: 'default', variantName: 'RootX Trust Strip' },
    { sectionId: 'rootx-benefits', sectionType: 'rootx-benefits', variantId: 'grid', variantName: 'RootX Benefits' },
    { sectionId: 'rootx-product-showcase', sectionType: 'rootx-product-showcase', variantId: 'showcase', variantName: 'RootX Product Showcase' },
    { sectionId: 'rootx-gallery', sectionType: 'rootx-gallery', variantId: 'gallery-4col', variantName: 'RootX Gallery' },
    { sectionId: 'rootx-image-story', sectionType: 'rootx-image-story', variantId: 'story-split', variantName: 'RootX Image Story' },
    { sectionId: 'rootx-specifications', sectionType: 'rootx-specifications', variantId: 'spec-grid', variantName: 'RootX Specifications' },
    { sectionId: 'rootx-faq', sectionType: 'rootx-faq', variantId: 'accordion', variantName: 'RootX FAQ' },
    { sectionId: 'rootx-final-cta', sectionType: 'rootx-final-cta', variantId: 'banner', variantName: 'RootX Final CTA' },
  ];

  return {
    archetypeId,
    sections: selections,
    totalSections: selections.length,
  };
}
