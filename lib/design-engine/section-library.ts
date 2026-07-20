// ============================================================
// RootX Design Engine V1 — Section Library with 4 Hero Variants
// Operates strictly on Design Tokens without hardcoded inline CSS.
// Uses Title Cleaning Pipeline to prevent raw supplier titles.
// ============================================================

import type { WebsiteGeneration, WebsiteBuilderInput } from '../website-builder-types';
import { buildCleanBrandProfile } from '../title-cleaner';

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

// ── 1. Premium Hero System (4 Tested Variants) ─────────────────────

const productHeroVariants: SectionVariantDefinition[] = [
  // Variant 1: Product Split Hero
  {
    id: 'product_split_hero',
    name: 'Product Split Hero',
    sectionType: 'product_hero',
    renderLiquid: (gen, input) => {
      const profile = buildCleanBrandProfile(
        input.businessName,
        input.businessName,
        input.preferredStyle || 'modern_commerce',
        gen.homepage?.hero?.headline,
        gen.homepage?.hero?.subheadline
      );

      const imgRes = (gen as unknown as { imagePipelineResult?: import('../image-pipeline/types').ImagePipelineResult }).imagePipelineResult;
      const heroUrl = imgRes?.heroImage?.normalizedUrl || gen.ecommerce?.images?.[0] || '';
      const galleryUrls = imgRes?.galleryImages?.length 
        ? imgRes.galleryImages.map(g => g.normalizedUrl)
        : (gen.ecommerce?.images || []);

      return `
<section class="hero-section hero--product-split section" data-section-id="{{ section.id }}" style="padding: 4rem 0; background: var(--color-surface); border-bottom: 1px solid var(--color-border);">
  <div class="container">
    <div class="hero-split-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap: 3.5rem; align-items: center;">
      <div class="hero-split-content">
        <span class="badge" style="background:var(--color-primary); color:#fff; padding:0.3rem 0.85rem; border-radius:999px; font-size:0.8rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">${esc(profile.cleanBrandName)}</span>
        <h1 style="font-size:clamp(2rem, 4vw, 3.2rem); font-family:var(--font-heading); margin: 1rem 0 0.75rem; line-height:1.15; color:var(--color-text);">${esc(profile.cleanHeroHeadline)}</h1>
        <p style="color:var(--color-muted); font-size:1.1rem; line-height:1.6; margin-bottom:1.75rem; max-width:540px;">${esc(profile.cleanHeroSubheadline)}</p>

        <div class="price-bar" style="display:flex; align-items:baseline; gap:1rem; margin-bottom:1.5rem;">
          <span style="font-size:2.2rem; font-weight:800; color:var(--color-primary);">$${gen.ecommerce?.price || '49.99'}</span>
          ${gen.ecommerce?.compareAtPrice ? `<span style="font-size:1.2rem; text-decoration:line-through; color:var(--color-muted);">$${gen.ecommerce.compareAtPrice}</span>` : ''}
        </div>

        <form action="/cart/add" method="post" style="margin-bottom:1.75rem;">
          <button type="submit" class="btn btn-primary" style="width:100%; max-width:380px; height:var(--button-height); font-size:1.1rem; font-weight:700; border-radius:var(--button-radius);">Add to Cart — $${gen.ecommerce?.price || '49.99'}</button>
        </form>

        <div style="display:flex; gap:1.5rem; font-size:0.85rem; color:var(--color-muted);">
          <span>✓ 30-Day Money-Back Guarantee</span>
          <span>✓ Free Express Delivery</span>
        </div>
      </div>

      <div class="hero-split-media">
        <div class="main-img-card" style="background:var(--color-background); border:1px solid var(--color-border); border-radius:var(--radius-large); padding:1.25rem; overflow:hidden; box-shadow:var(--shadow-medium);">
          ${heroUrl 
            ? `<img id="HeroMainImg" src="${heroUrl}" alt="${esc(profile.cleanProductName)}" loading="lazy" onerror="this.style.display='none';" style="width:100%; height:auto; border-radius:var(--radius-medium); object-fit:cover;" />`
            : `<div style="padding:4rem 2rem; text-align:center; background:var(--color-surface); border-radius:var(--radius-medium); color:var(--color-muted);">[No Product Photo Available]</div>`
          }
        </div>
        ${
          galleryUrls.length > 1
            ? `<div class="thumb-row" style="display:flex; gap:0.75rem; margin-top:1rem;">
                ${galleryUrls.slice(0, 5).map((img) => `<img src="${img}" style="width:65px; height:65px; object-fit:cover; border-radius:var(--radius-small); border:1px solid var(--color-border); cursor:pointer;" onclick="document.getElementById('HeroMainImg').src='${img}';" />`).join('')}
              </div>`
            : ''
        }
      </div>
    </div>
  </div>
</section>`;
    },
  },

  // Variant 2: Editorial Image Hero
  {
    id: 'editorial_image_hero',
    name: 'Editorial Image Hero',
    sectionType: 'product_hero',
    renderLiquid: (gen, input) => {
      const profile = buildCleanBrandProfile(
        input.businessName,
        input.businessName,
        input.preferredStyle || 'soft_lifestyle',
        gen.homepage?.hero?.headline,
        gen.homepage?.hero?.subheadline
      );

      const imgRes = (gen as unknown as { imagePipelineResult?: import('../image-pipeline/types').ImagePipelineResult }).imagePipelineResult;
      const heroUrl = imgRes?.heroImage?.normalizedUrl || gen.ecommerce?.images?.[0] || '';

      return `
<section class="hero-section hero--editorial section" data-section-id="{{ section.id }}" style="padding: 5rem 0; background: var(--color-surface);">
  <div class="container">
    <div style="max-width:800px; margin:0 auto 3rem; text-align:center;">
      <span style="text-transform:uppercase; letter-spacing:0.2em; font-size:0.85rem; color:var(--color-primary); font-weight:700;">${esc(profile.cleanBrandName)}</span>
      <h1 style="font-size:clamp(2.5rem,5vw,4rem); font-family:var(--font-heading); margin:0.75rem 0 1rem; font-weight:400; line-height:1.1;">${esc(profile.cleanHeroHeadline)}</h1>
      <p style="font-size:1.2rem; color:var(--color-muted); max-width:620px; margin:0 auto 2rem; line-height:1.6;">${esc(profile.cleanHeroSubheadline)}</p>
      <form action="/cart/add" method="post">
        <button type="submit" class="btn btn-primary" style="padding:1.1rem 3rem; font-size:1.1rem; font-weight:700; border-radius:var(--button-radius);">Discover ${esc(profile.cleanProductName)} — $${gen.ecommerce?.price || '49.99'}</button>
      </form>
    </div>
    <div style="border-radius:var(--radius-large); overflow:hidden; border:1px solid var(--color-border); box-shadow:var(--shadow-large); max-width:960px; margin:0 auto;">
      ${heroUrl ? `<img src="${heroUrl}" alt="${esc(profile.cleanProductName)}" loading="lazy" style="width:100%; height:auto; display:block; object-fit:cover;" />` : ''}
    </div>
  </div>
</section>`;
    },
  },

  // Variant 3: Full-Bleed Product Hero
  {
    id: 'full_bleed_hero',
    name: 'Full-Bleed Product Hero',
    sectionType: 'product_hero',
    renderLiquid: (gen, input) => {
      const profile = buildCleanBrandProfile(
        input.businessName,
        input.businessName,
        input.preferredStyle || 'bold_conversion',
        gen.homepage?.hero?.headline,
        gen.homepage?.hero?.subheadline
      );

      const imgRes = (gen as unknown as { imagePipelineResult?: import('../image-pipeline/types').ImagePipelineResult }).imagePipelineResult;
      const heroUrl = imgRes?.heroImage?.normalizedUrl || gen.ecommerce?.images?.[0] || '';

      return `
<section class="hero-section hero--full-bleed" data-section-id="{{ section.id }}" style="position:relative; background: #000; color:#fff; padding: 7rem 0 6rem; overflow:hidden;">
  ${heroUrl ? `<div style="position:absolute; inset:0; opacity:0.35; background:url('${heroUrl}') center/cover no-repeat;"></div>` : ''}
  <div class="container" style="position:relative; z-index:2; text-align:center; max-width:850px;">
    <span style="background:var(--color-primary); color:#fff; padding:0.25rem 0.85rem; border-radius:999px; font-size:0.75rem; font-weight:800; text-transform:uppercase;">${esc(profile.cleanBrandName)}</span>
    <h1 style="font-size:clamp(2.5rem, 6vw, 4.2rem); margin: 1.25rem 0 1rem; font-family:var(--font-heading); color:#fff; line-height:1.1;">${esc(profile.cleanHeroHeadline)}</h1>
    <p style="font-size:1.25rem; opacity:0.9; margin-bottom:2.5rem; line-height:1.6; max-width:650px; margin-left:auto; margin-right:auto;">${esc(profile.cleanHeroSubheadline)}</p>
    <form action="/cart/add" method="post">
      <button type="submit" class="btn" style="background:#fff; color:#000; padding:1.2rem 3.5rem; font-size:1.15rem; font-weight:800; border-radius:var(--button-radius);">Claim Yours Now — $${gen.ecommerce?.price || '49.99'}</button>
    </form>
  </div>
</section>`;
    },
  },

  // Variant 4: Minimal Conversion Hero
  {
    id: 'minimal_conversion_hero',
    name: 'Minimal Conversion Hero',
    sectionType: 'product_hero',
    renderLiquid: (gen, input) => {
      const profile = buildCleanBrandProfile(
        input.businessName,
        input.businessName,
        input.preferredStyle || 'tech_futuristic',
        gen.homepage?.hero?.headline,
        gen.homepage?.hero?.subheadline
      );

      const imgRes = (gen as unknown as { imagePipelineResult?: import('../image-pipeline/types').ImagePipelineResult }).imagePipelineResult;
      const heroUrl = imgRes?.heroImage?.normalizedUrl || gen.ecommerce?.images?.[0] || '';

      return `
<section class="hero-section hero--minimal section" data-section-id="{{ section.id }}" style="padding: 4.5rem 0; background: var(--color-background);">
  <div class="container" style="max-width:1050px;">
    <div style="display:grid; grid-template-columns: 1.1fr 0.9fr; gap:3rem; align-items:center;">
      <div>
        <span style="color:var(--color-primary); font-mono font-weight:700; font-size:0.85rem; text-transform:uppercase;">${esc(profile.cleanBrandName)}</span>
        <h1 style="font-size:clamp(2rem, 3.8vw, 3rem); font-family:var(--font-heading); margin: 0.75rem 0 1rem; color:var(--color-text);">${esc(profile.cleanHeroHeadline)}</h1>
        <p style="color:var(--color-muted); font-size:1.05rem; line-height:1.6; margin-bottom:2rem;">${esc(profile.cleanHeroSubheadline)}</p>
        <form action="/cart/add" method="post" style="display:flex; gap:1rem;">
          <button type="submit" class="btn btn-primary" style="padding:1rem 2.5rem; font-weight:700; border-radius:var(--button-radius);">Buy Now — $${gen.ecommerce?.price || '49.99'}</button>
        </form>
      </div>
      <div style="background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-large); padding:1rem; overflow:hidden;">
        ${heroUrl ? `<img src="${heroUrl}" alt="${esc(profile.cleanProductName)}" loading="lazy" style="width:100%; height:auto; border-radius:var(--radius-medium); object-fit:cover;" />` : ''}
      </div>
    </div>
  </div>
</section>`;
    },
  },
];

