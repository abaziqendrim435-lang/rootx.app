// ============================================================
// RootX Product Image Pipeline V2 — Theme Image Reassigner
// Takes canonical ProductImageLibrary and recalculates ThemeImageAssignments
// for the selected theme family without discarding any valid images.
// ============================================================

import type { ProductImageLibrary, ThemeImageAssignments, NormalizedImage, AIImageSelections } from './types';
import type { DesignArchetypeId } from '../website-builder-types';

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

    const foundById = valid.find((img) => img.id === val);
    if (foundById) return foundById;

    const foundByUrl = valid.find(
      (img) =>
        img.originalUrl === val ||
        img.normalizedUrl === val ||
        img.cachedUrl === val ||
        img.publicUrl === val
    );
    if (foundByUrl) return foundByUrl;

    const matchesNum = val.match(/(?:image[-_]?|index[-_]?)?(\d+)/i);
    if (matchesNum) {
      const parsedNum = parseInt(matchesNum[1], 10);
      if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum < valid.length) {
        return valid[parsedNum];
      }
    }

    if (rejectedLog) {
      console.log(`[Reassigner Audit] REJECTED external non-library URL: ${val.slice(0, 80)}`);
      rejectedLog.push(val);
    }
  }

  const safeIndex = Math.min(Math.max(0, fallbackIndex), valid.length - 1);
  return valid[safeIndex] || valid[0] || null;
}

function dedupeValidImages(valid: NormalizedImage[]): NormalizedImage[] {
  return valid.filter(
    (img, idx, arr) =>
      arr.findIndex(
        (x) => x.id === img.id || (x.normalizedUrl && x.normalizedUrl === img.normalizedUrl)
      ) === idx
  );
}

function pickNextUnused(
  pool: NormalizedImage[],
  usedIds: Set<string>,
  allowReuse: boolean
): NormalizedImage | null {
  const unused = pool.find((img) => !usedIds.has(img.id));
  if (unused) return unused;
  if (allowReuse && pool.length > 0) return pool[0];
  return null;
}

function markUsed(img: NormalizedImage | null | undefined, usedIds: Set<string>): void {
  if (img?.id) usedIds.add(img.id);
}

function pickFromPoolOrLibrary(
  imageLibrary: ProductImageLibrary,
  uniqueValid: NormalizedImage[],
  usedIds: Set<string>,
  allowReuse: boolean,
  pool: NormalizedImage[],
  aiIndex?: number,
  aiId?: string,
  rejectedLog?: string[]
): NormalizedImage | null {
  if (aiIndex !== undefined || aiId) {
    const aiPick = resolveImageFromLibrary(
      imageLibrary,
      aiIndex ?? aiId,
      -1,
      rejectedLog
    );
    if (aiPick && (!usedIds.has(aiPick.id) || allowReuse)) {
      return aiPick;
    }
  }

  const poolPick = pickNextUnused(pool.length > 0 ? pool : uniqueValid, usedIds, allowReuse);
  if (poolPick) return poolPick;

  return pickNextUnused(uniqueValid, usedIds, allowReuse);
}

export function reassignImagesForTheme(
  imageLibrary: ProductImageLibrary,
  _archetypeId: DesignArchetypeId,
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
      benefitImages: [],
      comparisonImage: null,
      productPageGallery: [],
      hasSingleImageFallback: true,
      aiSelections,
      externalUrlsRejectedCount: 0,
      rejectedExternalUrls: [],
    };
  }

  const uniqueValid = dedupeValidImages(valid);
  const allowReuse = uniqueValid.length === 1;
  const usedIds = new Set<string>();

  // Hero — strongest primary product image (quality-ranked heroCandidates, AI override when valid)
  const heroPool = imageLibrary.heroCandidates.filter((img) =>
    uniqueValid.some((u) => u.id === img.id)
  );
  const rankedHeroPool = [...(heroPool.length > 0 ? heroPool : uniqueValid)].sort(
    (a, b) => b.qualityScore - a.qualityScore
  );

  let heroImage = pickFromPoolOrLibrary(
    imageLibrary,
    uniqueValid,
    usedIds,
    allowReuse,
    rankedHeroPool,
    aiSelections?.heroImageIndex,
    aiSelections?.heroImageId,
    rejectedExternalUrls
  );
  if (!heroImage) {
    heroImage = rankedHeroPool[0] || uniqueValid[0] || null;
  }
  markUsed(heroImage, usedIds);

  // Full product gallery — every unique library image in source order
  const productPageGallery = [...uniqueValid];
  const galleryImages = [...uniqueValid];

  // Story — lifestyle / use-case image, distinct from hero when possible
  const lifestylePool = imageLibrary.lifestyleCandidates.filter((img) =>
    uniqueValid.some((u) => u.id === img.id)
  );
  let storyImage = pickFromPoolOrLibrary(
    imageLibrary,
    uniqueValid,
    usedIds,
    allowReuse,
    lifestylePool,
    aiSelections?.storyImageIndex,
    aiSelections?.storyImageId,
    rejectedExternalUrls
  );
  markUsed(storyImage, usedIds);

  // Featured / showcase — detail or product angle, distinct from hero + story when possible
  const detailPool = imageLibrary.detailCandidates.filter((img) =>
    uniqueValid.some((u) => u.id === img.id)
  );
  let featuredImage = pickFromPoolOrLibrary(
    imageLibrary,
    uniqueValid,
    usedIds,
    allowReuse,
    detailPool.length > 0 ? detailPool : uniqueValid,
    aiSelections?.featuredImageIndex,
    aiSelections?.featuredImageId,
    rejectedExternalUrls
  );
  markUsed(featuredImage, usedIds);

  // Final CTA — next unused image, never silently reuse story when more images exist
  let finalCtaImage = pickFromPoolOrLibrary(
    imageLibrary,
    uniqueValid,
    usedIds,
    allowReuse,
    uniqueValid,
    aiSelections?.finalCtaImageIndex,
    aiSelections?.finalCtaImageId,
    rejectedExternalUrls
  );
  if (!finalCtaImage && allowReuse) {
    finalCtaImage = storyImage || heroImage;
  }
  markUsed(finalCtaImage, usedIds);

  // Benefits / features — up to 3 distinct supporting images
  const benefitImages: NormalizedImage[] = [];
  for (let i = 0; i < 3; i++) {
    const benefitImg = pickNextUnused(uniqueValid, usedIds, allowReuse);
    if (!benefitImg) break;
    benefitImages.push(benefitImg);
    markUsed(benefitImg, usedIds);
  }

  // Comparison / content section — one additional distinct image when available
  const comparisonImage = pickNextUnused(uniqueValid, usedIds, allowReuse);
  markUsed(comparisonImage, usedIds);

  return {
    hero: heroImage,
    featured: featuredImage,
    gallery: galleryImages,
    story: storyImage,
    finalCta: finalCtaImage,
    benefitImages,
    comparisonImage,
    productPageGallery,
    hasSingleImageFallback: uniqueValid.length === 1,
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
