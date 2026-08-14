// ============================================================
// RootX Storefront Pixel Parity Engine V1 — StorefrontSpec Builder
// Constructs the single canonical StorefrontSpec object from raw inputs.
// ============================================================

import type { WebsiteGeneration, WebsiteBuilderInput, DesignArchetypeId } from '../website-builder-types';
import type { StorefrontSpec, StorefrontImageAssignments } from './types';
import { buildCleanBrandProfile } from '../title-cleaner';
import { sanitizePlaceholders } from '../placeholder-cleaner';
import { runImagePipeline } from '../image-pipeline';
import { analyzeAndDetectArchetype } from '../design-engine/category-detector';
import { generateDesignTokens } from '../design-engine/design-tokens';
import { createSectionPlan } from '../design-engine/section-sequencer';
import { getArchetype } from '../design-engine/archetypes';

import type { ProductImageLibrary } from '../image-pipeline/types';
import { createProductImageLibrary, reassignImagesForTheme, resolveRenderableImage } from '../image-pipeline';

import { THEME_FAMILIES } from '../design-engine/theme-family-types';

export function buildStorefrontSpec(
  rawGen: WebsiteGeneration,
  input: WebsiteBuilderInput,
  existingImageLibrary?: ProductImageLibrary
): StorefrontSpec {
  // 1. Clean Title, Brand Name, Hero Headline, and Slogan
  const profile = buildCleanBrandProfile(
    input.businessName,
    rawGen.homepage?.hero?.headline,
    input.preferredStyle,
    input.businessType
  );

  // 2. Sanitize Placeholders
  const gen = sanitizePlaceholders(rawGen, profile.cleanBrandName);

  // 3. Category & Design System Detection
  const textToScan = `${input.businessType} ${input.brandDescription} ${input.businessName} ${gen.ecommerce?.shippingText || ''}`;
  const categoryAnalysis = analyzeAndDetectArchetype(textToScan, input.preferredStyle);
  const archetypeId: DesignArchetypeId = getArchetype(input.preferredStyle || categoryAnalysis.selectedArchetype).id;
  const familyConfig = THEME_FAMILIES[archetypeId] || THEME_FAMILIES.modern_tech;

  // 4. Image Pipeline with Persistent Product Image Library
  const imageLibrary = existingImageLibrary || createProductImageLibrary(gen);
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

  // 5. Content Availability Checks
  const hasFaqContent = Boolean(gen.faq?.items && gen.faq.items.length > 0);
  const hasBenefitsContent = Boolean(gen.homepage?.features && gen.homepage.features.length > 0);
  const hasSpecsContent = Boolean(gen.ecommerce?.specifications && gen.ecommerce.specifications.length > 0);
  const hasStoryContent = Boolean(gen.about?.content || images.story);

  // 6. Construct Section Specifications with Multi-Image Gallery Blocks
  const galleryList = themeAssignments.productPageGallery && themeAssignments.productPageGallery.length > 0
    ? themeAssignments.productPageGallery
    : (images.hero ? [images.hero] : []);
  const hasGalleryContent = galleryList.length > 0;

  const galleryBlocks = galleryList.map((img, i) => ({
    id: `image_${i + 1}`,
    type: 'image',
    settings: {
      image_url: resolveRenderableImage(img),
      alt_text: img.altText || profile.cleanProductName,
    },
  }));

  const sections = sectionPlan.sections.map((sec) => {
    const isGallerySection = sec.sectionId === 'rootx-gallery' || sec.sectionId === 'rootx-main-product' || sec.sectionId === 'rootx-hero';
    
    let enabled = true;
    let required = familyConfig.requiredSections.includes(sec.sectionId);

    if (sec.sectionId === 'rootx-faq') {
      enabled = hasFaqContent;
      if (!hasFaqContent) required = false;
    } else if (sec.sectionId === 'rootx-benefits') {
      enabled = hasBenefitsContent;
      if (!hasBenefitsContent) required = false;
    } else if (sec.sectionId === 'rootx-specifications') {
      enabled = hasSpecsContent;
      if (!hasSpecsContent) required = false;
    } else if (sec.sectionId === 'rootx-image-story') {
      enabled = hasStoryContent;
      if (!hasStoryContent) required = false;
    } else if (sec.sectionId === 'rootx-gallery') {
      enabled = hasGalleryContent;
      if (!hasGalleryContent) required = false;
    }

    if (sec.sectionId === 'rootx-hero') {
      enabled = true;
      required = true;
    }

    const sectionImageMap: Record<string, string> = {
      'rootx-hero': resolveRenderableImage(images.hero),
      'rootx-image-story': resolveRenderableImage(images.story),
      'rootx-product-showcase': resolveRenderableImage(images.featured || images.story),
      'rootx-final-cta': resolveRenderableImage(images.finalCta),
    };

    return {
      id: sec.sectionId,
      type: sec.sectionType,
      variant: sec.variantId,
      enabled,
      required,
      settings: {
        headline: profile.cleanHeroHeadline,
        subheadline: profile.cleanHeroSubheadline,
        cta_text: `Buy Now — $${gen.ecommerce?.price || '49.99'}`,
        cta_url: '/cart/add',
        hero_image: sectionImageMap[sec.sectionId] || resolveRenderableImage(images.hero),
        section_image: sectionImageMap[sec.sectionId] || '',
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
      comparison: [
        { feature: 'Premium Material & Build', us: '✅ Medical-Grade Precision', others: '❌ Cheap Synthetic Blend' },
        { feature: 'Money-Back Guarantee', us: '✅ 30-Day Full Refund', others: '❌ No Refunds / All Sales Final' },
        { feature: 'Customer Support', us: '✅ 24/7 Dedicated Support', others: '❌ Automated Bot / No Reply' },
        { feature: 'Shipping & Tracking', us: '✅ Express Insured Delivery', others: '❌ Uninsured 4-Week Delivery' },
      ],
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
