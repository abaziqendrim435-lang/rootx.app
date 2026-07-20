/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ApifyProductItem {
  title?: string;
  productTitle?: string;
  name?: string;
  subject?: string;
  price?: any;
  salePrice?: any;
  priceRange?: any;
  priceCurrent?: any;
  priceOriginal?: any;
  originalPrice?: any;
  compareAtPrice?: any;
  priceText?: string;
  discount?: any;
  discountPercentage?: any;
  priceDiscount?: any;
  images?: any;
  imageUrl?: any;
  image?: any;
  thumbnail?: any;
  rating?: any;
  ratingValue?: any;
  stars?: any;
  aggregateRating?: any;
  orders?: any;
  orderCount?: any;
  sales?: any;
  salesCount?: any;
  soldCount?: any;
  seller?: any;
  store?: any;
  storeName?: any;
  sellerInfo?: any;
  shipping?: any;
  shippingInfo?: any;
  shippingCost?: any;
  tags?: any;
  url?: string;
  productUrl?: string;
  link?: string;
  specifications?: any;
  description?: string;
  descriptionHtml?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { searchQuery, productUrl } = await req.json();
    const apifyToken = process.env.APIFY_API_TOKEN;

    if (!apifyToken) {
      console.error('[Apify Integration API] APIFY_API_TOKEN environment variable is missing.');
      return NextResponse.json(
        { error: 'Apify API token is not configured in the server environment.' },
        { status: 500 }
      );
    }

    let targetUrl = '';
    let limit = 8;
    let isUrl = false;
    let query = '';

    if (productUrl) {
      const urlStr = productUrl.trim();
      if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
        return NextResponse.json(
          { error: 'Product URL must start with http:// or https://' },
          { status: 400 }
        );
      }
      targetUrl = urlStr;
      limit = 1;
      isUrl = true;
    } else if (searchQuery) {
      query = searchQuery.trim();
      if (!query) {
        return NextResponse.json(
          { error: 'Search query cannot be empty.' },
          { status: 400 }
        );
      }
      targetUrl = `https://www.aliexpress.com/w/wholesale-${encodeURIComponent(query)}.html`;
      limit = 8;
    } else {
      return NextResponse.json(
        { error: 'Either searchQuery or productUrl must be provided.' },
        { status: 400 }
      );
    }

    // List of actors to try. Devcake is first as it is fast, free, and returns rich structured data.
    const actorsToTry = [
      {
        id: 'devcake~aliexpress-products-scraper',
        buildBody: (tUrl: string, max: number, isDirectUrl: boolean, q: string) => {
          if (isDirectUrl) {
            return {
              startUrls: [{ url: tUrl }],
              maxResults: 1
            };
          } else {
            return {
              searchQueries: [q],
              maxResults: max
            };
          }
        }
      },
      {
        id: 'unfenced-group~aliexpress-scraper',
        buildBody: (tUrl: string, max: number, isDirectUrl: boolean, q: string) => {
          if (isDirectUrl) {
            return {
              startUrls: [{ url: tUrl }],
              maxResults: 1
            };
          } else {
            return {
              searchQueries: [q],
              maxResults: max
            };
          }
        }
      },
      {
        id: 'cryptosignals~aliexpress-scraper',
        buildBody: (tUrl: string, max: number, isDirectUrl: boolean, q: string) => {
          if (isDirectUrl) {
            return {
              startUrls: [{ url: tUrl }],
              maxResults: 1
            };
          } else {
            return {
              searchQueries: [q],
              maxResults: max
            };
          }
        }
      },
      {
        id: 'epctex~aliexpress-scraper',
        buildBody: (tUrl: string, max: number, isDirectUrl: boolean, q: string) => {
          if (isDirectUrl) {
            return {
              startUrls: [{ url: tUrl }],
              maxItems: 1
            };
          } else {
            return {
              searchTerms: [q],
              maxItems: max
            };
          }
        }
      }
    ];

    let lastError = '';
    let datasetItems: ApifyProductItem[] = [];

    for (const actor of actorsToTry) {
      try {
        console.log(`[Apify Integration] Running actor ${actor.id} for URL: ${targetUrl}`);
        // Run actor synchronously with 60s timeout
        const runUrl = `https://api.apify.com/v2/acts/${actor.id}/run-sync-get-dataset-items?token=${apifyToken}&timeout=60`;
        const payload = actor.buildBody(targetUrl, limit, isUrl, query);

        const response = await fetch(runUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Apify Actor ${actor.id} returned status ${response.status}: ${text.slice(0, 200)}`);
        }

        const data = await response.json();
        if (data && Array.isArray(data) && data.length > 0) {
          datasetItems = data;
          console.log(`[Apify Integration] Successfully retrieved ${datasetItems.length} products using actor ${actor.id}`);
          break; // Found working actor and got results
        } else {
          console.warn(`[Apify Integration] Actor ${actor.id} returned empty array.`);
        }
      } catch (err: any) {
        console.error(`[Apify Integration] Actor ${actor.id} failed:`, err.message);
        lastError = err.message;
      }
    }

    if (datasetItems.length === 0) {
      return NextResponse.json(
        { error: `Failed to scrape AliExpress data. Last error: ${lastError || 'Scraper returned no items.'}` },
        { status: 502 }
      );
    }

    // Map dataset items to standard structure
    const products = datasetItems.map((item: ApifyProductItem) => {
      // 1. Extract title
      const title = item.title || item.productTitle || item.name || item.subject || 'Unknown AliExpress Product';
      
      // 2. Extract price
      let price = '0.00';
      if (item.priceCurrent) {
        price = String(item.priceCurrent).replace(/[^0-9.]/g, '');
      } else if (item.priceText) {
        price = String(item.priceText).replace(/[^0-9.]/g, '');
      } else if (item.price) {
        price = typeof item.price === 'object' ? item.price.value || item.price.amount || '0.00' : String(item.price);
      } else if (item.salePrice) {
        price = typeof item.salePrice === 'object' ? item.salePrice.value || item.salePrice.amount || '0.00' : String(item.salePrice);
      } else if (item.priceRange) {
        price = typeof item.priceRange === 'object' ? item.priceRange.value || item.priceRange.amount || '0.00' : String(item.priceRange);
      }

      // 3. Extract original price & discount
      let originalPrice = '';
      if (item.priceOriginal) {
        originalPrice = String(item.priceOriginal).replace(/[^0-9.]/g, '');
      } else if (item.originalPrice) {
        originalPrice = typeof item.originalPrice === 'object' ? item.originalPrice.value || item.originalPrice.amount || '' : String(item.originalPrice);
      } else if (item.compareAtPrice) {
        originalPrice = typeof item.compareAtPrice === 'object' ? item.compareAtPrice.value || item.compareAtPrice.amount || '' : String(item.compareAtPrice);
      }
      
      const discount = item.priceDiscount || item.discount || item.discountPercentage || '';
      
      // 4. Extract images
      let images: string[] = [];
      if (Array.isArray(item.images)) {
        images = item.images.map(i => typeof i === 'string' ? i : i.url || '');
      } else if (item.images && typeof item.images === 'object') {
        images = Object.values(item.images).filter(v => typeof v === 'string') as string[];
      } else if (item.imageUrl) {
        images = [item.imageUrl];
      } else if (item.image) {
        images = [item.image];
      } else if (item.thumbnail) {
        images = [item.thumbnail];
      }
      
      // Clean and normalize image URLs (obtain high-resolution version)
      images = images
        .map((src: string) => {
          if (typeof src !== 'string') return '';
          let cleaned = src.trim();
          if (cleaned.startsWith('//')) {
            cleaned = 'https:' + cleaned;
          }
          cleaned = cleaned.replace(/_[0-9]+x[0-9]+\.(?:jpg|png|jpeg|webp)$/i, (ext) => ext.slice(ext.lastIndexOf('.')));
          cleaned = cleaned.replace(/_Q[0-9]+\.(?:jpg|png|jpeg|webp)$/i, (ext) => ext.slice(ext.lastIndexOf('.')));
          return cleaned;
        })
        .filter(Boolean);

      // Deduplicate images
      images = [...new Set(images)];

      // 5. Extract rating & orders
      const rating = item.ratingValue || item.rating || item.stars || item.aggregateRating?.ratingValue || null;
      const orders = item.orders || item.orderCount || item.sales || item.salesCount || item.soldCount || null;
      
      // 6. Extract seller store
      let seller = '';
      if (item.storeName) {
        seller = String(item.storeName);
      } else if (item.seller) {
        seller = typeof item.seller === 'object' ? item.seller.name || item.seller.storeName || '' : String(item.seller);
      } else if (item.store) {
        seller = typeof item.store === 'object' ? item.store.name || item.store.storeName || '' : String(item.store);
      } else if (item.sellerInfo) {
        seller = typeof item.sellerInfo === 'object' ? item.sellerInfo.name || item.sellerInfo.storeName || '' : String(item.sellerInfo);
      }
      
      // 7. Extract shipping details
      let shipping = '';
      if (item.tags && typeof item.tags === 'string' && item.tags.toLowerCase().includes('shipping')) {
        shipping = item.tags;
      } else if (item.shipping) {
        shipping = typeof item.shipping === 'object' ? item.shipping.name || item.shipping.price || item.shipping.shippingInfo || '' : String(item.shipping);
      } else if (item.shippingInfo) {
        shipping = String(item.shippingInfo);
      } else if (item.shippingCost) {
        shipping = typeof item.shippingCost === 'object' ? item.shippingCost.price || item.shippingCost.amount || '' : String(item.shippingCost);
      }
      
      // 8. Extract product URL
      const url = item.url || item.productUrl || item.link || targetUrl;

      // 9. Extract specifications
      let specifications: { label: string; value: string }[] = [];
      if (Array.isArray(item.specifications)) {
        specifications = item.specifications.map(s => {
          if (typeof s === 'object' && s !== null) {
            return { label: String(s.label || s.key || ''), value: String(s.value || '') };
          }
          return { label: 'Spec', value: String(s) };
        }).filter(s => s.label);
      } else if (item.specifications && typeof item.specifications === 'object') {
        specifications = Object.entries(item.specifications).map(([label, value]) => ({
          label,
          value: String(value)
        }));
      }

      // 10. Extract description
      const description = item.description || item.descriptionHtml || '';

      return {
        title,
        price,
        originalPrice,
        discount: String(discount),
        images,
        rating: rating ? parseFloat(String(rating)) : null,
        orders: orders ? parseInt(String(orders).replace(/[^0-9]/g, ''), 10) : null,
        seller,
        shipping,
        url,
        specifications,
        description
      };
    });

    return NextResponse.json({ success: true, products });
  } catch (err: any) {
    console.error('[Apify Integration API] Fatal error:', err.message);
    return NextResponse.json(
      { error: `Internal server error: ${err.message}` },
      { status: 500 }
    );
  }
}
