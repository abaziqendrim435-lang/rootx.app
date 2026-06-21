import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// POST /api/agents/content
// Generates: TikTok caption, Ad copy, Hashtags, Video script
//
// SETUP: Add your OpenAI key to .env.local:
//   OPENAI_API_KEY=sk-...
//
// Without a key, this route returns a rich mock response so
// the UI is fully functional for demos.
// ============================================================

export interface ContentRequest {
  productName: string;
  targetAudience: string;
}

export interface ContentResponse {
  tiktokCaption: string;
  adCopy: string;
  hashtags: string[];
  videoScript: string;
  isDemo: boolean;
}

// ── Mock response (no API key needed) ──────────────────────
function getMockResponse(productName: string, targetAudience: string): ContentResponse {
  return {
    tiktokCaption: `POV: You just discovered ${productName} and your life will never be the same 🤯✨\n\nI've been using it for 2 weeks and honestly? I'm obsessed. If you're a ${targetAudience}, this is literally made for you. Drop a 🔥 if you want a full review!`,

    adCopy: `Tired of doing it the hard way?\n\n${productName} is changing the game for ${targetAudience} everywhere. While everyone else is stuck in 2020, you could be operating at 10x efficiency — starting today.\n\n✅ Save 15+ hours a week\n✅ Results in the first 48 hours\n✅ Built specifically for ${targetAudience}\n\nJoin 50,000+ people who already switched. Limited spots available this month.\n\n→ Try ${productName} free for 14 days. No credit card required.`,

    hashtags: [
      `#${productName.replace(/\s+/g, '')}`,
      `#${targetAudience.replace(/\s+/g, '')}`,
      '#AItools',
      '#ProductivityHacks',
      '#SmallBusiness',
      '#Entrepreneur',
      '#TechTok',
      '#WorkSmarter',
      '#Automation',
      '#BusinessTips',
      '#GameChanger',
      '#ViralProduct',
    ],

    videoScript: `[HOOK — 0:00-0:03]
(energetic music, fast cut)
"This tool just saved me 3 hours today — and I only learned about it yesterday."

[PROBLEM — 0:03-0:12]
"If you're a ${targetAudience}, you know the struggle. You're spending hours on tasks that should take minutes. Sound familiar?"
(show relatable pain point footage)

[SOLUTION — 0:12-0:25]
"That's why I started using ${productName}."
(screen recording / product demo)
"Look how fast this is — in literally 30 seconds I just did what used to take me an entire afternoon."

[PROOF — 0:25-0:38]
"I've been using it for 2 weeks. Here's what changed:"
• Cut my workflow time by 60%
• Eliminated 3 tools I was paying for
• My clients actually noticed the difference

[CTA — 0:38-0:45]
"Link in bio — they have a free trial, no credit card needed."
(text overlay: TRY ${productName.toUpperCase()} FREE →)
"Follow for more tools that actually work."`,

    isDemo: true,
  };
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Strip markdown code fences (```json ... ```) that OpenAI sometimes
 * wraps around its JSON output, then parse into an object.
 */
function parseJsonSafe(raw: string): Record<string, unknown> {
  // Remove optional leading/trailing code fences
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

// ── OpenAI call ─────────────────────────────────────────────
async function generateWithOpenAI(
  productName: string,
  targetAudience: string,
  apiKey: string
): Promise<ContentResponse> {
  const prompt = `You are an expert viral content creator and copywriter. Generate high-converting social media content for the following product.

Product Name: ${productName}
Target Audience: ${targetAudience}

Generate a JSON response with exactly these fields:
{
  "tiktokCaption": "An engaging, viral TikTok caption (150-200 chars) with 1-2 emojis, conversational tone, ends with a CTA or question",
  "adCopy": "A persuasive Facebook/Instagram ad copy (200-300 words) with hook, pain point, solution, social proof, and clear CTA. Use line breaks for readability.",
  "hashtags": ["array", "of", "12", "relevant", "hashtags", "without", "spaces", "starting", "with", "#"],
  "videoScript": "A detailed 45-second TikTok/Reels video script with timestamps [HOOK 0:00-0:03], [PROBLEM 0:03-0:12], [SOLUTION 0:12-0:25], [PROOF 0:25-0:38], [CTA 0:38-0:45] sections. Include stage directions in parentheses."
}

Respond ONLY with valid JSON. No markdown, no backticks.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(friendlyOpenAIError(response.status, errBody));
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content ?? '{}';

  // Parse and return — strips any markdown code fences OpenAI may add, then adds isDemo: false
  try {
    const parsed = parseJsonSafe(raw);
    return { ...parsed, isDemo: false } as ContentResponse;
  } catch {
    throw new Error('OpenAI returned an unexpected response format. Please try again.');
  }
}

// ── Route handler ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContentRequest;
    const { productName, targetAudience } = body;

    if (!productName?.trim() || !targetAudience?.trim()) {
      return NextResponse.json(
        { error: 'productName and targetAudience are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // No key → return rich mock
    if (!apiKey || apiKey.startsWith('sk-your') || apiKey === 'YOUR_KEY_HERE') {
      // Simulate a small delay so loading animation shows
      await new Promise((r) => setTimeout(r, 1200));
      return NextResponse.json(getMockResponse(productName, targetAudience));
    }

    // Real OpenAI call
    const result = await generateWithOpenAI(productName, targetAudience, apiKey);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('[/api/agents/content]', message);

    // Distinguish between OpenAI-specific errors (502 Bad Gateway) and internal errors (500)
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
