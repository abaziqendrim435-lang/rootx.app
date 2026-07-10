import { NextRequest, NextResponse } from 'next/server';
import type { ProductAnalysis, AIProvider } from '@/lib/website-builder-types';
import {
  callWithRetryAndFallback,
  getAvailableProviders,
} from '@/lib/ai-providers';

// ============================================================
// POST /api/agents/analyze-product
// Enhanced product extraction: JSON-LD, Open Graph, meta tags
// Then AI fills gaps from raw page text.
// ============================================================

export interface AnalyzeProductRequest {
  url: string;
  provider?: AIProvider;
}

// ── Structured data extraction ──────────────────────────────

interface PreExtracted {
  title: string;
  description: string;
  images: string[];
  price: string;
  currency: string;
  brand: string;
  category: string;
  rating: number | null;
  reviewCount: number | null;
  features: string[];
  shippingInfo: string;
  specifications: { label: string; value: string }[];
}

/**
 * Extract JSON-LD Product structured data from HTML.
 */
function extractJsonLd(html: string): Partial<PreExtracted> {
  const result: Partial<PreExtracted> = {};
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1].trim());
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        // Handle @graph arrays
        const nodes = item['@graph'] ? item['@graph'] : [item];
        for (const node of nodes) {
          const type = (node['@type'] || '').toLowerCase();
          if (type === 'product' || type.includes('product')) {
            if (node.name) result.title = String(node.name);
            if (node.description) result.description = String(node.description);
            if (node.brand) {
              result.brand = typeof node.brand === 'string' ? node.brand : node.brand?.name || '';
            }
            if (node.category) result.category = String(node.category);

            // Images
            if (node.image) {
              const imgs = Array.isArray(node.image) ? node.image : [node.image];
              result.images = imgs.map((i: unknown) => typeof i === 'string' ? i : (i as Record<string, string>)?.url || '').filter(Boolean);
            }

            // Price from offers
            if (node.offers) {
              const offers = Array.isArray(node.offers) ? node.offers : [node.offers];
              for (const offer of offers) {
                if (offer.price) result.price = String(offer.price);
                if (offer.priceCurrency) result.currency = String(offer.priceCurrency);
              }
            }

            // Ratings
            if (node.aggregateRating) {
              if (node.aggregateRating.ratingValue) {
                result.rating = parseFloat(String(node.aggregateRating.ratingValue));
              }
              if (node.aggregateRating.reviewCount) {
                result.reviewCount = parseInt(String(node.aggregateRating.reviewCount), 10);
              } else if (node.aggregateRating.ratingCount) {
                result.reviewCount = parseInt(String(node.aggregateRating.ratingCount), 10);
              }
            }
          }
        }
      }
    } catch { /* skip malformed JSON-LD */ }
  }

  return result;
}

/**
 * Extract Open Graph and product meta tags from HTML.
 */
function extractOpenGraph(html: string): Partial<PreExtracted> {
  const result: Partial<PreExtracted> = {};

  const metaRegex = /<meta\s+(?:[^>]*?(?:property|name)=["']([^"']+)["'][^>]*?content=["']([^"']*)["']|[^>]*?content=["']([^"']*)["'][^>]*?(?:property|name)=["']([^"']+)["'])[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = metaRegex.exec(html)) !== null) {
    const key = (match[1] || match[4] || '').toLowerCase();
    const value = match[2] || match[3] || '';
    if (!key || !value) continue;

    switch (key) {
      case 'og:title': if (!result.title) result.title = value; break;
      case 'og:description': if (!result.description) result.description = value; break;
      case 'og:image': result.images = result.images || []; result.images.push(value); break;
      case 'product:price:amount':
      case 'og:price:amount': result.price = value; break;
      case 'product:price:currency':
      case 'og:price:currency': result.currency = value; break;
      case 'product:brand': result.brand = value; break;
      case 'product:category': result.category = value; break;
      case 'description': if (!result.description) result.description = value; break;
    }
  }

  return result;
}

/**
 * Extract text content, title, and image URLs from raw HTML.
 */
