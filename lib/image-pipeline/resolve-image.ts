// ============================================================
// RootX Product Image Pipeline — Canonical Image Resolution Helper
// Deterministically resolves the highest-priority renderable image URL.
// ============================================================

import type { NormalizedImage } from './types';

/**
 * Priority Order:
 * 1. publicUrl (Persistent Supabase CDN / public URL)
 * 2. cachedUrl (Cached persistent / local cache URL)
 * 3. exportedAssetName (Local packaged Shopify theme asset name e.g. rootx-product-01.jpg)
 * 4. normalizedUrl (Cleaned supplier URL)
 * 5. originalUrl (Raw supplier URL as explicit fallback)
 */
export function resolveRenderableImage(
  image: Partial<NormalizedImage> | string | null | undefined
): string {
  if (!image) return '';

  if (typeof image === 'string') {
    return image.trim();
  }

  if (image.publicUrl && image.publicUrl.trim().length > 0) {
    return image.publicUrl.trim();
  }

  if (image.cachedUrl && image.cachedUrl.trim().length > 0) {
    return image.cachedUrl.trim();
  }

  if (image.exportedAssetName && image.exportedAssetName.trim().length > 0) {
    return image.exportedAssetName.trim();
  }

  if (image.normalizedUrl && image.normalizedUrl.trim().length > 0) {
    return image.normalizedUrl.trim();
  }

  if (image.originalUrl && image.originalUrl.trim().length > 0) {
    return image.originalUrl.trim();
  }

  return '';
}
