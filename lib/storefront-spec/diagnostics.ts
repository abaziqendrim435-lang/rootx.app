// ============================================================
// RootX Storefront Image Diagnostics Calculator
// Calculates exact image metrics across ProductImageLibrary,
// StorefrontSpec section assignments, and rendered image slots.
// ============================================================

import type { StorefrontSpec } from './types';
import { resolveRenderableImage } from '../image-pipeline/resolve-image';

export interface StorefrontImageDiagnostics {
  libraryImagesCount: number;
  assignedImagesCount: number;
  unassignedImagesCount: number;
  emptyImageSlotsCount: number;
  exactMapping: Record<string, string | string[]>;
  passedAcceptance: boolean;
}

export function calculateStorefrontImageDiagnostics(spec: StorefrontSpec): StorefrontImageDiagnostics {
  const libraryImages = spec.imageLibrary?.allValidImages || spec.images.gallery || [];
  const libraryImagesCount = libraryImages.length;

  const exactMapping: Record<string, string | string[]> = {
    hero: resolveRenderableImage(spec.images.hero),
    gallery: spec.images.gallery.map(resolveRenderableImage).filter(Boolean),
    story: resolveRenderableImage(spec.images.story),
    featured: resolveRenderableImage(spec.images.featured),
    finalCta: resolveRenderableImage(spec.images.finalCta),
  };

  const assignedUrls = new Set<string>();
  if (exactMapping.hero) assignedUrls.add(exactMapping.hero as string);
  if (exactMapping.story) assignedUrls.add(exactMapping.story as string);
  if (exactMapping.featured) assignedUrls.add(exactMapping.featured as string);
  if (exactMapping.finalCta) assignedUrls.add(exactMapping.finalCta as string);
  (exactMapping.gallery as string[]).forEach((url) => {
    if (url) assignedUrls.add(url);
  });

  const assignedImagesCount = assignedUrls.size;
  const unassignedImagesCount = Math.max(0, libraryImagesCount - assignedImagesCount);

  let emptyImageSlotsCount = 0;

  // Scan sections for empty image slots
  spec.sections.forEach((sec) => {
    if (!sec.enabled) return;

    if (sec.id === 'rootx-hero') {
      if (!sec.settings.hero_image) emptyImageSlotsCount++;
    } else if (sec.id === 'rootx-image-story') {
      // Story image slot counted as empty only if enabled but setting is empty
      if (!sec.settings.story_image && !sec.settings.section_image && spec.images.story === null) {
        // If story section is enabled without an image assigned
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
    libraryImagesCount > 1 &&
    assignedImagesCount > 1 &&
    emptyImageSlotsCount === 0;

  return {
    libraryImagesCount,
    assignedImagesCount,
    unassignedImagesCount,
    emptyImageSlotsCount,
    exactMapping,
    passedAcceptance,
  };
}
