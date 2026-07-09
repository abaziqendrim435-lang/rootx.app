import { NextRequest, NextResponse } from 'next/server';
import type {
  ProductAnalysis,
  DropshippingInput,
  WebsiteGeneration,
  AIProvider,
  PreferredStyle,
} from '@/lib/website-builder-types';

// ============================================================
// POST /api/agents/dropshipping-store
// Generates: Complete e-commerce storefront from product analysis
//
// SETUP: Add one of these keys to .env.local:
//   OPENAI_API_KEY=sk-...
//   ANTHROPIC_API_KEY=sk-ant-...
//   GEMINI_API_KEY=AI...
//
// Without a key, this route returns a rich mock response so
// the UI is fully functional for demos.
// ============================================================

export interface DropshippingStoreRequest {
  analysis: ProductAnalysis;
  input: DropshippingInput;
  provider?: AIProvider;
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Strip markdown code fences (```json ... ```) that AI models sometimes
 * wrap around their JSON output, then parse into an object.
 */
function parseJsonSafe(raw: string): Record<string, unknown> {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  return JSON.parse(cleaned);
}

/**
 * Translate an OpenAI HTTP error status code into a human-readable message.
 */
function friendlyOpenAIError(status: number, body: string): string {
  if (status === 401) return 'OpenAI API key is invalid or missing. Check your OPENAI_API_KEY in .env.local.';
  if (status === 429) return 'OpenAI rate limit or quota exceeded. Check your usage at platform.openai.com.';
  if (status === 500 || status === 503) return 'OpenAI service is temporarily unavailable. Please try again shortly.';
  return `OpenAI error ${status}: ${body}`;
}

/**
 * Translate a Claude HTTP error status code into a human-readable message.
 */
function friendlyClaudeError(status: number, body: string): string {
  if (status === 401) return 'Anthropic API key is invalid or missing. Check your ANTHROPIC_API_KEY in .env.local.';
  if (status === 429) return 'Anthropic rate limit or quota exceeded. Check your usage at console.anthropic.com.';
  if (status === 500 || status === 503) return 'Anthropic service is temporarily unavailable. Please try again shortly.';
  return `Anthropic error ${status}: ${body}`;
}

/**
 * Translate a Gemini HTTP error status code into a human-readable message.
 */
function friendlyGeminiError(status: number, body: string): string {
  if (status === 401 || status === 403) return 'Gemini API key is invalid or missing. Check your GEMINI_API_KEY in .env.local.';
  if (status === 429) return 'Gemini rate limit or quota exceeded. Check your usage at aistudio.google.com.';
  if (status === 500 || status === 503) return 'Gemini service is temporarily unavailable. Please try again shortly.';
  return `Gemini error ${status}: ${body}`;
}

// ── Shared prompt ───────────────────────────────────────────

function buildDropshippingPrompt(analysis: ProductAnalysis, input: DropshippingInput): string {
  return `You are an expert e-commerce copywriter and conversion specialist. Generate a complete, high-converting product storefront for a dropshipping store.

Store Name: ${input.storeName}
Product: ${analysis.productTitle}
Product Description: ${analysis.productDescription}
Features: ${analysis.features.join(', ')}
Selling Points: ${analysis.sellingPoints.join(', ')}
Target Audience: ${analysis.targetAudience}
Category: ${analysis.category}
Price Range: ${analysis.priceRange}
Shipping: ${analysis.shippingInfo}
Preferred Style: ${input.preferredStyle}
Primary Color: ${input.primaryColor}
Secondary Color: ${input.secondaryColor}
Language: ${input.language || 'English'}
Country: ${input.country || 'US'}

Generate a JSON response with exactly this structure:
{
  "homepage": {
    "hero": {
      "headline": "A product-focused headline like 'Discover [Product]' — benefit-driven (8-12 words)",
      "subheadline": "A supporting subheadline emphasizing the product's key value proposition (20-30 words)",
      "ctaButtons": [
        { "label": "Buy Now", "url": "#buy-now", "variant": "primary" },
        { "label": "Learn More", "url": "#learn-more", "variant": "secondary" }
      ],
      "backgroundStyle": "Description of the ideal hero background (gradient, image style, etc.)"
    },
    "features": [
      { "title": "Product benefit name", "description": "2-3 sentence benefit-focused description using the product's features and selling points", "icon": "lucide icon name" }
    ],
    "socialProof": "Join thousands of satisfied customers — a compelling social proof statement without fake numbers"
  },
  "about": {
    "title": "About page title — the store story",
    "content": "3-4 paragraph about section telling why this product exists, the brand behind it, and the mission",
    "mission": "Store mission statement centered on the product and customer benefit",
    "vision": "Store vision statement",
    "values": ["Value 1", "Value 2", "Value 3", "Value 4", "Value 5"]
  },
  "services": {
    "title": "Why Choose Us",
    "subtitle": "Why Choose Us section subtitle",
    "services": [
      {
        "title": "Reason name (e.g. Quality Guarantee, Fast Shipping, Easy Returns, Customer Support)",
        "description": "Description of why customers should choose this store (2-3 sentences)",
        "icon": "lucide icon name",
        "features": ["Detail 1", "Detail 2", "Detail 3", "Detail 4"]
      }
    ]
  },
  "pricing": {
    "title": "Pricing section title",
    "subtitle": "Pricing section subtitle",
    "plans": [
      {
        "name": "Plan name (e.g. Single, Bundle 2-Pack, Family Pack 5-Pack)",
        "price": "$XX",
        "period": "/unit or /pack",
        "description": "One-line plan description",
        "features": ["What's included 1", "What's included 2", "What's included 3", "What's included 4", "What's included 5"],
        "cta": "CTA button text",
        "isPopular": false
      }
    ]
  },
  "faq": {
    "title": "FAQ section title",
    "subtitle": "FAQ section subtitle",
    "items": [
      { "question": "Product-specific question (shipping times, returns, sizing, materials, warranty)?", "answer": "Detailed, helpful answer (2-3 sentences)" }
    ]
  },
  "testimonials": {
    "title": "Testimonials section title",
    "subtitle": "Testimonials section subtitle",
    "testimonials": [
      { "name": "Full Name", "role": "Customer type", "company": "Location or context", "quote": "Detailed testimonial quote (2-3 sentences). MUST end with: (Example — replace with verified review)", "rating": 5 }
    ]
  },
  "contact": {
    "title": "Customer Support contact title",
    "subtitle": "Customer Support contact subtitle",
    "email": "support@example.com",
    "phone": "+1 (555) 000-0000",
    "address": "Full business address",
    "formFields": [
      { "label": "Field label", "type": "text|email|textarea|tel", "placeholder": "Placeholder text", "required": true }
    ]
  },
  "footer": {
    "columns": [
      { "title": "Column title (Shop, Support, Policies, About)", "links": [{ "label": "Link text", "url": "/page" }] }
    ],
    "copyright": "© 2026 Store Name. All rights reserved.",
    "socialLinks": [
      { "platform": "Platform name", "url": "https://...", "icon": "lucide icon name" }
    ],
    "tagline": "A memorable store tagline"
  },
  "seo": {
    "title": "SEO-optimized page title with product long-tail keywords (50-60 chars)",
    "metaDescription": "Compelling product meta description (150-160 chars)",
    "keywords": ["long-tail keyword 1", "long-tail keyword 2", "..."],
    "ogTitle": "Open Graph title",
    "ogDescription": "Open Graph description",
    "ogImagePrompt": "AI image generation prompt for the product OG image",
    "canonicalUrl": "https://www.example.com",
    "structuredData": "JSON-LD structured data as a string (Product schema)"
  },
  "branding": {
    "colorPalette": [
      { "name": "Color name", "hex": "#hexcode", "usage": "When/where to use this color" }
    ],
    "typography": {
      "heading": "Heading font family",
      "body": "Body font family",
      "accent": "Accent font family",
      "googleFontsUrl": "Google Fonts import URL"
    },
    "iconSuggestions": [
      { "name": "Icon name", "usage": "Where to use it", "emoji": "Relevant emoji" }
    ],
    "logoDescription": "Detailed description of the ideal store logo design"
  },
  "marketing": {
    "googleAdsHeadlines": ["Product-specific headline 1 (30 chars max)", "Headline 2", "Headline 3", "Headline 4", "Headline 5"],
    "googleAdsDescriptions": ["Product ad description 1 (90 chars max)", "Description 2", "Description 3"],
    "facebookAdCopy": "Full Facebook ad copy with product hook, benefits, and CTA",
    "instagramCaption": "Engaging Instagram caption with product emojis and hashtags",
    "linkedInPost": "Professional LinkedIn post about the product",
    "twitterPost": "Concise Twitter/X post about the product (280 chars max)",
    "emailCampaign": {
      "subject": "Product email subject line",
      "preheader": "Product email preheader text",
      "body": "Full product launch email body content",
      "cta": "Email CTA button text"
    }
  }
}

Requirements:
- Generate 6 product benefit features for the homepage using the provided features and selling points
- Generate 4 "Why Choose Us" items with 4 features each (Quality Guarantee, Fast Shipping, Easy Returns, Customer Support)
- Generate 3 pricing tiers (Single, Bundle, Value Pack) using the analysis price range ${analysis.priceRange}
- Generate 8 product-specific FAQ items covering shipping times, returns, sizing, materials, warranty
- Generate 4 placeholder testimonials — each testimonial quote MUST end with " (Example — replace with verified review)"
- Generate 4 contact form fields
- Generate 4 footer columns (Shop, Support, Policies, About)
- Generate 8 product-specific SEO keywords (long-tail)
- Generate 6 color palette entries using the provided primary (${input.primaryColor}) and secondary (${input.secondaryColor}) colors
- Generate 6 icon suggestions relevant to the product
- Generate 5 Google Ads headlines and 3 descriptions for the product
- All content must be tailored to the ${analysis.category} category and ${analysis.targetAudience} audience
- Use the ${input.preferredStyle} style tone throughout
- Content should be in ${input.language || 'English'}
- Do NOT fabricate sales numbers, ratings, or unverified claims
- Respond ONLY with valid JSON. No markdown, no backticks.`;
}

// ── OpenAI call ─────────────────────────────────────────────

async function generateWithOpenAI(
  analysis: ProductAnalysis,
  input: DropshippingInput,
  apiKey: string
): Promise<WebsiteGeneration> {
  const prompt = buildDropshippingPrompt(analysis, input);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(friendlyOpenAIError(response.status, errBody));
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content ?? '{}';

  try {
    const parsed = parseJsonSafe(raw);
    return { ...parsed, isDemo: false, provider: 'openai' } as WebsiteGeneration;
  } catch {
    throw new Error('OpenAI returned an unexpected response format. Please try again.');
  }
}

// ── Claude call ─────────────────────────────────────────────

async function generateWithClaude(
  analysis: ProductAnalysis,
  input: DropshippingInput,
  apiKey: string
): Promise<WebsiteGeneration> {
  const prompt = buildDropshippingPrompt(analysis, input);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(friendlyClaudeError(response.status, errBody));
  }

