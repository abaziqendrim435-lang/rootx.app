// ============================================================
// RootX Design Engine V2 — Category & Theme Recommendation Engine
// Analyzes product input, title, description, specifications,
// target customer, and price to recommend top 3 theme choices.
// ============================================================

import type { DesignArchetypeId } from '../website-builder-types';
import { THEME_FAMILIES, type ThemeFamilyConfig } from './theme-family-types';

export interface ThemeRecommendation {
  id: DesignArchetypeId;
  name: string;
  tagline: string;
  description: string;
  heroType: string;
  reasoning: string;
  colors: { primary: string; secondary: string; background: string; surface: string; text: string };
  fonts: { heading: string; body: string };
  sectionPlanSummary: string[];
}

export interface ProductAnalysisResult {
  category: string;
  secondaryCategory?: string;
  targetCustomer: {
    demographic: string;
    primaryNeed: string;
    priceSensitivity: 'budget' | 'mid-range' | 'premium' | 'ultra-luxury';
  };
  brandPersonality: {
    tone: string;
    archetypeFitReasoning: string;
  };
  selectedArchetype: DesignArchetypeId;
  confidenceScore: number;
  alternativeArchetypes: DesignArchetypeId[];
  recommendedThemes: ThemeRecommendation[];
}

interface CategoryWeights {
  category: string;
  archetype: DesignArchetypeId;
  keywords: string[];
}

const CATEGORY_RULESET: CategoryWeights[] = [
  {
    category: 'electronics_and_gadgets',
    archetype: 'modern_tech',
    keywords: ['headphone', 'earbud', 'gadget', 'charger', 'led', 'smartwatch', 'tech', 'electronic', 'wireless', 'device', 'computer', 'phone', 'cable', 'bluetooth', 'drone', 'camera', 'gaming', 'pc', 'monitor', 'keyboard', 'audio', 'soundbar', 'hoco', 'tws', 'speaker', 'anker', 'motion boom', 'powerbank'],
  },
  {
    category: 'beauty_and_skincare',
    archetype: 'soft_beauty',
    keywords: ['rosewater', 'cosmetics', 'beauty', 'mist', 'skincare', 'cream', 'shampoo', 'organic', 'oil', 'serum', 'spa', 'facial', 'lotion', 'lipstick', 'moisturizer', 'glow', 'cleanser', 'essential', 'scent', 'perfume', 'bodycare', 'moisturizing'],
  },
  {
    category: 'fine_jewelry',
    archetype: 'premium_jewelry',
    keywords: ['ring', 'diamond', 'necklace', 'pendant', 'earring', 'gemstone', 'emerald', 'sapphire', 'carat', 'solitaire', 'artisan', 'custom-crafted', 'precious', 'gold ring', 'gold necklace', 'fine jewelry', 'pearls'],
  },
  {
    category: 'luxury_editorial',
    archetype: 'luxury_editorial',
    keywords: ['luxury', 'watch', 'timepiece', 'couture', 'high-end', 'handbag', 'haute', 'bespoke', 'heritage', 'craftsmanship', 'rolex', 'cartier', 'gucci', 'prada', 'louis vuitton', 'monochrome'],
  },
  {
    category: 'fashion_and_apparel',
    archetype: 'minimal_fashion',
    keywords: ['apparel', 'clothing', 't-shirt', 'hoodie', 'jacket', 'pants', 'sneakers', 'streetwear', 'wear', 'designer', 'minimalist', 'accessories', 'cotton', 'denim', 'cap', 'sunglasses', 'trousers', 'suit', 'bag', 'outfit', 'shirt'],
  },
  {
    category: 'home_and_living',
    archetype: 'warm_home',
    keywords: ['furniture', 'cushion', 'chair', 'home', 'garden', 'decor', 'kitchen', 'sofa', 'office', 'table', 'lamp', 'rug', 'cookware', 'candle', 'diffuser', 'storage', 'bedding', 'mat', 'organizer', 'pillow', 'mattress', 'memory cushion'],
  },
  {
    category: 'sports_and_fitness',
    archetype: 'bold_fitness',
    keywords: ['fitness', 'sport', 'gym', 'workout', 'activewear', 'resistance', 'muscle', 'athlete', 'running', 'shoes', 'yoga', 'dumbbells', 'protein', 'bands', 'training', 'exercise', 'recovery', 'massage gun', 'straps', 'bottle', 'weights', 'creatine'],
  },
  {
    category: 'pets',
    archetype: 'friendly_pet',
    keywords: ['pet', 'dog', 'cat', 'puppy', 'kitten', 'leash', 'collar', 'harness', 'grooming', 'paw', 'feline', 'canine', 'chew', 'litter', 'aquarium', 'bird', 'toy', 'dog food', 'cat tree'],
  },
  {
    category: 'wellness_and_health',
    archetype: 'clean_wellness',
    keywords: ['wellness', 'tea', 'herbal', 'meditation', 'vitamins', 'holistic', 'detox', 'calm', 'sleep', 'mindfulness', 'matcha', 'ashwagandha', 'collagen', 'cleanse', 'vitality', 'health'],
  },
  {
    category: 'single_product_landing',
    archetype: 'high_conversion_single',
    keywords: ['viral', 'trending', 'problem-solver', 'as-seen-on-tv', 'innovative', 'must-have', 'limited-edition', 'kickstarter', 'direct-response', 'flash-sale', '50% off', 'buy 1 get 1'],
  },
];

