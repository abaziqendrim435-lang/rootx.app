import { NextRequest, NextResponse } from 'next/server';
import type { AIProductGeneration } from '@/lib/shopify-types';

// ============================================================
// POST /api/shopify/generate
//
// Uses OpenAI gpt-4o-mini to generate optimised product content:
//   • SEO-friendly title
//   • Rich HTML description
//   • Meta title & description
//   • Relevant product tags
//
// Falls back to realistic mock content when OPENAI_API_KEY is
// not configured.
// ============================================================

// ── Request shape ─────────────────────────────────────────────

interface GenerateRequest {
  productId: number;
  title: string;
  bodyHtml: string | null;
  productType: string;
  tags: string;
  vendor: string;
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

// ── Mock generator ────────────────────────────────────────────

function getMockGeneration(title: string, productType: string): AIProductGeneration {
  return {
    title: `${title} — Premium ${productType} | Free Shipping & 30-Day Guarantee`,
    bodyHtml: [
      `<p>Introducing the all-new <strong>${title}</strong> — designed for those who settle for nothing less than excellence. Every detail has been carefully crafted to deliver a seamless experience from the moment you open the box.</p>`,
      `<p>Whether you're upgrading your current setup or discovering the ${productType.toLowerCase()} category for the first time, this product strikes the perfect balance between form and function. Premium materials meet thoughtful engineering, so you can enjoy long-lasting quality without compromise.</p>`,
      `<p>Thousands of happy customers have already made the switch. With a 4.9★ average rating and rave reviews across social media, it's easy to see why ${title} has become a best-seller in its category.</p>`,
      `<p><strong>Order today</strong> and enjoy free express shipping, a 30-day hassle-free return policy, and dedicated customer support. Your satisfaction is our top priority.</p>`,
    ].join('\n'),
    seoTitle: `${title} — Best ${productType} of 2024`,
    seoDescription: `Shop the ${title}: premium quality ${productType.toLowerCase()} with free shipping, 30-day returns, and thousands of 5-star reviews. Limited stock available — order now.`,
    tags: [
      productType.toLowerCase(),
      'best seller',
      'premium',
      'free shipping',
      'top rated',
      'new arrival',
      'gift idea',
      'trending',
      title.split(' ')[0]?.toLowerCase() ?? 'product',
      '2024',
    ],
    isDemo: true,
  };
}

// ── OpenAI call ───────────────────────────────────────────────

async function generateWithOpenAI(
  reqBody: GenerateRequest,
  apiKey: string
): Promise<AIProductGeneration> {
  const { title, bodyHtml, productType, tags, vendor } = reqBody;

  const prompt = `You are an expert Shopify e-commerce copywriter and SEO strategist.

I have a product that needs optimised content. Here is its current information:

Title: ${title}
Description (HTML): ${bodyHtml ?? '(none)'}
Product type: ${productType}
Tags: ${tags}
Vendor: ${vendor}

Generate a JSON response with EXACTLY these fields:
{
  "title": "An optimised, SEO-friendly product title (60-80 characters). Include the product name, a key benefit, and the category. Format: [Product Name] — [Key Benefit] | [Category]",
  "bodyHtml": "A rich HTML product description with 3-4 paragraphs wrapped in <p> tags. Engaging, benefit-driven copy in second person ('you'/'your'). Include emotional hooks, feature highlights woven naturally, social proof mentions, and a strong CTA. 200-300 words total.",
  "seoTitle": "SEO meta title under 60 characters — concise, keyword-rich, compelling",
  "seoDescription": "SEO meta description under 160 characters — includes a value proposition and CTA",
  "tags": ["8-12 relevant product tags as lowercase strings — mix of category, audience, benefit, and trending keywords"]
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
      temperature: 0.8,
      max_tokens: 1500,
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
    return {
      title: parsed.title as string,
      bodyHtml: parsed.bodyHtml as string,
      seoTitle: parsed.seoTitle as string,
      seoDescription: parsed.seoDescription as string,
      tags: parsed.tags as string[],
      isDemo: false,
    };
  } catch {
    throw new Error(
      'OpenAI returned an unexpected response format. Please try again.'
    );
  }
}

// ── Route handler ─────────────────────────────────────────────

/**
 * @description Generate AI-optimised content for a Shopify product.
 *
 * **Request body**
 * ```json
 * {
 *   "productId": 123,
 *   "title": "Leather Wallet",
 *   "bodyHtml": "<p>...</p>",
 *   "productType": "Accessories",
 *   "tags": "wallet, leather",
 *   "vendor": "Acme"
 * }
 * ```
 *
 * **Response** — `AIProductGeneration`
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

    // No key or placeholder → return mock with a small delay
    if (!apiKey || apiKey.startsWith('sk-your') || apiKey === 'YOUR_KEY_HERE') {
      await new Promise((r) => setTimeout(r, 1200));
      return NextResponse.json<AIProductGeneration>(
        getMockGeneration(body.title, body.productType || 'Product')
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
