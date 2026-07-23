// ============================================================
// RootX Design Engine V2 — 10 Theme Families Architecture
// Defines unique section order, hero structure, header variant,
// gallery style, spacing rhythm, card design, and product page layout.
// ============================================================

import type { DesignArchetypeId } from '../website-builder-types';

export type HeroVariantType =
  | 'dark-tech-split'
  | 'light-product-split'
  | 'full-bleed-editorial'
  | 'asymmetrical-beauty'
  | 'fashion-lookbook'
  | 'warm-lifestyle'
  | 'fitness-performance'
  | 'playful-pet'
  | 'direct-response'
  | 'luxury-closeup'
  | 'wellness-routine'
  | 'minimal-product-focus';

export type HeaderVariantType =
  | 'compact-tech'
  | 'editorial-beauty'
  | 'minimal-luxury'
  | 'image-first-fashion'
  | 'warm-home'
  | 'bold-fitness'
  | 'playful-pet'
  | 'conversion-header'
  | 'jewelry-minimal'
  | 'wellness-clean';

export type GalleryVariantType =
  | 'thumbnail-left'
  | 'thumbnail-bottom'
  | 'horizontal-scroll'
  | 'masonry-lookbook'
  | 'full-width-editorial'
  | 'detail-closeup-grid'
  | 'swipe-mobile'
  | 'product-focus-minimal'
  | 'tech-grid-4col'
  | 'soft-rounded-cards'
  | 'warm-lifestyle-grid'
  | 'bold-performance-grid'
  | 'playful-bubbly-grid'
  | 'conversion-stacked-blocks';

export type ProductPageLayoutType =
  | 'tech-spec-split'
  | 'soft-ingredient-cards'
  | 'editorial-monochrome'
  | 'lookbook-vertical'
  | 'warm-lifestyle-accordion'
  | 'bold-sticky-buy'
  | 'playful-bubbly'
  | 'long-form-direct-response'
  | 'jewelry-closeup-detail'
  | 'wellness-timeline-layout';

export interface ThemeFamilyConfig {
  id: DesignArchetypeId;
  name: string;
  tagline: string;
  description: string;
  targetCategories: string[];
  
  // Section Sequence (Strictly unique per theme family)
  sectionOrder: string[];
  
  // Variants
  heroType: HeroVariantType;
  headerStyle: HeaderVariantType;
  galleryStyle: GalleryVariantType;
  cardDesign: string;
  spacingRhythm: string;
  productPageStructure: ProductPageLayoutType;

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
      'rootx-trust-strip',
      'rootx-specifications',
      'rootx-benefits',
      'rootx-product-showcase',
      'rootx-gallery',
      'rootx-faq',
      'rootx-final-cta'
    ],
    heroType: 'dark-tech-split',
    headerStyle: 'compact-tech',
    galleryStyle: 'thumbnail-left',
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
    heroType: 'asymmetrical-beauty',
    headerStyle: 'editorial-beauty',
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
    targetCategories: ['luxury', 'watches', 'high-fashion', 'premium'],
    sectionOrder: [
      'rootx-hero',
      'rootx-gallery',
      'rootx-image-story',
      'rootx-product-showcase',
      'rootx-specifications',
      'rootx-final-cta'
    ],
    heroType: 'full-bleed-editorial',
    headerStyle: 'minimal-luxury',
    galleryStyle: 'full-width-editorial',
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
    heroType: 'fashion-lookbook',
    headerStyle: 'image-first-fashion',
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
    heroType: 'warm-lifestyle',
    headerStyle: 'warm-home',
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
    heroType: 'fitness-performance',
    headerStyle: 'bold-fitness',
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
    heroType: 'playful-pet',
    headerStyle: 'playful-pet',
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
    heroType: 'direct-response',
    headerStyle: 'conversion-header',
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
    heroType: 'direct-response',
    headerStyle: 'conversion-header',
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

  premium_jewelry: {
    id: 'premium_jewelry',
    name: 'Premium Jewelry',
    tagline: 'Craftsmanship, precious metals, macro image detail',
    description: 'Designed for fine jewelry, rings, gemstones, and artisan gold pieces.',
    targetCategories: ['jewelry', 'rings', 'gemstones', 'gold', 'diamonds', 'artisan'],
    sectionOrder: [
      'rootx-hero',
      'rootx-image-story',
      'rootx-specifications',
      'rootx-gallery',
      'rootx-product-showcase',
      'rootx-faq',
      'rootx-final-cta'
    ],
    heroType: 'luxury-closeup',
    headerStyle: 'jewelry-minimal',
    galleryStyle: 'detail-closeup-grid',
    cardDesign: 'gold-border-minimal',
    spacingRhythm: 'expansive-luxury',
    productPageStructure: 'jewelry-closeup-detail',
    fonts: {
      heading: 'Cormorant Garamond',
      body: 'Montserrat',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Montserrat:wght@300;400;500&display=swap'
    },
    colors: {
      primary: '#b45309',
      secondary: '#78350f',
      background: '#0c0a09',
      surface: '#1c1917',
      text: '#fafaf9',
      muted: '#a8a29e',
      border: '#292524'
    }
  },

  clean_wellness: {
    id: 'clean_wellness',
    name: 'Clean Wellness',
    tagline: 'Mindful routine, calming palette, holistic vitality',
    description: 'Designed for health supplements, teas, meditation gear, and natural vitality.',
    targetCategories: ['wellness', 'supplements', 'health', 'tea', 'vitamins', 'holistic'],
    sectionOrder: [
      'rootx-hero',
      'rootx-benefits',
      'rootx-specifications',
      'rootx-image-story',
      'rootx-gallery',
      'rootx-trust-strip',
      'rootx-faq',
      'rootx-final-cta'
    ],
    heroType: 'wellness-routine',
    headerStyle: 'wellness-clean',
    galleryStyle: 'swipe-mobile',
    cardDesign: 'soft-shadow-white',
    spacingRhythm: 'generous-airy',
    productPageStructure: 'wellness-timeline-layout',
    fonts: {
      heading: 'Playfair Display',
      body: 'Inter',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=Inter:wght@300;400;500&display=swap'
    },
    colors: {
      primary: '#0d9488',
      secondary: '#0f766e',
      background: '#f0fdf4',
      surface: '#ffffff',
      text: '#134e4a',
      muted: '#64748b',
      border: '#ccfbf1'
    }
  }
};
