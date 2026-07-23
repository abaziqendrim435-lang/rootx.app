// ============================================================
// RootX Product Image Pipeline V1 — URL Normalizer
// Protocol-relative fix, CDN high-res conversion, query sanitization.
// ============================================================

import type { ImageSourceType } from './types';

export interface NormalizedUrlResult {
  normalizedUrl: string;
  source: ImageSourceType;
  inferredWidth?: number;
  inferredHeight?: number;
}

export function normalizeImageUrl(rawUrl: string): NormalizedUrlResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { normalizedUrl: '', source: 'unknown' };
  }

  let url = rawUrl.trim();

  // Handle data URIs (manual uploads / base64)
  if (url.startsWith('data:image/')) {
    return {
      normalizedUrl: url,
      source: 'manual',
      inferredWidth: 800,
      inferredHeight: 800,
    };
  }

  // Convert protocol-relative URLs beginning with // to https://
  if (url.startsWith('//')) {
    url = `https:${url}`;
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // If missing scheme and doesn't start with /, prefix https://
    if (!url.startsWith('/')) {
      url = `https://${url}`;
    }
  }

  // Detect Source Provider
  let source: ImageSourceType = 'remote';
  if (url.includes('alicdn.com') || url.includes('aliexpress')) {
    source = 'aliexpress';
  } else if (url.includes('cdn.shopify.com') || url.includes('myshopify.com')) {
    source = 'shopify';
  }

  // Source-specific high-resolution normalization
  if (source === 'aliexpress') {
    // 1. Strip query / sizing parameters appended after valid image extensions (e.g. .jpg_640x640.jpg -> .jpg)
    url = url.replace(/\.(jpg|jpeg|png|webp)_.*$/gi, '.$1');
    // 2. Convert raw _220x220.jpg -> .jpg
    url = url.replace(/_\d+x\d+\.(jpg|jpeg|png|webp)$/gi, '.$1');
    // 3. Strip trailing _.webp
    url = url.replace(/_\.webp$/gi, '');
  } else if (source === 'shopify') {
    // Convert Shopify sizing suffixes like _small.jpg, _100x100.jpg to full-size
    url = url.replace(/_(pico|icon|thumb|small|compact|medium|large|gran|1024x1024|2048x2048)\.(jpg|jpeg|png|webp)/gi, '.$2');
    url = url.replace(/_\d+x\d+@\d+x\.(jpg|jpeg|png|webp)/gi, '.$1');
  }

  // Clean any accidental duplicate extensions (e.g. .jpg.jpg)
  url = url.replace(/\.(jpg|jpeg|png|webp)\.(jpg|jpeg|png|webp)$/gi, '.$1');

  // Remove non-essential tracking parameters while keeping signed URL tokens
  try {
    const parsed = new URL(url);
    const paramsToStrip = ['_t', 'utm_source', 'utm_medium', 'utm_campaign', 'spm', 'scm'];
    paramsToStrip.forEach((p) => parsed.searchParams.delete(p));
    url = parsed.toString();
  } catch {
    // Fall back to clean regex replacement if URL constructor fails
    url = url.replace(/([?&])(_t|spm|scm|utm_[^=]+)=[^&]*&?/gi, '$1').replace(/[?&]$/, '');
  }

  return {
    normalizedUrl: url,
    source,
    inferredWidth: 800,
    inferredHeight: 800,
  };
}
