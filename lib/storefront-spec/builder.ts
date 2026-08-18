// ============================================================
// RootX Storefront Pixel Parity Engine V1 — StorefrontSpec Builder
// Constructs the single canonical StorefrontSpec object from raw inputs.
// ============================================================

import type { WebsiteGeneration, WebsiteBuilderInput, DesignArchetypeId } from '../website-builder-types';
import type { StorefrontSpec, StorefrontImageAssignments } from './types';
import { buildCleanBrandProfile } from '../title-cleaner';
import { sanitizePlaceholders } from '../placeholder-cleaner';
import { analyzeAndDetectArchetype } from '../design-engine/category-detector';
import { generateDesignTokens } from '../design-engine/design-tokens';
import { createSectionPlan } from '../design-engine/section-sequencer';
import { getArchetype } from '../design-engine/archetypes';

import type { ProductImageLibrary } from '../image-pipeline/types';
import { createProductImageLibrary, reassignImagesForTheme, resolveRenderableImage, getPersistedLibraryUrl } from '../image-pipeline';

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

  // 4. Image Pipeline — ProductImageLibrary is the ONLY canonical image source
  if (!existingImageLibrary) {
    console.warn(
      '[StorefrontSpec Builder] No ProductImageLibrary provided. Rebuilding from generation payload (legacy path).'
    );
  }
  const imageLibrary = existingImageLibrary || createProductImageLibrary(gen);
  const rawSelections = (gen.ecommerce as any)?.aiImageSelections || (gen as any)?.aiImageSelections || (gen as any)?.imageSelections;
  const aiSelections = {
    heroImageIndex: rawSelections?.heroImageIndex ?? (gen.ecommerce as any)?.heroImageIndex ?? (gen as any)?.heroImageIndex,
    heroImageId: rawSelections?.heroImageId ?? (gen.ecommerce as any)?.heroImageId ?? (gen as any)?.heroImageId,
    storyImageIndex: rawSelections?.storyImageIndex ?? (gen.ecommerce as any)?.storyImageIndex ?? (gen as any)?.storyImageIndex,
    storyImageId: rawSelections?.storyImageId ?? (gen.ecommerce as any)?.storyImageId ?? (gen as any)?.storyImageId,
    featuredImageIndex: rawSelections?.featuredImageIndex ?? (gen.ecommerce as any)?.featuredImageIndex ?? (gen as any)?.featuredImageIndex,
    featuredImageId: rawSelections?.featuredImageId ?? (gen.ecommerce as any)?.featuredImageId ?? (gen as any)?.featuredImageId,
    galleryImageIndexes: rawSelections?.galleryImageIndexes ?? (gen.ecommerce as any)?.galleryImageIndexes ?? (gen as any)?.galleryImageIndexes,
    finalCtaImageIndex: rawSelections?.finalCtaImageIndex ?? (gen.ecommerce as any)?.finalCtaImageIndex ?? (gen as any)?.finalCtaImageIndex,
  };

  const themeAssignments = reassignImagesForTheme(imageLibrary, archetypeId, aiSelections);

  const images: StorefrontImageAssignments = {
    hero: themeAssignments.hero,
    featured: themeAssignments.featured,
    gallery: themeAssignments.gallery,
    story: themeAssignments.story,
    finalCta: themeAssignments.finalCta,
    benefitImages: themeAssignments.benefitImages,
    comparisonImage: themeAssignments.comparisonImage,
    hasSingleImageFallback: themeAssignments.hasSingleImageFallback,
  };

  const sectionRoleUrls = [
    images.hero,
    images.story,
    images.featured,
    images.finalCta,
    ...images.benefitImages,
    images.comparisonImage,
  ]
    .filter(Boolean)
    .map((img) => getPersistedLibraryUrl(img!) || resolveRenderableImage(img!));
  const uniqueSectionUrls = new Set(sectionRoleUrls.filter(Boolean));

  console.log('[StorefrontSpec Builder] IMAGE ASSIGNMENT DIAGNOSTICS:', {
    PRODUCT_IMAGE_LIBRARY_TOTAL: imageLibrary.allValidImages.length,
    STOREFRONT_GALLERY_TOTAL: images.gallery.length,
    UNIQUE_IMAGES_AVAILABLE: imageLibrary.allValidImages.length,
    PRODUCT_PAGE_GALLERY_SIZE: themeAssignments.productPageGallery?.length || 0,
    HERO: resolveRenderableImage(images.hero)?.slice(0, 80) || 'NONE',
    STORY: resolveRenderableImage(images.story)?.slice(0, 80) || 'NONE',
    FEATURED: resolveRenderableImage(images.featured)?.slice(0, 80) || 'NONE',
    FINAL_CTA: resolveRenderableImage(images.finalCta)?.slice(0, 80) || 'NONE',
    BENEFIT_IMAGES: images.benefitImages.map((img) => resolveRenderableImage(img)?.slice(0, 60)),
    COMPARISON: resolveRenderableImage(images.comparisonImage)?.slice(0, 80) || 'NONE',
    UNIQUE_SECTION_ROLE_URLS: uniqueSectionUrls.size,
    HAS_SINGLE_FALLBACK: images.hasSingleImageFallback,
  });

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
  const galleryList = themeAssignments.productPageGallery.length > 0
    ? themeAssignments.productPageGallery
    : imageLibrary.allValidImages;
  const hasGalleryContent = galleryList.length > 0;

  const galleryBlocks = galleryList.map((img, i) => ({
    id: `image_${i + 1}`,
    type: 'image',
    settings: {
      image_url: resolveRenderableImage(img),
      alt_text: img.altText || profile.cleanProductName,
    },
  }));

  const benefitBlocks = (gen.homepage?.features || []).map((feature, i) => ({
    id: `benefit_${i + 1}`,
    type: 'benefit',
    settings: {
      title: feature.title,
      description: feature.description,
      icon: feature.icon || '',
      image_url: images.benefitImages[i]
        ? resolveRenderableImage(images.benefitImages[i])
        : '',
    },
  }));

  const sections = sectionPlan.sections.map((sec) => {
    const isGallerySection =
      sec.sectionId === 'rootx-gallery' || sec.sectionId === 'rootx-main-product';
    
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

    const heroImageResolved = resolveRenderableImage(images.hero);
    const storyImageResolved = resolveRenderableImage(images.story);
    const showcaseImageResolved = resolveRenderableImage(images.featured);
    const finalCtaImageResolved = resolveRenderableImage(images.finalCta);
    const comparisonImageResolved = resolveRenderableImage(images.comparisonImage);

    const sectionImageMap: Record<string, string> = {
      'rootx-hero': heroImageResolved,
      'rootx-image-story': storyImageResolved,
      'rootx-product-showcase': showcaseImageResolved,
      'rootx-final-cta': finalCtaImageResolved,
      'rootx-comparison': comparisonImageResolved,
    };

    const sectionBlocks =
      sec.sectionId === 'rootx-benefits' && benefitBlocks.length > 0
        ? benefitBlocks
        : isGallerySection
          ? galleryBlocks
          : undefined;

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
        hero_image: sectionImageMap[sec.sectionId] || heroImageResolved,
        story_image: storyImageResolved,
        section_image: sectionImageMap[sec.sectionId] || storyImageResolved,
        showcase_image: showcaseImageResolved,
        comparison_image: comparisonImageResolved,
        final_cta_image: finalCtaImageResolved,
      },
      blocks: sectionBlocks,
    };
  });

  const heroImageResolvedForProduct = resolveRenderableImage(images.hero);
  const showcaseImageResolvedForProduct = resolveRenderableImage(images.featured);

  const sectionsWithProductPage = [
    ...sections,
    {
      id: 'rootx-main-product',
      type: 'rootx-main-product',
      variant: archDef.productPageLayout || 'standard',
      enabled: true,
      required: true,
      settings: {
        headline: profile.cleanHeroHeadline,
        hero_image: heroImageResolvedForProduct,
        showcase_image: showcaseImageResolvedForProduct,
        cta_text: `Buy Now — $${gen.ecommerce?.price || '49.99'}`,
        cta_url: '/cart/add',
      },
      blocks: galleryBlocks,
    },
  ];

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
    sections: sectionsWithProductPage,
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
