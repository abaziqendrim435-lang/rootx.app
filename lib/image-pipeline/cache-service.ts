// ============================================================
// RootX — Persistent Server-Side Image Cache Service V2
// Downloads supplier images, then persists them to Supabase Storage
// (production) or local public/cached-images (development only).
// Raw AliExpress URLs are never treated as "cached".
// ============================================================

import type { NormalizedImage } from './types';
import {
  isAcceptedPersistedUrl,
  isDurablePersistedUrl,
  isProductionPersistenceRequired,
  uploadProductImage,
  PRODUCT_IMAGE_BUCKET,
} from '../supabase-storage';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const DOWNLOAD_TIMEOUT_MS = 12_000;

export interface CacheBatchResult {
  cachedImages: NormalizedImage[];
  failedImages: Array<{ originalUrl: string; reason: string }>;
  cachedCount: number;
  failedCount: number;
  generationId: string;
}

export function detectImageMimeAndExt(buffer: Buffer, headerContentType?: string): { mimeType: string; ext: string } {
  const mime = (headerContentType || '').toLowerCase().split(';')[0].trim();

  if (mime === 'image/jpeg' || mime === 'image/jpg') return { mimeType: 'image/jpeg', ext: '.jpg' };
  if (mime === 'image/png') return { mimeType: 'image/png', ext: '.png' };
  if (mime === 'image/webp') return { mimeType: 'image/webp', ext: '.webp' };
  if (mime === 'image/gif') return { mimeType: 'image/gif', ext: '.gif' };
  if (mime === 'image/avif') return { mimeType: 'image/avif', ext: '.avif' };

  if (buffer.length >= 4) {
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return { mimeType: 'image/jpeg', ext: '.jpg' };
    }
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return { mimeType: 'image/png', ext: '.png' };
    }
    if (buffer.length >= 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return { mimeType: 'image/webp', ext: '.webp' };
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return { mimeType: 'image/gif', ext: '.gif' };
    }
  }

  return { mimeType: 'image/jpeg', ext: '.jpg' };
}

function failedImage(img: NormalizedImage, reason: string): NormalizedImage {
  return {
    ...img,
    status: 'failed',
    isValid: false,
    rejectionReason: reason,
  };
}

