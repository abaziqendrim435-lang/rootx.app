// ============================================================
// RootX Storefront Pixel Parity Engine V1 — Liquid Component Library
// Renders all 13 required Shopify OS 2.0 Liquid sections directly
// from StorefrontSpec with dynamic image blocks, {% schema %} tags,
// and --rx-* design tokens.
// ============================================================

import type { StorefrontSpec } from './types';
import { ROOTX_SECTION_TYPES, getSectionFileName } from './section-registry';

function esc(str: string): string {
  if (!str) return '';
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

export function generateShopifyLiquidSections(spec: StorefrontSpec): { key: string; value: string }[] {
  const brand = spec.brand;
  const prod = spec.product;
  const content = spec.content;
  const heroImg = spec.images.hero?.normalizedUrl || spec.images.gallery[0]?.normalizedUrl || '';

  const heroSection = spec.sections.find(s => s.id === ROOTX_SECTION_TYPES.HERO);
  const heroVariant = heroSection?.variant || 'split';

  const galleryList = spec.images.gallery.filter((img) => Boolean(img.normalizedUrl));

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
      value: `
<header class="site-header" style="background: var(--rx-surface); border-bottom: 1px solid var(--rx-border); padding: 1.25rem 0;">
  <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
    <a href="/" class="brand-logo" style="font-family: var(--rx-heading-font); font-size: 1.5rem; font-weight: 700; color: var(--rx-text); text-decoration: none;">${esc(brand.name)}</a>
    <nav class="main-nav" style="display: flex; gap: 2rem;">
      <a href="/" style="color: var(--rx-text); text-decoration: none; font-weight: 500;">Home</a>
      <a href="/collections/all" style="color: var(--rx-muted); text-decoration: none; font-weight: 500;">Shop</a>
      <a href="#rootx-faq" style="color: var(--rx-muted); text-decoration: none; font-weight: 500;">FAQ</a>
    </nav>
    <a href="/cart" class="btn btn-primary" style="padding: 0.5rem 1.25rem; font-size: 0.9rem;">Cart (0)</a>
  </div>
</header>
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
      value: heroVariant === 'editorial' ? `
<section class="hero-section hero--editorial" style="padding: var(--rx-section-space) 0; background: var(--rx-surface);">
  <div class="container" style="text-align: center; max-width: 800px;">
    <span style="text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.85rem; color: var(--rx-primary); font-weight: 700;">${esc(brand.name)}</span>
    <h1 style="font-size: clamp(2.5rem, 5vw, 4rem); font-family: var(--rx-heading-font); margin: 0.75rem 0 1rem; color: var(--rx-text);">${esc(content.heroHeadline)}</h1>
    <p style="font-size: 1.2rem; color: var(--rx-muted); margin-bottom: 2rem;">${esc(content.heroSubheadline)}</p>
    ${heroImg ? `<div style="margin-bottom: 2rem;"><img id="rx-hero-main-img" src="${heroImg}" alt="${esc(prod.cleanName)}" style="max-width: 600px; width: 100%; height: 400px; object-fit: cover; border-radius: var(--rx-radius-lg); box-shadow: var(--rx-shadow);" /></div>` : ''}
    <div style="display: flex; gap: 1rem; justify-content: center; align-items: center; margin-bottom: 1.5rem;">
      <span style="font-size: 2.2rem; font-weight: 800; color: var(--rx-primary);">$${esc(prod.price)}</span>
      ${prod.compareAtPrice ? `<span style="font-size: 1.4rem; text-decoration: line-through; color: var(--rx-muted);">$${esc(prod.compareAtPrice)}</span>` : ''}
    </div>
    <form action="/cart/add" method="post">
      <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" />
      <button type="submit" class="btn btn-primary" style="padding: 1rem 3rem; font-size: 1.1rem;">Buy ${esc(prod.cleanName)} — $${esc(prod.price)}</button>
    </form>
  </div>
</section>
{% schema %}
{
  "name": "RootX Hero",
  "settings": []
}
{% endschema %}` : heroVariant === 'full-bleed' ? `
<section class="hero-section hero--full-bleed" style="position: relative; background: var(--rx-background); color: var(--rx-text); padding: 5rem 0;">
  <div class="container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 3rem; align-items: center;">
    <div>
      <h1 style="font-size: clamp(2.5rem, 5vw, 3.8rem); font-family: var(--rx-heading-font); color: var(--rx-text); margin-bottom: 1rem;">${esc(content.heroHeadline)}</h1>
      <p style="font-size: 1.2rem; color: var(--rx-muted); margin-bottom: 2rem;">${esc(content.heroSubheadline)}</p>
      <div style="display: flex; align-items: baseline; gap: 1rem; margin-bottom: 1.5rem;">
        <span style="font-size: 2.2rem; font-weight: 800; color: var(--rx-primary);">$${esc(prod.price)}</span>
        ${prod.compareAtPrice ? `<span style="font-size: 1.4rem; text-decoration: line-through; color: var(--rx-muted);">$${esc(prod.compareAtPrice)}</span>` : ''}
      </div>
      <form action="/cart/add" method="post">
        <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" />
        <button type="submit" class="btn btn-primary" style="width: 100%; max-width: 380px;">Buy Now — $${esc(prod.price)}</button>
      </form>
    </div>
    <div>
      ${heroImg ? `<img id="rx-hero-main-img" src="${heroImg}" alt="${esc(prod.cleanName)}" style="width: 100%; height: 420px; object-fit: cover; border-radius: var(--rx-radius-lg); box-shadow: var(--rx-shadow);" />` : ''}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "RootX Hero",
  "settings": []
}
{% endschema %}` : `
<section class="hero-section hero--product-split" style="padding: var(--rx-section-space) 0; background: var(--rx-surface); border-bottom: 1px solid var(--rx-border);">
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
        <div style="margin-top: 1.25rem; font-size: 0.85rem; color: var(--rx-muted); display: flex; align-items: center; gap: 0.5rem;">
          <span>🔒</span> ${esc(prod.shippingText || 'Tracked Shipping')}
        </div>
      </div>
      <div>
        <div style="background: var(--rx-background); border: 1px solid var(--rx-border); border-radius: var(--rx-radius-lg); padding: 1.25rem; overflow: hidden; box-shadow: var(--rx-shadow);">
          ${heroImg ? `<img id="rx-hero-split-img" src="${heroImg}" alt="${esc(prod.cleanName)}" style="width: 100%; height: 380px; border-radius: var(--rx-radius-md); object-fit: cover;" />` : ''}
          <div class="rx-thumbs-wrapper" style="display: flex; gap: 0.5rem; overflow-x: auto; margin-top: 0.75rem; padding-bottom: 0.25rem; scrollbar-width: thin;">
            {% if section.blocks.size > 0 %}
              {% for block in section.blocks %}
                {% if block.settings.image_url != blank %}
                  <button type="button" onclick="document.getElementById('rx-hero-split-img').src='{{ block.settings.image_url }}'" style="border: 2px solid var(--rx-border); border-radius: var(--rx-radius-sm); padding: 0; background: none; cursor: pointer; flex-shrink: 0; width: 60px; height: 60px; overflow: hidden;">
                    <img src="{{ block.settings.image_url }}" alt="Thumbnail" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
                  </button>
                {% endif %}
              {% endfor %}
            {% else %}
              ${galleryList.map((img, i) => `
                <button type="button" onclick="document.getElementById('rx-hero-split-img').src='${img.normalizedUrl}'" style="border: 2px solid ${i === 0 ? 'var(--rx-primary)' : 'var(--rx-border)'}; border-radius: var(--rx-radius-sm); padding: 0; background: none; cursor: pointer; flex-shrink: 0; width: 60px; height: 60px; overflow: hidden;">
                  <img src="${img.normalizedUrl}" alt="Thumbnail" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
                </button>
              `).join('')}
            {% endif %}
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
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
      value: `
<section class="product-gallery" style="padding: var(--rx-section-space) 0;">
  <div class="container">
    <div style="text-align: center; margin-bottom: 2rem;">
      <h2 style="font-size: 2.2rem; font-family: var(--rx-heading-font); color: var(--rx-text);">Product Gallery</h2>
    </div>
    <div class="gallery-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem;">
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
</section>
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
      value: `
<section class="main-product-rootx" style="padding: var(--rx-section-space) 0; background: var(--rx-surface);">
  <div class="container">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 3.5rem; align-items: start;">
      <div>
        <div style="background: var(--rx-background); border: 1px solid var(--rx-border); border-radius: var(--rx-radius-lg); padding: 1rem; margin-bottom: 1rem; box-shadow: var(--rx-shadow);">
          <img id="rx-main-prod-img" src="${heroImg}" alt="${esc(prod.cleanName)}" style="width: 100%; height: 420px; border-radius: var(--rx-radius-md); object-fit: cover; display: block; transition: opacity 0.2s ease-in-out;" />
        </div>
        <div class="rx-thumbs-wrapper" style="display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 0.5rem; scrollbar-width: thin;">
          {% if section.blocks.size > 0 %}
            {% for block in section.blocks %}
              {% if block.settings.image_url != blank %}
                <button type="button" onclick="document.getElementById('rx-main-prod-img').src='{{ block.settings.image_url }}'" style="border: 2px solid var(--rx-border); border-radius: var(--rx-radius-sm); padding: 0; background: none; cursor: pointer; flex-shrink: 0; width: 70px; height: 70px; overflow: hidden;">
                  <img src="{{ block.settings.image_url }}" alt="Thumbnail" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
                </button>
              {% endif %}
            {% endfor %}
          {% else %}
            ${galleryList.map((img, i) => `
              <button type="button" onclick="document.getElementById('rx-main-prod-img').src='${img.normalizedUrl}'" style="border: 2px solid ${i === 0 ? 'var(--rx-primary)' : 'var(--rx-border)'}; border-radius: var(--rx-radius-sm); padding: 0; background: none; cursor: pointer; flex-shrink: 0; width: 70px; height: 70px; overflow: hidden;">
                <img src="${img.normalizedUrl}" alt="Thumbnail" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
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