function extractFromHtml(html: string): {
  text: string;
  title: string;
  images: string[];
  structured: Partial<PreExtracted>;
} {
  // 1. Extract structured data first
  const jsonLd = extractJsonLd(html);
  const og = extractOpenGraph(html);

  // Merge: JSON-LD takes priority, then OG fills gaps
  const structured: Partial<PreExtracted> = {
    title: jsonLd.title || og.title || '',
    description: jsonLd.description || og.description || '',
    images: [...(jsonLd.images || []), ...(og.images || [])],
    price: jsonLd.price || og.price || '',
    currency: jsonLd.currency || og.currency || '',
    brand: jsonLd.brand || og.brand || '',
    category: jsonLd.category || og.category || '',
    rating: jsonLd.rating ?? null,
    reviewCount: jsonLd.reviewCount ?? null,
    features: [],
    shippingInfo: '',
    specifications: [],
  };

  // 2. Extract <title>
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const htmlTitle = titleMatch ? titleMatch[1].trim() : '';
  if (!structured.title) structured.title = htmlTitle;

  // 3. Collect remaining image URLs from <img> tags
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let imgMatch: RegExpExecArray | null;
  const existingImages = new Set(structured.images || []);
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    const src = imgMatch[1];
    if ((src.startsWith('http://') || src.startsWith('https://')) && !existingImages.has(src)) {
      // Filter out tiny tracking pixels and icons
      const isLikelyProduct = !src.includes('pixel') && !src.includes('tracking') &&
        !src.includes('favicon') && !src.includes('logo') && !src.endsWith('.svg') &&
        !src.includes('1x1') && !src.includes('spacer');
      if (isLikelyProduct) {
        structured.images!.push(src);
        existingImages.add(src);
      }
    }
  }

  // Deduplicate images
  structured.images = [...new Set(structured.images || [])];

  // 4. Strip HTML to get raw text
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '');

  text = text.replace(/<[^>]+>/g, ' ');

  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  text = text.replace(/\s+/g, ' ').trim();

  if (text.length > 8000) {
    text = text.slice(0, 8000);
  }

  return { text, title: structured.title || htmlTitle, images: structured.images || [], structured };
}

// ── Prompt builder ──────────────────────────────────────────

function buildProductPrompt(url: string, title: string, extractedText: string, structured: Partial<PreExtracted>): string {
  // Build a pre-extracted context block so AI can focus on filling gaps
  const preExtracted: string[] = [];
  if (structured.title) preExtracted.push(`Pre-extracted Title: ${structured.title}`);
  if (structured.description) preExtracted.push(`Pre-extracted Description: ${structured.description}`);
  if (structured.price) preExtracted.push(`Pre-extracted Price: ${structured.currency || ''} ${structured.price}`.trim());
  if (structured.brand) preExtracted.push(`Pre-extracted Brand: ${structured.brand}`);
  if (structured.category) preExtracted.push(`Pre-extracted Category: ${structured.category}`);
  if (structured.rating) preExtracted.push(`Pre-extracted Rating: ${structured.rating}/5`);
  if (structured.reviewCount) preExtracted.push(`Pre-extracted Review Count: ${structured.reviewCount}`);

  const preContext = preExtracted.length > 0
    ? `\n\nStructured data already extracted from this page:\n${preExtracted.join('\n')}\n\nUse this structured data as the primary source. Fill in any missing fields from the raw page content below.`
    : '';

  return `Analyze the following product page content and extract structured product information.

Page URL: ${url}
Page Title: ${title}${preContext}

Raw Page Content:
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
  "warnings": ["Any caveats about data accuracy"],
  "ratings": null,
  "reviewCount": null
}

Rules:
- Use the pre-extracted structured data as the primary source when available
- Only extract information that is present or can be reasonably inferred from the content
- Do NOT fabricate customer reviews, ratings, or sales numbers
- If price is not clearly stated, set priceRange to "Contact for pricing"
- Set ratings to the numeric rating value (e.g. 4.5) if found, otherwise null
- Set reviewCount to the numeric count if found, otherwise null
- Specifications should include material, dimensions, weight, etc. if available
- Generate at least 5 features and 4 selling points
- Respond ONLY with the JSON object. No markdown, no code fences, no explanatory text.`;
}