  const data = await response.json();
  const raw = data.content?.[0]?.text ?? '{}';

  try {
    const parsed = parseJsonSafe(raw);
    return { ...parsed, isDemo: false, provider: 'claude' } as WebsiteGeneration;
  } catch {
    throw new Error('Claude returned an unexpected response format. Please try again.');
  }
}

// ── Gemini call ─────────────────────────────────────────────

async function generateWithGemini(
  analysis: ProductAnalysis,
  input: DropshippingInput,
  apiKey: string
): Promise<WebsiteGeneration> {
  const prompt = buildDropshippingPrompt(analysis, input);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 4000,
        },
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(friendlyGeminiError(response.status, errBody));
  }

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

  try {
    const parsed = parseJsonSafe(raw);
    return { ...parsed, isDemo: false, provider: 'gemini' } as WebsiteGeneration;
  } catch {
    throw new Error('Gemini returned an unexpected response format. Please try again.');
  }
}

// ── Mock response (no API key needed) ──────────────────────

function getMockDropshippingResponse(analysis: ProductAnalysis, input: DropshippingInput): WebsiteGeneration {
  const store = input.storeName || 'Premium Store';
  const product = analysis.productTitle || 'Premium Product';
  const description = analysis.productDescription || 'A high-quality product designed for everyday use.';
  const features = analysis.features.length > 0 ? analysis.features : ['Durable construction', 'Lightweight design', 'Easy to use', 'Premium materials', 'Modern aesthetic', 'Multi-purpose'];
  const sellingPoints = analysis.sellingPoints.length > 0 ? analysis.sellingPoints : ['Best-in-class quality', 'Affordable pricing', 'Fast delivery'];
  const audience = analysis.targetAudience || 'online shoppers';
  const category = analysis.category || 'general';
  const priceRange = analysis.priceRange || '$29.99 - $49.99';
  const shippingInfo = analysis.shippingInfo || 'Standard shipping 7-14 business days';
  const primary = input.primaryColor || '#dc2626';
  const secondary = input.secondaryColor || '#1e40af';
  const style = input.preferredStyle || 'modern';
  const lang = input.language || 'English';
  const country = input.country || 'US';
  const slug = store.toLowerCase().replace(/\s+/g, '-');

  return {
    homepage: {
      hero: {
        headline: `Discover the ${product} — Elevate Your Everyday Experience`,
        subheadline: `${sellingPoints[0]}. ${description} Perfect for ${audience} who demand quality without compromise.`,
        ctaButtons: [
          { label: 'Buy Now', url: '#buy-now', variant: 'primary' },
          { label: 'Learn More', url: '#learn-more', variant: 'secondary' },
        ],
        backgroundStyle: `${style} gradient from ${primary} to deep charcoal with a subtle product silhouette overlay and floating particle animation`,
      },
      features: [
        { title: features[0] || 'Premium Quality', description: `Every ${product} is crafted with meticulous attention to detail. ${sellingPoints[0] || 'Built to last'}, ensuring you get the best value for your investment. Experience the difference quality makes.`, icon: 'Star' },
        { title: features[1] || 'Thoughtful Design', description: `Designed with ${audience} in mind, the ${product} combines form and function seamlessly. Every element serves a purpose, delivering an intuitive experience from the moment you unbox it.`, icon: 'Gem' },
        { title: features[2] || 'Easy to Use', description: `No complicated setup or steep learning curve. The ${product} is ready to use right out of the box. Straightforward design means you spend less time figuring things out and more time enjoying the product.`, icon: 'CheckCircle' },
        { title: features[3] || 'Built to Last', description: `Made from premium-grade materials that withstand daily wear and tear. The ${product} is engineered for longevity, so you can count on it for years to come without compromise.`, icon: 'Shield' },
        { title: features[4] || 'Versatile & Adaptive', description: `Whether at home, at work, or on the go, the ${product} adapts to your lifestyle. Its versatile design makes it the perfect companion for any situation you encounter.`, icon: 'Repeat' },
        { title: features[5] || 'Satisfaction Guaranteed', description: `We stand behind every ${product} we sell. If you're not completely satisfied, our hassle-free return policy ensures you can shop with total confidence and peace of mind.`, icon: 'ThumbsUp' },
      ],
      socialProof: `Join thousands of satisfied customers who have made the ${product} part of their daily routine`,
    },
    about: {
      title: `About ${store}`,
      content: `${store} was born from a simple belief: everyone deserves access to high-quality products at fair prices. We started our journey by discovering the ${product} — a product that truly delivers on its promises — and knew we had to share it with the world.\n\nOur team carefully vets every product we offer, testing for quality, durability, and real-world performance. The ${product} passed every test with flying colors, and the feedback from our early customers confirmed what we already knew — this is something special.\n\nAt ${store}, we're not just another online store. We're a curated destination for ${audience} who value quality, transparency, and exceptional service. Every order is handled with care, and every customer is treated like family.\n\nBased in ${country}, we've built a reputation for reliability and trust. Our commitment to customer satisfaction isn't just a tagline — it's the foundation of everything we do.`,
      mission: `To bring the best ${category} products to ${audience} worldwide, combining quality craftsmanship with accessible pricing and outstanding customer service.`,
      vision: `A world where every ${audience.replace(/s$/, '')} has access to premium products without premium price tags.`,
      values: [
        'Quality First — We never compromise on product quality',
        'Customer Obsession — Your satisfaction drives every decision we make',
        'Transparency — Honest descriptions, real photos, no hidden fees',
        'Reliability — Fast shipping and consistent service you can count on',
        'Community — Building lasting relationships with our customers',
      ],
    },
    services: {
      title: 'Why Choose Us',
      subtitle: `Everything you need for a confident, worry-free shopping experience`,
      services: [
        {
          title: 'Quality Guarantee',
          description: `Every ${product} undergoes rigorous quality inspection before shipping. We partner directly with trusted manufacturers to ensure you receive only the best. If it doesn't meet our standards, it doesn't reach your door.`,
          icon: 'BadgeCheck',
          features: ['Multi-point quality inspection', 'Direct manufacturer partnerships', 'Authentic product guarantee', 'Defect-free promise'],
        },
        {
          title: 'Fast & Reliable Shipping',
          description: `We know you're excited about your ${product}. That's why we've optimized our fulfillment process to get your order to you as quickly as possible. ${shippingInfo}. Tracking included with every order.`,
          icon: 'Truck',
          features: ['Order tracking on every shipment', 'Secure packaging to prevent damage', 'Multiple shipping speed options', 'International delivery available'],
        },
        {
          title: 'Easy Returns & Exchanges',
          description: `Not 100% satisfied? No problem. Our hassle-free return policy makes it easy to return or exchange your ${product}. No complicated forms, no restocking fees — just straightforward customer care.`,
          icon: 'RotateCcw',
          features: ['30-day return window', 'No restocking fees', 'Simple return process', 'Fast refund processing'],
        },
        {
          title: 'Dedicated Customer Support',
          description: `Have a question about the ${product}? Need help with your order? Our friendly support team is ready to assist you. We respond quickly and go above and beyond to resolve any issue.`,
          icon: 'Headphones',
          features: ['Email & live chat support', 'Quick response times', 'Order modification assistance', 'Post-purchase care'],
        },
      ],
    },
    pricing: {
      title: 'Choose Your Package',
      subtitle: `Save more when you buy more — all packages include free shipping on qualifying orders`,
      plans: [
        {
          name: 'Single',
          price: priceRange.split('-')[0]?.trim().split(' ')[0] || '$29.99',
          period: '/unit',
          description: `Try the ${product} — perfect for first-time buyers`,
          features: [
            `1x ${product}`,
            'Standard shipping included',
            '30-day return policy',
            'Quality guarantee',
            'Order tracking',
          ],
          cta: 'Buy Now',
          isPopular: false,
        },
        {
          name: 'Bundle (2-Pack)',
          price: '$' + (parseFloat((priceRange.split('-')[0]?.trim().split(' ')[0] || '$29.99').replace('$', '')) * 1.8).toFixed(2),
          period: '/pack',
          description: `Our most popular option — one for you, one to share`,
          features: [
            `2x ${product}`,
            'Save 10% per unit',
            'Priority shipping',
            '30-day return policy',
            'Quality guarantee',
            'Order tracking',
            'Gift-ready packaging',
          ],
          cta: 'Best Value — Buy Now',
          isPopular: true,
        },
        {
          name: 'Family Pack (5-Pack)',
          price: '$' + (parseFloat((priceRange.split('-')[0]?.trim().split(' ')[0] || '$29.99').replace('$', '')) * 4).toFixed(2),
          period: '/pack',
          description: `Maximum savings for the whole family or team`,
          features: [
            `5x ${product}`,
            'Save 20% per unit',
            'Express shipping included',
            '30-day return policy',
            'Quality guarantee',
            'Order tracking',
            'Gift-ready packaging',
            'Priority customer support',
          ],
          cta: 'Buy Family Pack',
          isPopular: false,
        },
      ],
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: `Everything you need to know about the ${product}`,
      items: [
        { question: `How long does shipping take for the ${product}?`, answer: `${shippingInfo}. Once your order is placed, you'll receive a confirmation email with tracking information so you can monitor your delivery every step of the way.` },
        { question: 'What is your return policy?', answer: `We offer a 30-day hassle-free return policy. If you're not completely satisfied with your ${product}, simply contact our support team and we'll arrange a return or exchange — no questions asked.` },
        { question: `What materials is the ${product} made from?`, answer: `The ${product} is crafted from premium-grade materials selected for durability and performance. ${features[0] || 'High-quality construction'} ensures this product stands up to everyday use while maintaining its appearance.` },
        { question: 'Is the product exactly as shown in the photos?', answer: `Yes! We use real product photos and accurate descriptions. While slight color variations may occur due to monitor settings, the ${product} you receive will match our listings. We believe in complete transparency.` },
        { question: 'Do you offer a warranty?', answer: `Yes, every ${product} comes with a satisfaction guarantee. If your product arrives damaged or defective, we'll replace it at no additional cost. Our quality guarantee covers manufacturing defects for 90 days after purchase.` },
        { question: `How do I choose the right ${product} for my needs?`, answer: `The ${product} is designed to be versatile and suitable for most ${audience}. If you have specific questions about sizing, compatibility, or features, our customer support team is happy to help you make the right choice.` },
        { question: 'Can I track my order?', answer: `Absolutely! Once your order ships, you'll receive an email with a tracking number and link. You can monitor your ${product}'s journey from our warehouse to your doorstep in real time.` },
        { question: 'Do you ship internationally?', answer: `Yes, we ship to most countries worldwide. International shipping times vary by destination, typically ranging from 10-21 business days. Customs duties and import taxes, if applicable, are the responsibility of the buyer.` },
      ],
    },
    testimonials: {
      title: 'What Our Customers Say',
      subtitle: `Real feedback from people who love the ${product}`,
      testimonials: [
        {
          name: 'Alex M.',
          role: 'Verified Buyer',
          company: `${country}`,
          quote: `I was skeptical at first, but the ${product} exceeded all my expectations. The quality is outstanding and it arrived faster than expected. Already ordered one for my friend! (Example — replace with verified review)`,
          rating: 5,
        },
        {
          name: 'Jordan K.',
          role: 'Repeat Customer',
          company: `${country}`,
          quote: `This is my third purchase from ${store} and the ${product} is by far my favorite. ${features[0] || 'Great quality'} and ${features[1] || 'beautiful design'} — exactly as described. Highly recommend! (Example — replace with verified review)`,
          rating: 5,
        },
        {
          name: 'Taylor R.',
          role: 'Verified Buyer',
          company: `${country}`,
          quote: `${sellingPoints[0] || 'Amazing product'}! I bought the Bundle pack and couldn't be happier. The packaging was great, shipping was tracked, and the product quality is top-notch. Will definitely buy again. (Example — replace with verified review)`,
          rating: 5,
        },
        {
          name: 'Casey L.',
          role: 'First-Time Buyer',
          company: `${country}`,
          quote: `I needed a reliable ${category} product and the ${product} delivered. Customer support was responsive when I had a question, and the overall experience was smooth from order to delivery. (Example — replace with verified review)`,
          rating: 5,
        },
      ],
    },
    contact: {
      title: 'Customer Support',
      subtitle: `Have a question about the ${product} or your order? We're here to help — reach out anytime.`,
      email: `support@${slug}.com`,
      phone: '+1 (555) 987-6543',
      address: `${store} Customer Service, ${country}`,
      formFields: [
        { label: 'Full Name', type: 'text', placeholder: 'Your name', required: true },
        { label: 'Email Address', type: 'email', placeholder: 'you@example.com', required: true },
        { label: 'Order Number', type: 'text', placeholder: 'e.g. #ORD-12345 (if applicable)', required: false },
        { label: 'How Can We Help?', type: 'textarea', placeholder: `Describe your question about the ${product}, your order, shipping, returns, etc.`, required: true },
      ],
    },
    footer: {
      columns: [
        {
          title: 'Shop',
          links: [
            { label: product, url: '/products' },
            { label: 'Bundle Deals', url: '/bundles' },
            { label: 'New Arrivals', url: '/new' },
            { label: 'Best Sellers', url: '/best-sellers' },
          ],
        },
        {
          title: 'Support',
          links: [
            { label: 'Contact Us', url: '/contact' },
            { label: 'Order Tracking', url: '/track-order' },
            { label: 'Shipping Info', url: '/shipping' },
            { label: 'FAQ', url: '/faq' },
          ],
        },
        {
          title: 'Policies',
          links: [
            { label: 'Return Policy', url: '/returns' },
            { label: 'Privacy Policy', url: '/privacy' },
            { label: 'Terms of Service', url: '/terms' },
            { label: 'Cookie Policy', url: '/cookies' },
          ],
        },
        {
          title: 'About',
          links: [
            { label: `About ${store}`, url: '/about' },
            { label: 'Our Story', url: '/story' },
            { label: 'Blog', url: '/blog' },
            { label: 'Reviews', url: '/reviews' },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} ${store}. All rights reserved.`,
      socialLinks: [
        { platform: 'Instagram', url: `https://instagram.com/${slug}`, icon: 'Instagram' },
        { platform: 'Facebook', url: `https://facebook.com/${slug}`, icon: 'Facebook' },
        { platform: 'Twitter', url: `https://twitter.com/${slug}`, icon: 'Twitter' },
        { platform: 'TikTok', url: `https://tiktok.com/@${slug}`, icon: 'Music2' },
      ],
      tagline: `${store} — Quality ${category} products delivered to your door.`,
    },
    seo: {
      title: `${product} | ${store} — Premium ${category.charAt(0).toUpperCase() + category.slice(1)} Products`,
      metaDescription: `Shop the ${product} at ${store}. ${sellingPoints[0] || 'Premium quality'}. ${shippingInfo}. 30-day returns. Order yours today!`,
      keywords: [
        `buy ${product.toLowerCase()}`,
        `${product.toLowerCase()} online`,
        `best ${category} products`,
        `${product.toLowerCase()} ${country}`,
        `${category} store online`,
        `${product.toLowerCase()} review`,
        `affordable ${category} products`,
        `${product.toLowerCase()} free shipping`,
      ],
      ogTitle: `${product} — Now Available at ${store}`,
      ogDescription: `Discover the ${product}. ${sellingPoints[0] || 'Premium quality'} at an unbeatable price. Shop now at ${store}!`,
      ogImagePrompt: `A ${style}, high-converting product hero image for the ${product}. Feature the brand colors ${primary} and ${secondary} with clean product photography, subtle gradient background, and bold typography. 1200x630 resolution, suitable for social sharing and e-commerce ads.`,
      canonicalUrl: `https://www.${slug}.com`,
      structuredData: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product,
        description: description,
        brand: { '@type': 'Brand', name: store },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: (priceRange.split('-')[0]?.trim().split(' ')[0] || '$29.99').replace('$', ''),
          availability: 'https://schema.org/InStock',
          seller: { '@type': 'Organization', name: store },
        },
      }),
    },
    branding: {
      colorPalette: [
        { name: 'Primary', hex: primary, usage: 'Buy Now buttons, primary CTAs, price highlights, and brand accents' },
        { name: 'Secondary', hex: secondary, usage: 'Secondary buttons, links, badges, and supporting accents' },
        { name: 'Background', hex: '#0a0a0f', usage: 'Main page background and dark sections' },
        { name: 'Surface', hex: '#141419', usage: 'Product cards, modals, and elevated surfaces' },
        { name: 'Text Primary', hex: '#f8f8f8', usage: 'Product titles, body text, and primary content' },
        { name: 'Text Muted', hex: '#71717a', usage: 'Captions, labels, secondary text, and placeholders' },
      ],
      typography: {
        heading: 'Inter',
        body: 'Inter',
        accent: 'JetBrains Mono',
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap',
      },
      iconSuggestions: [
        { name: 'ShoppingCart', usage: 'Add to cart and checkout buttons', emoji: '🛒' },
        { name: 'Star', usage: 'Product ratings and reviews', emoji: '⭐' },
        { name: 'Truck', usage: 'Shipping information sections', emoji: '🚚' },
        { name: 'Shield', usage: 'Quality guarantee and trust badges', emoji: '🛡️' },
        { name: 'RotateCcw', usage: 'Returns and exchange policy', emoji: '🔄' },
        { name: 'Package', usage: `Bundle deals and ${category} product packaging`, emoji: '📦' },
      ],
      logoDescription: `A ${style} wordmark for "${store}" using the primary color ${primary} as the accent. The logo features clean, modern letterforms with a subtle shopping bag or product icon integrated into the design. The look should feel trustworthy, premium, and conversion-focused — suitable for both dark and light backgrounds at any scale.`,
    },
    marketing: {
      googleAdsHeadlines: [
        `${product} — Shop Now at ${store}`,
        `${sellingPoints[0] || 'Premium Quality'} ${product}`,
        `Free Shipping on ${product}`,
        '30-Day Money Back Guarantee',
        `Best ${category.charAt(0).toUpperCase() + category.slice(1)} Deals Online`,
      ],
      googleAdsDescriptions: [
        `Shop the ${product} at ${store}. ${sellingPoints[0] || 'Premium quality'}. Fast shipping, easy returns. Order today and experience the difference!`,
        `Discover why customers love the ${product}. ${features[0] || 'Premium materials'}, ${features[1] || 'sleek design'}. Save on bundles. Free shipping available.`,
        `${store} brings you the ${product} — ${sellingPoints[0] || 'top quality'} at unbeatable prices. 30-day returns, tracked shipping. Shop now!`,
      ],
      facebookAdCopy: `Still searching for the perfect ${category} product? 🔍\n\nMeet the ${product} — and discover why customers are raving about it.\n\n✅ ${features[0] || 'Premium quality materials'}\n✅ ${features[1] || 'Thoughtful, modern design'}\n✅ ${features[2] || 'Easy to use right out of the box'}\n✅ ${sellingPoints[0] || 'Best-in-class quality'}\n\n🚚 ${shippingInfo}\n🔄 30-day hassle-free returns\n💰 Save more with our bundle deals\n\nJoin thousands of happy customers who have made the switch!\n\n👉 Shop now — link in comments.\n\n#${store.replace(/\s+/g, '')} #${category.replace(/\s+/g, '')} #ShopNow #QualityProducts`,
      instagramCaption: `Your new favorite ${category} product just dropped. ✨\n\nIntroducing the ${product} from ${store}:\n🌟 ${features[0] || 'Premium quality'}\n⚡ ${features[1] || 'Modern design'}\n💪 ${features[2] || 'Built to last'}\n🚚 ${shippingInfo}\n\nBundle up and save — check our link in bio! 🛒\n\n#${store.replace(/\s+/g, '')} #${category.replace(/\s+/g, '')} #OnlineShopping #ProductLaunch #MustHave #ShopOnline #QualityMatters #TrendingProducts`,
      linkedInPost: `Excited to announce that ${store} is now offering the ${product} — a ${category} product that's been getting incredible feedback from our customers.\n\nHere's what sets it apart:\n\n1️⃣ ${features[0] || 'Premium materials'} — we don't cut corners on quality.\n2️⃣ ${sellingPoints[0] || 'Exceptional value'} — quality shouldn't break the bank.\n3️⃣ Customer-first experience — from order to delivery, every touchpoint is designed to delight.\n\nWe're committed to building a brand that ${audience} can trust. Every product is quality-inspected, every order is tracked, and our support team is always ready to help.\n\nIf you're looking for a reliable ${category} product, check out the link in comments.\n\n#Ecommerce #${category.replace(/\s+/g, '')} #ProductLaunch #CustomerExperience`,
      twitterPost: `🛒 The ${product} is here!\n\n${sellingPoints[0] || 'Premium quality'}. ${shippingInfo}. 30-day returns.\n\nShop now → ${slug}.com`,
      emailCampaign: {
        subject: `Your ${product} is waiting — shop now at ${store}`,
        preheader: `Discover why customers love the ${product}. Free shipping on qualifying orders!`,
        body: `Hi there,\n\nWe're excited to introduce you to the ${product} — one of our most popular ${category} products at ${store}.\n\nHere's why customers love it:\n\n• ${features[0] || 'Premium quality materials'}\n• ${features[1] || 'Thoughtful, modern design'}\n• ${features[2] || 'Easy to use right out of the box'}\n• ${sellingPoints[0] || 'Unbeatable value'}\n\nAnd right now, you can save even more with our bundle deals:\n\n🏷️ Single — ${priceRange.split('-')[0]?.trim().split(' ')[0] || '$29.99'}\n🏷️ Bundle (2-Pack) — Save 10% per unit\n🏷️ Family Pack (5-Pack) — Save 20% per unit\n\nEvery order includes tracked shipping and our 30-day hassle-free return guarantee.\n\nDon't miss out — shop the ${product} today!\n\nBest,\nThe ${store} Team`,
        cta: `Shop the ${product} Now →`,
      },
    },
    isDemo: true,
    provider: 'demo',
  };
}

