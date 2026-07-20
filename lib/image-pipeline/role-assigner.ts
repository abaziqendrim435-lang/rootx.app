// ============================================================
// RootX Product Image Pipeline V1 — Role Assigner & Fallback Engine
// Assigns section-specific roles and enforces single-image fallback strategy.
// ============================================================

import type { NormalizedImage, ImageRole, ImagePipelineResult, DiagnosticInfo } from './types';

export function assignRolesAndFallbacks(
  validImages: NormalizedImage[],
  diagnosticInfo: DiagnosticInfo
): ImagePipelineResult {
  // Sort images by quality score descending
  const sorted = [...validImages].sort((a, b) => b.qualityScore - a.qualityScore);

  const roleMap: Record<ImageRole, number> = {
    hero: 0,
    'featured-product': 0,
    'product-gallery': 0,
    lifestyle: 0,
    'product-detail': 0,
    benefit: 0,
    'final-cta': 0,
    thumbnail: 0,
    unassigned: 0,
  };

  if (sorted.length === 0) {
    diagnosticInfo.roleAssignments = roleMap;
    return {
      images: [],
      heroImage: null,
      featuredProductImage: null,
      galleryImages: [],
      lifestyleImage: null,
      benefitImage: null,
      finalCtaImage: null,
      hasSingleImageFallback: false,
      hasNoImageFallback: true,
      diagnosticInfo,
    };
  }

  // 1. Assign Hero Image
  const heroImage = { ...sorted[0], role: 'hero' as ImageRole };
  roleMap.hero++;

  // 2. Single-Image Fallback Case
  if (sorted.length === 1) {
    const single = { ...heroImage };
    diagnosticInfo.selectedHeroUrl = single.normalizedUrl;
    diagnosticInfo.roleAssignments = roleMap;

    return {
      images: [single],
      heroImage: single,
      featuredProductImage: single,
      galleryImages: [single],
      lifestyleImage: null, // Don't repeat identical image in lifestyle
      benefitImage: null,
      finalCtaImage: single,
      hasSingleImageFallback: true,
      hasNoImageFallback: false,
      diagnosticInfo,
    };
  }

  // 3. Multi-Image Role Distribution (Distinct Image per Section)
  const featuredProductImage = { ...(sorted[1] || sorted[0]), role: 'featured-product' as ImageRole };
  roleMap['featured-product']++;

  const lifestyleImage = sorted[2] ? { ...sorted[2], role: 'lifestyle' as ImageRole } : null;
  if (lifestyleImage) roleMap.lifestyle++;

  const benefitImage = sorted[3] ? { ...sorted[3], role: 'benefit' as ImageRole } : null;
  if (benefitImage) roleMap.benefit++;

  const finalCtaImage = sorted[4] ? { ...sorted[4], role: 'final-cta' as ImageRole } : featuredProductImage;
  if (finalCtaImage) roleMap['final-cta']++;

  // Gallery gets all valid unique images
  const galleryImages = sorted.map((img, i) => ({
    ...img,
    role: (i === 0 ? 'hero' : 'product-gallery') as ImageRole,
  }));
  roleMap['product-gallery'] = galleryImages.length;

  diagnosticInfo.selectedHeroUrl = heroImage.normalizedUrl;
  diagnosticInfo.roleAssignments = roleMap;

  return {
    images: sorted,
    heroImage,
    featuredProductImage,
    galleryImages,
    lifestyleImage,
    benefitImage,
    finalCtaImage,
    hasSingleImageFallback: false,
    hasNoImageFallback: false,
    diagnosticInfo,
  };
}
