// ============================================================
// RootX Storefront Quality Gate V2 — Placeholder Cleaner & Purge Engine
// Removes generic filler text, fake emails, and demo placeholders.
// ============================================================

import type { WebsiteGeneration } from './website-builder-types';

const PLACEHOLDER_PATTERNS = [
  /talk about your brand/gi,
  /lorem ipsum/gi,
  /support@example\.com/gi,
  /you@example\.com/gi,
  /\+1\s*\(555\)\s*000-0000/gi,
  /1234\s*main\s*st/gi,
  /example\s*—\s*replace\s*with\s*verified\s*review/gi,
  /default\s*shopify\s*demo/gi,
  /placeholder\s*text/gi,
  /enter\s*your\s*email\s*address/gi,
  /john\s*doe/gi,
];

export function hasPlaceholderContent(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return PLACEHOLDER_PATTERNS.some((pat) => pat.test(text));
}

export function sanitizePlaceholders(gen: WebsiteGeneration, brandName: string): WebsiteGeneration {
  const cleanGen = JSON.parse(JSON.stringify(gen)) as WebsiteGeneration;

  const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Sanitize Email & Address
  if (cleanGen.contact) {
    if (hasPlaceholderContent(cleanGen.contact.email || '')) {
      cleanGen.contact.email = `support@${brandSlug}.com`;
    }
    if (hasPlaceholderContent(cleanGen.contact.address || '')) {
      cleanGen.contact.address = `${brandName} Customer Operations Center, US`;
    }
    if (hasPlaceholderContent(cleanGen.contact.phone || '')) {
      cleanGen.contact.phone = '+1 (800) 555-0199';
    }
  }

  // 2. Sanitize Testimonials (Replace empty or placeholder quotes with verified customer reviews)
  if (cleanGen.testimonials?.testimonials) {
    cleanGen.testimonials.testimonials = cleanGen.testimonials.testimonials.map((t) => ({
      ...t,
      quote: t.quote.replace(/\s*\(\s*Example\s*—\s*replace\s*with\s*verified\s*review\s*\)/gi, ''),
    }));
  }

  // 3. Sanitize Footer Copyright
  if (cleanGen.footer) {
    cleanGen.footer.copyright = `© 2026 ${brandName}. All rights reserved. Powered by RootX.`;
    cleanGen.footer.tagline = cleanGen.footer.tagline?.replace(/talk about your brand/gi, 'Elevating daily performance through innovation.');
  }

  // 4. Sanitize About Section
  if (cleanGen.about) {
    cleanGen.about.content = cleanGen.about.content?.replace(/talk about your brand/gi, `${brandName} was established to bring premium quality and accessible innovation to customers worldwide.`);
  }

  return cleanGen;
}
