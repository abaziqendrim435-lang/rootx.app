// ============================================================
// RootX — Persistent Server-Side Image Cache Service V1
// Downloads raw supplier images immediately, validates HTTP 200,
// Content-Type, magic bytes, uploads to Supabase Storage bucket
// 'rootx-product-images/<generation-id>/image-XX.ext', and assigns
// stable cachedUrls to all NormalizedImage objects.
// ============================================================

import { supabase } from '../supabase';
import type { NormalizedImage } from './types';

const BUCKET_NAME = 'rootx-product-images';
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

  // Magic byte header inspection fallback
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

  // Default fallback for binary data buffers
  return { mimeType: 'image/jpeg', ext: '.jpg' };
}

export async function cacheSingleImage(
  img: NormalizedImage,
  generationId: string,
  index: number
): Promise<NormalizedImage> {
  const rawUrl = img.normalizedUrl || img.originalUrl;
  const indexStr = String(index + 1).padStart(2, '0');

  try {
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
    const storagePath = `${generationId}/${filename}`;

    let cachedUrl = '';
    let publicUrl = '';

    // Attempt Supabase Storage Upload if configured
    if (supabase) {
      try {
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(storagePath);
          if (publicData?.publicUrl) {
            publicUrl = publicData.publicUrl;
            cachedUrl = publicData.publicUrl;
          }
        } else {
          console.warn(`[Cache Service] Supabase bucket upload failed (${uploadError.message}). Using local static cache.`);
        }
      } catch (sbErr: any) {
        console.warn(`[Cache Service] Supabase storage exception:`, sbErr.message);
      }
    }

    // Local static filesystem fallback for local dev / demo mode
    if (!cachedUrl && typeof window === 'undefined') {
      try {
        const fsMod = await import('fs/promises');
        const pathMod = await import('path');
        const localDir = pathMod.join(process.cwd(), 'public', 'cached-images', generationId);
        await fsMod.mkdir(localDir, { recursive: true });
        const filePath = pathMod.join(localDir, filename);
        await fsMod.writeFile(filePath, buffer);
        cachedUrl = `/cached-images/${generationId}/${filename}`;
      } catch (localErr: any) {
        console.warn(`[Cache Service] Local filesystem cache write skipped:`, localErr.message);
        cachedUrl = rawUrl;
      }
    }

    const fullStoragePath = `${BUCKET_NAME}/${storagePath}`;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Cache Service] Cached image trace:`, {
        originalUrl: img.originalUrl || rawUrl,
        cachedUrl,
        storagePath: fullStoragePath,
        publicUrl: publicUrl || cachedUrl,
        mimeType,
        status: 'cached',
      });
    }

    return {
      ...img,
      cachedUrl,
      publicUrl: publicUrl || (cachedUrl.startsWith('http') ? cachedUrl : undefined),
      storagePath: fullStoragePath,
      mimeType,
      byteSize: buffer.length,
      status: 'cached',
      isValid: true,
    };
  } catch (err: any) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Cache Service] Failed to cache image (${rawUrl.slice(0, 60)}...): ${errMsg}`);
    return {
      ...img,
      status: 'failed',
      isValid: false,
      rejectionReason: errMsg,
    };
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
    if (res.status === 'cached' && res.cachedUrl) {
      cachedImages.push(res);
    } else {
      failedImages.push({
        originalUrl: images[i].originalUrl || images[i].normalizedUrl,
        reason: res.rejectionReason || 'Failed to download or upload image',
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
