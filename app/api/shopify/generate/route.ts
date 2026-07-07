import { NextRequest, NextResponse } from 'next/server';
import type { AIProductGeneration } from '@/lib/shopify-types';

// ============================================================
// POST /api/shopify/generate
//
// Full AI e-commerce agent powered by OpenAI (gpt-4o-mini).
//
// Analyzes the product image (vision), generates completely
// original copy using AIDA + PAS frameworks, suggests pricing,
// recommends categories, and produces upsell/cross-sell ideas.
//
// Falls back to high-quality mock content when OPENAI_API_KEY
// is not configured.
// ============================================================

// ── Request shape ─────────────────────────────────────────────

interface GenerateRequest {
  productId: number;
  title: string;
  bodyHtml: string | null;
  productType: string;
  tags: string;
  vendor: string;
  /** Shopify CDN image URL for vision analysis */
  imageUrl?: string;
  /** Current price from the first variant */
  currentPrice?: string;
}

// ── Helpers ───────────────────────────────────────────────────

/** Strip markdown fences that GPT sometimes wraps around JSON */
function parseJsonSafe(raw: string): Record<string, unknown> {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  return JSON.parse(cleaned);
}

/** Human-readable OpenAI error messages */
function friendlyOpenAIError(status: number, body: string): string {
  if (status === 401)
    return 'OpenAI API key is invalid or missing. Check your OPENAI_API_KEY in .env.local.';
  if (status === 429)
    return 'OpenAI rate limit or quota exceeded. Check your usage at platform.openai.com.';
  if (status === 500 || status === 503)
    return 'OpenAI service is temporarily unavailable. Please try again shortly.';
  return `OpenAI error ${status}: ${body}`;
}

/** Extract core product noun for creative use */
function extractCoreNoun(title: string): string {
  const words = title
    .replace(/[-—|]/g, ' ')
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 2 &&
        !/^(the|and|for|with|in|by|a|an|or|of|to|is)$/i.test(w)
    );
  return words.slice(-2).join(' ');
}

