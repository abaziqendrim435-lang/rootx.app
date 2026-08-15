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
    const trimmed = image.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')) {
      return trimmed;
    }
    if (trimmed.startsWith('/cached-images/') || trimmed.startsWith('cached-images/')) {
      return ''; // Ignore relative cached paths in favor of public HTTP URLs
    }
    return trimmed;
  }

  // 1. Persistent Public HTTP URL (e.g. Supabase Storage CDN)
  if (image.publicUrl && (image.publicUrl.startsWith('http://') || image.publicUrl.startsWith('https://'))) {
    return image.publicUrl.trim();
  }

  // 2. Persistent Cached HTTP URL
  if (image.cachedUrl && (image.cachedUrl.startsWith('http://') || image.cachedUrl.startsWith('https://'))) {
    return image.cachedUrl.trim();
  }

  // 3. Local packaged Shopify theme asset name (for ZIP exports e.g. rootx-product-01.jpg)
  if (image.exportedAssetName && image.exportedAssetName.trim().length > 0 && !image.exportedAssetName.startsWith('/')) {
    return image.exportedAssetName.trim();
  }

  // 4. Cleaned Supplier CDN URL (e.g. https://ae01.alicdn.com/kf/...)
  if (image.normalizedUrl && (image.normalizedUrl.startsWith('http://') || image.normalizedUrl.startsWith('https://') || image.normalizedUrl.startsWith('data:image/'))) {
    return image.normalizedUrl.trim();
  }

  // 5. Raw Supplier URL Fallback
  if (image.originalUrl && (image.originalUrl.startsWith('http://') || image.originalUrl.startsWith('https://') || image.originalUrl.startsWith('data:image/'))) {
    return image.originalUrl.trim();
  }

  return '';
}
