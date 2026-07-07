import { NextRequest, NextResponse } from 'next/server';
import type { WebsiteBuilderInput, WebsiteGeneration, AIProvider } from '@/lib/website-builder-types';

// ============================================================
// POST /api/agents/website-builder
// Generates: Full website content, SEO, branding, marketing
//
// SETUP: Add one of these keys to .env.local:
//   OPENAI_API_KEY=sk-...
//   ANTHROPIC_API_KEY=sk-ant-...
//   GEMINI_API_KEY=AI...
//
// Without a key, this route returns a rich mock response so
// the UI is fully functional for demos.
// ============================================================

export interface WebsiteBuilderRequest extends WebsiteBuilderInput {
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

// ── Shared prompt ───────────────────────────────────────────

function buildPrompt(input: WebsiteBuilderInput): string {
  return `You are an expert website content strategist, UX copywriter, and brand designer. Generate a complete, production-ready website content package for the following business.

Business Name: ${input.businessName}
Business Type: ${input.businessType}
Target Audience: ${input.targetAudience}
Brand Description: ${input.brandDescription}
Preferred Style: ${input.preferredStyle}
Primary Color: ${input.primaryColor}
Secondary Color: ${input.secondaryColor}
Language: ${input.language || 'English'}
Country: ${input.country || 'US'}

Generate a JSON response with exactly this structure:
{
  "homepage": {
    "hero": {
      "headline": "A powerful, benefit-driven headline (8-12 words)",
      "subheadline": "A supporting subheadline that expands on the value proposition (20-30 words)",
      "ctaButtons": [
        { "label": "Primary CTA text", "url": "#get-started", "variant": "primary" },
        { "label": "Secondary CTA text", "url": "#learn-more", "variant": "secondary" },
        { "label": "Tertiary CTA text", "url": "#demo", "variant": "secondary" }
      ],
      "backgroundStyle": "Description of the ideal hero background (gradient, image style, etc.)"
    },
    "features": [
      { "title": "Feature name", "description": "2-3 sentence benefit-focused description", "icon": "lucide icon name" }
    ],
    "socialProof": "A compelling social proof statement with specific numbers"
  },
  "about": {
    "title": "About page title",
    "content": "3-4 paragraph about section content telling the brand story",
    "mission": "Company mission statement",
    "vision": "Company vision statement",
    "values": ["Value 1", "Value 2", "Value 3", "Value 4", "Value 5"]
  },
  "services": {
    "title": "Services section title",
    "subtitle": "Services section subtitle",
    "services": [
      {
        "title": "Service name",
        "description": "Service description (2-3 sentences)",
        "icon": "lucide icon name",
        "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"]
      }
    ]
  },
  "pricing": {
    "title": "Pricing section title",
    "subtitle": "Pricing section subtitle",
    "plans": [
      {
        "name": "Plan name",
        "price": "$XX",
        "period": "/month",
        "description": "One-line plan description",
        "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
        "cta": "CTA button text",
        "isPopular": false
      }
    ]
  },
  "faq": {
    "title": "FAQ section title",
    "subtitle": "FAQ section subtitle",
    "items": [
      { "question": "Common question?", "answer": "Detailed, helpful answer (2-3 sentences)" }
    ]
  },
  "testimonials": {
    "title": "Testimonials section title",
    "subtitle": "Testimonials section subtitle",
    "testimonials": [
      { "name": "Full Name", "role": "Job Title", "company": "Company Name", "quote": "Detailed testimonial quote (2-3 sentences)", "rating": 5 }
    ]
  },
  "contact": {
    "title": "Contact section title",
    "subtitle": "Contact section subtitle",
    "email": "contact@example.com",
    "phone": "+1 (555) 000-0000",
    "address": "Full business address",
    "formFields": [
      { "label": "Field label", "type": "text|email|textarea|tel", "placeholder": "Placeholder text", "required": true }
    ]
  },
  "footer": {
    "columns": [
      { "title": "Column title", "links": [{ "label": "Link text", "url": "/page" }] }
    ],
    "copyright": "© 2026 Company Name. All rights reserved.",
    "socialLinks": [
      { "platform": "Platform name", "url": "https://...", "icon": "lucide icon name" }
    ],
    "tagline": "A memorable brand tagline"
  },
  "seo": {
    "title": "SEO-optimized page title (50-60 chars)",
    "metaDescription": "Compelling meta description (150-160 chars)",
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"],
    "ogTitle": "Open Graph title",
    "ogDescription": "Open Graph description",
    "ogImagePrompt": "AI image generation prompt for the OG image",
    "canonicalUrl": "https://www.example.com",
    "structuredData": "JSON-LD structured data as a string"
  },
  "branding": {
    "colorPalette": [
      { "name": "Color name", "hex": "#hexcode", "usage": "When/where to use this color" }
    ],
    "typography": {
      "heading": "Heading font family",
      "body": "Body font family",
      "accent": "Accent font family",
      "googleFontsUrl": "Google Fonts import URL"
    },
    "iconSuggestions": [
      { "name": "Icon name", "usage": "Where to use it", "emoji": "Relevant emoji" }
    ],
    "logoDescription": "Detailed description of the ideal logo design"
  },
  "marketing": {
    "googleAdsHeadlines": ["Headline 1 (30 chars max)", "Headline 2", "Headline 3", "Headline 4", "Headline 5"],
    "googleAdsDescriptions": ["Description 1 (90 chars max)", "Description 2", "Description 3"],
    "facebookAdCopy": "Full Facebook ad copy with hook, body, and CTA",
    "instagramCaption": "Engaging Instagram caption with emojis and hashtags",
    "linkedInPost": "Professional LinkedIn post",
    "twitterPost": "Concise Twitter/X post (280 chars max)",
    "emailCampaign": {
      "subject": "Email subject line",
      "preheader": "Email preheader text",
      "body": "Full email body content",
      "cta": "Email CTA button text"
    }
  }
}

Requirements:
- Generate 6 features for the homepage
- Generate 4 services with 4 features each
- Generate 3 pricing plans (Starter, mid-tier as popular, Enterprise)
- Generate 8 FAQ items
- Generate 4 testimonials
- Generate 4 contact form fields
- Generate 4 footer columns with 4 links each
- Generate 8 SEO keywords
- Generate 6 color palette entries using the provided primary (${input.primaryColor}) and secondary (${input.secondaryColor}) colors
- Generate 6 icon suggestions
- Generate 5 Google Ads headlines and 3 descriptions
- All content must be tailored to the ${input.businessType} industry and ${input.targetAudience} audience
- Use the ${input.preferredStyle} style tone throughout
- Content should be in ${input.language || 'English'}
- Respond ONLY with valid JSON. No markdown, no backticks.`;
}

// ── OpenAI call ─────────────────────────────────────────────

async function generateWithOpenAI(
  input: WebsiteBuilderInput,
  apiKey: string
): Promise<WebsiteGeneration> {
  const prompt = buildPrompt(input);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 4000,
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
    return { ...parsed, isDemo: false, provider: 'openai' } as WebsiteGeneration;
  } catch {
    throw new Error('OpenAI returned an unexpected response format. Please try again.');
  }
}