/** Fetch a product image and convert to base64 data URI for vision API */
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'image/*' },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const buffer = await res.arrayBuffer();
    // Skip images larger than 4MB to stay within API limits
    if (buffer.byteLength > 4 * 1024 * 1024) return null;

    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${base64}`;
  } catch {
    console.warn('[/api/shopify/generate] Failed to fetch product image');
    return null;
  }
}

// ── Mock generator (high-quality, NOT a paraphrase) ───────────

function getMockGeneration(
  title: string,
  productType: string,
  currentPrice: string
): AIProductGeneration {
  const noun = extractCoreNoun(title);
  const year = new Date().getFullYear();
  const season = ['Winter', 'Spring', 'Summer', 'Fall'][
    Math.floor(new Date().getMonth() / 3)
  ];

  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const titleFormulas = [
    `The Ultimate ${noun} — ${season} ${year} Must-Have`,
    `Meet the ${noun} That Changes Everything`,
    `Why Thousands Are Obsessed With This ${noun}`,
    `The ${noun} You Didn't Know You Needed`,
    `${season}'s #1 ${noun} — Rated 5 Stars by Real Customers`,
    `Reimagined: The ${noun} Built for Perfectionists`,
    `Stop Searching — This Is THE ${noun}`,
    `The Last ${noun} You'll Ever Buy`,
  ];

  const hooks = [
    'Stop settling for less.',
    'Your search ends here.',
    'Finally, something worth the upgrade.',
    'This changes everything.',
    'Expect more. Get more.',
    'Built for people who notice the difference.',
  ];
  const urgency = [
    'Selling fast — limited quantities remain.',
    'Join 12,000+ happy customers.',
    'Only a few left at this price.',
    'This batch is almost gone.',
    'Restock not guaranteed — act now.',
  ];
  const ctas = [
    'Add to cart now and feel the difference.',
    'Treat yourself — you\'ve earned it.',
    'Click "Add to Cart" before it\'s gone.',
    'Don\'t wait. Your future self will thank you.',
    'Grab yours now — risk-free with our guarantee.',
  ];

  const seoTitles = [
    `Best ${noun} ${year} — Top Rated ${productType}`,
    `#1 ${noun} of ${year} — Premium ${productType}`,
    `${noun} — Award-Winning ${productType} | Free Shipping`,
    `Top ${noun} ${year} — 5-Star Rated ${productType}`,
  ];
  const seoDescs = [
    `Discover the #1 rated ${noun.toLowerCase()} of ${year}. Premium quality, thousands of 5-star reviews, and free shipping. Limited stock — shop now before it's gone.`,
    `Meet the ${noun.toLowerCase()} that 12,000+ customers swear by. Handcrafted quality, risk-free guarantee, free shipping. Don't miss out — order today.`,
    `The ${noun.toLowerCase()} everyone's talking about. Top-rated ${productType.toLowerCase()}, 30-day returns, and express delivery. Grab yours while supplies last.`,
  ];

  // Price analysis mock
  const price = parseFloat(currentPrice) || 29.99;
  const suggestedPrice = (price * (1 + (Math.random() * 0.3 - 0.1))).toFixed(2);
  const minPrice = (price * 0.7).toFixed(2);
  const maxPrice = (price * 1.5).toFixed(2);

  return {
    title: pick(titleFormulas),
    bodyHtml: [
      `<p><strong>${pick(hooks)}</strong> We designed this ${noun.toLowerCase()} from the ground up for people who refuse to compromise. Every stitch, every curve, every material was chosen with one goal: to make your life genuinely better.</p>`,
      `<p>Here's the problem — most ${productType.toLowerCase()} products look decent in photos but fall apart after a few weeks. You deserve better than disposable quality. That's why we obsessed over durability testing, premium sourcing, and real-world performance before ever listing this product.</p>`,
      `<p>The result? A ${noun.toLowerCase()} that earns five-star reviews on its own. Customers tell us it's the <em>one purchase they don't regret</em>. Whether it's the hand-feel, the longevity, or the way it just <em>works</em> — this is the standard everything else gets measured against.</p>`,
      `<p>🔥 <strong>${pick(urgency)}</strong> Every order ships with free express delivery, a 30-day no-questions-asked return policy, and lifetime customer support. <strong>${pick(ctas)}</strong></p>`,
    ].join('\n'),
    seoTitle: pick(seoTitles),
    seoDescription: pick(seoDescs),
    tags: [
      noun.toLowerCase(),
      productType.toLowerCase(),
      `best ${productType.toLowerCase()} ${year}`,
      'premium quality',
      'top rated',
      'free shipping',
      `${season.toLowerCase()} essentials`,
      'gift idea',
      'trending now',
      'customer favorite',
    ],
    isDemo: true,

    // ── New AI agent fields (mock data) ──────────────────────
    imageAnalysis: {
      description: `Professional product photo of a ${noun.toLowerCase()}. The item is centered on a clean background with balanced lighting highlighting key details and textures.`,
      dominantColors: ['#2D2D2D', '#F5F5F5', '#8B4513', '#C4A882'],
      style: 'studio',
      quality: 'high',
      suggestions: [
        'Consider adding a lifestyle shot showing the product in use',
        'A close-up detail shot would highlight material quality',
        'Adding a scale reference would help customers judge size',
      ],
    },
    priceAnalysis: {
      suggestedPrice,
      currentPrice: currentPrice || '29.99',
      reasoning: `Based on the ${productType.toLowerCase()} market, the current price positions this as a ${price < 25 ? 'budget' : price < 75 ? 'mid-range' : 'premium'} option. A slight price adjustment to $${suggestedPrice} could optimize perceived value while maintaining competitiveness.`,
      priceRange: { min: minPrice, max: maxPrice },
      competitivePosition: price < 25 ? 'budget' : price < 75 ? 'mid-range' : 'premium',
    },
    categorySuggestion: {
      primary: productType || 'General',
      alternatives: [
        `${season} ${productType || 'Accessories'}`,
        `Premium ${productType || 'Goods'}`,
        'Gifts & Specials',
      ],
      reasoning: `This ${noun.toLowerCase()} fits best in the "${productType || 'General'}" category based on its features and target market. Alternative categories could increase discoverability.`,
    },
    upsellCrossSell: {
      upsell: [
        { title: `Premium ${noun} — Deluxe Edition`, reason: 'Higher-end version with upgraded materials for customers willing to spend more', pricePoint: `$${(price * 1.6).toFixed(2)}` },
        { title: `${noun} Pro Bundle`, reason: 'Complete set that includes accessories for a premium all-in-one solution', pricePoint: `$${(price * 2.2).toFixed(2)}` },
      ],
      crossSell: [
        { title: `${noun} Care Kit`, reason: 'Essential maintenance set to extend product lifespan', pricePoint: `$${(price * 0.3).toFixed(2)}` },
        { title: `Matching ${productType || 'Accessory'}`, reason: 'Complementary item that pairs naturally with this purchase', pricePoint: `$${(price * 0.5).toFixed(2)}` },
        { title: `Gift Wrapping & Card`, reason: 'Popular add-on for customers buying as a gift', pricePoint: '$9.99' },
      ],
      bundleIdea: `Create a "${noun} Essentials Kit" combining the main product with the care kit and a matching accessory at a 15% bundle discount. This increases average order value while providing genuine added value.`,
    },
  };
}

