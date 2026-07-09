import { NextRequest, NextResponse } from 'next/server';
import type { ProductAnalysis, AIProvider } from '@/lib/website-builder-types';

// ============================================================
// POST /api/agents/analyze-product
// Analyzes a product URL and extracts structured product data.
//
// SETUP: Add one of these keys to .env.local:
//   OPENAI_API_KEY=sk-...
//   ANTHROPIC_API_KEY=sk-ant-...
//   GEMINI_API_KEY=AI...
//
// Without a key, this route returns a plausible mock response
// so the UI is fully functional for demos.
// ============================================================

export interface AnalyzeProductRequest {
  url: string;
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

// ── HTML extraction ─────────────────────────────────────────

interface ExtractedContent {
  text: string;
  title: string;
  images: string[];
}

/**
 * Extract meaningful text content and image URLs from raw HTML.
 *
 * - Strips `<script>`, `<style>`, `<nav>`, `<footer>` tags and their content
 * - Collects `<img>` src attributes (http/https only)
 * - Removes remaining HTML tags
 * - Collapses whitespace and truncates to 8 000 characters
 */
function extractFromHtml(html: string): ExtractedContent {
  // Extract <title> if present
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Collect image URLs before stripping tags
  const images: string[] = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let imgMatch: RegExpExecArray | null;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    const src = imgMatch[1];
    if (src.startsWith('http://') || src.startsWith('https://')) {
      images.push(src);
    }
  }

  // Strip script, style, nav, footer blocks
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '');

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Truncate to 8000 characters
  if (text.length > 8000) {
    text = text.slice(0, 8000);
  }

  return { text, title, images };
}

// ── Prompt builder ──────────────────────────────────────────

/**
 * Build the AI prompt for product analysis.
 */
function buildProductPrompt(url: string, title: string, extractedText: string): string {
  return `Analyze the following product page content and extract structured product information.

Page URL: ${url}
Page Title: ${title}

Page Content:
${extractedText}

Extract the following as JSON:
{
  "productTitle": "The product name",
  "productDescription": "A clear, compelling product description (3-4 sentences)",
  "features": ["Feature 1", "Feature 2", ...at least 5 features],
  "sellingPoints": ["Selling point 1", ...at least 4 unique selling points],
  "targetAudience": "Who this product is best for",
  "category": "Product category (e.g. Electronics, Fashion, Health)",
  "priceRange": "Price or price range found on the page, or 'Price not found' if unavailable",
  "shippingInfo": "Shipping details found, or 'Standard shipping available' if not specified",
  "specifications": [{"label": "Spec name", "value": "Spec value"}, ...],
  "warnings": ["Any caveats about data accuracy, e.g. 'Price could not be verified'"]
}

Rules:
- Only extract information that is present or can be reasonably inferred from the content
- Do NOT fabricate customer reviews, ratings, or sales numbers
- If price is not clearly stated, set priceRange to 'Contact for pricing'
- Specifications should include material, dimensions, weight, etc. if available
- Respond ONLY with valid JSON`;
}

// ── OpenAI call ─────────────────────────────────────────────

/**
 * Analyze a product page using OpenAI GPT-4o.
 */
async function analyzeWithOpenAI(
  url: string,
  title: string,
  extractedText: string,
  extractedImages: string[],
  apiKey: string
): Promise<ProductAnalysis> {
  const prompt = buildProductPrompt(url, title, extractedText);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
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
    return {
      ...parsed,
      sourceUrl: url,
      images: extractedImages,
      isPlaceholder: false,
    } as ProductAnalysis;
  } catch {
    throw new Error('OpenAI returned an unexpected response format. Please try again.');
  }
}

// ── Claude call ─────────────────────────────────────────────

/**
 * Analyze a product page using Anthropic Claude.
 */
async function analyzeWithClaude(
  url: string,
  title: string,
  extractedText: string,
  extractedImages: string[],
  apiKey: string
): Promise<ProductAnalysis> {
  const prompt = buildProductPrompt(url, title, extractedText);

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
      max_tokens: 2000,
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
    return {
      ...parsed,
      sourceUrl: url,
      images: extractedImages,
      isPlaceholder: false,
    } as ProductAnalysis;
  } catch {
    throw new Error('Claude returned an unexpected response format. Please try again.');
  }
}

// ── Gemini call ─────────────────────────────────────────────

/**
 * Analyze a product page using Google Gemini.
 */
async function analyzeWithGemini(
  url: string,
  title: string,
  extractedText: string,
  extractedImages: string[],
  apiKey: string
): Promise<ProductAnalysis> {
  const prompt = buildProductPrompt(url, title, extractedText);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 2000,
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
    return {
      ...parsed,
      sourceUrl: url,
      images: extractedImages,
      isPlaceholder: false,
    } as ProductAnalysis;
  } catch {
    throw new Error('Gemini returned an unexpected response format. Please try again.');
  }
}

