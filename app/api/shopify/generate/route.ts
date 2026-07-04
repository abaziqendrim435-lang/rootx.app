import { NextRequest, NextResponse } from 'next/server';
import type { AIProductGeneration } from '@/lib/shopify-types';

// ============================================================
// POST /api/shopify/generate
//
// Professional e-commerce copywriting engine powered by OpenAI.
//
// Uses AIDA (Attention-Interest-Desire-Action) and PAS
// (Problem-Agitation-Solution) frameworks to produce
// high-converting product copy that is COMPLETELY ORIGINAL —
// never a paraphrase of the existing product text.
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
  // Remove brand prefixes, sizes, colors to get the product noun
  const words = title
    .replace(/[-—|]/g, ' ')
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 2 &&
        !/^(the|and|for|with|in|by|a|an|or|of|to|is)$/i.test(w)
    );
  // Return the last 1-2 meaningful words (usually the product noun)
  return words.slice(-2).join(' ');
}

// ── Mock generator (high-quality, NOT a paraphrase) ───────────

function getMockGeneration(
  title: string,
  productType: string
): AIProductGeneration {
  const noun = extractCoreNoun(title);
  const year = new Date().getFullYear();
  const season = ['Winter', 'Spring', 'Summer', 'Fall'][
    Math.floor(new Date().getMonth() / 3)
  ];

  // Randomized vocabulary pools for variety on each call
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
  };
}

// ── OpenAI call ───────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an elite direct-response copywriter who has generated over $500M in e-commerce revenue. You write like Gary Halbert meets David Ogilvy — punchy, emotional, impossible to ignore.

YOUR RULES:
1. NEVER paraphrase, rephrase, or reword the original product text. Treat it as raw intel only — extract the product category and features, then THROW AWAY the original wording.
2. Every output must be 100% original copy written from scratch using proven frameworks.
3. Use the AIDA framework (Attention → Interest → Desire → Action) for the product description.
4. Weave in PAS (Problem → Agitation → Solution) to create emotional urgency.
5. Write in second person ("you/your") with short, punchy sentences. Mix in power words: "transform", "effortless", "revolutionary", "obsessed", "guarantee".
6. The title must be a COMPLETELY NEW creative title — not the original title with adjectives bolted on.
7. Include a specific, urgent CTA with a reason to act NOW.
8. Every generation must feel fresh and unique — vary your sentence structures, hooks, and emotional angles.
9. Use HTML formatting: <strong>, <em>, and <p> tags. No markdown.
10. Think like a conversion optimizer: every word must earn its place.`;

async function generateWithOpenAI(
  reqBody: GenerateRequest,
  apiKey: string
): Promise<AIProductGeneration> {
  const { title, bodyHtml, productType, tags, vendor } = reqBody;

  // Strip HTML tags from description for cleaner context
  const plainDesc = (bodyHtml ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const userPrompt = `PRODUCT INTEL (use as raw data only — DO NOT copy or paraphrase any of this text):
- Category: ${productType || 'General'}
- Current name: "${title}"
- Current description: "${plainDesc || 'None provided'}"
- Current tags: ${tags || 'None'}
- Brand: ${vendor || 'Unknown'}

YOUR TASK: Write completely original, high-converting product copy from scratch.

Respond with a JSON object containing exactly these 5 fields:

{
  "title": "A completely NEW product title (55-75 chars). Do NOT reuse the original title. Create something fresh that makes people stop scrolling. Use power words, a key benefit, and the product category. Examples of great title formulas: 'The [Adjective] [Product] That [Bold Claim]' or '[Bold Claim] — [Product] Reimagined' or 'Meet Your New Favorite [Product]'.",
  
  "bodyHtml": "3-4 paragraphs of HTML (<p> tags). MUST follow AIDA+PAS framework: Para 1 = Hook + Problem (grab attention, agitate a pain point). Para 2 = Solution + Features (introduce product as the answer, weave in 3-4 features naturally). Para 3 = Social proof + Desire (customer results, lifestyle painting, emotional triggers). Para 4 = Urgent CTA + Risk reversal (limited stock/time, money-back guarantee, free shipping). Total: 200-350 words. Use <strong> and <em> for emphasis. Include 1-2 emoji for visual breaks.",
  
  "seoTitle": "SEO meta title under 60 characters. Include primary keyword + year + compelling modifier (e.g., 'Best', '#1 Rated', 'Top'). Do NOT copy the product title.",
  
  "seoDescription": "SEO meta description under 155 characters. Must include: primary keyword, unique value proposition, and urgency-driven CTA. Write like a Google ad that demands clicks.",
  
  "tags": ["10-14 lowercase tags. Mix of: primary keyword, long-tail search terms, audience segments (e.g., 'gifts for him'), seasonal terms, trending modifiers, benefit-driven phrases. NO generic tags like 'product' or 'item'."]
}

CRITICAL: Output ONLY valid JSON. No markdown fences, no commentary, no extra text.
CRITICAL: Generate FRESH copy — if this prompt is repeated, produce a DIFFERENT result each time.`;

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
        { role: 'user', content: userPrompt },
      ],
      temperature: 1.0, // High temperature for maximum creativity & variety
      max_tokens: 2000,
      top_p: 0.95,
      frequency_penalty: 0.4, // Penalize repeated phrases
      presence_penalty: 0.5, // Encourage novel vocabulary
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

    // Validate required fields exist and are non-empty
    const fields = ['title', 'bodyHtml', 'seoTitle', 'seoDescription', 'tags'];
    for (const field of fields) {
      if (!parsed[field]) {
        throw new Error(`Missing field: ${field}`);
      }
    }

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
 * @description Generate professional, high-converting product copy
 * using proven copywriting frameworks (AIDA + PAS).
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

    // No key or placeholder → return high-quality mock
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
