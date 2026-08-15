// ============================================================
// RootX Product Image Pipeline V2 — Canonical Library Builder
// Constructs the single persistent ProductImageLibrary object ONCE from product import.
// ============================================================

import type { ProductImageLibrary, NormalizedImage, ImageSourceType } from './types';
import { extractRawImages } from './extractor';
import { normalizeImageUrl } from './normalizer';
import { validateImage } from './validator';
import { scoreImageQuality } from './ranker';
import { cacheProductImages } from './cache-service';

export function createProductImageLibrary(productData: unknown, customGenId?: string): ProductImageLibrary {
  const generationId = customGenId || `gen_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
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

    const validation = validateImage(normalizedUrl, seenUrls, candidate.sourceField);
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
      status: 'pending',
    };

    const qualityScore = scoreImageQuality(initialImg);

    allValidImages.push({
      ...initialImg,
      qualityScore,
    } as NormalizedImage);
  });

  // Keep allValidImages in exact sequence from source product to preserve image order
  const heroCandidates = allValidImages.filter((img) => img.qualityScore >= 70);
  const galleryCandidates = [...allValidImages];
  const lifestyleCandidates = allValidImages.filter((img) => img.aspectRatio > 1.1 || img.altText.toLowerCase().includes('lifestyle') || img.altText.toLowerCase().includes('model'));
  const detailCandidates = allValidImages.filter((img) => img.altText.toLowerCase().includes('detail') || img.altText.toLowerCase().includes('spec') || img.altText.toLowerCase().includes('close'));

  return {
    generationId,
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
    cachedImageCount: 0,
    failedImageCount: 0,
  };
}

export async function buildCachedProductImageLibrary(
  productData: unknown,
  customGenId?: string
): Promise<ProductImageLibrary> {
  const lib = createProductImageLibrary(productData, customGenId);
  const genId = lib.generationId || `gen_${Date.now()}`;

  if (lib.allValidImages.length === 0) {
    return lib;
  }

  const cacheResult = await cacheProductImages(lib.allValidImages, genId);
  const cachedMap = new Map<string, NormalizedImage>();
  cacheResult.cachedImages.forEach((img) => {
    cachedMap.set(img.normalizedUrl, img);
    if (img.originalUrl) cachedMap.set(img.originalUrl, img);
  });

  const updatedValidImages = lib.allValidImages.map((img) => {
    if (img.normalizedUrl.startsWith('/cached-images/') || img.originalUrl?.startsWith('/cached-images/')) {
      return {
        ...img,
        cachedUrl: img.normalizedUrl,
        publicUrl: img.normalizedUrl,
        status: 'cached' as const,
        isValid: true,
      };
    }
    const cached = cachedMap.get(img.normalizedUrl) || cachedMap.get(img.originalUrl);
    if (cached) return cached;
    return {
      ...img,
      status: 'failed' as const,
      isValid: false,
    };
  });

  const validOnly = updatedValidImages.filter((img) => img.status === 'cached');
  const heroCandidates = validOnly.filter((img) => img.qualityScore >= 70);

  return {
    ...lib,
    allValidImages: validOnly,
    heroCandidates: heroCandidates.length > 0 ? heroCandidates : validOnly,
    galleryCandidates: validOnly,
    lifestyleCandidates: validOnly,
    detailCandidates: validOnly,
    rejectedImages: [
      ...lib.rejectedImages,
      ...cacheResult.failedImages.map((f) => ({ url: f.originalUrl, reason: f.reason })),
    ],
    cachedImageCount: cacheResult.cachedCount,
    failedImageCount: cacheResult.failedCount,
  };
}
