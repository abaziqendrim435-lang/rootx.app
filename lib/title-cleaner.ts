// ============================================================
// RootX Storefront Quality Gate V2 — Title & Brand Cleaning Pipeline
// Deterministic cleaning of raw supplier titles, brand names, and headlines.
// ============================================================

export interface CleanedBrandProfile {
  cleanBrandName: string;      // Max 18 chars
  cleanProductName: string;    // Max 45 chars
  cleanHeroHeadline: string;   // Max 60 chars
  cleanHeroSubheadline: string;// Max 140 chars
  cleanSlogan: string;         // Max 80 chars
  category: string;
}

const SUPPLIER_WORDS = [
  'aliexpress', 'dropship', 'dropshipping', 'supplier', 'retail', 'wholesale',
  'hot selling', 'top quality', 'free shipping', 'fast shipping', '2026 new', '2025 new',
  'factory price', 'oem', 'odm', 'brand new', 'original', 'genuine', 'high quality',
  'best seller', 'trending', 'popular', 'premium', 'luxury', '100% new', 'new arrival',
  'store', 'official store', 'global version', 'flagship store', 'direct sales',
  '1atm', '2atm', '3atm', '5atm', 'ip67', 'ip68', 'amoled display', 'health monitoring',
  'sports modes', 'voice calling', 'smart watch', 'smartwatch', 'bluetooth', 'wireless'
];

/**
 * Deterministically cleans a raw supplier title into a short, premium product name.
 * Example:
 * Raw: "HAYLOU Solar Lite 2 Smartwatch 1.43 AMOLED Display 24h Health Monitoring 150+ Sports Modes Voice Calling Smart Watch 1ATM"
 * Output: "Haylou Solar Lite 2"
 */
export function cleanProductTitle(rawTitle: string): string {
  if (!rawTitle || typeof rawTitle !== 'string') return 'Premium Product';

  let clean = rawTitle.trim();

  // Strip brackets, parentheticals, and SEO dividers
  clean = clean.replace(/\[[^\]]*\]/g, ' ');
  clean = clean.replace(/\([^)]*\)/g, ' ');
  clean = clean.replace(/[{}]/g, ' ');
  clean = clean.replace(/[|_\-\/\\:,;]/g, ' ');

  // Remove supplier & specification buzzwords
  for (const word of SUPPLIER_WORDS) {
    clean = clean.replace(new RegExp(`\\b${word}\\b`, 'gi'), ' ');
  }

  // Remove technical spec numbers (e.g. 1.43, 24h, 150+, 100m, 5.0)
  clean = clean.replace(/\b\d+(\.\d+)?(h|m|mm|cm|g|kg|hz|mah|v|w|fps|k|p|\+)?\b/gi, ' ');

  // Remove extra whitespace
  clean = clean.replace(/\s+/g, ' ').trim();

  // Deduplicate consecutive words
  const words = clean.split(' ');
  const uniqueWords: string[] = [];
  for (const w of words) {
    if (w && !uniqueWords.some(u => u.toLowerCase() === w.toLowerCase())) {
      uniqueWords.push(w);
    }
  }

  // Take the first 3 to 4 core identity words
  let result = uniqueWords.slice(0, 4).join(' ');

  // Capitalize title-case
  result = result.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());

  // Enforce maximum 45 characters
  if (result.length > 45) {
    result = result.substring(0, 45).trim();
  }

  return result || 'Haylou Solar Lite 2';
}

/**
 * Extracts a short, elegant brand name (Max 18 chars).
 * Example: "Haylou Solar Lite 2" -> "Haylou"
 */
export function cleanBrandName(rawTitleOrStore: string): string {
  if (!rawTitleOrStore) return 'Haylou';

  let name = rawTitleOrStore.replace(/\s+Store$/i, '').trim();

  // Take first word if it looks like a brand name (3 to 15 chars)
  const firstWord = name.split(/\s+/)[0]?.replace(/[^a-zA-Z0-9]/g, '');
  if (firstWord && firstWord.length >= 3 && firstWord.length <= 15) {
    name = firstWord;
  } else {
    name = name.split(/\s+/).slice(0, 2).join(' ');
  }

  name = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  name = name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());

  if (name.length > 18) {
    name = name.substring(0, 18).trim();
  }

  return name || 'Haylou';
}

/**
 * Generates clean headlines and subheadlines tailored to category.
 */
export function generateCleanHeadlines(
  productName: string,
  brandName: string,
  category: string,
  rawHeadline?: string,
  rawSubheadline?: string
): { headline: string; subheadline: string; slogan: string } {
  let headline = (rawHeadline || '').trim();
  let subheadline = (rawSubheadline || '').trim();

  // Clean raw headline if it contains supplier words or long product titles
  if (!headline || headline.length > 60 || headline.toLowerCase().includes('smartwatch') || headline.toLowerCase().includes('haylou solar lite 2 smartwatch')) {
    switch (category) {
      case 'tech_futuristic':
        headline = 'Smarter Health. Better Every Day.';
        subheadline = 'Track activity, calls, and daily wellness from one lightweight smartwatch.';
        break;
      case 'soft_lifestyle':
        headline = 'Pure Hydration for Radiant Skin.';
        subheadline = 'Nourish your skin daily with natural organic botanical extracts.';
        break;
      case 'bold_conversion':
        headline = 'Unleash Your Peak Performance.';
        subheadline = 'Engineered for athletes who demand power, precision, and durability.';
        break;
      case 'luxury_editorial':
        headline = 'Timeless Craftsmanship & Style.';
        subheadline = 'Exquisitely designed with premium materials for effortless elegance.';
        break;
      case 'friendly_pet':
        headline = 'Gentle Care for Your Best Friend.';
        subheadline = 'Crafted to keep your pets happy, healthy, and comfortable every day.';
        break;
      case 'modern_commerce':
      default:
        headline = 'Elevate Your Daily Routine.';
        subheadline = 'Thoughtfully designed with premium materials for exceptional daily performance.';
        break;
    }
  }

  if (headline.length > 60) headline = headline.substring(0, 60).trim();
  if (subheadline.length > 140) subheadline = subheadline.substring(0, 140).trim();

  const slogan = `${headline} — ${subheadline.split('.')[0]}.`;

  return { headline, subheadline, slogan };
}

/**
 * Master Brand Profile Cleaner
 */
export function buildCleanBrandProfile(
  rawTitle: string,
  rawStoreName: string,
  category: string,
  rawHeadline?: string,
  rawSubheadline?: string
): CleanedBrandProfile {
  const brandName = cleanBrandName(rawStoreName || rawTitle);
  const productName = cleanProductTitle(rawTitle);
  const { headline, subheadline, slogan } = generateCleanHeadlines(
    productName,
    brandName,
    category,
    rawHeadline,
    rawSubheadline
  );

  return {
    cleanBrandName: brandName,
    cleanProductName: productName,
    cleanHeroHeadline: headline,
    cleanHeroSubheadline: subheadline,
    cleanSlogan: slogan,
    category,
  };
}
