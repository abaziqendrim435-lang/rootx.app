// ============================================================
// RootX — Shopify Online Store 2.0 Theme Generator
//
// Pure library that converts a WebsiteGeneration + WebsiteBuilderInput
// into a complete Shopify theme file set (ShopifyThemeFile[]).
//
// No side effects, no API calls — just string generation.
// ============================================================

import type {
  WebsiteGeneration,
  WebsiteBuilderInput,
  PreferredStyle,
} from './website-builder-types';
import type { ShopifyThemeFile } from './shopify-types';

// ── Public API ────────────────────────────────────────────────

/**
 * Generate a complete Shopify Online Store 2.0 theme from
 * AI-generated website content and user input.
 */
export function generateShopifyTheme(
  gen: WebsiteGeneration,
  input: WebsiteBuilderInput
): ShopifyThemeFile[] {
  return [
    // Layout
    ...generateLayout(gen, input),
    // Templates (JSON)
    ...generateTemplates(gen, input),
    // Sections (Liquid)
    ...generateSections(gen, input),
    // Snippets (Liquid)
    ...generateSnippets(gen, input),
    // Assets (CSS + JS)
    ...generateAssets(gen, input),
    // Config
    ...generateConfig(gen, input),
    // Locales
    ...generateLocales(gen, input),
  ];
}

// ── Helpers ───────────────────────────────────────────────────

