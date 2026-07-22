// ============================================================
// RootX Design Engine V1 — 8 Theme Families Architecture
// Defines unique section order, hero structure, gallery style,
// spacing rhythm, card design, and product page layout per family.
// ============================================================

import type { DesignArchetypeId } from '../website-builder-types';

export interface ThemeFamilyConfig {
  id: DesignArchetypeId;
  name: string;
  tagline: string;
  description: string;
  targetCategories: string[];
  
  // Section Sequence (Must be unique per theme family)
  sectionOrder: string[];
  
  // Hero Composition
  heroType: 'dark-split' | 'soft-editorial' | 'full-bleed-editorial' | 'image-first-minimal' | 'warm-lifestyle-split' | 'bold-action-dynamic' | 'playful-centered' | 'direct-response-buybox';
  
  // Header Style
  headerStyle: 'compact-tech' | 'soft-floating' | 'minimal-nav' | 'image-nav' | 'warm-centered' | 'bold-condensed' | 'playful-colorful' | 'sticky-buybox';
  
  // Gallery Style
  galleryStyle: 'tech-grid-4col' | 'soft-rounded-cards' | 'lookbook-asymmetric' | 'horizontal-scroll' | 'warm-lifestyle-grid' | 'bold-performance-grid' | 'playful-bubbly-grid' | 'conversion-stacked-blocks';
  
  // Card Design
  cardDesign: 'dark-bordered' | 'soft-shadow-white' | 'gold-border-minimal' | 'flat-no-border' | 'cozy-warm-card' | 'high-contrast-bold' | 'bubbly-rounded-pink' | 'clean-conversion-box';
  
  // Spacing Rhythm
  spacingRhythm: 'compact-dense' | 'generous-airy' | 'expansive-luxury' | 'tight-editorial' | 'cozy-medium' | 'ultra-compact-action' | 'bouncy-medium' | 'conversion-focused-padding';
  
  // Product Page Layout
  productPageStructure: 'tech-spec-split' | 'soft-ingredient-cards' | 'editorial-monochrome' | 'lookbook-vertical' | 'warm-lifestyle-accordion' | 'bold-sticky-buy' | 'playful-bubbly' | 'long-form-direct-response';

  // Typography & Color Signature
  fonts: { heading: string; body: string; googleFontsUrl: string };
  colors: { primary: string; secondary: string; background: string; surface: string; text: string; muted: string; border: string };
}

