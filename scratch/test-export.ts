import { generateShopifyTheme } from '../lib/shopify-theme-generator';
import type { WebsiteGeneration, WebsiteBuilderInput } from '../lib/website-builder-types';
import JSZip from 'jszip';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// Shopify Theme Validation Script
//
// Generates and validates themes for Electronics, Beauty, and
// Home products, saving them to the scratch directory.
// ============================================================

const REQUIRED_FILES = [
  'layout/theme.liquid',
  'templates/index.json',
  'templates/product.json',
  'templates/collection.json',
  'templates/page.json',
  'templates/cart.json',
  'sections/header.liquid',
  'sections/footer.liquid',
  'sections/hero-product.liquid',
  'sections/product-gallery.liquid',
  'sections/product-benefits.liquid',
  'sections/product-specifications.liquid',
  'sections/faq.liquid',
  'sections/image-with-text.liquid',
  'sections/featured-product.liquid',
  'assets/theme.css',
  'assets/theme.js',
  'config/settings_schema.json',
  'config/settings_data.json',
  'locales/en.default.json',
];

// Helper to create basic website builder inputs
function createMockInput(name: string, pColor: string, sColor: string): WebsiteBuilderInput {
  return {
    businessName: name,
    businessType: 'E-commerce',
    targetAudience: 'Consumers',
    brandDescription: 'A premium brand offering high-quality solutions.',
    preferredStyle: 'modern_commerce',
    primaryColor: pColor,
    secondaryColor: sColor,
    language: 'en',
    country: 'US',
  };
}

// Helper to create basic website generations
function createMockGeneration(
  title: string,
  price: string,
  compareAt: string,
  images: string[],
  features: Array<{ title: string; description: string; imageUrl: string }>,
  specs: Array<{ label: string; value: string }>,
  faqs: Array<{ question: string; answer: string }>
): WebsiteGeneration {
  return {
    homepage: {
      hero: {
        headline: `Experience the Future of ${title}`,
        subheadline: 'Crafted for performance. Designed for comfort.',
        ctaButtons: [
          { label: 'Shop Now', url: '/products/main', variant: 'primary' },
          { label: 'Learn More', url: '#benefits', variant: 'secondary' },
        ],
        backgroundStyle: 'gradient',
      },
      features: features.map((f, i) => ({
        title: f.title,
        description: f.description,
        icon: i === 0 ? '✨' : i === 1 ? '⚡' : '🛡️',
      })),
      socialProof: 'Rated 4.9/5 stars by over 10,000+ happy customers.',
    },
    about: {
      title: 'Our Mission',
      content: `We build the finest ${title} in the industry, focusing on absolute quality and modern engineering.`,
      mission: 'To elevate daily experiences through thoughtful product design.',
      vision: 'A world where premium quality is accessible to everyone.',
      values: ['Innovation', 'Sustainability', 'Customer Delight'],
    },
    services: {
      title: 'Our Offerings',
      subtitle: 'What makes us different',
      services: [],
    },
    pricing: {
      title: 'Simple Pricing',
      subtitle: 'No hidden fees',
      plans: [],
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: 'Got questions? We have answers.',
      items: faqs,
    },
    testimonials: {
      title: 'What Our Customers Say',
      subtitle: 'Real reviews from verified buyers',
      testimonials: [
        {
          name: 'Sarah M.',
          role: 'Verified Customer',
          company: '',
          quote: `This is hands down the best purchase I made this year. High quality and fast shipping!`,
          rating: 5,
        },
        {
          name: 'David K.',
          role: 'Product Reviewer',
          company: 'TechInsider',
          quote: `Remarkable build quality. It absolutely lives up to the premium hype.`,
          rating: 5,
        },
      ],
    },
    contact: {
      title: 'Get in Touch',
      subtitle: 'Have questions? Drop us a line.',
      email: 'support@rootxstore.com',
      phone: '+1 (800) 555-0199',
      address: '123 E-commerce Way, Suite 100, Austin, TX 78701',
      formFields: [],
    },
    footer: {
      columns: [
        {
          title: 'Shop',
          links: [
            { label: 'All Products', url: '/collections/all' },
            { label: 'New Arrivals', url: '/collections/new' },
          ],
        },
        {
          title: 'Support',
          links: [
            { label: 'FAQ', url: '/pages/faq' },
            { label: 'Contact Us', url: '/pages/contact' },
          ],
        },
      ],
      copyright: '© 2026 RootX E-commerce Store. All rights reserved.',
      socialLinks: [
        { platform: 'Instagram', url: 'https://instagram.com', icon: 'instagram' },
        { platform: 'Facebook', url: 'https://facebook.com', icon: 'facebook' },
      ],
      tagline: 'Elevate your daily routine with premium products.',
    },
    seo: {
      title: `${title} | Premium E-commerce Store`,
      metaDescription: `Buy the best ${title} with premium quality, 30-day money-back guarantee, and free worldwide shipping.`,
      keywords: [title, 'premium', 'shop'],
      ogTitle: `${title} | Premium E-commerce Store`,
      ogDescription: `Buy the best ${title} with premium quality and free shipping.`,
      ogImagePrompt: 'A professional product render on a minimalist studio background.',
      canonicalUrl: 'https://rootxstore.com',
      structuredData: '{}',
    },
    branding: {
      colorPalette: [
        { name: 'Primary', hex: '#111827', usage: 'Backgrounds and text' },
        { name: 'Accent', hex: '#6366f1', usage: 'CTAs and focus states' },
      ],
      typography: {
        heading: 'Outfit',
        body: 'Inter',
        accent: 'Outfit',
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Outfit:wght@600;800&display=swap',
      },
      iconSuggestions: [],
      logoDescription: 'A clean typographic wordmark in a bold sans-serif font.',
    },
    marketing: {
      googleAdsHeadlines: [],
      googleAdsDescriptions: [],
      facebookAdCopy: '',
      instagramCaption: '',
      linkedInPost: '',
      twitterPost: '',
      emailCampaign: { subject: '', preheader: '', body: '', cta: '' },
    },
    isDemo: false,
    provider: 'openai',
    ecommerce: {
      announcementBar: '🚚 Limited Time Offer: Free shipping on all orders today!',
      navigation: ['Home', 'Shop', 'About', 'FAQ', 'Contact'],
      price,
      compareAtPrice: compareAt,
      variants: [
        { name: 'Color', values: ['Midnight Black', 'Space Gray', 'Stellar Silver'] },
        { name: 'Size', values: ['Standard', 'Pro'] },
      ],
      images,
      trustBadges: ['30-Day Money Back Guarantee', 'Free Worldwide Shipping', 'Secure SSL Encrypted Checkout'],
      shippingText: 'Ships within 24 hours. Express shipping options available at checkout.',
      featureSections: features,
      specifications: specs,
      howItWorks: [
        { step: '1', title: 'Order Online', description: 'Select your options and secure your order.' },
        { step: '2', title: 'Fast Dispatch', description: 'We package and ship your order within 24 hours.' },
        { step: '3', title: 'Enjoy Quality', description: 'Receive your premium product and elevate your experience.' },
      ],
      faq: faqs,
      reviews: [
        { author: 'Sarah M.', rating: 5, date: '2026-07-10', title: 'Incredible Quality!', content: 'Absolutely love it. Premium build and feels great.' },
        { author: 'John D.', rating: 5, date: '2026-07-08', title: 'Worth every penny.', content: 'Solid performance, fast shipping. Highly recommend.' },
      ],
      stickyAddToCartText: 'Buy Now — Free Shipping Included',
    },
  };
}

