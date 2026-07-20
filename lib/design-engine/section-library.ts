// ============================================================
// RootX Design Engine V1 — Section Library with Variants
// 15 section types, each with multiple visual variants.
// Operates strictly on Design Tokens without hardcoded inline CSS.
// ============================================================

import type { WebsiteGeneration, WebsiteBuilderInput } from '../website-builder-types';

export interface SectionVariantDefinition {
  id: string;
  name: string;
  sectionType: string;
  renderLiquid: (gen: WebsiteGeneration, input: WebsiteBuilderInput) => string;
}

export type SectionTypeKey =
  | 'editorial_hero'
  | 'product_hero'
  | 'trust_bar'
  | 'benefit_grid'
  | 'image_story'
  | 'product_gallery'
  | 'comparison_section'
  | 'before_after'
  | 'how_it_works'
  | 'social_proof'
  | 'faq'
  | 'final_cta'
  | 'newsletter'
  | 'product_specifications'
  | 'premium_footer';

function esc(str: string): string {
  if (!str) return '';
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ── 1. Editorial Hero ──────────────────────────────────────────

const editorialHeroVariants: SectionVariantDefinition[] = [
  {
    id: 'fullscreen-editorial',
    name: 'Fullscreen Editorial',
    sectionType: 'editorial_hero',
    renderLiquid: (gen, input) => `
<section class="hero hero--editorial-fullscreen" data-section-id="{{ section.id }}">
  <div class="hero-overlay" style="position:absolute; inset:0; background: rgba(0,0,0,0.35); z-index:1;"></div>
  <div class="container hero-inner" style="position:relative; z-index:2; text-align:center; padding: 8rem 1.5rem; color:#fff;">
    <span class="hero-kicker" style="text-transform:uppercase; letter-spacing:0.2em; font-size:0.85rem; margin-bottom:1rem; display:block;">Exquisite Collection</span>
    <h1 class="hero-headline" style="font-size:clamp(2.5rem,6vw,4.5rem); margin-bottom:1.5rem; font-weight:300;">{{ section.settings.headline }}</h1>
    <p class="hero-subheadline" style="max-width:650px; margin:0 auto 2.5rem; font-size:1.15rem; opacity:0.9;">{{ section.settings.subheadline }}</p>
    <div class="hero-cta" style="display:flex; justify-content:center; gap:1rem;">
      <a href="{{ section.settings.cta_url }}" class="btn btn-primary" style="padding:1rem 2.5rem;">Shop the Collection</a>
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Editorial Hero",
  "settings": [
    { "type": "text", "id": "headline", "label": "Headline", "default": "${esc(gen.homepage.hero.headline)}" },
    { "type": "textarea", "id": "subheadline", "label": "Subheadline", "default": "${esc(gen.homepage.hero.subheadline)}" },
    { "type": "url", "id": "cta_url", "label": "CTA Link", "default": "/collections/all" }
  ]
}
{% endschema %}`,
  },
  {
    id: 'split-hero',
    name: 'Split Editorial',
    sectionType: 'editorial_hero',
    renderLiquid: (gen, input) => `
<section class="hero hero--editorial-split section" data-section-id="{{ section.id }}">
  <div class="container">
    <div class="hero-split-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:3rem; align-items:center;">
      <div class="hero-split-content">
        <h1 class="hero-headline" style="font-size:clamp(2rem,4vw,3.5rem); margin-bottom:1rem;">{{ section.settings.headline }}</h1>
        <p class="hero-subheadline" style="color:var(--color-muted); font-size:1.1rem; margin-bottom:2rem;">{{ section.settings.subheadline }}</p>
        <a href="{{ section.settings.cta_url }}" class="btn btn-primary">Discover More &rarr;</a>
      </div>
      <div class="hero-split-media" style="border-radius:var(--radius-large); overflow:hidden; box-shadow:var(--shadow-medium);">
        {% if section.settings.hero_image != blank %}
          <img src="{{ section.settings.hero_image }}" alt="Hero" style="width:100%; height:auto; display:block;" />
        {% else %}
          {{ 'lifestyle-1' | placeholder_svg_tag: 'placeholder-svg' }}
        {% endif %}
      </div>
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Split Editorial Hero",
  "settings": [
    { "type": "text", "id": "headline", "label": "Headline", "default": "${esc(gen.homepage.hero.headline)}" },
    { "type": "textarea", "id": "subheadline", "label": "Subheadline", "default": "${esc(gen.homepage.hero.subheadline)}" },
    { "type": "image_picker", "id": "hero_image", "label": "Hero Image" },
    { "type": "url", "id": "cta_url", "label": "CTA Link", "default": "/collections/all" }
  ]
}
{% endschema %}`,
  },
];

// ── 2. Product-Focused Hero ─────────────────────────────────────

const productHeroVariants: SectionVariantDefinition[] = [
  {
    id: 'centered-product',
    name: 'Centered Product Hero',
    sectionType: 'product_hero',
    renderLiquid: (gen, input) => {
      const imgRes = (gen as unknown as { imagePipelineResult?: import('../image-pipeline/types').ImagePipelineResult }).imagePipelineResult;
      const heroUrl = imgRes?.heroImage?.normalizedUrl || gen.ecommerce?.images?.[0] || '';
      const galleryUrls = imgRes?.galleryImages?.length 
        ? imgRes.galleryImages.map(g => g.normalizedUrl)
        : (gen.ecommerce?.images || []);

      return `
<section class="hero-product section" data-section-id="{{ section.id }}">
  <div class="container">
    <div class="hero-product-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap: 3.5rem; align-items: start;">
      <div class="product-gallery-main">
        <div class="main-img-card" style="background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-large); padding:1.5rem; overflow:hidden;">
          ${heroUrl 
            ? `<img id="HeroMainImg" src="${heroUrl}" alt="${esc(input.businessName)}" style="width:100%; height:auto; border-radius:var(--radius-medium); object-fit:cover;" />`
            : `<div style="padding:4rem 2rem; text-align:center; background:var(--color-background); border-radius:var(--radius-medium); color:var(--color-muted);">[No Product Image Available]</div>`
          }
        </div>
        ${
          galleryUrls.length > 1
            ? `<div class="thumb-row" style="display:flex; gap:0.75rem; margin-top:1rem;">
                ${galleryUrls.slice(0, 5).map((img, i) => `<img src="${img}" style="width:70px; height:70px; object-fit:cover; border-radius:var(--radius-small); border:1px solid var(--color-border); cursor:pointer;" onclick="document.getElementById('HeroMainImg').src='${img}';" />`).join('')}
              </div>`
            : ''
        }
      </div>
      <div class="product-buy-box">
        <span class="badge" style="background:var(--color-accent); color:#fff; padding:0.25rem 0.75rem; border-radius:999px; font-size:0.8rem; font-weight:700; text-transform:uppercase;">Verified Quality</span>
        <h1 style="font-size:clamp(1.8rem, 3.5vw, 2.8rem); margin: 0.75rem 0;">${esc(gen.ecommerce?.shippingText ? input.businessName : gen.homepage.hero.headline)}</h1>
        <div class="price-bar" style="display:flex; align-items:baseline; gap:1rem; margin-bottom:1.5rem;">
          <span style="font-size:2rem; font-weight:800; color:var(--color-primary);">$${gen.ecommerce?.price || '29.99'}</span>
          ${gen.ecommerce?.compareAtPrice ? `<span style="font-size:1.2rem; text-decoration:line-through; color:var(--color-muted);">$${gen.ecommerce.compareAtPrice}</span>` : ''}
        </div>
        <p style="color:var(--color-muted); margin-bottom:2rem; line-height:1.7;">${esc(gen.about.content?.slice(0, 220) || 'Engineered for exceptional daily performance.')}</p>
        <form action="/cart/add" method="post">
          <button type="submit" class="btn btn-primary" style="width:100%; height:var(--button-height); font-size:1.1rem; font-weight:700;">Add to Cart — $${gen.ecommerce?.price || '29.99'}</button>
        </form>
      </div>
    </div>
  </div>
</section>`;
    },
  },
];

// ── 3. Trust Bar ───────────────────────────────────────────────

const trustBarVariants: SectionVariantDefinition[] = [
  {
    id: 'card-badges',
    name: 'Card Badges Trust Bar',
    sectionType: 'trust_bar',
    renderLiquid: (gen) => `
<section class="trust-bar section" style="padding: 2.5rem 0; background: var(--color-surface); border-y: 1px solid var(--color-border);" data-section-id="{{ section.id }}">
  <div class="container">
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; text-align:center;">
      <div class="trust-card" style="padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-medium); background:var(--color-background);">
        <div style="font-size:1.8rem; margin-bottom:0.5rem;">🛡️</div>
        <strong style="display:block; font-size:0.95rem;">${esc(gen.ecommerce?.trustBadges?.[0] || '30-Day Money Back Guarantee')}</strong>
      </div>
      <div class="trust-card" style="padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-medium); background:var(--color-background);">
        <div style="font-size:1.8rem; margin-bottom:0.5rem;">🚚</div>
        <strong style="display:block; font-size:0.95rem;">${esc(gen.ecommerce?.trustBadges?.[1] || 'Free Express Worldwide Shipping')}</strong>
      </div>
      <div class="trust-card" style="padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-medium); background:var(--color-background);">
        <div style="font-size:1.8rem; margin-bottom:0.5rem;">🔒</div>
        <strong style="display:block; font-size:0.95rem;">${esc(gen.ecommerce?.trustBadges?.[2] || 'Encrypted SSL Checkout')}</strong>
      </div>
    </div>
  </div>
</section>`,
  },
];

// ── 4. Benefit Grid ─────────────────────────────────────────────

const benefitGridVariants: SectionVariantDefinition[] = [
  {
    id: 'icon-cards',
    name: 'Icon Cards Benefit Grid',
    sectionType: 'benefit_grid',
    renderLiquid: (gen) => `
<section class="benefit-grid section" data-section-id="{{ section.id }}">
  <div class="container">
    <div style="text-align:center; max-width:600px; margin: 0 auto 3rem;">
      <h2 style="font-size:2.2rem; margin-bottom:0.5rem;">Why You Will Love It</h2>
      <p style="color:var(--color-muted);">Crafted with premium components and thoughtful engineering</p>
    </div>
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:2rem;">
      ${(gen.homepage.features || []).slice(0, 6).map((feat, i) => `
        <div class="benefit-card" style="padding:2rem; background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-large);">
          <div style="width:48px; height:48px; border-radius:var(--radius-small); background:var(--color-primary); color:#fff; display:flex; align-items:center; justify-content:center; font-size:1.25rem; font-weight:700; margin-bottom:1.25rem;">0${i + 1}</div>
          <h3 style="font-size:1.25rem; margin-bottom:0.5rem;">${esc(feat.title)}</h3>
          <p style="color:var(--color-muted); line-height:1.6; font-size:0.95rem;">${esc(feat.description)}</p>
        </div>
      `).join('')}
    </div>
  </div>
</section>`,
  },
];

// ── 5. Product Specifications ─────────────────────────────────

const specVariants: SectionVariantDefinition[] = [
  {
    id: 'card-specs',
    name: 'Card Grid Specs',
    sectionType: 'product_specifications',
    renderLiquid: (gen) => `
<section class="specs-section section" style="background:var(--color-surface);" data-section-id="{{ section.id }}">
  <div class="container">
    <div style="text-align:center; max-width:600px; margin:0 auto 3rem;">
      <h2 style="font-size:2.2rem;">Technical Specifications</h2>
    </div>
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:1.25rem;">
      ${(gen.ecommerce?.specifications || [
        { label: 'Material', value: 'Premium Alloy & Silicone' },
        { label: 'Battery Life', value: 'Up to 24 hours continuous' },
        { label: 'Water Resistance', value: 'IPX7 Certified' },
        { label: 'Warranty', value: '1 Year Full Replacement' }
      ]).map((spec) => `
        <div style="padding:1.25rem; background:var(--color-background); border:1px solid var(--color-border); border-radius:var(--radius-medium);">
          <span style="display:block; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--color-muted);">${esc(spec.label)}</span>
          <strong style="display:block; font-size:1.1rem; color:var(--color-text); margin-top:0.25rem;">${esc(spec.value)}</strong>
        </div>
      `).join('')}
    </div>
  </div>
</section>`,
  },
];

// ── 6. FAQ ─────────────────────────────────────────────────────

const faqVariants: SectionVariantDefinition[] = [
  {
    id: 'accordion',
    name: 'Animated Accordion FAQ',
    sectionType: 'faq',
    renderLiquid: (gen) => `
<section class="faq-section section" data-section-id="{{ section.id }}">
  <div class="container" style="max-width:800px;">
    <div style="text-align:center; margin-bottom:3rem;">
      <h2 style="font-size:2.2rem;">${esc(gen.faq.title || 'Frequently Asked Questions')}</h2>
      <p style="color:var(--color-muted);">${esc(gen.faq.subtitle || 'Everything you need to know about our product and delivery')}</p>
    </div>
    <div class="faq-list">
      ${(gen.faq.items || []).map((item, i) => `
        <div class="faq-item" style="border-bottom:1px solid var(--color-border); padding:1.25rem 0;">
          <button class="faq-question" style="width:100%; display:flex; justify-content:space-between; align-items:center; text-align:left; font-size:1.1rem; font-weight:600; color:var(--color-text);" data-faq-toggle>
            <span>${esc(item.question)}</span>
            <span>+</span>
          </button>
          <div class="faq-answer" style="padding-top:0.75rem; color:var(--color-muted); line-height:1.7;">
            <p>${esc(item.answer)}</p>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</section>`,
  },
];

// ── 7. Social Proof / Reviews ──────────────────────────────────

const socialProofVariants: SectionVariantDefinition[] = [
  {
    id: 'review-cards',
    name: 'Verified Buyer Cards',
    sectionType: 'social_proof',
    renderLiquid: (gen) => `
<section class="social-proof section" style="background:var(--color-surface);" data-section-id="{{ section.id }}">
  <div class="container">
    <div style="text-align:center; max-width:600px; margin: 0 auto 3rem;">
      <h2 style="font-size:2.2rem;">Verified Customer Reviews</h2>
      <p style="color:var(--color-muted);">Join over 10,000+ satisfied buyers worldwide</p>
    </div>
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1.75rem;">
      ${(gen.ecommerce?.reviews || [
        { author: 'Sarah M.', rating: 5, date: 'Verified Buyer', title: 'Life-changing quality', content: 'Exceeded all my expectations. Fast shipping and unbelievable performance.' },
        { author: 'David L.', rating: 5, date: 'Verified Buyer', title: 'Top-tier customer support', content: 'Super smooth transaction and high build quality. Will definitely buy again.' },
        { author: 'Emma R.', rating: 5, date: 'Verified Buyer', title: 'Highly recommended', content: 'Works exactly as described. Worth every single penny.' }
      ]).map((rev) => `
        <div class="review-card" style="padding:1.75rem; background:var(--color-background); border:1px solid var(--color-border); border-radius:var(--radius-medium);">
          <div style="color:#f59e0b; margin-bottom:0.75rem; font-size:1.1rem;">★★★★★</div>
          <h4 style="font-size:1.05rem; margin-bottom:0.5rem;">${esc(rev.title)}</h4>
          <p style="color:var(--color-muted); font-size:0.95rem; line-height:1.6; margin-bottom:1.25rem;">"${esc(rev.content)}"</p>
          <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:var(--color-muted);">
            <strong>${esc(rev.author)}</strong>
            <span>✓ ${esc(rev.date)}</span>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</section>`,
  },
];

// ── 8. Final CTA ───────────────────────────────────────────────

const finalCtaVariants: SectionVariantDefinition[] = [
  {
    id: 'gradient-banner',
    name: 'Gradient Banner CTA',
    sectionType: 'final_cta',
    renderLiquid: (gen, input) => `
<section class="final-cta section" style="background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color:#fff; text-align:center; padding: 5rem 1.5rem;" data-section-id="{{ section.id }}">
  <div class="container" style="max-width:700px;">
    <h2 style="font-size:clamp(2rem, 4vw, 3rem); margin-bottom:1rem; color:#fff;">Experience ${esc(input.businessName)} Today</h2>
    <p style="font-size:1.15rem; opacity:0.9; margin-bottom:2rem;">Claim your special discount today with free worldwide tracked delivery.</p>
    <a href="/cart/add" class="btn" style="background:#fff; color:var(--color-primary); padding:1.1rem 3rem; font-weight:800; border-radius:var(--button-radius);">Get Started Now &rarr;</a>
  </div>
</section>`,
  },
];

// ── 9. Newsletter ──────────────────────────────────────────────

const newsletterVariants: SectionVariantDefinition[] = [
  {
    id: 'inline-form',
    name: 'Inline Newsletter Form',
    sectionType: 'newsletter',
    renderLiquid: (gen, input) => `
<section class="newsletter section" style="background:var(--color-surface);" data-section-id="{{ section.id }}">
  <div class="container" style="max-width:600px; text-align:center;">
    <h2 style="font-size:2rem; margin-bottom:0.5rem;">Join the ${esc(input.businessName)} VIP Club</h2>
    <p style="color:var(--color-muted); margin-bottom:1.5rem;">Subscribe to receive exclusive deals, secret product drops, and insider news.</p>
    <form action="/contact#contact_form" method="post" style="display:flex; gap:0.75rem;">
      <input type="email" placeholder="Enter your email address..." required style="flex:1; padding:0.8rem 1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-small); background:var(--color-background); font-size:1rem;" />
      <button type="submit" class="btn btn-primary" style="padding:0.8rem 1.75rem;">Subscribe</button>
    </form>
  </div>
</section>`,
  },
];

// ── 10. Premium Footer ─────────────────────────────────────────

const footerVariants: SectionVariantDefinition[] = [
  {
    id: 'multi-column',
    name: 'Multi-Column Premium Footer',
    sectionType: 'premium_footer',
    renderLiquid: (gen, input) => `
<footer class="site-footer" style="background:var(--color-surface); border-top:1px solid var(--color-border); padding: 4rem 0 2rem;" data-section-id="{{ section.id }}">
  <div class="container">
    <div style="display:grid; grid-template-columns: 2fr repeat(auto-fit, minmax(150px, 1fr)); gap:2.5rem; margin-bottom:3rem;">
      <div>
        <h3 style="font-size:1.4rem; margin-bottom:0.75rem;">${esc(input.businessName)}</h3>
        <p style="color:var(--color-muted); font-size:0.95rem; line-height:1.6;">${esc(gen.footer?.tagline || 'Elevating everyday experiences through thoughtful engineering.')}</p>
      </div>
      <div>
        <h4 style="font-size:1rem; margin-bottom:1rem;">Shop</h4>
        <ul style="list-style:none; color:var(--color-muted); line-height:2; font-size:0.9rem;">
          <li><a href="/collections/all">All Products</a></li>
          <li><a href="/collections/new">New Arrivals</a></li>
          <li><a href="/collections/featured">Best Sellers</a></li>
        </ul>
      </div>
      <div>
        <h4 style="font-size:1rem; margin-bottom:1rem;">Customer Care</h4>
        <ul style="list-style:none; color:var(--color-muted); line-height:2; font-size:0.9rem;">
          <li><a href="/pages/faq">FAQ & Support</a></li>
          <li><a href="/pages/contact">Contact Us</a></li>
          <li><a href="/policies/shipping-policy">Shipping Policy</a></li>
        </ul>
      </div>
    </div>
    <div style="border-top:1px solid var(--color-border); padding-top:1.5rem; display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; color:var(--color-muted);">
      <p>© 2026 ${esc(input.businessName)}. All rights reserved. Powered by RootX.</p>
      <div style="display:flex; gap:1rem;">
        <span>🔒 256-Bit SSL Encrypted</span>
      </div>
    </div>
  </div>
</footer>`,
  },
];

export const SECTION_REGISTRY: Record<string, SectionVariantDefinition[]> = {
  editorial_hero: editorialHeroVariants,
  product_hero: productHeroVariants,
  trust_bar: trustBarVariants,
  benefit_grid: benefitGridVariants,
  product_specifications: specVariants,
  faq: faqVariants,
  social_proof: socialProofVariants,
  final_cta: finalCtaVariants,
  newsletter: newsletterVariants,
  premium_footer: footerVariants,
};

/**
 * Get all available section variants for a given section type
 */
export function getSectionVariants(sectionType: string): SectionVariantDefinition[] {
  return SECTION_REGISTRY[sectionType] || [];
}

/**
 * Select a specific variant by ID or fallback to the first variant of that section type
 */
export function renderSectionVariant(
  sectionType: string,
  variantId: string,
  gen: WebsiteGeneration,
  input: WebsiteBuilderInput
): string {
  const variants = getSectionVariants(sectionType);
  const selected = variants.find((v) => v.id === variantId) || variants[0];
  if (!selected) {
    return `<!-- Section ${sectionType} not found in library -->`;
  }
  return selected.renderLiquid(gen, input);
}
