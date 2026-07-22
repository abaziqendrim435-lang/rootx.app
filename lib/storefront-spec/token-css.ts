// ============================================================
// RootX Storefront Pixel Parity Engine V1 — Token CSS Generator
// Emits standardized --rx-* CSS variables from StorefrontSpec
// ============================================================

import type { StorefrontSpec } from './types';
import { getArchetype } from '../design-engine/archetypes';

export function generateTokenCSSVariables(spec: StorefrontSpec): string {
  const t = spec.designTokens;
  const arch = getArchetype(spec.archetype);

  const primary = t['--color-primary'] || '#06b6d4';
  const secondary = t['--color-secondary'] || '#3b82f6';
  const accent = t['--color-accent'] || '#0d9488';
  const background = t['--color-background'] || '#ffffff';
  const surface = t['--color-surface'] || '#f8fafc';
  const text = t['--color-text'] || '#0f172a';
  const muted = t['--color-muted'] || '#64748b';
  const border = t['--color-border'] || '#e2e8f0';

  const headingFont = t['--font-heading'] || arch.typography.headingFont;
  const bodyFont = t['--font-body'] || arch.typography.bodyFont;
  const headingFontFamily = `'${headingFont}', ${headingFont.includes('Garamond') || headingFont.includes('Playfair') ? 'serif' : 'sans-serif'}`;
  const bodyFontFamily = `'${bodyFont}', sans-serif`;

  return `:root {
  /* Primary Brand Tokens & Aliases */
  --rx-primary: ${primary};
  --rx-secondary: ${secondary};
  --rx-accent: ${accent};
  --rx-background: ${background};
  --rx-surface: ${surface};
  --rx-text: ${text};
  --rx-muted: ${muted};
  --rx-border: ${border};

  --rx-color-primary: ${primary};
  --rx-color-secondary: ${secondary};
  --rx-color-accent: ${accent};
  --rx-color-background: ${background};
  --rx-color-surface: ${surface};
  --rx-color-text: ${text};
  --rx-color-muted: ${muted};
  --rx-color-border: ${border};

  /* Typography */
  --rx-heading-font: ${headingFontFamily};
  --rx-body-font: ${bodyFontFamily};
  --rx-font-heading: ${headingFontFamily};
  --rx-font-body: ${bodyFontFamily};
  --rx-heading-transform: ${arch.typography.headingTransform || 'none'};
  --rx-heading-weight: ${arch.typography.headingWeight || '700'};
  --rx-body-weight: ${arch.typography.bodyWeight || '400'};

  /* Spacing & Layout */
  --rx-container: ${spec.responsiveSettings.containerMaxWidth};
  --rx-container-width: ${spec.responsiveSettings.containerMaxWidth};
  --rx-section-space: ${arch.sectionSpacing};
  --rx-section-space-desktop: ${arch.sectionSpacing};
  --rx-section-space-mobile: calc(${arch.sectionSpacing} * 0.65);
  --rx-desktop-padding: ${spec.responsiveSettings.desktopPadding};
  --rx-mobile-padding: ${spec.responsiveSettings.mobilePadding};

  /* Component Geometry */
  --rx-radius-sm: ${t['--radius-small'] || '4px'};
  --rx-radius-md: ${t['--radius-medium'] || '8px'};
  --rx-radius-lg: ${t['--radius-large'] || '16px'};
  --rx-shadow: ${t['--shadow-medium'] || '0 4px 12px rgba(0,0,0,0.1)'};
  --rx-shadow-soft: ${t['--shadow-soft'] || 'none'};
  --rx-shadow-medium: ${t['--shadow-medium'] || '0 4px 12px rgba(0,0,0,0.1)'};
  --rx-button-height: ${t['--button-height'] || '48px'};
  --rx-button-radius: ${t['--button-radius'] || '8px'};
}

/* Global Reset & Utility Styling */
*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--rx-color-background);
  color: var(--rx-color-text);
  font-family: var(--rx-font-body);
  font-weight: var(--rx-body-weight);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

.container {
  width: 100%;
  max-width: var(--rx-container-width);
  margin: 0 auto;
  padding-left: var(--rx-desktop-padding);
  padding-right: var(--rx-desktop-padding);
}

@media (max-width: 768px) {
  .container {
    padding-left: var(--rx-mobile-padding);
    padding-right: var(--rx-mobile-padding);
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-family: var(--rx-font-body);
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  line-height: 1;
}

.btn-primary {
  background-color: var(--rx-color-primary);
  color: #ffffff;
  border-radius: var(--rx-button-radius);
  height: var(--rx-button-height);
  padding: 0 2rem;
  box-shadow: var(--rx-shadow-soft);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--rx-shadow-medium);
  filter: brightness(1.08);
}`;
}
