// ============================================================
// RootX Design Engine V1 — 8 Design Archetypes
// Defines typography, color, borders, shadows, buttons, hero,
// cards, spacing, image treatments, nav, and product page layout.
// ============================================================

import type { DesignArchetypeId } from '../website-builder-types';

export interface ArchetypeDefinition {
  id: DesignArchetypeId;
  name: string;
  tagline: string;
  description: string;
  
  // 1. Typography style
  typography: {
    headingFont: string;
    bodyFont: string;
    googleFontsUrl: string;
    headingTransform?: 'uppercase' | 'none' | 'capitalize';
    headingWeight: string;
    bodyWeight: string;
  };
  
  // 2. Color behavior
  colorBehavior: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
  };
  
  // 3. Border radius
  borderRadius: {
    small: string;
    medium: string;
    large: string;
  };
  
  // 4. Shadow style
  shadowStyle: {
    soft: string;
    medium: string;
  };
  
  // 5. Button style
  buttonStyle: {
    height: string;
    radius: string;
    className: string;
    hoverTransform: string;
  };
  
  // 6. Hero composition
  heroComposition: 'fullscreen-editorial' | 'split-tech' | 'centered-lifestyle' | 'bold-action' | 'minimal-asymmetric' | 'cozy-grid' | 'bubbly-playful' | 'conversion-dominant';
  
  // 7. Card style
  cardStyle: {
    border: string;
    shadow: string;
    background: string;
    radius: string;
  };
  
  // 8. Section spacing
  sectionSpacing: string;
  
  // 9. Image treatment
  imageTreatment: {
    aspectRatio: string;
    borderRadius: string;
    hoverZoom: boolean;
    overlay: string;
  };
  
  // 10. Navigation style
  navigationStyle: 'centered-minimal' | 'transparent-floating' | 'elegant-thin' | 'bold-condensed' | 'hidden-drawer' | 'standard-clean' | 'playful-colorful' | 'sticky-cta';
  
  // 11. Product page layout
  productPageLayout: 'editorial-split' | 'tech-spec-grid' | 'soft-gallery-cards' | 'bold-sticky-buybox' | 'minimal-vertical-scroll' | 'warm-accordion-layout' | 'playful-bubbly-grid' | 'conversion-focused-hero';
}

