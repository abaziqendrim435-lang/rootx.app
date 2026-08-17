// ============================================================
// RootX — Server-only cached ProductImageLibrary builder
// Must not be imported from client components.
// ============================================================

import type { ProductImageLibrary, NormalizedImage } from './types';
import { createProductImageLibrary } from './library-builder';
import { cacheProductImages } from './cache-service';
import { isAcceptedPersistedUrl, isProductionPersistenceRequired } from '../supabase-storage';

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
    if (
      !isProductionPersistenceRequired() &&
      (img.normalizedUrl.startsWith('/cached-images/') || img.originalUrl?.startsWith('/cached-images/'))
    ) {
      return {
        ...img,
        cachedUrl: img.normalizedUrl,
        publicUrl: img.normalizedUrl,
        status: 'cached' as const,
        isValid: true,
      };
    }
    const cached = cachedMap.get(img.normalizedUrl) || cachedMap.get(img.originalUrl);
    if (cached && isAcceptedPersistedUrl(cached.publicUrl || cached.cachedUrl)) return cached;
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
