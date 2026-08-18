// ============================================================
// RootX Product Image Pipeline V2 — Canonical Library Builder
// Constructs the single persistent ProductImageLibrary object ONCE from product import.
// ============================================================

import type { ProductImageLibrary, NormalizedImage, ImageSourceType } from './types';
import { extractRawImages } from './extractor';
import { normalizeImageUrl } from './normalizer';
import { validateImage } from './validator';
import { scoreImageQuality } from './ranker';
import { isAcceptedPersistedUrl } from '../supabase-storage';
import { PRODUCT_CACHE_SCHEMA_VERSION } from '../product-identity';

export function getPersistedLibraryUrl(img: Pick<NormalizedImage, 'publicUrl' | 'cachedUrl' | 'normalizedUrl'>): string {
  if (isAcceptedPersistedUrl(img.publicUrl)) return img.publicUrl as string;
  if (isAcceptedPersistedUrl(img.cachedUrl)) return img.cachedUrl as string;
  return '';
}

export function isReusableProductImageLibrary(
  lib: ProductImageLibrary | null | undefined,
  expectedImageCount?: number,
  productId?: string | null
): lib is ProductImageLibrary {
  if (!lib || !Array.isArray(lib.allValidImages) || lib.allValidImages.length === 0) {
    return false;
  }
  if (lib.schemaVersion !== PRODUCT_CACHE_SCHEMA_VERSION) {
    return false;
  }
  if (productId && lib.productId !== productId) {
    return false;
  }
  if (typeof expectedImageCount === 'number' && lib.allValidImages.length !== expectedImageCount) {
    return false;
  }
  if ((lib.cachedImageCount || 0) !== lib.allValidImages.length) {
    return false;
  }
  return lib.allValidImages.every((img) => isAcceptedPersistedUrl(getPersistedLibraryUrl(img)));
}

export function assertLibraryFullyPersisted(lib: ProductImageLibrary, sourceCount: number): void {
  const persisted = lib.cachedImageCount || 0;
  const unique = lib.validUniqueCount || lib.allValidImages.length;
  if (sourceCount > 0 && unique !== sourceCount) {
    throw new Error(
      `[PERSISTENCE FAILED] Unique extracted count (${unique}) does not match source count (${sourceCount}).`
    );
  }
  if (persisted !== unique) {
    throw new Error(
      `[PERSISTENCE FAILED] EXTRACTED=${unique} PERSISTED=${persisted}. Every unique product image must be persisted.`
    );
  }
  const missingDurable = lib.allValidImages.filter((img) => !isAcceptedPersistedUrl(getPersistedLibraryUrl(img)));
  if (missingDurable.length > 0) {
    throw new Error(
      `[PERSISTENCE FAILED] ${missingDurable.length} image(s) lack a durable persisted URL.`
    );
  }
}

export function createProductImageLibrary(productData: unknown, customGenId?: string): ProductImageLibrary {
  const generationId = customGenId || `gen_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const meta =
    productData && typeof productData === 'object' && !Array.isArray(productData)
      ? (productData as Record<string, unknown>)
      : null;
  const productId =
    (typeof meta?.productId === 'string' && meta.productId) ||
    (typeof meta?.product_id === 'string' && meta.product_id) ||
    null;
  const sourceUrl =
    (typeof meta?.sourceUrl === 'string' && meta.sourceUrl) ||
    (typeof meta?.url === 'string' && meta.url) ||
    null;
  const selectionSessionId =
    typeof meta?.selectionSessionId === 'string' ? meta.selectionSessionId : null;
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
    schemaVersion: PRODUCT_CACHE_SCHEMA_VERSION,
    productId,
    sourceUrl,
    selectionSessionId,
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
