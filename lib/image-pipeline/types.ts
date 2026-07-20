// ============================================================
// RootX Product Image Pipeline V1 — Types
// Defines normalized image objects, sources, roles, and results.
// ============================================================

export type ImageRole =
  | 'hero'
  | 'featured-product'
  | 'product-gallery'
  | 'lifestyle'
  | 'product-detail'
  | 'benefit'
  | 'final-cta'
  | 'thumbnail'
  | 'unassigned';

export type ImageSourceType = 'aliexpress' | 'shopify' | 'manual' | 'remote' | 'unknown';

export interface NormalizedImage {
  id: string;
  originalUrl: string;
  normalizedUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
  source: ImageSourceType;
  altText: string;
  role: ImageRole;
  qualityScore: number;
  isValid: boolean;
  rejectionReason?: string;
  isCustomUpload?: boolean;
}

export interface DiagnosticInfo {
  totalExtracted: number;
  validCount: number;
  rejectedCount: number;
  selectedHeroUrl: string | null;
  sourcesFound: Record<ImageSourceType, number>;
  roleAssignments: Record<ImageRole, number>;
  rejectionLog: Array<{ url: string; reason: string }>;
}

export interface ImagePipelineResult {
  images: NormalizedImage[];
  heroImage: NormalizedImage | null;
  featuredProductImage: NormalizedImage | null;
  galleryImages: NormalizedImage[];
  lifestyleImage: NormalizedImage | null;
  benefitImage: NormalizedImage | null;
  finalCtaImage: NormalizedImage | null;
  hasSingleImageFallback: boolean;
  hasNoImageFallback: boolean;
  diagnosticInfo: DiagnosticInfo;
}
