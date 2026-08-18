// ============================================================
// RootX — Product selection session guard (frontend)
// Prevents stale async responses from overwriting a newer selection.
// ============================================================

export interface ProductSelectionSession {
  token: number;
  productId: string | null;
}

export function createProductSelectionSession(
  previousToken: number,
  productId: string | null
): ProductSelectionSession {
  return { token: previousToken + 1, productId };
}

export function isActiveProductSelectionSession(
  current: ProductSelectionSession,
  captured: ProductSelectionSession
): boolean {
  if (captured.productId === null) return false;
  return current.token === captured.token && current.productId === captured.productId;
}

export function productUrlMatchesSelection(
  sourceUrl: string | undefined,
  selectedProductId: string | null,
  extractProductId: (url: string) => string | null
): boolean {
  if (!selectedProductId || !sourceUrl) return false;
  const sourceProductId = extractProductId(sourceUrl);
  return sourceProductId === selectedProductId;
}
