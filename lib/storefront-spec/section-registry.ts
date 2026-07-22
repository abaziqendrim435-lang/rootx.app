// ============================================================
// RootX Storefront Section Type Registry
// Single canonical registry for all Liquid section types used in
// Shopify Online Store 2.0 theme generation and JSON templates.
// ============================================================

export const ROOTX_SECTION_TYPES = {
  ANNOUNCEMENT_BAR: 'rootx-announcement-bar',
  HEADER: 'rootx-header',
  HERO: 'rootx-hero',
  TRUST_STRIP: 'rootx-trust-strip',
  BENEFITS: 'rootx-benefits',
  PRODUCT_SHOWCASE: 'rootx-product-showcase',
  GALLERY: 'rootx-gallery',
  IMAGE_STORY: 'rootx-image-story',
  SPECIFICATIONS: 'rootx-specifications',
  FAQ: 'rootx-faq',
  FINAL_CTA: 'rootx-final-cta',
  FOOTER: 'rootx-footer',
  MAIN_PRODUCT: 'rootx-main-product',
} as const;

export type RootXSectionType = typeof ROOTX_SECTION_TYPES[keyof typeof ROOTX_SECTION_TYPES];

export const REQUIRED_ROOTX_LIQUID_SECTIONS: string[] = Object.values(ROOTX_SECTION_TYPES).map(
  (type) => `sections/${type}.liquid`
);

export function getSectionFileName(type: string): string {
  return `sections/${type}.liquid`;
}

export function isValidRootXSectionType(type: string): boolean {
  return (Object.values(ROOTX_SECTION_TYPES) as string[]).includes(type);
}
