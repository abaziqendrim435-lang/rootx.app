// ============================================================
// RootX — Canonical product identity
// One immutable identity is frozen at user selection and required
// at every subsequent pipeline stage.
// ============================================================

export const PRODUCT_CACHE_SCHEMA_VERSION = 4;

export interface CanonicalProductIdentity {
  productId: string;
  sourceUrl: string;
  selectionSessionId: string;
  resolvedProductId?: string | null;
}

export function extractAliExpressProductId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/(?:item\/|_|id=)(\d{10,16})/i) || url.match(/\b(\d{10,16})\b/);
  return match ? match[1] : null;
}

export function createSelectionSessionId(productId: string, token?: number): string {
  const nonce = typeof token === 'number' ? String(token) : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return `sel_${nonce}_${productId}`;
}

export function createCanonicalProductIdentity(
  sourceUrl: string,
  selectionSessionId?: string
): CanonicalProductIdentity {
  const productId = extractAliExpressProductId(sourceUrl);
  if (!productId) {
    throw new Error('AliExpress URL must contain a valid product ID.');
  }
  if (!sourceUrl.includes(productId)) {
    throw new Error(`Product URL does not contain product ID "${productId}".`);
  }
  return {
    productId,
    sourceUrl: sourceUrl.trim(),
    selectionSessionId: selectionSessionId || createSelectionSessionId(productId),
    resolvedProductId: null,
  };
}

export function belongsToIdentity(candidateId: string | null | undefined, identity: CanonicalProductIdentity): boolean {
  if (!candidateId) return false;
  if (candidateId === identity.productId) return true;
  if (identity.resolvedProductId && candidateId === identity.resolvedProductId) return true;
  return false;
}

export function assertProductIdentityMatch(
  requestedProductId: string,
  returnedProductId: string | null | undefined,
  stage: string
): void {
  if (!returnedProductId || returnedProductId !== requestedProductId) {
    throw new Error(
      `${stage}: product ID mismatch: requested "${requestedProductId}", returned "${returnedProductId || 'null'}".`
    );
  }
}

export function assertLibraryIdentity(
  libraryProductId: string | null | undefined,
  requestedProductId: string,
  stage: string
): void {
  if (!libraryProductId || libraryProductId !== requestedProductId) {
    throw new Error(
      `${stage}: ProductImageLibrary product ID "${libraryProductId || 'null'}" does not match requested "${requestedProductId}".`
    );
  }
}

export function canonicalCacheKey(productId: string): string {
  return `product:v${PRODUCT_CACHE_SCHEMA_VERSION}:${productId}`;
}
