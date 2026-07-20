// ============================================================
// RootX Design Engine V1 — Category & Archetype Detector
// Analyzes product input, target customer, brand personality
// to dynamically select the optimal Design Archetype.
// ============================================================

import type { DesignArchetypeId } from '../website-builder-types';

export interface ProductAnalysisResult {
  category: string;
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
    keywords: ['headphone', 'earbud', 'gadget', 'charger', 'led', 'smartwatch', 'tech', 'electronic', 'wireless', 'device', 'computer', 'phone', 'cable', 'bluetooth', 'drone', 'camera', 'gaming', 'pc', 'monitor', 'keyboard', 'audio', 'soundbar'],
  },
  {
    category: 'beauty_and_skincare',
    archetype: 'soft_beauty',
    keywords: ['rosewater', 'cosmetics', 'beauty', 'mist', 'skincare', 'cream', 'shampoo', 'organic', 'oil', 'wellness', 'serum', 'spa', 'facial', 'lotion', 'lipstick', 'moisturizer', 'glow', 'cleanser', 'essential', 'scent', 'perfume', 'bodycare'],
  },
  {
    category: 'sports_and_fitness',
    archetype: 'bold_fitness',
    keywords: ['fitness', 'sport', 'gym', 'workout', 'activewear', 'resistance', 'muscle', 'athlete', 'running', 'shoes', 'yoga', 'dumbbells', 'protein', 'bands', 'training', 'exercise', 'recovery', 'massage gun', 'straps', 'bottle', 'weights'],
  },
  {
    category: 'fashion_and_apparel',
    archetype: 'minimal_fashion',
    keywords: ['apparel', 'clothing', 't-shirt', 'hoodie', 'jacket', 'pants', 'sneakers', 'streetwear', 'wear', 'designer', 'minimalist', 'accessories', 'cotton', 'denim', 'cap', 'sunglasses', 'trousers', 'suit', 'bag'],
  },
  {
    category: 'luxury_and_jewelry',
    archetype: 'luxury_editorial',
    keywords: ['jewelry', 'watch', 'diamond', 'gold', 'silver', 'luxury', 'handbag', 'ring', 'necklace', 'pendant', 'timepiece', 'couture', 'high-end', 'custom-crafted', 'emerald', 'pearl'],
  },
  {
    category: 'home_and_living',
    archetype: 'warm_home',
    keywords: ['furniture', 'cushion', 'chair', 'home', 'garden', 'decor', 'kitchen', 'sofa', 'office', 'table', 'lamp', 'rug', 'cookware', 'candle', 'diffuser', 'storage', 'bedding', 'mat', 'organizer', 'pillow'],
  },
  {
    category: 'pets',
    archetype: 'friendly_pet',
    keywords: ['pet', 'dog', 'cat', 'puppy', 'kitten', 'leash', 'collar', 'harness', 'grooming', 'paw', 'feline', 'canine', 'chew', 'litter', 'aquarium', 'bird', 'toy'],
  },
  {
    category: 'single_product_landing',
    archetype: 'high_conversion_landing',
    keywords: ['viral', 'trending', 'problem-solver', 'as-seen-on-tv', 'innovative', 'must-have', 'limited-edition', 'kickstarter', 'direct-response', 'flash-sale'],
  },
];

/**
 * Perform deterministic category, customer, and archetype detection on input text
 */
