// ============================================================
// RootX Product Image Pipeline V2 — Theme Image Reassigner
// Takes canonical ProductImageLibrary and recalculates ThemeImageAssignments
// for the selected theme family without discarding any valid images.
// ============================================================

import type { ProductImageLibrary, ThemeImageAssignments, NormalizedImage } from './types';
import type { DesignArchetypeId } from '../website-builder-types';

export function reassignImagesForTheme(
  imageLibrary: ProductImageLibrary,
  archetypeId: DesignArchetypeId
): ThemeImageAssignments {
  const valid = imageLibrary.allValidImages || [];

  if (valid.length === 0) {
    return {
      hero: null,
      featured: null,
      gallery: [],
      story: null,
      finalCta: null,
      productPageGallery: [],
      hasSingleImageFallback: true,
    };
  }

  // 1. Select Hero Image
  // Theme-specific preference for hero candidate
  let heroImage: NormalizedImage = valid[0];

  if (archetypeId === 'soft_beauty' || archetypeId === 'clean_wellness') {
    const lifestyle = imageLibrary.lifestyleCandidates.find((img) => img.id !== heroImage.id);
    if (lifestyle) heroImage = lifestyle;
  } else if (archetypeId === 'premium_jewelry') {
    const detail = imageLibrary.detailCandidates.find((img) => img.id !== heroImage.id);
    if (detail) heroImage = detail;
  }

  // 2. Select Story & Featured Images
  const availableForStory = valid.filter((img) => img.normalizedUrl !== heroImage.normalizedUrl);
  const storyImage = availableForStory.length > 0 ? availableForStory[0] : heroImage;
  const featuredImage = heroImage;
  const finalCtaImage = availableForStory.length > 1 ? availableForStory[1] : heroImage;

  // 3. Product Page & Storefront Gallery (Preserve ALL valid images up to 10 max)
  // Ensure hero image is first, followed by all remaining unique images
  const galleryImages: NormalizedImage[] = [heroImage];
  valid.forEach((img) => {
    if (img.normalizedUrl !== heroImage.normalizedUrl && !galleryImages.some(g => g.normalizedUrl === img.normalizedUrl)) {
      galleryImages.push(img);
    }
  });

  const cappedGallery = galleryImages.slice(0, 10);

  return {
    hero: heroImage,
    featured: featuredImage,
    gallery: cappedGallery,
    story: storyImage,
    finalCta: finalCtaImage,
    productPageGallery: cappedGallery,
    hasSingleImageFallback: valid.length === 1,
  };
}