function esc(str: string): string {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function escJson(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function file(key: string, value: string): ShopifyThemeFile {
  return { key, value };
}

function mapLucideToEmoji(icon: string): string {
  const mapping: Record<string, string> = {
    star: '⭐',
    gem: '💎',
    shield: '🛡️',
    checkcircle: '✅',
    check: '✅',
    truck: '🚚',
    heart: '❤️',
    thumbsup: '👍',
    clock: '🕒',
    zap: '⚡',
    activity: '📈',
    award: '🏆',
    gift: '🎁',
    lock: '🔒',
    refreshcw: '🔄',
    rotateccw: '🔄',
    shoppingcart: '🛒',
    package: '📦',
    headphones: '🎧',
    info: 'ℹ️',
    sparkles: '✨',
    feather: '🪶',
    smile: '😊',
    target: '🎯',
    trendingup: '📈',
    flame: '🔥',
    moon: '🌙',
    sun: '☀️',
    coffee: '☕',
    home: '🏠',
    mappin: '📍',
    mail: '✉️',
    phone: '📞',
    globe: '🌐',
    key: '🔑',
    search: '🔍',
    settings: '⚙️',
    tool: '🔧',
  };
  const key = icon.toLowerCase().replace(/[^a-z0-9]/g, '');
  return mapping[key] ?? '✨';
}

export interface ProductProfile {
  brandName: string;
  brandSlogan: string;
  cleanTitle: string;
  cleanDescription: string;
  category: 'tech_futuristic' | 'soft_lifestyle' | 'bold_conversion' | 'modern_commerce' | 'luxury_editorial' | 'friendly_pet';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  textSecondaryColor: string;
  borderColor: string;
  borderRadius: string;
  borderRadiusLg: string;
  headingFont: string;
  bodyFont: string;
  googleFontsUrl: string;
  buttonClass: string;
  shadowClass: string;
}

function generateBrandNameAndSlogan(businessName: string, category: string): { brandName: string; slogan: string } {
  const clean = businessName.replace(/\s+Store$/i, '').trim();

  // If title is already short, clean it up
  const words = clean.split(/\s+/).filter(w => !w.match(/^(and|with|the|of|for|active|noise|cancelling|wireless|over|ear|rosewater|organic|hydrating|memory|foam|seat|cushion|ergonomic|massage|pro|mist|pure|glow|sound|aero|cushion|chair)$/i));
  
  let name = '';
  if (words.length > 0 && words[0].length >= 3 && words[0].length <= 15) {
    name = words[0];
  } else {
    name = clean.split(/\s+/).slice(0, 2).join(' ');
  }

  if (name.length > 18) {
    name = name.substring(0, 18).trim();
  }

  name = name.replace(/[|_\-\[\]{}()]/g, '').trim();
  name = name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());

  let slogan = 'Elevating your daily experience.';
  switch (category) {
    case 'tech_futuristic':
      slogan = 'Next-gen technology for modern life.';
      break;
    case 'soft_lifestyle':
      slogan = 'Pure organic beauty from within.';
      break;
    case 'bold_conversion':
      slogan = 'Unleash your ultimate performance.';
      break;
    case 'luxury_editorial':
      slogan = 'Timeless elegance, crafted for you.';
      break;
    case 'friendly_pet':
      slogan = 'Nurturing your pets with care and love.';
      break;
    case 'modern_commerce':
    default:
      slogan = 'Thoughtful design for comfortable spaces.';
      break;
  }

  return { brandName: name, slogan };
}

function resolveCategoryColors(inputColor: string, category: string, role: 'primary' | 'secondary'): string {
  const isDefaultBlue = !inputColor || inputColor.toLowerCase() === '#3b82f6' || inputColor.toLowerCase() === '#0000ff' || inputColor.toLowerCase() === '#000000';
  
  if (category === 'soft_lifestyle') {
    if (isDefaultBlue) {
      return role === 'primary' ? '#7c2d12' : '#fed7aa';
    }
  } else if (category === 'luxury_editorial') {
    if (isDefaultBlue) {
      return role === 'primary' ? '#1c1917' : '#d4af37';
    }
  } else if (category === 'friendly_pet') {
    if (isDefaultBlue) {
      return role === 'primary' ? '#f97316' : '#fef08a';
    }
  } else if (category === 'modern_commerce') {
    if (isDefaultBlue) {
      return role === 'primary' ? '#0f766e' : '#ccfbf1';
    }
  }
  
  return inputColor;
}

function cleanProductTitle(rawTitle: string, businessName: string): string {
  if (!rawTitle) return '';
  let title = rawTitle;
  if (businessName) {
    const escapedBrand = businessName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    title = title.replace(new RegExp(escapedBrand, 'gi'), '');
  }
  const uselessWords = [
    'aliexpress', 'dropship', 'dropshipping', 'supplier', 'retail', 'wholesale',
    'hot selling', 'top quality', 'free shipping', 'fast shipping', '2026 new', '2025 new',
    'factory price', 'oem', 'odm', 'brand new', 'original', 'genuine', 'high quality',
    'best seller', 'trending', 'popular', 'premium', 'luxury', '100% new', 'new arrival'
  ];
  for (const word of uselessWords) {
    title = title.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  }
  title = title.replace(/[|_\-\[\]{}()]/g, ' ');
  title = title.replace(/\s+/g, ' ').trim();

  const words = title.split(' ');
  const uniqueWords: string[] = [];
  for (const word of words) {
    if (word && !uniqueWords.some(w => w.toLowerCase() === word.toLowerCase())) {
      uniqueWords.push(word);
    }
  }
  title = uniqueWords.join(' ');

  if (words.length > 5) {
    title = uniqueWords.slice(0, 5).join(' ');
  }

  return title.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

function cleanProductDescription(rawDesc: string): string {
  if (!rawDesc) return '';
  let desc = rawDesc;
  desc = desc.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  desc = desc.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  const badPatterns = [
    /shipping\b.*/gi,
    /delivery\b.*/gi,
    /aliExpress/gi,
    /dropshipping/gi,
    /china post/gi,
    /epacket/gi,
    /return policy/gi,
    /refund\b.*/gi,
    /tracking number/gi,
    /wholesale/gi
  ];
  for (const pat of badPatterns) {
    desc = desc.replace(pat, '');
  }

  desc = desc.replace(/&nbsp;/g, ' ');
  desc = desc.replace(/\s+/g, ' ');
  
  return desc.trim();
}

function profileProduct(gen: WebsiteGeneration, input: WebsiteBuilderInput): ProductProfile {
  const textToScan = `${input.businessType} ${input.brandDescription} ${input.businessName} ${gen.ecommerce?.shippingText ?? ''}`.toLowerCase();
  
  let category: ProductProfile['category'] = 'modern_commerce';
  if (textToScan.match(/headphone|earbud|gadget|charger|led|smartwatch|tech|electronic|wireless|device|computer|phone|cable/)) {
    category = 'tech_futuristic';
  } else if (textToScan.match(/rosewater|cosmetics|beauty|mist|skincare|cream|shampoo|organic|oil|wellness|serum|spa|facial|lotion/)) {
    category = 'soft_lifestyle';
  } else if (textToScan.match(/fitness|sport|gym|workout|activewear|resistance|muscle|athlete|running|shoes|yoga|dumbbells/)) {
    category = 'bold_conversion';
  } else if (textToScan.match(/jewelry|watch|perfume|leather|luxury|diamond|gold|premium|silk|handbag|ring|fashion/)) {
    category = 'luxury_editorial';
  } else if (textToScan.match(/pet|dog|cat|puppy|kitten|leash|collar|toy|veterinary/)) {
    category = 'friendly_pet';
  } else if (textToScan.match(/furniture|cushion|chair|home|garden|decor|kitchen|sofa|office|table/)) {
    category = 'modern_commerce';
  }

  const { brandName, slogan: brandSlogan } = generateBrandNameAndSlogan(input.businessName, category);
  const rawTitle = gen.ecommerce ? input.businessName.replace(/\s+Store$/i, '') : input.businessName;
  const cleanTitle = cleanProductTitle(rawTitle, input.businessName);
  const cleanDescription = cleanProductDescription(gen.ecommerce?.shippingText || gen.about.content || 'Premium product designed for ultimate comfort and performance.');

  // Default color palette setup
  let primaryColor = resolveCategoryColors(input.primaryColor, category, 'primary');
  let secondaryColor = resolveCategoryColors(input.secondaryColor, category, 'secondary');
  let accentColor = secondaryColor;
  let backgroundColor = '#ffffff';
  let surfaceColor = '#ffffff';
  let textColor = '#1a1a1a';
  let textSecondaryColor = '#4b5563';
  let borderColor = '#e5e7eb';
  let borderRadius = '8px';
  let borderRadiusLg = '16px';
  let headingFont = 'Outfit';
  let bodyFont = 'Inter';
  let googleFontsUrl = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@600;700;800&display=swap';
  let buttonClass = 'btn-rounded';
  let shadowClass = 'shadow-md';

  switch (category) {
    case 'tech_futuristic':
      headingFont = 'Outfit';
      bodyFont = 'Plus Jakarta Sans';
      googleFontsUrl = 'https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap';
      primaryColor = '#3b82f6';
      secondaryColor = '#6366f1';
      accentColor = '#f43f5e';
      backgroundColor = '#0b0f19';
      surfaceColor = '#161e2e';
      textColor = '#f8fafc';
      textSecondaryColor = '#94a3b8';
      borderColor = '#334155';
      borderRadius = '6px';
      borderRadiusLg = '12px';
      buttonClass = 'btn-tech';
      shadowClass = 'shadow-neon';
      break;

    case 'soft_lifestyle':
      headingFont = 'Playfair Display';
      bodyFont = 'Inter';
      googleFontsUrl = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Inter:wght@400;500;600&display=swap';
      primaryColor = '#7c2d12';
      secondaryColor = '#fed7aa';
      accentColor = '#c2410c';
      backgroundColor = '#fdfbf7';
      surfaceColor = '#ffffff';
      textColor = '#2c1e11';
      textSecondaryColor = '#6f5e53';
      borderColor = '#f3eae1';
      borderRadius = '16px';
      borderRadiusLg = '32px';
      buttonClass = 'btn-pill';
      shadowClass = 'shadow-soft';
      break;

    case 'bold_conversion':
      headingFont = 'Montserrat';
      bodyFont = 'Inter';
      googleFontsUrl = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap';
      primaryColor = '#dc2626';
      secondaryColor = '#111827';
      accentColor = '#ea580c';
      backgroundColor = '#ffffff';
      surfaceColor = '#f9fafb';
      textColor = '#111827';
      textSecondaryColor = '#4b5563';
      borderColor = '#e5e7eb';
      borderRadius = '8px';
      borderRadiusLg = '16px';
      buttonClass = 'btn-sharp-bold';
      shadowClass = 'shadow-flat';
      break;

    case 'luxury_editorial':
      headingFont = 'Cormorant Garamond';
      bodyFont = 'Montserrat';
      googleFontsUrl = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400&family=Montserrat:wght@400;500;600&display=swap';
      primaryColor = '#1c1917';
      secondaryColor = '#d4af37';
      accentColor = '#78716c';
      backgroundColor = '#fafaf9';
      surfaceColor = '#ffffff';
      textColor = '#1c1917';
      textSecondaryColor = '#57534e';
      borderColor = '#e7e5e4';
      borderRadius = '0px';
      borderRadiusLg = '0px';
      buttonClass = 'btn-minimal-sharp';
      shadowClass = 'shadow-none';
      break;

    case 'friendly_pet':
      headingFont = 'Fredoka';
      bodyFont = 'Quicksand';
      googleFontsUrl = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Quicksand:wght@500;600;700&display=swap';
      primaryColor = '#f97316';
      secondaryColor = '#fef08a';
      accentColor = '#10b981';
      backgroundColor = '#fafaf5';
      surfaceColor = '#ffffff';
      textColor = '#431407';
      textSecondaryColor = '#7c2d12';
      borderColor = '#f0ebe1';
      borderRadius = '24px';
      borderRadiusLg = '48px';
      buttonClass = 'btn-bubbly';
      shadowClass = 'shadow-cute';
      break;

    case 'modern_commerce':
    default:
      headingFont = 'Outfit';
      bodyFont = 'Plus Jakarta Sans';
      googleFontsUrl = 'https://fonts.googleapis.com/css2?family=Outfit:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap';
      primaryColor = '#0f766e';
      secondaryColor = '#ccfbf1';
      accentColor = '#0d9488';
      backgroundColor = '#fcfdfd';
      surfaceColor = '#ffffff';
      textColor = '#0f172a';
      textSecondaryColor = '#475569';
      borderColor = '#e2e8f0';
      borderRadius = '12px';
      borderRadiusLg = '24px';
      buttonClass = 'btn-rounded-modern';
      shadowClass = 'shadow-clean';
      break;
  }

  // Preserve user custom color preferences
  if (input.primaryColor && input.primaryColor.startsWith('#') && input.primaryColor !== '#000000') {
    primaryColor = resolveCategoryColors(input.primaryColor, category, 'primary');
  }
  if (input.secondaryColor && input.secondaryColor.startsWith('#') && input.secondaryColor !== '#000000') {
    secondaryColor = resolveCategoryColors(input.secondaryColor, category, 'secondary');
  }

  return {
    brandName,
    brandSlogan,
    cleanTitle,
    cleanDescription,
    category,
    primaryColor,
    secondaryColor,
    accentColor,
    backgroundColor,
    surfaceColor,
    textColor,
    textSecondaryColor,
    borderColor,
    borderRadius,
    borderRadiusLg,
    headingFont,
    bodyFont,
    googleFontsUrl,
    buttonClass,
    shadowClass
  };
}

// ── Layout ────────────────────────────────────────────────────

function generateLayout(
  gen: WebsiteGeneration,
  input: WebsiteBuilderInput
): ShopifyThemeFile[] {
  const profile = profileProduct(gen, input);

  const themeLayout = `<!doctype html>
<html class="no-js" lang="{{ request.locale.iso_code }}">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">

  <title>{{ page_title }}{% unless page_title contains shop.name %} — {{ shop.name }}{% endunless %}</title>

  {% if page_description %}
    <meta name="description" content="{{ page_description | escape }}">
  {% endif %}

  {{ content_for_header }}

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${profile.googleFontsUrl}" rel="stylesheet">

  {{ 'theme.css' | asset_url | stylesheet_tag }}

  <style>
    :root {
      --primary: ${profile.primaryColor};
      --secondary: ${profile.secondaryColor};
      --accent: ${profile.accentColor};
      --bg-primary: ${profile.backgroundColor};
      --bg-secondary: ${profile.surfaceColor};
      --text-primary: ${profile.textColor};
      --text-secondary: ${profile.textSecondaryColor};
      --border-color: ${profile.borderColor};
      --border-radius: ${profile.borderRadius};
      --border-radius-lg: ${profile.borderRadiusLg};
      --font-heading: '${profile.headingFont}', sans-serif;
      --font-body: '${profile.bodyFont}', sans-serif;
    }
  </style>
</head>
<body class="template-{{ template | replace: '.', '-' }} style-${profile.category}">
  <a class="skip-to-content" href="#MainContent">{{ 'general.skip_to_content' | t }}</a>

  {% section 'header' %}

  <main id="MainContent" role="main">
    {{ content_for_layout }}
  </main>

  {% section 'footer' %}

  {{ 'theme.js' | asset_url | script_tag }}
</body>
</html>`;

  return [file('layout/theme.liquid', themeLayout)];
}

// ── Templates (JSON — Online Store 2.0) ──────────────────────

function generateTemplates(
  gen: WebsiteGeneration,
  input: WebsiteBuilderInput
): ShopifyThemeFile[] {
  const t = (key: string, value: object) => file(key, JSON.stringify(value, null, 2));

  const productTitle = gen.ecommerce ? input.businessName.replace(/\s+Store$/i, '') : input.businessName;
  const productDescription = gen.ecommerce?.shippingText || gen.about.content || 'Premium product designed for ultimate performance and comfort.';
  const price = gen.ecommerce?.price || '29.99';
  const compareAtPrice = gen.ecommerce?.compareAtPrice || '49.99';
  const images = gen.ecommerce?.images || [];

  // Determine index page templates based on store type
  const indexTemplate = gen.ecommerce ? {
    sections: {
      'hero-product': {
        type: 'hero-product',
        settings: {
          title: productTitle,
          price: price,
          compare_at_price: compareAtPrice,
          description: `<p>${productDescription}</p>`,
          image_1: images[0] ?? '',
          image_2: images[1] ?? '',
          image_3: images[2] ?? '',
          variant_1_name: gen.ecommerce?.variants?.[0]?.name ?? '',
          variant_1_values: gen.ecommerce?.variants?.[0]?.values?.join(', ') ?? '',
          trust_title: 'Guaranteed Safe Checkout',
          badge_1: gen.ecommerce?.trustBadges?.[0] ?? '30-Day Money Back Guarantee',
          badge_2: gen.ecommerce?.trustBadges?.[1] ?? 'Free Worldwide Shipping',
          badge_3: gen.ecommerce?.trustBadges?.[2] ?? 'Secure SSL Encrypted Checkout',
          shipping_text: gen.ecommerce?.shippingText ?? 'Free shipping on all orders this week!'
        }
      },
      'trust-bar': {
        type: 'trust-bar',
        settings: {
          badge_1: gen.ecommerce?.trustBadges?.[0] ?? '30-Day Money Back Guarantee',
          badge_2: gen.ecommerce?.trustBadges?.[1] ?? 'Free Worldwide Shipping',
          badge_3: gen.ecommerce?.trustBadges?.[2] ?? 'Secure SSL Encrypted Checkout'
        }
      },
      'product-benefits': {
        type: 'product-benefits',
        settings: {
          heading: 'Why Choose Us',
          benefit_1_icon: gen.homepage.features?.[0]?.icon ? mapLucideToEmoji(gen.homepage.features[0].icon) : '✨',
          benefit_1_title: gen.homepage.features?.[0]?.title ?? 'Premium Quality',
          benefit_1_desc: gen.homepage.features?.[0]?.description ?? '',
          benefit_2_icon: gen.homepage.features?.[1]?.icon ? mapLucideToEmoji(gen.homepage.features[1].icon) : '⚡',
          benefit_2_title: gen.homepage.features?.[1]?.title ?? 'Modern Design',
          benefit_2_desc: gen.homepage.features?.[1]?.description ?? '',
          benefit_3_icon: gen.homepage.features?.[2]?.icon ? mapLucideToEmoji(gen.homepage.features[2].icon) : '🛡️',
          benefit_3_title: gen.homepage.features?.[2]?.title ?? '30-Day Guarantee',
          benefit_3_desc: gen.homepage.features?.[2]?.description ?? '',
          benefit_4_icon: gen.homepage.features?.[3]?.icon ? mapLucideToEmoji(gen.homepage.features[3].icon) : '💎',
          benefit_4_title: gen.homepage.features?.[3]?.title ?? 'Exceptional Performance',
          benefit_4_desc: gen.homepage.features?.[3]?.description ?? '',
          benefit_5_icon: gen.homepage.features?.[4]?.icon ? mapLucideToEmoji(gen.homepage.features[4].icon) : '🔄',
          benefit_5_title: gen.homepage.features?.[4]?.title ?? 'Easy Returns',
          benefit_5_desc: gen.homepage.features?.[4]?.description ?? '',
          benefit_6_icon: gen.homepage.features?.[5]?.icon ? mapLucideToEmoji(gen.homepage.features[5].icon) : '👍',
          benefit_6_title: gen.homepage.features?.[5]?.title ?? 'Customer Support',
          benefit_6_desc: gen.homepage.features?.[5]?.description ?? ''
        }
      },
      'image-with-text-1': {
        type: 'image-with-text',
        settings: {
          heading: gen.ecommerce?.featureSections?.[0]?.title ?? 'Designed to Perfection',
          text: `<p>${gen.ecommerce?.featureSections?.[0]?.description ?? 'Experience the difference with our meticulously engineered product.'}</p>`,
          image_url: gen.ecommerce?.featureSections?.[0]?.imageUrl ?? images[0] ?? '',
          layout: 'left',
          button_label: 'Learn More',
          button_link: '/collections/all'
        }
      },
      'image-with-text-2': {
        type: 'image-with-text',
        settings: {
          heading: gen.ecommerce?.featureSections?.[1]?.title ?? 'Premium Quality Materials',
          text: `<p>${gen.ecommerce?.featureSections?.[1]?.description ?? 'Our product is made from premium materials designed to last.'}</p>`,
          image_url: gen.ecommerce?.featureSections?.[1]?.imageUrl ?? images[1] ?? images[0] ?? '',
          layout: 'right',
          button_label: 'Shop Now',
          button_link: '/collections/all'
        }
      },
      'product-specifications': {
        type: 'product-specifications',
        settings: {
          heading: 'Technical Specifications',
          spec_1_label: gen.ecommerce?.specifications?.[0]?.label ?? '',
          spec_1_value: gen.ecommerce?.specifications?.[0]?.value ?? '',
          spec_2_label: gen.ecommerce?.specifications?.[1]?.label ?? '',
          spec_2_value: gen.ecommerce?.specifications?.[1]?.value ?? '',
          spec_3_label: gen.ecommerce?.specifications?.[2]?.label ?? '',
          spec_3_value: gen.ecommerce?.specifications?.[2]?.value ?? '',
          spec_4_label: gen.ecommerce?.specifications?.[3]?.label ?? '',
          spec_4_value: gen.ecommerce?.specifications?.[3]?.value ?? '',
          spec_5_label: gen.ecommerce?.specifications?.[4]?.label ?? '',
          spec_5_value: gen.ecommerce?.specifications?.[4]?.value ?? '',
          spec_6_label: gen.ecommerce?.specifications?.[5]?.label ?? '',
          spec_6_value: gen.ecommerce?.specifications?.[5]?.value ?? '',
          spec_7_label: gen.ecommerce?.specifications?.[6]?.label ?? '',
          spec_7_value: gen.ecommerce?.specifications?.[6]?.value ?? '',
          spec_8_label: gen.ecommerce?.specifications?.[7]?.label ?? '',
          spec_8_value: gen.ecommerce?.specifications?.[7]?.value ?? ''
        }
      },
      testimonials: {
        type: 'testimonials',
        settings: {
          heading: 'Customer Reviews',
          subheading: 'Hear from our verified buyers'
        }
      },
      faq: {
        type: 'faq',
        settings: {
          heading: gen.faq.title,
          subheading: gen.faq.subtitle
        }
      }
    },
    order: ['hero-product', 'trust-bar', 'product-benefits', 'image-with-text-1', 'image-with-text-2', 'product-specifications', 'testimonials', 'faq'],
  } : {
    sections: {
      hero: { type: 'hero', settings: {} },
      'featured-collection': {
        type: 'featured-collection',
        settings: { collection: 'all', heading: 'Featured Products' },
      },
      'rich-text': {
        type: 'rich-text',
        settings: {
          heading: gen.about.title,
          content: gen.about.content,
        },
      },
      testimonials: { type: 'testimonials', settings: {} },
      newsletter: { type: 'newsletter', settings: {} },
    },
    order: ['hero', 'featured-collection', 'rich-text', 'testimonials', 'newsletter'],
  };

  const productTemplate = {
    sections: {
      'hero-product': {
        type: 'hero-product',
        settings: {
          title: productTitle,
          price: price,
          compare_at_price: compareAtPrice,
          description: `<p>${productDescription}</p>`,
          image_1: images[0] ?? '',
          image_2: images[1] ?? '',
          image_3: images[2] ?? '',
          variant_1_name: gen.ecommerce?.variants?.[0]?.name ?? '',
          variant_1_values: gen.ecommerce?.variants?.[0]?.values?.join(', ') ?? '',
          trust_title: 'Guaranteed Safe Checkout',
          badge_1: gen.ecommerce?.trustBadges?.[0] ?? '30-Day Money Back Guarantee',
          badge_2: gen.ecommerce?.trustBadges?.[1] ?? 'Free Worldwide Shipping',
          badge_3: gen.ecommerce?.trustBadges?.[2] ?? 'Secure SSL Encrypted Checkout',
          shipping_text: gen.ecommerce?.shippingText ?? 'Free shipping on all orders this week!'
        }
      },
      'product-gallery': {
        type: 'product-gallery',
        settings: {
          heading: 'Product Gallery',
          image_1: images[0] ?? '',
          image_2: images[1] ?? '',
          image_3: images[2] ?? '',
          image_4: images[3] ?? ''
        }
      },
      'product-specifications': {
        type: 'product-specifications',
        settings: {
          heading: 'Technical Specifications',
          spec_1_label: gen.ecommerce?.specifications?.[0]?.label ?? '',
          spec_1_value: gen.ecommerce?.specifications?.[0]?.value ?? '',
          spec_2_label: gen.ecommerce?.specifications?.[1]?.label ?? '',
          spec_2_value: gen.ecommerce?.specifications?.[1]?.value ?? '',
          spec_3_label: gen.ecommerce?.specifications?.[2]?.label ?? '',
          spec_3_value: gen.ecommerce?.specifications?.[2]?.value ?? '',
          spec_4_label: gen.ecommerce?.specifications?.[3]?.label ?? '',
          spec_4_value: gen.ecommerce?.specifications?.[3]?.value ?? '',
          spec_5_label: gen.ecommerce?.specifications?.[4]?.label ?? '',
          spec_5_value: gen.ecommerce?.specifications?.[4]?.value ?? '',
          spec_6_label: gen.ecommerce?.specifications?.[5]?.label ?? '',
          spec_6_value: gen.ecommerce?.specifications?.[5]?.value ?? '',
          spec_7_label: gen.ecommerce?.specifications?.[6]?.label ?? '',
          spec_7_value: gen.ecommerce?.specifications?.[6]?.value ?? '',
          spec_8_label: gen.ecommerce?.specifications?.[7]?.label ?? '',
          spec_8_value: gen.ecommerce?.specifications?.[7]?.value ?? ''
        }
      },
      faq: {
        type: 'faq',
        settings: {
          heading: gen.faq.title,
          subheading: gen.faq.subtitle
        }
      }
    },
    order: ['hero-product', 'product-gallery', 'product-specifications', 'faq'],
  };

  const collectionTemplate = {
    sections: {
      'main-collection': { type: 'main-collection', settings: {} },
    },
    order: ['main-collection'],
  };

  const pageTemplate = {
    sections: {
      'rich-text': {
        type: 'rich-text',
        settings: { heading: '{{ page.title }}', content: '{{ page.content }}' },
      },
    },
    order: ['rich-text'],
  };

  const contactTemplate = {
    sections: {
      'contact-form': { type: 'contact-form', settings: {} },
    },
    order: ['contact-form'],
  };

  const aboutTemplate = {
    sections: {
      'rich-text': {
        type: 'rich-text',
        settings: {
          heading: gen.about.title,
          content: gen.about.content,
        },
      },
    },
    order: ['rich-text'],
  };

  const faqTemplate = {
    sections: {
      faq: { type: 'faq', settings: {} },
    },
    order: ['faq'],
  };

  const blogTemplate = {
    sections: {
      'main-blog': { type: 'main-blog', settings: {} },
    },
    order: ['main-blog'],
  };

  const articleTemplate = {
    sections: {
      'main-article': { type: 'main-article', settings: {} },
    },
    order: ['main-article'],
  };

  const cartTemplate = {
    sections: {
      'main-cart': { type: 'main-cart', settings: {} },
    },
    order: ['main-cart'],
  };

  const notFoundTemplate = {
    sections: {
      '404': { type: '404', settings: {} },
    },
    order: ['404'],
  };

  const searchTemplate = {
    sections: {
      search: { type: 'search', settings: {} },
    },
    order: ['search'],
  };

  return [
    t('templates/index.json', indexTemplate),
    t('templates/product.json', productTemplate),
    t('templates/collection.json', collectionTemplate),
    t('templates/page.json', pageTemplate),
    t('templates/page.contact.json', contactTemplate),
    t('templates/page.about.json', aboutTemplate),
    t('templates/page.faq.json', faqTemplate),
    t('templates/blog.json', blogTemplate),
    t('templates/article.json', articleTemplate),
    t('templates/cart.json', cartTemplate),
    t('templates/404.json', notFoundTemplate),
    t('templates/search.json', searchTemplate),
  ];
}

// ── Sections ──────────────────────────────────────────────────

function generateSections(
  gen: WebsiteGeneration,
  input: WebsiteBuilderInput
): ShopifyThemeFile[] {
  return [
    file('sections/header.liquid', generateHeaderSection(gen, input)),
    file('sections/footer.liquid', generateFooterSection(gen, input)),
    file('sections/hero.liquid', generateHeroSection(gen, input)),
    file('sections/trust-bar.liquid', generateTrustBarSection(gen, input)),
    file('sections/featured-collection.liquid', generateFeaturedCollectionSection()),
    file('sections/rich-text.liquid', generateRichTextSection()),
    file('sections/contact-form.liquid', generateContactFormSection(gen)),
    file('sections/faq.liquid', generateFaqSection(gen)),
    file('sections/testimonials.liquid', generateTestimonialsSection(gen)),
    file('sections/pricing-table.liquid', generatePricingTableSection(gen)),
    file('sections/newsletter.liquid', generateNewsletterSection(gen, input)),
    file('sections/main-product.liquid', generateMainProductSection()),
    file('sections/main-collection.liquid', generateMainCollectionSection()),
    file('sections/main-blog.liquid', generateMainBlogSection()),
    file('sections/main-article.liquid', generateMainArticleSection()),
    file('sections/main-cart.liquid', generateMainCartSection()),
    file('sections/404.liquid', generate404Section()),
    file('sections/search.liquid', generateSearchSection()),
    file('sections/hero-product.liquid', generateHeroProductSection(gen, input)),
    file('sections/product-gallery.liquid', generateProductGallerySection(gen)),
    file('sections/product-benefits.liquid', generateProductBenefitsSection(gen)),
    file('sections/product-specifications.liquid', generateProductSpecificationsSection(gen)),
    file('sections/image-with-text.liquid', generateImageWithTextSection(gen)),
    file('sections/featured-product.liquid', generateFeaturedProductSection(gen, input)),
  ];
}

// ── Section: Header ───────────────────────────────────────────

function generateHeaderSection(
  gen: WebsiteGeneration,
  input: WebsiteBuilderInput
): string {
  const profile = profileProduct(gen, input);

  return `<header class="site-header" data-section-id="{{ section.id }}" data-section-type="header">
  <div class="container header-inner">
    <a href="/" class="header-logo">
      <span class="logo-text">{{ section.settings.logo_text }}</span>
    </a>

    <button class="mobile-menu-toggle" aria-label="{{ 'general.navigation.menu' | t }}" aria-expanded="false">
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    </button>

    <nav class="main-nav" role="navigation" aria-label="{{ 'general.navigation.main' | t }}">
      <ul class="nav-list">
        {% for link in linklists[section.settings.menu].links %}
          <li class="nav-item{% if link.active %} nav-item--active{% endif %}">
            <a href="{{ link.url }}" class="nav-link"{% if link.current %} aria-current="page"{% endif %}>
              {{ link.title }}
            </a>
            {% if link.links.size > 0 %}
              <ul class="nav-dropdown">
                {% for child in link.links %}
                  <li>
                    <a href="{{ child.url }}" class="nav-dropdown-link">{{ child.title }}</a>
                  </li>
                {% endfor %}
              </ul>
            {% endif %}
          </li>
        {% endfor %}
      </ul>
    </nav>

    <div class="header-actions">
      <a href="/search" class="header-icon" aria-label="{{ 'general.search.title' | t }}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </a>
      <a href="/cart" class="header-icon header-cart" aria-label="{{ 'general.cart.title' | t }}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <span class="cart-count">{{ cart.item_count }}</span>
      </a>
    </div>
  </div>
</header>

{% schema %}
{
  "name": "Header",
  "settings": [
    {
      "type": "text",
      "id": "logo_text",
      "label": "Logo text",
      "default": "${escJson(profile.brandName)}"
    },
    {
      "type": "link_list",
      "id": "menu",
      "label": "Navigation menu",
      "default": "main-menu"
    }
  ]
}
{% endschema %}`;
}

// ── Section: Footer ───────────────────────────────────────────

function generateFooterSection(
  gen: WebsiteGeneration,
  _input: WebsiteBuilderInput
): string {
  const { footer } = gen;

  const columnsHtml = footer.columns
    .map(
      (col) => `
        <div class="footer-column">
          <h4 class="footer-heading">${esc(col.title)}</h4>
          <ul class="footer-links">
            ${col.links.map((l) => `<li><a href="${l.url}">${esc(l.label)}</a></li>`).join('\n            ')}
          </ul>
        </div>`
    )
    .join('\n');

  return `<footer class="site-footer" data-section-id="{{ section.id }}" data-section-type="footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-column footer-brand">
        <h4 class="footer-heading">{{ shop.name }}</h4>
        <p class="footer-tagline">{{ section.settings.tagline }}</p>
        <div class="footer-social">
          {% render 'social-icons', links: section.settings %}
        </div>
      </div>
${columnsHtml}
    </div>

    <div class="footer-bottom">
      <p class="footer-copyright">{{ section.settings.copyright }}</p>
      <div class="footer-payment">
        {{ 'shopify.online_store.payment_methods' | t }}
      </div>
    </div>
  </div>
</footer>

{% schema %}
{
  "name": "Footer",
  "settings": [
    {
      "type": "text",
      "id": "tagline",
      "label": "Footer tagline",
      "default": "${escJson(footer.tagline)}"
    },
    {
      "type": "text",
      "id": "copyright",
      "label": "Copyright text",
      "default": "${escJson(footer.copyright)}"
    }${footer.socialLinks.map((link, i) => `,
    {
      "type": "text",
      "id": "social_${link.platform.toLowerCase()}",
      "label": "${link.platform} URL",
      "default": "${escJson(link.url)}"
    }`).join('')}
  ]
}
{% endschema %}`;
}

// ── Section: Hero ─────────────────────────────────────────────

function generateHeroSection(
  gen: WebsiteGeneration,
  input: WebsiteBuilderInput
): string {
  const { hero } = gen.homepage;
  const ctaHtml = hero.ctaButtons
    .map(
      (btn) =>
        `<a href="{{ section.settings.cta_url }}" class="btn btn-${btn.variant}">{{ section.settings.cta_label }}</a>`
    )
    .join('\n          ');

  const resolvedStyle = gen.ecommerce?.preferredStyle ?? input.preferredStyle;

  return `<section class="hero hero--${resolvedStyle}" data-section-id="{{ section.id }}" data-section-type="hero">
  <div class="hero-overlay"></div>
  <div class="container hero-inner">
    <div class="hero-content">
      <h1 class="hero-headline">{{ section.settings.headline }}</h1>
      <p class="hero-subheadline">{{ section.settings.subheadline }}</p>
      <div class="hero-cta">
        {% if section.settings.cta_label != blank %}
          <a href="{{ section.settings.cta_url }}" class="btn btn-primary">{{ section.settings.cta_label }}</a>
        {% endif %}
        {% if section.settings.cta_secondary_label != blank %}
          <a href="{{ section.settings.cta_secondary_url }}" class="btn btn-secondary">{{ section.settings.cta_secondary_label }}</a>
        {% endif %}
      </div>
    </div>
    {% if section.settings.image != blank %}
      <div class="hero-media">
        <img
          src="{{ section.settings.image | image_url: width: 1200 }}"
          alt="{{ section.settings.headline | escape }}"
          width="1200"
          height="auto"
          loading="eager"
        >
      </div>
    {% endif %}
  </div>
</section>

{% schema %}
{
  "name": "Hero",
  "settings": [
    {
      "type": "text",
      "id": "headline",
      "label": "Headline",
      "default": "${escJson(hero.headline)}"
    },
    {
      "type": "textarea",
      "id": "subheadline",
      "label": "Subheadline",
      "default": "${escJson(hero.subheadline)}"
    },
    {
      "type": "text",
      "id": "cta_label",
      "label": "Primary button label",
      "default": "${escJson(hero.ctaButtons[0]?.label ?? 'Shop Now')}"
    },
    {
      "type": "url",
      "id": "cta_url",
      "label": "Primary button link",
      "default": "${hero.ctaButtons[0]?.url ?? '/collections/all'}"
    },
    {
      "type": "text",
      "id": "cta_secondary_label",
      "label": "Secondary button label",
      "default": "${escJson(hero.ctaButtons[1]?.label ?? '')}"
    },
    {
      "type": "url",
      "id": "cta_secondary_url",
      "label": "Secondary button link",
      "default": "${hero.ctaButtons[1]?.url ?? ''}"
    },
    {
      "type": "image_picker",
      "id": "image",
      "label": "Hero image"
    }
  ],
  "presets": [
    {
      "name": "Hero banner"
    }
  ]
}
{% endschema %}`;
}

// ── Section: Featured Collection ──────────────────────────────

function generateFeaturedCollectionSection(): string {
  return `<section class="featured-collection" data-section-id="{{ section.id }}" data-section-type="featured-collection">
  <div class="container">
    <div class="section-header">
      <h2 class="section-title">{{ section.settings.heading }}</h2>
      {% if section.settings.subheading != blank %}
        <p class="section-subtitle">{{ section.settings.subheading }}</p>
      {% endif %}
    </div>

    <div class="product-grid">
      {% assign collection = collections[section.settings.collection] %}
      {% for product in collection.products limit: section.settings.limit %}
        {% render 'product-card', product: product %}
      {% else %}
        {% for i in (1..4) %}
          <div class="product-card product-card--placeholder">
            <div class="product-card__image-wrapper">
              {{ 'product-' | append: i | placeholder_svg_tag: 'placeholder-svg' }}
            </div>
            <div class="product-card__info">
              <h3 class="product-card__title">{{ 'general.onboarding.product_title' | t }}</h3>
              <p class="product-card__price">{{ 9999 | money }}</p>
            </div>
          </div>
        {% endfor %}
      {% endfor %}
    </div>

    {% if section.settings.show_view_all %}
      <div class="section-footer">
        <a href="{{ collection.url }}" class="btn btn-secondary">{{ 'general.view_all' | t }}</a>
      </div>
    {% endif %}
  </div>
</section>

{% schema %}
{
  "name": "Featured collection",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Featured Products"
    },
    {
      "type": "text",
      "id": "subheading",
      "label": "Subheading",
      "default": "Handpicked selections just for you"
    },
    {
      "type": "collection",
      "id": "collection",
      "label": "Collection"
    },
    {
      "type": "range",
      "id": "limit",
      "label": "Products to show",
      "min": 2,
      "max": 12,
      "step": 1,
      "default": 4
    },
    {
      "type": "checkbox",
      "id": "show_view_all",
      "label": "Show View All button",
      "default": true
    }
  ],
  "presets": [
    {
      "name": "Featured collection"
    }
  ]
}
{% endschema %}`;
}

// ── Section: Rich Text ────────────────────────────────────────

function generateRichTextSection(): string {
  return `<section class="rich-text" data-section-id="{{ section.id }}" data-section-type="rich-text">
  <div class="container rich-text-inner">
    {% if section.settings.heading != blank %}
      <h2 class="rich-text__heading">{{ section.settings.heading }}</h2>
    {% endif %}
    {% if section.settings.content != blank %}
      <div class="rich-text__content rte">
        {{ section.settings.content }}
      </div>
    {% endif %}
    {% if section.settings.button_label != blank %}
      <a href="{{ section.settings.button_url }}" class="btn btn-primary">{{ section.settings.button_label }}</a>
    {% endif %}
  </div>
</section>

{% schema %}
{
  "name": "Rich text",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Talk about your brand"
    },
    {
      "type": "richtext",
      "id": "content",
      "label": "Content",
      "default": "<p>Share information about your brand with your customers. Describe a product, make announcements, or welcome customers to your store.</p>"
    },
    {
      "type": "text",
      "id": "button_label",
      "label": "Button label"
    },
    {
      "type": "url",
      "id": "button_url",
      "label": "Button link"
    }
  ],
  "presets": [
    {
      "name": "Rich text"
    }
  ]
}
{% endschema %}`;
}

// ── Section: Contact Form ─────────────────────────────────────

function generateContactFormSection(gen: WebsiteGeneration): string {
  const { contact } = gen;

  return `<section class="contact-section" data-section-id="{{ section.id }}" data-section-type="contact-form">
  <div class="container">
    <div class="section-header">
      <h2 class="section-title">{{ section.settings.heading }}</h2>
      {% if section.settings.subheading != blank %}
        <p class="section-subtitle">{{ section.settings.subheading }}</p>
      {% endif %}
    </div>

    <div class="contact-grid">
      <div class="contact-info">
        {% if section.settings.email != blank %}
          <div class="contact-detail">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <a href="mailto:{{ section.settings.email }}">{{ section.settings.email }}</a>
          </div>
        {% endif %}
        {% if section.settings.phone != blank %}
          <div class="contact-detail">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <a href="tel:{{ section.settings.phone }}">{{ section.settings.phone }}</a>
          </div>
        {% endif %}
        {% if section.settings.address != blank %}
          <div class="contact-detail">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>{{ section.settings.address }}</span>
          </div>
        {% endif %}
      </div>

      <div class="contact-form-wrapper">
        {% form 'contact' %}
          {% if form.posted_successfully? %}
            <div class="form-success">
              <p>{{ 'contact.form.post_success' | t }}</p>
            </div>
          {% endif %}

          {{ form.errors | default_errors }}

          <div class="form-row">
            <div class="form-field">
              <label for="ContactName">{{ 'contact.form.name' | t }}</label>
              <input type="text" id="ContactName" name="contact[name]" placeholder="{{ 'contact.form.name' | t }}" required>
            </div>
            <div class="form-field">
              <label for="ContactEmail">{{ 'contact.form.email' | t }}</label>
              <input type="email" id="ContactEmail" name="contact[email]" placeholder="{{ 'contact.form.email' | t }}" required>
            </div>
          </div>

          <div class="form-field">
            <label for="ContactPhone">{{ 'contact.form.phone' | t }}</label>
            <input type="tel" id="ContactPhone" name="contact[phone]" placeholder="{{ 'contact.form.phone' | t }}">
          </div>

          <div class="form-field">
            <label for="ContactMessage">{{ 'contact.form.message' | t }}</label>
            <textarea id="ContactMessage" name="contact[body]" rows="6" placeholder="{{ 'contact.form.message' | t }}" required></textarea>
          </div>

          <button type="submit" class="btn btn-primary">{{ 'contact.form.send' | t }}</button>
        {% endform %}
      </div>
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Contact form",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "${escJson(contact.title)}"
    },
    {
      "type": "text",
      "id": "subheading",
      "label": "Subheading",
      "default": "${escJson(contact.subtitle)}"
    },
    {
      "type": "text",
      "id": "email",
      "label": "Email address",
      "default": "${escJson(contact.email)}"
    },
    {
      "type": "text",
      "id": "phone",
      "label": "Phone number",
      "default": "${escJson(contact.phone)}"
    },
    {
      "type": "text",
      "id": "address",
      "label": "Address",
      "default": "${escJson(contact.address)}"
    }
  ],
  "presets": [
    {
      "name": "Contact form"
    }
  ]
}
{% endschema %}`;
}

// ── Section: FAQ ──────────────────────────────────────────────

function generateFaqSection(gen: WebsiteGeneration): string {
  const { faq } = gen;

  const faqItemsHtml = faq.items
    .map(
      (item, i) => `
        <div class="faq-item" data-faq-item>
          <button class="faq-question" aria-expanded="false" aria-controls="faq-answer-${i}" data-faq-toggle>
            <span>${esc(item.question)}</span>
            <svg class="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="faq-answer" id="faq-answer-${i}" role="region" hidden>
            <p>${esc(item.answer)}</p>
          </div>
        </div>`
    )
    .join('\n');

  return `<section class="faq-section" data-section-id="{{ section.id }}" data-section-type="faq">
  <div class="container">
    <div class="section-header">
      <h2 class="section-title">{{ section.settings.heading }}</h2>
      {% if section.settings.subheading != blank %}
        <p class="section-subtitle">{{ section.settings.subheading }}</p>
      {% endif %}
    </div>

    <div class="faq-list">
${faqItemsHtml}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "FAQ",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "${escJson(faq.title)}"
    },
    {
      "type": "text",
      "id": "subheading",
      "label": "Subheading",
      "default": "${escJson(faq.subtitle)}"
    }
  ],
  "presets": [
    {
      "name": "FAQ"
    }
  ]
}
{% endschema %}`;
}

// ── Section: Testimonials ─────────────────────────────────────

function generateTestimonialsSection(gen: WebsiteGeneration): string {
  const reviews = gen.ecommerce?.reviews?.map(r => ({
    name: r.author,
    rating: r.rating,
    quote: r.content,
    title: r.title,
    subtitle: r.date
  })) ?? gen.testimonials?.testimonials?.map(t => ({
    name: t.name,
    rating: t.rating,
    quote: t.quote,
    title: '',
    subtitle: `${t.role}${t.company ? ` at ${t.company}` : ''}`
  })) ?? [];

  const heading = gen.ecommerce ? 'Customer Reviews' : (gen.testimonials?.title ?? 'Customer Reviews');
  const subheading = gen.ecommerce ? 'Hear from our verified buyers' : (gen.testimonials?.subtitle ?? 'Hear from our verified buyers');

  const r1_author = reviews[0]?.name ?? 'Sarah M.';
  const r1_title = reviews[0]?.title ?? 'Amazing Quality';
  const r1_text = reviews[0]?.quote ?? 'This product exceeded all my expectations. Highly recommended!';
  const r1_rating = reviews[0]?.rating ?? 5;
  const r1_subtitle = reviews[0]?.subtitle ?? 'Verified Buyer';

  const r2_author = reviews[1]?.name ?? 'James L.';
  const r2_title = reviews[1]?.title ?? 'Fast Shipping & Great Value';
  const r2_text = reviews[1]?.quote ?? 'Super quick shipping, and the product is exactly as described.';
  const r2_rating = reviews[1]?.rating ?? 5;
  const r2_subtitle = reviews[1]?.subtitle ?? 'Verified Buyer';

  const r3_author = reviews[2]?.name ?? 'Emma K.';
  const r3_title = reviews[2]?.title ?? 'Will buy again!';
  const r3_text = reviews[2]?.quote ?? 'I am very pleased with this purchase. Customer service was excellent too.';
  const r3_rating = reviews[2]?.rating ?? 5;
  const r3_subtitle = reviews[2]?.subtitle ?? 'Verified Buyer';

  return `<section class="testimonials-section section" data-section-id="{{ section.id }}" data-section-type="testimonials">
  <div class="container">
    <div class="section-header">
      <h2 class="section-title">{{ section.settings.heading }}</h2>
      {% if section.settings.subheading != blank %}
        <p class="section-subtitle">{{ section.settings.subheading }}</p>
      {% endif %}
    </div>

    <div class="testimonials-grid">
      {% if section.settings.review_1_text != blank %}
        <div class="testimonial-card">
          <div class="testimonial-stars">
            {% assign r1 = section.settings.review_1_rating | plus: 0 %}
            {% for i in (1..5) %}
              {% if i <= r1 %}★{% else %}☆{% endif %}
            {% endfor %}
          </div>
          {% if section.settings.review_1_title != blank %}
            <h4 class="testimonial-title">{{ section.settings.review_1_title }}</h4>
          {% endif %}
          <blockquote class="testimonial-quote">"{{ section.settings.review_1_text }}"</blockquote>
          <div class="testimonial-author">
            <div class="testimonial-avatar">{{ section.settings.review_1_author | slice: 0 | upcase }}</div>
            <div class="testimonial-meta">
              <strong class="testimonial-name">{{ section.settings.review_1_author }}</strong>
              {% if section.settings.review_1_subtitle != blank %}
                <span class="testimonial-role">{{ section.settings.review_1_subtitle }}</span>
              {% endif %}
            </div>
          </div>
        </div>
      {% endif %}

      {% if section.settings.review_2_text != blank %}
        <div class="testimonial-card">
          <div class="testimonial-stars">
            {% assign r2 = section.settings.review_2_rating | plus: 0 %}
            {% for i in (1..5) %}
              {% if i <= r2 %}★{% else %}☆{% endif %}
            {% endfor %}
          </div>
          {% if section.settings.review_2_title != blank %}
            <h4 class="testimonial-title">{{ section.settings.review_2_title }}</h4>
          {% endif %}
          <blockquote class="testimonial-quote">"{{ section.settings.review_2_text }}"</blockquote>
          <div class="testimonial-author">
            <div class="testimonial-avatar">{{ section.settings.review_2_author | slice: 0 | upcase }}</div>
            <div class="testimonial-meta">
              <strong class="testimonial-name">{{ section.settings.review_2_author }}</strong>
              {% if section.settings.review_2_subtitle != blank %}
                <span class="testimonial-role">{{ section.settings.review_2_subtitle }}</span>
              {% endif %}
            </div>
          </div>
        </div>
      {% endif %}

      {% if section.settings.review_3_text != blank %}
        <div class="testimonial-card">
          <div class="testimonial-stars">
            {% assign r3 = section.settings.review_3_rating | plus: 0 %}
            {% for i in (1..5) %}
              {% if i <= r3 %}★{% else %}☆{% endif %}
            {% endfor %}
          </div>
          {% if section.settings.review_3_title != blank %}
            <h4 class="testimonial-title">{{ section.settings.review_3_title }}</h4>
          {% endif %}
          <blockquote class="testimonial-quote">"{{ section.settings.review_3_text }}"</blockquote>
          <div class="testimonial-author">
            <div class="testimonial-avatar">{{ section.settings.review_3_author | slice: 0 | upcase }}</div>
            <div class="testimonial-meta">
              <strong class="testimonial-name">{{ section.settings.review_3_author }}</strong>
              {% if section.settings.review_3_subtitle != blank %}
                <span class="testimonial-role">{{ section.settings.review_3_subtitle }}</span>
              {% endif %}
            </div>
          </div>
        </div>
      {% endif %}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Testimonials",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "${escJson(heading)}"
    },
    {
      "type": "text",
      "id": "subheading",
      "label": "Subheading",
      "default": "${escJson(subheading)}"
    },
    {
      "type": "header",
      "content": "Review 1"
    },
    { "type": "text", "id": "review_1_author", "label": "Author", "default": "${escJson(r1_author)}" },
    { "type": "text", "id": "review_1_subtitle", "label": "Subtitle", "default": "${escJson(r1_subtitle)}" },
    { "type": "text", "id": "review_1_title", "label": "Title", "default": "${escJson(r1_title)}" },
    { "type": "textarea", "id": "review_1_text", "label": "Review Text", "default": "${escJson(r1_text)}" },
    { "type": "select", "id": "review_1_rating", "label": "Rating (1-5)", "default": "${r1_rating}", "options": [
        { "value": "1", "label": "1 Star" },
        { "value": "2", "label": "2 Stars" },
        { "value": "3", "label": "3 Stars" },
        { "value": "4", "label": "4 Stars" },
        { "value": "5", "label": "5 Stars" }
      ]
    },
    {
      "type": "header",
      "content": "Review 2"
    },
    { "type": "text", "id": "review_2_author", "label": "Author", "default": "${escJson(r2_author)}" },
    { "type": "text", "id": "review_2_subtitle", "label": "Subtitle", "default": "${escJson(r2_subtitle)}" },
    { "type": "text", "id": "review_2_title", "label": "Title", "default": "${escJson(r2_title)}" },
    { "type": "textarea", "id": "review_2_text", "label": "Review Text", "default": "${escJson(r2_text)}" },
    { "type": "select", "id": "review_2_rating", "label": "Rating (1-5)", "default": "${r2_rating}", "options": [
        { "value": "1", "label": "1 Star" },
        { "value": "2", "label": "2 Stars" },
        { "value": "3", "label": "3 Stars" },
        { "value": "4", "label": "4 Stars" },
        { "value": "5", "label": "5 Stars" }
      ]
    },
    {
      "type": "header",
      "content": "Review 3"
    },
    { "type": "text", "id": "review_3_author", "label": "Author", "default": "${escJson(r3_author)}" },
    { "type": "text", "id": "review_3_subtitle", "label": "Subtitle", "default": "${escJson(r3_subtitle)}" },
    { "type": "text", "id": "review_3_title", "label": "Title", "default": "${escJson(r3_title)}" },
    { "type": "textarea", "id": "review_3_text", "label": "Review Text", "default": "${escJson(r3_text)}" },
    { "type": "select", "id": "review_3_rating", "label": "Rating (1-5)", "default": "${r3_rating}", "options": [
        { "value": "1", "label": "1 Star" },
        { "value": "2", "label": "2 Stars" },
        { "value": "3", "label": "3 Stars" },
        { "value": "4", "label": "4 Stars" },
        { "value": "5", "label": "5 Stars" }
      ]
    }
  ],
  "presets": [
    {
      "name": "Testimonials"
    }
  ]
}
{% endschema %}`;
}

// ── Section: Pricing Table ────────────────────────────────────

function generatePricingTableSection(gen: WebsiteGeneration): string {
  const { pricing } = gen;

  const planCards = pricing.plans
    .map(
      (plan) => `
      <div class="pricing-card${plan.isPopular ? ' pricing-card--popular' : ''}">
        ${plan.isPopular ? '<span class="pricing-badge">Most Popular</span>' : ''}
        <h3 class="pricing-name">${esc(plan.name)}</h3>
        <div class="pricing-price">
          <span class="pricing-amount">${esc(plan.price)}</span>
          <span class="pricing-period">/${esc(plan.period)}</span>
        </div>
        <p class="pricing-description">${esc(plan.description)}</p>
        <ul class="pricing-features">
          ${plan.features.map((f) => `<li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> ${esc(f)}</li>`).join('\n          ')}
        </ul>
        <a href="#" class="btn ${plan.isPopular ? 'btn-primary' : 'btn-secondary'}">${esc(plan.cta)}</a>
      </div>`
    )
    .join('\n');

  return `<section class="pricing-section" data-section-id="{{ section.id }}" data-section-type="pricing-table">
  <div class="container">
    <div class="section-header">
      <h2 class="section-title">{{ section.settings.heading }}</h2>
      {% if section.settings.subheading != blank %}
        <p class="section-subtitle">{{ section.settings.subheading }}</p>
      {% endif %}
    </div>

    <div class="pricing-grid">
${planCards}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Pricing table",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "${escJson(pricing.title)}"
    },
    {
      "type": "text",
      "id": "subheading",
      "label": "Subheading",
      "default": "${escJson(pricing.subtitle)}"
    }
  ],
  "presets": [
    {
      "name": "Pricing table"
    }
  ]
}
{% endschema %}`;
}

// ── Section: Newsletter ───────────────────────────────────────

function generateNewsletterSection(
  _gen: WebsiteGeneration,
  input: WebsiteBuilderInput
): string {
  return `<section class="newsletter-section" data-section-id="{{ section.id }}" data-section-type="newsletter">
  <div class="container">
    <div class="newsletter-inner">
      <div class="newsletter-content">
        <h2 class="newsletter-heading">{{ section.settings.heading }}</h2>
        <p class="newsletter-text">{{ section.settings.text }}</p>
      </div>
      {% form 'customer' %}
        {{ form.errors | default_errors }}
        {% if form.posted_successfully? %}
          <p class="form-success">{{ 'newsletter.success' | t }}</p>
        {% else %}
          <div class="newsletter-form">
            <input type="hidden" name="contact[tags]" value="newsletter">
            <input
              type="email"
              name="contact[email]"
              placeholder="{{ 'newsletter.email_placeholder' | t }}"
              required
              aria-label="{{ 'newsletter.email_placeholder' | t }}"
              class="newsletter-input"
            >
            <button type="submit" class="btn btn-primary newsletter-btn">
              {{ section.settings.button_label }}
            </button>
          </div>
        {% endif %}
      {% endform %}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Newsletter",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Stay in the loop"
    },
    {
      "type": "textarea",
      "id": "text",
      "label": "Description",
      "default": "Subscribe to our newsletter for exclusive deals, new arrivals, and insider updates from ${escJson(input.businessName)}."
    },
    {
      "type": "text",
      "id": "button_label",
      "label": "Button label",
      "default": "Subscribe"
    }
  ],
  "presets": [
    {
      "name": "Newsletter"
    }
  ]
}
{% endschema %}`;
}

// ── Section: Main Product ─────────────────────────────────────

function generateMainProductSection(): string {
  return `<section class="product-page" data-section-id="{{ section.id }}" data-section-type="main-product">
  <div class="container">
    <div class="product-layout">
      <div class="product-gallery">
        {% for image in product.images %}
          <div class="product-gallery__item{% if forloop.first %} product-gallery__item--active{% endif %}" data-gallery-item>
            <img
              src="{{ image | image_url: width: 800 }}"
              alt="{{ image.alt | escape }}"
              width="{{ image.width }}"
              height="{{ image.height }}"
              loading="{% if forloop.first %}eager{% else %}lazy{% endif %}"
            >
          </div>
        {% else %}
          <div class="product-gallery__item product-gallery__item--active">
            {{ 'product-1' | placeholder_svg_tag: 'placeholder-svg' }}
          </div>
        {% endfor %}

        {% if product.images.size > 1 %}
          <div class="product-thumbnails">
            {% for image in product.images %}
              <button class="product-thumbnail{% if forloop.first %} product-thumbnail--active{% endif %}" data-gallery-thumb="{{ forloop.index0 }}">
                <img
                  src="{{ image | image_url: width: 100 }}"
                  alt="{{ image.alt | escape }}"
                  width="100"
                  height="100"
                  loading="lazy"
                >
              </button>
            {% endfor %}
          </div>
        {% endif %}
      </div>

      <div class="product-info">
        <h1 class="product-title">{{ product.title }}</h1>

        <div class="product-price">
          {% if product.compare_at_price > product.price %}
            <span class="price-compare">{{ product.compare_at_price | money }}</span>
          {% endif %}
          <span class="price-current{% if product.compare_at_price > product.price %} price-sale{% endif %}">
            {{ product.price | money }}
          </span>
        </div>

        {% form 'product', product %}
          <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">

          {% unless product.has_only_default_variant %}
            {% for option in product.options_with_values %}
              <div class="product-option">
                <label for="Option-{{ section.id }}-{{ forloop.index0 }}">{{ option.name }}</label>
                <select id="Option-{{ section.id }}-{{ forloop.index0 }}" name="options[{{ option.name }}]">
                  {% for value in option.values %}
                    <option value="{{ value }}" {% if option.selected_value == value %}selected{% endif %}>
                      {{ value }}
                    </option>
                  {% endfor %}
                </select>
              </div>
            {% endfor %}
          {% endunless %}

          <div class="product-quantity">
            <label for="Quantity-{{ section.id }}">{{ 'product.quantity' | t }}</label>
            <div class="quantity-selector">
              <button type="button" class="quantity-btn" data-quantity-minus aria-label="Decrease quantity">−</button>
              <input type="number" id="Quantity-{{ section.id }}" name="quantity" value="1" min="1" class="quantity-input">
              <button type="button" class="quantity-btn" data-quantity-plus aria-label="Increase quantity">+</button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-add-to-cart"{% unless product.available %} disabled{% endunless %}>
            {% if product.available %}
              {{ 'product.add_to_cart' | t }}
            {% else %}
              {{ 'product.sold_out' | t }}
            {% endif %}
          </button>
        {% endform %}

        {% if product.description != blank %}
          <div class="product-description rte">
            {{ product.description }}
          </div>
        {% endif %}
      </div>
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Product page",
  "settings": [
    {
      "type": "checkbox",
      "id": "show_vendor",
      "label": "Show vendor",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "show_share",
      "label": "Show share button",
      "default": true
    }
  ]
}
{% endschema %}`;
}

// ── Section: Main Collection ──────────────────────────────────

function generateMainCollectionSection(): string {
  return `<section class="collection-page" data-section-id="{{ section.id }}" data-section-type="main-collection">
  <div class="container">
    <div class="collection-header">
      <h1 class="collection-title">{{ collection.title }}</h1>
      {% if collection.description != blank %}
        <div class="collection-description rte">{{ collection.description }}</div>
      {% endif %}
    </div>

    {% paginate collection.products by section.settings.products_per_page %}
      <div class="product-grid">
        {% for product in collection.products %}
          {% render 'product-card', product: product %}
        {% else %}
          <p class="collection-empty">{{ 'collection.empty' | t }}</p>
        {% endfor %}
      </div>

      {% if paginate.pages > 1 %}
        <nav class="pagination" aria-label="Pagination">
          {% if paginate.previous %}
            <a href="{{ paginate.previous.url }}" class="pagination-prev" aria-label="Previous page">&laquo; {{ 'general.pagination.previous' | t }}</a>
          {% endif %}

          {% for part in paginate.parts %}
            {% if part.is_link %}
              <a href="{{ part.url }}" class="pagination-link" aria-label="Page {{ part.title }}">{{ part.title }}</a>
            {% else %}
              {% if part.title == paginate.current_page %}
                <span class="pagination-link pagination-link--current" aria-current="page">{{ part.title }}</span>
              {% else %}
                <span class="pagination-link pagination-link--gap">{{ part.title }}</span>
              {% endif %}
            {% endif %}
          {% endfor %}

          {% if paginate.next %}
            <a href="{{ paginate.next.url }}" class="pagination-next" aria-label="Next page">{{ 'general.pagination.next' | t }} &raquo;</a>
          {% endif %}
        </nav>
      {% endif %}
    {% endpaginate %}
  </div>
</section>

{% schema %}
{
  "name": "Collection page",
  "settings": [
    {
      "type": "range",
      "id": "products_per_page",
      "label": "Products per page",
      "min": 4,
      "max": 24,
      "step": 4,
      "default": 12
    }
  ]
}
{% endschema %}`;
}

// ── Section: Main Blog ────────────────────────────────────────

function generateMainBlogSection(): string {
  return `<section class="blog-page" data-section-id="{{ section.id }}" data-section-type="main-blog">
  <div class="container">
    <h1 class="blog-title">{{ blog.title }}</h1>

    {% paginate blog.articles by 6 %}
      <div class="blog-grid">
        {% for article in blog.articles %}
          <article class="blog-card">
            {% if article.image %}
              <a href="{{ article.url }}" class="blog-card__image-wrapper">
                <img
                  src="{{ article.image | image_url: width: 600 }}"
                  alt="{{ article.image.alt | escape }}"
                  width="600"
                  height="400"
                  loading="lazy"
                >
              </a>
            {% endif %}
            <div class="blog-card__content">
              <time class="blog-card__date" datetime="{{ article.published_at | date: '%Y-%m-%d' }}">
                {{ article.published_at | date: '%B %d, %Y' }}
              </time>
              <h2 class="blog-card__title">
                <a href="{{ article.url }}">{{ article.title }}</a>
              </h2>
              <p class="blog-card__excerpt">{{ article.excerpt_or_content | strip_html | truncatewords: 30 }}</p>
              <a href="{{ article.url }}" class="blog-card__read-more">{{ 'blog.read_more' | t }} &rarr;</a>
            </div>
          </article>
        {% endfor %}
      </div>

      {% if paginate.pages > 1 %}
        <nav class="pagination" aria-label="Pagination">
          {% if paginate.previous %}
            <a href="{{ paginate.previous.url }}" class="pagination-prev">&laquo; {{ 'general.pagination.previous' | t }}</a>
          {% endif %}
          {% for part in paginate.parts %}
            {% if part.is_link %}
              <a href="{{ part.url }}" class="pagination-link">{{ part.title }}</a>
            {% else %}
              <span class="pagination-link pagination-link--current" aria-current="page">{{ part.title }}</span>
            {% endif %}
          {% endfor %}
          {% if paginate.next %}
            <a href="{{ paginate.next.url }}" class="pagination-next">{{ 'general.pagination.next' | t }} &raquo;</a>
          {% endif %}
        </nav>
      {% endif %}
    {% endpaginate %}
  </div>
</section>

{% schema %}
{
  "name": "Blog page",
  "settings": []
}
{% endschema %}`;
}

// ── Section: Main Article ─────────────────────────────────────

function generateMainArticleSection(): string {
  return `<section class="article-page" data-section-id="{{ section.id }}" data-section-type="main-article">
  <div class="container article-container">
    <article class="article">
      <header class="article-header">
        <h1 class="article-title">{{ article.title }}</h1>
        <div class="article-meta">
          <time datetime="{{ article.published_at | date: '%Y-%m-%d' }}">
            {{ article.published_at | date: '%B %d, %Y' }}
          </time>
          {% if article.author %}
            <span class="article-author">{{ 'blog.by_author' | t: author: article.author }}</span>
          {% endif %}
        </div>
      </header>

      {% if article.image %}
        <div class="article-image">
          <img
            src="{{ article.image | image_url: width: 1200 }}"
            alt="{{ article.image.alt | escape }}"
            width="1200"
            loading="eager"
          >
        </div>
      {% endif %}

      <div class="article-content rte">
        {{ article.content }}
      </div>

      {% if blog.comments_enabled? %}
        <div class="article-comments">
          <h3>{{ 'blog.comments' | t }} ({{ article.comments_count }})</h3>

          {% for comment in article.comments %}
            <div class="comment">
              <p class="comment-author">{{ comment.author }}</p>
              <p class="comment-body">{{ comment.content }}</p>
              <time class="comment-date">{{ comment.created_at | date: '%B %d, %Y' }}</time>
            </div>
          {% endfor %}

          {% form 'new_comment', article %}
            {{ form.errors | default_errors }}

            <div class="form-field">
              <label for="CommentAuthor">{{ 'blog.comment_form.name' | t }}</label>
              <input type="text" id="CommentAuthor" name="comment[author]" required>
            </div>
            <div class="form-field">
              <label for="CommentEmail">{{ 'blog.comment_form.email' | t }}</label>
              <input type="email" id="CommentEmail" name="comment[email]" required>
            </div>
            <div class="form-field">
              <label for="CommentBody">{{ 'blog.comment_form.message' | t }}</label>
              <textarea id="CommentBody" name="comment[body]" rows="4" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">{{ 'blog.comment_form.submit' | t }}</button>
          {% endform %}
        </div>
      {% endif %}
    </article>

    <a href="{{ blog.url }}" class="btn btn-secondary">&larr; {{ 'blog.back_to_blog' | t }}</a>
  </div>
</section>

{% schema %}
{
  "name": "Article page",
  "settings": []
}
{% endschema %}`;
}

// ── Section: Main Cart ────────────────────────────────────────

function generateMainCartSection(): string {
  return `<section class="cart-page" data-section-id="{{ section.id }}" data-section-type="main-cart">
  <div class="container">
    <h1 class="cart-title">{{ 'cart.title' | t }}</h1>

    {% if cart.item_count > 0 %}
      <form action="/cart" method="post" novalidate>
        <table class="cart-table">
          <thead>
            <tr>
              <th scope="col">{{ 'cart.product' | t }}</th>
              <th scope="col">{{ 'cart.price' | t }}</th>
              <th scope="col">{{ 'cart.quantity' | t }}</th>
              <th scope="col">{{ 'cart.total' | t }}</th>
              <th scope="col"><span class="sr-only">{{ 'cart.remove' | t }}</span></th>
            </tr>
          </thead>
          <tbody>
            {% for item in cart.items %}
              <tr class="cart-item" data-cart-item>
                <td class="cart-item__product">
                  <a href="{{ item.url }}" class="cart-item__image">
                    {% if item.image %}
                      <img src="{{ item.image | image_url: width: 120 }}" alt="{{ item.title | escape }}" width="120" loading="lazy">
                    {% endif %}
                  </a>
                  <div class="cart-item__details">
                    <a href="{{ item.url }}" class="cart-item__title">{{ item.product.title }}</a>
                    {% unless item.product.has_only_default_variant %}
                      <span class="cart-item__variant">{{ item.variant.title }}</span>
                    {% endunless %}
                  </div>
                </td>
                <td class="cart-item__price">{{ item.original_price | money }}</td>
                <td class="cart-item__quantity">
                  <div class="quantity-selector">
                    <button type="button" class="quantity-btn" data-quantity-minus aria-label="Decrease quantity">−</button>
                    <input
                      type="number"
                      name="updates[]"
                      value="{{ item.quantity }}"
                      min="0"
                      class="quantity-input"
                      data-line="{{ forloop.index }}"
                      aria-label="Quantity for {{ item.title }}"
                    >
                    <button type="button" class="quantity-btn" data-quantity-plus aria-label="Increase quantity">+</button>
                  </div>
                </td>
                <td class="cart-item__total">{{ item.final_line_price | money }}</td>
                <td class="cart-item__remove">
                  <a href="/cart/change?line={{ forloop.index }}&quantity=0" class="cart-remove" aria-label="{{ 'cart.remove' | t }}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </a>
                </td>
              </tr>
            {% endfor %}
          </tbody>
        </table>

        <div class="cart-footer">
          <div class="cart-note">
            <label for="CartNote">{{ 'cart.note' | t }}</label>
            <textarea id="CartNote" name="note">{{ cart.note }}</textarea>
          </div>

          <div class="cart-summary">
            <div class="cart-subtotal">
              <span>{{ 'cart.subtotal' | t }}</span>
              <span class="cart-subtotal-price">{{ cart.total_price | money }}</span>
            </div>
            <p class="cart-taxes-note">{{ 'cart.taxes_note' | t }}</p>
            <button type="submit" name="checkout" class="btn btn-primary btn-checkout">
              {{ 'cart.checkout' | t }}
            </button>
          </div>
        </div>
      </form>
    {% else %}
      <div class="cart-empty">
        <p>{{ 'cart.empty' | t }}</p>
        <a href="/collections/all" class="btn btn-primary">{{ 'cart.continue_shopping' | t }}</a>
      </div>
    {% endif %}
  </div>
</section>

{% schema %}
{
  "name": "Cart page",
  "settings": []
}
{% endschema %}`;
}

// ── Section: 404 ──────────────────────────────────────────────

function generate404Section(): string {
  return `<section class="page-404" data-section-id="{{ section.id }}" data-section-type="404">
  <div class="container page-404-inner">
    <h1 class="page-404__title">{{ section.settings.title }}</h1>
    <p class="page-404__text">{{ section.settings.text }}</p>
    <a href="/" class="btn btn-primary">{{ section.settings.button_label }}</a>
  </div>
</section>

{% schema %}
{
  "name": "404 page",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Title",
      "default": "Page not found"
    },
    {
      "type": "textarea",
      "id": "text",
      "label": "Text",
      "default": "The page you were looking for does not exist. It may have been moved or deleted."
    },
    {
      "type": "text",
      "id": "button_label",
      "label": "Button label",
      "default": "Back to homepage"
    }
  ]
}
{% endschema %}`;
}

// ── Section: Search ───────────────────────────────────────────

function generateSearchSection(): string {
  return `<section class="search-page" data-section-id="{{ section.id }}" data-section-type="search">
  <div class="container">
    <h1 class="search-title">{{ 'search.title' | t }}</h1>

    <form action="/search" method="get" class="search-form" role="search">
      <div class="search-input-wrapper">
        <input
          type="search"
          name="q"
          value="{{ search.terms | escape }}"
          placeholder="{{ 'search.placeholder' | t }}"
          aria-label="{{ 'search.title' | t }}"
          class="search-input"
        >
        <button type="submit" class="btn btn-primary search-submit">
          {{ 'search.submit' | t }}
        </button>
      </div>
    </form>

    {% if search.performed %}
      {% if search.results_count > 0 %}
        <p class="search-count">{{ 'search.results_count' | t: count: search.results_count, terms: search.terms }}</p>

        <div class="search-results">
          {% for result in search.results %}
            <div class="search-result">
              {% if result.image %}
                <a href="{{ result.url }}" class="search-result__image">
                  <img src="{{ result.image | image_url: width: 200 }}" alt="{{ result.title | escape }}" width="200" loading="lazy">
                </a>
              {% endif %}
              <div class="search-result__content">
                <h2 class="search-result__title">
                  <a href="{{ result.url }}">{{ result.title }}</a>
                </h2>
                <p class="search-result__excerpt">{{ result.content | strip_html | truncatewords: 30 }}</p>
                {% if result.price %}
                  <span class="search-result__price">{{ result.price | money }}</span>
                {% endif %}
              </div>
            </div>
          {% endfor %}
        </div>
      {% else %}
        <p class="search-empty">{{ 'search.no_results' | t: terms: search.terms }}</p>
      {% endif %}
    {% endif %}
  </div>
</section>

{% schema %}
{
  "name": "Search results",
  "settings": []
}
{% endschema %}`;
}

// ── Snippets ──────────────────────────────────────────────────

function generateSnippets(
  _gen: WebsiteGeneration,
  _input: WebsiteBuilderInput
): ShopifyThemeFile[] {
  return [
    file('snippets/product-card.liquid', generateProductCardSnippet()),
    file('snippets/social-icons.liquid', generateSocialIconsSnippet()),
  ];
}

function generateProductCardSnippet(): string {
  return `{%- comment -%}
  Renders a product card.
  Accepts:
  - product: {Object} Product Liquid object
  Usage:
  {%- render 'product-card', product: product -%}
{%- endcomment -%}

<div class="product-card">
  <a href="{{ product.url }}" class="product-card__link" aria-label="{{ product.title }}">
    <div class="product-card__image-wrapper">
      {% if product.featured_image %}
        <img
          src="{{ product.featured_image | image_url: width: 480 }}"
          alt="{{ product.featured_image.alt | default: product.title | escape }}"
          width="480"
          height="480"
          loading="lazy"
          class="product-card__image"
        >
        {% if product.images[1] %}
          <img
            src="{{ product.images[1] | image_url: width: 480 }}"
            alt="{{ product.images[1].alt | default: product.title | escape }}"
            width="480"
            height="480"
            loading="lazy"
            class="product-card__image product-card__image--hover"
          >
        {% endif %}
      {% else %}
        {{ 'product-1' | placeholder_svg_tag: 'placeholder-svg' }}
      {% endif %}

      {% if product.compare_at_price > product.price %}
        <span class="product-card__badge product-card__badge--sale">{{ 'product.on_sale' | t }}</span>
      {% endif %}

      {% unless product.available %}
        <span class="product-card__badge product-card__badge--soldout">{{ 'product.sold_out' | t }}</span>
      {% endunless %}
    </div>

    <div class="product-card__info">
      <h3 class="product-card__title">{{ product.title }}</h3>
      <div class="product-card__price">
        {% if product.compare_at_price > product.price %}
          <span class="price-compare">{{ product.compare_at_price | money }}</span>
        {% endif %}
        <span class="price-current{% if product.compare_at_price > product.price %} price-sale{% endif %}">
          {{ product.price | money }}
        </span>
      </div>
    </div>
  </a>
</div>`;
}

function generateSocialIconsSnippet(): string {
  return `{%- comment -%}
  Renders social media icon links.
  Accepts:
  - links: {Object} Section settings containing social_* URLs
  Usage:
  {%- render 'social-icons', links: section.settings -%}
{%- endcomment -%}

<div class="social-icons">
  {% if links.social_facebook != blank %}
    <a href="{{ links.social_facebook }}" class="social-icon" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
    </a>
  {% endif %}

  {% if links.social_instagram != blank %}
    <a href="{{ links.social_instagram }}" class="social-icon" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
    </a>
  {% endif %}

  {% if links.social_twitter != blank %}
    <a href="{{ links.social_twitter }}" class="social-icon" aria-label="X (Twitter)" target="_blank" rel="noopener noreferrer">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    </a>
  {% endif %}

  {% if links.social_youtube != blank %}
    <a href="{{ links.social_youtube }}" class="social-icon" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
    </a>
  {% endif %}

  {% if links.social_linkedin != blank %}
    <a href="{{ links.social_linkedin }}" class="social-icon" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
    </a>
  {% endif %}

  {% if links.social_tiktok != blank %}
    <a href="{{ links.social_tiktok }}" class="social-icon" aria-label="TikTok" target="_blank" rel="noopener noreferrer">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.7a8.16 8.16 0 0 0 4.76 1.51v-3.4a4.85 4.85 0 0 1-1-.12z"/></svg>
    </a>
  {% endif %}
</div>`;
}

// ── Assets ────────────────────────────────────────────────────

function generateAssets(
  gen: WebsiteGeneration,
  input: WebsiteBuilderInput
): ShopifyThemeFile[] {
  const resolvedStyle = gen.ecommerce?.preferredStyle ?? input.preferredStyle;
  const combinedCSS = `${generateBaseCSS(input, resolvedStyle)}\n${generateSectionsCSS(input)}\n${generateEcommerceCSS()}`;
  return [
    file('assets/theme.css', combinedCSS),
    file('assets/theme.js', generateGlobalJS()),
  ];
}

// ── Asset: base.css ───────────────────────────────────────────

function generateBaseCSS(input: WebsiteBuilderInput, resolvedStyle: PreferredStyle): string {
  return `/* ============================================================
   RootX Theme — Base Stylesheet
   Generated for: ${input.businessName}
   Style: ${input.preferredStyle}
   ============================================================ */

/* ── Reset / Normalize ─────────────────────────────────────── */

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 16px;
  line-height: 1.6;
  scroll-behavior: smooth;
  text-size-adjust: 100%;
}

body {
  font-family: var(--font-body);
  color: var(--text-primary);
  background-color: var(--bg-primary);
  min-height: 100vh;
  overflow-x: hidden;
}

img,
picture,
video,
canvas,
svg {
  display: block;
  max-width: 100%;
  height: auto;
}

input,
button,
textarea,
select {
  font: inherit;
  color: inherit;
}

button {
  cursor: pointer;
  border: none;
  background: none;
}

a {
  color: inherit;
  text-decoration: none;
}

ul,
ol {
  list-style: none;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: break-word;
}

p {
  overflow-wrap: break-word;
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

/* ── Design Tokens ─────────────────────────────────────────── */

:root {
  /* Colors — set in theme.liquid, repeated here as fallback */
  --primary: ${input.primaryColor};
  --secondary: ${input.secondaryColor};
  --primary-hover: color-mix(in srgb, var(--primary), #000 15%);
  --secondary-hover: color-mix(in srgb, var(--secondary), #000 15%);

  --text-primary: #1a1a1a;
  --text-secondary: #555;
  --text-muted: #888;

  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #f0f0f0;

  --border-color: #e5e5e5;
  --border-radius: 8px;
  --border-radius-lg: 16px;

  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.12);

  --transition: 0.25s ease;
  --transition-slow: 0.4s ease;

  --container-max: 1280px;
  --container-padding: 1.5rem;

  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 2rem;
  --space-xl: 3rem;
  --space-2xl: 5rem;
  --space-3xl: 8rem;
}

/* ── Typography ────────────────────────────────────────────── */

h1 { font-size: clamp(2rem, 5vw, 3.5rem); }
h2 { font-size: clamp(1.5rem, 4vw, 2.5rem); }
h3 { font-size: clamp(1.25rem, 3vw, 1.75rem); }
h4 { font-size: 1.25rem; }
h5 { font-size: 1.1rem; }
h6 { font-size: 1rem; }

.rte h1, .rte h2, .rte h3,
.rte h4, .rte h5, .rte h6 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

.rte p { margin-bottom: 1em; }

.rte ul, .rte ol {
  margin-bottom: 1em;
  padding-left: 1.5em;
}

.rte ul { list-style: disc; }
.rte ol { list-style: decimal; }

.rte a {
  color: var(--primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.rte a:hover { color: var(--primary-hover); }

.rte img {
  margin: 1.5em 0;
  border-radius: var(--border-radius);
}

.rte blockquote {
  border-left: 4px solid var(--primary);
  padding: 1em 1.5em;
  margin: 1.5em 0;
  font-style: italic;
  background: var(--bg-secondary);
  border-radius: 0 var(--border-radius) var(--border-radius) 0;
}

/* ── Layout / Container ────────────────────────────────────── */

.container {
  width: 100%;
  max-width: var(--container-max);
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--container-padding);
  padding-right: var(--container-padding);
}

/* ── Buttons ───────────────────────────────────────────────── */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 2rem;
  font-family: var(--font-heading);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  border: 2px solid transparent;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all var(--transition);
  text-decoration: none;
  white-space: nowrap;
  line-height: 1.2;
}

.btn:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: 2px;
}

.btn-primary {
  background-color: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.btn-primary:hover {
  background-color: var(--primary-hover);
  border-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background-color: transparent;
  color: var(--primary);
  border-color: var(--primary);
}

.btn-secondary:hover {
  background-color: var(--primary);
  color: #fff;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn:disabled,
.btn[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* ── Forms ─────────────────────────────────────────────────── */

.form-field {
  margin-bottom: var(--space-md);
}

.form-field label {
  display: block;
  margin-bottom: var(--space-xs);
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.form-field input,
.form-field textarea,
.form-field select {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 1rem;
  transition: border-color var(--transition), box-shadow var(--transition);
}

.form-field input:focus,
.form-field textarea:focus,
.form-field select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary), transparent 80%);
}

.form-field input::placeholder,
.form-field textarea::placeholder {
  color: var(--text-muted);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.form-success {
  padding: 1rem;
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  border-radius: var(--border-radius);
  margin-bottom: var(--space-md);
}

/* ── Cards ─────────────────────────────────────────────────── */

.card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: transform var(--transition), box-shadow var(--transition);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* ── Product Grid ──────────────────────────────────────────── */

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--space-lg);
}

/* ── Product Card ──────────────────────────────────────────── */

.product-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  transition: transform var(--transition), box-shadow var(--transition);
  position: relative;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.product-card__link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.product-card__image-wrapper {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: var(--bg-secondary);
}

.product-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity var(--transition-slow);
}

.product-card__image--hover {
  position: absolute;
  inset: 0;
  opacity: 0;
}

.product-card:hover .product-card__image--hover {
  opacity: 1;
}

.product-card__badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 999px;
  z-index: 1;
}

.product-card__badge--sale {
  background: #ef4444;
  color: #fff;
}

.product-card__badge--soldout {
  background: var(--text-secondary);
  color: #fff;
}

.product-card__info {
  padding: 1rem;
}

.product-card__title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  line-height: 1.4;
}

.product-card__price {
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.price-compare {
  text-decoration: line-through;
  color: var(--text-muted);
  margin-right: 0.5rem;
}

.price-sale {
  color: #ef4444;
  font-weight: 700;
}

.price-current {
  font-weight: 600;
}

/* ── Placeholder SVG ───────────────────────────────────────── */

.placeholder-svg {
  width: 100%;
  height: 100%;
  fill: var(--bg-tertiary);
}

/* ── Section Shared ────────────────────────────────────────── */

.section-header {
  text-align: center;
  max-width: 680px;
  margin: 0 auto var(--space-xl);
}

.section-title {
  margin-bottom: var(--space-sm);
}

.section-subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.section-footer {
  text-align: center;
  margin-top: var(--space-xl);
}

/* ── Skip to content ───────────────────────────────────────── */

.skip-to-content {
  position: absolute;
  top: -100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: #fff;
  border-radius: var(--border-radius);
  z-index: 9999;
  transition: top var(--transition);
}

.skip-to-content:focus {
  top: 1rem;
}

/* ── Pagination ────────────────────────────────────────────── */

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  margin-top: var(--space-xl);
  flex-wrap: wrap;
}

.pagination-link,
.pagination-prev,
.pagination-next {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  height: 2.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  transition: all var(--transition);
}

.pagination-link:hover,
.pagination-prev:hover,
.pagination-next:hover {
  background: var(--bg-secondary);
}

.pagination-link--current {
  background: var(--primary);
  color: #fff;
  font-weight: 700;
}

.pagination-link--current:hover {
  background: var(--primary-hover);
}

/* ── Quantity Selector ─────────────────────────────────────── */

.quantity-selector {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.quantity-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1.1rem;
  background: var(--bg-secondary);
  transition: background var(--transition);
}

.quantity-btn:hover {
  background: var(--bg-tertiary);
}

.quantity-input {
  width: 3rem;
  height: 2.5rem;
  text-align: center;
  border: none;
  border-left: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color);
  font-size: 1rem;
  -moz-appearance: textfield;
}

.quantity-input::-webkit-inner-spin-button,
.quantity-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* ── Social Icons ──────────────────────────────────────────── */

.social-icons {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.social-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  color: var(--text-secondary);
  transition: all var(--transition);
}

.social-icon:hover {
  color: var(--primary);
  transform: translateY(-2px);
}

${generateStyleOverrides(resolvedStyle)}

/* ── Responsive ────────────────────────────────────────────── */

@media (max-width: 768px) {
  :root {
    --container-padding: 1rem;
    --space-xl: 2rem;
    --space-2xl: 3rem;
    --space-3xl: 4rem;
  }

  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
  }
}

@media (max-width: 480px) {
  .product-grid {
    grid-template-columns: 1fr;
  }
}`;
}

// ── Style-specific CSS overrides ──────────────────────────────

function generateStyleOverrides(style: PreferredStyle): string {
  const overrides: Record<PreferredStyle, string> = {
    auto_best: `
/* ── Auto Best (Defaulting to Modern Commerce) ────────────────── */
.style-auto_best {
  --border-radius: 10px;
  --border-radius-lg: 16px;
}`,
    premium_minimal: `
/* ── Premium Minimal Overrides ────────────────────────────────── */
.style-premium_minimal {
  --border-radius: 4px;
  --border-radius-lg: 8px;
  --shadow-sm: none;
  --shadow-md: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-lg: 0 4px 12px rgba(0,0,0,0.05);
}
.style-premium_minimal .btn {
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.05em;
}
.style-premium_minimal .product-card {
  border: 1px solid var(--border-color);
  box-shadow: none;
}
.style-premium_minimal .product-card:hover {
  box-shadow: var(--shadow-md);
  transform: none;
}`,
    modern_commerce: `
/* ── Modern Commerce Overrides ────────────────────────────────── */
.style-modern_commerce {
  --border-radius: 8px;
  --border-radius-lg: 14px;
}
.style-modern_commerce .btn {
  border-radius: 8px;
  font-weight: 600;
}
.style-modern_commerce .product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}`,
    luxury_editorial: `
/* ── Luxury Editorial Overrides ───────────────────────────────── */
.style-luxury_editorial {
  --border-radius: 0px;
  --border-radius-lg: 0px;
  --shadow-sm: none;
  --shadow-md: none;
  --shadow-lg: none;
}
.style-luxury_editorial h1,
.style-luxury_editorial h2,
.style-luxury_editorial h3 {
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.style-luxury_editorial .btn {
  border-radius: 0;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-weight: 400;
  padding: 1rem 2.5rem;
}
.style-luxury_editorial .product-card {
  border-bottom: 1px solid var(--border-color);
}
.style-luxury_editorial .section-title::after {
  content: '';
  display: block;
  width: 50px;
  height: 1px;
  background: var(--primary);
  margin: 1.5rem auto 0;
}`,
    bold_conversion: `
/* ── Bold Conversion Overrides ────────────────────────────────── */
.style-bold_conversion {
  --border-radius: 12px;
  --border-radius-lg: 24px;
}
.style-bold_conversion h1,
.style-bold_conversion h2 {
  font-weight: 800;
  letter-spacing: -0.02em;
}
.style-bold_conversion .btn {
  border-radius: 999px;
  font-weight: 700;
  text-transform: uppercase;
  box-shadow: 0 4px 15px color-mix(in srgb, var(--primary), transparent 60%);
}
.style-bold_conversion .btn:hover {
  transform: scale(1.03);
  box-shadow: 0 6px 20px color-mix(in srgb, var(--primary), transparent 40%);
}`,
    tech_futuristic: `
/* ── Tech Futuristic Overrides ────────────────────────────────── */
.style-tech_futuristic {
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --bg-primary: #0b0f19;
  --bg-secondary: #161e2e;
  --bg-tertiary: #1f2a3c;
  --border-color: #334155;
  --border-radius: 6px;
  --border-radius-lg: 12px;
}
.style-tech_futuristic .form-field input,
.style-tech_futuristic .form-field textarea {
  background-color: var(--bg-secondary);
  border-color: var(--border-color);
  color: var(--text-primary);
}
.style-tech_futuristic .btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  box-shadow: 0 0 15px color-mix(in srgb, var(--primary), transparent 30%);
}
.style-tech_futuristic .product-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}`,
    soft_lifestyle: `
/* ── Soft Lifestyle Overrides ─────────────────────────────────── */
.style-soft_lifestyle {
  --border-radius: 16px;
  --border-radius-lg: 32px;
  --bg-secondary: #fdfaf7;
}
.style-soft_lifestyle .btn {
  border-radius: 20px;
  font-weight: 500;
}
.style-soft_lifestyle .product-card {
  border: 1px solid #f3eae1;
  box-shadow: 0 8px 24px rgba(180, 140, 100, 0.05);
}
.style-soft_lifestyle .product-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 12px 30px rgba(180, 140, 100, 0.1);
}`,
    minimal: `/* Legacy minimal fallback */`,
    luxury: `/* Legacy luxury fallback */`,
    startup: `/* Legacy startup fallback */`,
    dark: `/* Legacy dark fallback */`,
    modern: `/* Legacy modern fallback */`,
    corporate: `/* Legacy corporate fallback */`
  };

  return overrides[style] ?? overrides.modern_commerce;
}

function generateSectionsCSS(input: WebsiteBuilderInput): string {
  return `/* ============================================================
   RootX Theme — Section Styles
   Generated for: ${input.businessName}
   ============================================================ */

/* ── Header ────────────────────────────────────────────────── */
/* ── Section Rhythm ── */
.section {
  padding: clamp(3.5rem, 8vw, 6rem) 0;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-primary);
}
.section:nth-of-type(even) {
  background-color: var(--bg-secondary);
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: color-mix(in srgb, var(--bg-primary) 85%, transparent);
  border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all var(--transition);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
  gap: var(--space-lg);
}

.header-logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
}

.logo-text {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

/* Navigation */

.main-nav {
  display: flex;
}

.nav-list {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.nav-item {
  position: relative;
}

.nav-link {
  display: block;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color var(--transition);
  border-radius: var(--border-radius);
}

.nav-link:hover,
.nav-item--active .nav-link {
  color: var(--primary);
}

.nav-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 200px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  padding: 0.5rem 0;
  opacity: 0;
  visibility: hidden;
  transform: translateY(8px);
  transition: all var(--transition);
  z-index: 50;
}

.nav-item:hover .nav-dropdown {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.nav-dropdown-link {
  display: block;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  transition: all var(--transition);
}

.nav-dropdown-link:hover {
  background: var(--bg-secondary);
  color: var(--primary);
}

/* Header Actions */

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  color: var(--text-secondary);
  transition: all var(--transition);
}

.header-icon:hover {
  background: var(--bg-secondary);
  color: var(--primary);
}

.header-cart {
  position: relative;
}

.cart-count {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: 999px;
  line-height: 1;
  padding: 0 4px;
}

/* Mobile Menu */

.mobile-menu-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  width: 2.5rem;
  height: 2.5rem;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius);
}

.hamburger-line {
  display: block;
  width: 20px;
  height: 2px;
  background: var(--text-primary);
  transition: all var(--transition);
}

@media (max-width: 768px) {
  .mobile-menu-toggle {
    display: flex;
  }

  .main-nav {
    position: fixed;
    top: 70px;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-primary);
    padding: var(--space-lg);
    transform: translateX(-100%);
    transition: transform var(--transition);
    z-index: 90;
    overflow-y: auto;
  }

  .main-nav.is-open {
    transform: translateX(0);
  }

  .nav-list {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
  }

  .nav-link {
    padding: 1rem 0;
    font-size: 1.1rem;
    border-bottom: 1px solid var(--border-color);
  }

  .nav-dropdown {
    position: static;
    opacity: 1;
    visibility: visible;
    transform: none;
    box-shadow: none;
    border: none;
    padding: 0 0 0 1rem;
  }
}

/* ── Hero ──────────────────────────────────────────────────── */

.hero {
  position: relative;
  padding: var(--space-3xl) 0;
  overflow: hidden;
  min-height: 70vh;
  display: flex;
  align-items: center;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  opacity: 0.08;
  z-index: 0;
}

.hero-inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
  align-items: center;
}

.hero-content {
  max-width: 600px;
}

.hero-headline {
  margin-bottom: var(--space-md);
  color: var(--text-primary);
}

.hero-subheadline {
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin-bottom: var(--space-lg);
  line-height: 1.6;
}

.hero-cta {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.hero-media img {
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
}

@media (max-width: 768px) {
  .hero {
    min-height: auto;
    padding: var(--space-2xl) 0;
  }

  .hero-inner {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .hero-content {
    max-width: none;
  }

  .hero-cta {
    justify-content: center;
  }

  .hero-media {
    order: -1;
  }
}

/* ── Featured Collection ───────────────────────────────────── */

.featured-collection {
  padding: var(--space-2xl) 0;
}

/* ── Rich Text ─────────────────────────────────────────────── */

.rich-text {
  padding: var(--space-2xl) 0;
}

.rich-text-inner {
  max-width: 780px;
  margin: 0 auto;
  text-align: center;
}

.rich-text__heading {
  margin-bottom: var(--space-md);
}

.rich-text__content {
  color: var(--text-secondary);
  font-size: 1.05rem;
  line-height: 1.8;
  margin-bottom: var(--space-lg);
}

/* ── Contact Form ──────────────────────────────────────────── */

.contact-section {
  padding: var(--space-2xl) 0;
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--space-xl);
  align-items: start;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.contact-detail {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text-secondary);
}

.contact-detail a {
  color: var(--primary);
}

.contact-detail svg {
  flex-shrink: 0;
  color: var(--primary);
}

@media (max-width: 768px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }
}

/* ── FAQ ───────────────────────────────────────────────────── */

.faq-section {
  padding: var(--space-2xl) 0;
  background: var(--bg-secondary);
}

.faq-list {
  max-width: 780px;
  margin: 0 auto;
}

.faq-item {
  border-bottom: 1px solid var(--border-color);
}

.faq-item:first-child {
  border-top: 1px solid var(--border-color);
}

.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1.25rem 0;
  font-weight: 600;
  font-size: 1.05rem;
  text-align: left;
  color: var(--text-primary);
  cursor: pointer;
  transition: color var(--transition);
  gap: var(--space-md);
}

.faq-question:hover {
  color: var(--primary);
}

.faq-chevron {
  flex-shrink: 0;
  transition: transform var(--transition);
}

.faq-question[aria-expanded="true"] .faq-chevron {
  transform: rotate(180deg);
}

.faq-answer {
  overflow: hidden;
  transition: max-height var(--transition-slow);
}

.faq-answer p {
  padding-bottom: 1.25rem;
  color: var(--text-secondary);
  line-height: 1.7;
}

/* ── Testimonials ──────────────────────────────────────────── */

.testimonials-section {
  padding: var(--space-2xl) 0;
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-lg);
}

.testimonial-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 2rem;
  transition: transform var(--transition), box-shadow var(--transition);
}

.testimonial-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.testimonial-stars {
  font-size: 1.1rem;
  color: #f59e0b;
  margin-bottom: var(--space-md);
  letter-spacing: 2px;
}

.testimonial-quote {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: var(--space-lg);
  font-style: italic;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.testimonial-avatar {
  width: 48px;
  height: 48px;
  background: var(--primary);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  flex-shrink: 0;
}

.testimonial-name {
  display: block;
  font-size: 0.95rem;
}

.testimonial-role {
  display: block;
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* ── Pricing Table ─────────────────────────────────────────── */

.pricing-section {
  padding: var(--space-2xl) 0;
  background: var(--bg-secondary);
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-lg);
  align-items: start;
}

.pricing-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 2.5rem 2rem;
  text-align: center;
  position: relative;
  transition: transform var(--transition), box-shadow var(--transition);
}

.pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.pricing-card--popular {
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
  transform: scale(1.03);
}

.pricing-card--popular:hover {
  transform: scale(1.03) translateY(-4px);
}

.pricing-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--primary);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.3rem 1rem;
  border-radius: 999px;
  white-space: nowrap;
}

.pricing-name {
  font-size: 1.3rem;
  margin-bottom: var(--space-md);
}

.pricing-price {
  margin-bottom: var(--space-md);
}

.pricing-amount {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
}

.pricing-period {
  font-size: 1rem;
  color: var(--text-muted);
}

.pricing-description {
  color: var(--text-secondary);
  margin-bottom: var(--space-lg);
  font-size: 0.95rem;
}

.pricing-features {
  text-align: left;
  margin-bottom: var(--space-lg);
}

.pricing-features li {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 0.5rem 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.pricing-features svg {
  flex-shrink: 0;
  color: #10b981;
}

/* ── Newsletter ────────────────────────────────────────────── */

.newsletter-section {
  padding: var(--space-2xl) 0;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: #fff;
}

.newsletter-inner {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.newsletter-heading {
  color: #fff;
  margin-bottom: var(--space-sm);
}

.newsletter-text {
  opacity: 0.9;
  margin-bottom: var(--space-lg);
  font-size: 1.05rem;
}

.newsletter-form {
  display: flex;
  gap: var(--space-sm);
  max-width: 480px;
  margin: 0 auto;
}

.newsletter-input {
  flex: 1;
  padding: 0.8rem 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--border-radius);
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 1rem;
  backdrop-filter: blur(4px);
}

.newsletter-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.newsletter-input:focus {
  outline: none;
  border-color: #fff;
  background: rgba(255, 255, 255, 0.25);
}

.newsletter-btn {
  background: #fff;
  color: var(--primary);
  border: none;
  font-weight: 700;
  white-space: nowrap;
}

.newsletter-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
}

@media (max-width: 600px) {
  .newsletter-form {
    flex-direction: column;
  }
}

/* ── Product Page ──────────────────────────────────────────── */

.product-page {
  padding: var(--space-2xl) 0;
}

.product-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
  align-items: start;
}

.product-gallery__item {
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  background: var(--bg-secondary);
}

.product-gallery__item img {
  width: 100%;
  height: auto;
}

.product-thumbnails {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-md);
}

.product-thumbnail {
  width: 80px;
  height: 80px;
  border-radius: var(--border-radius);
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color var(--transition);
  padding: 0;
}

.product-thumbnail--active,
.product-thumbnail:hover {
  border-color: var(--primary);
}

.product-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-title {
  margin-bottom: var(--space-md);
}

.product-price {
  font-size: 1.5rem;
  margin-bottom: var(--space-lg);
}

.product-option {
  margin-bottom: var(--space-md);
}

.product-option label {
  display: block;
  font-weight: 600;
  margin-bottom: var(--space-xs);
  font-size: 0.9rem;
}

.product-option select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 1rem;
  background: var(--bg-primary);
}

.product-quantity {
  margin-bottom: var(--space-lg);
}

.product-quantity label {
  display: block;
  font-weight: 600;
  margin-bottom: var(--space-xs);
  font-size: 0.9rem;
}

.btn-add-to-cart {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  margin-bottom: var(--space-lg);
}

.product-description {
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border-color);
}

@media (max-width: 768px) {
  .product-layout {
    grid-template-columns: 1fr;
  }
}

/* ── Collection Page ───────────────────────────────────────── */

.collection-page {
  padding: var(--space-2xl) 0;
}

.collection-header {
  margin-bottom: var(--space-xl);
}

.collection-title {
  margin-bottom: var(--space-sm);
}

.collection-description {
  color: var(--text-secondary);
  max-width: 680px;
}

.collection-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--space-2xl);
  color: var(--text-muted);
}

/* ── Blog ──────────────────────────────────────────────────── */

.blog-page {
  padding: var(--space-2xl) 0;
}

.blog-title {
  margin-bottom: var(--space-xl);
}

.blog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-lg);
}

.blog-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-color);
  transition: transform var(--transition), box-shadow var(--transition);
}

.blog-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.blog-card__image-wrapper {
  display: block;
  aspect-ratio: 3 / 2;
  overflow: hidden;
}

.blog-card__image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.blog-card:hover .blog-card__image-wrapper img {
  transform: scale(1.05);
}

.blog-card__content {
  padding: 1.5rem;
}

.blog-card__date {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.blog-card__title {
  font-size: 1.2rem;
  margin: 0.5rem 0;
  line-height: 1.3;
}

.blog-card__title a {
  transition: color var(--transition);
}

.blog-card__title a:hover {
  color: var(--primary);
}

.blog-card__excerpt {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: var(--space-md);
}

.blog-card__read-more {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary);
  transition: color var(--transition);
}

.blog-card__read-more:hover {
  color: var(--primary-hover);
}

/* ── Article ───────────────────────────────────────────────── */

.article-page {
  padding: var(--space-2xl) 0;
}

.article-container {
  max-width: 780px;
}

.article-header {
  margin-bottom: var(--space-xl);
}

.article-title {
  margin-bottom: var(--space-md);
}

.article-meta {
  display: flex;
  gap: var(--space-md);
  color: var(--text-muted);
  font-size: 0.9rem;
}

.article-image {
  margin-bottom: var(--space-xl);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.article-content {
  margin-bottom: var(--space-xl);
}

.article-comments {
  border-top: 1px solid var(--border-color);
  padding-top: var(--space-xl);
  margin-top: var(--space-xl);
}

.comment {
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--border-color);
}

.comment-author {
  font-weight: 600;
  margin-bottom: var(--space-xs);
}

.comment-body {
  color: var(--text-secondary);
}

.comment-date {
  display: block;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: var(--space-xs);
}

/* ── Cart ──────────────────────────────────────────────────── */

.cart-page {
  padding: var(--space-2xl) 0;
}

.cart-title {
  margin-bottom: var(--space-xl);
}

.cart-table {
  width: 100%;
  border-collapse: collapse;
}

.cart-table th {
  text-align: left;
  padding: 1rem;
  border-bottom: 2px solid var(--border-color);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.cart-item td {
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.cart-item__product {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.cart-item__image {
  display: block;
  width: 80px;
  flex-shrink: 0;
  border-radius: var(--border-radius);
  overflow: hidden;
}

.cart-item__title {
  font-weight: 600;
  transition: color var(--transition);
}

.cart-item__title:hover {
  color: var(--primary);
}

.cart-item__variant {
  display: block;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: var(--space-xs);
}

.cart-remove {
  display: inline-flex;
  color: var(--text-muted);
  transition: color var(--transition);
}

.cart-remove:hover {
  color: #ef4444;
}

.cart-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
  margin-top: var(--space-xl);
  align-items: start;
}

.cart-note label {
  display: block;
  font-weight: 600;
  margin-bottom: var(--space-xs);
  font-size: 0.9rem;
}

.cart-note textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  min-height: 100px;
  resize: vertical;
}

.cart-summary {
  text-align: right;
}

.cart-subtotal {
  display: flex;
  justify-content: space-between;
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: var(--space-sm);
}

.cart-taxes-note {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: var(--space-md);
}

.btn-checkout {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
}

.cart-empty {
  text-align: center;
  padding: var(--space-2xl);
}

.cart-empty p {
  margin-bottom: var(--space-lg);
  font-size: 1.1rem;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .cart-table thead {
    display: none;
  }

  .cart-item td {
    display: block;
    padding: 0.5rem 0;
    border: none;
  }

  .cart-item {
    display: block;
    padding: var(--space-md) 0;
    border-bottom: 1px solid var(--border-color);
  }

  .cart-footer {
    grid-template-columns: 1fr;
  }
}

/* ── 404 ───────────────────────────────────────────────────── */

.page-404 {
  padding: var(--space-3xl) 0;
}

.page-404-inner {
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
}

.page-404__title {
  font-size: clamp(3rem, 8vw, 6rem);
  margin-bottom: var(--space-md);
  color: var(--primary);
}

.page-404__text {
  color: var(--text-secondary);
  margin-bottom: var(--space-lg);
  font-size: 1.1rem;
}

/* ── Search ────────────────────────────────────────────────── */

.search-page {
  padding: var(--space-2xl) 0;
}

.search-title {
  margin-bottom: var(--space-lg);
}

.search-form {
  margin-bottom: var(--space-xl);
}

.search-input-wrapper {
  display: flex;
  gap: var(--space-sm);
  max-width: 600px;
}

.search-input {
  flex: 1;
  padding: 0.8rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 1rem;
  transition: border-color var(--transition);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
}

.search-count {
  color: var(--text-secondary);
  margin-bottom: var(--space-lg);
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.search-result {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  transition: box-shadow var(--transition);
}

.search-result:hover {
  box-shadow: var(--shadow-md);
}

.search-result__image {
  width: 120px;
  flex-shrink: 0;
  border-radius: var(--border-radius);
  overflow: hidden;
}

.search-result__title {
  font-size: 1.1rem;
  margin-bottom: var(--space-xs);
}

.search-result__title a {
  transition: color var(--transition);
}

.search-result__title a:hover {
  color: var(--primary);
}

.search-result__excerpt {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: var(--space-sm);
}

.search-result__price {
  font-weight: 700;
  color: var(--primary);
}

.search-empty {
  text-align: center;
  padding: var(--space-2xl);
  color: var(--text-secondary);
}

/* ── Footer ────────────────────────────────────────────────── */

.site-footer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  padding: var(--space-2xl) 0 var(--space-lg);
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-xl);
  margin-bottom: var(--space-xl);
}

.footer-heading {
  font-size: 1rem;
  margin-bottom: var(--space-md);
}

.footer-tagline {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: var(--space-md);
}

.footer-links li {
  margin-bottom: var(--space-sm);
}

.footer-links a {
  color: var(--text-secondary);
  font-size: 0.9rem;
  transition: color var(--transition);
}

.footer-links a:hover {
  color: var(--primary);
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border-color);
}

.footer-copyright {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.footer-payment {
  font-size: 0.85rem;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }

  .footer-brand {
    grid-column: 1 / -1;
  }

  .footer-bottom {
    flex-direction: column;
    gap: var(--space-md);
    text-align: center;
  }
}`;
}

// ── Asset: global.js ──────────────────────────────────────────

function generateGlobalJS(): string {
  return `/* ============================================================
   RootX Theme — Global JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* ── Mobile Menu Toggle ────────────────────────────────────── */

  var menuToggle = document.querySelector('.mobile-menu-toggle');
  var mainNav = document.querySelector('.main-nav');

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', function () {
      var isOpen = mainNav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close menu on ESC
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mainNav.classList.contains('is-open')) {
        mainNav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        menuToggle.focus();
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
      if (
        mainNav.classList.contains('is-open') &&
        !mainNav.contains(e.target) &&
        !menuToggle.contains(e.target)
      ) {
        mainNav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* ── FAQ Accordion Toggle ──────────────────────────────────── */

  var faqToggles = document.querySelectorAll('[data-faq-toggle]');

  faqToggles.forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      var item = toggle.closest('[data-faq-item]');
      var answer = item ? item.querySelector('.faq-answer') : null;
      if (!answer) return;

      var isExpanded = toggle.getAttribute('aria-expanded') === 'true';

      // Close all other FAQ items
      faqToggles.forEach(function (otherToggle) {
        if (otherToggle !== toggle) {
          otherToggle.setAttribute('aria-expanded', 'false');
          var otherItem = otherToggle.closest('[data-faq-item]');
          var otherAnswer = otherItem ? otherItem.querySelector('.faq-answer') : null;
          if (otherAnswer) {
            otherAnswer.hidden = true;
            otherAnswer.style.maxHeight = null;
          }
        }
      });

      // Toggle current
      toggle.setAttribute('aria-expanded', String(!isExpanded));
      if (isExpanded) {
        answer.style.maxHeight = null;
        setTimeout(function () { answer.hidden = true; }, 300);
      } else {
        answer.hidden = false;
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  /* ── Smooth Scroll for Anchor Links ────────────────────────── */

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Update URL without jump
        if (history.pushState) {
          history.pushState(null, '', href);
        }
      }
    });
  });

  /* ── Quantity Selectors ────────────────────────────────────── */

  document.querySelectorAll('[data-quantity-minus]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = btn.parentElement ? btn.parentElement.querySelector('.quantity-input') : null;
      if (!input) return;
      var val = parseInt(input.value, 10) || 1;
      if (val > 1) {
        input.value = String(val - 1);
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });

  document.querySelectorAll('[data-quantity-plus]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = btn.parentElement ? btn.parentElement.querySelector('.quantity-input') : null;
      if (!input) return;
      var val = parseInt(input.value, 10) || 0;
      input.value = String(val + 1);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  /* ── Cart Quantity Auto-Update ──────────────────────────────── */

  document.querySelectorAll('.cart-item .quantity-input').forEach(function (input) {
    input.addEventListener('change', function () {
      var line = input.getAttribute('data-line');
      var quantity = parseInt(input.value, 10);
      if (!line || isNaN(quantity) || quantity < 0) return;

      fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line: parseInt(line, 10), quantity: quantity }),
      })
        .then(function () {
          window.location.reload();
        })
        .catch(function (err) {
          console.error('Cart update failed:', err);
        });
    });
  });

  /* ── Product Gallery Thumbnails ────────────────────────────── */

  var thumbnails = document.querySelectorAll('[data-gallery-thumb]');
  var galleryItems = document.querySelectorAll('[data-gallery-item]');

  thumbnails.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      var index = parseInt(thumb.getAttribute('data-gallery-thumb') || '0', 10);

      // Update active states
      thumbnails.forEach(function (t) { t.classList.remove('product-thumbnail--active'); });
      galleryItems.forEach(function (g) { g.classList.remove('product-gallery__item--active'); });

      thumb.classList.add('product-thumbnail--active');
      if (galleryItems[index]) {
        galleryItems[index].classList.add('product-gallery__item--active');
      }
    });
  });

  // Only show active gallery item
  galleryItems.forEach(function (item) {
    if (!item.classList.contains('product-gallery__item--active')) {
      item.style.display = 'none';
    }
  });

  if (galleryItems.length > 0) {
    thumbnails.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        galleryItems.forEach(function (g) { g.style.display = 'none'; });
        var index = parseInt(thumb.getAttribute('data-gallery-thumb') || '0', 10);
        if (galleryItems[index]) {
          galleryItems[index].style.display = 'block';
        }
      });
    });
  }
})();`;
}

// ── Config ────────────────────────────────────────────────────

function generateConfig(
  gen: WebsiteGeneration,
  input: WebsiteBuilderInput
): ShopifyThemeFile[] {
  const settingsSchema = [
    {
      name: 'theme_info',
      theme_name: `${input.businessName} Theme`,
      theme_version: '1.0.0',
      theme_author: 'RootX',
      theme_documentation_url: 'https://rootx.ai',
      theme_support_url: 'https://rootx.ai/support',
    },
    {
      name: 'Colors',
      settings: [
        {
          type: 'color',
          id: 'primary_color',
          label: 'Primary color',
          default: input.primaryColor,
        },
        {
          type: 'color',
          id: 'secondary_color',
          label: 'Secondary color',
          default: input.secondaryColor,
        },
        {
          type: 'color',
          id: 'text_color',
          label: 'Text color',
          default: '#1a1a1a',
        },
        {
          type: 'color',
          id: 'background_color',
          label: 'Background color',
          default: '#ffffff',
        },
      ],
    },
    {
      name: 'Typography',
      settings: [
        {
          type: 'text',
          id: 'heading_font',
          label: 'Heading font family',
          default: gen.branding.typography.heading,
        },
        {
          type: 'text',
          id: 'body_font',
          label: 'Body font family',
          default: gen.branding.typography.body,
        },
      ],
    },
    {
      name: 'Social media',
      settings: [
        { type: 'url', id: 'social_facebook', label: 'Facebook URL' },
        { type: 'url', id: 'social_instagram', label: 'Instagram URL' },
        { type: 'url', id: 'social_twitter', label: 'X (Twitter) URL' },
        { type: 'url', id: 'social_youtube', label: 'YouTube URL' },
        { type: 'url', id: 'social_linkedin', label: 'LinkedIn URL' },
        { type: 'url', id: 'social_tiktok', label: 'TikTok URL' },
      ],
    },
  ];

  const settingsData = {
    current: {
      primary_color: input.primaryColor,
      secondary_color: input.secondaryColor,
      text_color: '#1a1a1a',
      background_color: '#ffffff',
      heading_font: gen.branding.typography.heading,
      body_font: gen.branding.typography.body,
    },
  };

  return [
    file('config/settings_schema.json', JSON.stringify(settingsSchema, null, 2)),
    file('config/settings_data.json', JSON.stringify(settingsData, null, 2)),
  ];
}

// ── Locales ───────────────────────────────────────────────────

function generateLocales(
  gen: WebsiteGeneration,
  input: WebsiteBuilderInput
): ShopifyThemeFile[] {
  const locale = {
    general: {
      skip_to_content: 'Skip to content',
      view_all: 'View all',
      search: {
        title: 'Search',
      },
      cart: {
        title: 'Cart',
      },
      navigation: {
        menu: 'Menu',
        main: 'Main navigation',
      },
      pagination: {
        previous: 'Previous',
        next: 'Next',
      },
      onboarding: {
        product_title: 'Example Product',
      },
    },
    product: {
      add_to_cart: 'Add to cart',
      sold_out: 'Sold out',
      on_sale: 'Sale',
      quantity: 'Quantity',
    },
    collection: {
      empty: 'No products found in this collection.',
    },
    cart: {
      title: 'Your Cart',
      product: 'Product',
      price: 'Price',
      quantity: 'Quantity',
      total: 'Total',
      remove: 'Remove',
      subtotal: 'Subtotal',
      note: 'Order notes',
      taxes_note: 'Taxes and shipping calculated at checkout.',
      checkout: 'Check out',
      empty: 'Your cart is empty.',
      continue_shopping: 'Continue shopping',
    },
    contact: {
      form: {
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        message: 'Message',
        send: 'Send message',
        post_success: 'Thank you for your message! We will get back to you shortly.',
      },
    },
    newsletter: {
      success: 'Thanks for subscribing!',
      email_placeholder: 'Enter your email',
    },
    search: {
      title: 'Search',
      placeholder: 'Search our store...',
      submit: 'Search',
      results_count: '{{ count }} results for "{{ terms }}"',
      no_results: 'No results found for "{{ terms }}".',
    },
    blog: {
      read_more: 'Read more',
      by_author: 'By {{ author }}',
      comments: 'Comments',
      back_to_blog: 'Back to blog',
      comment_form: {
        name: 'Name',
        email: 'Email',
        message: 'Comment',
        submit: 'Post comment',
      },
    },
    meta: {
      store_name: input.businessName,
    },
  };

  return [file('locales/en.default.json', JSON.stringify(locale, null, 2))];
}

function generateTrustBarSection(gen: WebsiteGeneration, input: WebsiteBuilderInput): string {
  const badge1 = gen.ecommerce?.trustBadges?.[0] ?? '30-Day Money Back Guarantee';
  const badge2 = gen.ecommerce?.trustBadges?.[1] ?? 'Free Worldwide Shipping';
  const badge3 = gen.ecommerce?.trustBadges?.[2] ?? 'Secure SSL Encrypted Checkout';
  
  return `<section class="trust-bar section" data-section-id="{{ section.id }}">
  <div class="container">
    <div class="trust-bar-inner">
      <div class="trust-bar-item">
        <svg class="trust-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span class="trust-text">{{ section.settings.badge_1 }}</span>
      </div>
      <div class="trust-bar-item">
        <svg class="trust-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
        <span class="trust-text">{{ section.settings.badge_2 }}</span>
      </div>
      <div class="trust-bar-item">
        <svg class="trust-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
        <span class="trust-text">{{ section.settings.badge_3 }}</span>
      </div>
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Trust Bar",
  "settings": [
    { "type": "text", "id": "badge_1", "label": "Badge 1", "default": "${escJson(badge1)}" },
    { "type": "text", "id": "badge_2", "label": "Badge 2", "default": "${escJson(badge2)}" },
    { "type": "text", "id": "badge_3", "label": "Badge 3", "default": "${escJson(badge3)}" }
  ],
  "presets": [
    {
      "name": "Trust Bar"
    }
  ]
}
{% endschema %}`;
}

// ── New Ecommerce / Dropshipping Sections ──────────────────────

function generateHeroProductSection(
  gen: WebsiteGeneration,
  input: WebsiteBuilderInput
): string {
  const profile = profileProduct(gen, input);
  const price = gen.ecommerce?.price || '29.99';
  const compareAtPrice = gen.ecommerce?.compareAtPrice || '49.99';
  const images = gen.ecommerce?.images || [];

  return `<section class="hero-product section" data-section-id="{{ section.id }}">
  <div class="container hero-product-inner">
    <div class="hero-product-grid">
      <!-- Media Gallery -->
      <div class="hero-product-media">
        <div class="main-image-container">
          {% if section.settings.image_1 != blank %}
            <img id="HeroProductMainImage" src="{{ section.settings.image_1 }}" alt="{{ section.settings.title | escape }}" class="main-product-image" />
          {% else %}
            {{ 'product-1' | placeholder_svg_tag: 'placeholder-svg' }}
          {% endif %}
        </div>
        <div class="thumbnail-images">
          {% if section.settings.image_1 != blank %}
            <div class="thumbnail-item active" onclick="document.getElementById('HeroProductMainImage').src='{{ section.settings.image_1 }}'; document.querySelectorAll('.thumbnail-item').forEach(el => el.classList.remove('active')); this.classList.add('active');">
              <img src="{{ section.settings.image_1 }}" alt="Thumbnail 1" />
            </div>
          {% endif %}
          {% if section.settings.image_2 != blank %}
            <div class="thumbnail-item" onclick="document.getElementById('HeroProductMainImage').src='{{ section.settings.image_2 }}'; document.querySelectorAll('.thumbnail-item').forEach(el => el.classList.remove('active')); this.classList.add('active');">
              <img src="{{ section.settings.image_2 }}" alt="Thumbnail 2" />
            </div>
          {% endif %}
          {% if section.settings.image_3 != blank %}
            <div class="thumbnail-item" onclick="document.getElementById('HeroProductMainImage').src='{{ section.settings.image_3 }}'; document.querySelectorAll('.thumbnail-item').forEach(el => el.classList.remove('active')); this.classList.add('active');">
              <img src="{{ section.settings.image_3 }}" alt="Thumbnail 3" />
            </div>
          {% endif %}
        </div>
      </div>

      <!-- Product Details / Buying form -->
      <div class="hero-product-info">
        <h1 class="product-title">{{ section.settings.title }}</h1>
        
        <div class="product-price-wrapper">
          <span class="price-current">$ {{ section.settings.price }}</span>
          {% if section.settings.compare_at_price != blank %}
            <span class="price-compare">$ {{ section.settings.compare_at_price }}</span>
            <span class="badge badge-sale">Save</span>
          {% endif %}
        </div>

        <div class="product-description rte">
          {{ section.settings.description }}
        </div>

        <!-- Add to cart form -->
        <form action="/cart/add" method="post" enctype="multipart/form-data" class="product-form">
          <div class="product-form-options">
            <!-- Dynamic variants if any -->
            {% if section.settings.variant_1_name != blank %}
              <div class="option-select-wrapper">
                <label class="option-label">{{ section.settings.variant_1_name }}</label>
                <select name="id" class="option-select">
                  {% assign vals = section.settings.variant_1_values | split: ',' %}
                  {% for val in vals %}
                    <option value="{{ val | strip }}">{{ val | strip }}</option>
                  {% endfor %}
                </select>
              </div>
            {% endif %}
          </div>

          <div class="product-form-quantity">
            <label for="Quantity-{{ section.id }}" class="quantity-label">Quantity</label>
            <div class="quantity-input-wrapper">
              <button type="button" class="qty-btn qty-minus" onclick="const input = document.getElementById('Quantity-{{ section.id }}'); if (parseInt(input.value) > 1) input.value = parseInt(input.value) - 1;">-</button>
              <input type="number" id="Quantity-{{ section.id }}" name="quantity" value="1" min="1" class="qty-input">
              <button type="button" class="qty-btn qty-plus" onclick="const input = document.getElementById('Quantity-{{ section.id }}'); input.value = parseInt(input.value) + 1;">+</button>
            </div>
          </div>

          <div class="product-form-buttons">
            <button type="submit" name="add" class="btn btn-primary btn-add-to-cart w-full">
              Add to Cart
            </button>
          </div>
        </form>

        <div class="trust-badges-wrapper">
          <p class="trust-title">{{ section.settings.trust_title }}</p>
          <div class="trust-badges-grid">
            {% if section.settings.badge_1 != blank %}
              <div class="trust-badge-item">✓ {{ section.settings.badge_1 }}</div>
            {% endif %}
            {% if section.settings.badge_2 != blank %}
              <div class="trust-badge-item">✓ {{ section.settings.badge_2 }}</div>
            {% endif %}
            {% if section.settings.badge_3 != blank %}
              <div class="trust-badge-item">✓ {{ section.settings.badge_3 }}</div>
            {% endif %}
          </div>
        </div>

        {% if section.settings.shipping_text != blank %}
          <p class="shipping-text">🚚 {{ section.settings.shipping_text }}</p>
        {% endif %}
      </div>
    </div>
  </div>

  <!-- Sticky Mobile Add to Cart Bar -->
  <div class="sticky-buybox">
    <div class="sticky-buybox-left">
      {% if section.settings.image_1 != blank %}
        <img src="{{ section.settings.image_1 }}" alt="{{ section.settings.title | escape }}" class="sticky-buybox-img" />
      {% endif %}
      <div class="sticky-buybox-meta">
        <span class="sticky-buybox-title">{{ section.settings.title }}</span>
        <span class="sticky-buybox-price">$ {{ section.settings.price }}</span>
      </div>
    </div>
    <button type="button" class="btn btn-primary sticky-buybox-btn" onclick="document.querySelector('.product-form-buttons button[type=submit]').click();">
      Add to Cart
    </button>
  </div>
</section>

{% schema %}
{
  "name": "Hero Product",
  "settings": [
    { "type": "text", "id": "title", "label": "Product Title", "default": "${escJson(profile.cleanTitle)}" },
    { "type": "text", "id": "price", "label": "Price", "default": "${escJson(price)}" },
    { "type": "text", "id": "compare_at_price", "label": "Compare at Price", "default": "${escJson(compareAtPrice)}" },
    { "type": "richtext", "id": "description", "label": "Product Description", "default": "<p>${escJson(profile.cleanDescription)}</p>" },
    { "type": "text", "id": "image_1", "label": "Product Image 1 (URL)", "default": "${escJson(images[0] ?? '')}" },
    { "type": "text", "id": "image_2", "label": "Product Image 2 (URL)", "default": "${escJson(images[1] ?? '')}" },
    { "type": "text", "id": "image_3", "label": "Product Image 3 (URL)", "default": "${escJson(images[2] ?? '')}" },
    { "type": "text", "id": "variant_1_name", "label": "Variant 1 Name", "default": "${escJson(gen.ecommerce?.variants?.[0]?.name ?? '')}" },
    { "type": "text", "id": "variant_1_values", "label": "Variant 1 Values (comma separated)", "default": "${escJson(gen.ecommerce?.variants?.[0]?.values?.join(', ') ?? '')}" },
    { "type": "text", "id": "trust_title", "label": "Trust Title", "default": "Guaranteed Safe Checkout" },
    { "type": "text", "id": "badge_1", "label": "Trust Badge 1", "default": "${escJson(gen.ecommerce?.trustBadges?.[0] ?? '30-Day Money Back Guarantee')}" },
    { "type": "text", "id": "badge_2", "label": "Trust Badge 2", "default": "${escJson(gen.ecommerce?.trustBadges?.[1] ?? 'Free Worldwide Shipping')}" },
    { "type": "text", "id": "badge_3", "label": "Trust Badge 3", "default": "${escJson(gen.ecommerce?.trustBadges?.[2] ?? 'Secure SSL Encrypted Checkout')}" },
    { "type": "text", "id": "shipping_text", "label": "Shipping Info Text", "default": "${escJson(gen.ecommerce?.shippingText ?? 'Free shipping on all orders this week!')}" }
  ],
  "presets": [
    {
      "name": "Hero Product Showcase"
    }
  ]
}
{% endschema %}`;
}

function generateProductGallerySection(gen: WebsiteGeneration): string {
  const images = gen.ecommerce?.images || [];

  return `<section class="product-gallery section" data-section-id="{{ section.id }}">
  <div class="container">
    <h2 class="section-title text-center">{{ section.settings.heading }}</h2>
    <div class="product-gallery-grid">
      {% if section.settings.image_1 != blank %}
        <div class="gallery-item">
          <img src="{{ section.settings.image_1 }}" alt="Gallery Image 1" class="gallery-image" />
        </div>
      {% endif %}
      {% if section.settings.image_2 != blank %}
        <div class="gallery-item">
          <img src="{{ section.settings.image_2 }}" alt="Gallery Image 2" class="gallery-image" />
        </div>
      {% endif %}
      {% if section.settings.image_3 != blank %}
        <div class="gallery-item">
          <img src="{{ section.settings.image_3 }}" alt="Gallery Image 3" class="gallery-image" />
        </div>
      {% endif %}
      {% if section.settings.image_4 != blank %}
        <div class="gallery-item">
          <img src="{{ section.settings.image_4 }}" alt="Gallery Image 4" class="gallery-image" />
        </div>
      {% endif %}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Product Gallery",
  "settings": [
    { "type": "text", "id": "heading", "label": "Gallery Heading", "default": "Product Gallery" },
    { "type": "text", "id": "image_1", "label": "Gallery Image 1 (URL)", "default": "${escJson(images[0] ?? '')}" },
    { "type": "text", "id": "image_2", "label": "Gallery Image 2 (URL)", "default": "${escJson(images[1] ?? '')}" },
    { "type": "text", "id": "image_3", "label": "Gallery Image 3 (URL)", "default": "${escJson(images[2] ?? '')}" },
    { "type": "text", "id": "image_4", "label": "Gallery Image 4 (URL)", "default": "${escJson(images[3] ?? '')}" }
  ],
  "presets": [
    {
      "name": "Product Gallery"
    }
  ]
}
{% endschema %}`;
}

function generateProductBenefitsSection(gen: WebsiteGeneration): string {
  const features = gen.homepage.features || [];

  let html = `<section class="product-benefits section" data-section-id="{{ section.id }}">
  <div class="container">
    <h2 class="section-title text-center">{{ section.settings.heading }}</h2>
    <div class="benefits-grid">`;

  for (let i = 1; i <= 6; i++) {
    html += `
      {% if section.settings.benefit_${i}_title != blank %}
        <div class="benefit-card">
          <div class="benefit-icon">{{ section.settings.benefit_${i}_icon }}</div>
          <h3 class="benefit-title">{{ section.settings.benefit_${i}_title }}</h3>
          <p class="benefit-desc">{{ section.settings.benefit_${i}_desc }}</p>
        </div>
      {% endif %}`;
  }

  html += `
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Product Benefits",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "Why Choose Us" }`;

  for (let i = 1; i <= 6; i++) {
    const feat = features[i - 1];
    const defaultEmoji = i === 1 ? '✨' : i === 2 ? '⚡' : i === 3 ? '🛡️' : i === 4 ? '💎' : i === 5 ? '🔄' : '👍';
    const resolvedEmoji = feat ? mapLucideToEmoji(feat.icon) : defaultEmoji;
    const defaultTitle = i === 1 ? 'Premium Quality' : i === 2 ? 'Ergonomic Design' : i === 3 ? '30-Day Guarantee' : i === 4 ? 'Exceptional Performance' : i === 5 ? 'Easy Returns' : 'Customer Support';
    const defaultDesc = i === 1 ? 'Crafted with the finest materials for durability.' : i === 2 ? 'Engineered for comfort and modern usage.' : i === 3 ? 'Shop with peace of mind. We stand behind our quality.' : i === 4 ? 'High performance in every condition.' : i === 5 ? 'Hassle-free exchange policy.' : 'Dedicated team ready to help.';

    html += `,
    { "type": "text", "id": "benefit_${i}_icon", "label": "Benefit ${i} Icon (Emoji)", "default": "${resolvedEmoji}" },
    { "type": "text", "id": "benefit_${i}_title", "label": "Benefit ${i} Title", "default": "${escJson(feat?.title ?? defaultTitle)}" },
    { "type": "text", "id": "benefit_${i}_desc", "label": "Benefit ${i} Description", "default": "${escJson(feat?.description ?? defaultDesc)}" }`;
  }

  html += `
  ],
  "presets": [
    {
      "name": "Product Benefits Grid"
    }
  ]
}
{% endschema %}`;

  return html;
}

function generateProductSpecificationsSection(gen: WebsiteGeneration): string {
  const specifications = gen.ecommerce?.specifications || [];

  let html = `<section class="product-specifications section" data-section-id="{{ section.id }}">
  <div class="container">
    <h2 class="section-title text-center">{{ section.settings.heading }}</h2>
    <div class="specifications-table-wrapper">
      <table class="specifications-table">
        <tbody>`;

  for (let i = 1; i <= 8; i++) {
    html += `
          {% if section.settings.spec_${i}_label != blank %}
            <tr>
              <td class="spec-label">{{ section.settings.spec_${i}_label }}</td>
              <td class="spec-value">{{ section.settings.spec_${i}_value }}</td>
            </tr>
          {% endif %}`;
  }

  html += `
        </tbody>
      </table>
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Product Specifications",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "Technical Specifications" }`;

  for (let i = 1; i <= 8; i++) {
    const spec = specifications[i - 1];
    html += `,
    { "type": "text", "id": "spec_${i}_label", "label": "Specification ${i} Label", "default": "${escJson(spec?.label ?? '')}" },
    { "type": "text", "id": "spec_${i}_value", "label": "Specification ${i} Value", "default": "${escJson(spec?.value ?? '')}" }`;
  }

  html += `
  ],
  "presets": [
    {
      "name": "Product Specifications"
    }
  ]
}
{% endschema %}`;

  return html;
}

function generateImageWithTextSection(gen: WebsiteGeneration): string {
  const featureSections = gen.ecommerce?.featureSections || [];
  const images = gen.ecommerce?.images || [];

  return `<section class="image-with-text section" data-section-id="{{ section.id }}">
  <div class="container">
    <div class="image-with-text-grid {% if section.settings.layout == 'right' %}grid-reverse{% endif %}">
      <div class="image-with-text-media {% if section.settings.image_url == section.settings.fallback_image_url and section.settings.fallback_image_url != blank %}image-with-text-media--zoom-crop{% endif %}">
        {% if section.settings.image_url != blank %}
          <img src="{{ section.settings.image_url }}" alt="{{ section.settings.heading | escape }}" class="feature-image" />
        {% else %}
          {{ 'image' | placeholder_svg_tag: 'placeholder-svg' }}
        {% endif %}
      </div>
      <div class="image-with-text-content">
        <h2 class="feature-heading">{{ section.settings.heading }}</h2>
        <div class="feature-desc rte">
          {{ section.settings.text }}
        </div>
        {% if section.settings.button_label != blank %}
          <a href="{{ section.settings.button_link }}" class="btn btn-primary">{{ section.settings.button_label }}</a>
        {% endif %}
      </div>
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Image with Text",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "${escJson(featureSections[0]?.title ?? 'Designed to Perfection')}" },
    { "type": "richtext", "id": "text", "label": "Text", "default": "<p>${escJson(featureSections[0]?.description ?? 'Experience the difference with our meticulously engineered product, built to fulfill all your expectations and more.')}</p>" },
    { "type": "text", "id": "image_url", "label": "Image URL", "default": "${escJson(featureSections[0]?.imageUrl ?? images[0] ?? '')}" },
    { "type": "text", "id": "fallback_image_url", "label": "Fallback Base Image URL (for crop validation)", "default": "${escJson(images[0] ?? '')}" },
    { "type": "select", "id": "layout", "label": "Image alignment", "options": [
        { "value": "left", "label": "Left" },
        { "value": "right", "label": "Right" }
      ], "default": "left" },
    { "type": "text", "id": "button_label", "label": "Button label", "default": "Learn More" },
    { "type": "url", "id": "button_link", "label": "Button link", "default": "/collections/all" }
  ],
  "presets": [
    {
      "name": "Image with Text"
    }
  ]
}
{% endschema %}`;
}

function generateFeaturedProductSection(
  gen: WebsiteGeneration,
  input: WebsiteBuilderInput
): string {
  const profile = profileProduct(gen, input);
  const price = gen.ecommerce?.price || '29.99';
  const compareAtPrice = gen.ecommerce?.compareAtPrice || '49.99';
  const images = gen.ecommerce?.images || [];

  return `<section class="featured-product section" data-section-id="{{ section.id }}">
  <div class="container">
    <div class="featured-product-grid">
      <div class="featured-product-media">
        {% if section.settings.image_url != blank %}
          <img src="{{ section.settings.image_url }}" alt="{{ section.settings.heading | escape }}" class="featured-product-image" />
        {% else %}
          {{ 'product-1' | placeholder_svg_tag: 'placeholder-svg' }}
        {% endif %}
      </div>
      <div class="featured-product-info">
        <span class="featured-badge">Featured Product</span>
        <h2 class="product-title">{{ section.settings.heading }}</h2>
        <div class="product-price-wrapper">
          <span class="price-current">$ {{ section.settings.price }}</span>
          {% if section.settings.compare_at_price != blank %}
            <span class="price-compare">$ {{ section.settings.compare_at_price }}</span>
          {% endif %}
        </div>
        <p class="product-desc">{{ section.settings.description }}</p>
        <a href="/products/{{ section.settings.product_handle }}" class="btn btn-primary w-full text-center">View Details</a>
      </div>
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Featured Product",
  "settings": [
    { "type": "text", "id": "heading", "label": "Product Title", "default": "${escJson(profile.cleanTitle)}" },
    { "type": "text", "id": "price", "label": "Price", "default": "${escJson(price)}" },
    { "type": "text", "id": "compare_at_price", "label": "Compare at Price", "default": "${escJson(compareAtPrice)}" },
    { "type": "textarea", "id": "description", "label": "Short Description", "default": "${escJson(profile.cleanDescription.slice(0, 160) + '...')}" },
    { "type": "text", "id": "image_url", "label": "Product Image URL", "default": "${escJson(images[0] ?? '')}" },
    { "type": "text", "id": "product_handle", "label": "Product Handle", "default": "main-product" }
  ],
  "presets": [
    {
      "name": "Featured Product Spotlight"
    }
  ]
}
{% endschema %}`;
}

function generateEcommerceCSS(): string {
  return `/* ============================================================
   RootX Theme — Ecommerce & New Sections Stylesheet
   ============================================================ */

/* ── Trust Bar ── */
.trust-bar {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  padding: 1.5rem 0;
}
.trust-bar-inner {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  gap: 1.5rem;
  align-items: center;
  justify-content: center;
}
.trust-bar-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: left;
}
.trust-icon {
  color: var(--primary);
  flex-shrink: 0;
}
.trust-text {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-primary);
}

/* ── Hero Product Section ── */
.hero-product {
  padding: clamp(3rem, 8vw, 6rem) 0;
  background: var(--bg-primary);
}
.hero-product-inner {
  max-width: var(--container-max);
  margin: 0 auto;
}
.hero-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 450px), 1fr));
  gap: clamp(2rem, 5vw, 4rem);
  align-items: start;
}
@media (max-width: 480px) {
  .hero-product-grid {
    grid-template-columns: 1fr;
  }
}
.main-image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  background: var(--bg-secondary);
}
.main-product-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}
.thumbnail-images {
  display: flex;
  gap: 12px;
  margin-top: 15px;
  overflow-x: auto;
  padding-bottom: 6px;
  scrollbar-width: thin;
}
.thumbnail-item {
  flex: 0 0 75px;
  height: 75px;
  border: 2px solid transparent;
  border-radius: var(--border-radius);
  overflow: hidden;
  cursor: pointer;
  background: var(--bg-secondary);
  transition: all var(--transition);
}
.thumbnail-item.active {
  border-color: var(--primary);
}
.thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.hero-product-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.product-title {
  font-size: clamp(2rem, 4vw, 2.75rem);
  color: var(--text-primary);
  margin: 0;
}
.product-price-wrapper {
  display: flex;
  align-items: center;
  gap: 15px;
}
.price-current {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--primary);
}
.price-compare {
  font-size: 1.25rem;
  text-decoration: line-through;
  color: var(--text-secondary);
  opacity: 0.7;
}
.badge-sale {
  background: var(--accent, #e11d48);
  color: #fff;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 999px;
  text-transform: uppercase;
}
.product-description {
  color: var(--text-secondary);
  line-height: 1.7;
}
.product-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--border-color);
}
.option-label, .quantity-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}
.option-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
  cursor: pointer;
}
.quantity-input-wrapper {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  overflow: hidden;
}
.qty-btn {
  background: transparent;
  border: none;
  width: 40px;
  height: 40px;
  cursor: pointer;
  font-size: 1.2rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}
.qty-btn:hover {
  background: var(--bg-secondary);
}
.qty-input {
  width: 50px;
  height: 40px;
  text-align: center;
  border: none;
  border-left: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
}
.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.btn-add-to-cart {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  text-transform: uppercase;
  font-weight: 700;
}
.trust-badges-wrapper {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}
.trust-title {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}
.trust-badges-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.trust-badge-item {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
}
.shipping-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── Product Gallery Section ── */
.product-gallery {
  padding: clamp(3rem, 6vw, 5rem) 0;
}
.product-gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  gap: 24px;
}
.gallery-item {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
}
.gallery-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}
.gallery-item:hover .gallery-image {
  transform: scale(1.03);
}

/* ── Product Benefits Section ── */
.product-benefits {
  padding: clamp(3rem, 6vw, 5rem) 0;
  background: var(--bg-secondary);
}
.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: clamp(1.5rem, 3vw, 2.5rem);
}
.benefit-card {
  padding: 2.5rem 2rem;
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  text-align: center;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition), box-shadow var(--transition);
}
.benefit-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg);
}
.benefit-icon {
  font-size: 2.5rem;
  margin-bottom: 1.25rem;
}
.benefit-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}
.benefit-desc {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* ── Specifications Section ── */
.product-specifications {
  padding: clamp(3rem, 6vw, 5rem) 0;
}
.specifications-table-wrapper {
  max-width: 800px;
  margin: 2rem auto 0;
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-color);
}
.specifications-table {
  width: 100%;
  border-collapse: collapse;
}
.specifications-table tr {
  border-bottom: 1px solid var(--border-color);
}
.specifications-table tr:last-child {
  border-bottom: none;
}
.specifications-table td {
  padding: 1rem 1.5rem;
  font-size: 0.95rem;
}
.specifications-table tr:nth-child(even) {
  background: var(--bg-secondary);
}
.spec-label {
  font-weight: 700;
  color: var(--text-primary);
  width: 40%;
}
.spec-value {
  color: var(--text-secondary);
}

/* ── Image With Text Section ── */
.image-with-text {
  padding: clamp(3rem, 8vw, 6rem) 0;
}
.image-with-text-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 450px), 1fr));
  gap: clamp(2rem, 5vw, 4rem);
  align-items: center;
}
@media (max-width: 480px) {
  .image-with-text-grid {
    grid-template-columns: 1fr;
  }
}
.image-with-text-media {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
}
.feature-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.image-with-text-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  text-align: left;
}
.feature-heading {
  font-size: clamp(1.75rem, 3.5vw, 2.5rem);
  color: var(--text-primary);
  margin: 0;
}
.feature-desc {
  color: var(--text-secondary);
  font-size: 1.05rem;
  line-height: 1.7;
}

/* ── Featured Product Section ── */
.featured-product {
  padding: clamp(3rem, 6vw, 5rem) 0;
}
.featured-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 450px), 1fr));
  gap: clamp(2rem, 5vw, 4rem);
  align-items: center;
}
@media (max-width: 480px) {
  .featured-product-grid {
    grid-template-columns: 1fr;
  }
}
.featured-product-media {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
}
.featured-product-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.featured-product-info {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  align-items: start;
}
.featured-badge {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--primary);
  background: var(--secondary);
  padding: 4px 12px;
  border-radius: 999px;
}

/* ── Sticky Mobile Add to Cart Bar ── */
.sticky-buybox {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color);
  padding: 10px 16px;
  display: none;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  z-index: 999;
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.05);
}
@media (max-width: 768px) {
  .sticky-buybox {
    display: flex;
  }
  body {
    padding-bottom: 70px;
  }
}
.sticky-buybox-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.sticky-buybox-img {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  flex-shrink: 0;
}
.sticky-buybox-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.sticky-buybox-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sticky-buybox-price {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--primary);
}
.sticky-buybox-btn {
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  flex-shrink: 0;
}

/* ── Fallback Zoom Crop ── */
.image-with-text-media--zoom-crop {
  overflow: hidden;
  position: relative;
}
.image-with-text-media--zoom-crop img {
  object-position: center 25% !important;
  transform: scale(1.22);
  filter: brightness(0.97) contrast(1.03);
}

/* ── Testimonials Card Polish ── */
.testimonials-section {
  background-color: var(--bg-secondary);
}
.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: 2rem;
  margin-top: 3rem;
}
.testimonial-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition), box-shadow var(--transition);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.testimonial-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
.testimonial-stars {
  color: #ffb800;
  font-size: 1.2rem;
  margin-bottom: 1rem;
}
.testimonial-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}
.testimonial-quote {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  font-style: italic;
  flex-grow: 1;
}
.testimonial-author {
  display: flex;
  align-items: center;
  gap: 12px;
  border-top: 1px solid var(--border-color);
  padding-top: 1.25rem;
}
.testimonial-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95rem;
  flex-shrink: 0;
}
.testimonial-meta {
  display: flex;
  flex-direction: column;
  text-align: left;
}
.testimonial-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}
.testimonial-role {
  font-size: 0.8rem;
  color: var(--text-secondary);
  opacity: 0.8;
}

/* ── FAQ Accordion Polish ── */
.faq-section {
  background-color: var(--bg-primary);
}
.faq-list {
  max-width: 800px;
  margin: 3rem auto 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.faq-item {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  background: var(--bg-secondary);
  overflow: hidden;
  transition: all var(--transition);
}
.faq-question {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  transition: color var(--transition);
}
.faq-question:hover {
  color: var(--primary);
}
.faq-answer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1), padding 0.3s ease;
  padding: 0 2rem;
}
.faq-question[aria-expanded="true"] + .faq-answer {
  padding-bottom: 1.5rem;
}
.faq-answer p {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
}
.faq-chevron {
  transition: transform var(--transition);
  color: var(--text-secondary);
  flex-shrink: 0;
}
.faq-question[aria-expanded="true"] .faq-chevron {
  transform: rotate(180deg);
  color: var(--primary);
}
`;
}
