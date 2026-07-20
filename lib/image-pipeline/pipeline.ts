// ============================================================
// RootX Product Image Pipeline V1 — Master Pipeline Orchestrator
// Coordinates extraction, normalization, validation, ranking, and role assignment.
// ============================================================

import type { NormalizedImage, ImagePipelineResult, DiagnosticInfo, ImageSourceType } from './types';
import { extractRawImages } from './extractor';
import { normalizeImageUrl } from './normalizer';
import { validateImage } from './validator';
import { scoreImageQuality } from './ranker';
import { assignRolesAndFallbacks } from './role-assigner';

export function runImagePipeline(productData: unknown): ImagePipelineResult {
  const rawCandidates = extractRawImages(productData);

  const seenUrls = new Set<string>();
  const validImages: NormalizedImage[] = [];
  const rejectionLog: Array<{ url: string; reason: string }> = [];

  const sourcesFound: Record<ImageSourceType, number> = {
    aliexpress: 0,
    shopify: 0,
    manual: 0,
    remote: 0,
    unknown: 0,
  };

  rawCandidates.forEach((candidate, idx) => {
    // 1. Normalize
    const { normalizedUrl, source } = normalizeImageUrl(candidate.rawUrl);
    if (!normalizedUrl) {
      rejectionLog.push({ url: candidate.rawUrl, reason: 'Normalizer returned empty URL' });
      return;
    }

    // Track source type
    sourcesFound[source] = (sourcesFound[source] || 0) + 1;

    // 2. Validate
    const validation = validateImage(normalizedUrl, seenUrls);
    if (!validation.isValid) {
      rejectionLog.push({ url: normalizedUrl, reason: validation.reason || 'Failed validation' });
      return;
    }

    // Mark seen
    seenUrls.add(normalizedUrl);

    // 3. Score Quality
    const initialImg: Partial<NormalizedImage> = {
      id: `img_${idx + 1}_${Date.now().toString(36)}`,
      originalUrl: candidate.rawUrl,
      normalizedUrl,
      width: 800,
      height: 800,
      aspectRatio: 1.0,
      source,
      altText: candidate.altHint || `Product image ${idx + 1}`,
      role: 'unassigned',
      isValid: true,
    };

    const qualityScore = scoreImageQuality(initialImg);

    validImages.push({
      ...initialImg,
      qualityScore,
    } as NormalizedImage);
  });

  const diagnosticInfo: DiagnosticInfo = {
    totalExtracted: rawCandidates.length,
    validCount: validImages.length,
    rejectedCount: rejectionLog.length,
    selectedHeroUrl: null,
    sourcesFound,
    roleAssignments: {
      hero: 0,
      'featured-product': 0,
      'product-gallery': 0,
      lifestyle: 0,
      'product-detail': 0,
      benefit: 0,
      'final-cta': 0,
      thumbnail: 0,
      unassigned: 0,
    },
    rejectionLog,
  };

  // 4. Role Assignment & Fallback logic
  const result = assignRolesAndFallbacks(validImages, diagnosticInfo);

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Image Pipeline Result]', {
      totalExtracted: diagnosticInfo.totalExtracted,
      validCount: diagnosticInfo.validCount,
      rejectedCount: diagnosticInfo.rejectedCount,
      selectedHeroUrl: result.heroImage?.normalizedUrl || 'None',
      sources: diagnosticInfo.sourcesFound,
      rejections: rejectionLog.map((r) => `${r.url.slice(0, 35)}... => ${r.reason}`),
    });
  }

  return result;
}