// Validation function
function validateTheme(files: any[], productName: string): string[] {
  const errors: string[] = [];
  const fileMap = new Map<string, string>();
  for (const f of files) {
    fileMap.set(f.key, f.value);
  }

  console.log(`[Validation] Validating theme for: ${productName}`);

  // 1. File existence validation
  for (const reqFile of REQUIRED_FILES) {
    if (!fileMap.has(reqFile)) {
      errors.push(`Missing required file: ${reqFile}`);
    }
  }

  // 2. JSON files validation
  for (const [key, val] of fileMap.entries()) {
    if (key.endsWith('.json')) {
      try {
        JSON.parse(val);
      } catch (err) {
        errors.push(`Invalid JSON in file ${key}: ${err instanceof Error ? err.message : 'Syntax Error'}`);
      }
    }
  }

  // 3. Liquid syntax checks
  for (const [key, val] of fileMap.entries()) {
    if (key.endsWith('.liquid')) {
      const openTags = (val.match(/{%/g) || []).length;
      const closeTags = (val.match(/%}/g) || []).length;
      if (openTags !== closeTags) {
        errors.push(`Mismatched Liquid tag delimiters {% and %} in ${key} (${openTags} open vs ${closeTags} close)`);
      }

      const openOutputs = (val.match(/{{/g) || []).length;
      const closeOutputs = (val.match(/}}/g) || []).length;
      if (openOutputs !== closeOutputs) {
        errors.push(`Mismatched Liquid output delimiters {{ and }} in ${key} (${openOutputs} open vs ${closeOutputs} close)`);
      }

      // Check schema block JSON
      const schemaMatch = val.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/);
      if (schemaMatch) {
        const schemaText = schemaMatch[1].trim();
        try {
          JSON.parse(schemaText);
        } catch (err) {
          errors.push(`Invalid JSON inside {% schema %} block of ${key}: ${err instanceof Error ? err.message : 'Syntax Error'}`);
        }
      }
    }
  }

  // 4. Verify settings and image URLs are present in index.json
  const indexJsonStr = fileMap.get('templates/index.json');
  if (indexJsonStr) {
    const indexJson = JSON.parse(indexJsonStr);
    if (!indexJson.sections || Object.keys(indexJson.sections).length === 0) {
      errors.push('index.json has no sections configured.');
    }
  }

  return errors;
}