// ── OpenAI call ───────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an elite AI e-commerce agent — a fusion of a $500M direct-response copywriter, a Shopify product strategist, a visual merchandiser, and a pricing analyst. You analyze products holistically and produce actionable, revenue-driving outputs.

YOUR RULES:
1. NEVER paraphrase, rephrase, or reword the original product text. Treat it as raw intel only — extract the product category and features, then THROW AWAY the original wording.
2. Every output must be 100% original copy written from scratch using proven frameworks.
3. Use the AIDA framework (Attention → Interest → Desire → Action) for the first half of the product description.
4. Use the PAS framework (Problem → Agitation → Solution) for the second half of the product description.
5. Write in second person ("you/your") with short, punchy sentences. Mix in power words: "transform", "effortless", "revolutionary", "obsessed", "guarantee".
6. The title must be a COMPLETELY NEW creative title — not the original title with adjectives bolted on.
7. Include a specific, urgent CTA with a reason to act NOW.
8. Every generation must feel fresh and unique — vary your sentence structures, hooks, and emotional angles.
9. Use HTML formatting: <strong>, <em>, and <p> tags. No markdown.
10. Think like a conversion optimizer: every word must earn its place.
11. If a product image is provided, analyze it visually — describe what you see, identify colors, style, and quality. Give actionable photo improvement tips.
12. When suggesting a price, consider the product category, brand positioning, perceived quality from the image, and market dynamics. Always provide reasoning.
13. Category suggestions should be specific and actionable Shopify product types.
14. Upsell items should be higher-value alternatives. Cross-sell items should be complementary products.`;

async function generateWithOpenAI(
  reqBody: GenerateRequest,
  apiKey: string
): Promise<AIProductGeneration> {
  const { title, bodyHtml, productType, tags, vendor, currentPrice } = reqBody;

  // Strip HTML tags from description for cleaner context
  const plainDesc = (bodyHtml ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Try to fetch and encode the product image for vision analysis
  let imageBase64: string | null = null;
  if (reqBody.imageUrl) {
    imageBase64 = await fetchImageAsBase64(reqBody.imageUrl);
  }

  const userPrompt = `PRODUCT INTEL (use as raw data only — DO NOT copy or paraphrase any of this text):
- Category: ${productType || 'General'}
- Current name: "${title}"
- Current description: "${plainDesc || 'None provided'}"
- Current tags: ${tags || 'None'}
- Brand: ${vendor || 'Unknown'}
- Current price: ${currentPrice ? '$' + currentPrice : 'Not specified'}
${imageBase64 ? '- Product image: [attached below for visual analysis]' : '- Product image: Not available'}

YOUR TASK: Perform a complete AI e-commerce analysis and generate all outputs below.

Respond with a JSON object containing exactly these fields:

{
  "title": "A completely NEW product title (55-75 chars). Do NOT reuse the original title. Create something fresh that makes people stop scrolling. Use power words, a key benefit, and the product category. Examples: 'The [Adjective] [Product] That [Bold Claim]' or '[Bold Claim] — [Product] Reimagined'.",

  "bodyHtml": "4-5 paragraphs of HTML (<p> tags). FIRST HALF = AIDA framework: Para 1 = Attention (bold hook that stops the scroll). Para 2 = Interest (introduce unique features, weave in 3-4 benefits naturally). SECOND HALF = PAS framework: Para 3 = Problem (identify the pain point your customer faces). Para 4 = Agitation + Solution (amplify the pain, then present this product as THE answer with social proof). Para 5 = Action (urgent CTA + risk reversal: limited stock, money-back guarantee, free shipping). Total: 250-400 words. Use <strong> and <em> for emphasis. Include 1-2 emoji for visual breaks.",

  "seoTitle": "SEO meta title under 60 characters. Include primary keyword + year + compelling modifier (e.g., 'Best', '#1 Rated', 'Top'). Do NOT copy the product title.",

  "seoDescription": "SEO meta description under 155 characters. Must include: primary keyword, unique value proposition, and urgency-driven CTA. Write like a Google ad that demands clicks.",

  "tags": ["10-14 lowercase tags. Mix of: primary keyword, long-tail search terms, audience segments (e.g., 'gifts for him'), seasonal terms, trending modifiers, benefit-driven phrases. NO generic tags like 'product' or 'item'."],

  "imageAnalysis": ${imageBase64 ? `{
    "description": "Describe what you see in the product image in 2-3 sentences. Be specific about the product appearance, materials, composition, and setting.",
    "dominantColors": ["4-6 hex color codes of the dominant colors in the image"],
    "style": "One of: 'studio', 'lifestyle', 'flat-lay', 'on-model', 'outdoor', 'macro', 'user-generated', 'minimal'",
    "quality": "One of: 'high', 'medium', 'low' — based on lighting, resolution, composition, and professionalism",
    "suggestions": ["3-4 specific, actionable tips to improve the product photography or listing images"]
  }` : 'null'},

  "priceAnalysis": {
    "suggestedPrice": "Your recommended optimal price as a string (e.g., '34.99'). Consider the product category, brand positioning, perceived quality${imageBase64 ? ' from the image' : ''}, and typical market ranges.",
    "currentPrice": "${currentPrice || '0.00'}",
    "reasoning": "2-3 sentences explaining WHY you suggest this price. Reference category benchmarks, perceived value, and positioning strategy.",
    "priceRange": { "min": "low end of reasonable range", "max": "high end of reasonable range" },
    "competitivePosition": "One of: 'premium', 'mid-range', 'budget'"
  },

  "categorySuggestion": {
    "primary": "The single best Shopify product_type for this product (e.g., 'Leather Goods', 'Sleep Accessories', 'Running Shoes'). Be specific, not generic.",
    "alternatives": ["2-3 other valid product categories this could fit in"],
    "reasoning": "1-2 sentences on why this category fits best"
  },

  "upsellCrossSell": {
    "upsell": [
      { "title": "Higher-value product name", "reason": "Why this is a good upsell", "pricePoint": "$XX.XX" },
      { "title": "Another upsell option", "reason": "Why this is a good upsell", "pricePoint": "$XX.XX" }
    ],
    "crossSell": [
      { "title": "Complementary product 1", "reason": "Why it pairs well", "pricePoint": "$XX.XX" },
      { "title": "Complementary product 2", "reason": "Why it pairs well", "pricePoint": "$XX.XX" },
      { "title": "Complementary product 3", "reason": "Why it pairs well", "pricePoint": "$XX.XX" }
    ],
    "bundleIdea": "A specific bundle concept combining the main product with 1-2 cross-sells, including a suggested discount percentage and the value proposition."
  }
}

