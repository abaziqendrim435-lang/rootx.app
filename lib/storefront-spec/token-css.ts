// ============================================================
// RootX Storefront Pixel Parity Engine V3 — Senior UI/UX Design System
// Emits standardized --rx-* CSS tokens, fluid typography, luxury spacing,
// elevation depth, micro-animations, glassmorphism, and mobile-first rules.
// ============================================================

import type { StorefrontSpec } from './types';
import { getArchetype } from '../design-engine/archetypes';

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `${r}, ${g}, ${b}`;
  } else if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return '59, 130, 246';
}

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

  const primaryRgb = hexToRgb(primary);
  const secondaryRgb = hexToRgb(secondary);

  const headingFont = t['--font-heading'] || arch.typography.headingFont;
  const bodyFont = t['--font-body'] || arch.typography.bodyFont;
  const headingFontFamily = `'${headingFont}', ${headingFont.includes('Garamond') || headingFont.includes('Playfair') ? 'serif' : 'sans-serif'}`;
  const bodyFontFamily = `'${bodyFont}', sans-serif`;

  return `:root {
  /* Color Tokens & Brand Aliases */
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

  --rx-primary-rgb: ${primaryRgb};
  --rx-secondary-rgb: ${secondaryRgb};
  --rx-primary-glow: rgba(${primaryRgb}, 0.25);
  --rx-surface-glass: rgba(${primaryRgb}, 0.04);
  --rx-border-subtle: rgba(${primaryRgb}, 0.12);

  /* Typography Scale */
  --rx-heading-font: ${headingFontFamily};
  --rx-body-font: ${bodyFontFamily};
  --rx-font-heading: ${headingFontFamily};
  --rx-font-body: ${bodyFontFamily};
  --rx-heading-transform: ${arch.typography.headingTransform || 'none'};
  --rx-heading-weight: ${arch.typography.headingWeight || '700'};
  --rx-body-weight: ${arch.typography.bodyWeight || '400'};

  --rx-font-3xs: 0.7rem;
  --rx-font-2xs: 0.75rem;
  --rx-font-xs: 0.85rem;
  --rx-font-sm: 0.95rem;
  --rx-font-base: 1.05rem;
  --rx-font-lg: 1.25rem;
  --rx-font-xl: 1.5rem;
  --rx-font-2xl: clamp(1.6rem, 2.5vw, 2.25rem);
  --rx-font-3xl: clamp(2.1rem, 3.5vw, 3rem);
  --rx-font-4xl: clamp(2.5rem, 5vw, 3.8rem);
  --rx-font-5xl: clamp(3rem, 6.5vw, 4.8rem);

  --rx-lh-tight: 1.1;
  --rx-lh-snug: 1.25;
  --rx-lh-normal: 1.5;
  --rx-lh-relaxed: 1.7;

  --rx-tracking-tight: -0.03em;
  --rx-tracking-normal: 0;
  --rx-tracking-wide: 0.08em;
  --rx-tracking-widest: 0.25em;

  /* Spacing Scale */
  --rx-space-3xs: 0.25rem;
  --rx-space-2xs: 0.5rem;
  --rx-space-xs: 0.75rem;
  --rx-space-sm: 1rem;
  --rx-space-md: 1.5rem;
  --rx-space-lg: 2.5rem;
  --rx-space-xl: 4rem;
  --rx-space-2xl: 6rem;
  --rx-space-3xl: 8rem;

  --rx-container: ${spec.responsiveSettings.containerMaxWidth};
  --rx-container-width: ${spec.responsiveSettings.containerMaxWidth};
  --rx-section-space: ${arch.sectionSpacing};
  --rx-section-space-desktop: ${arch.sectionSpacing};
  --rx-section-space-mobile: calc(${arch.sectionSpacing} * 0.55);
  --rx-desktop-padding: ${spec.responsiveSettings.desktopPadding};
  --rx-mobile-padding: ${spec.responsiveSettings.mobilePadding};

  /* Elevation & Shadow System */
  --rx-shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --rx-shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.06);
  --rx-shadow-md: 0 8px 24px rgba(0, 0, 0, 0.08);
  --rx-shadow-lg: 0 16px 40px rgba(0, 0, 0, 0.12);
  --rx-shadow-xl: 0 24px 60px rgba(0, 0, 0, 0.18);
  --rx-shadow-glow: 0 0 35px var(--rx-primary-glow);
  --rx-shadow-glass: 0 8px 32px 0 rgba(0, 0, 0, 0.2);

  --rx-shadow: ${t['--shadow-medium'] || '0 8px 24px rgba(0, 0, 0, 0.08)'};
  --rx-shadow-soft: ${t['--shadow-soft'] || '0 4px 12px rgba(0, 0, 0, 0.05)'};
  --rx-shadow-medium: ${t['--shadow-medium'] || '0 8px 24px rgba(0, 0, 0, 0.08)'};

  /* Radius System */
  --rx-radius-xs: 4px;
  --rx-radius-sm: ${t['--radius-small'] || '6px'};
  --rx-radius-md: ${t['--radius-medium'] || '12px'};
  --rx-radius-lg: ${t['--radius-large'] || '20px'};
  --rx-radius-xl: 32px;
  --rx-radius-full: 9999px;

  --rx-button-height: ${t['--button-height'] || '52px'};
  --rx-button-radius: ${t['--button-radius'] || '12px'};
  --rx-transition-fast: 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  --rx-transition-base: 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  --rx-transition-slow: 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Global Reset & Box Sizing */
*, *::before, *::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--rx-color-background);
  color: var(--rx-color-text);
  font-family: var(--rx-font-body);
  font-weight: var(--rx-body-weight);
  font-size: var(--rx-font-base);
  line-height: var(--rx-lh-normal);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Grid & Layout System */
.container {
  width: 100%;
  max-width: var(--rx-container-width);
  margin: 0 auto;
  padding-left: var(--rx-desktop-padding);
  padding-right: var(--rx-desktop-padding);
}

.rx-grid {
  display: grid;
  gap: var(--rx-space-lg);
}

.rx-grid-1 { grid-template-columns: 1fr; }
.rx-grid-2 { grid-template-columns: repeat(2, 1fr); }
.rx-grid-3 { grid-template-columns: repeat(3, 1fr); }
.rx-grid-4 { grid-template-columns: repeat(4, 1fr); }
.rx-grid-split { grid-template-columns: 1.1fr 0.9fr; }

@media (max-width: 992px) {
  .rx-grid-3, .rx-grid-4, .rx-grid-split {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .container {
    padding-left: var(--rx-mobile-padding);
    padding-right: var(--rx-mobile-padding);
  }
  .rx-grid-2, .rx-grid-3, .rx-grid-4, .rx-grid-split {
    grid-template-columns: 1fr;
  }
}

/* Senior UI Button Component Scale */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-decoration: none;
  font-family: var(--rx-font-body);
  font-weight: 700;
  font-size: var(--rx-font-base);
  letter-spacing: var(--rx-tracking-normal);
  border: 1px solid transparent;
  cursor: pointer;
  height: var(--rx-button-height);
  padding: 0 var(--rx-space-lg);
  border-radius: var(--rx-button-radius);
  transition: transform var(--rx-transition-base), box-shadow var(--rx-transition-base), background-color var(--rx-transition-base), filter var(--rx-transition-base);
  line-height: 1;
  white-space: nowrap;
  user-select: none;
  min-height: 48px;
}

.btn-primary {
  background-color: var(--rx-color-primary);
  color: #ffffff;
  box-shadow: var(--rx-shadow-md), 0 0 0 1px var(--rx-primary-glow);
}

.btn-primary:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: var(--rx-shadow-lg), var(--rx-shadow-glow);
  filter: brightness(1.08);
}

.btn-primary:active {
  transform: translateY(0) scale(0.99);
}

.btn-secondary {
  background-color: var(--rx-color-surface);
  color: var(--rx-color-text);
  border-color: var(--rx-color-border);
  box-shadow: var(--rx-shadow-xs);
}

.btn-secondary:hover {
  background-color: var(--rx-color-background);
  border-color: var(--rx-color-primary);
  color: var(--rx-color-primary);
  transform: translateY(-2px);
}

.btn-glass {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: inherit;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-glass:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-2px);
}

.btn-full {
  width: 100%;
}

/* Glassmorphism & Card Utility Classes */
.rx-card {
  background: var(--rx-color-surface);
  border: 1px solid var(--rx-color-border);
  border-radius: var(--rx-radius-lg);
  padding: var(--rx-space-lg);
  box-shadow: var(--rx-shadow-sm);
  transition: transform var(--rx-transition-base), box-shadow var(--rx-transition-base), border-color var(--rx-transition-base);
}

.rx-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--rx-shadow-md);
  border-color: var(--rx-border-subtle);
}

.rx-glass-card {
  background: rgba(${primaryRgb}, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--rx-border-subtle);
  border-radius: var(--rx-radius-lg);
  padding: var(--rx-space-lg);
  box-shadow: var(--rx-shadow-glass);
}

/* Floating Card / Badge Accents */
.rx-badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.9rem;
  border-radius: var(--rx-radius-full);
  font-size: var(--rx-font-xs);
  font-weight: 700;
  letter-spacing: var(--rx-tracking-wide);
  text-transform: uppercase;
  background: rgba(${primaryRgb}, 0.1);
  color: var(--rx-color-primary);
  border: 1px solid rgba(${primaryRgb}, 0.2);
}

.rx-floating-card {
  position: absolute;
  background: var(--rx-color-surface);
  border: 1px solid var(--rx-color-border);
  border-radius: var(--rx-radius-md);
  padding: 0.75rem 1.25rem;
  box-shadow: var(--rx-shadow-lg);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 10;
  animation: rx-float 4s ease-in-out infinite;
}

/* Micro-Interaction Keyframes */
@keyframes rx-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes rx-slide-up {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes rx-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

@keyframes rx-pulse-glow {
  0%, 100% { box-shadow: 0 0 15px var(--rx-primary-glow); }
  50% { box-shadow: 0 0 35px var(--rx-primary-glow); }
}

@keyframes rx-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.rx-animate-fade { animation: rx-fade-in 0.6s var(--rx-transition-base) forwards; }
.rx-animate-slide { animation: rx-slide-up 0.7s var(--rx-transition-base) forwards; }
.rx-animate-float { animation: rx-float 4s ease-in-out infinite; }

/* Image Hover Zoom Utility */
.rx-img-zoom-wrap {
  overflow: hidden;
  border-radius: var(--rx-radius-lg);
}

.rx-img-zoom-wrap img {
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.rx-img-zoom-wrap:hover img {
  transform: scale(1.05);
}
`;
}