// Main execution function
async function run() {
  const scratchDir = path.join(__dirname);
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  // ──────── MOCK 1: ELECTRONICS PRODUCT ────────
  const electronicsInput = createMockInput('AeroSound Pro Headphones Store', '#111827', '#6366f1');
  const electronicsGen = createMockGeneration(
    'AeroSound Pro Headphones',
    '149.99',
    '199.99',
    [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',
    ],
    [
      { title: 'Active Noise Cancelling', description: 'Silence the world around you and focus on your sound.', imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600' },
      { title: '40-Hour Battery Life', description: 'Listen all week on a single charge. Rapid charge option provides 5 hours in 10 minutes.', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600' },
    ],
    [
      { label: 'Driver Size', value: '40mm Neodymium' },
      { label: 'Frequency Response', value: '20Hz - 20kHz' },
      { label: 'Bluetooth Version', value: '5.2 aptX HD' },
    ],
    [
      { question: 'Does it support wireless charging?', answer: 'No, it charges via the included USB-C cable.' },
      { question: 'Is there a warranty?', answer: 'Yes, it comes with a 1-year limited warranty.' },
    ]
  );

  // ──────── MOCK 2: BEAUTY PRODUCT ────────
  const beautyInput = createMockInput('GlowMist Rosewater Spray Store', '#fdf2f8', '#db2777');
  const beautyGen = createMockGeneration(
    'GlowMist Rosewater Spray',
    '24.99',
    '34.99',
    [
      'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800',
      'https://images.unsplash.com/photo-1617897903246-719242758050?w=800',
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800',
    ],
    [
      { title: '100% Organic Ingredients', description: 'Distilled from wild Moroccan roses for ultimate purity.', imageUrl: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600' },
      { title: 'Hydration & Glow', description: 'Instantly locks in moisture and adds a radiant dewy finish to your makeup.', imageUrl: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600' },
    ],
    [
      { label: 'Volume', value: '150ml / 5.1 fl. oz.' },
      { label: 'Skin Type', value: 'All (including sensitive)' },
      { label: 'Key Ingredients', value: 'Pure Rose Hydrosol, Aloe Vera, Glycerin' },
    ],
    [
      { question: 'Can I spray it over makeup?', answer: 'Yes, it works as a great setting spray or midday refresher!' },
      { question: 'Is it vegan?', answer: 'Absolutely. It is 100% vegan and cruelty-free.' },
    ]
  );

  // ──────── MOCK 3: HOME PRODUCT ────────
  const homeInput = createMockInput('ErgoComfort Foam Cushion Store', '#f0fdf4', '#16a34a');
  const homeGen = createMockGeneration(
    'ErgoComfort Foam Cushion',
    '49.99',
    '69.99',
    [
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800',
      'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800',
      'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800',
    ],
    [
      { title: 'High-Density Memory Foam', description: 'Molds perfectly to your body shape for custom tailbone support.', imageUrl: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=600' },
      { title: 'Breathable Cooling Mesh', description: 'Ventilated structure prevents sweat and keeps you cool all day.', imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600' },
    ],
    [
      { label: 'Material', value: '100% Memory Foam, Breathable Mesh Cover' },
      { label: 'Dimensions', value: '45 x 35 x 7 cm' },
      { label: 'Weight Limit', value: 'Up to 120 kg / 260 lbs' },
    ],
    [
      { question: 'Is the cover washable?', answer: 'Yes, the zippered cover can be removed and machine washed.' },
      { question: 'Does it slide on chairs?', answer: 'No, it features a non-slip rubber bottom to keep it secure.' },
    ]
  );

  // Generate & Validate for each
  const testCases = [
    { name: 'Electronics', input: electronicsInput, gen: electronicsGen, zipName: 'rootx-shopify-theme-electronics.zip' },
    { name: 'Beauty', input: beautyInput, gen: beautyGen, zipName: 'rootx-shopify-theme-beauty.zip' },
    { name: 'Home', input: homeInput, gen: homeGen, zipName: 'rootx-shopify-theme-home.zip' },
  ];

  let totalErrors = 0;

  for (const tc of testCases) {
    const files = generateShopifyTheme(tc.gen, tc.input);
    const errors = validateTheme(files, tc.name);

    if (errors.length > 0) {
      console.error(`❌ Validation FAILED for ${tc.name}:`);
      for (const err of errors) {
        console.error(`   - ${err}`);
      }
      totalErrors += errors.length;
    } else {
      console.log(`✅ Validation PASSED for ${tc.name}!`);

      // Package into ZIP
      const zip = new JSZip();
      for (const f of files) {
        zip.file(f.key, f.value);
      }
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      const outputPath = path.join(scratchDir, tc.zipName);
      fs.writeFileSync(outputPath, zipBuffer);
      console.log(`📦 Saved ZIP to: ${outputPath} (${zipBuffer.byteLength} bytes)`);
    }
    console.log('-'.repeat(50));
  }

  if (totalErrors > 0) {
    console.error(`\n❌ Script finished with ${totalErrors} errors.`);
    process.exit(1);
  } else {
    console.log('\n🎉 All theme exports generated and validated successfully!');
    process.exit(0);
  }
}

run();