export function analyzeAndDetectArchetype(
  text: string,
  userPreferredStyle?: string
): ProductAnalysisResult {
  const lower = text.toLowerCase();
  
  // 1. Score each category
  const scores = CATEGORY_RULESET.map((rule) => {
    let score = 0;
    for (const kw of rule.keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      const matches = lower.match(regex);
      if (matches) {
        score += matches.length * 2;
      } else if (lower.includes(kw)) {
        score += 1;
      }
    }
    return { ...rule, score };
  });

  scores.sort((a, b) => b.score - a.score);

  const topMatch = scores[0];
  const secondMatch = scores[1];
  let selectedArchetype: DesignArchetypeId = topMatch.score > 0 ? topMatch.archetype : 'modern_tech';
  let confidence = Math.min(98, Math.max(65, topMatch.score * 12 + 65));

  // Override if explicitly requested
  if (userPreferredStyle && userPreferredStyle !== 'auto_best' && userPreferredStyle !== 'modern') {
    const validArchetypeIds: DesignArchetypeId[] = [
      'luxury_editorial', 'modern_tech', 'soft_beauty', 'bold_fitness',
      'minimal_fashion', 'warm_home', 'friendly_pet', 'high_conversion_single',
      'high_conversion_landing', 'premium_jewelry', 'clean_wellness'
    ];

    let mapped: DesignArchetypeId | null = null;
    if (validArchetypeIds.includes(userPreferredStyle as DesignArchetypeId)) {
      mapped = userPreferredStyle as DesignArchetypeId;
    } else if (userPreferredStyle === 'tech_futuristic' || userPreferredStyle === 'dark') {
      mapped = 'modern_tech';
    } else if (userPreferredStyle === 'soft_lifestyle') {
      mapped = 'soft_beauty';
    } else if (userPreferredStyle === 'bold_conversion') {
      mapped = 'bold_fitness';
    } else if (userPreferredStyle === 'premium_minimal' || userPreferredStyle === 'minimal') {
      mapped = 'minimal_fashion';
    } else if (userPreferredStyle === 'modern_commerce' || userPreferredStyle === 'startup' || userPreferredStyle === 'corporate') {
      mapped = 'warm_home';
    }

    if (mapped) {
      selectedArchetype = mapped;
      confidence = 100;
    }
  }

  // Derive target customer profile
  let demographic = 'Modern consumers seeking high performance & aesthetic design';
  let primaryNeed = 'Reliability, speed, and premium experience';
  let priceSensitivity: ProductAnalysisResult['targetCustomer']['priceSensitivity'] = 'mid-range';
  let tone = 'Polished, authoritative, and clean';

  switch (selectedArchetype) {
    case 'premium_jewelry':
      demographic = 'Discerning buyers seeking fine artisan jewelry (25–60)';
      primaryNeed = 'Precious metals, certified gemstones & heirloom quality';
      priceSensitivity = 'ultra-luxury';
      tone = 'Opulent, intricate, and refined';
      break;
    case 'clean_wellness':
      demographic = 'Health-conscious adults focused on mindful living (22–50)';
      primaryNeed = 'Natural ingredients, holistic routine & stress relief';
      priceSensitivity = 'premium';
      tone = 'Calming, serene, and restorative';
      break;
    case 'luxury_editorial':
      demographic = 'Affluent professionals & luxury collectors (28–55)';
      primaryNeed = 'Exclusivity, status & magazine aesthetics';
      priceSensitivity = 'ultra-luxury';
      tone = 'Sophisticated, understated, and magazine-style';
      break;
    case 'modern_tech':
      demographic = 'Tech enthusiasts, audiophiles & professionals (18–40)';
      primaryNeed = 'Cutting-edge performance, specs & durability';
      priceSensitivity = 'premium';
      tone = 'Futuristic, precise, and dark-mode focused';
      break;
    case 'soft_beauty':
      demographic = 'Self-care & skincare enthusiasts (20–45)';
      primaryNeed = 'Nourishing botanical ingredients & gentle formulas';
      priceSensitivity = 'premium';
      tone = 'Serene, nurturing, and organic';
      break;
    case 'bold_fitness':
      demographic = 'Athletes, gym-goers & active lifestyle seekers (18–38)';
      primaryNeed = 'Peak physical performance, power & muscle gain';
      priceSensitivity = 'mid-range';
      tone = 'Energetic, motivational, and high contrast';
      break;
    case 'minimal_fashion':
      demographic = 'Urban style leaders & minimalist fashion lovers (20–35)';
      primaryNeed = 'Contemporary fit, clean lines & lookbook imagery';
      priceSensitivity = 'mid-range';
      tone = 'Effortless, architectural, and image-first';
      break;
    case 'warm_home':
      demographic = 'Homeowners, interior decorators & families (25–55)';
      primaryNeed = 'Comfort, warm aesthetic & living space harmony';
      priceSensitivity = 'mid-range';
      tone = 'Cozy, inviting, and warm neutral';
      break;
    case 'friendly_pet':
      demographic = 'Loving pet owners of dogs & cats (22–50)';
      primaryNeed = 'Pet safety, joyful play & healthy nutrition';
      priceSensitivity = 'mid-range';
      tone = 'Playful, cheerful, and colorful';
      break;
    case 'high_conversion_single':
    case 'high_conversion_landing':
      demographic = 'Direct response shoppers & impulse buyers (18–50)';
      primaryNeed = 'Immediate problem solution & compelling offer';
      priceSensitivity = 'budget';
      tone = 'Direct, urgent, and conversion-focused';
      break;
  }

  // Determine top 3 recommended themes
  const recommendedIds: DesignArchetypeId[] = [selectedArchetype];
  
  if (secondMatch && secondMatch.score > 0 && !recommendedIds.includes(secondMatch.archetype)) {
    recommendedIds.push(secondMatch.archetype);
  }

  const defaultFallbacks: DesignArchetypeId[] = [
    'high_conversion_single', 'luxury_editorial', 'modern_tech', 'soft_beauty', 'clean_wellness'
  ];

  for (const fallback of defaultFallbacks) {
    if (recommendedIds.length >= 3) break;
    if (!recommendedIds.includes(fallback)) {
      recommendedIds.push(fallback);
    }
  }

  const recommendedThemes: ThemeRecommendation[] = recommendedIds.map((id) => {
    const config = THEME_FAMILIES[id] || THEME_FAMILIES.modern_tech;
    return {
      id: config.id,
      name: config.name,
      tagline: config.tagline,
      description: config.description,
      heroType: config.heroType,
      reasoning: id === selectedArchetype
        ? `Primary match for ${topMatch.category} based on keywords and product attributes.`
        : `Strong alternative match providing a distinct design direction.`,
      colors: config.colors,
      fonts: config.fonts,
      sectionPlanSummary: config.sectionOrder.map((s) => s.replace('rootx-', '')),
    };
  });

  const alternativeArchetypes = recommendedIds.slice(1, 3);

  return {
    category: topMatch.category,
    secondaryCategory: secondMatch?.category,
    targetCustomer: {
      demographic,
      primaryNeed,
      priceSensitivity,
    },
    brandPersonality: {
      tone,
      archetypeFitReasoning: `Matched ${topMatch.category} based on key product attributes.`,
    },
    selectedArchetype,
    confidenceScore: confidence,
    alternativeArchetypes,
    recommendedThemes,
  };
}