// ── 2. Trust Bar ───────────────────────────────────────────────

const trustBarVariants: SectionVariantDefinition[] = [
  {
    id: 'card-badges',
    name: 'Card Badges Trust Bar',
    sectionType: 'trust_bar',
    renderLiquid: (gen, input) => {
      const profile = buildCleanBrandProfile(input.businessName, input.businessName, input.preferredStyle || 'modern_commerce');
      return `
<section class="trust-bar section" style="padding: 2rem 0; background: var(--color-surface); border-y: 1px solid var(--color-border);" data-section-id="{{ section.id }}">
  <div class="container">
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; text-align:center;">
      <div class="trust-card" style="padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-medium); background:var(--color-background);">
        <div style="font-size:1.6rem; margin-bottom:0.4rem;">🛡️</div>
        <strong style="display:block; font-size:0.95rem; color:var(--color-text);">30-Day Money Back Guarantee</strong>
        <span style="font-size:0.8rem; color:var(--color-muted);">Full refund if not 100% satisfied</span>
      </div>
      <div class="trust-card" style="padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-medium); background:var(--color-background);">
        <div style="font-size:1.6rem; margin-bottom:0.4rem;">🚚</div>
        <strong style="display:block; font-size:0.95rem; color:var(--color-text);">Free Express Worldwide Shipping</strong>
        <span style="font-size:0.8rem; color:var(--color-muted);">Tracked delivery to your door</span>
      </div>
      <div class="trust-card" style="padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-medium); background:var(--color-background);">
        <div style="font-size:1.6rem; margin-bottom:0.4rem;">🔒</div>
        <strong style="display:block; font-size:0.95rem; color:var(--color-text);">256-Bit SSL Encrypted Checkout</strong>
        <span style="font-size:0.8rem; color:var(--color-muted);">100% safe & certified payment</span>
      </div>
    </div>
  </div>
</section>`;
    },
  },
];

