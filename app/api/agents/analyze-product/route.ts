import { NextRequest, NextResponse } from 'next/server';
import type { ProductAnalysis, AIProvider } from '@/lib/website-builder-types';
import {
  callWithRetryAndFallback,
  getAvailableProviders,
} from '@/lib/ai-providers';

// ============================================================
// POST /api/agents/analyze-product
// Analyzes a product URL and extracts structured product data.
//
// Robust implementation:
// - Uses response_format: json_object for OpenAI
// - Retry once on parse failure
// - Automatic fallback to Claude / Gemini if primary fails
// - Logs raw AI responses for debugging
// - Never shows generic "unexpected response" without context
// ============================================================

export interface AnalyzeProductRequest {
  url: string;
  provider?: AIProvider;
}

// ── HTML extraction ─────────────────────────────────────────

interface ExtractedContent {
  text: string;
  title: string;
  images: string[];
}

/**
 * Extract meaningful text content and image URLs from raw HTML.
 */
function extractFromHtml(html: string): ExtractedContent {
  // Extract <title>
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Collect image URLs
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

function buildProductPrompt(url: string, title: string, extractedText: string): string {
  return `Analyze the following product page content and extract structured product information.

Page URL: ${url}
Page Title: ${title}

Page Content:
${extractedText}

You MUST respond with a JSON object using exactly this structure:
{
  "productTitle": "The product name",
  "productDescription": "A clear, compelling product description (3-4 sentences)",
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
  "sellingPoints": ["Selling point 1", "Selling point 2", "Selling point 3", "Selling point 4"],
  "targetAudience": "Who this product is best for",
  "category": "Product category (e.g. Electronics, Fashion, Health)",
  "priceRange": "Price or price range found on the page, or 'Contact for pricing' if unavailable",
  "shippingInfo": "Shipping details found, or 'Standard shipping available' if not specified",
  "specifications": [{"label": "Spec name", "value": "Spec value"}],
  "warnings": ["Any caveats about data accuracy"]
}

Rules:
- Only extract information that is present or can be reasonably inferred from the content
- Do NOT fabricate customer reviews, ratings, or sales numbers
- If price is not clearly stated, set priceRange to "Contact for pricing"
- Specifications should include material, dimensions, weight, etc. if available
- Generate at least 5 features and 4 selling points
- Respond ONLY with the JSON object. No markdown, no code fences, no explanatory text.`;
}

// ── URL fetching ────────────────────────────────────────────

async function fetchPageContent(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Mock response ───────────────────────────────────────────

function getMockAnalysis(url: string): ProductAnalysis {
  let domain = 'example.com';
  try { domain = new URL(url).hostname; } catch { /* ignore */ }
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

// ── Route handler ────────────────────────────────────────────

const LOG = '[/api/agents/analyze-product]';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AnalyzeProductRequest;
    const { url, provider } = body;

    // Validate URL
    if (!url?.trim()) {
      return NextResponse.json({ success: false, error: 'url is required' }, { status: 400 });
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return NextResponse.json(
        { success: false, error: 'url must start with http:// or https://' },
        { status: 400 }
      );
    }

    // Check if any provider is available
    const selectedProvider = provider || 'openai';
    const available = getAvailableProviders(selectedProvider);

    if (available.length === 0) {
      console.log(`${LOG} No valid API key found, returning demo response`);
      await new Promise((r) => setTimeout(r, 1500));
      return NextResponse.json({ success: true, analysis: getMockAnalysis(trimmedUrl) });
    }

    // Fetch the product page
    console.log(`${LOG} Fetching URL: ${trimmedUrl}`);

    let pageHtml: string;
    try {
      pageHtml = await fetchPageContent(trimmedUrl);
    } catch (fetchErr) {
      const reason = fetchErr instanceof Error ? fetchErr.message : 'Unknown fetch error';
      console.error(`${LOG} Fetch failed: ${reason}`);
      return NextResponse.json(
        { success: false, error: `Could not fetch URL: ${reason}` },
        { status: 422 }
      );
    }

    // Extract text & images
    const { text: extractedText, title, images: extractedImages } = extractFromHtml(pageHtml);
    console.log(
      `${LOG} Extracted ${extractedText.length} chars, ${extractedImages.length} images, title: "${title}"`
    );

    if (extractedText.length < 50) {
      console.warn(`${LOG} Very little text extracted (${extractedText.length} chars). Page may be JS-rendered.`);
    }

    // Build prompt and call AI with retry + fallback
    const prompt = buildProductPrompt(trimmedUrl, title, extractedText);

    const { parsed, provider: usedProvider } = await callWithRetryAndFallback(
      prompt,
      selectedProvider,
      2000,
      LOG,
      0.5,
    );

    console.log(`${LOG} Analysis complete via ${usedProvider}`);

    const analysis: ProductAnalysis = {
      productTitle: (parsed.productTitle as string) || title || 'Unknown Product',
      productDescription: (parsed.productDescription as string) || '',
      features: (parsed.features as string[]) || [],
      sellingPoints: (parsed.sellingPoints as string[]) || [],
      targetAudience: (parsed.targetAudience as string) || 'general consumers',
      category: (parsed.category as string) || 'General',
      priceRange: (parsed.priceRange as string) || 'Contact for pricing',
      sourceUrl: trimmedUrl,
      images: extractedImages,
      shippingInfo: (parsed.shippingInfo as string) || 'Standard shipping available',
      specifications: (parsed.specifications as { label: string; value: string }[]) || [],
      warnings: (parsed.warnings as string[]) || [],
      isPlaceholder: false,
    };

    return NextResponse.json({ success: true, analysis });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error(`${LOG} FATAL:`, message);

    return NextResponse.json(
      { success: false, error: message },
      { status: 502 }
    );
  }
}
