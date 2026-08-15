import { createProductImageLibrary } from '../lib/image-pipeline/library-builder';
import { reassignImagesForTheme } from '../lib/image-pipeline/theme-reassigner';
import { buildStorefrontSpec } from '../lib/storefront-spec/builder';
import { generateShopifyLiquidSections } from '../lib/storefront-spec/liquid-generator';
import { renderLiquidForPreview } from '../lib/storefront-spec/liquid-preview-processor';
import { downloadAndPackageProductImages } from '../lib/image-pipeline/asset-downloader';
import { resolveRenderableImage } from '../lib/image-pipeline/resolve-image';

async function runDiagnostics() {
  console.log('====================================================');
  console.log('DIAGNOSTICS: AliExpress Product Section Image Resolution');
  console.log('====================================================');

  const mockAliExpressGeneration = {
    ecommerce: {
      productName: 'Orthopedic Support Knee Brace',
      price: '34.99',
      images: [
        'https://ae01.alicdn.com/kf/S1111111111111_KneeBraceHero.jpg',
        'https://ae01.alicdn.com/kf/S2222222222222_KneeBraceStory.jpg',
        'https://ae01.alicdn.com/kf/S3333333333333_KneeBraceShowcase.jpg',
        'https://ae01.alicdn.com/kf/S4444444444444_KneeBraceAngle.jpg',
        'https://ae01.alicdn.com/kf/S5555555555555_KneeBraceDetail.jpg',
      ],
      aiImageSelections: {
        heroImageIndex: 0,
        storyImageIndex: 1,
        featuredImageIndex: 2,
        galleryImageIndexes: [0, 1, 2, 3, 4],
        finalCtaImageIndex: 3,
      },
    },
    homepage: {
      heroHeadline: 'Relieve Knee Pain & Restore Active Mobility',
      heroSubheadline: 'Engineered with medical-grade compression for instant joint support.',
    },
  };

  const imageLibrary = createProductImageLibrary(mockAliExpressGeneration as any);
  console.log(`ProductImageLibrary count: ${imageLibrary.allValidImages.length}`);

  const spec = buildStorefrontSpec(
    mockAliExpressGeneration as any,
    { preferredStyle: 'modern_tech', primaryColor: '#3b82f6', secondaryColor: '#1e40af' } as any,
    imageLibrary
  );

  const heroUrl = resolveRenderableImage(spec.images.hero);
  const storyUrl = resolveRenderableImage(spec.images.story);
  const showcaseUrl = resolveRenderableImage(spec.images.featured);
  const finalCtaUrl = resolveRenderableImage(spec.images.finalCta);
  const galleryUrls = spec.images.gallery.map((g) => resolveRenderableImage(g)).filter(Boolean);

  console.log('\n--- SECTION DIAGNOSTICS ---');
  console.log(`SECTION: hero`);
  console.log(`IMAGE: ${heroUrl}`);

  console.log(`\nSECTION: story`);
  console.log(`IMAGE: ${storyUrl}`);

  console.log(`\nSECTION: showcase`);
  console.log(`IMAGE: ${showcaseUrl}`);

  console.log(`\nSECTION: finalCta`);
  console.log(`IMAGE: ${finalCtaUrl}`);

  console.log(`\nSECTION: gallery`);
  console.log(`IMAGES: ${JSON.stringify(galleryUrls)}`);

  // Count empty image slots
  let emptySlots = 0;
  if (!heroUrl) emptySlots++;
  if (!storyUrl) emptySlots++;
  if (!showcaseUrl) emptySlots++;
  if (!finalCtaUrl) emptySlots++;
  if (galleryUrls.length === 0) emptySlots++;

  console.log('\n--- SUMMARY STATS ---');
  console.log(`ProductImageLibrary count: ${imageLibrary.allValidImages.length}`);
  console.log(`Story image assigned: ${storyUrl ? 'YES (' + storyUrl + ')' : 'NO'}`);
  console.log(`Gallery image count: ${galleryUrls.length}`);
  console.log(`Empty image slots: ${emptySlots}`);

  // Test Liquid section generation
  const liquidSections = generateShopifyLiquidSections(spec);
  const storySection = liquidSections.find((s) => s.key.includes('image-story'));
  const gallerySection = liquidSections.find((s) => s.key.includes('gallery'));

  console.log('\n--- LIQUID TEMPLATE VERIFICATION ---');
  console.log(`Story section generated: ${Boolean(storySection)}`);
  console.log(`Gallery section generated: ${Boolean(gallerySection)}`);

  // Test Liquid preview processor
  if (storySection) {
    const renderedStoryHtml = renderLiquidForPreview(storySection.value, {
      images: galleryUrls,
      heroImage: heroUrl,
      storyImage: storyUrl,
    });
    const hasStoryImgInHtml = renderedStoryHtml.includes('<img') && renderedStoryHtml.includes(storyUrl);
    console.log(`Story section preview contains image HTML: ${hasStoryImgInHtml}`);
  }

  // Test Asset Downloader packaging (base64 mock to avoid actual fetch timeout during offline CLI)
  const base64AliExpressGen = {
    ...mockAliExpressGeneration,
    ecommerce: {
      ...mockAliExpressGeneration.ecommerce,
      images: [
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      ],
    },
  };
  const base64Lib = createProductImageLibrary(base64AliExpressGen as any);
  const base64Spec = buildStorefrontSpec(
    base64AliExpressGen as any,
    { preferredStyle: 'modern_tech', primaryColor: '#3b82f6', secondaryColor: '#1e40af' } as any,
    base64Lib
  );

  const packaged = await downloadAndPackageProductImages(base64Spec);
  console.log(`Shopify Theme Assets packaged count: ${packaged.stats.downloadedAssetCount}`);
  console.log(`Shopify Theme Asset files count: ${packaged.assetFiles.size}`);

  if (emptySlots === 0 && storyUrl && galleryUrls.length > 1) {
    console.log('\n✅ ALL DIAGNOSTIC CHECKS PASSED PERFECTLY!');
  } else {
    console.error('\n❌ DIAGNOSTIC FAILED!');
    process.exit(1);
  }
}

runDiagnostics().catch((err) => {
  console.error(err);
  process.exit(1);
});