export const THEME_FAMILIES: Record<DesignArchetypeId, ThemeFamilyConfig> = {
  modern_tech: {
    id: 'modern_tech',
    name: 'Modern Technology',
    tagline: 'Futuristic, precision-engineered, dark-mode focused',
    description: 'Designed for consumer electronics, gadgets, audio gear, and smart hardware.',
    targetCategories: ['electronics', 'gadgets', 'tech', 'audio', 'hardware'],
    sectionOrder: [
      'rootx-hero',
      'rootx-specifications',
      'rootx-benefits',
      'rootx-product-showcase',
      'rootx-trust-strip',
      'rootx-gallery',
      'rootx-faq',
      'rootx-final-cta'
    ],
    heroType: 'dark-split',
    headerStyle: 'compact-tech',
    galleryStyle: 'tech-grid-4col',
    cardDesign: 'dark-bordered',
    spacingRhythm: 'compact-dense',
    productPageStructure: 'tech-spec-split',
    fonts: {
      heading: 'Space Grotesk',
      body: 'Inter',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&display=swap'
    },
    colors: {
      primary: '#3b82f6',
      secondary: '#06b6d4',
      background: '#090d16',
      surface: '#111827',
      text: '#f9fafb',
      muted: '#9ca3af',
      border: '#1f2937'
    }
  },

  soft_beauty: {
    id: 'soft_beauty',
    name: 'Soft Beauty',
    tagline: 'Organic, serene, ingredient-led storytelling',
    description: 'Designed for skincare, cosmetics, wellness, and self-care brands.',
    targetCategories: ['beauty', 'skincare', 'cosmetics', 'wellness', 'selfcare'],
    sectionOrder: [
      'rootx-hero',
      'rootx-image-story',
      'rootx-gallery',
      'rootx-benefits',
      'rootx-product-showcase',
      'rootx-trust-strip',
      'rootx-faq',
      'rootx-final-cta'
    ],
    heroType: 'soft-editorial',
    headerStyle: 'soft-floating',
    galleryStyle: 'soft-rounded-cards',
    cardDesign: 'soft-shadow-white',
    spacingRhythm: 'generous-airy',
    productPageStructure: 'soft-ingredient-cards',
    fonts: {
      heading: 'Playfair Display',
      body: 'Outfit',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Outfit:wght@300;400;500&display=swap'
    },
    colors: {
      primary: '#ec4899',
      secondary: '#f43f5e',
      background: '#faf5f7',
      surface: '#ffffff',
      text: '#27272a',
      muted: '#71717a',
      border: '#f3e8ff'
    }
  },

  luxury_editorial: {
    id: 'luxury_editorial',
    name: 'Luxury Editorial',
    tagline: 'Timeless elegance, gold accents, magazine grid',
    description: 'Designed for high-end fashion, jewelry, watches, and luxury items.',
    targetCategories: ['luxury', 'jewelry', 'watches', 'high-fashion', 'premium'],
    sectionOrder: [
      'rootx-hero',
      'rootx-gallery',
      'rootx-image-story',
      'rootx-product-showcase',
      'rootx-specifications',
      'rootx-final-cta'
    ],
    heroType: 'full-bleed-editorial',
    headerStyle: 'minimal-nav',
    galleryStyle: 'lookbook-asymmetric',
    cardDesign: 'gold-border-minimal',
    spacingRhythm: 'expansive-luxury',
    productPageStructure: 'editorial-monochrome',
    fonts: {
      heading: 'Cormorant Garamond',
      body: 'Montserrat',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Montserrat:wght@300;400;500&display=swap'
    },
    colors: {
      primary: '#d97706',
      secondary: '#b45309',
      background: '#0a0a0a',
      surface: '#171717',
      text: '#f5f5f5',
      muted: '#a3a3a3',
      border: '#262626'
    }
  },

  minimal_fashion: {
    id: 'minimal_fashion',
    name: 'Minimal Fashion',
    tagline: 'Image-first, tight editorial grid, clean typography',
    description: 'Designed for streetwear, apparel, shoes, and minimalist fashion labels.',
    targetCategories: ['fashion', 'apparel', 'streetwear', 'shoes', 'clothing'],
    sectionOrder: [
      'rootx-hero',
      'rootx-gallery',
      'rootx-product-showcase',
      'rootx-benefits',
      'rootx-image-story',
      'rootx-final-cta'
    ],
    heroType: 'image-first-minimal',
    headerStyle: 'image-nav',
    galleryStyle: 'horizontal-scroll',
    cardDesign: 'flat-no-border',
    spacingRhythm: 'tight-editorial',
    productPageStructure: 'lookbook-vertical',
    fonts: {
      heading: 'Outfit',
      body: 'Inter',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@500;700&family=Inter:wght@400;500&display=swap'
    },
    colors: {
      primary: '#18181b',
      secondary: '#27272a',
      background: '#ffffff',
      surface: '#f4f4f5',
      text: '#09090b',
      muted: '#71717a',
      border: '#e4e4e7'
    }
  },

  warm_home: {
    id: 'warm_home',
    name: 'Warm Home',
    tagline: 'Cozy neutral palette, comfort-led storytelling',
    description: 'Designed for home decor, furniture, bedding, kitchenware, and living.',
    targetCategories: ['home', 'decor', 'furniture', 'kitchen', 'living'],
    sectionOrder: [
      'rootx-hero',
      'rootx-benefits',
      'rootx-image-story',
      'rootx-gallery',
      'rootx-trust-strip',
      'rootx-specifications',
      'rootx-faq',
      'rootx-final-cta'
    ],
    heroType: 'warm-lifestyle-split',
    headerStyle: 'warm-centered',
    galleryStyle: 'warm-lifestyle-grid',
    cardDesign: 'cozy-warm-card',
    spacingRhythm: 'cozy-medium',
    productPageStructure: 'warm-lifestyle-accordion',
    fonts: {
      heading: 'Outfit',
      body: 'Outfit',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap'
    },
    colors: {
      primary: '#d97706',
      secondary: '#92400e',
      background: '#fefce8',
      surface: '#ffffff',
      text: '#1c1917',
      muted: '#78716c',
      border: '#fef3c7'
    }
  },

  bold_fitness: {
    id: 'bold_fitness',
    name: 'Bold Fitness',
    tagline: 'High contrast, energetic stats, performance focus',
    description: 'Designed for sports gear, gym equipment, supplements, and activewear.',
    targetCategories: ['fitness', 'sports', 'gym', 'supplements', 'activewear'],
    sectionOrder: [
      'rootx-hero',
      'rootx-trust-strip',
      'rootx-benefits',
      'rootx-specifications',
      'rootx-gallery',
      'rootx-final-cta'
    ],
    heroType: 'bold-action-dynamic',
    headerStyle: 'bold-condensed',
    galleryStyle: 'bold-performance-grid',
    cardDesign: 'high-contrast-bold',
    spacingRhythm: 'ultra-compact-action',
    productPageStructure: 'bold-sticky-buy',
    fonts: {
      heading: 'Space Grotesk',
      body: 'Outfit',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=Outfit:wght@400;600&display=swap'
    },
    colors: {
      primary: '#dc2626',
      secondary: '#991b1b',
      background: '#0f0f0f',
      surface: '#1c1c1c',
      text: '#ffffff',
      muted: '#a1a1aa',
      border: '#27272a'
    }
  },

  friendly_pet: {
    id: 'friendly_pet',
    name: 'Friendly Pet',
    tagline: 'Playful, colorful cards, benefit-first storytelling',
    description: 'Designed for pet supplies, dog toys, cat food, and pet accessories.',
    targetCategories: ['pet', 'pets', 'dog', 'cat', 'animals'],
    sectionOrder: [
      'rootx-hero',
      'rootx-benefits',
      'rootx-gallery',
      'rootx-image-story',
      'rootx-trust-strip',
      'rootx-faq',
      'rootx-final-cta'
    ],
    heroType: 'playful-centered',
    headerStyle: 'playful-colorful',
    galleryStyle: 'playful-bubbly-grid',
    cardDesign: 'bubbly-rounded-pink',
    spacingRhythm: 'bouncy-medium',
    productPageStructure: 'playful-bubbly',
    fonts: {
      heading: 'Outfit',
      body: 'Outfit',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800&display=swap'
    },
    colors: {
      primary: '#f59e0b',
      secondary: '#10b981',
      background: '#fffbeb',
      surface: '#ffffff',
      text: '#1e293b',
      muted: '#64748b',
      border: '#fde68a'
    }
  },

  high_conversion_single: {
    id: 'high_conversion_single',
    name: 'High-Conversion Single Product',
    tagline: 'Direct response buybox hero, problem-solution sales funnel',
    description: 'Designed for viral single-product dropshipping and direct response offers.',
    targetCategories: ['single-product', 'viral', 'dropshipping', 'gadget', 'hero-item'],
    sectionOrder: [
      'rootx-hero',
      'rootx-trust-strip',
      'rootx-benefits',
      'rootx-product-showcase',
      'rootx-specifications',
      'rootx-image-story',
      'rootx-faq',
      'rootx-final-cta'
    ],
    heroType: 'direct-response-buybox',
    headerStyle: 'sticky-buybox',
    galleryStyle: 'conversion-stacked-blocks',
    cardDesign: 'clean-conversion-box',
    spacingRhythm: 'conversion-focused-padding',
    productPageStructure: 'long-form-direct-response',
    fonts: {
      heading: 'Outfit',
      body: 'Inter',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@700&family=Inter:wght@400;500;600&display=swap'
    },
    colors: {
      primary: '#16a34a',
      secondary: '#15803d',
      background: '#ffffff',
      surface: '#f0fdf4',
      text: '#0f172a',
      muted: '#475569',
      border: '#bbf7d0'
    }
  },

  high_conversion_landing: {
    id: 'high_conversion_landing',
    name: 'High-Conversion Landing',
    tagline: 'Direct response landing page architecture',
    description: 'Designed for high volume sales pages and special promotions.',
    targetCategories: ['landing-page', 'promotion', 'special-offer'],
    sectionOrder: [
      'rootx-hero',
      'rootx-trust-strip',
      'rootx-benefits',
      'rootx-product-showcase',
      'rootx-specifications',
      'rootx-image-story',
      'rootx-faq',
      'rootx-final-cta'
    ],
    heroType: 'direct-response-buybox',
    headerStyle: 'sticky-buybox',
    galleryStyle: 'conversion-stacked-blocks',
    cardDesign: 'clean-conversion-box',
    spacingRhythm: 'conversion-focused-padding',
    productPageStructure: 'long-form-direct-response',
    fonts: {
      heading: 'Outfit',
      body: 'Inter',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@700&family=Inter:wght@400;500;600&display=swap'
    },
    colors: {
      primary: '#16a34a',
      secondary: '#15803d',
      background: '#ffffff',
      surface: '#f0fdf4',
      text: '#0f172a',
      muted: '#475569',
      border: '#bbf7d0'
    }
  }
};