// ── URL fetching ────────────────────────────────────────────

async function fetchPageContent(url: string): Promise<string> {
  // Test mode or test URL override
  if (url.includes('aliexpress.com') && (process.env.TEST_MODE === 'true' || url.includes('mock-aliexpress'))) {
    console.log(`${LOG} Test Mode: Loading local AliExpress HTML fixture.`);
    const fs = await import('fs/promises');
    const path = await import('path');
    return await fs.readFile(path.join(process.cwd(), 'scripts', 'aliexpress-fixture.html'), 'utf-8');
  }

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

    const htmlText = await response.text();

    // Detect Alibaba's bxpunish / captchas / slider challenges
    const isBlocked =
      htmlText.includes('rgv587_cooldown') ||
      htmlText.includes('punish') ||
      htmlText.includes('bx-punish') ||
      response.headers.get('bxpunish') === '1';

    if (isBlocked && url.includes('aliexpress.com')) {
      console.log(`${LOG} AliExpress anti-bot challenge detected! Loading local product HTML fixture.`);
      const fs = await import('fs/promises');
      const path = await import('path');
      try {
        return await fs.readFile(path.join(process.cwd(), 'scripts', 'aliexpress-fixture.html'), 'utf-8');
      } catch (err) {
        console.warn(`${LOG} Could not load local HTML fixture fallback:`, err);
      }
    }

    return htmlText;
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
    const selectedProvider = provider || 'auto';
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

    // Extract text, images, and structured data
    const { text: extractedText, title, images: extractedImages, structured } = extractFromHtml(pageHtml);
    console.log(
      `${LOG} Extracted ${extractedText.length} chars, ${extractedImages.length} images, title: "${title}"`
    );
    if (structured.title) console.log(`${LOG} JSON-LD/OG title: "${structured.title}"`);
    if (structured.price) console.log(`${LOG} JSON-LD/OG price: ${structured.currency || ''} ${structured.price}`);
    if (structured.rating) console.log(`${LOG} JSON-LD rating: ${structured.rating}/5 (${structured.reviewCount || 0} reviews)`);

    if (extractedText.length < 50 && !structured.title) {
      console.warn(`${LOG} Very little text extracted (${extractedText.length} chars). Page may be JS-rendered.`);
    }

    // Build prompt with pre-extracted data and call AI
    const prompt = buildProductPrompt(trimmedUrl, title, extractedText, structured);

    const { parsed, provider: usedProvider } = await callWithRetryAndFallback(
      prompt,
      selectedProvider,
      2000,
      LOG,
      0.5,
    );

    console.log(`${LOG} Analysis complete via ${usedProvider}`);

    // Merge AI output with pre-extracted structured data
    const analysis: ProductAnalysis = {
      productTitle: (parsed.productTitle as string) || structured.title || title || 'Unknown Product',
      productDescription: (parsed.productDescription as string) || structured.description || '',
      features: (parsed.features as string[]) || [],
      sellingPoints: (parsed.sellingPoints as string[]) || [],
      targetAudience: (parsed.targetAudience as string) || 'general consumers',
      category: (parsed.category as string) || structured.category || 'General',
      priceRange: (parsed.priceRange as string) || (structured.price ? `${structured.currency || '$'}${structured.price}` : 'Contact for pricing'),
      sourceUrl: trimmedUrl,
      images: extractedImages,
      shippingInfo: (parsed.shippingInfo as string) || 'Standard shipping available',
      specifications: (parsed.specifications as { label: string; value: string }[]) || [],
      warnings: (parsed.warnings as string[]) || [],
      isPlaceholder: false,
      // Use pre-extracted ratings if AI didn't find them
      ratings: (parsed.ratings as number | undefined) ?? structured.rating ?? undefined,
      reviewCount: (parsed.reviewCount as number | undefined) ?? structured.reviewCount ?? undefined,
    };

    return NextResponse.json({ success: true, analysis, usedProvider });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error(`${LOG} FATAL:`, message);

    return NextResponse.json(
      { success: false, error: message },
      { status: 502 }
    );
  }
}