// ── Route handler ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DropshippingStoreRequest;
    const { analysis, input, provider } = body;

    if (!analysis?.productTitle?.trim() || !input?.storeName?.trim()) {
      return NextResponse.json(
        { error: 'analysis.productTitle and input.storeName are required' },
        { status: 400 }
      );
    }

    // Build the full input with defaults
    const sanitizedInput: DropshippingInput = {
      productUrl: input.productUrl || '',
      storeName: input.storeName.trim(),
      preferredStyle: input.preferredStyle || 'modern',
      primaryColor: input.primaryColor?.trim() || '#dc2626',
      secondaryColor: input.secondaryColor?.trim() || '#1e40af',
      language: input.language?.trim() || 'English',
      country: input.country?.trim() || 'US',
    };

    const sanitizedAnalysis: ProductAnalysis = {
      productTitle: analysis.productTitle.trim(),
      productDescription: analysis.productDescription?.trim() || '',
      features: analysis.features || [],
      sellingPoints: analysis.sellingPoints || [],
      targetAudience: analysis.targetAudience?.trim() || 'online shoppers',
      category: analysis.category?.trim() || 'general',
      priceRange: analysis.priceRange?.trim() || '$29.99 - $49.99',
      sourceUrl: analysis.sourceUrl || '',
      images: analysis.images || [],
      shippingInfo: analysis.shippingInfo?.trim() || 'Standard shipping 7-14 business days',
      specifications: analysis.specifications || [],
      warnings: analysis.warnings || [],
      isPlaceholder: analysis.isPlaceholder ?? false,
    };

    // Determine which API key to check based on provider
    const selectedProvider = provider || 'openai';
    const keyMap: Record<AIProvider, string | undefined> = {
      openai: process.env.OPENAI_API_KEY,
      claude: process.env.ANTHROPIC_API_KEY,
      gemini: process.env.GEMINI_API_KEY,
    };

    const apiKey = keyMap[selectedProvider];
    const isPlaceholder =
      !apiKey ||
      apiKey.startsWith('sk-your') ||
      apiKey.startsWith('sk-ant-your') ||
      apiKey === 'YOUR_KEY_HERE';

    // No key → return rich mock
    if (isPlaceholder) {
      console.log('[/api/agents/dropshipping-store] No valid API key found, returning demo response');
      await new Promise((r) => setTimeout(r, 1500));
      return NextResponse.json(getMockDropshippingResponse(sanitizedAnalysis, sanitizedInput));
    }

    // Real AI call
    console.log(`[/api/agents/dropshipping-store] Generating with ${selectedProvider}`);

    let result: WebsiteGeneration;

    switch (selectedProvider) {
      case 'claude':
        result = await generateWithClaude(sanitizedAnalysis, sanitizedInput, apiKey);
        break;
      case 'gemini':
        result = await generateWithGemini(sanitizedAnalysis, sanitizedInput, apiKey);
        break;
      case 'openai':
      default:
        result = await generateWithOpenAI(sanitizedAnalysis, sanitizedInput, apiKey);
        break;
    }

    console.log(`[/api/agents/dropshipping-store] Generation complete via ${selectedProvider}`);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('[/api/agents/dropshipping-store]', message);

    // Distinguish between provider-specific errors (502) and internal errors (500)
    const isProviderError =
      message.includes('OpenAI') ||
      message.includes('Anthropic') ||
      message.includes('Gemini') ||
      message.includes('rate limit') ||
      message.includes('API key') ||
      message.includes('unexpected response') ||
      message.includes('temporarily unavailable');

    return NextResponse.json(
      { error: message },
      { status: isProviderError ? 502 : 500 }
    );
  }
}
