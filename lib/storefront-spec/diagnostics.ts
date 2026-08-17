// ============================================================
// RootX Storefront Image Diagnostics Calculator
// Calculates exact image metrics across ProductImageLibrary,
// StorefrontSpec section assignments, and rendered image slots.
// ============================================================

import type { StorefrontSpec } from './types';
import { resolveRenderableImage } from '../image-pipeline/resolve-image';

export interface StorefrontImageDiagnostics {
  productImageLibraryTotal: number;
  storefrontGalleryTotal: number;
  uniqueImagesAvailable: number;
  libraryImagesCount: number;
  assignedImagesCount: number;
  unassignedImagesCount: number;
  emptyImageSlotsCount: number;
  sectionAssignments: Record<string, string | string[]>;
  duplicateSectionAssignments: string[];
  exactMapping: Record<string, string | string[]>;
  passedAcceptance: boolean;
}

export function calculateStorefrontImageDiagnostics(spec: StorefrontSpec): StorefrontImageDiagnostics {
  const libraryImages = spec.imageLibrary?.allValidImages || spec.images.gallery || [];
  const libraryImagesCount = libraryImages.length;
  const productImageLibraryTotal = libraryImagesCount;
  const storefrontGalleryTotal = spec.images.gallery.length;
  const uniqueImagesAvailable = libraryImagesCount;

  const sectionAssignments: Record<string, string | string[]> = {
    hero: resolveRenderableImage(spec.images.hero),
    story: resolveRenderableImage(spec.images.story),
    featured: resolveRenderableImage(spec.images.featured),
    finalCta: resolveRenderableImage(spec.images.finalCta),
    comparison: resolveRenderableImage(spec.images.comparisonImage),
    benefits: spec.images.benefitImages.map((img) => resolveRenderableImage(img)).filter(Boolean),
    gallery: spec.images.gallery.map(resolveRenderableImage).filter(Boolean),
  };

  const exactMapping = {
    hero: sectionAssignments.hero,
    gallery: sectionAssignments.gallery,
    story: sectionAssignments.story,
    featured: sectionAssignments.featured,
    finalCta: sectionAssignments.finalCta,
  };

  const roleUrls: string[] = [];
  if (sectionAssignments.hero) roleUrls.push(sectionAssignments.hero as string);
  if (sectionAssignments.story) roleUrls.push(sectionAssignments.story as string);
  if (sectionAssignments.featured) roleUrls.push(sectionAssignments.featured as string);
  if (sectionAssignments.finalCta) roleUrls.push(sectionAssignments.finalCta as string);
  if (sectionAssignments.comparison) roleUrls.push(sectionAssignments.comparison as string);
  (sectionAssignments.benefits as string[]).forEach((url) => roleUrls.push(url));
  (sectionAssignments.gallery as string[]).forEach((url) => roleUrls.push(url));

  const urlCounts = new Map<string, number>();
  roleUrls.forEach((url) => {
    urlCounts.set(url, (urlCounts.get(url) || 0) + 1);
  });
  const duplicateSectionAssignments = [...urlCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([url]) => url);

  const assignedUrls = new Set(roleUrls.filter(Boolean));
  const assignedImagesCount = assignedUrls.size;
  const unassignedImagesCount = Math.max(0, libraryImagesCount - assignedImagesCount);

  let emptyImageSlotsCount = 0;

  spec.sections.forEach((sec) => {
    if (!sec.enabled) return;

    if (sec.id === 'rootx-hero') {
      if (!sec.settings.hero_image) emptyImageSlotsCount++;
    } else if (sec.id === 'rootx-image-story') {
      if (!sec.settings.story_image && !sec.settings.section_image && spec.images.story === null) {
        emptyImageSlotsCount++;
      }
    }

    if (sec.blocks) {
      sec.blocks.forEach((block: any) => {
        if (block.settings && 'image_url' in block.settings) {
          if (!block.settings.image_url) {
            emptyImageSlotsCount++;
          }
        }
      });
    }
  });

  const passedAcceptance =
    productImageLibraryTotal > 1 &&
    storefrontGalleryTotal === productImageLibraryTotal &&
    uniqueImagesAvailable === productImageLibraryTotal &&
    assignedImagesCount > 1 &&
    emptyImageSlotsCount === 0;

  return {
    productImageLibraryTotal,
    storefrontGalleryTotal,
    uniqueImagesAvailable,
    libraryImagesCount,
    assignedImagesCount,
    unassignedImagesCount,
    emptyImageSlotsCount,
    sectionAssignments,
    duplicateSectionAssignments,
    exactMapping,
    passedAcceptance,
  };
}
