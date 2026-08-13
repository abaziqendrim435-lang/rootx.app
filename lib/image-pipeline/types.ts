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
  cachedUrl?: string;
  storagePath?: string;
  publicUrl?: string;
  mimeType?: string;
  byteSize?: number;
  status?: 'cached' | 'failed' | 'pending' | 'ready';
  exportedAssetName?: string;
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

export interface ProductImageLibrary {
  generationId?: string;
  allValidImages: NormalizedImage[];
  heroCandidates: NormalizedImage[];
  galleryCandidates: NormalizedImage[];
  lifestyleCandidates: NormalizedImage[];
  detailCandidates: NormalizedImage[];
  rejectedImages: Array<{ url: string; reason: string }>;
  imageMetadata: Record<string, unknown>;
  originalSourceCount: number;
  validUniqueCount: number;
  cachedImageCount?: number;
  failedImageCount?: number;
}

export interface ThemeImageAssignments {
  hero: NormalizedImage | null;
  featured: NormalizedImage | null;
  gallery: NormalizedImage[];
  story: NormalizedImage | null;
  finalCta: NormalizedImage | null;
  productPageGallery: NormalizedImage[];
  hasSingleImageFallback: boolean;
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
  imageLibrary?: ProductImageLibrary;
}
