// ============================================================
// RootX Product Image Pipeline V1 — Server-Side Asset Downloader
// Downloads, validates, packages, and maps product images to local
// Shopify theme assets (`assets/rootx-product-XX.ext`).
// ============================================================

import type { StorefrontSpec, StorefrontSectionSpec } from '../storefront-spec/types';
import type { NormalizedImage } from './types';

export interface DownloadStats {
  rawImageCount: number;
  downloadedAssetCount: number;
  failedImageCount: number;
  generatedAssetFilenames: string[];
  totalBytesDownloaded: number;
}

export interface PackageImagesResult {
  assetFiles: Map<string, Buffer>;
  updatedSpec: StorefrontSpec;
  stats: DownloadStats;
}

// SSRF Protection: Block localhost and private IP ranges
const BLOCKED_IP_REGEX = /^(https?:\/\/)?(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|::1|fc00:)/i;

const SUPPORTED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
const DOWNLOAD_TIMEOUT_MS = 10000; // 10 seconds timeout

export async function downloadAndPackageProductImages(
  spec: StorefrontSpec
): Promise<PackageImagesResult> {
  const assetFiles = new Map<string, Buffer>();
  const stats: DownloadStats = {
    rawImageCount: 0,
    downloadedAssetCount: 0,
    failedImageCount: 0,
    generatedAssetFilenames: [],
    totalBytesDownloaded: 0,
  };

  // 1. Gather all unique image candidates across all spec assignments
  const rawCandidateImages: NormalizedImage[] = [];
  const seenUrls = new Set<string>();

  const pushIfValid = (img: NormalizedImage | null | undefined) => {
    if (!img || !img.normalizedUrl) return;
    if (seenUrls.has(img.normalizedUrl)) return;
    seenUrls.add(img.normalizedUrl);
    rawCandidateImages.push(img);
  };

  pushIfValid(spec.images.hero);
  pushIfValid(spec.images.featured);
  pushIfValid(spec.images.story);
  pushIfValid(spec.images.finalCta);
  (spec.images.gallery || []).forEach(pushIfValid);

  stats.rawImageCount = rawCandidateImages.length;

  if (rawCandidateImages.length === 0) {
    throw new Error('Export Failed: StorefrontSpec contains zero valid product images.');
  }

  // Map from original normalizedUrl -> downloaded local asset filename
  const urlToAssetMap = new Map<string, { filename: string; buffer: Buffer }>();
  let downloadedIndex = 1;

  // 2. Download and validate each image server-side
  for (const imgCandidate of rawCandidateImages) {
    const rawUrl = imgCandidate.normalizedUrl;

    try {
      // Handle base64 data URLs directly (used in offline/test environments)
      if (rawUrl.startsWith('data:image/')) {
        const parts = rawUrl.split(';base64,');
        if (parts.length !== 2) {
          throw new Error('Invalid base64 image data URL format.');
        }
        const mimeType = parts[0].replace('data:', '').trim().toLowerCase();
        const base64Data = parts[1].trim();
        const ext = SUPPORTED_MIME_TYPES[mimeType] || '.jpg';
        const buffer = Buffer.from(base64Data, 'base64');

        if (buffer.length === 0) throw new Error('Base64 image buffer is zero bytes.');
        if (buffer.length > MAX_IMAGE_SIZE_BYTES) throw new Error('Image exceeds 10MB limit.');

        const indexStr = String(downloadedIndex).padStart(2, '0');
        const filename = `rootx-product-${indexStr}${ext}`;
        urlToAssetMap.set(rawUrl, { filename, buffer });
        assetFiles.set(`assets/${filename}`, buffer);
        stats.generatedAssetFilenames.push(filename);
        stats.totalBytesDownloaded += buffer.length;
        stats.downloadedAssetCount++;
        downloadedIndex++;
        continue;
      }

      // Validate URL scheme & SSRF protection
      if (!rawUrl.startsWith('https://')) {
        throw new Error(`Insecure image URL scheme: ${rawUrl}`);
      }
      if (BLOCKED_IP_REGEX.test(rawUrl)) {
        throw new Error(`SSRF Blocked: Private/Localhost image URL detected: ${rawUrl}`);
      }

      // Fetch server-side with timeout & redirect limit
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

      const res = await fetch(rawUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      }

      const contentType = (res.headers.get('content-type') || '').toLowerCase().split(';')[0].trim();
      let ext = SUPPORTED_MIME_TYPES[contentType];

      if (!ext) {
        // Fallback: check extension from URL path
        if (rawUrl.match(/\.(png)(\?.*)?$/i)) ext = '.png';
        else if (rawUrl.match(/\.(webp)(\?.*)?$/i)) ext = '.webp';
        else if (rawUrl.match(/\.(jpg|jpeg)(\?.*)?$/i)) ext = '.jpg';
        else {
          throw new Error(`Unsupported image MIME type: '${contentType}'`);
        }
      }

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length === 0) {
        throw new Error('Downloaded image file is zero-byte.');
      }
      if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
        throw new Error(`Image size (${Math.round(buffer.length / 1024 / 1024)}MB) exceeds maximum limit of 10MB.`);
      }

      const indexStr = String(downloadedIndex).padStart(2, '0');
      const filename = `rootx-product-${indexStr}${ext}`;

      urlToAssetMap.set(rawUrl, { filename, buffer });
      assetFiles.set(`assets/${filename}`, buffer);
      stats.generatedAssetFilenames.push(filename);
      stats.totalBytesDownloaded += buffer.length;
      stats.downloadedAssetCount++;
      downloadedIndex++;
    } catch (err: unknown) {
      stats.failedImageCount++;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[Asset Downloader] Skipped failed image (${rawUrl}): ${errMsg}`);
    }
  }

  // If ALL image downloads fail, block export
  if (urlToAssetMap.size === 0) {
    throw new Error('Export Failed: Unable to download product images server-side. Please verify product image URLs.');
  }

  // 3. Update StorefrontSpec image assignments with local asset references
  const updatedSpec = JSON.parse(JSON.stringify(spec)) as StorefrontSpec;

  const mapImage = (img: NormalizedImage | null): NormalizedImage | null => {
    if (!img) return null;
    const downloaded = urlToAssetMap.get(img.normalizedUrl);
    if (!downloaded) return null; // Exclude failed images
    return {
      ...img,
      normalizedUrl: downloaded.filename,
      exportedAssetName: downloaded.filename,
    };
  };

  updatedSpec.images.hero = mapImage(spec.images.hero);
  updatedSpec.images.featured = mapImage(spec.images.featured);
  updatedSpec.images.story = mapImage(spec.images.story);
  updatedSpec.images.finalCta = mapImage(spec.images.finalCta);

  const downloadedGallery = (spec.images.gallery || [])
    .map(mapImage)
    .filter((img): img is NormalizedImage => img !== null);

  // Fallback: Ensure hero is set if primary hero failed but gallery succeeded
  if (!updatedSpec.images.hero && downloadedGallery.length > 0) {
    updatedSpec.images.hero = downloadedGallery[0];
  }

  updatedSpec.images.gallery = downloadedGallery;

  // 4. Update Section Spec Blocks for local asset settings
  const galleryAssetBlocks = downloadedGallery.map((img, i) => ({
    id: `image_${i + 1}`,
    type: 'image',
    settings: {
      image_url: img.exportedAssetName || img.normalizedUrl,
      alt_text: img.altText || updatedSpec.product.cleanName,
    },
  }));

  updatedSpec.sections = updatedSpec.sections.map((sec) => {
    const isGallerySec = sec.id === 'rootx-gallery' || sec.id === 'rootx-main-product' || sec.id === 'rootx-hero';
    const heroAsset = updatedSpec.images.hero?.exportedAssetName || updatedSpec.images.hero?.normalizedUrl || '';

    return {
      ...sec,
      settings: {
        ...sec.settings,
        hero_image: heroAsset,
      },
      blocks: isGallerySec ? galleryAssetBlocks : sec.blocks,
    };
  });

  return {
    assetFiles,
    updatedSpec,
    stats,
  };
}
