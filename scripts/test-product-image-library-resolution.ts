import assert from 'assert';
import { createProductImageLibrary } from '../lib/image-pipeline/library-builder';
import { reassignImagesForTheme } from '../lib/image-pipeline/theme-reassigner';
import { buildStorefrontSpec } from '../lib/storefront-spec/builder';
import { resolveRenderableImage } from '../lib/image-pipeline/resolve-image';
import { validateImage } from '../lib/image-pipeline/validator';

async function runTests() {
  console.log('====================================================');
  console.log('TEST: ProductImageLibrary Architecture & Fix Verification');
  console.log('====================================================');

  // 1. Mock Product Data with 5 valid ProductImageLibrary images
  const sampleProduct = {
    title: 'High-Speed USB-C Flash Drive 1TB',
    images: [
      'https://ae01.alicdn.com/kf/S1111111111111.jpg',
      'https://ae01.alicdn.com/kf/S2222222222222.jpg',
      'https://ae01.alicdn.com/kf/S3333333333333.jpg',
      'https://ae01.alicdn.com/kf/S4444444444444.jpg',
      'https://ae01.alicdn.com/kf/S5555555555555.jpg',
    ],
    price: '$29.99',
    description: 'Ultra fast portable storage drive.',
  };

  // 2. Build ProductImageLibrary
  const library = createProductImageLibrary(sampleProduct);
  console.log(`ProductImageLibrary count: ${library.allValidImages.length}`);
  assert(library.allValidImages.length === 5, 'ProductImageLibrary must contain 5 valid images');

  // 3. Test Validator Domain Block rules (youtube.com, instagram.com, etc.)
  const seen = new Set<string>();
  const youtubeCheck = validateImage('https://youtube.com/watch?v=dQw4w9WgXcQ', seen);
  assert(!youtubeCheck.isValid, 'Validator MUST reject youtube.com URLs');
  console.log(`[Validator Test] youtube.com correctly rejected: ${youtubeCheck.reason}`);

  const instagramCheck = validateImage('https://instagram.com/p/C123456789', seen);
  assert(!instagramCheck.isValid, 'Validator MUST reject instagram.com URLs');
  console.log(`[Validator Test] instagram.com correctly rejected: ${instagramCheck.reason}`);

  // 4. Test AI Selections with simulated YouTube URL injection & Index Selections
  const aiSelectionsWithYoutube = {
    heroImageIndex: 0,
    storyImageIndex: 1,
    featuredImageIndex: 2,
    galleryImageIndexes: [0, 1, 2, 3],
    finalCtaImageIndex: 4,
    // Simulated invalid/external URL input that an legacy or hallucinating AI might attempt
    heroImageId: 'https://youtube.com/watch?v=bad-url',
  };

  console.log('AI image selections:', JSON.stringify(aiSelectionsWithYoutube));

  // 5. Reassign images for theme
  const themeAssignments = reassignImagesForTheme(library, 'modern_tech', aiSelectionsWithYoutube);

  const resolvedHero = resolveRenderableImage(themeAssignments.hero);
  const resolvedGallery = themeAssignments.gallery.map((img) => resolveRenderableImage(img));

  console.log(`resolved hero image: ${resolvedHero}`);
  console.log(`resolved gallery images:`, JSON.stringify(resolvedGallery));
  console.log(`external URLs rejected: ${themeAssignments.externalUrlsRejectedCount || 0}`);
  console.log(`broken images count: ${library.rejectedImages.length}`);

  // 6. Hard Assertions
  assert(resolvedHero !== '', 'Hero image must not be empty');
  assert(!resolvedHero.includes('youtube.com'), 'Hero Photo MUST NEVER be youtube.com');
  assert(!resolvedHero.includes('instagram.com'), 'Hero Photo MUST NEVER be instagram.com');
  assert(
    library.allValidImages.some((img) => resolveRenderableImage(img) === resolvedHero),
    'Resolved hero image MUST originate exclusively from ProductImageLibrary'
  );

  resolvedGallery.forEach((url) => {
    assert(!url.includes('youtube.com'), 'Gallery image must never be youtube.com');
    assert(
      library.allValidImages.some((img) => resolveRenderableImage(img) === url),
      'All rendered gallery images MUST originate from ProductImageLibrary'
    );
  });

  // 7. Test StorefrontSpec Builder with AI input
  const mockGen = {
    homepage: {
      hero: { headline: 'Ultimate Portable Storage', subheadline: 'Fast 1TB Drive' },
    },
    ecommerce: {
      price: '29.99',
      images: sampleProduct.images,
      aiImageSelections: aiSelectionsWithYoutube,
    },
  } as any;

  const mockInput = {
    businessName: 'DriveTech',
    businessType: 'Electronics',
    preferredStyle: 'modern_tech',
  } as any;

  const spec = buildStorefrontSpec(mockGen, mockInput, library);

  const heroSection = spec.sections.find((s) => s.id === 'rootx-hero');
  const heroSectionImage = String(heroSection?.settings?.hero_image || '');
  console.log(`StorefrontSpec rootx-hero image setting: ${heroSectionImage}`);

  assert(!heroSectionImage.includes('youtube.com'), 'StorefrontSpec hero image must not be youtube.com');
  assert(
    library.allValidImages.some((img) => resolveRenderableImage(img) === heroSectionImage),
    'StorefrontSpec section image MUST originate from ProductImageLibrary'
  );

  console.log('====================================================');
  console.log('ALL ASSERTIONS PASSED SUCCESSFULLY!');
  console.log('====================================================');
  console.log('FINAL METRICS:');
  console.log(`ProductImageLibrary count: ${library.allValidImages.length}`);
  console.log(`AI image selections: ${JSON.stringify(aiSelectionsWithYoutube)}`);
  console.log(`resolved hero image: ${resolvedHero}`);
  console.log(`resolved gallery images: ${JSON.stringify(resolvedGallery)}`);
  console.log(`external URLs rejected: ${themeAssignments.externalUrlsRejectedCount || 0}`);
  console.log(`broken images count: ${library.rejectedImages.length}`);
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