// ── Claude call ─────────────────────────────────────────────

async function generateWithClaude(
  input: WebsiteBuilderInput,
  apiKey: string
): Promise<WebsiteGeneration> {
  const prompt = buildPrompt(input);

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
      max_tokens: 4000,
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
    return { ...parsed, isDemo: false, provider: 'claude' } as WebsiteGeneration;
  } catch {
    throw new Error('Claude returned an unexpected response format. Please try again.');
  }
}

// ── Gemini call ─────────────────────────────────────────────

async function generateWithGemini(
  input: WebsiteBuilderInput,
  apiKey: string
): Promise<WebsiteGeneration> {
  const prompt = buildPrompt(input);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 4000,
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
    return { ...parsed, isDemo: false, provider: 'gemini' } as WebsiteGeneration;
  } catch {
    throw new Error('Gemini returned an unexpected response format. Please try again.');
  }
}

// ── Mock response (no API key needed) ──────────────────────

function getMockResponse(input: WebsiteBuilderInput): WebsiteGeneration {
  const biz = input.businessName || 'Acme Digital';
  const type = input.businessType || 'digital agency';
  const audience = input.targetAudience || 'small business owners';
  const primary = input.primaryColor || '#dc2626';
  const secondary = input.secondaryColor || '#1e40af';
  const style = input.preferredStyle || 'modern';
  const lang = input.language || 'English';
  const country = input.country || 'US';
  const slug = biz.toLowerCase().replace(/\s+/g, '-');

  return {
    homepage: {
      hero: {
        headline: `Transform Your Vision Into Digital Reality with ${biz}`,
        subheadline: `We help ${audience} build powerful ${type} solutions that drive growth, increase revenue, and create lasting impact in today's competitive market.`,
        ctaButtons: [
          { label: 'Start Your Project', url: '#get-started', variant: 'primary' },
          { label: 'View Our Work', url: '#portfolio', variant: 'secondary' },
          { label: 'Book a Free Call', url: '#book-call', variant: 'secondary' },
        ],
        backgroundStyle: `${style} gradient from ${primary} to deep charcoal with subtle geometric grid overlay and floating particle animation`,
      },
      features: [
        { title: 'Lightning-Fast Performance', description: `Every ${type} solution we build is optimized for speed. Sub-second load times, efficient code architecture, and CDN-powered delivery ensure your ${audience} never wait.`, icon: 'Zap' },
        { title: 'Enterprise-Grade Security', description: `Bank-level encryption, SOC 2 compliance, and continuous threat monitoring protect your data and your customers. Security isn't an add-on — it's built into everything we do.`, icon: 'Shield' },
        { title: 'Scalable Architecture', description: `Start with what you need today and scale to millions of users tomorrow. Our infrastructure grows with your business, so you never hit a ceiling.`, icon: 'TrendingUp' },
        { title: 'AI-Powered Insights', description: `Built-in analytics and machine learning help ${audience} make data-driven decisions. Understand your customers, predict trends, and optimize in real time.`, icon: 'Brain' },
        { title: '24/7 Expert Support', description: `Our dedicated support team is available around the clock. From technical issues to strategic guidance, we're always here when you need us.`, icon: 'Headphones' },
        { title: 'Seamless Integrations', description: `Connect with 200+ tools your team already uses. From CRMs and payment processors to marketing platforms, everything works together effortlessly.`, icon: 'Puzzle' },
      ],
      socialProof: `Trusted by 2,500+ ${audience} across ${country} — delivering $48M+ in measurable results since 2019`,
    },
    about: {
      title: `About ${biz}`,
      content: `${biz} was founded with a singular mission: to make world-class ${type} solutions accessible to ${audience} everywhere. What started as a small team of passionate builders has grown into one of the most trusted names in the industry.\n\nOur approach is different. We don't just build products — we partner with our clients to understand their unique challenges, goals, and vision. Every solution we deliver is custom-crafted, rigorously tested, and designed to create measurable impact.\n\nWith a team of 45+ specialists spanning design, engineering, strategy, and support, we bring enterprise-level expertise to every project. Whether you're launching your first digital presence or scaling to new markets, ${biz} is the partner that grows with you.\n\nBased in ${country}, we've had the privilege of working with clients across 30+ industries. Our track record speaks for itself: 98% client satisfaction, 85% client retention rate, and an average 3.2x ROI within the first year.`,
      mission: `To empower ${audience} with innovative ${type} solutions that level the playing field and unlock sustainable growth.`,
      vision: `A world where every ${audience.replace(/s$/, '')} has access to the same powerful digital tools as Fortune 500 companies.`,
      values: [
        'Client-First Mentality — Your success is our success, always',
        'Relentless Innovation — We push boundaries and challenge the status quo',
        'Radical Transparency — No hidden fees, no surprises, complete honesty',
        'Quality Over Quantity — We\'d rather do one thing perfectly than ten things poorly',
        'Community Impact — We give back 5% of profits to local tech education programs',
      ],
    },
    services: {
      title: `Our ${type.charAt(0).toUpperCase() + type.slice(1)} Services`,
      subtitle: `Everything ${audience} need to compete, grow, and thrive in the digital economy`,
      services: [
        {
          title: 'Custom Web Development',
          description: `From responsive marketing sites to complex web applications, we build high-performance digital experiences that convert visitors into loyal customers for ${audience}.`,
          icon: 'Code',
          features: ['Responsive design for all devices', 'SEO-optimized architecture', 'Performance-tuned code', 'Accessibility (WCAG 2.1 AA)'],
        },
        {
          title: 'Brand Strategy & Design',
          description: `We create cohesive brand identities that resonate with your target market. From logos and color systems to full brand guidelines, your ${type} brand will stand out.`,
          icon: 'Palette',
          features: ['Logo & visual identity', 'Brand style guidelines', 'UI/UX design systems', 'Marketing collateral design'],
        },
        {
          title: 'Digital Marketing & SEO',
          description: `Drive qualified traffic and convert leads with data-backed marketing strategies. We specialize in helping ${audience} dominate search rankings and social channels.`,
          icon: 'BarChart3',
          features: ['Search engine optimization', 'Pay-per-click advertising', 'Social media management', 'Email marketing automation'],
        },
        {
          title: 'Consulting & Growth Strategy',
          description: `Get expert guidance on technology decisions, market positioning, and scaling operations. Our consultants have helped hundreds of ${audience} reach their next milestone.`,
          icon: 'Lightbulb',
          features: ['Technology stack advisory', 'Market analysis & positioning', 'Growth roadmap planning', 'KPI framework development'],
        },
      ],
    },
    pricing: {
      title: 'Simple, Transparent Pricing',
      subtitle: `Plans designed for ${audience} at every stage — from launch to scale`,
      plans: [
        {
          name: 'Starter',
          price: '$49',
          period: '/month',
          description: `Everything you need to establish your ${type} presence`,
          features: [
            'Custom 5-page website',
            'Mobile-responsive design',
            'Basic SEO setup',
            'Contact form integration',
            'Monthly performance report',
          ],
          cta: 'Get Started',
          isPopular: false,
        },
        {
          name: 'Professional',
          price: '$149',
          period: '/month',
          description: `Advanced tools and support for growing ${audience}`,
          features: [
            'Unlimited pages & blog',
            'Advanced SEO & analytics',
            'E-commerce integration',
            'Priority email & chat support',
            'A/B testing & conversion optimization',
            'Custom integrations (up to 5)',
            'Weekly strategy calls',
          ],
          cta: 'Start Free Trial',
          isPopular: true,
        },
        {
          name: 'Enterprise',
          price: '$499',
          period: '/month',
          description: `Full-service partnership for established ${audience}`,
          features: [
            'Everything in Professional',
            'Dedicated account manager',
            'Custom application development',
            'Advanced security & compliance',
            'API access & custom integrations',
            'SLA with 99.9% uptime guarantee',
            'Quarterly business reviews',
            'White-label solutions',
          ],
          cta: 'Contact Sales',
          isPopular: false,
        },
      ],
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: `Everything ${audience} ask us before getting started`,
      items: [
        { question: `How long does it take to build a ${type} solution?`, answer: `Most projects are completed within 4-8 weeks, depending on complexity. We'll provide a detailed timeline during your free consultation. Rush delivery is available for an additional fee.` },
        { question: 'Do I need technical knowledge to work with you?', answer: `Not at all! We handle all the technical complexity. You focus on your business, and we'll translate your vision into reality. We provide training for any tools you'll manage yourself.` },
        { question: 'Can I switch plans later?', answer: `Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle, and we'll prorate any differences.` },
        { question: 'What happens if I\'m not satisfied?', answer: `We offer a 30-day money-back guarantee on all plans. If you're not completely satisfied, we'll refund your payment — no questions asked. We also offer unlimited revisions during the build phase.` },
        { question: 'Do you offer ongoing support and maintenance?', answer: `Yes! All plans include ongoing support. Professional and Enterprise plans include priority support with guaranteed response times. We also offer dedicated maintenance packages for complex builds.` },
        { question: `How do you ensure my ${type} solution stays secure?`, answer: `We implement industry-standard security practices including SSL encryption, regular security audits, automated backups, and continuous monitoring. Enterprise clients receive additional compliance support.` },
        { question: 'Can you integrate with my existing tools and systems?', answer: `Yes, we integrate with 200+ platforms including Salesforce, HubSpot, Stripe, Shopify, and most CRM, ERP, and marketing tools. Custom API integrations are available on Professional and Enterprise plans.` },
        { question: 'What makes you different from other agencies?', answer: `Three things: We offer transparent, fixed pricing with no hidden fees. We assign a dedicated team to every project. And we measure success by your results — not just deliverables. Our 98% client satisfaction rate speaks for itself.` },
      ],
    },
    testimonials: {
      title: 'What Our Clients Say',
      subtitle: `Join 2,500+ ${audience} who trust ${biz}`,
      testimonials: [
        {
          name: 'Sarah Chen',
          role: 'CEO & Founder',
          company: 'Meridian Labs',
          quote: `${biz} completely transformed our online presence. Within 3 months of launching our new site, we saw a 240% increase in qualified leads and a 180% boost in conversion rate. Their team understood our vision from day one.`,
          rating: 5,
        },
        {
          name: 'James Rodriguez',
          role: 'Marketing Director',
          company: 'Pulse Ventures',
          quote: `As ${audience.replace(/s$/, '')}, finding the right ${type} partner felt impossible — until we found ${biz}. Their strategic approach and attention to detail is unmatched. We've recommended them to every founder we know.`,
          rating: 5,
        },
        {
          name: 'Emily Nakamura',
          role: 'Operations Lead',
          company: 'Canopy Health',
          quote: `The ROI has been incredible. We invested in their Professional plan and saw a 3.5x return in the first quarter alone. The ongoing support is exceptional — they feel like an extension of our own team.`,
          rating: 5,
        },
        {
          name: 'Michael Okafor',
          role: 'CTO',
          company: 'NovaBridge Technologies',
          quote: `I've worked with dozens of agencies over my career, and ${biz} is in a league of their own. The code quality, performance optimization, and security practices are genuinely enterprise-grade. This is what professional ${type} looks like.`,
          rating: 5,
        },
      ],
    },
    contact: {
      title: `Let's Build Something Extraordinary`,
      subtitle: `Ready to take the next step? Reach out and we'll get back to you within 2 business hours.`,
      email: `hello@${slug}.com`,
      phone: '+1 (555) 987-6543',
      address: `350 Innovation Drive, Suite 200, San Francisco, CA 94105, ${country}`,
      formFields: [
        { label: 'Full Name', type: 'text', placeholder: 'John Doe', required: true },
        { label: 'Email Address', type: 'email', placeholder: 'john@company.com', required: true },
        { label: 'Phone Number', type: 'tel', placeholder: '+1 (555) 000-0000', required: false },
        { label: 'Tell Us About Your Project', type: 'textarea', placeholder: `Describe your ${type} needs, timeline, and budget range...`, required: true },
      ],
    },
    footer: {
      columns: [
        {
          title: 'Services',
          links: [
            { label: 'Web Development', url: '/services/web-development' },
            { label: 'Brand Design', url: '/services/brand-design' },
            { label: 'Digital Marketing', url: '/services/digital-marketing' },
            { label: 'Consulting', url: '/services/consulting' },
          ],
        },
        {
          title: 'Company',
          links: [
            { label: 'About Us', url: '/about' },
            { label: 'Careers', url: '/careers' },
            { label: 'Blog', url: '/blog' },
            { label: 'Press Kit', url: '/press' },
          ],
        },
        {
          title: 'Resources',
          links: [
            { label: 'Documentation', url: '/docs' },
            { label: 'Case Studies', url: '/case-studies' },
            { label: 'Free Tools', url: '/tools' },
            { label: 'Newsletter', url: '/newsletter' },
          ],
        },
        {
          title: 'Legal',
          links: [
            { label: 'Privacy Policy', url: '/privacy' },
            { label: 'Terms of Service', url: '/terms' },
            { label: 'Cookie Policy', url: '/cookies' },
            { label: 'GDPR Compliance', url: '/gdpr' },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} ${biz}. All rights reserved.`,
      socialLinks: [
        { platform: 'Twitter', url: `https://twitter.com/${slug}`, icon: 'Twitter' },
        { platform: 'LinkedIn', url: `https://linkedin.com/company/${slug}`, icon: 'Linkedin' },
        { platform: 'Instagram', url: `https://instagram.com/${slug}`, icon: 'Instagram' },
        { platform: 'GitHub', url: `https://github.com/${slug}`, icon: 'Github' },
      ],
      tagline: `${biz} — Where ${audience} find their competitive edge.`,
    },
    seo: {
      title: `${biz} | Premier ${type.charAt(0).toUpperCase() + type.slice(1)} Solutions for ${audience.charAt(0).toUpperCase() + audience.slice(1)}`,
      metaDescription: `${biz} delivers expert ${type} solutions for ${audience}. Boost your growth with custom web development, branding, and digital marketing. Start free today.`,
      keywords: [
        type,
        `${type} services`,
        `best ${type} for ${audience}`,
        `${audience} solutions`,
        'web development',
        'digital marketing',
        'brand strategy',
        `${type} ${country}`,
      ],
      ogTitle: `${biz} — Transforming ${audience.charAt(0).toUpperCase() + audience.slice(1)}' Digital Presence`,
      ogDescription: `Join 2,500+ ${audience} growing faster with ${biz}. Custom ${type} solutions, transparent pricing, measurable results.`,
      ogImagePrompt: `A ${style}, professional hero image for ${biz}, a ${type} company. Feature the brand colors ${primary} and ${secondary} with clean typography and abstract geometric shapes suggesting growth and innovation. 1200x630 resolution, suitable for social sharing.`,
      canonicalUrl: `https://www.${slug}.com`,
      structuredData: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: biz,
        url: `https://www.${slug}.com`,
        description: `Premier ${type} solutions for ${audience}`,
        contactPoint: { '@type': 'ContactPoint', telephone: '+1-555-987-6543', contactType: 'sales' },
      }),
    },
    branding: {
      colorPalette: [
        { name: 'Primary', hex: primary, usage: 'CTAs, primary buttons, key headings, and brand accents' },
        { name: 'Secondary', hex: secondary, usage: 'Secondary buttons, links, info badges, and supporting accents' },
        { name: 'Background', hex: '#0a0a0f', usage: 'Main page background and dark sections' },
        { name: 'Surface', hex: '#141419', usage: 'Card backgrounds, modals, and elevated surfaces' },
        { name: 'Text Primary', hex: '#f8f8f8', usage: 'Headings, body text, and primary content' },
        { name: 'Text Muted', hex: '#71717a', usage: 'Captions, labels, secondary text, and placeholders' },
      ],
      typography: {
        heading: 'Inter',
        body: 'Inter',
        accent: 'JetBrains Mono',
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap',
      },
      iconSuggestions: [
        { name: 'Rocket', usage: 'Launch / getting started sections', emoji: '🚀' },
        { name: 'Shield', usage: 'Security and trust indicators', emoji: '🛡️' },
        { name: 'Zap', usage: 'Performance and speed highlights', emoji: '⚡' },
        { name: 'BarChart3', usage: 'Analytics and growth metrics', emoji: '📊' },
        { name: 'Heart', usage: 'Customer satisfaction and testimonials', emoji: '❤️' },
        { name: 'Globe', usage: `Global reach and ${country} presence`, emoji: '🌍' },
      ],
      logoDescription: `A ${style} wordmark for "${biz}" using the primary color ${primary} as the accent. The logo features clean, geometric letterforms with a subtle icon element — an upward-pointing arrow or abstract growth symbol — integrated into the first letter. The design should feel premium, trustworthy, and forward-looking, suitable for both dark and light backgrounds at any scale.`,
    },
    marketing: {
      googleAdsHeadlines: [
        `${biz} — ${type.charAt(0).toUpperCase() + type.slice(1)} That Delivers`,
        `Grow 3x Faster with ${biz}`,
        `Trusted by 2,500+ ${audience.charAt(0).toUpperCase() + audience.slice(1)}`,
        'Free Consultation — Start Today',
        `#1 ${type.charAt(0).toUpperCase() + type.slice(1)} Partner in ${country}`,
      ],
      googleAdsDescriptions: [
        `${biz} helps ${audience} grow with custom ${type} solutions. 98% satisfaction rate. Start your free trial — no credit card required.`,
        `Transform your business with ${biz}. Expert web development, branding & marketing. Transparent pricing from $49/mo. Book a free strategy call.`,
        `Join 2,500+ ${audience} scaling with ${biz}. Enterprise-grade ${type} solutions at startup-friendly prices. See results in 30 days or your money back.`,
      ],
      facebookAdCopy: `Still struggling to stand out online? 🤔\n\nYou're not alone. Most ${audience} waste months and thousands of dollars on ${type} solutions that just… don't work.\n\nThat's why we built ${biz} differently.\n\n✅ Custom solutions tailored to YOUR business\n✅ Transparent pricing — no hidden fees, ever\n✅ Results you can measure in weeks, not months\n✅ 98% client satisfaction rate\n\nOver 2,500 ${audience} have already made the switch. Here's what Sarah Chen, CEO of Meridian Labs, had to say:\n\n"Within 3 months, we saw a 240% increase in qualified leads."\n\nReady to see what ${biz} can do for you?\n\n👉 Book your FREE strategy call today — link in comments.\n\n#${biz.replace(/\s+/g, '')} #DigitalGrowth #${type.replace(/\s+/g, '')}`,
      instagramCaption: `Your business deserves better than a template. ✨\n\nAt ${biz}, we craft custom ${type} solutions that actually move the needle for ${audience}.\n\nHere's what makes us different:\n🔥 2,500+ happy clients\n⚡ Results in 30 days\n💰 Plans starting at $49/mo\n🛡️ 30-day money-back guarantee\n\nDrop a 🚀 if you're ready to level up your digital presence!\n\n#${biz.replace(/\s+/g, '')} #DigitalAgency #WebDesign #GrowthPartner #${type.replace(/\s+/g, '')} #Entrepreneur #SmallBusiness #StartupLife`,
      linkedInPost: `After helping 2,500+ ${audience} transform their digital presence, here are the 3 biggest lessons we've learned at ${biz}:\n\n1️⃣ Speed beats perfection. Launch, learn, iterate. The businesses that grow fastest are the ones that ship quickly and optimize relentlessly.\n\n2️⃣ Your website isn't a brochure — it's your best salesperson. Treat it like a revenue channel, not a cost center.\n\n3️⃣ The right ${type} partner doesn't just execute your ideas — they challenge them. The best results come from strategic collaboration, not order-taking.\n\nWe're proud to have maintained a 98% client satisfaction rate by living these principles every day.\n\nIf you're a ${audience.replace(/s$/, '')} looking for a ${type} partner who genuinely cares about your results, let's talk.\n\n🔗 Link in comments for a free strategy session.\n\n#${type.replace(/\s+/g, '')} #DigitalTransformation #BusinessGrowth #Leadership`,
      twitterPost: `🚀 ${biz} just crossed 2,500 clients.\n\n98% satisfaction rate. Average 3.2x ROI.\n\nIf you're ${audience.replace(/s$/, 'a ' + audience.replace(/s$/, ''))}, we built this for you.\n\nStart free → ${slug}.com`,
      emailCampaign: {
        subject: `${biz.split(' ')[0]}, your free strategy session is waiting`,
        preheader: `See how 2,500+ ${audience} are growing 3x faster with ${biz}`,
        body: `Hi there,\n\nI wanted to personally reach out because I think ${biz} could be a game-changer for your business.\n\nWe specialize in helping ${audience} with expert ${type} solutions — and right now, we're offering a complimentary 30-minute strategy session where we'll:\n\n• Audit your current digital presence\n• Identify your 3 biggest growth opportunities\n• Create a custom action plan you can implement immediately\n\nThis isn't a sales pitch — it's a genuine strategy session with one of our senior consultants. Over 85% of attendees say it's the most valuable 30 minutes they've spent on their business this year.\n\nHere's what one of our recent clients said:\n\n"${biz} helped us increase qualified leads by 240% in just 3 months. The free strategy session alone was worth thousands." — Sarah Chen, CEO, Meridian Labs\n\nSpots are limited this month, so I'd encourage you to book soon.\n\nLooking forward to helping you grow,\nThe ${biz} Team`,
        cta: 'Book My Free Strategy Session →',
      },
    },
    isDemo: true,
    provider: 'demo',
  };
}