export const ARCHETYPES: Record<DesignArchetypeId, ArchetypeDefinition> = {
  luxury_editorial: {
    id: 'luxury_editorial',
    name: 'Luxury Editorial',
    tagline: 'Timeless elegance and refined minimalism',
    description: 'High-end fashion, fine jewelry, luxury watches, premium goods. Features serif typography, sharp borders, gold/monochrome palette, and expansive whitespace.',
    typography: {
      headingFont: 'Cormorant Garamond',
      bodyFont: 'Montserrat',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@300;400;500&display=swap',
      headingTransform: 'uppercase',
      headingWeight: '400',
      bodyWeight: '400',
    },
    colorBehavior: {
      primary: '#1c1917',
      secondary: '#d4af37',
      accent: '#78716c',
      background: '#fafaf9',
      surface: '#ffffff',
      text: '#1c1917',
      muted: '#78716c',
      border: '#e7e5e4',
    },
    borderRadius: {
      small: '0px',
      medium: '0px',
      large: '0px',
    },
    shadowStyle: {
      soft: 'none',
      medium: '0 4px 20px rgba(0, 0, 0, 0.04)',
    },
    buttonStyle: {
      height: '52px',
      radius: '0px',
      className: 'btn-minimal-sharp',
      hoverTransform: 'none',
    },
    heroComposition: 'fullscreen-editorial',
    cardStyle: {
      border: '1px solid #e7e5e4',
      shadow: 'none',
      background: '#ffffff',
      radius: '0px',
    },
    sectionSpacing: '6rem',
    imageTreatment: {
      aspectRatio: '3/4',
      borderRadius: '0px',
      hoverZoom: true,
      overlay: 'rgba(0, 0, 0, 0.15)',
    },
    navigationStyle: 'centered-minimal',
    productPageLayout: 'editorial-split',
  },

  modern_tech: {
    id: 'modern_tech',
    name: 'Modern Technology',
    tagline: 'Futuristic, high-contrast digital aesthetic',
    description: 'Electronics, smart devices, SaaS gear, audio equipment. Features dark mode canvas, neon blue accents, geometric Sans fonts, and glowing card borders.',
    typography: {
      headingFont: 'Outfit',
      bodyFont: 'Plus Jakarta Sans',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap',
      headingTransform: 'none',
      headingWeight: '700',
      bodyWeight: '400',
    },
    colorBehavior: {
      primary: '#3b82f6',
      secondary: '#6366f1',
      accent: '#f43f5e',
      background: '#0b0f19',
      surface: '#161e2e',
      text: '#f8fafc',
      muted: '#94a3b8',
      border: '#334155',
    },
    borderRadius: {
      small: '6px',
      medium: '10px',
      large: '16px',
    },
    shadowStyle: {
      soft: '0 0 15px rgba(59, 130, 246, 0.15)',
      medium: '0 0 30px rgba(59, 130, 246, 0.25)',
    },
    buttonStyle: {
      height: '48px',
      radius: '8px',
      className: 'btn-tech-glow',
      hoverTransform: 'translateY(-2px)',
    },
    heroComposition: 'split-tech',
    cardStyle: {
      border: '1px solid #334155',
      shadow: '0 0 20px rgba(0, 0, 0, 0.5)',
      background: '#161e2e',
      radius: '12px',
    },
    sectionSpacing: '5rem',
    imageTreatment: {
      aspectRatio: '1/1',
      borderRadius: '12px',
      hoverZoom: true,
      overlay: 'linear-gradient(180deg, transparent 60%, rgba(11, 15, 25, 0.8))',
    },
    navigationStyle: 'transparent-floating',
    productPageLayout: 'tech-spec-grid',
  },

  soft_beauty: {
    id: 'soft_beauty',
    name: 'Soft Beauty',
    tagline: 'Warm, organic, and serene lifestyle aesthetic',
    description: 'Skincare, cosmetics, organic wellness, spa items, self-care. Features soft serif headers, warm nude/rose tones, pill-shaped buttons, and rounded cards.',
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Inter:wght@400;500&display=swap',
      headingTransform: 'none',
      headingWeight: '600',
      bodyWeight: '400',
    },
    colorBehavior: {
      primary: '#7c2d12',
      secondary: '#fed7aa',
      accent: '#c2410c',
      background: '#fdfbf7',
      surface: '#ffffff',
      text: '#2c1e11',
      muted: '#6f5e53',
      border: '#f3eae1',
    },
    borderRadius: {
      small: '12px',
      medium: '20px',
      large: '32px',
    },
    shadowStyle: {
      soft: '0 4px 20px rgba(124, 45, 18, 0.04)',
      medium: '0 10px 30px rgba(124, 45, 18, 0.08)',
    },
    buttonStyle: {
      height: '50px',
      radius: '999px',
      className: 'btn-pill-soft',
      hoverTransform: 'scale(1.02)',
    },
    heroComposition: 'centered-lifestyle',
    cardStyle: {
      border: '1px solid #f3eae1',
      shadow: '0 8px 24px rgba(180, 140, 100, 0.06)',
      background: '#ffffff',
      radius: '20px',
    },
    sectionSpacing: '5.5rem',
    imageTreatment: {
      aspectRatio: '4/5',
      borderRadius: '20px',
      hoverZoom: true,
      overlay: 'transparent',
    },
    navigationStyle: 'elegant-thin',
    productPageLayout: 'soft-gallery-cards',
  },

  bold_fitness: {
    id: 'bold_fitness',
    name: 'Bold Fitness',
    tagline: 'High-energy, athletic, and performance-driven',
    description: 'Gym gear, sportswear, supplements, activewear, outdoor equipment. Features punchy uppercase typography, high-contrast dark accents, sharp heavy badges, and energetic CTAs.',
    typography: {
      headingFont: 'Montserrat',
      bodyFont: 'Inter',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Inter:wght@400;600;700&display=swap',
      headingTransform: 'uppercase',
      headingWeight: '900',
      bodyWeight: '500',
    },
    colorBehavior: {
      primary: '#dc2626',
      secondary: '#111827',
      accent: '#ea580c',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#111827',
      muted: '#6b7280',
      border: '#e5e7eb',
    },
    borderRadius: {
      small: '4px',
      medium: '8px',
      large: '16px',
    },
    shadowStyle: {
      soft: '0 4px 12px rgba(220, 38, 38, 0.1)',
      medium: '0 8px 25px rgba(0, 0, 0, 0.15)',
    },
    buttonStyle: {
      height: '54px',
      radius: '8px',
      className: 'btn-bold-action',
      hoverTransform: 'translateY(-3px)',
    },
    heroComposition: 'bold-action',
    cardStyle: {
      border: '2px solid #111827',
      shadow: '4px 4px 0px #111827',
      background: '#ffffff',
      radius: '8px',
    },
    sectionSpacing: '5rem',
    imageTreatment: {
      aspectRatio: '1/1',
      borderRadius: '8px',
      hoverZoom: true,
      overlay: 'rgba(0, 0, 0, 0.2)',
    },
    navigationStyle: 'bold-condensed',
    productPageLayout: 'bold-sticky-buybox',
  },

  minimal_fashion: {
    id: 'minimal_fashion',
    name: 'Minimal Fashion',
    tagline: 'Contemporary, understated, and architectural',
    description: 'Apparel, footwear, modern accessories, designer apparel. Features neutral monochrome canvas, clean geometric font combinations, thin border accents, and spacious grids.',
    typography: {
      headingFont: 'DM Sans',
      bodyFont: 'Inter',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700&family=Inter:wght@400;500&display=swap',
      headingTransform: 'none',
      headingWeight: '700',
      bodyWeight: '400',
    },
    colorBehavior: {
      primary: '#0f172a',
      secondary: '#64748b',
      accent: '#0284c7',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      muted: '#64748b',
      border: '#e2e8f0',
    },
    borderRadius: {
      small: '2px',
      medium: '6px',
      large: '10px',
    },
    shadowStyle: {
      soft: '0 2px 8px rgba(15, 23, 42, 0.04)',
      medium: '0 6px 20px rgba(15, 23, 42, 0.08)',
    },
    buttonStyle: {
      height: '46px',
      radius: '4px',
      className: 'btn-ghost-minimal',
      hoverTransform: 'none',
    },
    heroComposition: 'minimal-asymmetric',
    cardStyle: {
      border: '1px solid #e2e8f0',
      shadow: 'none',
      background: '#ffffff',
      radius: '6px',
    },
    sectionSpacing: '5.5rem',
    imageTreatment: {
      aspectRatio: '3/4',
      borderRadius: '4px',
      hoverZoom: true,
      overlay: 'transparent',
    },
    navigationStyle: 'hidden-drawer',
    productPageLayout: 'minimal-vertical-scroll',
  },

  warm_home: {
    id: 'warm_home',
    name: 'Warm Home',
    tagline: 'Cozy, inviting, and human-centric living spaces',
    description: 'Furniture, kitchenware, home decor, bedding, garden items. Features friendly rounded headings, soothing forest/teal palettes, soft cards, and warm lighting feel.',
    typography: {
      headingFont: 'Outfit',
      bodyFont: 'Plus Jakarta Sans',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap',
      headingTransform: 'none',
      headingWeight: '600',
      bodyWeight: '400',
    },
    colorBehavior: {
      primary: '#0f766e',
      secondary: '#ccfbf1',
      accent: '#0d9488',
      background: '#fcfdfd',
      surface: '#ffffff',
      text: '#0f172a',
      muted: '#475569',
      border: '#e2e8f0',
    },
    borderRadius: {
      small: '8px',
      medium: '14px',
      large: '24px',
    },
    shadowStyle: {
      soft: '0 4px 14px rgba(15, 118, 110, 0.06)',
      medium: '0 10px 30px rgba(15, 118, 110, 0.1)',
    },
    buttonStyle: {
      height: '48px',
      radius: '12px',
      className: 'btn-rounded-warm',
      hoverTransform: 'translateY(-1px)',
    },
    heroComposition: 'cozy-grid',
    cardStyle: {
      border: '1px solid #e2e8f0',
      shadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
      background: '#ffffff',
      radius: '14px',
    },
    sectionSpacing: '5rem',
    imageTreatment: {
      aspectRatio: '4/3',
      borderRadius: '14px',
      hoverZoom: true,
      overlay: 'transparent',
    },
    navigationStyle: 'standard-clean',
    productPageLayout: 'warm-accordion-layout',
  },

  friendly_pet: {
    id: 'friendly_pet',
    name: 'Friendly Pet',
    tagline: 'Vibrant, playful, and affectionate for pet lovers',
    description: 'Pet supplies, dog/cat toys, treats, veterinary accessories. Features bubbly rounded typography, warm orange/amber palettes, pill badges, and friendly card shapes.',
    typography: {
      headingFont: 'Fredoka',
      bodyFont: 'Quicksand',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Quicksand:wght@500;600;700&display=swap',
      headingTransform: 'none',
      headingWeight: '700',
      bodyWeight: '600',
    },
    colorBehavior: {
      primary: '#f97316',
      secondary: '#fef08a',
      accent: '#10b981',
      background: '#fafaf5',
      surface: '#ffffff',
      text: '#431407',
      muted: '#7c2d12',
      border: '#f0ebe1',
    },
    borderRadius: {
      small: '16px',
      medium: '24px',
      large: '48px',
    },
    shadowStyle: {
      soft: '0 6px 20px rgba(249, 115, 22, 0.08)',
      medium: '0 12px 35px rgba(249, 115, 22, 0.15)',
    },
    buttonStyle: {
      height: '52px',
      radius: '999px',
      className: 'btn-bubbly-playful',
      hoverTransform: 'scale(1.04)',
    },
    heroComposition: 'bubbly-playful',
    cardStyle: {
      border: '2px solid #fef08a',
      shadow: '0 8px 20px rgba(249, 115, 22, 0.08)',
      background: '#ffffff',
      radius: '24px',
    },
    sectionSpacing: '5rem',
    imageTreatment: {
      aspectRatio: '1/1',
      borderRadius: '24px',
      hoverZoom: true,
      overlay: 'transparent',
    },
    navigationStyle: 'playful-colorful',
    productPageLayout: 'playful-bubbly-grid',
  },

  high_conversion_landing: {
    id: 'high_conversion_landing',
    name: 'High-Conversion Product Landing Page',
    tagline: 'Single-product direct response powerhouse',
    description: 'Single-product dropshipping, hero viral products, kickstarter items. Optimized for direct response with high urgency trust bar, benefit grids, side-by-side comparison, and sticky add-to-cart.',
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&display=swap',
      headingTransform: 'none',
      headingWeight: '800',
      bodyWeight: '500',
    },
    colorBehavior: {
      primary: '#2563eb',
      secondary: '#16a34a',
      accent: '#dc2626',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      muted: '#64748b',
      border: '#e2e8f0',
    },
    borderRadius: {
      small: '6px',
      medium: '10px',
      large: '16px',
    },
    shadowStyle: {
      soft: '0 4px 16px rgba(37, 99, 235, 0.08)',
      medium: '0 10px 30px rgba(37, 99, 235, 0.16)',
    },
    buttonStyle: {
      height: '56px',
      radius: '10px',
      className: 'btn-conversion-dominant',
      hoverTransform: 'translateY(-2px) scale(1.01)',
    },
    heroComposition: 'conversion-dominant',
    cardStyle: {
      border: '1px solid #cbd5e1',
      shadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
      background: '#ffffff',
      radius: '12px',
    },
    sectionSpacing: '4.5rem',
    imageTreatment: {
      aspectRatio: '1/1',
      borderRadius: '12px',
      hoverZoom: true,
      overlay: 'transparent',
    },
    navigationStyle: 'sticky-cta',
    productPageLayout: 'conversion-focused-hero',
  },
  high_conversion_single: {
    id: 'high_conversion_single',
    name: 'High-Conversion Single Product',
    tagline: 'Direct response buybox hero, problem-solution sales funnel',
    description: 'Designed for viral single-product dropshipping and direct response offers.',
    typography: {
      headingFont: 'Outfit',
      bodyFont: 'Inter',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@700&family=Inter:wght@400;500;600&display=swap',
      headingTransform: 'none',
      headingWeight: '700',
      bodyWeight: '400',
    },
    colorBehavior: {
      primary: '#16a34a',
      secondary: '#15803d',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f0fdf4',
      text: '#0f172a',
      muted: '#475569',
      border: '#bbf7d0',
    },
    borderRadius: {
      small: '6px',
      medium: '10px',
      large: '16px',
    },
    shadowStyle: {
      soft: '0 4px 16px rgba(22, 163, 74, 0.08)',
      medium: '0 10px 30px rgba(22, 163, 74, 0.16)',
    },
    buttonStyle: {
      height: '56px',
      radius: '10px',
      className: 'btn-conversion-dominant',
      hoverTransform: 'translateY(-2px) scale(1.01)',
    },
    heroComposition: 'conversion-dominant',
    cardStyle: {
      border: '1px solid #bbf7d0',
      shadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
      background: '#ffffff',
      radius: '12px',
    },
    sectionSpacing: '4.5rem',
    imageTreatment: {
      aspectRatio: '1/1',
      borderRadius: '12px',
      hoverZoom: true,
      overlay: 'transparent',
    },
    navigationStyle: 'sticky-cta',
    productPageLayout: 'conversion-focused-hero',
  },
};

/**
 * Get an archetype definition by ID, with fallback to high_conversion_landing
 */
export function getArchetype(id: DesignArchetypeId | string): ArchetypeDefinition {
  const archetype = ARCHETYPES[id as DesignArchetypeId];
  if (archetype) return archetype;
  
  // Legacy / fallback mappings
  if (id === 'tech_futuristic' || id === 'dark') return ARCHETYPES.modern_tech;
  if (id === 'soft_lifestyle') return ARCHETYPES.soft_beauty;
  if (id === 'bold_conversion') return ARCHETYPES.bold_fitness;
  if (id === 'premium_minimal' || id === 'minimal') return ARCHETYPES.minimal_fashion;
  if (id === 'modern_commerce' || id === 'modern' || id === 'corporate' || id === 'startup') return ARCHETYPES.warm_home;
  if (id === 'high_conversion_single') return ARCHETYPES.high_conversion_single;
  
  return ARCHETYPES.high_conversion_landing;
}
