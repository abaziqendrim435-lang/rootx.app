// ============================================================================
// RootX — Preview-only section image injection
// Sections whose Shopify liquid templates have no image slot (comparison, CTA)
// still receive assigned images via StorefrontSpec — inject them for live preview.
// Does not modify generated liquid / Shopify export files.
// ============================================================================

function buildPreviewImgTag(url: string, alt: string, style: string): string {
  return `<img src="${url}" alt="${alt}" style="${style}" loading="lazy" referrerpolicy="no-referrer" />`;
}

function sectionContainsProductImage(html: string, sectionClass: string): boolean {
  const sectionMatch = html.match(new RegExp(`<section class="${sectionClass}"[\\s\\S]*?</section>`, 'i'));
  if (!sectionMatch) return false;
  return /<img\s[^>]*src=["'][^"']+["']/i.test(sectionMatch[0]);
}

export interface PreviewSectionImageInjections {
  comparison?: string;
  finalCta?: string;
}

/**
 * Injects assigned product images into preview HTML for sections that have
 * spec assignments but no baked image markup in their liquid templates.
 */
export function injectAssignedPreviewSectionImages(
  html: string,
  assignments: PreviewSectionImageInjections
): string {
  let result = html;

  if (assignments.comparison && !sectionContainsProductImage(result, 'comparison-section')) {
    result = result.replace(
      /(<section class="comparison-section"[\s\S]*?<div style="text-align: center; margin-bottom: 3\.5rem;">[\s\S]*?<\/div>)/,
      `$1
    <div class="rx-preview-comparison-image" style="text-align: center; margin-bottom: 2.5rem;">
      ${buildPreviewImgTag(
        assignments.comparison,
        'Product comparison',
        'max-width: 680px; width: 100%; height: 320px; object-fit: cover; border-radius: var(--rx-radius-lg); border: 1px solid var(--rx-border); box-shadow: var(--rx-shadow-md); display: inline-block;'
      )}
    </div>`
    );
  }

  if (assignments.finalCta && !sectionContainsProductImage(result, 'final-cta')) {
    result = result.replace(
      /(<section class="final-cta"[\s\S]*?<p style="font-size: var\(--rx-font-lg\)[^"]*"[^>]*>[\s\S]*?<\/p>)/,
      `$1
    <div class="rx-preview-final-cta-image" style="margin: 0 auto 2rem; max-width: 480px; border-radius: var(--rx-radius-lg); overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.25);">
      ${buildPreviewImgTag(
        assignments.finalCta,
        'Product',
        'width: 100%; height: 260px; object-fit: cover; display: block;'
      )}
    </div>`
    );
  }

  return result;
}
