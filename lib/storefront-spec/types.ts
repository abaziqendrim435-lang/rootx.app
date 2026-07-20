// ============================================================
// RootX Storefront Pixel Parity Engine V1 — StorefrontSpec Types
// The single canonical source of truth for both React Preview
// and Shopify ZIP export rendering.
// ============================================================

import type { DesignArchetypeId, DesignTokens } from '../website-builder-types';
import type { NormalizedImage } from '../image-pipeline/types';

export interface StorefrontBrandSpec {
  name: string;          // Max 18 chars
  slogan: string;        // Max 60 chars
  logoUrl?: string;
  category: string;
}

export interface StorefrontProductSpec {
  rawTitle: string;
  cleanName: string;     // Max 45 chars
  shortDescription: string;
  price: string;
  compareAtPrice?: string;
  shippingText: string;
  benefits: { title: string; description: string; icon?: string }[];
  specifications: { name: string; value: string }[];
  variants: { id: string; name: string; price: string; sku?: string; imageUrl?: string }[];
}

export interface StorefrontContentSpec {
  heroHeadline: string;  // Max 60 chars
  heroSubheadline: string; // Max 140 chars
  ctaPrimary: string;
  ctaSecondary: string;
  faq: { question: string; answer: string }[];
  trustItems: { icon: string; title: string; subtitle: string }[];
  aboutStory?: string;
}

export interface StorefrontImageAssignments {
  hero: NormalizedImage | null;
  featured: NormalizedImage | null;
  gallery: NormalizedImage[];
  story: NormalizedImage | null;
  finalCta: NormalizedImage | null;
  hasSingleImageFallback: boolean;
}

export interface StorefrontSectionSpec {
  id: string;
  type: string;
  variant: string;
  enabled: boolean;
  settings: Record<string, string | number | boolean | string[]>;
  blocks?: Record<string, unknown>[];
}

export interface StorefrontSpec {
  version: '1.0';
  brand: StorefrontBrandSpec;
  product: StorefrontProductSpec;
  content: StorefrontContentSpec;
  archetype: DesignArchetypeId;
  designTokens: DesignTokens;
  images: StorefrontImageAssignments;
  sections: StorefrontSectionSpec[];
  navigation: { links: { label: string; url: string }[] };
  trustMessages: string[];
  productPage: {
    layout: string;
    showQuantity: boolean;
    showTrustBadges: boolean;
    stickyAddToCart: boolean;
  };
  responsiveSettings: {
    containerMaxWidth: string;
    desktopPadding: string;
    mobilePadding: string;
    mobileStack: boolean;
  };
  animationSettings: {
    hoverEffects: boolean;
    transitions: boolean;
  };
  accessibilitySettings: {
    contrastRatio: string;
    altTextRequired: boolean;
  };
}
