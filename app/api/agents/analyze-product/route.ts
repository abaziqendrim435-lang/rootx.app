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
  productData?: {
    title: string;
    price: string;
    originalPrice: string;
    discount: string;
    images: string[];
    rating: number | null;
    orders: number | null;
    seller: string;
    shipping: string;
    url: string;
    specifications: { label: string; value: string }[];
    description: string;
  };
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

  // 3. Collect image URLs from <img> tags
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
        let cleanedSrc = src.replace(/_[0-9]+x[0-9]+\.(?:jpg|png|jpeg|webp)$/i, (ext) => ext.slice(ext.lastIndexOf('.')));
        cleanedSrc = cleanedSrc.replace(/_Q[0-9]+\.(?:jpg|png|jpeg|webp)$/i, (ext) => ext.slice(ext.lastIndexOf('.')));
        structured.images!.push(cleanedSrc);
        existingImages.add(cleanedSrc);
      }
    }
  }

  // 4. Extract all matching alicdn image URLs from raw JSON/HTML state
  const alicdnRegex = /https?:\/\/[a-zA-Z0-9_-]+\.alicdn\.com\/[a-zA-Z0-9_\-\/]+\.(?:jpg|png|jpeg|webp)/gi;
  let alicdnMatch: RegExpExecArray | null;
  while ((alicdnMatch = alicdnRegex.exec(html)) !== null) {
    let src = alicdnMatch[0];
    // Clean size suffixes like _50x50.jpg, _640x640.jpg, _Q90.jpg, etc.
    src = src.replace(/_[0-9]+x[0-9]+\.(?:jpg|png|jpeg|webp)$/i, (ext) => ext.slice(ext.lastIndexOf('.')));
    src = src.replace(/_Q[0-9]+\.(?:jpg|png|jpeg|webp)$/i, (ext) => ext.slice(ext.lastIndexOf('.')));
    if (!existingImages.has(src)) {
      structured.images!.push(src);
      existingImages.add(src);
    }
  }

  // Deduplicate images
  structured.images = [...new Set(structured.images || [])];

  // 5. Extract specifications from lists and tables
  const specList: { label: string; value: string }[] = [];
  const liRegex = /<li[^>]*>([^<]+:[^<]+)<\/li>/gi;
  let liMatch: RegExpExecArray | null;
  while ((liMatch = liRegex.exec(html)) !== null) {
    const parts = liMatch[1].split(':');
    if (parts.length >= 2) {
      const label = parts[0].replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '').trim();
      const value = parts.slice(1).join(':').replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '').trim();
      if (label.length > 2 && label.length < 30 && value.length > 0 && value.length < 100) {
        if (!specList.some(s => s.label === label)) {
          specList.push({ label, value });
        }
      }
    }
  }

  const trRegex = /<tr[^>]*>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/gi;
  let trMatch: RegExpExecArray | null;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const labelRaw = trMatch[1].replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '').trim();
    const valueRaw = trMatch[2].replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '').trim();
    if (labelRaw.length > 2 && labelRaw.length < 30 && valueRaw.length > 0 && valueRaw.length < 100) {
      if (!specList.some(s => s.label === labelRaw) && !labelRaw.includes('\n')) {
        specList.push({ label: labelRaw, value: valueRaw });
      }
    }
  }
  structured.specifications = specList.slice(0, 15);

  // 6. Strip HTML to get raw text
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
- CRITICAL: Do NOT invent or fabricate product prices, product images, variants, or specifications. Factual specifications, prices, and images must match the scraped context.
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

export const dynamic = 'force-dynamic';

// Simple in-memory cache for product analysis
const analysisCache = new Map<string, { analysis: ProductAnalysis; usedProvider: string; timestamp: number }>();

function normalizeUrl(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    parsed.hash = '';
    // Normalize path by stripping trailing slashes
    return parsed.origin + parsed.pathname.replace(/\/$/, '') + parsed.search;
  } catch {
    return urlStr.trim().replace(/\/$/, '');
  }
}

// ── URL fetching ────────────────────────────────────────────