export async function cacheSingleImage(
  img: NormalizedImage,
  generationId: string,
  index: number
): Promise<NormalizedImage> {
  const rawUrl = img.normalizedUrl || img.originalUrl;
  const indexStr = String(index + 1).padStart(2, '0');
  const production = isProductionPersistenceRequired();

  try {
    if (isDurablePersistedUrl(rawUrl) || isDurablePersistedUrl(img.publicUrl) || isDurablePersistedUrl(img.cachedUrl)) {
      const durable = (isDurablePersistedUrl(img.publicUrl) && img.publicUrl)
        || (isDurablePersistedUrl(img.cachedUrl) && img.cachedUrl)
        || rawUrl;
      return {
        ...img,
        cachedUrl: durable,
        publicUrl: durable,
        status: 'cached',
        isValid: true,
      };
    }

    if (rawUrl.startsWith('/cached-images/') || rawUrl.startsWith('cached-images/')) {
      if (production) {
        return failedImage(img, 'Relative /cached-images/ paths are not durable in production');
      }
      const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
      let byteSize = 800;
      const mimeType = cleanPath.endsWith('.avif')
        ? 'image/avif'
        : cleanPath.endsWith('.webp')
          ? 'image/webp'
          : cleanPath.endsWith('.png')
            ? 'image/png'
            : 'image/jpeg';
      try {
        const fsMod = await import('fs/promises');
        const pathMod = await import('path');
        const localFilePath = pathMod.join(process.cwd(), 'public', cleanPath.replace(/^\//, ''));
        const stat = await fsMod.stat(localFilePath);
        byteSize = stat.size;
      } catch {
        // Path registered; byte size optional in local dev
      }
      return {
        ...img,
        cachedUrl: cleanPath,
        publicUrl: cleanPath,
        mimeType,
        byteSize,
        status: 'cached',
        isValid: true,
      };
    }

    let buffer: Buffer;
    let headerMime = 'image/jpeg';

    if (rawUrl.startsWith('data:image/')) {
      const parts = rawUrl.split(';base64,');
      if (parts.length !== 2) throw new Error('Invalid base64 data URI format');
      headerMime = parts[0].replace('data:', '').trim().toLowerCase();
      buffer = Buffer.from(parts[1].trim(), 'base64');
    } else {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

      const response = await fetch(rawUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      headerMime = response.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    if (buffer.length === 0) {
      throw new Error('Downloaded image buffer is zero bytes');
    }
    if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
      throw new Error(`Image size (${Math.round(buffer.length / 1024 / 1024)}MB) exceeds 10MB limit`);
    }

    const { mimeType, ext } = detectImageMimeAndExt(buffer, headerMime);
    const filename = `image-${indexStr}${ext}`;

    let cachedUrl = '';
    let publicUrl = '';
    let storagePath = `${PRODUCT_IMAGE_BUCKET}/${generationId}/${filename}`;

    try {
      const uploaded = await uploadProductImage({
        generationId,
        filename,
        buffer,
        mimeType,
      });
      publicUrl = uploaded.publicUrl;
      cachedUrl = uploaded.publicUrl;
      storagePath = uploaded.storagePath;
    } catch (uploadErr: unknown) {
      const uploadMsg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
      if (production) {
        throw new Error(uploadMsg);
      }
      console.warn(`[Cache Service] Supabase upload unavailable (${uploadMsg}). Using local dev cache.`);
    }

    if (!cachedUrl && !production && typeof window === 'undefined') {
      const fsMod = await import('fs/promises');
      const pathMod = await import('path');
      const localDir = pathMod.join(process.cwd(), 'public', 'cached-images', generationId);
      await fsMod.mkdir(localDir, { recursive: true });
      const filePath = pathMod.join(localDir, filename);
      await fsMod.writeFile(filePath, buffer);
      cachedUrl = `/cached-images/${generationId}/${filename}`;
    }

    if (!isAcceptedPersistedUrl(publicUrl || cachedUrl)) {
      throw new Error(
        production
          ? 'Production persistence requires a public HTTPS Storage URL'
          : 'Image was downloaded but could not be persisted to Storage or local cache'
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Cache Service] Cached image trace:`, {
        originalUrl: img.originalUrl || rawUrl,
        cachedUrl,
        storagePath,
        publicUrl: publicUrl || cachedUrl,
        mimeType,
        status: 'cached',
      });
    }

    return {
      ...img,
      cachedUrl,
      publicUrl: publicUrl || cachedUrl,
      storagePath,
      mimeType,
      byteSize: buffer.length,
      status: 'cached',
      isValid: true,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Cache Service] Failed to persist image (${rawUrl.slice(0, 60)}...): ${errMsg}`);
    return failedImage(img, errMsg);
  }
}

export async function cacheProductImages(
  images: NormalizedImage[],
  generationId: string
): Promise<CacheBatchResult> {
  console.log(`[Cache Service] Beginning server-side image caching for Generation ID: ${generationId} (${images.length} images)...`);

  const cachedImages: NormalizedImage[] = [];
  const failedImages: Array<{ originalUrl: string; reason: string }> = [];

  for (let i = 0; i < images.length; i++) {
    const res = await cacheSingleImage(images[i], generationId, i);
    if (res.status === 'cached' && isAcceptedPersistedUrl(res.publicUrl || res.cachedUrl)) {
      cachedImages.push(res);
    } else {
      failedImages.push({
        originalUrl: images[i].originalUrl || images[i].normalizedUrl,
        reason: res.rejectionReason || 'Failed to download or persist image',
      });
    }
  }

  console.log(`[Cache Service] Caching Complete: ${cachedImages.length} cached, ${failedImages.length} failed.`);

  return {
    cachedImages,
    failedImages,
    cachedCount: cachedImages.length,
    failedCount: failedImages.length,
    generationId,
  };
}