// ── Mock response (no API key needed) ──────────────────────

/**
 * Generate a plausible mock `ProductAnalysis` based on the URL domain.
 * Used when no AI provider API key is configured.
 */
function getMockAnalysis(url: string): ProductAnalysis {
  const domain = new URL(url).hostname;
  return {
    productTitle: `Premium Product from ${domain}`,
    productDescription: `A high-quality product sourced from ${domain}. This product features premium materials and modern design, perfect for today's discerning customers.`,
    features: [
      'Premium quality materials',
      'Modern ergonomic design',
      'Durable construction',
      'Easy to use',
      'Compact and portable',
      'Available in multiple variants',
    ],
    sellingPoints: [
      'Free shipping on orders over $50',
      '30-day money-back guarantee',
      'Premium quality at competitive prices',
      'Fast 3-5 day delivery',
    ],
    targetAudience: 'Online shoppers looking for quality products at competitive prices',
    category: 'General',
    priceRange: '$19.99 - $49.99',
    sourceUrl: url,
    images: [],
    shippingInfo: 'Standard shipping: 5-10 business days. Express shipping available.',
    specifications: [
      { label: 'Material', value: 'Premium grade' },
      { label: 'Weight', value: 'Lightweight' },
      { label: 'Warranty', value: '1 year manufacturer warranty' },
    ],
    warnings: ['This is a demo analysis — connect an AI provider for real product analysis'],
    isPlaceholder: true,
  };
}

// ── URL fetching ────────────────────────────────────────────

/**
 * Fetch the product page HTML content server-side.
 * Uses a 10-second timeout via AbortController.
 */
async function fetchPageContent(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RootXBot/1.0)',
        Accept: 'text/html',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Route handler ────────────────────────────────────────────

/**
 * POST /api/agents/analyze-product
 *
 * Accepts `{ url: string, provider?: AIProvider }` and returns a
 * structured `ProductAnalysis` extracted from the product page.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AnalyzeProductRequest;
    const { url, provider } = body;

    // ── Validate URL ──────────────────────────────────────────
    if (!url?.trim()) {
      return NextResponse.json(
        { success: false, error: 'url is required' },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return NextResponse.json(
        { success: false, error: 'url must start with http:// or https://' },
        { status: 400 }
      );
    }

    // ── Determine provider & API key ──────────────────────────
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

    // No key → return mock based on URL
    if (isPlaceholder) {
      console.log('[/api/agents/analyze-product] No valid API key found, returning demo response');
      await new Promise((r) => setTimeout(r, 1500));
      return NextResponse.json({ success: true, analysis: getMockAnalysis(trimmedUrl) });
    }

    // ── Fetch the product page ────────────────────────────────
    console.log(`[/api/agents/analyze-product] Fetching URL: ${trimmedUrl}`);

    let pageHtml: string;
    try {
      pageHtml = await fetchPageContent(trimmedUrl);
    } catch (fetchErr) {
      const reason = fetchErr instanceof Error ? fetchErr.message : 'Unknown fetch error';
      console.error(`[/api/agents/analyze-product] Fetch failed: ${reason}`);
      return NextResponse.json(
        { success: false, error: 'Could not fetch URL' },
        { status: 422 }
      );
    }

    // ── Extract text & images from HTML ───────────────────────
    const { text: extractedText, title, images: extractedImages } = extractFromHtml(pageHtml);
    console.log(
      `[/api/agents/analyze-product] Extracted ${extractedText.length} chars, ${extractedImages.length} images, title: "${title}"`
    );

    // ── Send to AI provider ───────────────────────────────────
    console.log(`[/api/agents/analyze-product] Analyzing with ${selectedProvider}`);

    let analysis: ProductAnalysis;

    switch (selectedProvider) {
      case 'claude':
        analysis = await analyzeWithClaude(trimmedUrl, title, extractedText, extractedImages, apiKey);
        break;
      case 'gemini':
        analysis = await analyzeWithGemini(trimmedUrl, title, extractedText, extractedImages, apiKey);
        break;
      case 'openai':
      default:
        analysis = await analyzeWithOpenAI(trimmedUrl, title, extractedText, extractedImages, apiKey);
        break;
    }

    console.log(`[/api/agents/analyze-product] Analysis complete via ${selectedProvider}`);
    return NextResponse.json({ success: true, analysis });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('[/api/agents/analyze-product]', message);

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
      { success: false, error: message },
      { status: isProviderError ? 502 : 500 }
    );
  }
}
