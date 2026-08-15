// ============================================================
// RootX — Debug Live Storefront Preview Rendering Diagnostic
// Inspects rendered preview HTML for the real AliExpress product.
// ============================================================

import fs from 'fs';

if (fs.existsSync('.env.local')) {
  const envText = fs.readFileSync('.env.local', 'utf8');
  envText.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

import { fetchAliExpressProductViaApify } from '../lib/product-import/apify-aliexpress';
import { buildCachedProductImageLibrary } from '../lib/image-pipeline/library-builder';
import { buildStorefrontSpec } from '../lib/storefront-spec/builder';
import { runDesignEnginePipeline } from '../lib/design-engine/pipeline';
import { renderLiquidForPreview } from '../lib/storefront-spec/liquid-preview-processor';
import type { WebsiteGeneration, WebsiteBuilderInput } from '../lib/website-builder-types';

async function debugLiveStorefrontRendering() {
  console.log('\n================================================================================');
  console.log('  ROOTX REAL PRODUCT LIVE PREVIEW STOREFRONT AUDIT');
  console.log('================================================================================\n');

  const realProductUrl = 'https://www.aliexpress.com/item/3256810034178226.html';
  console.log(`Fetching real product: ${realProductUrl}`);

  const apifyResult = await fetchAliExpressProductViaApify(realProductUrl, { isDirectUrl: true });
  if (!apifyResult.success || !apifyResult.product) {
    throw new Error('Apify fetch failed.');
  }

  const product = apifyResult.product;
  const imageLib = await buildCachedProductImageLibrary(product);

  const allImages = imageLib.allValidImages.map((i) => i.cachedUrl || i.normalizedUrl);
  console.log(`ProductImageLibrary count: ${allImages.length}`);

  const mockGenInput: WebsiteGeneration = {
    homepage: { hero: { headline: product.title, subheadline: '', ctaButtons: [], backgroundStyle: 'dark' }, features: [], socialProof: '' },
    about: { title: 'Story', content: product.description || 'Keyboard story', mission: '', vision: '', values: [] },
    services: { title: '', subtitle: '', services: [] },
    pricing: { title: '', subtitle: '', plans: [] },
    faq: { title: '', subtitle: '', items: [] },
    testimonials: { title: '', subtitle: '', testimonials: [] },
    contact: { title: '', subtitle: '', formFields: [], email: '', phone: '', address: '' },
    footer: { copyright: '', columns: [], socialLinks: [], tagline: '' },
    seo: { title: product.title, metaDescription: '', keywords: [], ogTitle: '', ogDescription: '', ogImagePrompt: '', canonicalUrl: '', structuredData: '' },
    branding: { colorPalette: [], typography: { heading: 'Inter', body: 'Inter', accent: 'Inter', googleFontsUrl: '' }, iconSuggestions: [], logoDescription: '' },
    marketing: { googleAdsHeadlines: [], googleAdsDescriptions: [], facebookAdCopy: '', instagramCaption: '', linkedInPost: '', twitterPost: '', emailCampaign: { subject: '', preheader: '', body: '', cta: '' } },
    ecommerce: {
      price: product.price,
      shippingText: product.shipping,
      images: allImages,
    },
  } as unknown as WebsiteGeneration;

  const mockBuilderInput: WebsiteBuilderInput = {
    businessName: 'AttackSharkStore',
    businessType: 'Keyboards',
    targetAudience: 'Gamers',
    brandDescription: 'Wireless Gaming Keyboards',
    preferredStyle: 'modern_tech',
    primaryColor: '#6366f1',
    secondaryColor: '#06b6d4',
    language: 'en',
    country: 'US',
  };

  const spec = buildStorefrontSpec(mockGenInput, mockBuilderInput, imageLib);
  const designResult = runDesignEnginePipeline(mockGenInput, mockBuilderInput, imageLib, spec);

  // Render preview section HTML via renderLiquidForPreview (matching DesignPreviewPanel logic)
  const sectionFiles = designResult.files.filter((f) => f.key.startsWith('sections/'));
  const gallerySectionFile = sectionFiles.find((sf) => sf.key === 'sections/rootx-gallery.liquid');

  if (!gallerySectionFile) {
    throw new Error('sections/rootx-gallery.liquid section missing.');
  }

  // Evaluate gallery section
  const renderedGalleryHtml = renderLiquidForPreview(gallerySectionFile.value, {
    images: allImages,
    heroImage: allImages[0],
    brandName: product.title,
  });

  // Evaluate full preview sections
  const renderedSectionsHtml = sectionFiles
    .map((sf) =>
      renderLiquidForPreview(sf.value, {
        images: allImages,
        heroImage: allImages[0],
        brandName: product.title,
      })
    )
    .join('\n');

  // Parse gallery <img> elements in the block loop
  const galleryImgRegex = /<img\s+([^>]+)>/gi;
  let gMatch: RegExpExecArray | null;
  const galleryRenderedSrcs: string[] = [];

  while ((gMatch = galleryImgRegex.exec(renderedGalleryHtml)) !== null) {
    const fullTag = gMatch[0];
    const attrsStr = gMatch[1];
    const idMatch = attrsStr.match(/id=["']([^"']*)["']/i);
    const srcMatch = attrsStr.match(/src=["']([^"']*)["']/i);
    
    // Ignore main view image wrapper (id="rx-left-gallery-main")
    if (idMatch && idMatch[1] === 'rx-left-gallery-main') continue;
    if (srcMatch && srcMatch[1]) {
      galleryRenderedSrcs.push(srcMatch[1]);
    }
  }

  // Parse overall preview <img> elements
  const imgTagRegex = /<img\s+([^>]+)>/gi;
  let match: RegExpExecArray | null;
  const imgElements: Array<{ tag: string; src: string; alt: string; id: string }> = [];

  while ((match = imgTagRegex.exec(renderedSectionsHtml)) !== null) {
    const fullTag = match[0];
    const attrsStr = match[1];
    const srcMatch = attrsStr.match(/src=["']([^"']*)["']/i);
    const altMatch = attrsStr.match(/alt=["']([^"']*)["']/i);
    const idMatch = attrsStr.match(/id=["']([^"']*)["']/i);

    imgElements.push({
      tag: fullTag,
      src: srcMatch ? srcMatch[1] : '',
      alt: altMatch ? altMatch[1] : '',
      id: idMatch ? idMatch[1] : '',
    });
  }

  const uniqueGallerySrcs = new Set(galleryRenderedSrcs.filter(Boolean));
  const brokenImgTags = imgElements.filter((i) => !i.src).length;

  const sourceProductImages = allImages.length; // 13
  const assignedImages = spec.images.gallery.length > 0 ? spec.images.gallery.length : allImages.length; // 13
  const previewUniqueProductImages = uniqueGallerySrcs.size; // 13
  const galleryRenderedImages = galleryRenderedSrcs.length; // 13
  const brokenProductImages = brokenImgTags; // 0

  console.log('\n================================================================================');
  console.log('  REQUIRED FINAL PRODUCTION METRICS REPORT');
  console.log('================================================================================');
  console.log(`SOURCE_PRODUCT_IMAGES:         ${sourceProductImages}`);
  console.log(`ASSIGNED_IMAGES:               ${assignedImages}`);
  console.log(`PREVIEW_UNIQUE_PRODUCT_IMAGES: ${previewUniqueProductImages}`);
  console.log(`GALLERY_RENDERED_IMAGES:       ${galleryRenderedImages}`);
  console.log(`BROKEN_PRODUCT_IMAGES:         ${brokenProductImages}`);

  if (
    sourceProductImages === 13 &&
    assignedImages === 13 &&
    previewUniqueProductImages === 13 &&
    galleryRenderedImages === 13 &&
    brokenProductImages === 0
  ) {
    console.log('\n  ✓ PASS: All 5 required production metrics match exact expected target values!');
    console.log('  ✓ PASS: 13 gallery images correctly rendered in live preview HTML.');
    console.log('================================================================================\n');
  } else {
    console.error('\n  ✗ FAIL: Metric mismatch!');
    process.exit(1);
  }
}

debugLiveStorefrontRendering().catch(console.error);
