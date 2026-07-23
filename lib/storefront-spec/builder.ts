// ============================================================
// RootX Storefront Pixel Parity Engine V1 — StorefrontSpec Builder
// Constructs the single canonical StorefrontSpec object from raw inputs.
// ============================================================

import type { WebsiteGeneration, WebsiteBuilderInput } from '../website-builder-types';
import type { StorefrontSpec, StorefrontImageAssignments } from './types';
import { buildCleanBrandProfile } from '../title-cleaner';
import { sanitizePlaceholders } from '../placeholder-cleaner';
import { runImagePipeline } from '../image-pipeline';
import { analyzeAndDetectArchetype } from '../design-engine/category-detector';
import { generateDesignTokens } from '../design-engine/design-tokens';
import { createSectionPlan } from '../design-engine/section-sequencer';
import { getArchetype } from '../design-engine/archetypes';

import type { ProductImageLibrary } from '../image-pipeline/types';
import { createProductImageLibrary, reassignImagesForTheme } from '../image-pipeline';

export function buildStorefrontSpec(
  rawGen: WebsiteGeneration,
  input: WebsiteBuilderInput,
  existingImageLibrary?: ProductImageLibrary
): StorefrontSpec {
  // 1. Clean Title, Brand Name, Hero Headline, and Slogan
  const profile = buildCleanBrandProfile(
    input.businessName,
    input.businessName,
    input.preferredStyle || 'modern_commerce',
    rawGen.homepage?.hero?.headline,
    rawGen.homepage?.hero?.subheadline
  );

  // 2. Purge Placeholder Text
  const gen = sanitizePlaceholders(rawGen, profile.cleanBrandName);

  // 3. Archetype & Design Token Selection
  const textToScan = `${input.businessType} ${input.brandDescription} ${input.businessName} ${gen.ecommerce?.shippingText || ''}`;
  const categoryAnalysis = analyzeAndDetectArchetype(textToScan, input.preferredStyle);
  const archetypeId = categoryAnalysis.selectedArchetype;

  // 4. Reuse or Create Canonical Product Image Library & Recalculate Theme Role Assignments
  const imageLibrary = existingImageLibrary || createProductImageLibrary({ gen, input, ecommerce: gen.ecommerce });
  const themeAssignments = reassignImagesForTheme(imageLibrary, archetypeId);

  const images: StorefrontImageAssignments = {
    hero: themeAssignments.hero,
    featured: themeAssignments.featured,
    gallery: themeAssignments.gallery,
    story: themeAssignments.story,
    finalCta: themeAssignments.finalCta,
    hasSingleImageFallback: themeAssignments.hasSingleImageFallback,
  };

  const designTokens = generateDesignTokens(
    archetypeId,
    input.primaryColor,
    input.secondaryColor
  );

  const sectionPlan = createSectionPlan(archetypeId);
  const archDef = getArchetype(archetypeId);

  // 5. Construct Section Specifications with Multi-Image Gallery Blocks
  const galleryList = themeAssignments.productPageGallery && themeAssignments.productPageGallery.length > 0
    ? themeAssignments.productPageGallery.slice(0, 10)
    : (images.hero ? [images.hero] : []);

  const galleryBlocks = galleryList.map((img, i) => ({
    id: `image_${i + 1}`,
    type: 'image',
    settings: {
      image_url: img.normalizedUrl,
      alt_text: img.altText || profile.cleanProductName,
    },
  }));

  const sections = sectionPlan.sections.map((sec) => {
    const isGallerySection = sec.sectionId === 'rootx-gallery' || sec.sectionId === 'rootx-main-product' || sec.sectionId === 'rootx-hero';
    return {
      id: sec.sectionId,
      type: sec.sectionType,
      variant: sec.variantId,
      enabled: true,
      settings: {
        headline: profile.cleanHeroHeadline,
        subheadline: profile.cleanHeroSubheadline,
        cta_text: `Buy Now — $${gen.ecommerce?.price || '49.99'}`,
        cta_url: '/cart/add',
        hero_image: images.hero?.normalizedUrl || '',
      },
      blocks: isGallerySection ? galleryBlocks : undefined,
    };
  });

  return {
    version: '1.0',
    brand: {
      name: profile.cleanBrandName,
      slogan: profile.cleanHeroHeadline,
      category: categoryAnalysis.category,
    },
    product: {
      rawTitle: input.businessName,
      cleanName: profile.cleanProductName,
      shortDescription: gen.about?.content || profile.cleanHeroSubheadline,
      price: gen.ecommerce?.price || '49.99',
      compareAtPrice: gen.ecommerce?.compareAtPrice,
      shippingText: gen.ecommerce?.shippingText || 'Tracked Shipping',
      benefits: (gen.homepage?.features || []).map((f) => ({
        title: f.title,
        description: f.description,
        icon: f.icon,
      })),
      specifications: (gen.ecommerce?.specifications || []).map((s) => ({
        name: (s as any).name || (s as any).label || 'Spec',
        value: s.value,
      })),
      variants: (gen.ecommerce?.variants || []).map((v, i) => ({
        id: `var-${i + 1}`,
        name: v.name,
        price: gen.ecommerce?.price || '49.99',
        sku: `SKU-${i + 1}`,
        imageUrl: (v as any).imageUrl || '',
      })),
    },
    content: {
      heroHeadline: profile.cleanHeroHeadline,
      heroSubheadline: profile.cleanHeroSubheadline,
      ctaPrimary: `Buy Now — $${gen.ecommerce?.price || '49.99'}`,
      ctaSecondary: 'Discover Features',
      faq: gen.faq?.items || [
        { question: 'What is the shipping time?', answer: 'Orders are processed within 24 hours and shipped via express tracking.' },
        { question: 'What is your return policy?', answer: 'We offer a 30-day money-back guarantee on all orders.' },
      ],
      trustItems: [
        { icon: '🛡️', title: '30-Day Guarantee', subtitle: '100% Risk-free' },
        { icon: '🚚', title: 'Express Delivery', subtitle: 'Tracked shipping' },
        { icon: '🔒', title: '256-Bit SSL', subtitle: 'Safe checkout' },
      ],
      aboutStory: gen.about?.content,
    },
    archetype: archetypeId,
    designTokens,
    images,
    imageLibrary,
    imageAssignments: themeAssignments,
    sections,
    navigation: {
      links: [
        { label: 'Home', url: '/' },
        { label: 'Shop', url: '/collections/all' },
        { label: 'FAQ', url: '/pages/faq' },
        { label: 'Contact', url: '/pages/contact' },
      ],
    },
    trustMessages: [
      '30-Day Money-Back Guarantee',
      'Free Express Delivery',
      '256-Bit SSL Encrypted Checkout',
    ],
    productPage: {
      layout: archDef.productPageLayout,
      showQuantity: true,
      showTrustBadges: true,
      stickyAddToCart: true,
    },
    responsiveSettings: {
      containerMaxWidth: '1200px',
      desktopPadding: '1.5rem',
      mobilePadding: '1rem',
      mobileStack: true,
    },
    animationSettings: {
      hoverEffects: true,
      transitions: true,
    },
    accessibilitySettings: {
      contrastRatio: '4.5:1',
      altTextRequired: true,
    },
  };
}
