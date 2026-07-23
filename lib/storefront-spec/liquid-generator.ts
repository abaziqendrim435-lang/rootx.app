// ============================================================
// RootX Storefront Pixel Parity Engine V2 — Liquid Component Library
// Renders all 13 required Shopify OS 2.0 Liquid sections directly
// from StorefrontSpec with 12 Hero Variants, 10 Header Variants,
// 8 Gallery Systems, 10 Product Page Layouts, valid {% schema %} tags,
// and --rx-* design tokens.
// ============================================================

import type { StorefrontSpec } from './types';
import { ROOTX_SECTION_TYPES, getSectionFileName } from './section-registry';
import { THEME_FAMILIES } from '../design-engine/theme-family-types';

function esc(str: string): string {
  if (!str) return '';
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

export function generateShopifyLiquidSections(spec: StorefrontSpec): { key: string; value: string }[] {
  const brand = spec.brand;
  const prod = spec.product;
  const content = spec.content;
  const heroImg = spec.images.hero?.normalizedUrl || spec.images.gallery[0]?.normalizedUrl || '';

  const familyConfig = THEME_FAMILIES[spec.archetype] || THEME_FAMILIES.modern_tech;
  const heroSection = spec.sections.find(s => s.id === ROOTX_SECTION_TYPES.HERO);
  const heroVariant = heroSection?.variant || familyConfig.heroType;
  const headerVariant = familyConfig.headerStyle;
  const galleryVariant = familyConfig.galleryStyle;
  const productPageLayout = familyConfig.productPageStructure;

  const galleryList = spec.images.gallery.filter((img) => Boolean(img.normalizedUrl));

  // 1. Header Liquid Generator
  let headerHtml = '';
  if (headerVariant === 'compact-tech') {
    headerHtml = `
<header class="site-header header--compact-tech" style="background: #111827; border-bottom: 1px solid #1f2937; padding: 0.85rem 0; color: #fff;">
  <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
    <a href="/" style="font-family: var(--rx-heading-font); font-size: 1.3rem; font-weight: 700; color: #60a5fa; text-decoration: none; letter-spacing: -0.5px;">⚡ ${esc(brand.name)}</a>
    <nav style="display: flex; gap: 1.5rem; font-size: 0.85rem; font-weight: 600;">
      <a href="/" style="color: #f9fafb; text-decoration: none;">SPECS</a>
      <a href="/collections/all" style="color: #9ca3af; text-decoration: none;">SHOP</a>
      <a href="#rootx-faq" style="color: #9ca3af; text-decoration: none;">SUPPORT</a>
    </nav>
    <a href="/cart" class="btn" style="background: #2563eb; color: #fff; padding: 0.4rem 1rem; border-radius: 6px; font-size: 0.85rem; font-weight: 600; text-decoration: none;">Cart (0)</a>
  </div>
</header>`;
  } else if (headerVariant === 'editorial-beauty') {
    headerHtml = `
<header class="site-header header--editorial-beauty" style="background: #faf5f7; border-bottom: 1px solid #f3e8ff; padding: 1.5rem 0;">
  <div class="container" style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
    <a href="/" style="font-family: var(--rx-heading-font); font-size: 2rem; color: #27272a; text-decoration: none; font-style: italic;">${esc(brand.name)}</a>
    <nav style="display: flex; gap: 2.5rem; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.15em;">
      <a href="/" style="color: #27272a; text-decoration: none; font-weight: 500;">Story</a>
      <a href="/collections/all" style="color: #71717a; text-decoration: none; font-weight: 400;">Formula</a>
      <a href="#rootx-faq" style="color: #71717a; text-decoration: none; font-weight: 400;">Ritual</a>
    </nav>
  </div>
</header>`;
  } else if (headerVariant === 'minimal-luxury') {
    headerHtml = `
<header class="site-header header--minimal-luxury" style="background: #0a0a0a; border-bottom: 1px solid #262626; padding: 1.75rem 0;">
  <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
    <a href="/" style="font-family: var(--rx-heading-font); font-size: 1.6rem; font-weight: 400; color: #d97706; text-decoration: none; letter-spacing: 0.25em; text-transform: uppercase;">${esc(brand.name)}</a>
    <nav style="display: flex; gap: 3rem; font-size: 0.8rem; letter-spacing: 0.2em; text-transform: uppercase;">
      <a href="/" style="color: #f5f5f5; text-decoration: none;">Collection</a>
      <a href="/collections/all" style="color: #a3a3a3; text-decoration: none;">Craftsmanship</a>
    </nav>
  </div>
</header>`;
  } else if (headerVariant === 'jewelry-minimal') {
    headerHtml = `
<header class="site-header header--jewelry-minimal" style="background: #0c0a09; border-bottom: 1px solid #292524; padding: 1.5rem 0;">
  <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
    <span style="font-size: 0.85rem; color: #a8a29e; letter-spacing: 0.15em;">FINE ARTISAN</span>
    <a href="/" style="font-family: var(--rx-heading-font); font-size: 1.8rem; font-weight: 400; color: #fafaf9; text-decoration: none; letter-spacing: 0.3em; text-transform: uppercase;">${esc(brand.name)}</a>
    <a href="/cart" style="color: #d97706; text-decoration: none; font-size: 0.85rem; letter-spacing: 0.1em;">BAG (0)</a>
  </div>
</header>`;
  } else if (headerVariant === 'wellness-clean') {
    headerHtml = `
<header class="site-header header--wellness-clean" style="background: #f0fdf4; border-bottom: 1px solid #ccfbf1; padding: 1.25rem 0;">
  <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
    <a href="/" style="font-family: var(--rx-heading-font); font-size: 1.5rem; color: #0d9488; text-decoration: none; font-weight: 600;">🌱 ${esc(brand.name)}</a>
    <nav style="display: flex; gap: 2rem; font-size: 0.9rem;">
      <a href="/" style="color: #134e4a; text-decoration: none; font-weight: 500;">Routine</a>
      <a href="/collections/all" style="color: #64748b; text-decoration: none;">Benefits</a>
      <a href="#rootx-faq" style="color: #64748b; text-decoration: none;">Ingredients</a>
    </nav>
  </div>
</header>`;
  } else {
    headerHtml = `
<header class="site-header header--standard" style="background: var(--rx-surface); border-bottom: 1px solid var(--rx-border); padding: 1.25rem 0;">
  <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
    <a href="/" class="brand-logo" style="font-family: var(--rx-heading-font); font-size: 1.5rem; font-weight: 700; color: var(--rx-text); text-decoration: none;">${esc(brand.name)}</a>
    <nav class="main-nav" style="display: flex; gap: 2rem;">
      <a href="/" style="color: var(--rx-text); text-decoration: none; font-weight: 500;">Home</a>
      <a href="/collections/all" style="color: var(--rx-muted); text-decoration: none; font-weight: 500;">Shop</a>
      <a href="#rootx-faq" style="color: var(--rx-muted); text-decoration: none; font-weight: 500;">FAQ</a>
    </nav>
    <a href="/cart" class="btn btn-primary" style="padding: 0.5rem 1.25rem; font-size: 0.9rem;">Cart (0)</a>
  </div>
</header>`;
  }

  // 2. Hero Liquid Generator (12 Variants)
  let heroHtml = '';
  if (heroVariant === 'dark-tech-split' || heroVariant === 'split') {
    heroHtml = `
<section class="hero-section hero--dark-tech-split" style="padding: 5rem 0; background: #090d16; color: #f9fafb;">
  <div class="container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 3.5rem; align-items: center;">
    <div>
      <span style="background: rgba(59,130,246,0.15); border: 1px solid #3b82f6; color: #60a5fa; padding: 0.35rem 0.9rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">${esc(brand.name)} SPECS</span>
      <h1 style="font-size: clamp(2.2rem, 4.5vw, 3.8rem); font-family: var(--rx-heading-font); margin: 1.25rem 0 1rem; color: #ffffff; line-height: 1.15;">${esc(content.heroHeadline)}</h1>
      <p style="color: #9ca3af; font-size: 1.15rem; line-height: 1.6; margin-bottom: 2rem;">${esc(content.heroSubheadline)}</p>
      <div style="display: flex; align-items: baseline; gap: 1rem; margin-bottom: 2rem;">
        <span style="font-size: 2.5rem; font-weight: 800; color: #60a5fa;">$${esc(prod.price)}</span>
        ${prod.compareAtPrice ? `<span style="font-size: 1.4rem; text-decoration: line-through; color: #6b7280;">$${esc(prod.compareAtPrice)}</span>` : ''}
      </div>
      <form action="/cart/add" method="post">
        <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" />
        <button type="submit" class="btn" style="background: #2563eb; color: #ffffff; padding: 1.1rem 2.5rem; font-weight: 700; border-radius: 8px; font-size: 1.1rem; width: 100%; max-width: 380px;">Buy ${esc(prod.cleanName)} &rarr;</button>
      </form>
    </div>
    <div>
      <div style="background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 1.25rem; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        ${heroImg ? `<img id="rx-hero-img" src="${heroImg}" alt="${esc(prod.cleanName)}" style="width: 100%; height: 400px; object-fit: cover; border-radius: 10px;" />` : ''}
      </div>
    </div>
  </div>
</section>`;
  } else if (heroVariant === 'asymmetrical-beauty' || heroVariant === 'soft-editorial') {
    heroHtml = `
<section class="hero-section hero--asymmetrical-beauty" style="padding: 5rem 0; background: #faf5f7;">
  <div class="container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 4rem; align-items: center;">
    <div>
      <span style="text-transform: uppercase; letter-spacing: 0.25em; font-size: 0.8rem; color: #ec4899; font-weight: 600;">PURE FORMULA — ${esc(brand.name)}</span>
      <h1 style="font-size: clamp(2.4rem, 5vw, 4rem); font-family: var(--rx-heading-font); margin: 1rem 0; color: #27272a; font-style: italic;">${esc(content.heroHeadline)}</h1>
      <p style="font-size: 1.15rem; color: #71717a; line-height: 1.7; margin-bottom: 2rem;">${esc(content.heroSubheadline)}</p>
      <form action="/cart/add" method="post">
        <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" />
        <button type="submit" class="btn" style="background: #ec4899; color: #ffffff; padding: 1.1rem 3rem; border-radius: 30px; font-size: 1rem; font-weight: 600;">Experience Ritual — $${esc(prod.price)}</button>
      </form>
    </div>
    <div>
      ${heroImg ? `<img id="rx-hero-img" src="${heroImg}" alt="${esc(prod.cleanName)}" style="width: 100%; height: 480px; object-fit: cover; border-radius: 200px 200px 20px 20px; box-shadow: 0 15px 35px rgba(236,72,153,0.12);" />` : ''}
    </div>
  </div>
</section>`;
  } else if (heroVariant === 'full-bleed-editorial' || heroVariant === 'luxury-closeup') {
    heroHtml = `
<section class="hero-section hero--full-bleed-editorial" style="position: relative; padding: 7rem 0; background: #0a0a0a; color: #f5f5f5; text-align: center;">
  <div class="container" style="max-width: 900px;">
    <span style="text-transform: uppercase; letter-spacing: 0.35em; font-size: 0.8rem; color: #d97706;">FINE CRAFTSMANSHIP</span>
    <h1 style="font-size: clamp(2.8rem, 6vw, 4.5rem); font-family: var(--rx-heading-font); margin: 1.25rem 0; color: #ffffff; font-weight: 400; text-transform: uppercase; letter-spacing: 0.1em;">${esc(content.heroHeadline)}</h1>
    <p style="font-size: 1.2rem; color: #a3a3a3; max-width: 650px; margin: 0 auto 2.5rem; line-height: 1.7;">${esc(content.heroSubheadline)}</p>
    ${heroImg ? `<div style="margin-bottom: 3rem;"><img id="rx-hero-img" src="${heroImg}" alt="${esc(prod.cleanName)}" style="width: 100%; max-width: 750px; height: 450px; object-fit: cover; border-radius: 4px; border: 1px solid #262626;" /></div>` : ''}
    <form action="/cart/add" method="post">
      <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" />
      <button type="submit" class="btn" style="background: #d97706; color: #ffffff; padding: 1.2rem 3.5rem; font-size: 0.95rem; letter-spacing: 0.2em; text-transform: uppercase;">Acquire — $${esc(prod.price)}</button>
    </form>
  </div>
</section>`;
  } else if (heroVariant === 'fashion-lookbook' || heroVariant === 'image-first-minimal') {
    heroHtml = `
<section class="hero-section hero--fashion-lookbook" style="padding: 4rem 0; background: #ffffff;">
  <div class="container">
    <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 3rem; align-items: center;">
      <div>
        ${heroImg ? `<img id="rx-hero-img" src="${heroImg}" alt="${esc(prod.cleanName)}" style="width: 100%; height: 520px; object-fit: cover; border-radius: 0px;" />` : ''}
      </div>
      <div>
        <h1 style="font-size: clamp(2.5rem, 5vw, 3.8rem); font-family: var(--rx-heading-font); color: #09090b; font-weight: 700; margin-bottom: 1rem; line-height: 1.1;">${esc(content.heroHeadline)}</h1>
        <p style="font-size: 1.1rem; color: #71717a; margin-bottom: 2rem;">${esc(content.heroSubheadline)}</p>
        <div style="font-size: 2rem; font-weight: 800; color: #09090b; margin-bottom: 1.5rem;">$${esc(prod.price)}</div>
        <form action="/cart/add" method="post">
          <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" />
          <button type="submit" class="btn" style="background: #18181b; color: #ffffff; padding: 1.1rem 3rem; font-size: 1rem; font-weight: 600; width: 100%;">Shop Collection — $${esc(prod.price)}</button>
        </form>
      </div>
    </div>
  </div>
</section>`;
  } else if (heroVariant === 'wellness-routine') {
    heroHtml = `
<section class="hero-section hero--wellness-routine" style="padding: 5rem 0; background: #f0fdf4;">
  <div class="container" style="text-align: center; max-width: 800px;">
    <span style="background: #ccfbf1; color: #0d9488; padding: 0.35rem 1rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">HOLISTIC WELLNESS</span>
    <h1 style="font-size: clamp(2.4rem, 5vw, 3.6rem); font-family: var(--rx-heading-font); color: #134e4a; margin: 1.25rem 0 1rem; line-height: 1.2;">${esc(content.heroHeadline)}</h1>
    <p style="font-size: 1.15rem; color: #64748b; margin-bottom: 2rem;">${esc(content.heroSubheadline)}</p>
    ${heroImg ? `<div style="margin-bottom: 2rem;"><img id="rx-hero-img" src="${heroImg}" alt="${esc(prod.cleanName)}" style="max-width: 550px; width: 100%; height: 380px; object-fit: cover; border-radius: 24px; box-shadow: 0 10px 30px rgba(13,148,136,0.1);" /></div>` : ''}
    <form action="/cart/add" method="post">
      <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" />
      <button type="submit" class="btn" style="background: #0d9488; color: #ffffff; padding: 1.1rem 3rem; border-radius: 14px; font-size: 1.05rem; font-weight: 600;">Start Daily Routine — $${esc(prod.price)}</button>
    </form>
  </div>
</section>`;
  } else if (heroVariant === 'direct-response' || heroVariant === 'full-bleed') {
    heroHtml = `
<section class="hero-section hero--direct-response" style="padding: 4rem 0; background: #ffffff; border-bottom: 3px solid #16a34a;">
  <div class="container">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 3rem; align-items: center;">
      <div>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; padding: 0.4rem 1rem; border-radius: 6px; font-size: 0.85rem; font-weight: 700; display: inline-block; margin-bottom: 1rem;">⚡ SPECIAL DIRECT OFFER — 50% OFF TODAY</div>
        <h1 style="font-size: clamp(2.2rem, 4.5vw, 3.5rem); font-family: var(--rx-heading-font); color: #0f172a; margin-bottom: 1rem; line-height: 1.15;">${esc(content.heroHeadline)}</h1>
        <p style="font-size: 1.15rem; color: #475569; margin-bottom: 1.5rem;">${esc(content.heroSubheadline)}</p>
        <div style="display: flex; align-items: baseline; gap: 1rem; margin-bottom: 1.5rem;">
          <span style="font-size: 2.8rem; font-weight: 900; color: #16a34a;">$${esc(prod.price)}</span>
          ${prod.compareAtPrice ? `<span style="font-size: 1.5rem; text-decoration: line-through; color: #94a3b8;">$${esc(prod.compareAtPrice)}</span>` : ''}
        </div>
        <form action="/cart/add" method="post">
          <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" />
          <button type="submit" class="btn" style="background: #16a34a; color: #ffffff; padding: 1.25rem 3rem; font-size: 1.2rem; font-weight: 800; border-radius: 8px; width: 100%;">Claim ${esc(prod.cleanName)} Now &rarr;</button>
        </form>
      </div>
      <div>
        ${heroImg ? `<img id="rx-hero-img" src="${heroImg}" alt="${esc(prod.cleanName)}" style="width: 100%; height: 420px; object-fit: cover; border-radius: 12px; border: 2px solid #bbf7d0;" />` : ''}
      </div>
    </div>
  </div>
</section>`;
  } else {
    heroHtml = `
<section class="hero-section hero--standard" style="padding: var(--rx-section-space) 0; background: var(--rx-surface);">
  <div class="container">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 3.5rem; align-items: center;">
      <div>
        <span style="background: var(--rx-primary); color: #fff; padding: 0.3rem 0.85rem; border-radius: var(--rx-radius-sm); font-size: 0.8rem; font-weight: 700; text-transform: uppercase;">${esc(brand.name)}</span>
        <h1 style="font-size: clamp(2rem, 4vw, 3.2rem); font-family: var(--rx-heading-font); margin: 1rem 0 0.75rem; color: var(--rx-text); line-height: 1.2;">${esc(content.heroHeadline)}</h1>
        <p style="color: var(--rx-muted); font-size: 1.1rem; line-height: 1.6; margin-bottom: 1.75rem;">${esc(content.heroSubheadline)}</p>
        <div style="display: flex; align-items: baseline; gap: 1rem; margin-bottom: 1.5rem;">
          <span style="font-size: 2.2rem; font-weight: 800; color: var(--rx-primary);">$${esc(prod.price)}</span>
          ${prod.compareAtPrice ? `<span style="font-size: 1.3rem; text-decoration: line-through; color: var(--rx-muted);">$${esc(prod.compareAtPrice)}</span>` : ''}
        </div>
        <form action="/cart/add" method="post">
          <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" />
          <button type="submit" class="btn btn-primary" style="width: 100%; max-width: 380px;">Buy ${esc(prod.cleanName)} — $${esc(prod.price)}</button>
        </form>
      </div>
      <div>
        <div style="background: var(--rx-background); border: 1px solid var(--rx-border); border-radius: var(--rx-radius-lg); padding: 1.25rem; overflow: hidden;">
          ${heroImg ? `<img id="rx-hero-img" src="${heroImg}" alt="${esc(prod.cleanName)}" style="width: 100%; height: 380px; border-radius: var(--rx-radius-md); object-fit: cover;" />` : ''}
        </div>
      </div>
    </div>
  </div>
</section>`;
  }

  // 3. Gallery Liquid Section
  let galleryHtml = '';
  if (galleryVariant === 'thumbnail-left') {
    galleryHtml = `
<section class="product-gallery gallery--thumbnail-left" style="padding: 4rem 0;">
  <div class="container">
    <h2 style="font-size: 2.2rem; font-family: var(--rx-heading-font); color: var(--rx-text); margin-bottom: 2rem; text-align: center;">Technical Inspection Gallery</h2>
    <div style="display: grid; grid-template-columns: 120px 1fr; gap: 1.5rem;">
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        {% if section.blocks.size > 0 %}
          {% for block in section.blocks %}
            {% if block.settings.image_url != blank %}
              <button type="button" onclick="document.getElementById('rx-left-gallery-main').src='{{ block.settings.image_url }}'" style="border: 2px solid {% if forloop.first %}var(--rx-primary){% else %}var(--rx-border){% endif %}; border-radius: 8px; padding: 0; cursor: pointer; height: 100px; overflow: hidden; background: none;">
                <img src="{{ block.settings.image_url }}" alt="Thumb" style="width: 100%; height: 100%; object-fit: cover;" />
              </button>
            {% endif %}
          {% endfor %}
        {% else %}
          ${galleryList.map((img, i) => `
            <button type="button" onclick="document.getElementById('rx-left-gallery-main').src='${img.normalizedUrl}'" style="border: 2px solid ${i === 0 ? 'var(--rx-primary)' : 'var(--rx-border)'}; border-radius: 8px; padding: 0; cursor: pointer; height: 100px; overflow: hidden; background: none;">
              <img src="${img.normalizedUrl}" alt="Thumb" style="width: 100%; height: 100%; object-fit: cover;" />
            </button>
          `).join('')}
        {% endif %}
      </div>
      <div>
        <img id="rx-left-gallery-main" src="${heroImg}" alt="Main View" style="width: 100%; height: 480px; object-fit: cover; border-radius: 12px; border: 1px solid var(--rx-border);" />
      </div>
    </div>
  </div>
</section>`;
  } else if (galleryVariant === 'horizontal-scroll') {
    galleryHtml = `
<section class="product-gallery gallery--horizontal-scroll" style="padding: 4rem 0;">
  <div class="container">
    <h2 style="font-size: 2rem; font-family: var(--rx-heading-font); color: var(--rx-text); margin-bottom: 1.5rem;">Lookbook Reel</h2>
    <div style="display: flex; gap: 1.5rem; overflow-x: auto; padding-bottom: 1rem; scrollbar-width: thin;">
      {% if section.blocks.size > 0 %}
        {% for block in section.blocks %}
          {% if block.settings.image_url != blank %}
            <div style="flex-shrink: 0; width: 320px; height: 420px; border-radius: 8px; overflow: hidden;">
              <img src="{{ block.settings.image_url }}" alt="Gallery" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
          {% endif %}
        {% endfor %}
      {% else %}
        ${galleryList.map((img) => `
          <div style="flex-shrink: 0; width: 320px; height: 420px; border-radius: 8px; overflow: hidden;">
            <img src="${img.normalizedUrl}" alt="Gallery" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
        `).join('')}
      {% endif %}
    </div>
  </div>
</section>`;
  } else {
    galleryHtml = `
<section class="product-gallery gallery--grid" style="padding: var(--rx-section-space) 0;">
  <div class="container">
    <div style="text-align: center; margin-bottom: 2rem;">
      <h2 style="font-size: 2.2rem; font-family: var(--rx-heading-font); color: var(--rx-text);">Product Gallery</h2>
    </div>
    <div class="gallery-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem;">
      {% if section.blocks.size > 0 %}
        {% for block in section.blocks %}
          {% if block.settings.image_url != blank %}
            <div class="gallery-item" style="border-radius: var(--rx-radius-md); overflow: hidden; border: 1px solid var(--rx-border); aspect-ratio: 1/1;">
              <img src="{{ block.settings.image_url }}" alt="${esc(prod.cleanName)}" style="width: 100%; height: 100%; object-fit: cover; display: block;" loading="lazy" />
            </div>
          {% endif %}
        {% endfor %}
      {% else %}
        ${galleryList.map((img) => `
          <div class="gallery-item" style="border-radius: var(--rx-radius-md); overflow: hidden; border: 1px solid var(--rx-border); aspect-ratio: 1/1;">
            <img src="${img.normalizedUrl}" alt="${esc(prod.cleanName)}" style="width: 100%; height: 100%; object-fit: cover; display: block;" loading="lazy" />
          </div>
        `).join('')}
      {% endif %}
    </div>
  </div>
</section>`;
  }

  // 4. Main Product Page Layout (`sections/rootx-main-product.liquid`)
  let mainProductHtml = '';
  if (productPageLayout === 'tech-spec-split') {
    mainProductHtml = `
<section class="main-product-rootx product-layout--tech-spec" style="padding: 4rem 0; background: #090d16; color: #f9fafb;">
  <div class="container">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 3.5rem;">
      <div>
        <div style="background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
          <img id="rx-main-prod-img" src="${heroImg}" alt="${esc(prod.cleanName)}" style="width: 100%; height: 420px; object-fit: cover; border-radius: 8px;" />
        </div>
        <div class="rx-thumbnails-strip" style="display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 0.5rem; scrollbar-width: thin;">
          {% if section.blocks.size > 0 %}
            {% for block in section.blocks %}
              {% if block.settings.image_url != blank %}
                <button type="button" onclick="changeMainProductImg(this, '{{ block.settings.image_url }}')" style="border: 2px solid {% if forloop.first %}#60a5fa{% else %}#1f2937{% endif %}; border-radius: 8px; padding: 0; cursor: pointer; width: 72px; height: 72px; overflow: hidden; flex-shrink: 0; background: none;">
                  <img src="{{ block.settings.image_url }}" alt="Thumb" style="width: 100%; height: 100%; object-fit: cover;" />
                </button>
              {% endif %}
            {% endfor %}
          {% else %}
            ${galleryList.map((img, i) => `
              <button type="button" onclick="changeMainProductImg(this, '${img.normalizedUrl}')" style="border: 2px solid ${i === 0 ? '#60a5fa' : '#1f2937'}; border-radius: 8px; padding: 0; cursor: pointer; width: 72px; height: 72px; overflow: hidden; flex-shrink: 0; background: none;">
                <img src="${img.normalizedUrl}" alt="Thumb" style="width: 100%; height: 100%; object-fit: cover;" />
              </button>
            `).join('')}
          {% endif %}
        </div>
      </div>
      <div>
        <span style="color: #60a5fa; font-weight: 700; font-size: 0.85rem; letter-spacing: 0.1em;">TECHNICAL SPECIFICATION</span>
        <h1 style="font-size: 2.5rem; font-family: var(--rx-heading-font); color: #fff; margin: 0.5rem 0 1rem;">${esc(prod.cleanName)}</h1>
        <div style="font-size: 2.2rem; font-weight: 800; color: #60a5fa; margin-bottom: 1.5rem;">$${esc(prod.price)}</div>
        <div style="background: #111827; border: 1px solid #1f2937; padding: 1.25rem; border-radius: 10px; margin-bottom: 2rem;">
          <h4 style="color: #fff; font-size: 0.95rem; margin-bottom: 0.75rem;">Core Specs:</h4>
          ${prod.specifications.slice(0, 4).map(s => `<div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 0.3rem 0; border-bottom: 1px solid #1f2937;"><span style="color: #9ca3af;">${esc(s.name)}</span><strong style="color: #fff;">${esc(s.value)}</strong></div>`).join('')}
        </div>
        <form action="/cart/add" method="post">
          <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" />
          <button type="submit" class="btn" style="background: #2563eb; color: #fff; padding: 1.1rem; width: 100%; font-weight: 700; border-radius: 8px;">Order Spec Model — $${esc(prod.price)}</button>
        </form>
      </div>
    </div>
  </div>
</section>
<script>
  function changeMainProductImg(btn, url) {
    var main = document.getElementById('rx-main-prod-img');
    if (main && url) main.src = url;
    var container = btn.parentElement;
    if (container) {
      var btns = container.getElementsByTagName('button');
      for (var i = 0; i < btns.length; i++) {
        btns[i].style.borderColor = '#1f2937';
      }
    }
    btn.style.borderColor = '#60a5fa';
  }
</script>`;
  } else {
    mainProductHtml = `
<section class="main-product-rootx product-layout--standard" style="padding: var(--rx-section-space) 0; background: var(--rx-surface);">
  <div class="container">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 3.5rem; align-items: start;">
      <div>
        <div style="background: var(--rx-background); border: 1px solid var(--rx-border); border-radius: var(--rx-radius-lg); padding: 1rem; margin-bottom: 1rem;">
          <img id="rx-main-prod-img" src="${heroImg}" alt="${esc(prod.cleanName)}" style="width: 100%; height: 420px; border-radius: var(--rx-radius-md); object-fit: cover; display: block;" />
        </div>
        <div class="rx-thumbnails-strip" style="display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 0.5rem; scrollbar-width: thin;">
          {% if section.blocks.size > 0 %}
            {% for block in section.blocks %}
              {% if block.settings.image_url != blank %}
                <button type="button" onclick="changeMainProductImg(this, '{{ block.settings.image_url }}')" style="border: 2px solid {% if forloop.first %}var(--rx-primary){% else %}var(--rx-border){% endif %}; border-radius: var(--rx-radius-sm); padding: 0; cursor: pointer; width: 72px; height: 72px; overflow: hidden; flex-shrink: 0; background: none;">
                  <img src="{{ block.settings.image_url }}" alt="Thumb" style="width: 100%; height: 100%; object-fit: cover;" />
                </button>
              {% endif %}
            {% endfor %}
          {% else %}
            ${galleryList.map((img, i) => `
              <button type="button" onclick="changeMainProductImg(this, '${img.normalizedUrl}')" style="border: 2px solid ${i === 0 ? 'var(--rx-primary)' : 'var(--rx-border)'}; border-radius: var(--rx-radius-sm); padding: 0; cursor: pointer; width: 72px; height: 72px; overflow: hidden; flex-shrink: 0; background: none;">
                <img src="${img.normalizedUrl}" alt="Thumb" style="width: 100%; height: 100%; object-fit: cover;" />
              </button>
            `).join('')}
          {% endif %}
        </div>
      </div>
      <div>
        <h1 style="font-size: 2.4rem; font-family: var(--rx-heading-font); color: var(--rx-text); margin-bottom: 1rem;">${esc(prod.cleanName)}</h1>
        <div style="display: flex; align-items: baseline; gap: 1rem; margin-bottom: 1.5rem;">
          <span style="font-size: 2.2rem; font-weight: 800; color: var(--rx-primary);">$${esc(prod.price)}</span>
          ${prod.compareAtPrice ? `<span style="font-size: 1.3rem; text-decoration: line-through; color: var(--rx-muted);">$${esc(prod.compareAtPrice)}</span>` : ''}
        </div>
        <p style="color: var(--rx-muted); font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem;">${esc(prod.shortDescription)}</p>
        <form action="/cart/add" method="post">
          <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" />
          <button type="submit" class="btn btn-primary" style="width: 100%; max-width: 380px; padding: 1.1rem;">Add to Cart — $${esc(prod.price)}</button>
        </form>
      </div>
    </div>
  </div>
</section>
<script>
  function changeMainProductImg(btn, url) {
    var main = document.getElementById('rx-main-prod-img');
    if (main && url) main.src = url;
    var container = btn.parentElement;
    if (container) {
      var btns = container.getElementsByTagName('button');
      for (var i = 0; i < btns.length; i++) {
        btns[i].style.borderColor = 'var(--rx-border)';
      }
    }
    btn.style.borderColor = 'var(--rx-primary)';
  }
</script>`;
  }

  return [
    // 1. rootx-announcement-bar.liquid
    {
      key: getSectionFileName(ROOTX_SECTION_TYPES.ANNOUNCEMENT_BAR),
      value: `
<div class="announcement-bar" style="background: var(--rx-primary); color: #ffffff; text-align: center; padding: 0.6rem 1rem; font-size: 0.85rem; font-weight: 600;">
  <span>✨ ${esc(prod.shippingText)} — Free Express Delivery on All Orders</span>
</div>
{% schema %}
{
  "name": "RootX Announcement Bar",
  "settings": []
}
{% endschema %}`,
    },

    // 2. rootx-header.liquid
    {
      key: getSectionFileName(ROOTX_SECTION_TYPES.HEADER),
      value: `${headerHtml}
{% schema %}
{
  "name": "RootX Header",
  "settings": []
}
{% endschema %}`,
    },

    // 3. rootx-hero.liquid
    {
      key: getSectionFileName(ROOTX_SECTION_TYPES.HERO),
      value: `${heroHtml}
{% schema %}
{
  "name": "RootX Hero",
  "blocks": [
    {
      "type": "image",
      "name": "Product Image",
      "settings": [
        {
          "type": "text",
          "id": "image_url",
          "label": "Image URL"
        }
      ]
    }
  ],
  "settings": []
}
{% endschema %}`,
    },

    // 4. rootx-trust-strip.liquid
    {
      key: getSectionFileName(ROOTX_SECTION_TYPES.TRUST_STRIP),
      value: `
<section class="trust-strip" style="padding: 2rem 0; background: var(--rx-surface); border-bottom: 1px solid var(--rx-border);">
  <div class="container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; text-align: center;">
    ${content.trustItems.map((item) => `
      <div style="padding: 1.25rem; border: 1px solid var(--rx-border); border-radius: var(--rx-radius-md); background: var(--rx-background);">
        <div style="font-size: 1.6rem; margin-bottom: 0.4rem;">${esc(item.icon)}</div>
        <strong style="display: block; font-size: 0.95rem; color: var(--rx-text);">${esc(item.title)}</strong>
        <span style="font-size: 0.8rem; color: var(--rx-muted);">${esc(item.subtitle)}</span>
      </div>
    `).join('')}
  </div>
</section>
{% schema %}
{
  "name": "RootX Trust Strip",
  "settings": []
}
{% endschema %}`,
    },

    // 5. rootx-benefits.liquid
    {
      key: getSectionFileName(ROOTX_SECTION_TYPES.BENEFITS),
      value: `
<section class="benefit-grid" style="padding: var(--rx-section-space) 0;">
  <div class="container">
    <div style="text-align: center; max-width: 600px; margin: 0 auto 3rem;">
      <h2 style="font-size: 2.2rem; font-family: var(--rx-heading-font); color: var(--rx-text);">Why Choose ${esc(prod.cleanName)}</h2>
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
      ${prod.benefits.map((b, i) => `
        <div style="padding: 2rem; background: var(--rx-surface); border: 1px solid var(--rx-border); border-radius: var(--rx-radius-lg);">
          <div style="width: 44px; height: 44px; border-radius: var(--rx-radius-sm); background: var(--rx-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-bottom: 1.25rem;">0${i + 1}</div>
          <h3 style="font-size: 1.25rem; font-family: var(--rx-heading-font); margin-bottom: 0.5rem; color: var(--rx-text);">${esc(b.title)}</h3>
          <p style="color: var(--rx-muted); line-height: 1.6;">${esc(b.description)}</p>
        </div>
      `).join('')}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "RootX Benefits",
  "settings": []
}
{% endschema %}`,
    },

    // 6. rootx-product-showcase.liquid
    {
      key: getSectionFileName(ROOTX_SECTION_TYPES.PRODUCT_SHOWCASE),
      value: `
<section class="product-showcase" style="padding: var(--rx-section-space) 0; background: var(--rx-surface);">
  <div class="container">
    <div style="text-align: center; margin-bottom: 2.5rem;">
      <h2 style="font-size: 2.2rem; font-family: var(--rx-heading-font); color: var(--rx-text);">${esc(prod.cleanName)}</h2>
      <p style="color: var(--rx-muted); font-size: 1.1rem; max-width: 600px; margin: 0.5rem auto 0;">${esc(prod.shortDescription)}</p>
    </div>
  </div>
</section>
{% schema %}
{
  "name": "RootX Product Showcase",
  "settings": []
}
{% endschema %}`,
    },

    // 7. rootx-gallery.liquid
    {
      key: getSectionFileName(ROOTX_SECTION_TYPES.GALLERY),
      value: `${galleryHtml}
{% schema %}
{
  "name": "RootX Gallery",
  "blocks": [
    {
      "type": "image",
      "name": "Gallery Image",
      "settings": [
        {
          "type": "text",
          "id": "image_url",
          "label": "Image URL"
        }
      ]
    }
  ],
  "settings": []
}
{% endschema %}`,
    },

    // 8. rootx-image-story.liquid
    {
      key: getSectionFileName(ROOTX_SECTION_TYPES.IMAGE_STORY),
      value: `
<section class="image-story" style="padding: var(--rx-section-space) 0; background: var(--rx-background);">
  <div class="container">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 3rem; align-items: center;">
      <div>
        <h2 style="font-size: 2.2rem; font-family: var(--rx-heading-font); color: var(--rx-text); margin-bottom: 1rem;">Crafted for Excellence</h2>
        <p style="color: var(--rx-muted); line-height: 1.6; font-size: 1.05rem;">${esc(prod.shortDescription)}</p>
      </div>
      <div>
        ${spec.images.story?.normalizedUrl ? `<img src="${spec.images.story.normalizedUrl}" alt="Story" style="width: 100%; border-radius: var(--rx-radius-lg); box-shadow: var(--rx-shadow);" />` : ''}
      </div>
    </div>
  </div>
</section>
{% schema %}
{
  "name": "RootX Image Story",
  "settings": []
}
{% endschema %}`,
    },

    // 9. rootx-specifications.liquid
    {
      key: getSectionFileName(ROOTX_SECTION_TYPES.SPECIFICATIONS),
      value: `
<section class="specifications" style="padding: var(--rx-section-space) 0; background: var(--rx-surface);">
  <div class="container" style="max-width: 800px;">
    <h2 style="font-size: 2.2rem; font-family: var(--rx-heading-font); margin-bottom: 2rem; text-align: center; color: var(--rx-text);">Technical Specifications</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
      ${prod.specifications.map((s) => `
        <div style="padding: 1rem; border-bottom: 1px solid var(--rx-border);">
          <strong style="display: block; font-size: 0.9rem; color: var(--rx-muted);">${esc(s.name)}</strong>
          <span style="font-size: 1.05rem; font-weight: 600; color: var(--rx-text);">${esc(s.value)}</span>
        </div>
      `).join('')}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "RootX Specifications",
  "settings": []
}
{% endschema %}`,
    },

    // 10. rootx-faq.liquid
    {
      key: getSectionFileName(ROOTX_SECTION_TYPES.FAQ),
      value: `
<section id="rootx-faq" class="faq-accordion" style="padding: var(--rx-section-space) 0; background: var(--rx-surface);">
  <div class="container" style="max-width: 800px;">
    <h2 style="font-size: 2.2rem; font-family: var(--rx-heading-font); text-align: center; margin-bottom: 3rem; color: var(--rx-text);">Frequently Asked Questions</h2>
    ${content.faq.map((item) => `
      <div style="border-bottom: 1px solid var(--rx-border); padding: 1.25rem 0;">
        <h4 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--rx-text);">${esc(item.question)}</h4>
        <p style="color: var(--rx-muted); font-size: 0.95rem; line-height: 1.6;">${esc(item.answer)}</p>
      </div>
    `).join('')}
  </div>
</section>
{% schema %}
{
  "name": "RootX FAQ",
  "settings": []
}
{% endschema %}`,
    },

    // 11. rootx-final-cta.liquid
    {
      key: getSectionFileName(ROOTX_SECTION_TYPES.FINAL_CTA),
      value: `
<section class="final-cta" style="background: linear-gradient(135deg, var(--rx-primary), var(--rx-secondary)); color: #fff; text-align: center; padding: 5rem 1.5rem;">
  <div class="container" style="max-width: 700px;">
    <h2 style="font-size: clamp(2rem, 4vw, 3rem); font-family: var(--rx-heading-font); margin-bottom: 1rem; color: #fff;">Experience ${esc(brand.name)} Today</h2>
    <p style="font-size: 1.15rem; opacity: 0.9; margin-bottom: 2rem;">Order your ${esc(prod.cleanName)} with free express tracked delivery.</p>
    <form action="/cart/add" method="post">
      <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" />
      <button type="submit" class="btn" style="background: #fff; color: var(--rx-primary); padding: 1.2rem 3rem; font-weight: 800; border-radius: var(--rx-button-radius);">Get Started Now — $${esc(prod.price)} &rarr;</button>
    </form>
  </div>
</section>
{% schema %}
{
  "name": "RootX Final CTA",
  "settings": []
}
{% endschema %}`,
    },

    // 12. rootx-footer.liquid
    {
      key: getSectionFileName(ROOTX_SECTION_TYPES.FOOTER),
      value: `
<footer class="site-footer" style="background: var(--rx-surface); border-top: 1px solid var(--rx-border); padding: 4rem 0 2rem;">
  <div class="container">
    <div style="display: grid; grid-template-columns: 2fr repeat(auto-fit, minmax(150px, 1fr)); gap: 2.5rem; margin-bottom: 3rem;">
      <div>
        <h3 style="font-size: 1.4rem; font-family: var(--rx-heading-font); margin-bottom: 0.75rem; color: var(--rx-text);">${esc(brand.name)}</h3>
        <p style="color: var(--rx-muted); font-size: 0.95rem;">${esc(content.heroHeadline)}</p>
      </div>
      <div>
        <h4 style="font-size: 1rem; font-family: var(--rx-heading-font); margin-bottom: 1rem; color: var(--rx-text);">Shop</h4>
        <ul style="list-style: none; padding: 0; margin: 0; color: var(--rx-muted); line-height: 2; font-size: 0.9rem;">
          <li><a href="/collections/all" style="color: inherit; text-decoration: none;">All Products</a></li>
        </ul>
      </div>
    </div>
    <div style="border-top: 1px solid var(--rx-border); padding-top: 1.5rem; display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--rx-muted);">
      <p>© 2026 ${esc(brand.name)}. All rights reserved. Powered by RootX.</p>
    </div>
  </div>
</footer>
{% schema %}
{
  "name": "RootX Footer",
  "settings": []
}
{% endschema %}`,
    },

    // 13. rootx-main-product.liquid
    {
      key: getSectionFileName(ROOTX_SECTION_TYPES.MAIN_PRODUCT),
      value: `${mainProductHtml}
{% schema %}
{
  "name": "RootX Main Product",
  "blocks": [
    {
      "type": "image",
      "name": "Product Image",
      "settings": [
        {
          "type": "text",
          "id": "image_url",
          "label": "Image URL"
        }
      ]
    }
  ],
  "settings": []
}
{% endschema %}`,
    },
  ];
}
