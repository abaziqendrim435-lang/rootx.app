// ============================================================
// RootX Storefront Pixel Parity Engine V3 — Senior UI/UX Liquid Generator
// Renders 14 canonical Shopify OS 2.0 Liquid sections directly from StorefrontSpec:
// Header, Hero, Trust Strip, Benefits, Showcase, Gallery, Image Story,
// Specifications, FAQ, Comparison (Us vs. Others), Testimonials, Final CTA,
// Footer, and Main Product detail layout.
// ============================================================

import type { StorefrontSpec } from './types';
import { ROOTX_SECTION_TYPES, getSectionFileName } from './section-registry';
import { THEME_FAMILIES } from '../design-engine/theme-family-types';

function esc(str: string): string {
  if (!str) return '';
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function renderAssetImgTag(assetNameOrUrl: string, alt: string, style: string, id: string = ''): string {
  if (!assetNameOrUrl) return '';
  const idAttr = id ? `id="${id}" ` : '';
  if (assetNameOrUrl.startsWith('http://') || assetNameOrUrl.startsWith('https://')) {
    return `<img ${idAttr}src="${assetNameOrUrl}" alt="${esc(alt)}" style="${style}" loading="lazy" />`;
  }
  return `<img ${idAttr}src="{{ '${assetNameOrUrl}' | asset_url }}" alt="${esc(alt)}" style="${style}" loading="lazy" />`;
}

function resolveAssetUrlExpression(assetNameOrUrl: string): string {
  if (!assetNameOrUrl) return '';
  if (assetNameOrUrl.startsWith('http://') || assetNameOrUrl.startsWith('https://')) {
    return assetNameOrUrl;
  }
  return `{{ '${assetNameOrUrl}' | asset_url }}`;
}

export function generateShopifyLiquidSections(spec: StorefrontSpec): { key: string; value: string }[] {
  const brand = spec.brand;
  const prod = spec.product;
  const content = spec.content;
  const galleryList = spec.images.gallery.filter((img) => Boolean(img.exportedAssetName || img.normalizedUrl));
  const heroImgAsset = spec.images.hero?.exportedAssetName || spec.images.hero?.normalizedUrl || (galleryList[0] ? (galleryList[0].exportedAssetName || galleryList[0].normalizedUrl) : '');
  const activeHeroImg = heroImgAsset || (galleryList[0] ? (galleryList[0].exportedAssetName || galleryList[0].normalizedUrl) : '');
  const storyImgAsset = spec.images.story?.exportedAssetName || spec.images.story?.normalizedUrl || (galleryList[1] ? (galleryList[1].exportedAssetName || galleryList[1].normalizedUrl) : activeHeroImg);
  const showcaseImgAsset = spec.images.featured?.exportedAssetName || spec.images.featured?.normalizedUrl || (galleryList[2] ? (galleryList[2].exportedAssetName || galleryList[2].normalizedUrl) : storyImgAsset);
  const finalCtaImgAsset = spec.images.finalCta?.exportedAssetName || spec.images.finalCta?.normalizedUrl || storyImgAsset;

  const familyConfig = THEME_FAMILIES[spec.archetype] || THEME_FAMILIES.modern_tech;
  const heroSection = spec.sections.find(s => s.id === ROOTX_SECTION_TYPES.HERO);
  const heroVariant = heroSection?.variant || familyConfig.heroType;
  const headerVariant = familyConfig.headerStyle;
  const galleryVariant = familyConfig.galleryStyle;

  // ── 1. Header Liquid Section ─────────────────────────────────────
  let headerHtml = '';
  if (headerVariant === 'compact-tech') {
    headerHtml = `
<header class="site-header header--compact-tech" style="background: rgba(17, 24, 39, 0.95); backdrop-filter: blur(12px); border-bottom: 1px solid var(--rx-border); padding: 1rem 0; position: sticky; top: 0; z-index: 100;">
  <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
    <a href="/" style="font-family: var(--rx-heading-font); font-size: 1.35rem; font-weight: 800; color: var(--rx-primary); text-decoration: none; letter-spacing: -0.02em; display: flex; align-items: center; gap: 0.4rem;">
      <span style="background: var(--rx-primary); color: #fff; width: 28px; height: 28px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.9rem;">⚡</span>
      ${esc(brand.name)}
    </a>
    <nav style="display: flex; gap: 2rem; font-size: 0.88rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
      <a href="/" style="color: var(--rx-text); text-decoration: none;">Specs</a>
      <a href="/collections/all" style="color: var(--rx-muted); text-decoration: none;">Shop</a>
      <a href="#rootx-faq" style="color: var(--rx-muted); text-decoration: none;">Support</a>
    </nav>
    <a href="/cart" class="btn btn-primary" style="padding: 0.45rem 1.2rem; font-size: 0.85rem;">Cart (0)</a>
  </div>
</header>`;
  } else if (headerVariant === 'editorial-beauty') {
    headerHtml = `
<header class="site-header header--editorial-beauty" style="background: var(--rx-surface); border-bottom: 1px solid var(--rx-border); padding: 1.5rem 0;">
  <div class="container" style="display: flex; flex-direction: column; align-items: center; gap: 1.2rem;">
    <a href="/" style="font-family: var(--rx-heading-font); font-size: 2.2rem; color: var(--rx-text); text-decoration: none; font-style: italic; font-weight: 600;">${esc(brand.name)}</a>
    <nav style="display: flex; gap: 2.5rem; font-size: 0.88rem; text-transform: uppercase; letter-spacing: 0.18em;">
      <a href="/" style="color: var(--rx-text); text-decoration: none; font-weight: 600;">Story</a>
      <a href="/collections/all" style="color: var(--rx-muted); text-decoration: none;">Formula</a>
      <a href="#rootx-faq" style="color: var(--rx-muted); text-decoration: none;">Ritual</a>
    </nav>
  </div>
</header>`;
  } else if (headerVariant === 'minimal-luxury' || headerVariant === 'jewelry-minimal') {
    headerHtml = `
<header class="site-header header--minimal-luxury" style="background: var(--rx-background); border-bottom: 1px solid var(--rx-border); padding: 1.75rem 0;">
  <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
    <span style="font-size: 0.8rem; color: var(--rx-muted); letter-spacing: 0.2em; text-transform: uppercase;">MAISON DE CREATION</span>
    <a href="/" style="font-family: var(--rx-heading-font); font-size: 1.8rem; font-weight: 400; color: var(--rx-primary); text-decoration: none; letter-spacing: 0.3em; text-transform: uppercase;">${esc(brand.name)}</a>
    <a href="/cart" style="color: var(--rx-primary); text-decoration: none; font-size: 0.85rem; letter-spacing: 0.15em; font-weight: 600;">BAG (0)</a>
  </div>
</header>`;
  } else if (headerVariant === 'wellness-clean') {
    headerHtml = `
<header class="site-header header--wellness-clean" style="background: var(--rx-background); border-bottom: 1px solid var(--rx-border); padding: 1.25rem 0;">
  <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
    <a href="/" style="font-family: var(--rx-heading-font); font-size: 1.5rem; color: var(--rx-primary); text-decoration: none; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">🌱 ${esc(brand.name)}</a>
    <nav style="display: flex; gap: 2.2rem; font-size: 0.92rem;">
      <a href="/" style="color: var(--rx-text); text-decoration: none; font-weight: 600;">Routine</a>
      <a href="/collections/all" style="color: var(--rx-muted); text-decoration: none;">Benefits</a>
      <a href="#rootx-faq" style="color: var(--rx-muted); text-decoration: none;">Ingredients</a>
    </nav>
    <a href="/cart" class="btn btn-secondary" style="padding: 0.45rem 1.25rem; font-size: 0.88rem;">Bag (0)</a>
  </div>
</header>`;
  } else {
    headerHtml = `
<header class="site-header header--standard" style="background: var(--rx-surface); border-bottom: 1px solid var(--rx-border); padding: 1.25rem 0; position: sticky; top: 0; z-index: 100; backdrop-filter: blur(12px);">
  <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
    <a href="/" class="brand-logo" style="font-family: var(--rx-heading-font); font-size: 1.6rem; font-weight: 800; color: var(--rx-text); text-decoration: none; letter-spacing: -0.02em;">${esc(brand.name)}</a>
    <nav class="main-nav" style="display: flex; gap: 2.2rem;">
      <a href="/" style="color: var(--rx-text); text-decoration: none; font-weight: 600;">Home</a>
      <a href="/collections/all" style="color: var(--rx-muted); text-decoration: none; font-weight: 500;">Shop</a>
      <a href="#rootx-faq" style="color: var(--rx-muted); text-decoration: none; font-weight: 500;">FAQ</a>
    </nav>
    <a href="/cart" class="btn btn-primary" style="padding: 0.5rem 1.4rem; font-size: 0.9rem;">Cart (0)</a>
  </div>
</header>`;
  }

  // ── 2. Hero Liquid Section (12 Senior UI Variants) ────────────────
  let heroHtml = '';
  if (heroVariant === 'dark-tech-split' || heroVariant === 'split') {
    heroHtml = `
<section class="hero-section hero--dark-tech-split" style="padding: var(--rx-section-space) 0; background: linear-gradient(135deg, #090d16 0%, #111827 100%); color: #f9fafb; position: relative; overflow: hidden;">
  <div style="position: absolute; width: 450px; height: 450px; background: radial-gradient(circle, var(--rx-primary-glow) 0%, transparent 70%); top: -100px; right: -100px; border-radius: 50%; pointer-events: none; opacity: 0.6;"></div>
  <div class="container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 4rem; align-items: center; position: relative; z-index: 2;">
    <div>
      <span class="rx-badge-pill" style="margin-bottom: 1.25rem;">⚡ ${esc(brand.name)} CANONICAL SPEC</span>
      <h1 style="font-size: var(--rx-font-5xl); font-family: var(--rx-heading-font); margin: 0 0 1.25rem; color: #ffffff; line-height: var(--rx-lh-tight); letter-spacing: var(--rx-tracking-tight);">${esc(content.heroHeadline)}</h1>
      <p style="color: #9ca3af; font-size: var(--rx-font-lg); line-height: var(--rx-lh-relaxed); margin-bottom: 2rem; max-width: 520px;">${esc(content.heroSubheadline)}</p>
      
      <div style="display: flex; align-items: baseline; gap: 1rem; margin-bottom: 2rem;">
        <span style="font-size: 2.8rem; font-weight: 900; color: var(--rx-primary); letter-spacing: -0.03em;">$${esc(prod.price)}</span>
        ${prod.compareAtPrice ? `<span style="font-size: 1.5rem; text-decoration: line-through; color: #6b7280;">$${esc(prod.compareAtPrice)}</span>` : ''}
        <span style="background: rgba(34,197,94,0.15); border: 1px solid #22c55e; color: #4ade80; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700;">SAVE $20 TODAY</span>
      </div>

      <form action="/cart/add" method="post" style="margin-bottom: 2rem;">
        <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" />
        <button type="submit" class="btn btn-primary" style="width: 100%; max-width: 420px; height: 56px; font-size: 1.1rem;">Buy ${esc(prod.cleanName)} &rarr;</button>
      </form>

      <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; font-size: 0.85rem; color: #9ca3af;">
        <span>🛡️ 30-Day Guarantee</span>
        <span>🚚 Free Express Shipping</span>
        <span>🔒 SSL Encrypted</span>
      </div>
    </div>
    
    <div style="position: relative;">
      <div class="rx-glass-card rx-img-zoom-wrap" style="padding: 1.25rem; background: rgba(17, 24, 39, 0.7); border: 1px solid rgba(59, 130, 246, 0.2); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
        ${renderAssetImgTag(activeHeroImg, prod.cleanName, 'width: 100%; height: 460px; object-fit: cover; border-radius: var(--rx-radius-md); display: block;', 'rx-hero-img')}
      </div>
      <div class="rx-floating-card" style="bottom: 20px; left: -20px; background: #1f2937; border-color: #374151; color: #fff;">
        <span style="font-size: 1.5rem;">★</span>
        <div>
          <strong style="display: block; font-size: 0.9rem; color: #fff;">4.9 / 5.0 Rating</strong>
          <span style="font-size: 0.75rem; color: #9ca3af;">1,240+ Verified Tech Buyers</span>
        </div>
      </div>
    </div>
  </div>
</section>`;
  } else if (heroVariant === 'asymmetrical-beauty' || heroVariant === 'soft-editorial') {
    heroHtml = `
<section class="hero-section hero--asymmetrical-beauty" style="padding: var(--rx-section-space) 0; background: var(--rx-background); color: var(--rx-text);">
  <div class="container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 4.5rem; align-items: center;">
    <div>
      <span class="rx-badge-pill" style="margin-bottom: 1.25rem; background: rgba(236,72,153,0.1); color: var(--rx-primary); border-color: rgba(236,72,153,0.2);">PURE FORMULA — ${esc(brand.name)}</span>
      <h1 style="font-size: var(--rx-font-5xl); font-family: var(--rx-heading-font); margin: 0 0 1.25rem; color: var(--rx-text); font-style: italic; line-height: var(--rx-lh-tight);">${esc(content.heroHeadline)}</h1>
      <p style="font-size: var(--rx-font-lg); color: var(--rx-muted); line-height: var(--rx-lh-relaxed); margin-bottom: 2.25rem; max-width: 500px;">${esc(content.heroSubheadline)}</p>
      
      <form action="/cart/add" method="post" style="margin-bottom: 2rem;">
        <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" />
        <button type="submit" class="btn btn-primary" style="padding: 0 3.2rem; border-radius: var(--rx-radius-full); height: 56px; font-size: 1.05rem;">Experience Ritual — $${esc(prod.price)}</button>
      </form>

      <div style="display: flex; gap: 2rem; font-size: 0.85rem; color: var(--rx-muted);">
        <span>✨ 100% Organic</span>
        <span>🌿 Cruelty Free</span>
        <span>🌸 Dermatologist Tested</span>
      </div>
    </div>
    
    <div style="position: relative;">
      <div class="rx-img-zoom-wrap" style="border-radius: 240px 240px 30px 30px; box-shadow: var(--rx-shadow-lg); border: 4px solid #ffffff;">
        ${renderAssetImgTag(activeHeroImg, prod.cleanName, 'width: 100%; height: 520px; object-fit: cover; display: block;', 'rx-hero-img')}
      </div>
    </div>
  </div>
</section>`;
  } else if (heroVariant === 'full-bleed-editorial' || heroVariant === 'luxury-closeup') {
    heroHtml = `
<section class="hero-section hero--full-bleed-editorial" style="position: relative; padding: 7rem 0; background: var(--rx-background); color: var(--rx-text); text-align: center;">
  <div class="container" style="max-width: 960px;">
    <span style="text-transform: uppercase; letter-spacing: 0.35em; font-size: 0.8rem; color: var(--rx-primary); font-weight: 600; display: block; margin-bottom: 1.25rem;">FINE ARTISAN CRAFTSMANSHIP</span>
    <h1 style="font-size: var(--rx-font-5xl); font-family: var(--rx-heading-font); margin: 0 0 1.5rem; color: var(--rx-text); font-weight: 400; text-transform: uppercase; letter-spacing: 0.08em; line-height: var(--rx-lh-tight);">${esc(content.heroHeadline)}</h1>
    <p style="font-size: var(--rx-font-lg); color: var(--rx-muted); max-width: 650px; margin: 0 auto 3rem; line-height: var(--rx-lh-relaxed);">${esc(content.heroSubheadline)}</p>
    
    <div class="rx-img-zoom-wrap" style="margin: 0 auto 3.5rem; max-width: 800px; border-radius: var(--rx-radius-sm); border: 1px solid var(--rx-border); box-shadow: var(--rx-shadow-lg);">
      ${renderAssetImgTag(activeHeroImg, prod.cleanName, 'width: 100%; height: 480px; object-fit: cover; display: block;', 'rx-hero-img')}
    </div>
    
    <form action="/cart/add" method="post">
      <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" />
      <button type="submit" class="btn btn-primary" style="padding: 0 3.8rem; height: 56px; font-size: 0.95rem; letter-spacing: 0.2em; text-transform: uppercase; border-radius: 0;">Acquire — $${esc(prod.price)}</button>
    </form>
  </div>
</section>`;
  } else {
    heroHtml = `
<section class="hero-section hero--standard" style="padding: var(--rx-section-space) 0; background: var(--rx-surface); position: relative; overflow: hidden;">
  <div class="container">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 4.5rem; align-items: center;">
      <div>
        <span class="rx-badge-pill" style="margin-bottom: 1.25rem;">✨ OFFICIAL STORE — ${esc(brand.name)}</span>
        <h1 style="font-size: var(--rx-font-4xl); font-family: var(--rx-heading-font); margin: 0 0 1.25rem; color: var(--rx-text); line-height: var(--rx-lh-tight);">${esc(content.heroHeadline)}</h1>
        <p style="color: var(--rx-muted); font-size: var(--rx-font-lg); line-height: var(--rx-lh-relaxed); margin-bottom: 2rem;">${esc(content.heroSubheadline)}</p>
        
        <div style="display: flex; align-items: baseline; gap: 1.25rem; margin-bottom: 2rem;">
          <span style="font-size: 2.6rem; font-weight: 800; color: var(--rx-primary);">$${esc(prod.price)}</span>
          ${prod.compareAtPrice ? `<span style="font-size: 1.4rem; text-decoration: line-through; color: var(--rx-muted);">$${esc(prod.compareAtPrice)}</span>` : ''}
          <span style="background: rgba(16,185,129,0.12); color: #10b981; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700;">In Stock — Ready to Ship</span>
        </div>

        <form action="/cart/add" method="post" style="margin-bottom: 2rem;">
          <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" />
          <button type="submit" class="btn btn-primary" style="width: 100%; max-width: 420px; height: 56px; font-size: 1.1rem;">Buy ${esc(prod.cleanName)} — $${esc(prod.price)} &rarr;</button>
        </form>

        <div style="display: flex; gap: 1.5rem; font-size: 0.85rem; color: var(--rx-muted);">
          <span>🛡️ 30-Day Money-Back</span>
          <span>🚚 Free Tracked Shipping</span>
          <span>🔒 256-Bit SSL</span>
        </div>
      </div>
      
      <div style="position: relative;">
        <div class="rx-card rx-img-zoom-wrap" style="padding: 1.25rem; background: var(--rx-background);">
          ${renderAssetImgTag(activeHeroImg, prod.cleanName, 'width: 100%; height: 440px; border-radius: var(--rx-radius-md); object-fit: cover; display: block;', 'rx-hero-img')}
        </div>
        <div class="rx-floating-card" style="top: 20px; right: -15px;">
          <span style="font-size: 1.4rem;">🚚</span>
          <div>
            <strong style="display: block; font-size: 0.85rem; color: var(--rx-text);">Free Express Shipping</strong>
            <span style="font-size: 0.75rem; color: var(--rx-muted);">Tracked & Insured</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`;
  }

  // ── 3. Gallery Liquid Section ─────────────────────────────────────
  let galleryHtml = '';
  if (galleryVariant === 'thumbnail-left') {
    galleryHtml = `
<section class="product-gallery gallery--thumbnail-left" style="padding: var(--rx-section-space) 0; background: var(--rx-background);">
  <div class="container">
    <div style="text-align: center; max-width: 600px; margin: 0 auto 3rem;">
      <h2 style="font-size: var(--rx-font-3xl); font-family: var(--rx-heading-font); color: var(--rx-text);">Product Design & Detail Inspection</h2>
      <p style="color: var(--rx-muted); font-size: var(--rx-font-base);">Examine every angle of ${esc(prod.cleanName)}</p>
    </div>
    <div style="display: grid; grid-template-columns: 130px 1fr; gap: 2rem; align-items: start;">
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        {% if section.blocks.size > 0 %}
          {% for block in section.blocks %}
            {% if block.settings.image_url != blank %}
              <button type="button" onclick="document.getElementById('rx-left-gallery-main').src='{{ block.settings.image_url | asset_url }}'" style="border: 2px solid {% if forloop.first %}var(--rx-primary){% else %}var(--rx-border){% endif %}; border-radius: var(--rx-radius-sm); padding: 0; cursor: pointer; height: 110px; overflow: hidden; background: none; transition: border-color var(--rx-transition-base);">
                <img src="{{ block.settings.image_url | asset_url }}" alt="Thumb" style="width: 100%; height: 100%; object-fit: cover;" />
              </button>
            {% endif %}
          {% endfor %}
        {% else %}
          ${galleryList.map((img, i) => {
            const assetStr = img.exportedAssetName || img.normalizedUrl;
            return `
            <button type="button" onclick="document.getElementById('rx-left-gallery-main').src='${resolveAssetUrlExpression(assetStr)}'" style="border: 2px solid ${i === 0 ? 'var(--rx-primary)' : 'var(--rx-border)'}; border-radius: var(--rx-radius-sm); padding: 0; cursor: pointer; height: 110px; overflow: hidden; background: none; transition: border-color var(--rx-transition-base);">
              ${renderAssetImgTag(assetStr, 'Thumb', 'width: 100%; height: 100%; object-fit: cover;')}
            </button>`;
          }).join('')}
        {% endif %}
      </div>
      <div class="rx-img-zoom-wrap" style="border: 1px solid var(--rx-border); border-radius: var(--rx-radius-lg);">
        ${renderAssetImgTag(activeHeroImg, 'Main View', 'width: 100%; height: 540px; object-fit: cover; display: block;', 'rx-left-gallery-main')}
      </div>
    </div>
  </div>
</section>`;
  } else {
    galleryHtml = `
<section class="product-gallery gallery--grid" style="padding: var(--rx-section-space) 0; background: var(--rx-surface);">
  <div class="container">
    <div style="text-align: center; margin-bottom: 3rem;">
      <h2 style="font-size: var(--rx-font-3xl); font-family: var(--rx-heading-font); color: var(--rx-text);">Product Gallery</h2>
      <p style="color: var(--rx-muted); font-size: var(--rx-font-base);">Explore the craftsmanship and design details</p>
    </div>
    <div class="gallery-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.75rem;">
      {% if section.blocks.size > 0 %}
        {% for block in section.blocks %}
          {% if block.settings.image_url != blank %}
            <div class="rx-card rx-img-zoom-wrap" style="padding: 0; aspect-ratio: 1/1;">
              <img src="{{ block.settings.image_url | asset_url }}" alt="${esc(prod.cleanName)}" style="width: 100%; height: 100%; object-fit: cover; display: block;" loading="lazy" />
            </div>
          {% endif %}
        {% endfor %}
      {% else %}
        ${galleryList.map((img) => {
          const assetStr = img.exportedAssetName || img.normalizedUrl;
          return `
          <div class="rx-card rx-img-zoom-wrap" style="padding: 0; aspect-ratio: 1/1;">
            ${renderAssetImgTag(assetStr, prod.cleanName, 'width: 100%; height: 100%; object-fit: cover; display: block;')}
          </div>`;
        }).join('')}
      {% endif %}
    </div>
  </div>
</section>`;
  }

  // ── 4. Main Product Layout Section ────────────────────────────────
  const mainProductHtml = `
<section class="main-product-rootx product-layout--standard" style="padding: var(--rx-section-space) 0; background: var(--rx-surface);">
  <div class="container">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 4rem; align-items: start;">
      <div>
        <div class="rx-img-zoom-wrap" style="background: var(--rx-background); border: 1px solid var(--rx-border); border-radius: var(--rx-radius-lg); padding: 1.25rem; margin-bottom: 1.25rem; box-shadow: var(--rx-shadow-sm);">
          ${renderAssetImgTag(activeHeroImg, prod.cleanName, 'width: 100%; height: 460px; border-radius: var(--rx-radius-md); object-fit: cover; display: block;', 'rx-main-prod-img')}
        </div>
        <div class="rx-thumbnails-strip rx-thumbs-wrapper" style="display: flex; gap: 0.85rem; overflow-x: auto; padding-bottom: 0.5rem; scrollbar-width: thin;">
          {% if section.blocks.size > 0 %}
            {% for block in section.blocks %}
              {% if block.settings.image_url != blank %}
                <button type="button" onclick="document.getElementById('rx-main-prod-img').src='{{ block.settings.image_url | asset_url }}'" style="border: 2px solid {% if forloop.first %}var(--rx-primary){% else %}var(--rx-border){% endif %}; border-radius: var(--rx-radius-sm); padding: 0; cursor: pointer; width: 76px; height: 76px; overflow: hidden; flex-shrink: 0; background: none;">
                  <img src="{{ block.settings.image_url | asset_url }}" alt="Thumb" style="width: 100%; height: 100%; object-fit: cover;" />
                </button>
              {% endif %}
            {% endfor %}
          {% else %}
            ${galleryList.map((img, i) => {
              const assetStr = img.exportedAssetName || img.normalizedUrl;
              return `
              <button type="button" onclick="changeMainProductImg(this, '${resolveAssetUrlExpression(assetStr)}')" style="border: 2px solid ${i === 0 ? 'var(--rx-primary)' : 'var(--rx-border)'}; border-radius: var(--rx-radius-sm); padding: 0; cursor: pointer; width: 76px; height: 76px; overflow: hidden; flex-shrink: 0; background: none;">
                ${renderAssetImgTag(assetStr, 'Thumb', 'width: 100%; height: 100%; object-fit: cover;')}
              </button>`;
            }).join('')}
          {% endif %}
        </div>
      </div>
      <div>
        <span class="rx-badge-pill" style="margin-bottom: 1rem;">PREMIUM SPECIFICATION</span>
        <h1 style="font-size: var(--rx-font-4xl); font-family: var(--rx-heading-font); color: var(--rx-text); margin: 0 0 1rem; line-height: var(--rx-lh-tight);">${esc(prod.cleanName)}</h1>
        
        <div style="display: flex; align-items: baseline; gap: 1.25rem; margin-bottom: 1.75rem;">
          <span style="font-size: 2.5rem; font-weight: 900; color: var(--rx-primary);">$${esc(prod.price)}</span>
          ${prod.compareAtPrice ? `<span style="font-size: 1.4rem; text-decoration: line-through; color: var(--rx-muted);">$${esc(prod.compareAtPrice)}</span>` : ''}
          <span style="background: rgba(16,185,129,0.12); color: #10b981; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700;">Ready to Ship</span>
        </div>

        <p style="color: var(--rx-muted); font-size: var(--rx-font-lg); line-height: var(--rx-lh-relaxed); margin-bottom: 2.25rem;">${esc(prod.shortDescription)}</p>
        
        <form action="/cart/add" method="post" style="margin-bottom: 2rem;">
          <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" />
          <button type="submit" class="btn btn-primary" style="width: 100%; height: 56px; font-size: 1.1rem;">Add to Cart — $${esc(prod.price)}</button>
        </form>

        <div style="border-top: 1px solid var(--rx-border); padding-top: 1.5rem; display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.9rem; color: var(--rx-muted);">
          <div style="display: flex; align-items: center; gap: 0.6rem;"><span>🛡️</span> 30-Day Money-Back Guarantee</div>
          <div style="display: flex; align-items: center; gap: 0.6rem;"><span>🚚</span> Express Tracked Delivery Worldwide</div>
          <div style="display: flex; align-items: center; gap: 0.6rem;"><span>🔒</span> 256-Bit SSL Encrypted Checkout</div>
        </div>
      </div>
    </div>
  </div>
</section>
<script>
  function changeMainProductImg(btn, url) {
    var main = document.getElementById('rx-main-prod-img');
    if (main && url) {
      main.src = url;
    }
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

  return [
    // 1. rootx-announcement-bar.liquid
    {
      key: getSectionFileName(ROOTX_SECTION_TYPES.ANNOUNCEMENT_BAR),
      value: `
<div class="announcement-bar" style="background: var(--rx-primary); color: #ffffff; text-align: center; padding: 0.65rem 1rem; font-size: 0.88rem; font-weight: 700; letter-spacing: 0.03em;">
  <span>✨ ${esc(prod.shippingText)} — Free Express Tracked Delivery Worldwide</span>
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
<section class="trust-strip" style="padding: 2.5rem 0; background: var(--rx-surface); border-bottom: 1px solid var(--rx-border);">
  <div class="container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.75rem; text-align: center;">
    ${content.trustItems.map((item) => `
      <div class="rx-card" style="padding: 1.5rem; background: var(--rx-background); display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <div style="font-size: 2rem; width: 54px; height: 54px; border-radius: var(--rx-radius-md); background: rgba(var(--rx-primary-rgb), 0.08); display: flex; align-items: center; justify-content: center; margin-bottom: 0.25rem;">${esc(item.icon)}</div>
        <strong style="display: block; font-size: 1.05rem; color: var(--rx-text); font-family: var(--rx-heading-font);">${esc(item.title)}</strong>
        <span style="font-size: 0.85rem; color: var(--rx-muted);">${esc(item.subtitle)}</span>
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
<section class="benefit-grid" style="padding: var(--rx-section-space) 0; background: var(--rx-background);">
  <div class="container">
    <div style="text-align: center; max-width: 650px; margin: 0 auto 3.5rem;">
      <span class="rx-badge-pill" style="margin-bottom: 1rem;">WHY CHOOSE US</span>
      <h2 style="font-size: var(--rx-font-3xl); font-family: var(--rx-heading-font); color: var(--rx-text); margin: 0 0 0.75rem;">Engineered for Superior Performance</h2>
      <p style="color: var(--rx-muted); font-size: var(--rx-font-lg);">Experience the key advantages of ${esc(prod.cleanName)}</p>
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
      ${prod.benefits.map((b, i) => `
        <div class="rx-card" style="position: relative; overflow: hidden; padding: 2.25rem;">
          <div style="width: 48px; height: 48px; border-radius: var(--rx-radius-md); background: var(--rx-primary); color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; margin-bottom: 1.5rem; box-shadow: var(--rx-shadow-sm);">0${i + 1}</div>
          <h3 style="font-size: 1.3rem; font-family: var(--rx-heading-font); margin: 0 0 0.75rem; color: var(--rx-text);">${esc(b.title)}</h3>
          <p style="color: var(--rx-muted); line-height: var(--rx-lh-relaxed); font-size: 0.98rem; margin: 0;">${esc(b.description)}</p>
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
<section class="product-showcase" style="padding: var(--rx-section-space) 0; background: var(--rx-surface); border-top: 1px solid var(--rx-border); border-bottom: 1px solid var(--rx-border);">
  <div class="container">
    <div style="text-align: center; max-width: 700px; margin: 0 auto;">
      <span class="rx-badge-pill" style="margin-bottom: 1rem;">CRAFTSMANSHIP & DESIGN</span>
      <h2 style="font-size: var(--rx-font-3xl); font-family: var(--rx-heading-font); color: var(--rx-text); margin: 0 0 1rem;">${esc(prod.cleanName)}</h2>
      <p style="color: var(--rx-muted); font-size: var(--rx-font-lg); line-height: var(--rx-lh-relaxed); margin: 0 auto 2rem;">${esc(prod.shortDescription)}</p>
      ${showcaseImgAsset ? `<div class="rx-img-zoom-wrap" style="margin: 0 auto 2.5rem; max-width: 680px; border-radius: var(--rx-radius-lg); border: 1px solid var(--rx-border); box-shadow: var(--rx-shadow-lg);">${renderAssetImgTag(showcaseImgAsset, prod.cleanName, 'width: 100%; height: 380px; object-fit: cover; display: block;')}</div>` : ''}
      <form action="/cart/add" method="post">
        <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" />
        <button type="submit" class="btn btn-primary" style="padding: 0 3rem; height: 54px; font-size: 1.05rem;">Get Yours Today — $${esc(prod.price)} &rarr;</button>
      </form>
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
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 4rem; align-items: center;">
      <div>
        <span class="rx-badge-pill" style="margin-bottom: 1.25rem;">THE STORY</span>
        <h2 style="font-size: var(--rx-font-3xl); font-family: var(--rx-heading-font); color: var(--rx-text); margin: 0 0 1.25rem; line-height: var(--rx-lh-tight);">Designed with Precision & Uncompromising Quality</h2>
        <p style="color: var(--rx-muted); line-height: var(--rx-lh-relaxed); font-size: var(--rx-font-lg); margin-bottom: 2rem;">${esc(prod.shortDescription)}</p>
        <div style="display: flex; flex-direction: column; gap: 0.85rem; font-weight: 600; color: var(--rx-text);">
          <div style="display: flex; align-items: center; gap: 0.75rem;"><span style="color: var(--rx-primary); font-size: 1.2rem;">✓</span> Premium medical-grade durability</div>
          <div style="display: flex; align-items: center; gap: 0.75rem;"><span style="color: var(--rx-primary); font-size: 1.2rem;">✓</span> Meticulously tested across all environments</div>
          <div style="display: flex; align-items: center; gap: 0.75rem;"><span style="color: var(--rx-primary); font-size: 1.2rem;">✓</span> 100% Satisfaction backed by our 30-day guarantee</div>
        </div>
      </div>
      <div>
        ${storyImgAsset ? `<div class="rx-img-zoom-wrap" style="border-radius: var(--rx-radius-lg); box-shadow: var(--rx-shadow-lg); border: 1px solid var(--rx-border);">${renderAssetImgTag(storyImgAsset, 'Story', 'width: 100%; height: 440px; object-fit: cover; display: block;')}</div>` : ''}
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
  <div class="container" style="max-width: 850px;">
    <div style="text-align: center; margin-bottom: 3rem;">
      <span class="rx-badge-pill" style="margin-bottom: 1rem;">TECHNICAL DATA</span>
      <h2 style="font-size: var(--rx-font-3xl); font-family: var(--rx-heading-font); color: var(--rx-text); margin: 0;">Specifications & Features</h2>
    </div>
    <div class="rx-card" style="padding: 0; overflow: hidden; border-radius: var(--rx-radius-lg);">
      ${prod.specifications.map((s, idx) => `
        <div style="padding: 1.25rem 2rem; display: flex; justify-content: space-between; align-items: center; background: ${idx % 2 === 0 ? 'var(--rx-surface)' : 'var(--rx-background)'}; border-bottom: ${idx < prod.specifications.length - 1 ? '1px solid var(--rx-border)' : 'none'};">
          <strong style="font-size: 0.98rem; color: var(--rx-muted); font-weight: 600;">${esc(s.name)}</strong>
          <span style="font-size: 1.05rem; font-weight: 700; color: var(--rx-text);">${esc(s.value)}</span>
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

    // 10. rootx-comparison.liquid (Us vs. Competitors)
    {
      key: getSectionFileName(ROOTX_SECTION_TYPES.COMPARISON),
      value: `
<section class="comparison-section" style="padding: var(--rx-section-space) 0; background: var(--rx-background);">
  <div class="container" style="max-width: 900px;">
    <div style="text-align: center; margin-bottom: 3.5rem;">
      <span class="rx-badge-pill" style="margin-bottom: 1rem;">SIDE-BY-SIDE COMPARISON</span>
      <h2 style="font-size: var(--rx-font-3xl); font-family: var(--rx-heading-font); color: var(--rx-text); margin: 0 0 0.75rem;">Why ${esc(brand.name)} Outperforms Generic Alternatives</h2>
      <p style="color: var(--rx-muted); font-size: var(--rx-font-lg);">See how our product stacks up against cheap imitations</p>
    </div>
    <div class="rx-card" style="padding: 0; overflow: hidden;">
      <div style="display: grid; grid-template-columns: 2fr 1.5fr 1.5fr; background: var(--rx-surface); border-bottom: 2px solid var(--rx-border); padding: 1.25rem 1.5rem; font-weight: 800; font-size: 1rem; color: var(--rx-text); align-items: center;">
        <div>Feature</div>
        <div style="color: var(--rx-primary); text-align: center;">${esc(brand.name)}</div>
        <div style="color: var(--rx-muted); text-align: center; opacity: 0.7;">Generic Brands</div>
      </div>
      ${(content.comparison || [
        { feature: 'Build & Material Quality', us: '✅ Medical-Grade Precision', others: '❌ Cheap Synthetic Blend' },
        { feature: 'Money-Back Guarantee', us: '✅ 30-Day Full Refund', others: '❌ No Refunds / All Sales Final' },
        { feature: 'Customer Support', us: '✅ 24/7 Dedicated Support', others: '❌ Automated Bot / No Reply' },
        { feature: 'Shipping & Tracking', us: '✅ Express Insured Delivery', others: '❌ Uninsured 4-Week Delivery' },
      ]).map((row, idx) => `
        <div style="display: grid; grid-template-columns: 2fr 1.5fr 1.5fr; padding: 1.25rem 1.5rem; border-bottom: ${idx < 3 ? '1px solid var(--rx-border)' : 'none'}; background: ${idx % 2 === 0 ? 'var(--rx-surface)' : 'var(--rx-background)'}; align-items: center; font-size: 0.95rem;">
          <div style="font-weight: 600; color: var(--rx-text);">${esc(row.feature)}</div>
          <div style="text-align: center; font-weight: 700; color: var(--rx-primary); background: rgba(var(--rx-primary-rgb), 0.06); padding: 0.5rem; border-radius: 8px;">${esc(row.us)}</div>
          <div style="text-align: center; color: var(--rx-muted); padding: 0.5rem;">${esc(row.others)}</div>
        </div>
      `).join('')}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "RootX Comparison",
  "settings": []
}
{% endschema %}`,
    },

    // 11. rootx-testimonials.liquid
    {
      key: getSectionFileName(ROOTX_SECTION_TYPES.TESTIMONIALS),
      value: `
<section class="testimonials-section" style="padding: var(--rx-section-space) 0; background: var(--rx-surface);">
  <div class="container">
    <div style="text-align: center; max-width: 650px; margin: 0 auto 3.5rem;">
      <span class="rx-badge-pill" style="margin-bottom: 1rem;">VERIFIED BUYER REVIEWS</span>
      <h2 style="font-size: var(--rx-font-3xl); font-family: var(--rx-heading-font); color: var(--rx-text); margin: 0 0 0.75rem;">Loved by Thousands of Verified Customers</h2>
      <div style="font-size: 1.2rem; color: #f59e0b; margin-top: 0.5rem;">★★★★★ <span style="font-size: 0.95rem; color: var(--rx-muted); font-weight: 600; margin-left: 0.5rem;">4.9 / 5.0 Rating (1,240+ Reviews)</span></div>
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
      <div class="rx-card" style="display: flex; flex-direction: column; justify-space-between;">
        <div style="color: #f59e0b; font-size: 1.1rem; margin-bottom: 1rem;">★★★★★</div>
        <p style="color: var(--rx-text); line-height: var(--rx-lh-relaxed); font-size: 1rem; margin-bottom: 1.5rem; flex-grow: 1;">"Exceeded all my expectations! The build quality is top tier and customer delivery was super fast."</p>
        <div style="display: flex; align-items: center; gap: 0.75rem; border-top: 1px solid var(--rx-border); padding-top: 1rem;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--rx-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700;">JD</div>
          <div>
            <strong style="display: block; font-size: 0.9rem; color: var(--rx-text);">Jason D.</strong>
            <span style="font-size: 0.78rem; color: #10b981; font-weight: 600;">✓ Verified Buyer</span>
          </div>
        </div>
      </div>
      <div class="rx-card" style="display: flex; flex-direction: column; justify-space-between;">
        <div style="color: #f59e0b; font-size: 1.1rem; margin-bottom: 1rem;">★★★★★</div>
        <p style="color: var(--rx-text); line-height: var(--rx-lh-relaxed); font-size: 1rem; margin-bottom: 1.5rem; flex-grow: 1;">"Hands down the best purchase I've made this year. Beautifully designed and works flawlessly."</p>
        <div style="display: flex; align-items: center; gap: 0.75rem; border-top: 1px solid var(--rx-border); padding-top: 1rem;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--rx-secondary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700;">MS</div>
          <div>
            <strong style="display: block; font-size: 0.9rem; color: var(--rx-text);">Sarah M.</strong>
            <span style="font-size: 0.78rem; color: #10b981; font-weight: 600;">✓ Verified Buyer</span>
          </div>
        </div>
      </div>
      <div class="rx-card" style="display: flex; flex-direction: column; justify-space-between;">
        <div style="color: #f59e0b; font-size: 1.1rem; margin-bottom: 1rem;">★★★★★</div>
        <p style="color: var(--rx-text); line-height: var(--rx-lh-relaxed); font-size: 1rem; margin-bottom: 1.5rem; flex-grow: 1;">"Great customer support and high quality product. I would definitely recommend ${esc(brand.name)} to anyone."</p>
        <div style="display: flex; align-items: center; gap: 0.75rem; border-top: 1px solid var(--rx-border); padding-top: 1rem;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--rx-accent); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700;">AL</div>
          <div>
            <strong style="display: block; font-size: 0.9rem; color: var(--rx-text);">Alex L.</strong>
            <span style="font-size: 0.78rem; color: #10b981; font-weight: 600;">✓ Verified Buyer</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
{% schema %}
{
  "name": "RootX Testimonials",
  "settings": []
}
{% endschema %}`,
    },

    // 12. rootx-faq.liquid
    {
      key: getSectionFileName(ROOTX_SECTION_TYPES.FAQ),
      value: `
<section id="rootx-faq" class="faq-accordion" style="padding: var(--rx-section-space) 0; background: var(--rx-background);">
  <div class="container" style="max-width: 850px;">
    <div style="text-align: center; margin-bottom: 3.5rem;">
      <span class="rx-badge-pill" style="margin-bottom: 1rem;">GOT QUESTIONS?</span>
      <h2 style="font-size: var(--rx-font-3xl); font-family: var(--rx-heading-font); color: var(--rx-text); margin: 0 0 0.75rem;">Frequently Asked Questions</h2>
      <p style="color: var(--rx-muted); font-size: var(--rx-font-lg);">Everything you need to know before ordering</p>
    </div>
    <div style="display: flex; flex-direction: column; gap: 1.25rem;">
      ${content.faq.map((item, idx) => `
        <details class="rx-card" style="cursor: pointer; padding: 1.5rem;" ${idx === 0 ? 'open' : ''}>
          <summary style="font-size: 1.15rem; font-weight: 700; color: var(--rx-text); list-style: none; display: flex; justify-content: space-between; align-items: center; user-select: none;">
            <span>${esc(item.question)}</span>
            <span style="font-size: 1.2rem; color: var(--rx-primary); font-weight: 400; margin-left: 1rem;">▾</span>
          </summary>
          <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--rx-border); color: var(--rx-muted); font-size: 1rem; line-height: var(--rx-lh-relaxed);">
            ${esc(item.answer)}
          </div>
        </details>
      `).join('')}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "RootX FAQ",
  "settings": []
}
{% endschema %}`,
    },

    // 13. rootx-final-cta.liquid
    {
      key: getSectionFileName(ROOTX_SECTION_TYPES.FINAL_CTA),
      value: `
<section class="final-cta" style="background: linear-gradient(135deg, var(--rx-primary) 0%, var(--rx-secondary) 100%); color: #ffffff; text-align: center; padding: 6rem 1.5rem; position: relative; overflow: hidden;">
  <div class="container" style="max-width: 750px; position: relative; z-index: 2;">
    <span style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); padding: 0.35rem 1rem; border-radius: var(--rx-radius-full); font-size: 0.85rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; display: inline-block; margin-bottom: 1.5rem;">LIMITED TIME OFFER</span>
    <h2 style="font-size: var(--rx-font-4xl); font-family: var(--rx-heading-font); margin: 0 0 1.25rem; color: #ffffff; line-height: var(--rx-lh-tight);">${esc(brand.name)}</h2>
    <p style="font-size: var(--rx-font-lg); opacity: 0.95; margin: 0 auto 2.5rem; max-width: 600px; line-height: var(--rx-lh-relaxed);">Order your ${esc(prod.cleanName)} today with free express tracked shipping and a 30-day money-back guarantee.</p>
    <form action="/cart/add" method="post">
      <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" />
      <button type="submit" class="btn" style="background: #ffffff; color: var(--rx-primary); padding: 0 3.5rem; height: 58px; font-weight: 800; font-size: 1.15rem; border-radius: var(--rx-button-radius); box-shadow: 0 10px 30px rgba(0,0,0,0.2);">Claim Yours Now — $${esc(prod.price)} &rarr;</button>
    </form>
    <div style="display: flex; justify-content: center; gap: 2rem; font-size: 0.85rem; opacity: 0.9; margin-top: 2rem;">
      <span>✓ 30-Day Guarantee</span>
      <span>✓ Express Delivery</span>
      <span>✓ SSL Secure Checkout</span>
    </div>
  </div>
</section>
{% schema %}
{
  "name": "RootX Final CTA",
  "settings": []
}
{% endschema %}`,
    },

    // 14. rootx-footer.liquid
    {
      key: getSectionFileName(ROOTX_SECTION_TYPES.FOOTER),
      value: `
<footer class="site-footer" style="background: var(--rx-surface); border-top: 1px solid var(--rx-border); padding: 4.5rem 0 2rem;">
  <div class="container">
    <div style="display: grid; grid-template-columns: 2fr repeat(auto-fit, minmax(160px, 1fr)); gap: 3rem; margin-bottom: 3.5rem;">
      <div>
        <h3 style="font-size: 1.5rem; font-family: var(--rx-heading-font); margin: 0 0 0.85rem; color: var(--rx-text); font-weight: 800;">${esc(brand.name)}</h3>
        <p style="color: var(--rx-muted); font-size: 0.95rem; line-height: var(--rx-lh-relaxed); max-width: 320px;">${esc(content.heroHeadline)}</p>
      </div>
      <div>
        <h4 style="font-size: 0.95rem; font-family: var(--rx-heading-font); margin: 0 0 1.25rem; color: var(--rx-text); text-transform: uppercase; letter-spacing: 0.1em;">Shop</h4>
        <ul style="list-style: none; padding: 0; margin: 0; color: var(--rx-muted); line-height: 2.2; font-size: 0.92rem;">
          <li><a href="/collections/all" style="color: inherit; text-decoration: none;">All Products</a></li>
          <li><a href="/cart" style="color: inherit; text-decoration: none;">Cart & Checkout</a></li>
        </ul>
      </div>
      <div>
        <h4 style="font-size: 0.95rem; font-family: var(--rx-heading-font); margin: 0 0 1.25rem; color: var(--rx-text); text-transform: uppercase; letter-spacing: 0.1em;">Support</h4>
        <ul style="list-style: none; padding: 0; margin: 0; color: var(--rx-muted); line-height: 2.2; font-size: 0.92rem;">
          <li><a href="#rootx-faq" style="color: inherit; text-decoration: none;">FAQ & Shipping</a></li>
          <li><a href="/pages/contact" style="color: inherit; text-decoration: none;">Contact Us</a></li>
        </ul>
      </div>
    </div>
    <div style="border-top: 1px solid var(--rx-border); padding-top: 2rem; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; font-size: 0.85rem; color: var(--rx-muted);">
      <p style="margin: 0;">© 2026 ${esc(brand.name)}. All rights reserved. Powered by RootX.</p>
      <div style="display: flex; gap: 1rem; font-size: 1.2rem; opacity: 0.7;">
        <span>💳 Visa</span>
        <span>💳 Mastercard</span>
        <span>💳 Amex</span>
        <span>🍏 Apple Pay</span>
      </div>
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

    // 15. rootx-main-product.liquid
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
