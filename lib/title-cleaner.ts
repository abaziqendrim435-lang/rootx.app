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
  'new', '2026', '2025', '2024', '2027', 'intelligent', 'smart', 'official', 'factory', 'original',
  'hot sale', 'hotsale', 'best seller', 'bestseller', 'top quality', 'free shipping', 'fast shipping',
  'aliexpress', 'dropship', 'dropshipping', 'supplier', 'retail', 'wholesale', 'factory price',
  'oem', 'odm', 'brand new', 'genuine', 'high quality', 'trending', 'popular', '100% new',
  'new arrival', 'store', 'official store', 'global version', 'flagship store', 'direct sales',
  '1atm', '2atm', '3atm', '5atm', 'ip67', 'ip68', 'amoled', 'health monitoring', 'sports modes',
  'voice calling', 'bluetooth', 'wireless'
];

/**
 * Deterministically cleans a raw supplier title into a short, premium product name.
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

  return result || 'Essential Product';
}

/**
 * Extracts or generates a short, elegant brand name (Max 18 chars).
 */
export function cleanBrandName(rawTitleOrStore: string, category?: string): string {
  if (!rawTitleOrStore || typeof rawTitleOrStore !== 'string') {
    return generateFallbackBrandName(category);
  }

  let name = rawTitleOrStore.replace(/\s+Store$/i, '').trim();

  // Strip supplier keywords from brand candidate
  for (const word of SUPPLIER_WORDS) {
    name = name.replace(new RegExp(`\\b${word}\\b`, 'gi'), ' ');
  }
  name = name.replace(/\s+/g, ' ').trim();

  // Take first clean word if it looks like a brand name (3 to 15 chars)
  const firstWord = name.split(/\s+/)[0]?.replace(/[^a-zA-Z0-9]/g, '');
  if (firstWord && firstWord.length >= 3 && firstWord.length <= 15 && !['product', 'item', 'goods', 'shop'].includes(firstWord.toLowerCase())) {
    name = firstWord;
  } else {
    name = generateFallbackBrandName(category);
  }

  name = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  name = name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());

  if (name.length > 18 || name.length < 3) {
    name = generateFallbackBrandName(category);
  }

  return name;
}

function generateFallbackBrandName(category?: string): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('tech') || cat.includes('electronic')) return 'AeroTech';
  if (cat.includes('beauty') || cat.includes('wellness') || cat.includes('soft')) return 'Lumina';
  if (cat.includes('fashion') || cat.includes('apparel')) return 'Maison';
  if (cat.includes('home')) return 'Haven';
  if (cat.includes('pet')) return 'Pawsy';
  if (cat.includes('fitness') || cat.includes('sport')) return 'Apex';
  if (cat.includes('jewelry')) return 'Solstice';
  return 'Verve';
}

/**
 * Generates clean headlines and subheadlines under 60 characters tailored to category.
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

  // Strip supplier words from raw headline
  for (const word of SUPPLIER_WORDS) {
    headline = headline.replace(new RegExp(`\\b${word}\\b`, 'gi'), ' ');
  }
  headline = headline.replace(/\s+/g, ' ').trim();

  // If raw headline is empty, too long (> 60 chars), or contains supplier terms, generate category headline
  if (!headline || headline.length > 60 || headline.length < 10) {
    const cat = category.toLowerCase();
    if (cat.includes('tech')) {
      headline = 'Smarter Technology. Built For Every Day.';
      subheadline = 'Track activity, calls, and daily wellness from one sleek device.';
    } else if (cat.includes('beauty') || cat.includes('wellness') || cat.includes('soft')) {
      headline = 'Pure Hydration for Radiant Skin.';
      subheadline = 'Nourish your skin daily with natural organic botanical extracts.';
    } else if (cat.includes('fitness') || cat.includes('bold')) {
      headline = 'Unleash Your Peak Performance.';
      subheadline = 'Engineered for athletes who demand power, precision, and durability.';
    } else if (cat.includes('luxury') || cat.includes('editorial')) {
      headline = 'Timeless Craftsmanship & Style.';
      subheadline = 'Exquisitely designed with premium materials for effortless elegance.';
    } else if (cat.includes('pet')) {
      headline = 'Gentle Care for Your Best Friend.';
      subheadline = 'Crafted to keep your pets happy, healthy, and comfortable every day.';
    } else if (cat.includes('fashion')) {
      headline = 'Effortless Style. Superior Comfort.';
      subheadline = 'Designed to fit your lifestyle with modern tailoring and premium fabrics.';
    } else {
      headline = 'Elevate Your Daily Routine.';
      subheadline = 'Thoughtfully designed with premium materials for exceptional daily performance.';
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
  const brandName = cleanBrandName(rawStoreName || rawTitle, category);
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
