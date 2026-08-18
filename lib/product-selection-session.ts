// ============================================================
// RootX — Product selection session guard (frontend)
// Prevents stale async responses from overwriting a newer selection.
// ============================================================

import { createSelectionSessionId } from './product-identity';

export interface ProductSelectionSession {
  token: number;
  productId: string | null;
  selectionSessionId: string;
}

export function createProductSelectionSession(
  previousToken: number,
  productId: string | null
): ProductSelectionSession {
  const token = previousToken + 1;
  return {
    token,
    productId,
    selectionSessionId: productId ? createSelectionSessionId(productId, token) : `sel_${token}_none`,
  };
}

export function isActiveProductSelectionSession(
  current: ProductSelectionSession,
  captured: ProductSelectionSession
): boolean {
  if (captured.productId === null) return false;
  return (
    current.token === captured.token &&
    current.productId === captured.productId &&
    current.selectionSessionId === captured.selectionSessionId
  );
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
