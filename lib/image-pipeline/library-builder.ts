// ============================================================
// RootX Product Image Pipeline V2 — Canonical Library Builder
// Constructs the single persistent ProductImageLibrary object ONCE from product import.
// ============================================================

import type { ProductImageLibrary, NormalizedImage, ImageSourceType } from './types';
import { extractRawImages } from './extractor';
import { normalizeImageUrl } from './normalizer';
import { validateImage } from './validator';
import { scoreImageQuality } from './ranker';

export function createProductImageLibrary(productData: unknown): ProductImageLibrary {
  const rawCandidates = extractRawImages(productData);
  const seenUrls = new Set<string>();
  const allValidImages: NormalizedImage[] = [];
  const rejectedImages: Array<{ url: string; reason: string }> = [];

  rawCandidates.forEach((candidate, idx) => {
    const { normalizedUrl, source } = normalizeImageUrl(candidate.rawUrl);
    if (!normalizedUrl) {
      rejectedImages.push({ url: candidate.rawUrl, reason: 'Empty or invalid URL format' });
      return;
    }

    const validation = validateImage(normalizedUrl, seenUrls);
    if (!validation.isValid) {
      rejectedImages.push({ url: normalizedUrl, reason: validation.reason || 'Failed validation check' });
      return;
    }

    seenUrls.add(normalizedUrl);

    const initialImg: Partial<NormalizedImage> = {
      id: `img_${idx + 1}_${Date.now().toString(36)}`,
      originalUrl: candidate.rawUrl,
      normalizedUrl,
      width: 800,
      height: 800,
      aspectRatio: 1.0,
      source: source as ImageSourceType,
      altText: candidate.altHint || `Product image ${idx + 1}`,
      role: 'unassigned',
      isValid: true,
    };

    const qualityScore = scoreImageQuality(initialImg);

    allValidImages.push({
      ...initialImg,
      qualityScore,
    } as NormalizedImage);
  });

  // Sort descending by quality score
  allValidImages.sort((a, b) => b.qualityScore - a.qualityScore);

  // Group candidate categories
  const heroCandidates = allValidImages.filter((img) => img.qualityScore >= 70);
  const galleryCandidates = [...allValidImages];
  const lifestyleCandidates = allValidImages.filter((img) => img.aspectRatio > 1.1 || img.altText.toLowerCase().includes('lifestyle') || img.altText.toLowerCase().includes('model'));
  const detailCandidates = allValidImages.filter((img) => img.altText.toLowerCase().includes('detail') || img.altText.toLowerCase().includes('spec') || img.altText.toLowerCase().includes('close'));

  return {
    allValidImages,
    heroCandidates: heroCandidates.length > 0 ? heroCandidates : allValidImages,
    galleryCandidates,
    lifestyleCandidates: lifestyleCandidates.length > 0 ? lifestyleCandidates : allValidImages,
    detailCandidates: detailCandidates.length > 0 ? detailCandidates : allValidImages,
    rejectedImages,
    imageMetadata: {
      extractedCount: rawCandidates.length,
      timestamp: new Date().toISOString(),
    },
    originalSourceCount: rawCandidates.length,
    validUniqueCount: allValidImages.length,
  };
}