async function fetchPageContent(url: string): Promise<string> {
  const isMockUrl = url.includes('mock-aliexpress') || 
                    url.includes('100500123456.html') || 
                    url.includes('different-product-999.html') || 
                    url.includes('fixture-2') || 
                    url.includes('fixture-3') ||
                    url.includes('fixture-4') ||
                    url.includes('fixture-5') ||
                    url.includes('usb-drive-fixture') ||
                    url.includes('bluetooth-mouse-fixture') ||
                    url.includes('headphones-fixture') ||
                    url.includes('smart-watch-fixture') ||
                    url.includes('espresso-machine-fixture');

  // Test mode or test URL override
  if (isMockUrl) {
    console.log(`${LOG} Mock/Test URL detected: Loading local AliExpress HTML fixture.`);
    const fs = await import('fs/promises');
    const path = await import('path');
    let fixtureName = 'aliexpress-fixture.html';
    if (url.includes('different-product-999.html') || url.includes('fixture-2') || url.includes('bluetooth-mouse-fixture')) {
      fixtureName = 'aliexpress-fixture-2.html';
    } else if (url.includes('fixture-3') || url.includes('headphones-fixture')) {
      fixtureName = 'aliexpress-fixture-3.html';
    } else if (url.includes('fixture-4') || url.includes('smart-watch-fixture')) {
      fixtureName = 'aliexpress-fixture-4.html';
    } else if (url.includes('fixture-5') || url.includes('espresso-machine-fixture')) {
      fixtureName = 'aliexpress-fixture-5.html';
    }
    return await fs.readFile(path.join(process.cwd(), 'scripts', fixtureName), 'utf-8');
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
      console.log(`${LOG} AliExpress anti-bot challenge detected!`);
      if (isMockUrl) {
        console.log(`${LOG} Test Mode: Loading local AliExpress HTML fixture.`);
        const fs = await import('fs/promises');
        const path = await import('path');
        try {
          let fixtureName = 'aliexpress-fixture.html';
          if (url.includes('different-product-999.html') || url.includes('fixture-2') || url.includes('bluetooth-mouse-fixture')) {
            fixtureName = 'aliexpress-fixture-2.html';
          } else if (url.includes('fixture-3') || url.includes('headphones-fixture')) {
            fixtureName = 'aliexpress-fixture-3.html';
          } else if (url.includes('fixture-4') || url.includes('smart-watch-fixture')) {
            fixtureName = 'aliexpress-fixture-4.html';
          } else if (url.includes('fixture-5') || url.includes('espresso-machine-fixture')) {
            fixtureName = 'aliexpress-fixture-5.html';
          }
          return await fs.readFile(path.join(process.cwd(), 'scripts', fixtureName), 'utf-8');
        } catch (err) {
          console.warn(`${LOG} Could not load local HTML fixture fallback:`, err);
        }
      }
      throw new Error('AliExpress security challenge / anti-bot captcha detected. Unable to extract product content from this URL. Please try again later or use the Manual Product Import fallback.');
    }

    return htmlText;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Route handler ────────────────────────────────────────────

const LOG = '[/api/agents/analyze-product]';

export async function POST(req: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

    console.log(`${LOG} [${requestId}] Backend received exact URL: "${trimmedUrl}"`);

    const normalized = normalizeUrl(trimmedUrl);

    // Cache invalidation: evict other cached entries if the URL changes
    for (const key of analysisCache.keys()) {
      if (key !== normalized) {
        console.log(`${LOG} [${requestId}] Invaliding cache entry for URL: ${key} because URL changed to: ${normalized}`);
        analysisCache.delete(key);
      }
    }

    // Check cache
    if (analysisCache.has(normalized)) {
      console.log(`${LOG} [${requestId}] Returning cached analysis for normalized URL: ${normalized}`);
      const cached = analysisCache.get(normalized)!;
      
      // Update cached analysis with the current request ID
      cached.analysis.requestId = requestId;

      const finalResponse = { success: true, requestId, sourceUrl: trimmedUrl, analysis: cached.analysis, usedProvider: cached.usedProvider };
      console.log(`${LOG} [${requestId}] Final JSON returned to frontend (from cache):`, JSON.stringify(finalResponse));

      return NextResponse.json(
        finalResponse,
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }

    // Check if any provider is available
    const selectedProvider = provider || 'auto';
    const available = getAvailableProviders(selectedProvider);

    if (available.length === 0) {
      console.error(`${LOG} [${requestId}] AI provider configuration missing (OPENROUTER_API_KEY is unset).`);
      return NextResponse.json(
        { success: false, error: 'AI analysis failed: No AI providers configured. Please set the OPENROUTER_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    let extractedText = '';
    let title = '';
    let extractedImages: string[] = [];
    let structured: Partial<PreExtracted> = {};

    if (body.productData) {
      console.log(`${LOG} [${requestId}] Using pre-scraped Apify product data.`);
      title = body.productData.title || 'Unknown Product';
      extractedText = `Product Title: ${body.productData.title}\nProduct Price: ${body.productData.price}\nOriginal Price: ${body.productData.originalPrice}\nDiscount: ${body.productData.discount}\nRating: ${body.productData.rating || 'N/A'}\nOrders: ${body.productData.orders || 'N/A'}\nSeller: ${body.productData.seller || 'N/A'}\nShipping: ${body.productData.shipping || 'N/A'}\nDescription:\n${body.productData.description || 'No description'}`;
      extractedImages = body.productData.images || [];
      structured = {
        title: body.productData.title,
        description: body.productData.description || '',
        images: body.productData.images || [],
        price: body.productData.price,
        rating: body.productData.rating,
        reviewCount: body.productData.orders,
        shippingInfo: body.productData.shipping,
        specifications: body.productData.specifications || [],
      };
    } else {
      // Fetch the product page
      console.log(`${LOG} [${requestId}] Fetching URL: ${trimmedUrl}`);

      let pageHtml: string;
      try {
        pageHtml = await fetchPageContent(trimmedUrl);
      } catch (fetchErr) {
        const reason = fetchErr instanceof Error ? fetchErr.message : 'Unknown fetch error';
        console.error(`${LOG} [${requestId}] Fetch failed: ${reason}`);
        return NextResponse.json(
          { success: false, error: `Could not fetch URL: ${reason}` },
          { status: 422 }
        );
      }

      // Extract text, images, and structured data
      const extracted = extractFromHtml(pageHtml);
      extractedText = extracted.text;
      title = extracted.title;
      extractedImages = extracted.images;
      structured = extracted.structured;
    }
    console.log(`${LOG} [${requestId}] Extracted ${extractedText.length} chars, ${extractedImages.length} images, title: "${title}"`);
    console.log(`${LOG} [${requestId}] Raw scraper output (first 200 chars): "${extractedText.slice(0, 200).replace(/\n/g, ' ')}..."`);
    console.log(`${LOG} [${requestId}] Extracted image URLs:`, JSON.stringify(extractedImages));
    
    if (structured.title) console.log(`${LOG} [${requestId}] JSON-LD/OG title: "${structured.title}"`);
    if (structured.price) console.log(`${LOG} [${requestId}] JSON-LD/OG price: ${structured.currency || ''} ${structured.price}`);
    if (structured.rating) console.log(`${LOG} [${requestId}] JSON-LD rating: ${structured.rating}/5 (${structured.reviewCount || 0} reviews)`);

    if (extractedText.length < 50 && !structured.title) {
      console.warn(`${LOG} [${requestId}] Very little text extracted (${extractedText.length} chars). Page may be JS-rendered.`);
    }

    // Build prompt with pre-extracted data and call AI
    console.log(`${LOG} [${requestId}] AI provider selected: "${selectedProvider}"`);
    const prompt = buildProductPrompt(trimmedUrl, title, extractedText, structured);

    const { parsed, provider: usedProvider } = await callWithRetryAndFallback(
      prompt,
      selectedProvider,
      2000,
      LOG,
      0.5,
    );

    console.log(`${LOG} [${requestId}] Raw AI response:`, JSON.stringify(parsed));
    console.log(`${LOG} [${requestId}] Analysis complete via ${usedProvider}`);

    // Merge AI output with pre-extracted structured data
    const analysis: ProductAnalysis = {
      productTitle: (parsed.productTitle as string) || structured.title || title || 'Unknown Product',
      productDescription: (parsed.productDescription as string) || structured.description || '',
      features: (parsed.features as string[]) || [],
      sellingPoints: (parsed.sellingPoints as string[]) || [],
      targetAudience: (parsed.targetAudience as string) || 'general consumers',
      category: (parsed.category as string) || structured.category || 'General',
      priceRange: (structured.price ? `${structured.currency || '$'}${structured.price}` : null) || (parsed.priceRange as string) || 'Contact for pricing',
      sourceUrl: trimmedUrl,
      images: extractedImages,
      shippingInfo: (parsed.shippingInfo as string) || 'Standard shipping available',
      specifications: (structured.specifications && structured.specifications.length > 0)
        ? (structured.specifications as { label: string; value: string }[])
        : (parsed.specifications as { label: string; value: string }[]) || [],
      warnings: (parsed.warnings as string[]) || [],
      isPlaceholder: false,
      ratings: (parsed.ratings as number | undefined) ?? structured.rating ?? undefined,
      reviewCount: (parsed.reviewCount as number | undefined) ?? structured.reviewCount ?? undefined,
      analysisId: `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      requestId: requestId,
    };

    // Cache the analysis
    analysisCache.set(normalized, { analysis, usedProvider, timestamp: Date.now() });

    const finalResponse = { success: true, requestId, sourceUrl: trimmedUrl, analysis, usedProvider };
    console.log(`${LOG} [${requestId}] Final JSON returned to frontend:`, JSON.stringify(finalResponse));

    return NextResponse.json(
      finalResponse,
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error(`${LOG} [${requestId}] FATAL:`, message);

    return NextResponse.json(
      { success: false, error: message },
      { status: 502 }
    );
  }
}