// ── Route handler ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as WebsiteBuilderRequest;
    const { businessName, businessType, provider } = body;

    if (!businessName?.trim() || !businessType?.trim()) {
      return NextResponse.json(
        { error: 'businessName and businessType are required' },
        { status: 400 }
      );
    }

    // Build the full input with defaults
    const input: WebsiteBuilderInput = {
      businessName: businessName.trim(),
      businessType: businessType.trim(),
      targetAudience: body.targetAudience?.trim() || 'general consumers',
      brandDescription: body.brandDescription?.trim() || '',
      preferredStyle: body.preferredStyle || 'modern',
      primaryColor: body.primaryColor?.trim() || '#dc2626',
      secondaryColor: body.secondaryColor?.trim() || '#1e40af',
      language: body.language?.trim() || 'English',
      country: body.country?.trim() || 'US',
    };

    // Determine which API key to check based on provider
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

    // No key → return rich mock
    if (isPlaceholder) {
      console.log('[/api/agents/website-builder] No valid API key found, returning demo response');
      await new Promise((r) => setTimeout(r, 1500));
      return NextResponse.json(getMockResponse(input));
    }

    // Real AI call
    console.log(`[/api/agents/website-builder] Generating with ${selectedProvider}`);

    let result: WebsiteGeneration;

    switch (selectedProvider) {
      case 'claude':
        result = await generateWithClaude(input, apiKey);
        break;
      case 'gemini':
        result = await generateWithGemini(input, apiKey);
        break;
      case 'openai':
      default:
        result = await generateWithOpenAI(input, apiKey);
        break;
    }

    console.log(`[/api/agents/website-builder] Generation complete via ${selectedProvider}`);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('[/api/agents/website-builder]', message);

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
      { error: message },
      { status: isProviderError ? 502 : 500 }
    );
  }
}