export function analyzeAndDetectArchetype(
  text: string,
  userPreferredStyle?: string
): ProductAnalysisResult {
  const lower = text.toLowerCase();
  
  // 1. Calculate matching score for each category
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

  // Sort descending by score
  scores.sort((a, b) => b.score - a.score);

  const topMatch = scores[0];
  let selectedArchetype: DesignArchetypeId = topMatch.score > 0 ? topMatch.archetype : 'warm_home';
  let confidence = Math.min(98, Math.max(70, topMatch.score * 15 + 65));

  // If user explicitly picked an archetype or style override, honor it
  if (userPreferredStyle && userPreferredStyle !== 'auto_best' && userPreferredStyle !== 'modern') {
    const validArchetypeIds: DesignArchetypeId[] = [
      'luxury_editorial', 'modern_tech', 'soft_beauty', 'bold_fitness',
      'minimal_fashion', 'warm_home', 'friendly_pet', 'high_conversion_landing'
    ];

    // Map style string to archetype
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

  // Derive target customer profile based on archetype
  let demographic = 'Modern adult consumers seeking quality and comfort';
  let primaryNeed = 'Reliability & aesthetic harmony';
  let priceSensitivity: ProductAnalysisResult['targetCustomer']['priceSensitivity'] = 'mid-range';
  let tone = 'Polished, trustworthy, and welcoming';

  switch (selectedArchetype) {
    case 'luxury_editorial':
      demographic = 'Affluent professionals & collectors (28–55)';
      primaryNeed = 'Exclusivity, craftsmanship & status';
      priceSensitivity = 'ultra-luxury';
      tone = 'Sophisticated, understated, and timeless';
      break;
    case 'modern_tech':
      demographic = 'Tech enthusiasts, gamers, and remote professionals (18–40)';
      primaryNeed = 'High performance, cutting-edge specs & durability';
      priceSensitivity = 'premium';
      tone = 'Futuristic, precise, and authoritative';
      break;
    case 'soft_beauty':
      demographic = 'Self-care & wellness seekers (20–45)';
      primaryNeed = 'Gentle ingredients, rejuvenation & aesthetic bliss';
      priceSensitivity = 'premium';
      tone = 'Serene, nurturing, and organic';
      break;
    case 'bold_fitness':
      demographic = 'Athletes, gym-goers & active lifestyle individuals (18–38)';
      primaryNeed = 'Peak performance, muscle gain & athletic endurance';
      priceSensitivity = 'mid-range';
      tone = 'Energetic, motivational, and intense';
      break;
    case 'minimal_fashion':
      demographic = 'Style-conscious urbanites (20–35)';
      primaryNeed = 'Contemporary design, versatility & fit';
      priceSensitivity = 'mid-range';
      tone = 'Architectural, clean, and effortless';
      break;
    case 'warm_home':
      demographic = 'Homeowners, decorators & families (25–55)';
      primaryNeed = 'Comfort, functional elegance & longevity';
      priceSensitivity = 'mid-range';
      tone = 'Cozy, inviting, and practical';
      break;
    case 'friendly_pet':
      demographic = 'Devoted pet parents of dogs & cats (22–50)';
      primaryNeed = 'Pet happiness, safety & engagement';
      priceSensitivity = 'mid-range';
      tone = 'Playful, affectionate, and cheerful';
      break;
    case 'high_conversion_landing':
      demographic = 'Impulse impulse buyers & problem-focused shoppers (18–50)';
      primaryNeed = 'Immediate problem resolution & irresistible deal';
      priceSensitivity = 'budget';
      tone = 'Direct, urgent, and evidence-backed';
      break;
  }

  const alternativeArchetypes: DesignArchetypeId[] = scores
    .slice(1, 4)
    .map((s) => s.archetype)
    .filter((a) => a !== selectedArchetype);

  if (!alternativeArchetypes.includes('high_conversion_landing') && selectedArchetype !== 'high_conversion_landing') {
    alternativeArchetypes.push('high_conversion_landing');
  }

  return {
    category: topMatch.category,
    targetCustomer: {
      demographic,
      primaryNeed,
      priceSensitivity,
    },
    brandPersonality: {
      tone,
      archetypeFitReasoning: `Matched ${topMatch.category} based on product key attributes.`,
    },
    selectedArchetype,
    confidenceScore: confidence,
    alternativeArchetypes: alternativeArchetypes.slice(0, 3),
  };
}
