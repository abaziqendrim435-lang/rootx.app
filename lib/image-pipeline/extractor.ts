// ============================================================
// RootX Product Image Pipeline V1 — Multi-Field Extractor
// Inspects arbitrary product objects to pull every candidate image URL.
// ============================================================

export interface ExtractedRawImage {
  rawUrl: string;
  sourceField: string;
  altHint?: string;
}

export function extractRawImages(data: unknown): ExtractedRawImage[] {
  const extracted: ExtractedRawImage[] = [];
  const visitedUrls = new Set<string>();

  function addCandidate(url: unknown, fieldName: string, altHint?: string) {
    if (!url) return;
    let strUrl = '';

    if (typeof url === 'string') {
      strUrl = url.trim();
    } else if (typeof url === 'object' && url !== null) {
      const obj = url as Record<string, unknown>;
      strUrl = String(obj.src || obj.url || obj.originalUrl || obj.original || obj.image_url || '').trim();
      altHint = altHint || String(obj.alt || obj.altText || obj.title || '').trim();
    }

    if (strUrl) {
      extracted.push({
        rawUrl: strUrl,
        sourceField: fieldName,
        altHint: altHint || undefined,
      });
    }
  }

  function traverse(obj: unknown, path = '') {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => traverse(item, `${path}[${index}]`));
      return;
    }

    const record = obj as Record<string, unknown>;

    // Direct image fields
    const directFields = [
      'images', 'productImages', 'gallery', 'galleryImages', 'media',
      'imageUrls', 'productMainImageUrl', 'productImage', 'product_image',
      'imageUrl', 'image_url', 'image', 'thumbnail', 'skuImage', 'sku_image',
      'supplierImages', 'featuredImage', 'featured_image', 'src', 'url'
    ];

    for (const key of Object.keys(record)) {
      const currentPath = path ? `${path}.${key}` : key;
      const value = record[key];

      if (directFields.includes(key)) {
        if (Array.isArray(value)) {
          value.forEach((item, i) => addCandidate(item, `${currentPath}[${i}]`));
        } else {
          addCandidate(value, currentPath);
        }
      } else if (key === 'featureSections' && Array.isArray(value)) {
        value.forEach((sec: Record<string, unknown>, i) => {
          if (sec.imageUrl) addCandidate(sec.imageUrl, `${currentPath}[${i}].imageUrl`, String(sec.title || ''));
        });
      } else if (key === 'variants' && Array.isArray(value)) {
        value.forEach((v: Record<string, unknown>, i) => {
          if (v.image) addCandidate(v.image, `${currentPath}[${i}].image`);
          if (v.imageUrl) addCandidate(v.imageUrl, `${currentPath}[${i}].imageUrl`);
          if (v.image_url) addCandidate(v.image_url, `${currentPath}[${i}].image_url`);
          if (v.src) addCandidate(v.src, `${currentPath}[${i}].src`);
        });
      } else if (typeof value === 'object' && value !== null && !currentPath.includes('__')) {
        // Deep nested traversal up to 5 levels
        if (currentPath.split('.').length < 6) {
          traverse(value, currentPath);
        }
      }
    }
  }

  traverse(data);

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Image Pipeline Extractor] Extracted raw candidates count:', extracted.length, {
      sample: extracted.slice(0, 3).map((e) => e.rawUrl),
    });
  }

  return extracted;
}
