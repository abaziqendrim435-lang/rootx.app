// ============================================================
// RootX Storefront Pixel Parity Engine V1 — Liquid Component Library
// Renders the 17 required Shopify OS 2.0 Liquid sections directly
// from StorefrontSpec with valid {% schema %} tags and --rx-* tokens.
// ============================================================

import type { StorefrontSpec } from './types';

function esc(str: string): string {
  if (!str) return '';
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

export function generateShopifyLiquidSections(spec: StorefrontSpec): { key: string; value: string }[] {
  const brand = spec.brand;
  const prod = spec.product;
  const content = spec.content;
  const heroImg = spec.images.hero?.normalizedUrl || '';

  return [
    // 1. Announcement Bar
    {
      key: 'sections/announcement-bar.liquid',
      value: `
<div class="announcement-bar" style="background: var(--rx-color-primary); color: #ffffff; text-align: center; padding: 0.6rem 1rem; font-size: 0.85rem; font-weight: 600;">
  <span>✨ ${esc(prod.shippingText)} — Free Express Delivery on All Orders</span>
</div>
{% schema %}
{
  "name": "Announcement Bar",
  "settings": []
}
{% endschema %}`,
    },

    // 2. Premium Header
    {
      key: 'sections/premium-header.liquid',
      value: `
<header class="site-header" style="background: var(--rx-color-surface); border-bottom: 1px solid var(--rx-color-border); padding: 1.25rem 0;">
  <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
    <a href="/" class="brand-logo" style="font-family: var(--rx-font-heading); font-size: 1.5rem; font-weight: 700; color: var(--rx-color-text); text-decoration: none;">${esc(brand.name)}</a>
    <nav class="main-nav" style="display: flex; gap: 2rem;">
      <a href="/" style="color: var(--rx-color-text); text-decoration: none; font-weight: 500;">Home</a>
      <a href="/collections/all" style="color: var(--rx-color-muted); text-decoration: none; font-weight: 500;">Shop</a>
      <a href="/pages/faq" style="color: var(--rx-color-muted); text-decoration: none; font-weight: 500;">FAQ</a>
    </nav>
    <a href="/cart" class="btn btn-primary" style="padding: 0.5rem 1.25rem; font-size: 0.9rem;">Cart (0)</a>
  </div>
</header>
{% schema %}
{
  "name": "Premium Header",
  "settings": []
}
{% endschema %}`,
    },

    // 3. Hero Product Split
    {
      key: 'sections/hero-product-split.liquid',
      value: `
<section class="hero-section hero--product-split" style="padding: var(--rx-section-space-desktop) 0; background: var(--rx-color-surface); border-bottom: 1px solid var(--rx-color-border);">
  <div class="container">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3.5rem; align-items: center;">
      <div>
        <span style="background: var(--rx-color-primary); color: #fff; padding: 0.3rem 0.85rem; border-radius: var(--rx-radius-sm); font-size: 0.8rem; font-weight: 700; text-transform: uppercase;">${esc(brand.name)}</span>
        <h1 style="font-size: clamp(2rem, 4vw, 3.2rem); font-family: var(--rx-font-heading); margin: 1rem 0 0.75rem; color: var(--rx-color-text);">${esc(content.heroHeadline)}</h1>
        <p style="color: var(--rx-color-muted); font-size: 1.1rem; line-height: 1.6; margin-bottom: 1.75rem;">${esc(content.heroSubheadline)}</p>
        <div style="font-size: 2.2rem; font-weight: 800; color: var(--rx-color-primary); margin-bottom: 1.5rem;">$${esc(prod.price)}</div>
        <form action="/cart/add" method="post">
          <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" />
          <button type="submit" class="btn btn-primary" style="width: 100%; max-width: 380px;">Buy ${esc(prod.cleanName)} — $${esc(prod.price)}</button>
        </form>
      </div>
      <div>
        <div style="background: var(--rx-color-background); border: 1px solid var(--rx-color-border); border-radius: var(--rx-radius-lg); padding: 1.25rem; overflow: hidden; box-shadow: var(--rx-shadow-medium);">
          ${heroImg ? `<img src="${heroImg}" alt="${esc(prod.cleanName)}" style="width: 100%; height: auto; border-radius: var(--rx-radius-md); object-fit: cover;" />` : ''}
        </div>
      </div>
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Hero Product Split",
  "settings": []
}
{% endschema %}`,
    },

    // 4. Hero Editorial
    {
      key: 'sections/hero-editorial.liquid',
      value: `
<section class="hero-section hero--editorial" style="padding: var(--rx-section-space-desktop) 0; background: var(--rx-color-surface);">
  <div class="container" style="text-align: center; max-width: 800px;">
    <span style="text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.85rem; color: var(--rx-color-primary); font-weight: 700;">${esc(brand.name)}</span>
    <h1 style="font-size: clamp(2.5rem, 5vw, 4rem); font-family: var(--rx-font-heading); margin: 0.75rem 0 1rem;">${esc(content.heroHeadline)}</h1>
    <p style="font-size: 1.2rem; color: var(--rx-color-muted); margin-bottom: 2rem;">${esc(content.heroSubheadline)}</p>
    <form action="/cart/add" method="post">
      <button type="submit" class="btn btn-primary">Discover ${esc(prod.cleanName)} — $${esc(prod.price)}</button>
    </form>
  </div>
</section>
{% schema %}
{
  "name": "Hero Editorial",
  "settings": []
}
{% endschema %}`,
    },

    // 5. Hero Full Bleed
    {
      key: 'sections/hero-full-bleed.liquid',
      value: `
<section class="hero-section hero--full-bleed" style="position: relative; background: #000; color: #fff; padding: 7rem 0;">
  ${heroImg ? `<div style="position: absolute; inset: 0; opacity: 0.35; background: url('${heroImg}') center/cover no-repeat;"></div>` : ''}
  <div class="container" style="position: relative; z-index: 2; text-align: center; max-width: 850px;">
    <h1 style="font-size: clamp(2.5rem, 6vw, 4.2rem); font-family: var(--rx-font-heading); color: #fff;">${esc(content.heroHeadline)}</h1>
    <p style="font-size: 1.25rem; opacity: 0.9; margin-bottom: 2.5rem;">${esc(content.heroSubheadline)}</p>
    <form action="/cart/add" method="post">
      <button type="submit" class="btn" style="background: #fff; color: #000; padding: 1.2rem 3.5rem; font-weight: 800;">Claim Yours Now — $${esc(prod.price)}</button>
    </form>
  </div>
</section>
{% schema %}
{
  "name": "Hero Full Bleed",
  "settings": []
}
{% endschema %}`,
    },

    // 6. Hero Minimal Conversion
    {
      key: 'sections/hero-minimal-conversion.liquid',
      value: `
<section class="hero-section hero--minimal" style="padding: var(--rx-section-space-desktop) 0; background: var(--rx-color-background);">
  <div class="container">
    <h1 style="font-size: clamp(2rem, 3.8vw, 3rem); font-family: var(--rx-font-heading);">${esc(content.heroHeadline)}</h1>
    <p style="color: var(--rx-color-muted);">${esc(content.heroSubheadline)}</p>
    <form action="/cart/add" method="post">
      <button type="submit" class="btn btn-primary">Buy Now — $${esc(prod.price)}</button>
    </form>
  </div>
</section>
{% schema %}
{
  "name": "Hero Minimal Conversion",
  "settings": []
}
{% endschema %}`,
    },

    // 7. Trust Strip
    {
      key: 'sections/trust-strip.liquid',
      value: `
<section class="trust-strip" style="padding: 2rem 0; background: var(--rx-color-surface); border-y: 1px solid var(--rx-color-border);">
  <div class="container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; text-align: center;">
    ${content.trustItems.map((item) => `
      <div style="padding: 1.25rem; border: 1px solid var(--rx-color-border); border-radius: var(--rx-radius-md); background: var(--rx-color-background);">
        <div style="font-size: 1.6rem; margin-bottom: 0.4rem;">${esc(item.icon)}</div>
        <strong style="display: block; font-size: 0.95rem;">${esc(item.title)}</strong>
        <span style="font-size: 0.8rem; color: var(--rx-color-muted);">${esc(item.subtitle)}</span>
      </div>
    `).join('')}
  </div>
</section>
{% schema %}
{
  "name": "Trust Strip",
  "settings": []
}
{% endschema %}`,
    },

    // 8. Benefit Grid
    {
      key: 'sections/benefit-grid.liquid',
      value: `
<section class="benefit-grid" style="padding: var(--rx-section-space-desktop) 0;">
  <div class="container">
    <div style="text-align: center; max-width: 600px; margin: 0 auto 3rem;">
      <h2 style="font-size: 2.2rem; font-family: var(--rx-font-heading);">Why Choose ${esc(prod.cleanName)}</h2>
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
      ${prod.benefits.map((b, i) => `
        <div style="padding: 2rem; background: var(--rx-color-surface); border: 1px solid var(--rx-color-border); border-radius: var(--rx-radius-lg);">
          <div style="width: 44px; height: 44px; border-radius: var(--rx-radius-sm); background: var(--rx-color-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-bottom: 1.25rem;">0${i + 1}</div>
          <h3 style="font-size: 1.25rem; font-family: var(--rx-font-heading); margin-bottom: 0.5rem;">${esc(b.title)}</h3>
          <p style="color: var(--rx-color-muted); line-height: 1.6;">${esc(b.description)}</p>
        </div>
      `).join('')}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Benefit Grid",
  "settings": []
}
{% endschema %}`,
    },

    // 9. Product Showcase
    {
      key: 'sections/product-showcase.liquid',
      value: `
<section class="product-showcase" style="padding: var(--rx-section-space-desktop) 0; background: var(--rx-color-surface);">
  <div class="container">
    <div style="text-align: center; margin-bottom: 2.5rem;">
      <h2 style="font-size: 2.2rem; font-family: var(--rx-font-heading);">${esc(prod.cleanName)}</h2>
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Product Showcase",
  "settings": []
}
{% endschema %}`,
    },

    // 10. Product Gallery
    {
      key: 'sections/product-gallery.liquid',
      value: `
<section class="product-gallery" style="padding: var(--rx-section-space-desktop) 0;">
  <div class="container">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem;">
      ${spec.images.gallery.slice(0, 4).map((img) => `
        <div style="border-radius: var(--rx-radius-md); overflow: hidden; border: 1px solid var(--rx-color-border);">
          <img src="${img.normalizedUrl}" alt="Gallery" style="width: 100%; height: auto; display: block; object-fit: cover;" />
        </div>
      `).join('')}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Product Gallery",
  "settings": []
}
{% endschema %}`,
    },

    // 11. Image Story
    {
      key: 'sections/image-story.liquid',
      value: `
<section class="image-story" style="padding: var(--rx-section-space-desktop) 0; background: var(--rx-color-background);">
  <div class="container">
    <h2 style="font-size: 2.2rem; font-family: var(--rx-font-heading);">Crafted for Excellence</h2>
    <p style="color: var(--rx-color-muted);">${esc(prod.shortDescription)}</p>
  </div>
</section>
{% schema %}
{
  "name": "Image Story",
  "settings": []
}
{% endschema %}`,
    },

    // 12. Specifications
    {
      key: 'sections/specifications.liquid',
      value: `
<section class="specifications" style="padding: var(--rx-section-space-desktop) 0; background: var(--rx-color-surface);">
  <div class="container" style="max-width: 800px;">
    <h2 style="font-size: 2.2rem; font-family: var(--rx-font-heading); margin-bottom: 2rem; text-align: center;">Technical Specifications</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
      ${prod.specifications.map((s) => `
        <div style="padding: 1rem; border-bottom: 1px solid var(--rx-color-border);">
          <strong style="display: block; font-size: 0.9rem; color: var(--rx-color-muted);">${esc(s.name)}</strong>
          <span style="font-size: 1.05rem; font-weight: 600;">${esc(s.value)}</span>
        </div>
      `).join('')}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Specifications",
  "settings": []
}
{% endschema %}`,
    },

    // 13. FAQ Accordion
    {
      key: 'sections/faq-accordion.liquid',
      value: `
<section class="faq-accordion" style="padding: var(--rx-section-space-desktop) 0; background: var(--rx-color-surface);">
  <div class="container" style="max-width: 800px;">
    <h2 style="font-size: 2.2rem; font-family: var(--rx-font-heading); text-align: center; margin-bottom: 3rem;">Frequently Asked Questions</h2>
    ${content.faq.map((item) => `
      <div style="border-bottom: 1px solid var(--rx-color-border); padding: 1.25rem 0;">
        <h4 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">${esc(item.question)}</h4>
        <p style="color: var(--rx-color-muted); font-size: 0.95rem; line-height: 1.6;">${esc(item.answer)}</p>
      </div>
    `).join('')}
  </div>
</section>
{% schema %}
{
  "name": "FAQ Accordion",
  "settings": []
}
{% endschema %}`,
    },

    // 14. Final CTA
    {
      key: 'sections/final-cta.liquid',
      value: `
<section class="final-cta" style="background: linear-gradient(135deg, var(--rx-color-primary), var(--rx-color-secondary)); color: #fff; text-align: center; padding: 5rem 1.5rem;">
  <div class="container" style="max-width: 700px;">
    <h2 style="font-size: clamp(2rem, 4vw, 3rem); font-family: var(--rx-font-heading); margin-bottom: 1rem; color: #fff;">Experience ${esc(brand.name)} Today</h2>
    <p style="font-size: 1.15rem; opacity: 0.9; margin-bottom: 2rem;">Order your ${esc(prod.cleanName)} with free express tracked delivery.</p>
    <form action="/cart/add" method="post">
      <button type="submit" class="btn" style="background: #fff; color: var(--rx-color-primary); padding: 1.2rem 3rem; font-weight: 800;">Get Started Now — $${esc(prod.price)} &rarr;</button>
    </form>
  </div>
</section>
{% schema %}
{
  "name": "Final CTA",
  "settings": []
}
{% endschema %}`,
    },

    // 15. Newsletter
    {
      key: 'sections/newsletter.liquid',
      value: `
<section class="newsletter" style="padding: 4rem 0; background: var(--rx-color-background); text-align: center;">
  <div class="container" style="max-width: 600px;">
    <h3 style="font-size: 1.8rem; font-family: var(--rx-font-heading);">Stay Connected</h3>
    <p style="color: var(--rx-color-muted); margin-bottom: 1.5rem;">Subscribe for exclusive offers and product releases.</p>
    <form action="/contact" method="post" style="display: flex; gap: 0.5rem; justify-content: center;">
      <input type="email" placeholder="Enter your email" required style="padding: 0.8rem 1.2rem; border-radius: var(--rx-radius-sm); border: 1px solid var(--rx-color-border); width: 100%; max-width: 320px;" />
      <button type="submit" class="btn btn-primary">Subscribe</button>
    </form>
  </div>
</section>
{% schema %}
{
  "name": "Newsletter",
  "settings": []
}
{% endschema %}`,
    },

    // 16. Premium Footer
    {
      key: 'sections/premium-footer.liquid',
      value: `
<footer class="site-footer" style="background: var(--rx-color-surface); border-top: 1px solid var(--rx-color-border); padding: 4rem 0 2rem;">
  <div class="container">
    <div style="display: grid; grid-template-columns: 2fr repeat(auto-fit, minmax(150px, 1fr)); gap: 2.5rem; margin-bottom: 3rem;">
      <div>
        <h3 style="font-size: 1.4rem; font-family: var(--rx-font-heading); margin-bottom: 0.75rem;">${esc(brand.name)}</h3>
        <p style="color: var(--rx-color-muted); font-size: 0.95rem;">${esc(content.heroHeadline)}</p>
      </div>
      <div>
        <h4 style="font-size: 1rem; font-family: var(--rx-font-heading); margin-bottom: 1rem;">Shop</h4>
        <ul style="list-style: none; padding: 0; margin: 0; color: var(--rx-color-muted); line-height: 2; font-size: 0.9rem;">
          <li><a href="/collections/all" style="color: inherit; text-decoration: none;">All Products</a></li>
        </ul>
      </div>
    </div>
    <div style="border-top: 1px solid var(--rx-color-border); padding-top: 1.5rem; display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--rx-color-muted);">
      <p>© 2026 ${esc(brand.name)}. All rights reserved. Powered by RootX.</p>
    </div>
  </div>
</footer>
{% schema %}
{
  "name": "Premium Footer",
  "settings": []
}
{% endschema %}`,
    },

    // 17. Main Product RootX
    {
      key: 'sections/main-product-rootx.liquid',
      value: `
<section class="main-product-rootx" style="padding: var(--rx-section-space-desktop) 0; background: var(--rx-color-surface);">
  <div class="container">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3.5rem; align-items: start;">
      <div>
        ${heroImg ? `<img src="${heroImg}" alt="${esc(prod.cleanName)}" style="width: 100%; height: auto; border-radius: var(--rx-radius-lg); object-fit: cover;" />` : ''}
      </div>
      <div>
        <h1 style="font-size: 2.4rem; font-family: var(--rx-font-heading);">${esc(prod.cleanName)}</h1>
        <div style="font-size: 2rem; font-weight: 800; color: var(--rx-color-primary); margin: 1rem 0;">$${esc(prod.price)}</div>
        <p style="color: var(--rx-color-muted); margin-bottom: 2rem;">${esc(prod.shortDescription)}</p>
        <form action="/cart/add" method="post">
          <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" />
          <button type="submit" class="btn btn-primary" style="width: 100%;">Add to Cart — $${esc(prod.price)}</button>
        </form>
      </div>
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Main Product RootX",
  "settings": []
}
{% endschema %}`,
    },
  ];
}
