// ============================================================
// RootX Product Image Pipeline V1 — Quality Ranker
// Deterministic 0-100 image scoring engine.
// ============================================================

import type { NormalizedImage } from './types';

export function scoreImageQuality(image: Partial<NormalizedImage>): number {
  let score = 50;
  const url = (image.normalizedUrl || '').toLowerCase();

  // 1. Manual Upload Bonus
  if (image.source === 'manual' || image.isCustomUpload) {
    score += 25;
  }

  // 2. High-Resolution Indicators
  if (url.includes('800') || url.includes('1000') || url.includes('2048') || url.includes('1024')) {
    score += 20;
  } else if (url.includes('400') || url.includes('600')) {
    score += 10;
  }

  // 3. Aspect Ratio Assessment
  const ar = image.aspectRatio || 1.0;
  if (ar >= 0.8 && ar <= 1.25) {
    // Ideal square or near-square product shot
    score += 15;
  } else if (ar >= 0.75 && ar <= 1.33) {
    // 4:3 or 3:4 portrait/landscape
    score += 10;
  } else if (ar < 0.5 || ar > 2.5) {
    // Extreme banner or thin strip
    score -= 25;
  }

  // 4. Watermark & Non-Product Penalty Keywords
  const badKeywords = ['watermark', 'banner', 'logo', 'size_chart', 'sizechart', 'table', 'shipping', 'diagram', 'certificate'];
  for (const kw of badKeywords) {
    if (url.includes(kw)) {
      score -= 30;
      break;
    }
  }

  // 5. Preferred File Extensions
  if (url.includes('.webp') || url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg')) {
    score += 10;
  } else if (url.endsWith('.gif')) {
    score -= 10;
  }

  // Bound score between 0 and 100
  return Math.min(100, Math.max(0, Math.round(score)));
}
