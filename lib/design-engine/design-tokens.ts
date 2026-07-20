// ============================================================
// RootX Design Engine V1 — Design Tokens Generator
// Manages the 20 strict CSS tokens across all sections & themes.
// ============================================================

import type { DesignTokens } from '../website-builder-types';
import { getArchetype } from './archetypes';

/**
 * Generate a strict set of 20 design tokens based on archetype and optional user custom colors
 */
export function generateDesignTokens(
  archetypeId: string,
  userPrimaryColor?: string,
  userSecondaryColor?: string
): DesignTokens {
  const arch = getArchetype(archetypeId);

  // Validate user colors - ignore defaults or invalid hex
  const isCustomPrimary = userPrimaryColor && 
    userPrimaryColor.startsWith('#') && 
    userPrimaryColor.toLowerCase() !== '#000000' && 
    userPrimaryColor.toLowerCase() !== '#3b82f6';
    
  const isCustomSecondary = userSecondaryColor && 
    userSecondaryColor.startsWith('#') && 
    userSecondaryColor.toLowerCase() !== '#000000' && 
    userSecondaryColor.toLowerCase() !== '#6366f1';

  const primary = isCustomPrimary ? userPrimaryColor! : arch.colorBehavior.primary;
  const secondary = isCustomSecondary ? userSecondaryColor! : arch.colorBehavior.secondary;

  return {
    '--color-primary': primary,
    '--color-secondary': secondary,
    '--color-accent': arch.colorBehavior.accent,
    '--color-background': arch.colorBehavior.background,
    '--color-surface': arch.colorBehavior.surface,
    '--color-text': arch.colorBehavior.text,
    '--color-muted': arch.colorBehavior.muted,
    '--color-border': arch.colorBehavior.border,
    '--radius-small': arch.borderRadius.small,
    '--radius-medium': arch.borderRadius.medium,
    '--radius-large': arch.borderRadius.large,
    '--shadow-soft': arch.shadowStyle.soft,
    '--shadow-medium': arch.shadowStyle.medium,
    '--container-width': '1280px',
    '--section-space': arch.sectionSpacing,
    '--font-heading': `'${arch.typography.headingFont}', sans-serif`,
    '--font-body': `'${arch.typography.bodyFont}', sans-serif`,
    '--button-height': arch.buttonStyle.height,
    '--button-radius': arch.buttonStyle.radius,
  };
}

/**
 * Convert DesignTokens object to a `:root { ... }` CSS block.
 * Also defines backward-compatible aliases for legacy theme CSS (`--primary`, etc.)
 */
export function tokensToCSSVariables(tokens: DesignTokens): string {
  const tokenLines = Object.entries(tokens)
    .map(([key, val]) => `  ${key}: ${val};`)
    .join('\n');

  // Alias map for legacy theme compatibility
  const legacyAliases = `
  /* Legacy compatibility aliases */
  --primary: var(--color-primary);
  --secondary: var(--color-secondary);
  --accent: var(--color-accent);
  --bg-primary: var(--color-background);
  --bg-secondary: var(--color-surface);
  --text-primary: var(--color-text);
  --text-secondary: var(--color-muted);
  --border-color: var(--color-border);
  --border-radius: var(--radius-medium);
  --border-radius-lg: var(--radius-large);
  --shadow-sm: var(--shadow-soft);
  --shadow-md: var(--shadow-medium);
  --shadow-lg: var(--shadow-medium);
  --space-2xl: var(--section-space);
  `;

  return `:root {\n${tokenLines}\n${legacyAliases}\n}`;
}

/**
 * Convert DesignTokens object to Shopify settings_data.json schema
 */
export function tokensToShopifySettings(tokens: DesignTokens) {
  return {
    current: {
      color_primary: tokens['--color-primary'],
      color_secondary: tokens['--color-secondary'],
      color_accent: tokens['--color-accent'],
      color_background: tokens['--color-background'],
      color_surface: tokens['--color-surface'],
      color_text: tokens['--color-text'],
      color_border: tokens['--color-border'],
      radius_medium: tokens['--radius-medium'],
      font_heading: tokens['--font-heading'],
      font_body: tokens['--font-body'],
    },
  };
}
