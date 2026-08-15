// ============================================================
// RootX Product Image Pipeline V2 — Theme Image Reassigner
// Takes canonical ProductImageLibrary and recalculates ThemeImageAssignments
// for the selected theme family without discarding any valid images.
// ============================================================

import type { ProductImageLibrary, ThemeImageAssignments, NormalizedImage } from './types';
import type { DesignArchetypeId } from '../website-builder-types';

import type { ProductImageLibrary, ThemeImageAssignments, NormalizedImage, AIImageSelections } from './types';
import type { DesignArchetypeId } from '../website-builder-types';
import { isForbiddenOrExternalUrl } from './validator';

/**
 * Deterministically resolves an image from ProductImageLibrary using an index, ID, or valid library URL.
 * Rejects external, unlisted, or social/video URLs (such as youtube.com) and falls back to a valid library image.
 */
export function resolveImageFromLibrary(
  imageLibrary: ProductImageLibrary,
  indexOrIdOrUrl: number | string | undefined,
  fallbackIndex: number = 0,
  rejectedLog?: string[]
): NormalizedImage | null {
  const valid = imageLibrary.allValidImages || [];
  if (valid.length === 0) return null;

  if (typeof indexOrIdOrUrl === 'number') {
    if (indexOrIdOrUrl >= 0 && indexOrIdOrUrl < valid.length) {
      return valid[indexOrIdOrUrl];
    }
  } else if (typeof indexOrIdOrUrl === 'string' && indexOrIdOrUrl.trim()) {
    const val = indexOrIdOrUrl.trim();

    // 1. Match by ID
    const foundById = valid.find((img) => img.id === val);
    if (foundById) return foundById;

    // 2. Match by exact URL in ProductImageLibrary
    const foundByUrl = valid.find(
      (img) =>
        img.originalUrl === val ||
        img.normalizedUrl === val ||
        img.cachedUrl === val ||
        img.publicUrl === val
    );
    if (foundByUrl) return foundByUrl;

    // 3. Extract trailing index if string resembles index format e.g. "product-image-2"
    const matchesNum = val.match(/(?:image[-_]?|index[-_]?)?(\d+)/i);
    if (matchesNum) {
      const parsedNum = parseInt(matchesNum[1], 10);
      if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum < valid.length) {
        return valid[parsedNum];
      }
    }

    // If it is an external URL, forbidden domain (e.g. youtube.com), or unlisted URL, REJECT IT!
    if (rejectedLog) {
      console.log(`[Reassigner Audit] REJECTED external non-library URL: ${val.slice(0, 80)}`);
      rejectedLog.push(val);
    }
  }

  // Safe fallback to valid library image
  const safeIndex = Math.min(Math.max(0, fallbackIndex), valid.length - 1);
  return valid[safeIndex] || valid[0] || null;
}

export function reassignImagesForTheme(
  imageLibrary: ProductImageLibrary,
  archetypeId: DesignArchetypeId,
  aiSelections?: AIImageSelections
): ThemeImageAssignments {
  const valid = imageLibrary.allValidImages || [];
  const rejectedExternalUrls: string[] = [];

  if (valid.length === 0) {
    return {
      hero: null,
      featured: null,
      gallery: [],
      story: null,
      finalCta: null,
      productPageGallery: [],
      hasSingleImageFallback: true,
      aiSelections,
      externalUrlsRejectedCount: 0,
      rejectedExternalUrls: [],
    };
  }

  // 1. Select Hero Image (from AI index/ID if available, else theme heuristic)
  let heroImage: NormalizedImage | null = null;
  if (aiSelections?.heroImageIndex !== undefined || aiSelections?.heroImageId) {
    heroImage = resolveImageFromLibrary(
      imageLibrary,
      aiSelections.heroImageIndex ?? aiSelections.heroImageId,
      0,
      rejectedExternalUrls
    );
  }

  if (!heroImage) {
    heroImage = valid[0];
    if (archetypeId === 'soft_beauty' || archetypeId === 'clean_wellness') {
      const lifestyle = imageLibrary.lifestyleCandidates.find((img) => img.id !== heroImage?.id);
      if (lifestyle) heroImage = lifestyle;
    } else if (archetypeId === 'premium_jewelry') {
      const detail = imageLibrary.detailCandidates.find((img) => img.id !== heroImage?.id);
      if (detail) heroImage = detail;
    }
  }

  // 2. Select Story, Featured, & Final CTA Images (Ensure every visual section gets an image from ProductImageLibrary)
  const availableForStory = valid.filter((img) => img.id !== heroImage?.id);

  const storyImage = resolveImageFromLibrary(
    imageLibrary,
    aiSelections?.storyImageIndex ?? aiSelections?.storyImageId,
    availableForStory.length > 0 ? valid.indexOf(availableForStory[0]) : 0,
    rejectedExternalUrls
  ) || valid[1] || heroImage;

  const featuredImage = resolveImageFromLibrary(
    imageLibrary,
    aiSelections?.featuredImageIndex ?? aiSelections?.featuredImageId,
    availableForStory.length > 1 ? valid.indexOf(availableForStory[1]) : 0,
    rejectedExternalUrls
  ) || valid[2] || storyImage || heroImage;

  const finalCtaImage = resolveImageFromLibrary(
    imageLibrary,
    aiSelections?.finalCtaImageIndex ?? aiSelections?.finalCtaImageId,
    availableForStory.length > 2 ? valid.indexOf(availableForStory[availableForStory.length - 1]) : 0,
    rejectedExternalUrls
  ) || valid[3] || storyImage || heroImage;

  // 3. Product Page & Storefront Gallery (Render ALL valid ProductImageLibrary images dynamically)
  let galleryImages: NormalizedImage[] = [];
  if (heroImage) {
    galleryImages.push(heroImage);
  }

  // Include AI selected gallery items first if provided
  if (Array.isArray(aiSelections?.galleryImageIndexes) && aiSelections.galleryImageIndexes.length > 0) {
    aiSelections.galleryImageIndexes.forEach((idx) => {
      const resolved = resolveImageFromLibrary(imageLibrary, idx, -1, rejectedExternalUrls);
      if (resolved && !galleryImages.some((g) => g.id === resolved.id)) {
        galleryImages.push(resolved);
      }
    });
  }

  // Ensure ALL remaining valid ProductImageLibrary images are included in the gallery
  valid.forEach((img) => {
    if (!galleryImages.some((g) => g.id === img.id)) {
      galleryImages.push(img);
    }
  });

  return {
    hero: heroImage,
    featured: featuredImage,
    gallery: galleryImages,
    story: storyImage,
    finalCta: finalCtaImage,
    productPageGallery: galleryImages,
    hasSingleImageFallback: valid.length === 1,
    aiSelections: {
      heroImageIndex: heroImage ? valid.indexOf(heroImage) : 0,
      heroImageId: heroImage?.id,
      storyImageIndex: storyImage ? valid.indexOf(storyImage) : 0,
      storyImageId: storyImage?.id,
      featuredImageIndex: featuredImage ? valid.indexOf(featuredImage) : 0,
      featuredImageId: featuredImage?.id,
      galleryImageIndexes: galleryImages.map((img) => valid.indexOf(img)).filter((i) => i >= 0),
      finalCtaImageIndex: finalCtaImage ? valid.indexOf(finalCtaImage) : 0,
      finalCtaImageId: finalCtaImage?.id,
    },
    externalUrlsRejectedCount: rejectedExternalUrls.length,
    rejectedExternalUrls,
  };
}