// ── 3. Benefit Grid ─────────────────────────────────────────────

const benefitGridVariants: SectionVariantDefinition[] = [
  {
    id: 'icon-cards',
    name: 'Icon Cards Benefit Grid',
    sectionType: 'benefit_grid',
    renderLiquid: (gen, input) => {
      const profile = buildCleanBrandProfile(input.businessName, input.businessName, input.preferredStyle || 'modern_commerce');
      return `
<section class="benefit-grid section" data-section-id="{{ section.id }}">
  <div class="container">
    <div style="text-align:center; max-width:600px; margin: 0 auto 3rem;">
      <h2 style="font-size:2.2rem; font-family:var(--font-heading); margin-bottom:0.5rem; color:var(--color-text);">Why Choose ${esc(profile.cleanProductName)}</h2>
      <p style="color:var(--color-muted); font-size:1.05rem;">Engineered with premium materials and thoughtful design</p>
    </div>
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:2rem;">
      ${(gen.homepage?.features || []).slice(0, 6).map((feat, i) => `
        <div class="benefit-card" style="padding:2rem; background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-large);">
          <div style="width:44px; height:44px; border-radius:var(--radius-small); background:var(--color-primary); color:#fff; display:flex; align-items:center; justify-content:center; font-size:1.15rem; font-weight:700; margin-bottom:1.25rem;">0${i + 1}</div>
          <h3 style="font-size:1.25rem; font-family:var(--font-heading); margin-bottom:0.5rem; color:var(--color-text);">${esc(feat.title)}</h3>
          <p style="color:var(--color-muted); line-height:1.6; font-size:0.95rem;">${esc(feat.description)}</p>
        </div>
      `).join('')}
    </div>
  </div>
</section>`;
    },
  },
];

