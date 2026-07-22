// ============================================================
// RootX Design Engine V1 — Section Sequencer
// Determines unique section order and variant selections per theme family.
// ============================================================

import type { DesignArchetypeId, SectionPlan, SectionVariantSelection } from '../website-builder-types';
import { THEME_FAMILIES } from './theme-family-types';

export function createSectionPlan(archetypeId: DesignArchetypeId): SectionPlan {
  const family = THEME_FAMILIES[archetypeId] || THEME_FAMILIES.modern_tech;

  const sectionVariantMap: Record<string, { type: string; variant: string; name: string }> = {
    'rootx-hero': { type: 'rootx-hero', variant: family.heroType, name: 'RootX Hero' },
    'rootx-trust-strip': { type: 'rootx-trust-strip', variant: 'default', name: 'RootX Trust Strip' },
    'rootx-benefits': { type: 'rootx-benefits', variant: family.cardDesign, name: 'RootX Benefits' },
    'rootx-product-showcase': { type: 'rootx-product-showcase', variant: 'showcase', name: 'RootX Product Showcase' },
    'rootx-gallery': { type: 'rootx-gallery', variant: family.galleryStyle, name: 'RootX Gallery' },
    'rootx-image-story': { type: 'rootx-image-story', variant: 'story-split', name: 'RootX Image Story' },
    'rootx-specifications': { type: 'rootx-specifications', variant: 'spec-grid', name: 'RootX Specifications' },
    'rootx-faq': { type: 'rootx-faq', variant: 'accordion', name: 'RootX FAQ' },
    'rootx-final-cta': { type: 'rootx-final-cta', variant: 'banner', name: 'RootX Final CTA' },
  };

  const selections: SectionVariantSelection[] = family.sectionOrder.map((secId) => {
    const meta = sectionVariantMap[secId] || { type: secId, variant: 'default', name: secId };
    return {
      sectionId: secId,
      sectionType: meta.type,
      variantId: meta.variant,
      variantName: meta.name,
    };
  });

  return {
    archetypeId,
    sections: selections,
    totalSections: selections.length,
  };
}