CRITICAL: Output ONLY valid JSON. No markdown fences, no commentary, no extra text.
CRITICAL: Generate FRESH copy — if this prompt is repeated, produce a DIFFERENT result each time.
CRITICAL: All prices should be realistic numbers as strings (e.g., "29.99"), not placeholder text.`;

  // Build the message content — text + optional image
  const userContent: Array<{ type: string; text?: string; image_url?: { url: string; detail?: string } }> = [
    { type: 'text', text: userPrompt },
  ];
  if (imageBase64) {
    userContent.push({
      type: 'image_url',
      image_url: { url: imageBase64, detail: 'low' }, // 'low' detail to save tokens
    });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 1.0,
      max_tokens: 3500,
      top_p: 0.95,
      frequency_penalty: 0.4,
      presence_penalty: 0.5,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(friendlyOpenAIError(response.status, errBody));
  }

  const data = await response.json();
  const raw: string = data.choices?.[0]?.message?.content ?? '{}';

  try {
    const parsed = parseJsonSafe(raw);

    // Validate core required fields
    const coreFields = ['title', 'bodyHtml', 'seoTitle', 'seoDescription', 'tags'];
    for (const field of coreFields) {
      if (!parsed[field]) {
        throw new Error(`Missing field: ${field}`);
      }
    }

    // Parse image analysis (may be null)
    let imageAnalysis = null;
    if (parsed.imageAnalysis && typeof parsed.imageAnalysis === 'object') {
      const ia = parsed.imageAnalysis as Record<string, unknown>;
      imageAnalysis = {
        description: String(ia.description || ''),
        dominantColors: Array.isArray(ia.dominantColors)
          ? (ia.dominantColors as string[]).map(String)
          : [],
        style: String(ia.style || 'studio'),
        quality: (['high', 'medium', 'low'].includes(String(ia.quality))
          ? String(ia.quality)
          : 'medium') as 'high' | 'medium' | 'low',
        suggestions: Array.isArray(ia.suggestions)
          ? (ia.suggestions as string[]).map(String)
          : [],
      };
    }

    // Parse price analysis
    let priceAnalysis = null;
    if (parsed.priceAnalysis && typeof parsed.priceAnalysis === 'object') {
      const pa = parsed.priceAnalysis as Record<string, unknown>;
      const priceRange = (pa.priceRange || {}) as Record<string, unknown>;
      priceAnalysis = {
        suggestedPrice: String(pa.suggestedPrice || '0.00'),
        currentPrice: String(pa.currentPrice || currentPrice || '0.00'),
        reasoning: String(pa.reasoning || ''),
        priceRange: {
          min: String(priceRange.min || '0.00'),
          max: String(priceRange.max || '0.00'),
        },
        competitivePosition: (['premium', 'mid-range', 'budget'].includes(String(pa.competitivePosition))
          ? String(pa.competitivePosition)
          : 'mid-range') as 'premium' | 'mid-range' | 'budget',
      };
    }

    // Parse category suggestion
    const cs = (parsed.categorySuggestion || {}) as Record<string, unknown>;
    const categorySuggestion = {
      primary: String(cs.primary || productType || 'General'),
      alternatives: Array.isArray(cs.alternatives)
        ? (cs.alternatives as string[]).map(String)
        : [],
      reasoning: String(cs.reasoning || ''),
    };

    // Parse upsell/cross-sell
    const ucs = (parsed.upsellCrossSell || {}) as Record<string, unknown>;
    const parseSuggestions = (arr: unknown) =>
      Array.isArray(arr)
        ? arr.map((item: Record<string, unknown>) => ({
            title: String(item?.title || ''),
            reason: String(item?.reason || ''),
            pricePoint: String(item?.pricePoint || ''),
          }))
        : [];

    const upsellCrossSell = {
      upsell: parseSuggestions(ucs.upsell),
      crossSell: parseSuggestions(ucs.crossSell),
      bundleIdea: String(ucs.bundleIdea || ''),
    };

    return {
      title: String(parsed.title),
      bodyHtml: String(parsed.bodyHtml),
      seoTitle: String(parsed.seoTitle),
      seoDescription: String(parsed.seoDescription),
      tags: Array.isArray(parsed.tags)
        ? (parsed.tags as string[]).map(String)
        : String(parsed.tags)
            .split(',')
            .map((t) => t.trim()),
      isDemo: false,
      imageAnalysis,
      priceAnalysis,
      categorySuggestion,
      upsellCrossSell,
    };
  } catch (parseErr) {
    console.error(
      '[/api/shopify/generate] Parse error:',
      parseErr,
      '\nRaw:',
      raw.slice(0, 500)
    );
    throw new Error(
      'OpenAI returned an unexpected response format. Please try again.'
    );
  }
}

// ── Route handler ─────────────────────────────────────────────

/**
 * @description Full AI e-commerce agent: generates product copy,
 * analyzes images, suggests pricing, recommends categories,
 * and produces upsell/cross-sell ideas.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateRequest;

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'title is required.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // No key or placeholder → return high-quality mock
    if (!apiKey || apiKey.startsWith('sk-your') || apiKey === 'YOUR_KEY_HERE') {
      await new Promise((r) => setTimeout(r, 1200));
      return NextResponse.json<AIProductGeneration>(
        getMockGeneration(
          body.title,
          body.productType || 'Product',
          body.currentPrice || '29.99'
        )
      );
    }

    // Real OpenAI call
    const result = await generateWithOpenAI(body, apiKey);
    return NextResponse.json<AIProductGeneration>(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/shopify/generate]', message);

    const isOpenAIError =
      message.includes('OpenAI') ||
      message.includes('rate limit') ||
      message.includes('API key') ||
      message.includes('unexpected response');

    return NextResponse.json(
      { error: message },
      { status: isOpenAIError ? 502 : 500 }
    );
  }
}