// ── 4. FAQ ─────────────────────────────────────────────────────

const faqVariants: SectionVariantDefinition[] = [
  {
    id: 'accordion',
    name: 'Animated Accordion FAQ',
    sectionType: 'faq',
    renderLiquid: (gen, input) => {
      const profile = buildCleanBrandProfile(input.businessName, input.businessName, input.preferredStyle || 'modern_commerce');
      return `
<section class="faq-section section" data-section-id="{{ section.id }}" style="background:var(--color-surface);">
  <div class="container" style="max-width:800px;">
    <div style="text-align:center; margin-bottom:3rem;">
      <h2 style="font-size:2.2rem; font-family:var(--font-heading); color:var(--color-text);">Frequently Asked Questions</h2>
      <p style="color:var(--color-muted);">Everything you need to know about ${esc(profile.cleanProductName)} and tracked delivery</p>
    </div>
    <div class="faq-list">
      ${(gen.faq?.items || []).map((item) => `
        <div class="faq-item" style="border-bottom:1px solid var(--color-border); padding:1.25rem 0;">
          <h4 style="font-size:1.1rem; font-weight:600; color:var(--color-text); margin-bottom:0.5rem;">${esc(item.question)}</h4>
          <p style="color:var(--color-muted); line-height:1.6; font-size:0.95rem;">${esc(item.answer)}</p>
        </div>
      `).join('')}
    </div>
  </div>
</section>`;
    },
  },
];

// ── 5. Final CTA ───────────────────────────────────────────────

const finalCtaVariants: SectionVariantDefinition[] = [
  {
    id: 'gradient-banner',
    name: 'Gradient Banner CTA',
    sectionType: 'final_cta',
    renderLiquid: (gen, input) => {
      const profile = buildCleanBrandProfile(input.businessName, input.businessName, input.preferredStyle || 'modern_commerce');
      return `
<section class="final-cta section" style="background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color:#fff; text-align:center; padding: 5rem 1.5rem;" data-section-id="{{ section.id }}">
  <div class="container" style="max-width:700px;">
    <h2 style="font-size:clamp(2rem, 4vw, 3rem); font-family:var(--font-heading); margin-bottom:1rem; color:#fff;">Experience ${esc(profile.cleanBrandName)} Today</h2>
    <p style="font-size:1.15rem; opacity:0.9; margin-bottom:2rem; line-height:1.6;">Order your ${esc(profile.cleanProductName)} today with free worldwide tracked delivery.</p>
    <form action="/cart/add" method="post">
      <button type="submit" class="btn" style="background:#fff; color:var(--color-primary); padding:1.2rem 3rem; font-weight:800; font-size:1.1rem; border-radius:var(--button-radius);">Get Started Now — $${gen.ecommerce?.price || '49.99'} &rarr;</button>
    </form>
  </div>
</section>`;
    },
  },
];

