// ============================================================
// RootX Design Engine V1 — Section Sequencer
// Determines section layout, dynamic order, and variant selections.
// ============================================================

import type { DesignArchetypeId, SectionPlan, SectionVariantSelection } from '../website-builder-types';

export function createSectionPlan(archetypeId: DesignArchetypeId): SectionPlan {
  let selections: SectionVariantSelection[] = [];

  switch (archetypeId) {
    case 'luxury_editorial':
      selections = [
        { sectionId: 'hero', sectionType: 'editorial_hero', variantId: 'fullscreen-editorial', variantName: 'Fullscreen Editorial Hero' },
        { sectionId: 'trust', sectionType: 'trust_bar', variantId: 'card-badges', variantName: 'Card Badges Trust Bar' },
        { sectionId: 'benefits', sectionType: 'benefit_grid', variantId: 'icon-cards', variantName: 'Icon Cards Benefit Grid' },
        { sectionId: 'reviews', sectionType: 'social_proof', variantId: 'review-cards', variantName: 'Verified Buyer Cards' },
        { sectionId: 'faq', sectionType: 'faq', variantId: 'accordion', variantName: 'Animated Accordion FAQ' },
        { sectionId: 'newsletter', sectionType: 'newsletter', variantId: 'inline-form', variantName: 'Inline Newsletter Form' },
        { sectionId: 'footer', sectionType: 'premium_footer', variantId: 'multi-column', variantName: 'Multi-Column Premium Footer' },
      ];
      break;

    case 'modern_tech':
    case 'high_conversion_landing':
    default:
      selections = [
        { sectionId: 'hero', sectionType: 'product_hero', variantId: 'centered-product', variantName: 'Centered Product Hero' },
        { sectionId: 'trust', sectionType: 'trust_bar', variantId: 'card-badges', variantName: 'Card Badges Trust Bar' },
        { sectionId: 'benefits', sectionType: 'benefit_grid', variantId: 'icon-cards', variantName: 'Icon Cards Benefit Grid' },
        { sectionId: 'specs', sectionType: 'product_specifications', variantId: 'card-specs', variantName: 'Card Grid Specs' },
        { sectionId: 'reviews', sectionType: 'social_proof', variantId: 'review-cards', variantName: 'Verified Buyer Cards' },
        { sectionId: 'faq', sectionType: 'faq', variantId: 'accordion', variantName: 'Animated Accordion FAQ' },
        { sectionId: 'cta', sectionType: 'final_cta', variantId: 'gradient-banner', variantName: 'Gradient Banner CTA' },
        { sectionId: 'footer', sectionType: 'premium_footer', variantId: 'multi-column', variantName: 'Multi-Column Premium Footer' },
      ];
      break;
  }

  return {
    archetypeId,
    sections: selections,
    totalSections: selections.length,
  };
}
