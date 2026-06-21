import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// POST /api/agents/shopify
// Generates: Product Title, SEO Description, Price Suggestion,
//            TikTok Ad Copy, 10 Product Benefits, Marketing Angles
//
// SETUP: Requires OPENAI_API_KEY in .env.local
// Without a key, returns a rich mock response for demos.
// ============================================================

export interface ShopifyRequest {
  productName: string;
  productCategory: string;
  targetAudience: string;
  productFeatures: string;
}

export interface ShopifyResponse {
  productTitle: string;
  seoDescription: string;
  priceSuggestion: string;
  tiktokAdCopy: string;
  productBenefits: string[];
  marketingAngles: string[];
  isDemo: boolean;
}

// ── Mock response ────────────────────────────────────────────
function getMockResponse(
  productName: string,
  productCategory: string,
  targetAudience: string,
  productFeatures: string
): ShopifyResponse {
  const slug = productName.replace(/\s+/g, '');
  return {
    productTitle: `${productName} — Premium ${productCategory} for ${targetAudience} | Free Shipping`,

    seoDescription: `Discover the ${productName}, the ultimate ${productCategory.toLowerCase()} designed specifically for ${targetAudience}. Featuring ${productFeatures.split(',')[0]?.trim() ?? 'cutting-edge technology'} and backed by thousands of 5-star reviews, this is the product your lifestyle has been waiting for. Whether you're a first-time buyer or a seasoned enthusiast, ${productName} delivers unmatched quality, performance, and value. Order today and experience the difference — 30-day money-back guarantee included.`,

    priceSuggestion: `Recommended retail price: $47–$79\n\n• Entry tier: $47 (starter / single unit)\n• Core tier: $67 (most popular — best value)\n• Premium tier: $79 (bundle or pro version)\n\nPricing rationale: ${productCategory} products targeting ${targetAudience} typically convert best in the $47–$79 range. The $67 sweet spot signals quality without triggering price resistance. Consider a charm price ($64.97) for A/B testing.`,

    tiktokAdCopy: `POV: I finally found the ${productCategory.toLowerCase()} that actually works 🤯\n\nI'm a ${targetAudience} and I've tried EVERYTHING. Then I found ${productName}.\n\nHere's what happened in just 7 days:\n✅ ${productFeatures.split(',')[0]?.trim() ?? 'Results I could actually see'}\n✅ Saved me hours every single week\n✅ My friends keep asking where I got it\n\nLink in bio — they have a limited launch offer right now 🔥\n\nFollow for more finds that actually slap 👇`,

    productBenefits: [
      `Engineered specifically for ${targetAudience} — not a one-size-fits-all solution`,
      `${productFeatures.split(',')[0]?.trim() ?? 'Premium build quality'} built to last`,
      `Saves up to 5+ hours per week vs. traditional alternatives`,
      `30-day satisfaction guarantee — zero risk to try`,
      `Compact, lightweight design that goes anywhere you do`,
      `Beginner-friendly setup — ready to use in under 3 minutes`,
      `Backed by 4.8★ average from 2,400+ verified customers`,
      `Free express shipping on all orders over $50`,
      `Eco-friendly packaging and sustainably sourced materials`,
      `24/7 customer support with real humans, not bots`,
    ],

    marketingAngles: [
      `🎯 Pain-point angle: "Stop wasting money on ${productCategory.toLowerCase()} that doesn't deliver — ${productName} is built different"`,
      `🧠 Social proof angle: "Join 50,000+ ${targetAudience} who already switched to ${productName}"`,
      `⚡ Speed angle: "Results in 48 hours or your money back — that's the ${slug} promise"`,
      `💰 Value angle: "For less than your daily coffee, ${productName} pays for itself in week one"`,
      `🔥 FOMO angle: "We only restock ${productName} once a month — and it always sells out"`,
      `🏆 Authority angle: "As featured in TechCrunch, Forbes, and top ${productCategory} reviews"`,
    ],

    isDemo: true,
  };
}

// ── Helpers ──────────────────────────────────────────────────

function parseJsonSafe(raw: string): Record<string, unknown> {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  return JSON.parse(cleaned);
}

function friendlyOpenAIError(status: number, body: string): string {
  if (status === 401) return 'OpenAI API key is invalid or missing. Check your OPENAI_API_KEY in .env.local.';
  if (status === 429) return 'OpenAI rate limit or quota exceeded. Check your usage at platform.openai.com.';
  if (status === 500 || status === 503) return 'OpenAI service is temporarily unavailable. Please try again shortly.';
  return `OpenAI error ${status}: ${body}`;
}

// ── OpenAI call ──────────────────────────────────────────────
async function generateWithOpenAI(
  req: ShopifyRequest,
  apiKey: string
): Promise<ShopifyResponse> {
  const { productName, productCategory, targetAudience, productFeatures } = req;

  const prompt = `You are an expert Shopify e-commerce strategist, copywriter, and conversion rate optimizer. Generate a complete product launch package for the following product.

Product Name: ${productName}
Product Category: ${productCategory}
Target Audience: ${targetAudience}
Key Features / Description: ${productFeatures}

Generate a JSON response with EXACTLY these fields:
{
  "productTitle": "A compelling, SEO-optimized Shopify product title (60-80 chars). Include the product name, category, and a key benefit. Format: [Product Name] — [Key Benefit] | [Category]",
  "seoDescription": "A rich, SEO-optimized product description for Shopify (250-350 words). Include: hook sentence, key features naturally woven in, emotional benefits, social proof mention, and a strong CTA. Write in second-person ('you'/'your'). No bullet points — flowing paragraphs only.",
  "priceSuggestion": "A detailed pricing recommendation (150-200 words) with 3 price tiers (entry/core/premium), specific dollar amounts, psychological pricing rationale, and competitive context for this category and audience.",
  "tiktokAdCopy": "A viral TikTok/Reels ad script (120-180 words). Start with a POV or relatable hook, include a problem-solution narrative, 3 specific benefits with emojis, urgency CTA, and a follow CTA. Conversational, energetic tone.",
  "productBenefits": ["Exactly 10 product benefits as short punchy phrases (8-15 words each). Mix functional, emotional, and social benefits. Do NOT use generic phrases."],
  "marketingAngles": ["Exactly 6 unique marketing angles as complete pitch sentences (20-35 words each). Each must start with a different emoji and angle type label like '🎯 Pain-point:', '🧠 Social proof:', '⚡ Speed:', '💰 Value:', '🔥 FOMO:', '🏆 Authority:'. Make them specific to this product and audience."]
}

Respond ONLY with valid JSON. No markdown, no backticks, no extra text.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.82,
      max_tokens: 2000,
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
    return { ...parsed, isDemo: false } as ShopifyResponse;
  } catch {
    throw new Error('OpenAI returned an unexpected response format. Please try again.');
  }
}

// ── Route handler ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ShopifyRequest;
    const { productName, productCategory, targetAudience, productFeatures } = body;

    if (!productName?.trim() || !productCategory?.trim() || !targetAudience?.trim() || !productFeatures?.trim()) {
      return NextResponse.json(
        { error: 'productName, productCategory, targetAudience, and productFeatures are all required.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // No key or placeholder → return rich mock with a small delay
    if (!apiKey || apiKey.startsWith('sk-your') || apiKey === 'YOUR_KEY_HERE') {
      await new Promise((r) => setTimeout(r, 1400));
      return NextResponse.json(getMockResponse(productName, productCategory, targetAudience, productFeatures));
    }

    // Real OpenAI call
    const result = await generateWithOpenAI(body, apiKey);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('[/api/agents/shopify]', message);

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