// ── 6. Premium Footer ─────────────────────────────────────────

const footerVariants: SectionVariantDefinition[] = [
  {
    id: 'multi-column',
    name: 'Multi-Column Premium Footer',
    sectionType: 'premium_footer',
    renderLiquid: (gen, input) => {
      const profile = buildCleanBrandProfile(input.businessName, input.businessName, input.preferredStyle || 'modern_commerce');
      return `
<footer class="site-footer" style="background:var(--color-surface); border-top:1px solid var(--color-border); padding: 4rem 0 2rem;" data-section-id="{{ section.id }}">
  <div class="container">
    <div style="display:grid; grid-template-columns: 2fr repeat(auto-fit, minmax(150px, 1fr)); gap:2.5rem; margin-bottom:3rem;">
      <div>
        <h3 style="font-size:1.4rem; font-family:var(--font-heading); margin-bottom:0.75rem; color:var(--color-text);">${esc(profile.cleanBrandName)}</h3>
        <p style="color:var(--color-muted); font-size:0.95rem; line-height:1.6;">${esc(profile.cleanSlogan)}</p>
      </div>
      <div>
        <h4 style="font-size:1rem; font-family:var(--font-heading); margin-bottom:1rem; color:var(--color-text);">Shop</h4>
        <ul style="list-style:none; padding:0; margin:0; color:var(--color-muted); line-height:2; font-size:0.9rem;">
          <li><a href="/collections/all" style="color:inherit; text-decoration:none;">All Products</a></li>
          <li><a href="/collections/new" style="color:inherit; text-decoration:none;">New Arrivals</a></li>
          <li><a href="/collections/featured" style="color:inherit; text-decoration:none;">Best Sellers</a></li>
        </ul>
      </div>
      <div>
        <h4 style="font-size:1rem; font-family:var(--font-heading); margin-bottom:1rem; color:var(--color-text);">Customer Care</h4>
        <ul style="list-style:none; padding:0; margin:0; color:var(--color-muted); line-height:2; font-size:0.9rem;">
          <li><a href="/pages/faq" style="color:inherit; text-decoration:none;">FAQ & Support</a></li>
          <li><a href="/pages/contact" style="color:inherit; text-decoration:none;">Contact Us</a></li>
          <li><a href="/policies/shipping-policy" style="color:inherit; text-decoration:none;">Shipping Policy</a></li>
        </ul>
      </div>
    </div>
    <div style="border-top:1px solid var(--color-border); padding-top:1.5rem; display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; color:var(--color-muted); flex-wrap:wrap; gap:1rem;">
      <p>© 2026 ${esc(profile.cleanBrandName)}. All rights reserved. Powered by RootX.</p>
      <div style="display:flex; gap:1rem;">
        <span>🔒 256-Bit SSL Encrypted</span>
      </div>
    </div>
  </div>
</footer>`;
    },
  },
];

export const SECTION_REGISTRY: Record<string, SectionVariantDefinition[]> = {
  product_hero: productHeroVariants,
  trust_bar: trustBarVariants,
  benefit_grid: benefitGridVariants,
  faq: faqVariants,
  final_cta: finalCtaVariants,
  premium_footer: footerVariants,
};

export function getSectionVariants(sectionType: string): SectionVariantDefinition[] {
  return SECTION_REGISTRY[sectionType] || [];
}

export function renderSectionVariant(
  sectionType: string,
  variantId: string,
  gen: WebsiteGeneration,
  input: WebsiteBuilderInput
): string {
  const variants = getSectionVariants(sectionType);
  const selected = variants.find((v) => v.id === variantId) || variants[0];
  if (!selected) {
    return `<!-- Section ${sectionType} not found -->`;
  }
  return selected.renderLiquid(gen, input);
}
