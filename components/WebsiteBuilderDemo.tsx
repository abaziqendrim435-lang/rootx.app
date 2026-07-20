'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Loader2, Copy, Check, RefreshCw, AlertTriangle, Zap, Eye,
  Download, Settings, Search, Megaphone, Palette, Layout, Code, FileJson,
  Globe, ChevronDown, ChevronRight, Edit3, X, Monitor, Tablet, Smartphone,
  ExternalLink, Mail, Phone, MapPin, Star, Quote, ArrowRight, Hash,
  Type, Image as ImageIcon, Layers, Target, PenTool, Briefcase,
  ShoppingBag, Upload, CheckCircle2, Plug,
  Package, Link2, BarChart3, Store, Truck, Shield,
} from 'lucide-react';
import type {
  WebsiteBuilderInput, WebsiteGeneration, PreferredStyle, AIProvider, ExportFormat,
  HomepageSection, AboutSection, ServicesSection, PricingSection, FAQSection,
  TestimonialsSection, ContactSection, FooterSection, SEOData, BrandingData, MarketingData,
  BuilderMode, ProductAnalysis, DropshippingInput, DesignEngineResult, DesignArchetypeId,
} from '@/lib/website-builder-types';
import { saveGeneration } from '@/lib/dashboard-storage';
import { generateShopifyTheme, generateShopifyThemeV2 } from '@/lib/shopify-theme-generator';
import { cleanBrandName } from '@/lib/title-cleaner';
import DesignScorePanel from '@/components/design-engine/DesignScorePanel';
import ArchetypeSelector from '@/components/design-engine/ArchetypeSelector';
import DesignPreviewPanel from '@/components/design-engine/DesignPreviewPanel';
import ModelLogPanel from '@/components/design-engine/ModelLogPanel';
import ImageDiagnosticsPanel from '@/components/image-pipeline/ImageDiagnosticsPanel';
import ImageManagerModal from '@/components/image-pipeline/ImageManagerModal';
import type {
  ShopifyThemeFile, ThemeCreateResponse, ThemePublishResponse, ThemeDeployStatus,
} from '@/lib/shopify-types';

import { supabaseClient } from '@/lib/supabase-auth';

// Authenticated fetch helper that injects Supabase JWT Bearer token
async function authenticatedFetch(url: string, options: RequestInit = {}) {
  let token = '';
  if (supabaseClient) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    token = session?.access_token || '';
  }
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
  return fetch(url, { ...options, headers });
}

// ════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════

function useCopy() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(key);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };
  return { copiedId, copy };
}

// ════════════════════════════════════════════════════════════════
// Micro-Components
// ════════════════════════════════════════════════════════════════

function CopyBtn({ text, id, copiedId, onCopy, size = 'sm' }: {
  text: string; id: string; copiedId: string | null; onCopy: (t: string, k: string) => void; size?: 'sm' | 'xs';
}) {
  const is = copiedId === id;
  const sz = size === 'xs' ? 12 : 14;
  return (
    <button
      onClick={() => onCopy(text, id)}
      className="rounded-md flex items-center justify-center"
      style={{
        width: size === 'xs' ? 24 : 28, height: size === 'xs' ? 24 : 28,
        background: is ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${is ? 'rgba(34,197,94,0.3)' : 'var(--color-border)'}`,
        color: is ? '#22c55e' : '#52525b',
        transition: 'all 0.15s',
      }}>
      {is ? <Check size={sz} /> : <Copy size={sz} />}
    </button>
  );
}

function SectionCard({ title, icon, color, children, defaultOpen = false }: {
  title: string; icon: React.ReactNode; color: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        transition: 'border-color 0.25s ease',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = `${color}44`)}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)')}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        style={{ background: 'var(--color-surface-2)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}18`, border: `1px solid ${color}30` }}
          >
            {icon}
          </div>
          <span className="text-sm font-bold">{title}</span>
        </div>
        {open ? <ChevronDown size={16} style={{ color: '#52525b' }} /> : <ChevronRight size={16} style={{ color: '#52525b' }} />}
      </button>
      {open && (
        <div className="p-5" style={{ borderTop: '1px solid var(--color-border)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ResultCard({
  icon: Icon, label, color, children, copyId, copyText, copiedId, onCopy,
}: {
  icon: React.ElementType; label: string; color: string; children: React.ReactNode;
  copyId: string; copyText: string; copiedId: string | null; onCopy: (text: string, id: string) => void;
}) {
  const isCopied = copiedId === copyId;
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        transition: 'border-color 0.25s ease',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = `${color}44`)}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)')}
    >
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}18`, border: `1px solid ${color}30` }}
          >
            <Icon size={14} style={{ color }} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
            {label}
          </span>
        </div>
        <button
          onClick={() => onCopy(copyText, copyId)}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all duration-200"
          style={{
            background: isCopied ? `${color}18` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isCopied ? color + '40' : 'var(--color-border)'}`,
            color: isCopied ? color : '#71717a',
          }}
          title="Copy to clipboard"
        >
          {isCopied ? <Check size={12} /> : <Copy size={12} />}
          {isCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Loading Skeleton
// ════════════════════════════════════════════════════════════════

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-5 mt-10">
      <div className="flex flex-col items-center gap-4 py-10">
        <div className="relative">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(220,38,38,0.1)',
              border: '1px solid rgba(220,38,38,0.2)',
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}
          >
            <Sparkles size={32} style={{ color: '#ef4444' }} />
          </div>
          <div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: '#dc2626' }}
          >
            <Loader2 size={12} className="animate-spin" style={{ color: '#fff' }} />
          </div>
        </div>
        <div className="text-center">
          <p className="font-semibold text-lg mb-1">AI is building your website…</p>
          <p className="text-sm" style={{ color: '#52525b' }}>
            Generating pages, branding, SEO, and marketing content
          </p>
        </div>
        <div className="flex gap-2 mt-2">
          {[0, 0.2, 0.4].map((delay, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: '#dc2626',
                animation: `bounce 1.2s ease-in-out ${delay}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="px-5 py-3.5 shimmer"
            style={{ height: '48px', borderBottom: '1px solid var(--color-border)' }}
          />
          <div className="p-5 flex flex-col gap-3">
            <div className="shimmer rounded-lg" style={{ height: '16px', width: '90%' }} />
            <div className="shimmer rounded-lg" style={{ height: '16px', width: '75%' }} />
            <div className="shimmer rounded-lg" style={{ height: '16px', width: '60%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Input Form
// ════════════════════════════════════════════════════════════════

function InputForm({
  input, setInput, status, onSubmit, onReset,
}: {
  input: WebsiteBuilderInput;
  setInput: (v: WebsiteBuilderInput) => void;
  status: 'idle' | 'loading' | 'done' | 'error';
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
}) {
  const styles: { label: string; value: PreferredStyle }[] = [
    { label: 'Minimal', value: 'minimal' },
    { label: 'Luxury', value: 'luxury' },
    { label: 'Startup', value: 'startup' },
    { label: 'Dark', value: 'dark' },
    { label: 'Modern', value: 'modern' },
    { label: 'Corporate', value: 'corporate' },
  ];

  const languages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
    'Arabic', 'Chinese', 'Japanese', 'Korean', 'Hindi', 'Turkish', 'Dutch', 'Russian', 'Polish',
  ];

  const examples = [
    {
      label: 'Tech Startup',
      fill: () => setInput({
        ...input,
        businessName: 'NexaFlow',
        businessType: 'SaaS Platform',
        targetAudience: 'startup founders and CTOs',
        brandDescription: 'A cutting-edge project management platform that leverages AI to automate workflows, predict bottlenecks, and deliver actionable insights for high-growth teams.',
        preferredStyle: 'startup' as PreferredStyle,
        primaryColor: '#6366f1',
        secondaryColor: '#06b6d4',
      }),
    },
    {
      label: 'Luxury Brand',
      fill: () => setInput({
        ...input,
        businessName: 'Maison Élégance',
        businessType: 'Luxury Fashion',
        targetAudience: 'affluent professionals aged 30-55',
        brandDescription: 'Timeless elegance meets modern sophistication. Maison Élégance crafts premium fashion pieces using the finest materials and artisanal techniques passed down through generations.',
        preferredStyle: 'luxury' as PreferredStyle,
        primaryColor: '#1a1a2e',
        secondaryColor: '#c9a96e',
      }),
    },
    {
      label: 'Local Restaurant',
      fill: () => setInput({
        ...input,
        businessName: 'Bella Cucina',
        businessType: 'Italian Restaurant',
        targetAudience: 'food lovers and families',
        brandDescription: 'Authentic Italian cuisine crafted with love using recipes handed down through four generations. Fresh, locally-sourced ingredients meet traditional cooking methods in a warm, inviting atmosphere.',
        preferredStyle: 'modern' as PreferredStyle,
        primaryColor: '#b91c1c',
        secondaryColor: '#f59e0b',
      }),
    },
  ];

  return (
    <form onSubmit={onSubmit}>
      <div
        className="rounded-2xl p-6 md:p-8"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {/* Business Name */}
          <div>
            <label htmlFor="wb-name" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
              Business Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="wb-name" type="text" required maxLength={80}
              placeholder="e.g. NexaFlow, Bella Cucina, Maison Élégance…"
              value={input.businessName} onChange={(e) => setInput({ ...input, businessName: e.target.value })}
              disabled={status === 'loading'} className="input-field" style={{ fontSize: '0.95rem' }}
            />
          </div>

          {/* Business Type */}
          <div>
            <label htmlFor="wb-type" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
              Business Type <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="wb-type" type="text" required maxLength={80}
              placeholder="e.g. SaaS, E-commerce, Agency, Restaurant"
              value={input.businessType} onChange={(e) => setInput({ ...input, businessType: e.target.value })}
              disabled={status === 'loading'} className="input-field" style={{ fontSize: '0.95rem' }}
            />
          </div>

          {/* Target Audience */}
          <div>
            <label htmlFor="wb-audience" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
              Target Audience
            </label>
            <input
              id="wb-audience" type="text" maxLength={120}
              placeholder="e.g. small business owners, tech startups"
              value={input.targetAudience} onChange={(e) => setInput({ ...input, targetAudience: e.target.value })}
              disabled={status === 'loading'} className="input-field" style={{ fontSize: '0.95rem' }}
            />
          </div>

          {/* Preferred Style */}
          <div>
            <label htmlFor="wb-style" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
              Preferred Style
            </label>
            <select
              id="wb-style" value={input.preferredStyle}
              onChange={(e) => setInput({ ...input, preferredStyle: e.target.value as PreferredStyle })}
              disabled={status === 'loading'} className="input-field" style={{ fontSize: '0.95rem' }}
            >
              {styles.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Primary Color */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color" value={input.primaryColor}
                onChange={(e) => setInput({ ...input, primaryColor: e.target.value })}
                disabled={status === 'loading'}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                style={{ background: 'transparent' }}
              />
              <input
                type="text" value={input.primaryColor} maxLength={7}
                onChange={(e) => setInput({ ...input, primaryColor: e.target.value })}
                disabled={status === 'loading'} className="input-field flex-1"
                style={{ fontSize: '0.95rem', fontFamily: 'monospace' }}
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
              Secondary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color" value={input.secondaryColor}
                onChange={(e) => setInput({ ...input, secondaryColor: e.target.value })}
                disabled={status === 'loading'}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                style={{ background: 'transparent' }}
              />
              <input
                type="text" value={input.secondaryColor} maxLength={7}
                onChange={(e) => setInput({ ...input, secondaryColor: e.target.value })}
                disabled={status === 'loading'} className="input-field flex-1"
                style={{ fontSize: '0.95rem', fontFamily: 'monospace' }}
              />
            </div>
          </div>

          {/* Language */}
          <div>
            <label htmlFor="wb-lang" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
              Language
            </label>
            <select
              id="wb-lang" value={input.language}
              onChange={(e) => setInput({ ...input, language: e.target.value })}
              disabled={status === 'loading'} className="input-field" style={{ fontSize: '0.95rem' }}
            >
              {languages.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Country */}
          <div>
            <label htmlFor="wb-country" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
              Country
            </label>
            <input
              id="wb-country" type="text" maxLength={60}
              placeholder="e.g. United States, United Kingdom"
              value={input.country} onChange={(e) => setInput({ ...input, country: e.target.value })}
              disabled={status === 'loading'} className="input-field" style={{ fontSize: '0.95rem' }}
            />
          </div>
        </div>

        {/* Brand Description (full width) */}
        <div className="mb-6">
          <label htmlFor="wb-desc" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
            Brand Description
          </label>
          <textarea
            id="wb-desc" rows={3} maxLength={500}
            placeholder="Describe your brand personality, values, and unique selling points..."
            value={input.brandDescription} onChange={(e) => setInput({ ...input, brandDescription: e.target.value })}
            disabled={status === 'loading'} className="input-field resize-none" style={{ fontSize: '0.95rem' }}
          />
        </div>

        {/* Quick examples */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-xs" style={{ color: '#3f3f46', paddingTop: '2px' }}>Try:</span>
          {examples.map((ex) => (
            <button
              key={ex.label} type="button" onClick={ex.fill} disabled={status === 'loading'}
              className="text-xs px-2.5 py-1 rounded-lg transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
                color: '#71717a', cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#ef4444';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(220,38,38,0.35)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#71717a';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
              }}
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Buttons row */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="submit"
            disabled={status === 'loading' || !input.businessName.trim() || !input.businessType.trim()}
            className="btn-primary"
            style={{
              opacity: status === 'loading' || !input.businessName.trim() || !input.businessType.trim() ? 0.6 : 1,
              cursor: status === 'loading' || !input.businessName.trim() || !input.businessType.trim() ? 'not-allowed' : 'pointer',
              minWidth: '220px', justifyContent: 'center',
            }}
          >
            {status === 'loading' ? (
              <><Loader2 size={17} className="animate-spin" /> Building Website…</>
            ) : (
              <><Sparkles size={17} /> Build My Website</>
            )}
          </button>
          {status === 'done' && (
            <button type="button" onClick={onReset} className="btn-secondary flex items-center gap-2" style={{ padding: '0.75rem 1.25rem' }}>
              <RefreshCw size={15} /> New Website
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function generateEcommerceHtml(result: WebsiteGeneration, input: WebsiteBuilderInput): string {
  const pc = input.primaryColor || '#6366f1';
  const sc = input.secondaryColor || '#06b6d4';
  const headingFont = result.branding.typography.heading || 'Inter';
  const bodyFont = result.branding.typography.body || 'Inter';
  const fontsUrl = result.branding.typography.googleFontsUrl || `https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@400;600;700;800&family=${bodyFont.replace(/ /g, '+')}:wght@300;400;500;600&display=swap`;

  const eco = result.ecommerce || {
    announcementBar: '⚡ LIMITED TIME OFFER: FREE SHIPPING WORLDWIDE!',
    navigation: ['Home', 'Shop', 'Our Story', 'Reviews', 'FAQs'],
    price: '$29.99',
    compareAtPrice: '$59.99',
    preferredStyle: 'modern_commerce',
    variants: [{ name: 'Color', values: ['Midnight Black', 'Metallic Silver'] }],
    images: result.homepage.hero.backgroundStyle.includes('http') ? [result.homepage.hero.backgroundStyle] : [],
    trustBadges: ['30-Day Money-Back Guarantee', '100% Secure Checkout', 'Worldwide Tracked Shipping'],
    shippingText: 'Dispatched in 24-48 hours. Estimated delivery: 7-12 days.',
    featureSections: [],
    specifications: [],
    howItWorks: [],
    faq: [],
    reviews: [],
    stickyAddToCartText: 'Get Yours Now',
    sectionOrder: ['hero', 'features', 'specifications', 'howItWorks', 'faqs', 'reviews']
  };

  const mainImage = eco.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800';
  const priceVal = eco.price || '$29.99';
  const compareVal = eco.compareAtPrice || '$59.99';
  const title = result.seo.title.split('|')[0]?.trim() || result.homepage.hero.headline;
  const sectionOrder = eco.sectionOrder || ['hero', 'features', 'specifications', 'howItWorks', 'faqs', 'reviews'];

  // Style CSS Variables & Rules mapping
  const style = eco.preferredStyle || 'modern_commerce';
  let cssVariables = `
    --primary: ${pc};
    --secondary: ${sc};
    --bg: #fafafa;
    --surface: #ffffff;
    --text: #17171f;
    --text-muted: #6b7280;
    --border: #e5e7eb;
    --radius: 12px;
  `;
  let additionalCss = '';

  if (style === 'tech_futuristic') {
    cssVariables = `
      --primary: ${pc};
      --secondary: ${sc};
      --bg: #090a0f;
      --surface: #12131a;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --border: #1f2937;
      --radius: 8px;
    `;
    additionalCss = `
      body { background: var(--bg); color: var(--text); }
      .product-hero, .section, footer { background: var(--surface); border-color: var(--border); }
      .spec-row { border-color: var(--border); }
      .spec-label { background: #181922; border-color: var(--border); }
      .spec-value { background: #12131a; }
      .step-card, .faq-item, .review-card { background: #181922; border-color: var(--border); }
      .option-btn { background: #181922; border-color: var(--border); color: #fff; }
      .qty-selector { background: #181922; border-color: var(--border); }
      .qty-btn, .qty-input { color: #fff; background: none; }
      .sticky-cart-bar { background: var(--surface); border-color: var(--border); }
      .shipping-box { background: #181922; border-color: var(--border); color: #fff; }
      .spotlight-image { border-color: var(--border); }
      h1, h2, h3, h4 { color: #fff; }
    `;
  } else if (style === 'soft_lifestyle') {
    cssVariables = `
      --primary: ${pc};
      --secondary: ${sc};
      --bg: #fdfbfb;
      --surface: #ffffff;
      --text: #292524;
      --text-muted: #78716c;
      --border: #f5ece5;
      --radius: 20px;
    `;
    additionalCss = `
      body { background: var(--bg); color: var(--text); }
      h1, h2, h3, h4 { font-family: '${headingFont}', serif; }
      .product-hero, .section, footer { background: var(--surface); border-color: var(--border); }
      .spec-row { border-color: var(--border); }
      .spec-label { background: #fdfbf7; border-color: var(--border); }
      .spec-value { background: #ffffff; }
      .step-card, .faq-item, .review-card { background: #fdfbf7; border-color: var(--border); border-radius: 24px; }
      .option-btn { background: #ffffff; border-color: var(--border); border-radius: 20px; }
      .qty-selector { background: #ffffff; border-color: var(--border); border-radius: 20px; }
      .sticky-cart-bar { background: #ffffff; border-color: var(--border); }
      .shipping-box { background: #fdfbf7; border-color: var(--border); }
    `;
  } else if (style === 'bold_conversion') {
    cssVariables = `
      --primary: ${pc};
      --secondary: ${sc};
      --bg: #0b0c10;
      --surface: #1f2833;
      --text: #c5c6c7;
      --text-muted: #a1a1aa;
      --border: #dc2626;
      --radius: 4px;
    `;
    additionalCss = `
      body { background: var(--bg); color: var(--text); }
      h1, h2, h3, h4 { font-family: '${headingFont}', sans-serif; text-transform: uppercase; font-weight: 800; color: #fff; }
      .product-hero, .section, footer { background: var(--bg); border-color: #27272a; }
      .btn-add-to-cart { background: var(--primary); border-radius: 4px; transform: skewX(-6deg); }
      .btn-buy-now { background: #fff; color: #000; border-radius: 4px; transform: skewX(-6deg); }
      .step-card, .faq-item, .review-card { background: #18181b; border-color: #27272a; }
      .option-btn { background: #0f0f11; border-color: #27272a; color: #fff; border-radius: 4px; }
      .qty-selector { background: #0f0f11; border-color: #27272a; border-radius: 4px; }
      .qty-btn, .qty-input { color: #fff; background: none; }
      .sticky-cart-bar { background: #18181b; border-color: #27272a; }
    `;
  } else if (style === 'luxury_editorial') {
    cssVariables = `
      --primary: #111111;
      --secondary: #d4af37;
      --bg: #faf9f6;
      --surface: #ffffff;
      --text: #111111;
      --text-muted: #555555;
      --border: #111111;
      --radius: 0px;
    `;
    additionalCss = `
      body { background: var(--bg); color: var(--text); }
      h1, h2, h3, h4 { font-family: '${headingFont}', serif; letter-spacing: 1.5px; text-transform: uppercase; }
      .product-hero, .section, footer { background: #ffffff; border-color: #eee; }
      .btn-add-to-cart { background: #000; border-radius: 0px; border: 1px solid #000; letter-spacing: 2px; }
      .btn-buy-now { background: transparent; color: #000; border: 1px solid #000; border-radius: 0px; }
      .btn-add-to-cart:hover { background: #fff; color: #000; }
      .btn-buy-now:hover { background: #000; color: #fff; }
      .step-card, .faq-item, .review-card { background: #ffffff; border: 1px solid #eee; border-radius: 0px; }
      .option-btn { background: #ffffff; border: 1px solid #111; border-radius: 0px; }
      .qty-selector { background: #ffffff; border: 1px solid #111; border-radius: 0px; }
      .sticky-cart-bar { background: #ffffff; border-top: 1px solid #111; }
    `;
  }

  // Build section HTML rendering functions
  const renderHero = () => `
    <section id="shop" class="product-hero">
      <div class="container">
        <div class="hero-grid">
          <div class="gallery-container">
            <div class="main-image-box">
              <img id="main-product-img" src="${mainImage}" alt="${title}" />
            </div>
            ${eco.images && eco.images.length > 1 ? `
            <div class="thumbnails">
              ${eco.images.map((img, i) => `
                <div class="thumbnail ${i === 0 ? 'active' : ''}" onclick="changeMainImage(this, '${img}')">
                  <img src="${img}" alt="Thumb ${i + 1}" />
                </div>
              `).join('')}
            </div>
            ` : ''}
          </div>

          <div class="product-info">
            <p class="product-meta">${result.seo.keywords?.[0] || 'Exclusive Offer'}</p>
            <h1 class="product-title">${title}</h1>
            
            <div class="rating-row">
              <span class="stars">★★★★★</span>
              <span>4.9/5</span>
              <span style="color: var(--text-muted)">(${result.testimonials.testimonials.length * 24}+ reviews)</span>
            </div>

            <div class="price-row">
              <span class="price">${priceVal}</span>
              <span class="compare-price">${compareVal}</span>
              <span class="discount-badge">Save 50%</span>
            </div>

            <p class="product-desc">
              ${result.homepage.hero.subheadline}
            </p>

            ${eco.variants && eco.variants.length > 0 ? eco.variants.map((v) => `
              <div class="option-group">
                <span class="option-label">${v.name}</span>
                <div class="option-values">
                  ${v.values.map((val, idx) => `
                    <button type="button" class="option-btn ${idx === 0 ? 'active' : ''}" onclick="changeVariant(this)">
                      ${val}
                    </button>
                  `).join('')}
                </div>
              </div>
            `).join('') : ''}

            <div class="option-group">
              <span class="option-label">Quantity</span>
              <div class="qty-selector">
                <button class="qty-btn" onclick="changeQty(-1)">-</button>
                <input type="text" id="qty-input" class="qty-input" value="1" readonly />
                <button class="qty-btn" onclick="changeQty(1)">+</button>
              </div>
            </div>

            <div class="purchase-actions">
              <button class="btn-add-to-cart" onclick="alert('Added to cart!')">Add to Cart</button>
              <button class="btn-buy-now" onclick="alert('Proceeding to instant checkout...')">Buy It Now</button>
            </div>

            <div class="shipping-box">
              🚚 <span>${eco.shippingText}</span>
            </div>

            <div class="trust-badges">
              ${eco.trustBadges.map((badge) => `
                <div class="badge">
                  <span class="badge-icon">✓</span>
                  <span>${badge}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  const renderFeatures = () => `
    ${eco.featureSections && eco.featureSections.length > 0 ? `
    <section id="features" class="section section-alt">
      <div class="container">
        <h2 class="section-title">Designed for Excellence</h2>
        <p class="section-subtitle">${result.homepage.socialProof}</p>
        
        <div class="feature-showcase">
          ${eco.featureSections.map((f, i) => `
            <div class="spotlight-row ${i % 2 === 1 ? 'reverse' : ''}">
              <div class="spotlight-image">
                <img src="${f.imageUrl || mainImage}" alt="${f.title}" />
              </div>
              <div class="spotlight-text">
                <h3>${f.title}</h3>
                <p>${f.description}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
    ` : `
    <section id="features" class="section section-alt">
      <div class="container">
        <h2 class="section-title">Core Benefits</h2>
        <p class="section-subtitle">${result.homepage.socialProof}</p>
        <div class="steps-grid">
          ${result.homepage.features.map((f) => `
            <div class="step-card">
              <h3>${f.title}</h3>
              <p>${f.description}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
    `}
  `;

  const renderSpecifications = () => `
    ${eco.specifications && eco.specifications.length > 0 ? `
    <section id="specifications" class="section">
      <div class="container">
        <h2 class="section-title">Product Specifications</h2>
        <p class="section-subtitle">Full details and technical capabilities</p>
        <div class="specs-table">
          ${eco.specifications.map((spec) => `
            <div class="spec-row">
              <div class="spec-label">${spec.label}</div>
              <div class="spec-value">${spec.value}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
    ` : ''}
  `;

  const renderHowItWorks = () => `
    ${eco.howItWorks && eco.howItWorks.length > 0 ? `
    <section id="how-it-works" class="section section-alt">
      <div class="container">
        <h2 class="section-title">How It Works</h2>
        <p class="section-subtitle">Get started with your new product in minutes</p>
        <div class="steps-grid">
          ${eco.howItWorks.map((step) => `
            <div class="step-card">
              <span class="step-num">${step.step}</span>
              <h3>${step.title}</h3>
              <p>${step.description}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
    ` : ''}
  `;

  const renderFaqs = () => `
    <section id="faqs" class="section">
      <div class="container">
        <h2 class="section-title">${result.faq.title}</h2>
        <p class="section-subtitle">${result.faq.subtitle}</p>
        <div class="faq-list">
          ${(eco.faq.length > 0 ? eco.faq : result.faq.items).map((item) => `
            <div class="faq-item">
              <h4>${item.question}</h4>
              <p>${item.answer}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;

  const renderReviews = () => `
    <section id="reviews" class="section section-alt">
      <div class="container">
        <h2 class="section-title">${result.testimonials.title}</h2>
        <p class="section-subtitle">${result.testimonials.subtitle}</p>
        <div class="reviews-grid">
          ${(eco.reviews.length > 0 ? eco.reviews.map(r => ({ name: r.author, rating: r.rating, quote: r.content, company: r.date, role: r.title })) : result.testimonials.testimonials).map((t) => `
            <div class="review-card">
              <div class="review-header">
                <span class="reviewer-name">${t.name}</span>
                <span class="review-date">${t.company}</span>
              </div>
              <div class="stars">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</div>
              <p class="review-title">${t.role}</p>
              <p class="review-body">"${t.quote}"</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;

  // Map section key to render function
  const sectionRenders: Record<string, () => string> = {
    hero: renderHero,
    features: renderFeatures,
    specifications: renderSpecifications,
    howItWorks: renderHowItWorks,
    faqs: renderFaqs,
    reviews: renderReviews
  };

  const renderedSectionsHtml = sectionOrder
    .map((key: string) => sectionRenders[key]?.() || '')
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${result.seo.title}</title>
  <meta name="description" content="${result.seo.metaDescription}"/>
  <link href="${fontsUrl}" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      ${cssVariables}
    }
    body {
      font-family: '${bodyFont}', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding-bottom: 80px;
    }
    h1, h2, h3, h4 { font-family: '${headingFont}', sans-serif; font-weight: 700; line-height: 1.25; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    
    .announcement-bar {
      background: var(--primary);
      color: #fff;
      text-align: center;
      padding: 8px 12px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 8px rgba(0,0,0,0.02);
    }
    header .container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 70px;
    }
    .logo {
      font-family: '${headingFont}', sans-serif;
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--primary);
      text-decoration: none;
      letter-spacing: -0.5px;
    }
    nav {
      display: flex;
      gap: 28px;
    }
    nav a {
      text-decoration: none;
      color: var(--text);
      font-size: 0.9rem;
      font-weight: 600;
      transition: color 0.2s;
    }
    nav a:hover { color: var(--primary); }
    .header-icons {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .cart-btn {
      position: relative;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.2rem;
    }
    .cart-badge {
      position: absolute;
      top: -6px;
      right: -8px;
      background: var(--primary);
      color: #fff;
      font-size: 0.65rem;
      font-weight: 700;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .product-hero {
      background: var(--surface);
      padding: 40px 0 60px;
      border-bottom: 1px solid var(--border);
    }
    .hero-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
      align-items: start;
    }
    
    .gallery-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .main-image-box {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      aspect-ratio: 1;
      background: #fbfbfb;
    }
    .main-image-box img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: opacity 0.2s;
    }
    .thumbnails {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 6px;
    }
    .thumbnail {
      width: 70px;
      height: 70px;
      border: 2px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      background: #fff;
      flex-shrink: 0;
      transition: border-color 0.2s;
    }
    .thumbnail:hover, .thumbnail.active {
      border-color: var(--primary);
    }
    .thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .product-info {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .product-meta {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--primary);
    }
    .product-title {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text);
    }
    .rating-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .stars { color: #f59e0b; font-size: 1rem; }
    
    .price-row {
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin: 4px 0;
    }
    .price {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--primary);
    }
    .compare-price {
      font-size: 1.4rem;
      text-decoration: line-through;
      color: var(--text-muted);
    }
    .discount-badge {
      background: rgba(34,197,94,0.12);
      color: #22c55e;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      text-transform: uppercase;
    }
    
    .product-desc {
      color: var(--text-muted);
      font-size: 0.95rem;
      line-height: 1.6;
    }

    .option-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .option-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text);
    }
    .option-values {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .option-btn {
      background: #fff;
      border: 1px solid var(--border);
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .option-btn:hover { border-color: var(--primary); }
    .option-btn.active {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
    }

    .qty-selector {
      display: flex;
      align-items: center;
      border: 1px solid var(--border);
      border-radius: 8px;
      width: 120px;
      background: #fff;
    }
    .qty-btn {
      background: none;
      border: none;
      width: 36px;
      height: 38px;
      cursor: pointer;
      font-weight: 700;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qty-input {
      border: none;
      width: 48px;
      text-align: center;
      font-weight: 700;
      font-size: 0.9rem;
      outline: none;
    }

    .purchase-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 10px;
    }
    .btn-add-to-cart {
      background: var(--primary);
      color: #fff;
      padding: 16px;
      border-radius: var(--radius);
      font-weight: 700;
      font-size: 1rem;
      border: none;
      cursor: pointer;
      transition: all 0.25s;
      box-shadow: 0 4px 16px var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .btn-add-to-cart:hover {
      opacity: 0.95;
      transform: translateY(-1px);
    }
    .btn-buy-now {
      background: #111;
      color: #fff;
      padding: 16px;
      border-radius: var(--radius);
      font-weight: 700;
      font-size: 1rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .btn-buy-now:hover { background: #000; }

    .shipping-box {
      border: 1px solid var(--border);
      background: #fbfbfb;
      padding: 14px 18px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #374151;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .trust-badges {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      border-top: 1px solid var(--border);
      padding-top: 20px;
      margin-top: 10px;
    }
    .badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
    }
    .badge-icon {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: rgba(34,197,94,0.1);
      color: #22c55e;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6rem;
    }

    .section { padding: 70px 0; border-bottom: 1px solid var(--border); }
    .section-alt { background: var(--surface); }
    .section-title { font-size: 1.75rem; font-weight: 800; text-align: center; margin-bottom: 12px; }
    .section-subtitle { font-size: 0.95rem; text-align: center; color: var(--text-muted); margin-bottom: 48px; max-width: 600px; margin-left: auto; margin-right: auto; }
    
    .feature-showcase {
      display: flex;
      flex-direction: column;
      gap: 60px;
    }
    .spotlight-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
      align-items: center;
    }
    .spotlight-row.reverse {
      direction: rtl;
    }
    .spotlight-row.reverse .spotlight-text {
      direction: ltr;
    }
    .spotlight-image {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      aspect-ratio: 4/3;
      background: #fff;
    }
    .spotlight-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .spotlight-text {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .spotlight-text h3 {
      font-size: 1.6rem;
      font-weight: 800;
    }
    .spotlight-text p {
      color: var(--text-muted);
      font-size: 0.95rem;
      line-height: 1.6;
    }

    .specs-table {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }
    .spec-row {
      display: grid;
      grid-template-columns: 1fr 2fr;
      border-bottom: 1px solid var(--border);
    }
    .spec-row:last-child { border-bottom: none; }
    .spec-label {
      background: #fbfbfb;
      padding: 14px 20px;
      font-weight: 700;
      font-size: 0.85rem;
      border-right: 1px solid var(--border);
    }
    .spec-value {
      background: #fff;
      padding: 14px 20px;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .steps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 32px;
    }
    .step-card {
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 32px;
      border-radius: var(--radius);
      position: relative;
    }
    .step-num {
      position: absolute;
      top: 24px;
      right: 24px;
      font-size: 2rem;
      font-weight: 800;
      color: var(--primary);
      opacity: 0.15;
    }
    .step-card h3 {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .step-card p {
      color: var(--text-muted);
      font-size: 0.88rem;
    }

    .faq-list {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .faq-item {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px 24px;
    }
    .faq-item h4 { font-size: 0.95rem; font-weight: 700; margin-bottom: 8px; }
    .faq-item p { color: var(--text-muted); font-size: 0.88rem; }

    .reviews-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
    }
    .review-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .reviewer-name { font-weight: 700; font-size: 0.9rem; }
    .review-date { font-size: 0.75rem; color: var(--text-muted); }
    .review-title { font-weight: 700; font-size: 0.95rem; }
    .review-body { color: var(--text-muted); font-size: 0.88rem; line-height: 1.6; }
    
    footer {
      background: #111;
      color: #fff;
      padding: 60px 0 30px;
      border-top: 1px solid #222;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 40px;
      margin-bottom: 40px;
    }
    .footer-grid h4 {
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 20px;
      color: #fff;
    }
    .footer-grid a {
      display: block;
      color: #9ca3af;
      text-decoration: none;
      font-size: 0.85rem;
      padding: 6px 0;
      transition: color 0.2s;
    }
    .footer-grid a:hover { color: var(--primary); }
    .footer-bottom {
      border-top: 1px solid #222;
      padding-top: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 0.8rem;
      color: #6b7280;
    }

    .sticky-cart-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--surface);
      border-top: 1px solid var(--border);
      padding: 12px 0;
      z-index: 99;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
    }
    .sticky-bar-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }
    .sticky-product-details {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .sticky-thumb {
      width: 48px;
      height: 48px;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid var(--border);
    }
    .sticky-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .sticky-title { font-weight: 700; font-size: 0.88rem; color: var(--text); }
    .sticky-price { font-weight: 800; font-size: 0.95rem; color: var(--primary); }
    .sticky-btn {
      background: var(--primary);
      color: #fff;
      border: none;
      padding: 10px 24px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }

    @media (max-width: 768px) {
      .hero-grid { grid-template-columns: 1fr; gap: 32px; }
      .spotlight-row { grid-template-columns: 1fr; gap: 24px; }
      .spotlight-row.reverse { direction: ltr; }
      .sticky-product-details { display: none; }
      .sticky-btn { width: 100%; }
      header nav { display: none; }
    }
    ${additionalCss}
  </style>
  <script>
    function changeMainImage(element, url) {
      document.getElementById('main-product-img').src = url;
      const ths = document.getElementsByClassName('thumbnail');
      for (let i = 0; i < ths.length; i++) {
        ths[i].classList.remove('active');
      }
      element.classList.add('active');
    }
    
    function changeVariant(element) {
      const parent = element.parentElement;
      const btns = parent.getElementsByClassName('option-btn');
      for (let i = 0; i < btns.length; i++) {
        btns[i].classList.remove('active');
      }
      element.classList.add('active');
    }
    
    function changeQty(delta) {
      const input = document.getElementById('qty-input');
      let val = parseInt(input.value) || 1;
      val += delta;
      if (val < 1) val = 1;
      input.value = val;
    }
  </script>
</head>
<body>
  <div class="announcement-bar">
    ${eco.announcementBar}
  </div>

  <header>
    <div class="container">
      <a href="#" class="logo">${input.businessName}</a>
      <nav>
        ${eco.navigation.map((n) => `<a href="#${n.toLowerCase().replace(/ /g, '-')}">${n}</a>`).join('\n        ')}
      </nav>
      <div class="header-icons">
        <button class="cart-btn">🛒<span class="cart-badge">0</span></button>
      </div>
    </div>
  </header>

  ${renderedSectionsHtml}

  <footer>
    <div class="container">
      <div class="footer-grid">
        <div>
          <h4 style="color: var(--primary)">${input.businessName}</h4>
          <p style="color: #6b7280; font-size: 0.8rem; line-height: 1.6; margin-top: 12px;">
            ${result.footer.tagline}
          </p>
        </div>
        ${result.footer.columns.map((col) => `
          <div>
            <h4>${col.title}</h4>
            ${col.links.map((link) => `<a href="${link.url}">${link.label}</a>`).join('')}
          </div>
        `).join('')}
      </div>
      <div class="footer-bottom">
        <p>${result.footer.copyright}</p>
        <div class="payment-icons">
          💳 Visa • Mastercard • PayPal • Apple Pay
        </div>
      </div>
    </div>
  </footer>

  <div class="sticky-cart-bar">
    <div class="container">
      <div class="sticky-bar-content">
        <div class="sticky-product-details">
          <div class="sticky-thumb">
            <img src="${mainImage}" alt="${title}" />
          </div>
          <div>
            <p class="sticky-title">${title}</p>
            <p class="sticky-price">${priceVal}</p>
          </div>
        </div>
        <button class="sticky-btn" onclick="alert('Instant Checkout!')">${eco.stickyAddToCartText || 'Buy Now'}</button>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ════════════════════════════════════════════════════════════════
// Preview HTML Generator
// ════════════════════════════════════════════════════════════════

function generatePreviewHtml(result: WebsiteGeneration, input: WebsiteBuilderInput): string {
  if (result.ecommerce) {
    return generateEcommerceHtml(result, input);
  }

  const pc = input.primaryColor;
  const sc = input.secondaryColor;
  const headingFont = result.branding.typography.heading || 'Inter';
  const bodyFont = result.branding.typography.body || 'Inter';
  const fontsUrl = result.branding.typography.googleFontsUrl || `https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@400;600;700;800&family=${bodyFont.replace(/ /g, '+')}:wght@300;400;500;600&display=swap`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${result.seo.title}</title>
  <meta name="description" content="${result.seo.metaDescription}"/>
  <link href="${fontsUrl}" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: '${bodyFont}', sans-serif; color: #1a1a2e; background: #fff; line-height: 1.6; }
    h1, h2, h3, h4 { font-family: '${headingFont}', sans-serif; line-height: 1.2; }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    nav { background: #fff; border-bottom: 1px solid #eee; padding: 16px 0; position: sticky; top: 0; z-index: 100; }
    nav .container { display: flex; align-items: center; justify-content: space-between; }
    nav .logo { font-family: '${headingFont}', sans-serif; font-size: 1.4rem; font-weight: 800; color: ${pc}; text-decoration: none; }
    nav .links { display: flex; gap: 24px; list-style: none; }
    nav .links a { text-decoration: none; color: #555; font-size: 0.9rem; font-weight: 500; transition: color 0.2s; }
    nav .links a:hover { color: ${pc}; }
    .hero { background: linear-gradient(135deg, ${pc} 0%, ${sc} 100%); color: #fff; padding: 100px 0 80px; text-align: center; }
    .hero h1 { font-size: 3rem; font-weight: 800; margin-bottom: 16px; }
    .hero p { font-size: 1.15rem; opacity: 0.9; max-width: 600px; margin: 0 auto 32px; }
    .hero .cta-group { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .btn-p { background: #fff; color: ${pc}; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 0.95rem; border: none; cursor: pointer; text-decoration: none; display: inline-block; transition: transform 0.2s; }
    .btn-p:hover { transform: translateY(-2px); }
    .btn-s { background: transparent; color: #fff; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 0.95rem; border: 2px solid rgba(255,255,255,0.4); cursor: pointer; text-decoration: none; display: inline-block; transition: all 0.2s; }
    .btn-s:hover { background: rgba(255,255,255,0.1); }
    .section { padding: 80px 0; }
    .section-alt { background: #f8f9fa; }
    .section-title { font-size: 2rem; font-weight: 800; text-align: center; margin-bottom: 8px; }
    .section-sub { text-align: center; color: #666; margin-bottom: 48px; font-size: 1.05rem; }
    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
    .feature-card { background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 32px 24px; text-align: center; transition: box-shadow 0.3s; }
    .feature-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.08); }
    .feature-icon { font-size: 2.5rem; margin-bottom: 16px; }
    .feature-card h3 { font-size: 1.15rem; font-weight: 700; margin-bottom: 8px; }
    .feature-card p { color: #666; font-size: 0.9rem; }
    .about-content { max-width: 700px; margin: 0 auto; text-align: center; }
    .about-content p { color: #555; font-size: 1rem; margin-bottom: 24px; }
    .values-list { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 20px; }
    .value-tag { background: ${pc}10; color: ${pc}; padding: 8px 20px; border-radius: 24px; font-size: 0.85rem; font-weight: 600; border: 1px solid ${pc}25; }
    .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
    .service-card { background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 28px; transition: box-shadow 0.3s; }
    .service-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.08); }
    .service-card .svc-icon { font-size: 2rem; margin-bottom: 12px; }
    .service-card h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
    .service-card p { color: #666; font-size: 0.9rem; margin-bottom: 12px; }
    .service-card ul { list-style: none; padding: 0; }
    .service-card ul li { font-size: 0.85rem; color: #555; padding: 4px 0; }
    .service-card ul li::before { content: '✓ '; color: ${pc}; font-weight: 700; }
    .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; max-width: 960px; margin: 0 auto; }
    .pricing-card { background: #fff; border: 1px solid #eee; border-radius: 16px; padding: 36px 28px; text-align: center; position: relative; transition: box-shadow 0.3s; }
    .pricing-card.popular { border-color: ${pc}; box-shadow: 0 8px 32px ${pc}20; }
    .pricing-card.popular::before { content: 'Most Popular'; position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: ${pc}; color: #fff; padding: 4px 16px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
    .pricing-card h3 { font-size: 1.2rem; font-weight: 700; margin-bottom: 8px; }
    .pricing-card .price { font-size: 2.5rem; font-weight: 800; color: ${pc}; }
    .pricing-card .period { color: #999; font-size: 0.85rem; }
    .pricing-card .desc { color: #666; font-size: 0.9rem; margin: 16px 0; }
    .pricing-card ul { list-style: none; padding: 0; margin: 20px 0; text-align: left; }
    .pricing-card ul li { font-size: 0.88rem; color: #555; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
    .pricing-card ul li::before { content: '✓ '; color: ${pc}; font-weight: 700; }
    .pricing-card .pricing-cta { display: block; width: 100%; padding: 14px; border-radius: 8px; font-weight: 700; font-size: 0.95rem; border: none; cursor: pointer; transition: all 0.2s; }
    .pricing-card.popular .pricing-cta { background: ${pc}; color: #fff; }
    .pricing-card:not(.popular) .pricing-cta { background: #f5f5f5; color: #333; }
    .faq-list { max-width: 700px; margin: 0 auto; }
    .faq-item { border-bottom: 1px solid #eee; padding: 20px 0; }
    .faq-item h4 { font-size: 1rem; font-weight: 700; margin-bottom: 8px; color: #1a1a2e; }
    .faq-item p { color: #666; font-size: 0.9rem; line-height: 1.7; }
    .testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
    .testimonial-card { background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 28px; }
    .testimonial-card .stars { color: #f59e0b; margin-bottom: 12px; font-size: 1.1rem; }
    .testimonial-card blockquote { color: #555; font-size: 0.95rem; font-style: italic; margin-bottom: 16px; line-height: 1.7; }
    .testimonial-card .author { font-weight: 700; font-size: 0.9rem; }
    .testimonial-card .role { color: #999; font-size: 0.8rem; }
    .contact-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start; }
    .contact-info h3 { font-size: 1.3rem; font-weight: 700; margin-bottom: 16px; }
    .contact-info p { color: #666; font-size: 0.95rem; margin-bottom: 24px; }
    .contact-info .info-item { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; color: #555; font-size: 0.9rem; }
    .contact-info .info-item span { font-size: 1.2rem; }
    .contact-form input, .contact-form textarea { width: 100%; padding: 12px 16px; border: 1px solid #ddd; border-radius: 8px; font-size: 0.9rem; margin-bottom: 12px; font-family: inherit; }
    .contact-form textarea { resize: vertical; min-height: 120px; }
    .contact-form button { background: ${pc}; color: #fff; padding: 14px 32px; border: none; border-radius: 8px; font-weight: 700; font-size: 0.95rem; cursor: pointer; width: 100%; }
    footer { background: #1a1a2e; color: #fff; padding: 60px 0 24px; }
    .footer-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 32px; margin-bottom: 40px; }
    .footer-grid h4 { font-size: 0.9rem; font-weight: 700; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; }
    .footer-grid a { display: block; color: #aaa; text-decoration: none; font-size: 0.85rem; padding: 4px 0; transition: color 0.2s; }
    .footer-grid a:hover { color: ${pc}; }
    .footer-bottom { border-top: 1px solid #333; padding-top: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .footer-bottom p { color: #666; font-size: 0.8rem; }
    .social-links { display: flex; gap: 12px; }
    .social-links a { color: #888; text-decoration: none; font-size: 0.85rem; transition: color 0.2s; }
    .social-links a:hover { color: ${pc}; }
    @media (max-width: 768px) {
      .hero h1 { font-size: 2rem; }
      .contact-section { grid-template-columns: 1fr; }
      nav .links { display: none; }
    }
  </style>
</head>
<body>
  <nav>
    <div class="container">
      <a href="#" class="logo">${input.businessName}</a>
      <ul class="links">
        <li><a href="#features">Features</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#services">Services</a></li>
        <li><a href="#pricing">Pricing</a></li>
        <li><a href="#faq">FAQ</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </div>
  </nav>

  <section class="hero">
    <div class="container">
      <h1>${result.homepage.hero.headline}</h1>
      <p>${result.homepage.hero.subheadline}</p>
      <div class="cta-group">
        ${result.homepage.hero.ctaButtons.map((btn, i) => `<a href="${btn.url}" class="${i === 0 ? 'btn-p' : 'btn-s'}">${btn.label}</a>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section id="features" class="section">
    <div class="container">
      <h2 class="section-title">Why Choose ${input.businessName}</h2>
      <p class="section-sub">${result.homepage.socialProof}</p>
      <div class="features-grid">
        ${result.homepage.features.map(f => `<div class="feature-card">
          <div class="feature-icon">${f.icon}</div>
          <h3>${f.title}</h3>
          <p>${f.description}</p>
        </div>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section id="about" class="section section-alt">
    <div class="container">
      <h2 class="section-title">${result.about.title}</h2>
      <div class="about-content">
        <p>${result.about.content}</p>
        <p><strong>Mission:</strong> ${result.about.mission}</p>
        <p><strong>Vision:</strong> ${result.about.vision}</p>
        <div class="values-list">
          ${result.about.values.map(v => `<span class="value-tag">${v}</span>`).join('\n          ')}
        </div>
      </div>
    </div>
  </section>

  <section id="services" class="section">
    <div class="container">
      <h2 class="section-title">${result.services.title}</h2>
      <p class="section-sub">${result.services.subtitle}</p>
      <div class="services-grid">
        ${result.services.services.map(s => `<div class="service-card">
          <div class="svc-icon">${s.icon}</div>
          <h3>${s.title}</h3>
          <p>${s.description}</p>
          <ul>${s.features.map(f => `<li>${f}</li>`).join('')}</ul>
        </div>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section id="pricing" class="section section-alt">
    <div class="container">
      <h2 class="section-title">${result.pricing.title}</h2>
      <p class="section-sub">${result.pricing.subtitle}</p>
      <div class="pricing-grid">
        ${result.pricing.plans.map(plan => `<div class="pricing-card${plan.isPopular ? ' popular' : ''}">
          <h3>${plan.name}</h3>
          <div class="price">${plan.price}</div>
          <div class="period">${plan.period}</div>
          <p class="desc">${plan.description}</p>
          <ul>${plan.features.map(f => `<li>${f}</li>`).join('')}</ul>
          <button class="pricing-cta">${plan.cta}</button>
        </div>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section id="faq" class="section">
    <div class="container">
      <h2 class="section-title">${result.faq.title}</h2>
      <p class="section-sub">${result.faq.subtitle}</p>
      <div class="faq-list">
        ${result.faq.items.map(item => `<div class="faq-item">
          <h4>${item.question}</h4>
          <p>${item.answer}</p>
        </div>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="section section-alt">
    <div class="container">
      <h2 class="section-title">${result.testimonials.title}</h2>
      <p class="section-sub">${result.testimonials.subtitle}</p>
      <div class="testimonials-grid">
        ${result.testimonials.testimonials.map(t => `<div class="testimonial-card">
          <div class="stars">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</div>
          <blockquote>"${t.quote}"</blockquote>
          <div class="author">${t.name}</div>
          <div class="role">${t.role}, ${t.company}</div>
        </div>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section id="contact" class="section">
    <div class="container">
      <h2 class="section-title">${result.contact.title}</h2>
      <p class="section-sub">${result.contact.subtitle}</p>
      <div class="contact-section">
        <div class="contact-info">
          <h3>Get in Touch</h3>
          <p>We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
          <div class="info-item"><span>📧</span> ${result.contact.email}</div>
          <div class="info-item"><span>📞</span> ${result.contact.phone}</div>
          <div class="info-item"><span>📍</span> ${result.contact.address}</div>
        </div>
        <form class="contact-form" onsubmit="event.preventDefault()">
          ${result.contact.formFields.map(f => f.type === 'textarea'
            ? `<textarea placeholder="${f.placeholder}"${f.required ? ' required' : ''}></textarea>`
            : `<input type="${f.type}" placeholder="${f.placeholder}"${f.required ? ' required' : ''}/>`
          ).join('\n          ')}
          <button type="submit">Send Message</button>
        </form>
      </div>
    </div>
  </section>

  <footer>
    <div class="container">
      <div class="footer-grid">
        ${result.footer.columns.map(col => `<div>
          <h4>${col.title}</h4>
          ${col.links.map(link => `<a href="${link.url}">${link.label}</a>`).join('\n          ')}
        </div>`).join('\n        ')}
      </div>
      <div class="footer-bottom">
        <p>${result.footer.copyright}</p>
        <div class="social-links">
          ${result.footer.socialLinks.map(s => `<a href="${s.url}">${s.icon} ${s.platform}</a>`).join('\n          ')}
        </div>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

// ════════════════════════════════════════════════════════════════
// Export Helpers
// ════════════════════════════════════════════════════════════════

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateReactExport(result: WebsiteGeneration, input: WebsiteBuilderInput): string {
  const pc = input.primaryColor;
  const sc = input.secondaryColor;
  return `import React from 'react';

export default function ${input.businessName.replace(/[^a-zA-Z0-9]/g, '')}Website() {
  return (
    <div style={{ fontFamily: "'${result.branding.typography.body}', sans-serif", color: '#1a1a2e' }}>
      {/* Navigation */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '16px 0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="#" style={{ fontFamily: "'${result.branding.typography.heading}', sans-serif", fontSize: '1.4rem', fontWeight: 800, color: '${pc}', textDecoration: 'none' }}>
            ${input.businessName}
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, ${pc} 0%, ${sc} 100%)', color: '#fff', padding: '100px 0 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: 16, fontFamily: "'${result.branding.typography.heading}', sans-serif" }}>
            ${result.homepage.hero.headline}
          </h1>
          <p style={{ fontSize: '1.15rem', opacity: 0.9, maxWidth: 600, margin: '0 auto 32px' }}>
            ${result.homepage.hero.subheadline}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            ${result.homepage.hero.ctaButtons.map((btn, i) =>
              `<a href="${btn.url}" style={{ ${i === 0
                ? `background: '#fff', color: '${pc}', padding: '14px 32px', borderRadius: 8, fontWeight: 700, textDecoration: 'none'`
                : `background: 'transparent', color: '#fff', padding: '14px 32px', borderRadius: 8, fontWeight: 700, border: '2px solid rgba(255,255,255,0.4)', textDecoration: 'none'`
              } }}>${btn.label}</a>`
            ).join('\n            ')}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, textAlign: 'center', marginBottom: 48, fontFamily: "'${result.branding.typography.heading}', sans-serif" }}>
            Why Choose ${input.businessName}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {${JSON.stringify(result.homepage.features)}.map((feature, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>{feature.icon}</div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 8 }}>{feature.title}</h3>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#1a1a2e', color: '#fff', padding: '60px 0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <p style={{ color: '#666', fontSize: '0.8rem' }}>${result.footer.copyright}</p>
        </div>
      </footer>
    </div>
  );
}
`;
}

function generateNextjsExport(result: WebsiteGeneration, input: WebsiteBuilderInput): string {
  return `import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${result.seo.title}',
  description: '${result.seo.metaDescription}',
  openGraph: {
    title: '${result.seo.ogTitle}',
    description: '${result.seo.ogDescription}',
  },
};

${generateReactExport(result, input)}`;
}

function generateTailwindExport(result: WebsiteGeneration, input: WebsiteBuilderInput): string {
  const pc = input.primaryColor;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${result.seo.title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white text-gray-900">
  <nav class="bg-white border-b border-gray-100 sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      <a href="#" class="text-xl font-extrabold" style="color: ${pc}">${input.businessName}</a>
      <div class="hidden md:flex gap-6">
        <a href="#features" class="text-sm text-gray-500 hover:text-gray-900">Features</a>
        <a href="#about" class="text-sm text-gray-500 hover:text-gray-900">About</a>
        <a href="#pricing" class="text-sm text-gray-500 hover:text-gray-900">Pricing</a>
        <a href="#contact" class="text-sm text-gray-500 hover:text-gray-900">Contact</a>
      </div>
    </div>
  </nav>

  <section class="py-24 text-center text-white" style="background: linear-gradient(135deg, ${pc}, ${input.secondaryColor})">
    <div class="max-w-3xl mx-auto px-6">
      <h1 class="text-4xl md:text-5xl font-extrabold mb-4">${result.homepage.hero.headline}</h1>
      <p class="text-lg opacity-90 mb-8">${result.homepage.hero.subheadline}</p>
      <div class="flex gap-3 justify-center flex-wrap">
        ${result.homepage.hero.ctaButtons.map((btn, i) =>
          i === 0
            ? `<a href="${btn.url}" class="bg-white font-bold py-3 px-8 rounded-lg" style="color: ${pc}">${btn.label}</a>`
            : `<a href="${btn.url}" class="border-2 border-white/40 font-bold py-3 px-8 rounded-lg text-white hover:bg-white/10">${btn.label}</a>`
        ).join('\n        ')}
      </div>
    </div>
  </section>

  <section id="features" class="py-20">
    <div class="max-w-6xl mx-auto px-6">
      <h2 class="text-3xl font-extrabold text-center mb-12">Why Choose ${input.businessName}</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${result.homepage.features.map(f => `<div class="border border-gray-100 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
          <div class="text-4xl mb-4">${f.icon}</div>
          <h3 class="text-lg font-bold mb-2">${f.title}</h3>
          <p class="text-gray-500 text-sm">${f.description}</p>
        </div>`).join('\n        ')}
      </div>
    </div>
  </section>

  <footer class="bg-gray-900 text-white py-12">
    <div class="max-w-6xl mx-auto px-6 text-center">
      <p class="text-gray-500 text-sm">${result.footer.copyright}</p>
    </div>
  </footer>
</body>
</html>`;
}

// ════════════════════════════════════════════════════════════════
// Shopify Deploy Modal
// ════════════════════════════════════════════════════════════════

const SHOPIFY_CREDS_KEY = 'rootx_shopify_creds_demo';

function ShopifyDeployModal({
  isOpen,
  onClose,
  generation,
  input,
}: {
  isOpen: boolean;
  onClose: () => void;
  generation: WebsiteGeneration;
  input: WebsiteBuilderInput;
}) {
  // Connection
  const [storeDomain, setStoreDomain] = useState('');
  const [shopName, setShopName] = useState('');
  const [isServerConnected, setIsServerConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);

  const [oauthStatus, setOauthStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [oauthErr, setOauthErr] = useState('');

  // Deploy state
  const [deployStatus, setDeployStatus] = useState<ThemeDeployStatus>('idle');
  const [themeId, setThemeId] = useState<number | null>(null);
  const [themeName, setThemeName] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState({ uploaded: 0, total: 0 });
  const [deployError, setDeployError] = useState('');
  const [fileErrors, setFileErrors] = useState<string[]>([]);

  // Check connection status
  useEffect(() => {
    if (!isOpen) return;
    async function checkConnection() {
      try {
        const res = await authenticatedFetch('/api/shopify/connect');
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.connected) {
          setIsServerConnected(true);
          setStoreDomain(data.storeDomain);
          setShopName(data.shopName || data.storeDomain);
        } else {
          setIsServerConnected(false);
        }
      } catch (err) {
        console.error('Failed to check connection:', err);
      } finally {
        setCheckingConnection(false);
      }
    }
    checkConnection();
  }, [isOpen]);

  async function handleOAuth(e: React.FormEvent) {
    e.preventDefault();
    setOauthStatus('loading');
    setOauthErr('');
    let d = storeDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!d) {
      setOauthErr('Store URL is required');
      setOauthStatus('error');
      return;
    }
    if (!d.includes('.')) {
      d = `${d}.myshopify.com`;
    }
    try {
      const res = await authenticatedFetch('/api/shopify/oauth', {
        method: 'POST',
        body: JSON.stringify({ storeDomain: d, redirectPath: window.location.pathname }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to start OAuth session');
      if (data.redirectUrl) {
        window.top!.location.href = data.redirectUrl;
      } else {
        throw new Error('No authorization URL returned from server');
      }
    } catch (err) {
      setOauthErr(err instanceof Error ? err.message : 'OAuth failed');
      setOauthStatus('error');
    }
  }

  async function handleDisconnect() {
    try {
      if (isServerConnected) {
        await authenticatedFetch('/api/shopify/connect', { method: 'DELETE' });
      }
    } catch (err) {
      console.error('Failed to disconnect store server-side:', err);
    }
    setStoreDomain('');
    setShopName('');
    setIsServerConnected(false);
  }

  async function handleDeploy() {
    if (!storeDomain.trim() || !isServerConnected) return;

    setDeployError('');
    setFileErrors([]);

    // Step 1: Generate theme files
    setDeployStatus('generating-files');
    let files: ShopifyThemeFile[];
    try {
      files = generateShopifyTheme(generation, input);
      setUploadProgress({ uploaded: 0, total: files.length });
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : 'Theme generation failed');
      setDeployStatus('error');
      return;
    }

    // Step 2: Create theme + upload to Shopify
    setDeployStatus('creating');
    const name = `${input.businessName || 'RootX'} Theme — ${new Date().toLocaleDateString()}`;
    setThemeName(name);

    try {
      const res = await authenticatedFetch('/api/shopify/theme', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          storeDomain: storeDomain.trim(),
          accessToken: 'oauth',
          themeName: name,
          files,
        }),
      });
      const data: ThemeCreateResponse = await res.json();
      if (!data.success) throw new Error(data.error || 'Theme upload failed');

      setThemeId(data.themeId ?? null);
      setPreviewUrl(data.previewUrl ?? '');
      setThemeName(data.themeName ?? name);
      setUploadProgress({ uploaded: data.uploadedCount ?? 0, total: data.totalCount ?? files.length });
      if (data.errors && data.errors.length > 0) setFileErrors(data.errors);
      setDeployStatus('done');
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : 'Theme upload failed');
      setDeployStatus('error');
      return;
    }
  }

  async function handlePublish() {
    if (!themeId) return;
    setDeployStatus('publishing');
    try {
      const res = await authenticatedFetch('/api/shopify/theme', {
        method: 'POST',
        body: JSON.stringify({
          action: 'publish',
          storeDomain: storeDomain.trim(),
          accessToken: 'oauth',
          themeId,
        }),
      });
      const data: ThemePublishResponse = await res.json();
      if (!data.success) throw new Error(data.error || 'Publish failed');
      setDeployStatus('published');
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : 'Publish failed');
      setDeployStatus('error');
    }
  }

  function handleReset() {
    setDeployStatus('idle');
    setThemeId(null);
    setPreviewUrl('');
    setDeployError('');
    setFileErrors([]);
    setUploadProgress({ uploaded: 0, total: 0 });
  }

  if (!isOpen) return null;

  const isWorking = ['connecting', 'generating-files', 'creating', 'uploading', 'publishing'].includes(deployStatus);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !isWorking) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden animate-fade-up"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(150,191,71,0.12)', border: '1px solid rgba(150,191,71,0.25)' }}>
              <ShoppingBag size={20} style={{ color: '#96bf47' }} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Deploy to Shopify</h3>
              <p className="text-xs" style={{ color: '#71717a' }}>Upload as Shopify Online Store 2.0 theme</p>
            </div>
          </div>
          {!isWorking && (
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', color: '#71717a' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* ── IDLE: Connection form ── */}
          {deployStatus === 'idle' && (
            <>
              {checkingConnection ? (
                <div className="text-center py-6">
                  <Loader2 size={24} className="animate-spin mx-auto mb-2" style={{ color: '#96bf47' }} />
                  <p className="text-xs" style={{ color: '#71717a' }}>Checking connection status...</p>
                </div>
              ) : shopName ? (
                // Connected store
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                    <CheckCircle2 size={16} style={{ color: '#22c55e' }} />
                    <span className="text-xs" style={{ color: '#22c55e' }}>Connected to <strong>{shopName}</strong></span>
                    <button onClick={handleDisconnect} className="ml-auto text-xs font-semibold underline" style={{ color: '#71717a' }}>Disconnect</button>
                  </div>

                  <p className="text-xs leading-relaxed" style={{ color: '#a1a1aa' }}>
                    Your store is connected successfully! Click below to build and deploy your dropshipping store theme.
                  </p>

                  <button
                    onClick={handleDeploy}
                    className="btn-primary w-full py-3 font-bold flex items-center justify-center gap-2 transition-all"
                    style={{ background: 'linear-gradient(135deg, #96bf47, #5c8a1f)', color: '#fff', border: 'none' }}
                  >
                    <Upload size={16} /> Build & Deploy Theme
                  </button>
                </div>
              ) : (
                // Not connected: show OAuth connection form
                <form onSubmit={handleOAuth} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Store Domain *</label>
                    <input
                      type="text"
                      placeholder="your-store.myshopify.com"
                      value={storeDomain}
                      onChange={(e) => setStoreDomain(e.target.value)}
                      className="input-field w-full"
                    />
                  </div>

                  {oauthErr && (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
                      style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.12)' }}>
                      <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                      <p className="text-xs" style={{ color: '#fca5a5' }}>{oauthErr}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={oauthStatus === 'loading'}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {oauthStatus === 'loading' ? <><Loader2 size={16} className="animate-spin" /> Connecting…</> :
                      <><Plug size={16} /> Connect Shopify Store</>}
                  </button>

                </form>
              )}
            </>
          )}

          {/* ── WORKING: Progress ── */}
          {isWorking && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(150,191,71,0.1)', border: '1px solid rgba(150,191,71,0.2)' }}>
                <Loader2 size={28} className="animate-spin" style={{ color: '#96bf47' }} />
              </div>
              <div className="text-center">
                <p className="font-bold text-sm mb-1">
                  {deployStatus === 'connecting' && 'Connecting to Shopify...'}
                  {deployStatus === 'generating-files' && 'Generating theme files...'}
                  {deployStatus === 'creating' && 'Creating theme & uploading files...'}
                  {deployStatus === 'uploading' && `Uploading files (${uploadProgress.uploaded}/${uploadProgress.total})...`}
                  {deployStatus === 'publishing' && 'Publishing theme...'}
                </p>
                <p className="text-xs" style={{ color: '#71717a' }}>
                  {deployStatus === 'creating' && 'This may take 30-60 seconds due to Shopify API rate limits.'}
                  {deployStatus === 'publishing' && 'Making your theme the live store theme.'}
                  {deployStatus === 'connecting' && 'Verifying your store credentials.'}
                  {deployStatus === 'generating-files' && 'Converting your website into Shopify Liquid templates.'}
                </p>
              </div>
              {uploadProgress.total > 0 && (
                <div className="w-full">
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round((uploadProgress.uploaded / uploadProgress.total) * 100)}%`,
                        background: 'linear-gradient(90deg, #96bf47, #5c8a1f)',
                      }}
                    />
                  </div>
                  <p className="text-xs text-center mt-1.5" style={{ color: '#52525b' }}>
                    {uploadProgress.uploaded} / {uploadProgress.total} files
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── DONE: Success ── */}
          {(deployStatus === 'done' || deployStatus === 'published') && (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col items-center gap-2 mb-2">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                  <CheckCircle2 size={32} style={{ color: '#22c55e' }} />
                </div>
                <p className="font-bold text-lg">
                  {deployStatus === 'published' ? 'Theme Published! 🎉' : 'Theme Uploaded!'}
                </p>
              </div>

              {/* Theme details */}
              <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)' }}>
                {[
                  { label: 'Theme Name', value: themeName },
                  { label: 'Theme ID', value: String(themeId) },
                  { label: 'Store', value: shopName || storeDomain },
                  { label: 'Files Uploaded', value: `${uploadProgress.uploaded}/${uploadProgress.total}` },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-xs">
                    <span style={{ color: '#71717a' }}>{row.label}</span>
                    <span className="font-mono font-bold">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* File errors (non-fatal) */}
              {fileErrors.length > 0 && (
                <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: '#f59e0b' }}>⚠ {fileErrors.length} file(s) had upload issues:</p>
                  {fileErrors.slice(0, 5).map((e, i) => (
                    <p key={i} className="text-xs" style={{ color: '#92400e' }}>{e}</p>
                  ))}
                  {fileErrors.length > 5 && <p className="text-xs" style={{ color: '#92400e' }}>...and {fileErrors.length - 5} more</p>}
                </div>
              )}

              {/* Preview URL */}
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: 'rgba(150,191,71,0.1)',
                    border: '1px solid rgba(150,191,71,0.25)',
                    color: '#96bf47',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={16} /> Preview Theme in Browser
                </a>
              )}

              {/* Publish button */}
              {deployStatus === 'done' && (
                <button
                  onClick={handlePublish}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #96bf47, #5c8a1f)',
                    color: '#fff',
                    border: 'none',
                  }}
                >
                  <Globe size={16} /> Publish Theme (Make Live)
                </button>
              )}

              {deployStatus === 'published' && (
                <div className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
                  <CheckCircle2 size={16} /> Theme is now your live store theme!
                </div>
              )}
            </div>
          )}

          {/* ── ERROR ── */}
          {deployStatus === 'error' && (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)' }}>
                  <AlertTriangle size={28} style={{ color: '#ef4444' }} />
                </div>
                <p className="font-bold">Deployment Failed</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}>
                <p className="text-xs" style={{ color: '#fca5a5' }}>{deployError}</p>
              </div>
              <button onClick={handleReset} className="btn-primary w-full" style={{ justifyContent: 'center' }}>
                <RefreshCw size={16} /> Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



// Helper to get current timestamp avoiding render impurity flags
function getTimestamp(): number {
  return Date.now();
}

interface ApifyProduct {
  url: string;
  title: string;
  images?: string[];
  description?: string;
  price?: string;
  originalPrice?: string;
  discount?: string;
  rating?: number | null;
  orders?: number | null;
  seller?: string;
  shipping?: string;
  features?: string[];
  specifications?: Array<{ label: string; value: string }>;
}

// ════════════════════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════════════════════

export default function WebsiteBuilderDemo() {
  // Builder mode
  const [builderMode, setBuilderMode] = useState<BuilderMode>('business');

  // Form state (business mode)
  const [input, setInput] = useState<WebsiteBuilderInput>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('rootx_builder_input');
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored input state:', e);
      }
    }
    return {
      businessName: '', businessType: '', targetAudience: '', brandDescription: '',
      preferredStyle: 'modern', primaryColor: '#dc2626', secondaryColor: '#1e40af',
      language: 'English', country: 'United States',
    };
  });

  // Dropshipping state
  const [productUrl, setProductUrl] = useState('');
  const [productAnalysis, setProductAnalysis] = useState<ProductAnalysis | null>(null);
  const [dropInput, setDropInput] = useState<DropshippingInput>({
    productUrl: '', storeName: '', preferredStyle: 'modern',
    primaryColor: '#6366f1', secondaryColor: '#06b6d4',
    language: 'English', country: 'United States',
  });
  const [dropStatus, setDropStatus] = useState<'idle' | 'analyzing' | 'analyzed' | 'generating' | 'done' | 'error'>('idle');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState('');

  // Manual import states
  const [isManualImport, setIsManualImport] = useState(false);
  const [isApifySearch, setIsApifySearch] = useState(false);
  const [apifyQuery, setApifyQuery] = useState('');
  const [apifyLoading, setApifyLoading] = useState(false);
  const [apifyResults, setApifyResults] = useState<ApifyProduct[]>([]);
  const [apifySelectedProduct, setApifySelectedProduct] = useState<ApifyProduct | null>(null);
  const [manualTitle, setManualTitle] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualShipping, setManualShipping] = useState('');
  const [manualImagesInput, setManualImagesInput] = useState<string[]>([]);
  const [newManualImageUrl, setNewManualImageUrl] = useState('');
  const [manualSpecsInput, setManualSpecsInput] = useState<{ label: string; value: string }[]>([]);
  const [newSpecLabel, setNewSpecLabel] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

  // Generation state
  const [result, setResult] = useState<WebsiteGeneration | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('rootx_builder_result');
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored result state:', e);
      }
    }
    return null;
  });
  const [designEngineResult, setDesignEngineResult] = useState<DesignEngineResult | null>(null);

  // Compute DesignEngineResult whenever result changes
  useEffect(() => {
    if (result) {
      try {
        const engineRes = generateShopifyThemeV2(result, input);
        setDesignEngineResult(engineRes);
      } catch (err) {
        console.error('Design Engine execution failed:', err);
      }
    }
  }, [result, input]);

  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('rootx_builder_result');
        if (stored) return 'done';
      } catch { /* ignore */ }
    }
    return 'idle';
  });
  const [errorMsg, setErrorMsg] = useState('');

  // UI state
  const [activeTab, setActiveTab] = useState<'pages' | 'branding' | 'seo' | 'marketing' | 'preview' | 'export' | 'shopify' | 'settings'>('pages');
  const [provider, setProvider] = useState<AIProvider>('auto');
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [editMode, setEditMode] = useState(false);
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());
  const { copiedId, copy } = useCopy();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [showShopifyDeploy, setShowShopifyDeploy] = useState(false);
  const [showImageManager, setShowImageManager] = useState(false);
  const [debugMode, setDebugMode] = useState(process.env.NODE_ENV !== 'production');

  // Shopify deploy state
  const [shopifyDomain, setShopifyDomain] = useState('');
  const [shopifyToken, setShopifyToken] = useState('');
  const [shopifyShopName, setShopifyShopName] = useState('');
  const [deployStatus, setDeployStatus] = useState<ThemeDeployStatus>('idle');
  const [deployThemeId, setDeployThemeId] = useState<number | null>(null);
  const [deployThemeName, setDeployThemeName] = useState('');
  const [deployPreviewUrl, setDeployPreviewUrl] = useState('');
  const [deployProgress, setDeployProgress] = useState({ uploaded: 0, total: 0 });
  const [deployError, setDeployError] = useState('');
  const [deployFileErrors, setDeployFileErrors] = useState<string[]>([]);

  // Load Shopify credentials on mount
  useEffect(() => {
    async function checkServerConnection() {
      try {
        const res = await authenticatedFetch('/api/shopify/connect');
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.connected) {
          setShopifyDomain(data.storeDomain);
          setShopifyToken('oauth');
          setShopifyShopName(data.shopName || data.storeDomain);
        } else {
          // Local storage fallback
          const stored = localStorage.getItem(SHOPIFY_CREDS_KEY);
          if (stored) {
            const c = JSON.parse(stored);
            if (c.storeDomain) setShopifyDomain(c.storeDomain);
            if (c.accessToken) setShopifyToken(c.accessToken);
            if (c.shopName) setShopifyShopName(c.shopName);
          }
        }
      } catch (err) {
        console.error('Failed to check server Shopify connection:', err);
      }
    }
    checkServerConnection();
  }, []);

  // Auto-open modal if they returned from successful oauth
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('oauth_success') === 'true') {
          const t = setTimeout(() => {
            setShowShopifyDeploy(true);
          }, 0);
          window.history.replaceState({}, '', window.location.pathname);
          return () => clearTimeout(t);
        }
      } catch (e) {
        console.error('Failed to check oauth success redirect:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('rootx_builder_input', JSON.stringify(input));
        if (result) {
          sessionStorage.setItem('rootx_builder_result', JSON.stringify(result));
        } else {
          sessionStorage.removeItem('rootx_builder_result');
        }
      } catch (e) {
        console.error('Failed to save builder state:', e);
      }
    }
  }, [input, result]);

  // ── API call ──────────────────────────────────────────────────
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!input.businessName.trim() || !input.businessType.trim()) return;
    setStatus('loading');
    setResult(null);
    setErrorMsg('');
    try {
      const res = await fetch('/api/agents/website-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, provider }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }
      const data: WebsiteGeneration = await res.json();
      setResult(data);
      setStatus('done');
      setActiveTab('pages');
      await saveGeneration({
        agentType: 'website-builder',
        agentName: 'Website Builder Agent',
        agentIcon: '🌐',
        inputs: {
          businessName: input.businessName,
          businessType: input.businessType,
          targetAudience: input.targetAudience,
          style: input.preferredStyle,
        },
        outputs: {
          seoTitle: data.seo.title,
          heroHeadline: data.homepage.hero.headline,
          provider: data.provider,
        },
        isSaved: false,
      });
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  }

  function handleReset() {
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
  }

  // ── Dropshipping handlers ────────────────────────────────────

  async function handleAnalyzeProduct() {
    if (!productUrl.trim()) return;
    const submittedUrl = productUrl.trim();
    console.log('[Frontend] Exact URL received by frontend:', submittedUrl);
    setDropStatus('analyzing');
    setErrorMsg('');
    setProductAnalysis(null);
    setSelectedImages([]);
    try {
      let productDataPayload: ApifyProduct | undefined = undefined;

      // If it's an AliExpress URL, use Apify to scrape it first to bypass anti-bot blocks
      if (submittedUrl.includes('aliexpress.com')) {
        console.log('[Frontend] AliExpress URL detected. Sourcing data securely via Apify scraper...');
        const apifyRes = await fetch('/api/apify/aliexpress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productUrl: submittedUrl }),
        });
        if (!apifyRes.ok) {
          const errData = await apifyRes.json().catch(() => ({}));
          throw new Error(errData.error || `Apify scraper returned status ${apifyRes.status}`);
        }
        const apifyData = await apifyRes.json();
        if (apifyData.success && apifyData.products && apifyData.products.length > 0) {
          productDataPayload = apifyData.products[0];
          console.log('[Frontend] Successfully scraped AliExpress product via Apify:', apifyData.products[0].title);
        } else {
          throw new Error(apifyData.error || 'Failed to scrape AliExpress product details.');
        }
      }

      const res = await fetch(`/api/agents/analyze-product?cb=${getTimestamp()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          url: submittedUrl,
          provider,
          productData: productDataPayload
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned status ${res.status}`);
      }
      const data = await res.json();
      console.log('[Frontend] Final JSON returned to frontend:', JSON.stringify(data));
      if (!data.success) throw new Error(data.error || 'Analysis failed');
      
      // Strict URL verification check
      if (!data.sourceUrl || data.sourceUrl !== submittedUrl) {
        console.error('[Frontend] Product URL mismatch detected!', 'Expected:', submittedUrl, 'Got:', data.sourceUrl);
        throw new Error('Product analysis mismatch. Please try again.');
      }
      if (data.analysis.sourceUrl !== submittedUrl) {
        console.error('[Frontend] Product Analysis object URL mismatch detected!', 'Expected:', submittedUrl, 'Got:', data.analysis.sourceUrl);
        throw new Error('Product analysis mismatch. Please try again.');
      }

      setProductAnalysis(data.analysis);
      setSelectedImages(data.analysis.images || []);
      setDropInput((prev) => ({
        ...prev,
        productUrl: submittedUrl,
        storeName: data.analysis.productTitle ? cleanBrandName(data.analysis.productTitle) : prev.storeName,
      }));
      setDropStatus('analyzed');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Product analysis failed');
      setDropStatus('error');
    }
  }

  function handleSaveManualProduct() {
    if (!manualTitle.trim() || !manualPrice.trim()) {
      setErrorMsg('Product Title and Price are required.');
      return;
    }
    const mockRequestId = `req_manual_${getTimestamp()}_${Math.random().toString(36).substring(2, 9)}`;
    const manualAnalysis: ProductAnalysis = {
      productTitle: manualTitle.trim(),
      productDescription: manualDescription.trim() || 'No description provided.',
      features: [
        'Premium quality materials',
        'Modern ergonomic design',
        'Durable construction',
        'Easy to use',
        'Compact and portable'
      ],
      sellingPoints: [
        'Free shipping on qualified orders',
        '30-day satisfaction guarantee',
        'Premium value at competitive pricing',
        'Reliable support and fast dispatch'
      ],
      targetAudience: 'general consumers',
      category: 'General',
      priceRange: manualPrice.trim(),
      sourceUrl: 'manual://import',
      images: manualImagesInput,
      shippingInfo: manualShipping.trim() || 'Standard shipping available',
      specifications: manualSpecsInput,
      warnings: ['Manually imported product details'],
      isPlaceholder: false,
      analysisId: `manual_${getTimestamp()}`,
      timestamp: new Date().toISOString(),
      requestId: mockRequestId
    };

    console.log('[Frontend] Saving manual product details:', JSON.stringify(manualAnalysis));
    
    setProductAnalysis(manualAnalysis);
    setSelectedImages(manualImagesInput);
    setDropInput((prev) => ({
      ...prev,
      productUrl: 'manual://import',
      storeName: `${manualTitle.trim()} Store`
    }));
    setDropStatus('analyzed');
    setIsManualImport(false);
  }

  function handleAddManualImportImage() {
    if (!newManualImageUrl.trim()) return;
    setManualImagesInput((prev) => [...prev, newManualImageUrl.trim()]);
    setNewManualImageUrl('');
  }

  function handleRemoveManualImportImage(index: number) {
    setManualImagesInput((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddManualSpec() {
    if (!newSpecLabel.trim() || !newSpecValue.trim()) return;
    setManualSpecsInput((prev) => [...prev, { label: newSpecLabel.trim(), value: newSpecValue.trim() }]);
    setNewSpecLabel('');
    setNewSpecValue('');
  }

  function handleRemoveManualSpec(index: number) {
    setManualSpecsInput((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddManualImage() {
    if (!manualImageUrl.trim() || !productAnalysis) return;
    const url = manualImageUrl.trim();
    setProductAnalysis({
      ...productAnalysis,
      images: [...(productAnalysis.images || []), url],
    });
    setSelectedImages((prev) => [...prev, url]);
    setManualImageUrl('');
  }

  async function handleGenerateStore() {
    if (!productAnalysis || !dropInput.storeName.trim()) return;
    if (selectedImages.length === 0) {
      setErrorMsg('Cannot generate store: At least one product image must be selected.');
      return;
    }
    setDropStatus('generating');
    setResult(null);
    setErrorMsg('');
    try {
      const res = await fetch('/api/agents/dropshipping-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: { ...productAnalysis, images: selectedImages },
          input: dropInput,
          provider
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }
      const data: WebsiteGeneration = await res.json();
      setResult(data);
      setDropStatus('done');
      setStatus('done');
      setActiveTab('pages');
      // Also set input for export compatibility
      setInput((prev) => ({
        ...prev,
        businessName: dropInput.storeName,
        businessType: productAnalysis.category || 'E-commerce',
        targetAudience: productAnalysis.targetAudience || 'online shoppers',
        preferredStyle: dropInput.preferredStyle,
        primaryColor: dropInput.primaryColor,
        secondaryColor: dropInput.secondaryColor,
        language: dropInput.language,
        country: dropInput.country,
      }));
      await saveGeneration({
        agentType: 'dropshipping-store',
        agentName: 'Dropshipping Store Builder',
        agentIcon: '🛍️',
        inputs: {
          productUrl: dropInput.productUrl,
          storeName: dropInput.storeName,
          product: productAnalysis.productTitle,
          style: dropInput.preferredStyle,
        },
        outputs: {
          seoTitle: data.seo.title,
          heroHeadline: data.homepage.hero.headline,
          provider: data.provider,
        },
        isSaved: false,
      });
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Store generation failed');
      setDropStatus('error');
    }
  }

  async function handleApifySearch(e: React.FormEvent) {
    e.preventDefault();
    if (!apifyQuery.trim()) return;
    setApifyLoading(true);
    setErrorMsg('');
    setApifyResults([]);
    setApifySelectedProduct(null);
    try {
      const res = await fetch('/api/apify/aliexpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchQuery: apifyQuery.trim() }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Apify search failed with status ${res.status}`);
      }
      const data = await res.json();
      if (data.success && data.products) {
        setApifyResults(data.products);
      } else {
        throw new Error(data.error || 'No products found matching query.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      setApifyLoading(false);
    }
  }

  async function handleSelectApifyProduct(product: ApifyProduct) {
    setApifySelectedProduct(product);
    setDropStatus('analyzing');
    setErrorMsg('');
    setProductAnalysis(null);
    setSelectedImages([]);
    setProductUrl(product.url);

    try {
      console.log('[Frontend] Analyzing selected Apify product:', product.title);
      const res = await fetch(`/api/agents/analyze-product?cb=${getTimestamp()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          url: product.url,
          provider,
          productData: product
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned status ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Analysis failed');

      setProductAnalysis(data.analysis);
      setSelectedImages(data.analysis.images || []);
      setDropInput((prev) => ({
        ...prev,
        productUrl: product.url,
        storeName: data.analysis.productTitle ? `${data.analysis.productTitle} Store` : prev.storeName,
      }));
      setDropStatus('analyzed');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Product analysis failed');
      setDropStatus('error');
    }
  }

  function handleDropReset() {
    setDropStatus('idle');
    setProductAnalysis(null);
    setProductUrl('');
    setResult(null);
    setStatus('idle');
    setErrorMsg('');
    setApifyQuery('');
    setApifyResults([]);
    setApifySelectedProduct(null);
  }

  // ── Shopify deploy handlers ──────────────────────────────────

  function saveShopifyCreds(domain: string, token: string, name: string) {
    try {
      localStorage.setItem(SHOPIFY_CREDS_KEY, JSON.stringify({
        storeDomain: domain, accessToken: token, shopName: name,
      }));
    } catch { /* ignore */ }
  }

  async function handleShopifyConnect() {
    let d = shopifyDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!d) return;
    if (!d.includes('.')) {
      d = `${d}.myshopify.com`;
    }
    setDeployStatus('connecting');
    setDeployError('');
    try {
      const res = await authenticatedFetch('/api/shopify/oauth', {
        method: 'POST',
        body: JSON.stringify({ storeDomain: d, redirectPath: window.location.pathname }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to start OAuth session');
      if (data.redirectUrl) {
        window.top!.location.href = data.redirectUrl;
      } else {
        throw new Error('No authorization URL returned from server');
      }
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : 'Connection failed');
      setDeployStatus('error');
    }
  }

  async function handleShopifyDisconnect() {
    try {
      if (shopifyToken === 'oauth') {
        await authenticatedFetch('/api/shopify/connect', { method: 'DELETE' });
      }
    } catch (err) {
      console.error('Failed to disconnect store server-side:', err);
    }
    setShopifyDomain('');
    setShopifyToken('');
    setShopifyShopName('');
    setDeployStatus('idle');
    setDeployError('');
    try { localStorage.removeItem(SHOPIFY_CREDS_KEY); } catch { /* ignore */ }
  }

  async function handleShopifyDeploy() {
    if (!result || !shopifyDomain.trim() || !shopifyToken.trim()) return;

    setDeployError('');
    setDeployFileErrors([]);
    setDeployThemeId(null);
    setDeployPreviewUrl('');

    // Generate theme files
    setDeployStatus('generating-files');
    let files: ShopifyThemeFile[];
    try {
      files = generateShopifyTheme(result, input);
      setDeployProgress({ uploaded: 0, total: files.length });
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : 'Theme generation failed');
      setDeployStatus('error');
      return;
    }

    // Create + upload theme
    setDeployStatus('creating');
    const name = `${input.businessName || 'RootX'} Theme — ${new Date().toLocaleDateString()}`;
    setDeployThemeName(name);

    try {
      const res = await authenticatedFetch('/api/shopify/theme', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          storeDomain: shopifyDomain.trim(),
          accessToken: shopifyToken.trim(),
          themeName: name,
          files,
        }),
      });
      const data: ThemeCreateResponse = await res.json();
      if (!data.success) throw new Error(data.error || 'Theme upload failed');

      setDeployThemeId(data.themeId ?? null);
      setDeployPreviewUrl(data.previewUrl ?? '');
      setDeployThemeName(data.themeName ?? name);
      setDeployProgress({ uploaded: data.uploadedCount ?? 0, total: data.totalCount ?? files.length });
      if (data.errors && data.errors.length > 0) setDeployFileErrors(data.errors);
      setDeployStatus('done');
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : 'Theme upload failed');
      setDeployStatus('error');
    }
  }

  async function handleShopifyPublish() {
    if (!deployThemeId) return;
    setDeployStatus('publishing');
    setDeployError('');
    try {
      const res = await authenticatedFetch('/api/shopify/theme', {
        method: 'POST',
        body: JSON.stringify({
          action: 'publish',
          storeDomain: shopifyDomain.trim(),
          accessToken: shopifyToken.trim(),
          themeId: deployThemeId,
        }),
      });
      const data: ThemePublishResponse = await res.json();
      if (!data.success) throw new Error(data.error || 'Publish failed');
      setDeployStatus('published');
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : 'Publish failed');
      setDeployStatus('error');
    }
  }

  async function handleExportThemeZip() {
    if (!result) return;

    if (designEngineResult && !designEngineResult.score.passed) {
      if (!confirm(`Current Design Quality Score is ${designEngineResult.score.total}/100 (below 85 threshold). Would you like to proceed with export anyway?`)) {
        return;
      }
    }

    setDeployError('');
    setDeployStatus('generating-files');
    try {
      const res = await fetch('/api/shopify/export-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result, input }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }

      const blob = await res.blob();
      const filename = `rootx-shopify-theme-${(input.businessName || 'shopify-theme')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase()}.zip`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setDeployStatus('idle');
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : 'Theme export failed');
      setDeployStatus('error');
    }
  }

  function handleDeployReset() {
    setDeployStatus('idle');
    setDeployThemeId(null);
    setDeployPreviewUrl('');
    setDeployThemeName('');
    setDeployError('');
    setDeployFileErrors([]);
    setDeployProgress({ uploaded: 0, total: 0 });
  }

  const isShopifyConnected = !!shopifyShopName && !!shopifyDomain && !!shopifyToken;
  const isDeploying = ['connecting', 'generating-files', 'creating', 'uploading', 'publishing'].includes(deployStatus);

  // ── Tab config ────────────────────────────────────────────────
  const tabs: { key: typeof activeTab; label: string; icon: React.ReactNode }[] = [
    { key: 'pages', label: 'Pages', icon: <Layout size={14} /> },
    { key: 'branding', label: 'Branding', icon: <Palette size={14} /> },
    { key: 'seo', label: 'SEO', icon: <Search size={14} /> },
    { key: 'marketing', label: 'Marketing', icon: <Megaphone size={14} /> },
    { key: 'preview', label: 'Preview', icon: <Eye size={14} /> },
    { key: 'export', label: 'Export', icon: <Download size={14} /> },
    { key: 'shopify', label: 'Shopify', icon: <ShoppingBag size={14} /> },
    { key: 'settings', label: 'Settings', icon: <Settings size={14} /> },
  ];

  // ── Viewport widths ──────────────────────────────────────────
  const viewportWidths = { desktop: '100%', tablet: '768px', mobile: '375px' };

  // ── Export handlers ───────────────────────────────────────────
  function handleExport(format: ExportFormat) {
    if (!result) return;
    switch (format) {
      case 'html':
        downloadFile(generatePreviewHtml(result, input), `${input.businessName.toLowerCase().replace(/\s+/g, '-')}.html`, 'text/html');
        break;
      case 'react':
        downloadFile(generateReactExport(result, input), `${input.businessName.replace(/[^a-zA-Z0-9]/g, '')}Website.jsx`, 'text/javascript');
        break;
      case 'nextjs':
        downloadFile(generateNextjsExport(result, input), 'page.tsx', 'text/typescript');
        break;
      case 'tailwind':
        downloadFile(generateTailwindExport(result, input), `${input.businessName.toLowerCase().replace(/\s+/g, '-')}-tailwind.html`, 'text/html');
        break;
      case 'json':
        downloadFile(JSON.stringify({ input, generation: result }, null, 2), `${input.businessName.toLowerCase().replace(/\s+/g, '-')}-data.json`, 'application/json');
        break;
    }
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <section className="py-16" style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
      <div className="section-container">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: builderMode === 'dropshipping' ? 'rgba(99,102,241,0.15)' : 'rgba(220,38,38,0.15)', border: `1px solid ${builderMode === 'dropshipping' ? 'rgba(99,102,241,0.25)' : 'rgba(220,38,38,0.25)'}` }}
          >
            {builderMode === 'dropshipping' ? <Package size={18} style={{ color: '#818cf8' }} /> : <Globe size={18} style={{ color: '#ef4444' }} />}
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: builderMode === 'dropshipping' ? '#818cf8' : '#ef4444' }}>
              Live Demo
            </span>
          </div>
        </div>
        <h2 className="text-3xl font-black mb-2">
          {builderMode === 'dropshipping'
            ? <>Build Your Store <span className="gradient-text">From Any Product</span></>
            : <>Build Your Website <span className="gradient-text">With AI</span></>
          }
        </h2>
        <p className="mb-8" style={{ color: '#71717a', maxWidth: '560px' }}>
          {builderMode === 'dropshipping'
            ? 'Paste a product URL and let AI generate a complete, high-converting e-commerce storefront — ready to deploy on Shopify.'
            : 'Enter your business details and let AI generate a complete website — pages, branding, SEO, and marketing content — in seconds.'
          }
        </p>

        {/* ── Mode Switcher ── */}
        <div className="grid grid-cols-2 gap-4 mb-8 max-w-xl">
          {([
            { mode: 'business' as BuilderMode, icon: <Globe size={20} />, title: 'Business Website', desc: 'Full website from business details', color: '#ef4444' },
            { mode: 'dropshipping' as BuilderMode, icon: <Package size={20} />, title: 'Dropshipping Store', desc: 'E-commerce store from product URL', color: '#818cf8' },
          ]).map((m) => (
            <button
              key={m.mode}
              type="button"
              onClick={() => { setBuilderMode(m.mode); handleReset(); handleDropReset(); }}
              className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
              style={{
                background: builderMode === m.mode ? `${m.color}12` : 'var(--color-surface)',
                border: `2px solid ${builderMode === m.mode ? m.color : 'var(--color-border)'}`,
                cursor: 'pointer',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: builderMode === m.mode ? `${m.color}20` : 'rgba(255,255,255,0.03)',
                  color: builderMode === m.mode ? m.color : '#71717a',
                }}
              >
                {m.icon}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: builderMode === m.mode ? m.color : '#f8f8f8' }}>{m.title}</p>
                <p className="text-xs" style={{ color: '#52525b' }}>{m.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ── Business Mode Form ── */}
        {builderMode === 'business' && (
          <>
            <InputForm input={input} setInput={setInput} status={status} onSubmit={handleGenerate} onReset={handleReset} />
            {status === 'loading' && <LoadingSkeleton />}
          </>
        )}

        {/* ── Dropshipping Mode Form ── */}
        {builderMode === 'dropshipping' && (
          <div className="rounded-2xl p-6 md:p-8" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>

            {/* AI Model Selector */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#52525b' }}>
                <Sparkles size={12} className="inline mr-1.5" style={{ verticalAlign: '-1px' }} />
                AI Model
              </label>
              <div className="flex flex-wrap gap-2">
                {([
                  { key: 'auto' as AIProvider, label: 'Auto Best', color: '#f59e0b', desc: 'Smart routing' },
                  { key: 'openrouter' as AIProvider, label: 'OpenRouter', color: '#e11d48', desc: 'Multi-model' },
                  { key: 'gemini' as AIProvider, label: 'Gemini', color: '#60a5fa', desc: 'Fast extraction' },
                  { key: 'claude' as AIProvider, label: 'Claude', color: '#a855f7', desc: 'Premium copy' },
                  { key: 'kimi' as AIProvider, label: 'Kimi', color: '#06b6d4', desc: 'Long context' },
                  { key: 'openai' as AIProvider, label: 'OpenAI', color: '#22c55e', desc: 'Reliable' },
                ] as const).map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setProvider(m.key)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: provider === m.key ? `${m.color}12` : 'rgba(255,255,255,0.02)',
                      border: `1.5px solid ${provider === m.key ? m.color : 'var(--color-border)'}`,
                      color: provider === m.key ? m.color : '#71717a',
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: provider === m.key ? m.color : '#3f3f46', boxShadow: provider === m.key ? `0 0 6px ${m.color}60` : 'none' }}
                    />
                    {m.label}
                    <span className="text-[10px] font-normal" style={{ color: provider === m.key ? `${m.color}cc` : '#3f3f46' }}>· {m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 1: Product Import Mode Selection */}
            <div className="flex gap-4 mb-4 border-b pb-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <button
                type="button"
                className={`pb-2 text-sm font-semibold transition-all ${!isManualImport && !isApifySearch ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                onClick={() => {
                  setIsManualImport(false);
                  setIsApifySearch(false);
                  setErrorMsg('');
                }}
              >
                Import via Product URL
              </button>
              <button
                type="button"
                className={`pb-2 text-sm font-semibold transition-all ${isApifySearch ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                onClick={() => {
                  setIsApifySearch(true);
                  setIsManualImport(false);
                  setErrorMsg('');
                }}
              >
                Search AliExpress (Apify)
              </button>
              <button
                type="button"
                id="manual-import-tab"
                className={`pb-2 text-sm font-semibold transition-all ${isManualImport ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                onClick={() => {
                  setIsManualImport(true);
                  setIsApifySearch(false);
                  setErrorMsg('');
                }}
              >
                Manual Product Import
              </button>
            </div>

            {isManualImport ? (
              <div className="rounded-xl p-4 mb-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h4 className="text-sm font-bold mb-4" style={{ color: '#e4e4e7' }}>Manual Product Ingestion</h4>
                
                {/* Title */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a1a1aa' }}>Product Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Wireless Ergonomic Bluetooth Mouse"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="input-field w-full text-sm"
                  />
                </div>

                {/* Price */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a1a1aa' }}>Price ($) *</label>
                  <input
                    type="text"
                    placeholder="e.g. 29.99"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    className="input-field w-full text-sm"
                  />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a1a1aa' }}>Description</label>
                  <textarea
                    placeholder="Enter product description..."
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    className="input-field w-full text-sm min-h-[80px] py-2"
                  />
                </div>

                {/* Shipping Info */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a1a1aa' }}>Shipping Information</label>
                  <input
                    type="text"
                    placeholder="e.g. Free shipping, delivery in 3-5 days"
                    value={manualShipping}
                    onChange={(e) => setManualShipping(e.target.value)}
                    className="input-field w-full text-sm"
                  />
                </div>

                {/* Images */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a1a1aa' }}>Product Images</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="url"
                      placeholder="Paste image URL..."
                      value={newManualImageUrl}
                      onChange={(e) => setNewManualImageUrl(e.target.value)}
                      className="input-field flex-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualImportImage}
                      className="px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                      Add
                    </button>
                  </div>
                  {manualImagesInput.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.01)' }}>
                      {manualImagesInput.map((img, idx) => (
                        <div key={idx} className="relative w-12 h-12 rounded border border-zinc-700 overflow-hidden group">
                          <img src={img} className="w-full h-full object-cover" alt="" />
                          <button
                            type="button"
                            onClick={() => handleRemoveManualImportImage(idx)}
                            className="absolute inset-0 bg-red-600 bg-opacity-70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white text-[10px]"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Specifications */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a1a1aa' }}>Specifications</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Label (e.g. Material)"
                      value={newSpecLabel}
                      onChange={(e) => setNewSpecLabel(e.target.value)}
                      className="input-field flex-1 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. ABS Polymer)"
                      value={newSpecValue}
                      onChange={(e) => setNewSpecValue(e.target.value)}
                      className="input-field flex-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualSpec}
                      className="px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                      Add
                    </button>
                  </div>
                  {manualSpecsInput.length > 0 && (
                    <div className="mt-2 text-xs flex flex-col gap-1 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.01)' }}>
                      {manualSpecsInput.map((spec, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1 border-b border-zinc-800">
                          <span>{spec.label}: <strong style={{ color: '#e4e4e7' }}>{spec.value}</strong></span>
                          <button
                            type="button"
                            onClick={() => handleRemoveManualSpec(idx)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save button */}
                <button
                  type="button"
                  onClick={handleSaveManualProduct}
                  disabled={!manualTitle.trim() || !manualPrice.trim()}
                  className="w-full py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
                >
                  Save & Validate Product
                </button>
              </div>
            ) : isApifySearch ? (
              /* Apify Search Interface */
              <div className="mb-6">
                <form onSubmit={handleApifySearch} className="mb-6">
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
                    <Search size={14} className="inline mr-1.5" style={{ verticalAlign: '-2px' }} />
                    Search products on AliExpress <span style={{ color: '#818cf8' }}>*</span>
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="e.g. smart watch, wireless earbuds, portable espresso machine..."
                      value={apifyQuery}
                      onChange={(e) => setApifyQuery(e.target.value)}
                      className="input-field flex-1"
                      disabled={apifyLoading || dropStatus === 'analyzing'}
                    />
                    <button
                      type="submit"
                      disabled={!apifyQuery.trim() || apifyLoading || dropStatus === 'analyzing'}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0"
                      style={{
                        background: apifyQuery.trim() ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(99,102,241,0.06)',
                        color: apifyQuery.trim() ? '#fff' : '#52525b',
                        border: 'none',
                        boxShadow: apifyQuery.trim() ? '0 4px 16px rgba(99,102,241,0.3)' : 'none',
                        opacity: !apifyQuery.trim() || apifyLoading ? 0.5 : 1,
                        cursor: !apifyQuery.trim() ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {apifyLoading
                        ? <><Loader2 size={16} className="animate-spin" /> Searching...</>
                        : <><Search size={16} /> Search via Apify</>
                      }
                    </button>
                  </div>
                </form>

                {/* Scraped products selection grid */}
                {apifyResults.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold mb-3" style={{ color: '#e4e4e7' }}>Select a product to import:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {apifyResults.map((prod, idx) => {
                        const isSelected = apifySelectedProduct?.url === prod.url;
                        return (
                          <div
                            key={idx}
                            className="rounded-xl p-4 flex gap-4 transition-all"
                            style={{
                              background: isSelected ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                              border: `1.5px solid ${isSelected ? '#6366f1' : 'var(--color-border)'}`,
                            }}
                          >
                            {prod.images && prod.images.length > 0 && (
                              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-700 bg-white">
                                <img src={prod.images[0]} alt="" className="w-full h-full object-contain" />
                              </div>
                            )}
                            <div className="flex-1 flex flex-col justify-between min-w-0">
                              <div>
                                <h4 className="text-xs font-bold truncate" style={{ color: '#f4f4f5' }} title={prod.title}>
                                  {prod.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1 text-[11px]" style={{ color: '#a1a1aa' }}>
                                  <span className="font-bold text-indigo-400">${prod.price}</span>
                                  {prod.originalPrice && (
                                    <span className="line-through text-zinc-500">${prod.originalPrice}</span>
                                  )}
                                  {prod.discount && (
                                    <span className="text-green-400 font-semibold">{prod.discount}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1.5 text-[10px]" style={{ color: '#71717a' }}>
                                  {prod.rating && (
                                    <span className="text-amber-500 font-medium">★ {prod.rating}</span>
                                  )}
                                  {prod.orders && (
                                    <span>{prod.orders} orders</span>
                                  )}
                                  {prod.seller && (
                                    <span className="truncate max-w-[100px]">🏪 {prod.seller}</span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSelectApifyProduct(prod)}
                                disabled={apifyLoading || dropStatus === 'analyzing'}
                                className="mt-2.5 py-1 px-3 rounded-lg text-xs font-bold text-white transition-all w-full md:w-auto self-start"
                                style={{
                                  background: isSelected ? 'rgba(34,197,94,0.2)' : 'rgba(99,102,241,0.2)',
                                  border: `1px solid ${isSelected ? '#22c55e' : '#6366f1'}`,
                                  color: isSelected ? '#22c55e' : '#818cf8',
                                }}
                              >
                                {isSelected ? 'Selected ✓' : 'Select Product'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Step 1: Product URL */
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
                  <Link2 size={14} className="inline mr-1.5" style={{ verticalAlign: '-2px' }} />
                  Paste your product or supplier URL <span style={{ color: '#818cf8' }}>*</span>
                </label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    placeholder="https://www.aliexpress.com/item/... or any product page URL"
                    value={productUrl}
                    onChange={(e) => {
                      const newVal = e.target.value;
                      setProductUrl(newVal);
                      // Invalidate all previous analysis, selected images, and generated store content immediately when URL changes
                      setProductAnalysis(null);
                      setSelectedImages([]);
                      setResult(null);
                      setErrorMsg('');
                      if (dropStatus !== 'idle') {
                        setDropStatus('idle');
                      }
                    }}
                    className="input-field flex-1"
                    disabled={dropStatus === 'analyzing' || dropStatus === 'generating'}
                  />
                  <button
                    type="button"
                    onClick={handleAnalyzeProduct}
                    disabled={!productUrl.trim() || dropStatus === 'analyzing'}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0"
                    style={{
                      background: productUrl.trim() ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(99,102,241,0.06)',
                      color: productUrl.trim() ? '#fff' : '#52525b',
                      border: 'none',
                      boxShadow: productUrl.trim() ? '0 4px 16px rgba(99,102,241,0.3)' : 'none',
                      opacity: !productUrl.trim() || dropStatus === 'analyzing' ? 0.5 : 1,
                      cursor: !productUrl.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {dropStatus === 'analyzing'
                      ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</>
                      : <><BarChart3 size={16} /> Analyze Product</>
                    }
                  </button>
                </div>
                
                {/* Captcha/Anti-bot fail help message */}
                {dropStatus === 'error' && errorMsg.includes('captcha') && (
                  <div className="mt-3 p-3 rounded-xl border text-xs" style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
                    <p className="font-semibold mb-1">⚠️ Extraction Blocked by CAPTCHA</p>
                    <p className="mb-2">AliExpress security challenge prevented automatic ingestion. You can import the product manually instead.</p>
                    <button
                      type="button"
                      id="manual-import-btn"
                      onClick={() => {
                        setIsManualImport(true);
                        setErrorMsg('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 hover:bg-red-950/60 font-bold transition-all"
                    >
                      Use Manual Import Fallback
                    </button>
                  </div>
                )}

                <p className="text-xs mt-2" style={{ color: '#52525b' }}>
                  Supports AliExpress, Amazon, Shopify stores, Alibaba, Temu, and any public product page.
                </p>
              </div>
            )}

            {/* Analyzing skeleton */}
            {dropStatus === 'analyzing' && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <Loader2 size={24} className="animate-spin" style={{ color: '#818cf8' }} />
                </div>
                <div className="text-center">
                  <p className="font-bold mb-1">Analyzing Product Page...</p>
                  <p className="text-xs" style={{ color: '#71717a' }}>Extracting product details, features, pricing, and specifications</p>
                </div>
              </div>
            )}

            {/* Step 2: Product Analysis Results */}
            {productAnalysis && (dropStatus === 'analyzed' || dropStatus === 'generating' || dropStatus === 'done') && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} style={{ color: '#22c55e' }} />
                    <span className="text-sm font-bold" style={{ color: '#22c55e' }}>Product Analyzed</span>
                  </div>
                  <button type="button" onClick={handleDropReset} className="text-xs font-medium px-3 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: '#71717a' }}>
                    <RefreshCw size={12} className="inline mr-1" /> Reset
                  </button>
                </div>

                {/* Product card */}
                <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)' }}>
                  <h4 className="font-bold mb-2">{productAnalysis.productTitle}</h4>
                  <p className="text-xs mb-3 leading-relaxed" style={{ color: '#a1a1aa' }}>{productAnalysis.productDescription}</p>
                  
                  {/* Analysis details */}
                  <div className="rounded-lg p-3 mb-4 flex flex-col gap-1.5 text-[11px]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', color: '#a1a1aa' }}>
                    <div className="flex justify-between gap-4">
                      <span className="font-semibold text-zinc-500">Source URL:</span>
                      <a href={productAnalysis.sourceUrl} target="_blank" rel="noopener noreferrer" className="truncate hover:underline" style={{ color: '#818cf8', maxWidth: '75%' }}>
                        {productAnalysis.sourceUrl}
                      </a>
                    </div>
                    {productAnalysis.analysisId && (
                      <div className="flex justify-between gap-4">
                        <span className="font-semibold text-zinc-500">Analysis ID:</span>
                        <span className="font-mono">{productAnalysis.analysisId}</span>
                      </div>
                    )}
                    {productAnalysis.requestId && (
                      <div className="flex justify-between gap-4">
                        <span className="font-semibold text-zinc-500">Request ID:</span>
                        <span className="font-mono">{productAnalysis.requestId}</span>
                      </div>
                    )}
                    {productAnalysis.timestamp && (
                      <div className="flex justify-between gap-4">
                        <span className="font-semibold text-zinc-500">Analyzed At:</span>
                        <span>{new Date(productAnalysis.timestamp).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Product Images Selector */}
                  <div className="mb-4">
                    <p className="text-xs font-bold mb-2" style={{ color: '#52525b' }}>
                      Product Images ({selectedImages.length} selected of {productAnalysis.images?.length || 0} found)
                    </p>
                    
                    {(!productAnalysis.images || productAnalysis.images.length === 0) ? (
                      <div className="rounded-xl p-3 mb-3 text-sm" style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', color: '#eab308' }}>
                        ⚠️ No product images could be extracted from this URL.
                      </div>
                    ) : (
                      <div className="flex gap-2 mb-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                        {productAnalysis.images.map((img, i) => {
                          const isSelected = selectedImages.includes(img);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedImages((prev) => prev.filter((url) => url !== img));
                                } else {
                                  setSelectedImages((prev) => [...prev, img]);
                                }
                              }}
                              className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden relative p-0"
                              style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: `2px solid ${isSelected ? '#6366f1' : 'var(--color-border)'}`,
                                cursor: 'pointer',
                              }}
                            >
                              <img
                                src={img}
                                alt={`Product ${i + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                              {isSelected && (
                                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center border border-white/20" style={{ zIndex: 10 }}>
                                  <Check size={8} style={{ color: '#fff' }} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Manual Image URL Upload */}
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="Add product image URL manually"
                        value={manualImageUrl}
                        onChange={(e) => setManualImageUrl(e.target.value)}
                        className="input-field flex-1 text-xs"
                        style={{ height: '36px' }}
                      />
                      <button
                        type="button"
                        onClick={handleAddManualImage}
                        disabled={!manualImageUrl.trim()}
                        className="flex items-center gap-1.5 px-4 rounded-lg text-xs font-bold transition-all"
                        style={{
                          background: manualImageUrl.trim() ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                          color: manualImageUrl.trim() ? '#a5b4fc' : '#52525b',
                          border: `1px solid ${manualImageUrl.trim() ? 'rgba(99,102,241,0.3)' : 'var(--color-border)'}`,
                          cursor: manualImageUrl.trim() ? 'pointer' : 'not-allowed',
                          height: '36px'
                        }}
                      >
                        <Upload size={12} /> Add Image
                      </button>
                    </div>
                  </div>

                  {/* Ratings */}
                  {productAnalysis.ratings && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            style={{
                              color: i < Math.round(productAnalysis.ratings!) ? '#eab308' : '#3f3f46',
                              fill: i < Math.round(productAnalysis.ratings!) ? '#eab308' : 'transparent',
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold" style={{ color: '#eab308' }}>{productAnalysis.ratings.toFixed(1)}</span>
                      {productAnalysis.reviewCount && (
                        <span className="text-xs" style={{ color: '#52525b' }}>({productAnalysis.reviewCount.toLocaleString()} reviews)</span>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    {[
                      { label: 'Category', value: productAnalysis.category, icon: <Store size={12} /> },
                      { label: 'Price', value: productAnalysis.priceRange, icon: <Hash size={12} /> },
                      { label: 'Audience', value: productAnalysis.targetAudience.slice(0, 30), icon: <Target size={12} /> },
                      { label: 'Shipping', value: productAnalysis.shippingInfo.slice(0, 30), icon: <Truck size={12} /> },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)' }}>
                        <div className="flex items-center gap-1 mb-1" style={{ color: '#52525b' }}>
                          {item.icon}
                          <span className="text-xs">{item.label}</span>
                        </div>
                        <p className="text-xs font-bold truncate">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Features & Selling Points */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-bold mb-1.5" style={{ color: '#52525b' }}>Features</p>
                      <div className="flex flex-wrap gap-1.5">
                        {productAnalysis.features.slice(0, 6).map((f, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', color: '#a5b4fc' }}>{f}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold mb-1.5" style={{ color: '#52525b' }}>Selling Points</p>
                      <div className="flex flex-wrap gap-1.5">
                        {productAnalysis.sellingPoints.slice(0, 4).map((s, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', color: '#86efac' }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Warnings */}
                  {productAnalysis.warnings.length > 0 && (
                    <div className="mt-3 flex items-start gap-1.5 text-xs" style={{ color: '#eab308' }}>
                      <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                      <span>{productAnalysis.warnings.join(' · ')}</span>
                    </div>
                  )}
                </div>

                {/* Step 3: Store Config */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
                      Store Name <span style={{ color: '#818cf8' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="My Awesome Store"
                      value={dropInput.storeName}
                      onChange={(e) => setDropInput({ ...dropInput, storeName: e.target.value })}
                      className="input-field w-full"
                      disabled={dropStatus === 'generating'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>Style</label>
                    <div className="flex flex-wrap gap-2">
                      {([
                        { key: 'auto_best', label: 'Auto Best' },
                        { key: 'premium_minimal', label: 'Premium Minimal' },
                        { key: 'modern_commerce', label: 'Modern Commerce' },
                        { key: 'luxury_editorial', label: 'Luxury Editorial' },
                        { key: 'bold_conversion', label: 'Bold Conversion' },
                        { key: 'tech_futuristic', label: 'Tech Futuristic' },
                        { key: 'soft_lifestyle', label: 'Soft Lifestyle' }
                      ] as const).map((s) => (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => setDropInput({ ...dropInput, preferredStyle: s.key })}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          style={{
                            background: dropInput.preferredStyle === s.key ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${dropInput.preferredStyle === s.key ? '#6366f1' : 'var(--color-border)'}`,
                            color: dropInput.preferredStyle === s.key ? '#818cf8' : '#71717a',
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#52525b' }}>Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={dropInput.primaryColor} onChange={(e) => setDropInput({ ...dropInput, primaryColor: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer" style={{ background: 'transparent', border: 'none' }} />
                      <span className="text-xs font-mono" style={{ color: '#71717a' }}>{dropInput.primaryColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#52525b' }}>Secondary Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={dropInput.secondaryColor} onChange={(e) => setDropInput({ ...dropInput, secondaryColor: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer" style={{ background: 'transparent', border: 'none' }} />
                      <span className="text-xs font-mono" style={{ color: '#71717a' }}>{dropInput.secondaryColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#52525b' }}>Language</label>
                    <select value={dropInput.language} onChange={(e) => setDropInput({ ...dropInput, language: e.target.value })} className="input-field w-full text-xs" style={{ padding: '0.5rem' }}>
                      {['English', 'Spanish', 'French', 'German', 'Arabic', 'Chinese', 'Japanese'].map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#52525b' }}>Country</label>
                    <input type="text" value={dropInput.country} onChange={(e) => setDropInput({ ...dropInput, country: e.target.value })} className="input-field w-full text-xs" style={{ padding: '0.5rem' }} placeholder="United States" />
                  </div>
                </div>

                {/* Generate Store button */}
                <button
                  type="button"
                  onClick={handleGenerateStore}
                  disabled={!dropInput.storeName.trim() || dropStatus === 'generating'}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-base font-bold transition-all"
                  style={{
                    background: dropInput.storeName.trim() ? 'linear-gradient(135deg, #6366f1, #4f46e5, #7c3aed)' : 'rgba(99,102,241,0.06)',
                    color: dropInput.storeName.trim() ? '#fff' : '#52525b',
                    border: 'none',
                    boxShadow: dropInput.storeName.trim() ? '0 4px 24px rgba(99,102,241,0.3)' : 'none',
                    opacity: !dropInput.storeName.trim() || dropStatus === 'generating' ? 0.6 : 1,
                    cursor: !dropInput.storeName.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {dropStatus === 'generating'
                    ? <><Loader2 size={20} className="animate-spin" /> Generating Your Store...</>
                    : <><Store size={20} /> Generate Store</>
                  }
                </button>
              </div>
            )}

            {/* Generating skeleton */}
            {dropStatus === 'generating' && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <Loader2 size={28} className="animate-spin" style={{ color: '#818cf8' }} />
                </div>
                <div className="text-center">
                  <p className="font-bold mb-1">Generating Your E-Commerce Store...</p>
                  <p className="text-xs" style={{ color: '#71717a' }}>Creating homepage, product page, FAQ, SEO, branding, and marketing content</p>
                </div>
              </div>
            )}

            {/* Idle state — quick start hint */}
            {dropStatus === 'idle' && (
              <div className="flex flex-col items-center justify-center py-10 gap-4" style={{ opacity: 0.6 }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}>
                  <Package size={28} style={{ color: '#6366f1' }} />
                </div>
                <div className="text-center">
                  <p className="font-semibold mb-1">Paste a product URL to get started</p>
                  <p className="text-xs" style={{ color: '#52525b' }}>AliExpress · Amazon · Shopify · Alibaba · Temu · Any public product page</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error (shared) */}
        {(status === 'error' || dropStatus === 'error') && (
          <div
            className="mt-8 rounded-2xl p-5 flex items-start gap-4"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)' }}
          >
            <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="font-semibold mb-1" style={{ color: '#ef4444' }}>
                {builderMode === 'dropshipping' ? 'Operation failed' : 'Generation failed'}
              </p>
              <p className="text-sm" style={{ color: '#a1a1aa' }}>{errorMsg}</p>
              <button onClick={builderMode === 'dropshipping' ? handleDropReset : handleReset} className="btn-secondary mt-3" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                Try again
              </button>
            </div>
          </div>
        )}

        {/* ── Results ────────────────────────────────────────── */}
        {status === 'done' && result && (
          <div ref={resultsRef} className="mt-10">
            {/* Header row */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h3 className="text-xl font-black mb-1">
                  {builderMode === 'dropshipping' ? 'Store Generated' : 'Website Generated'} <span style={{ color: '#22c55e' }}>✓</span>
                </h3>
                <p className="text-sm" style={{ color: '#52525b' }}>
                  {builderMode === 'dropshipping'
                    ? <>E-commerce store for <strong style={{ color: '#f8f8f8' }}>{dropInput.storeName || input.businessName}</strong></>
                    : <>Complete website for <strong style={{ color: '#f8f8f8' }}>{input.businessName}</strong> ({input.businessType})</>
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                {result.isDemo && (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', color: '#eab308' }}
                  >
                    <AlertTriangle size={13} />
                    Demo mode — Add API key for real output
                  </div>
                )}
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    background: editMode ? 'rgba(220,38,38,0.08)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${editMode ? 'rgba(220,38,38,0.25)' : 'var(--color-border)'}`,
                    color: editMode ? '#ef4444' : '#71717a',
                  }}
                >
                  <Edit3 size={12} /> {editMode ? 'Editing' : 'Edit'}
                </button>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="mb-6 -mx-1" style={{ overflowX: 'auto' }}>
              <div className="flex gap-1.5 min-w-max px-1 py-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap"
                    style={{
                      background: activeTab === tab.key ? 'rgba(220,38,38,0.08)' : 'transparent',
                      border: `1px solid ${activeTab === tab.key ? 'rgba(220,38,38,0.25)' : 'transparent'}`,
                      color: activeTab === tab.key ? '#ef4444' : '#52525b',
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ═══════ PAGES TAB ═══════ */}
            {activeTab === 'pages' && (
              <div className="flex flex-col gap-4">
                {/* Section Order Editor */}
                <SectionCard title="Layout Section Order" icon={<Layers size={16} style={{ color: '#ef4444' }} />} color="#ef4444" defaultOpen>
                  <div className="flex flex-col gap-2.5">
                    {(() => {
                      const order = result.ecommerce?.sectionOrder || ['hero', 'features', 'specifications', 'howItWorks', 'faqs', 'reviews'];
                      return order.map((section: string, idx: number) => (
                        <div key={section} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                          <span className="text-xs font-bold uppercase tracking-wider capitalize">
                            {section.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => {
                                const nextOrder = [...order];
                                const temp = nextOrder[idx];
                                nextOrder[idx] = nextOrder[idx - 1];
                                nextOrder[idx - 1] = temp;
                                const nextResult = { ...result };
                                if (nextResult.ecommerce) {
                                  nextResult.ecommerce.sectionOrder = nextOrder;
                                  setResult(nextResult);
                                }
                              }}
                              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold rounded text-white disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              ▲ Up
                            </button>
                            <button
                              type="button"
                              disabled={idx === order.length - 1}
                              onClick={() => {
                                const nextOrder = [...order];
                                const temp = nextOrder[idx];
                                nextOrder[idx] = nextOrder[idx + 1];
                                nextOrder[idx + 1] = temp;
                                const nextResult = { ...result };
                                if (nextResult.ecommerce) {
                                  nextResult.ecommerce.sectionOrder = nextOrder;
                                  setResult(nextResult);
                                }
                              }}
                              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold rounded text-white disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              ▼ Down
                            </button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </SectionCard>

                {/* Announcement Bar & Navigation */}
                <SectionCard title="Navigation & Announcement" icon={<Layout size={16} style={{ color: '#ef4444' }} />} color="#ef4444">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#a1a1aa' }}>Announcement Bar Text</label>
                      <input
                        type="text"
                        className="input-field w-full text-xs"
                        value={result.ecommerce?.announcementBar || ''}
                        onChange={(e) => {
                          const nextResult = { ...result };
                          if (nextResult.ecommerce) {
                            nextResult.ecommerce.announcementBar = e.target.value;
                            setResult(nextResult);
                          }
                        }}
                      />
                    </div>
                  </div>
                </SectionCard>

                {/* Homepage */}
                <SectionCard title="Homepage Hero Section" icon={<Layout size={16} style={{ color: '#ef4444' }} />} color="#ef4444">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#a1a1aa' }}>Headline</label>
                      <input
                        type="text"
                        className="input-field w-full text-xs"
                        value={result.homepage.hero.headline}
                        onChange={(e) => {
                          const nextResult = { ...result };
                          nextResult.homepage.hero.headline = e.target.value;
                          setResult(nextResult);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#a1a1aa' }}>Subheadline</label>
                      <textarea
                        className="input-field w-full text-xs min-h-[60px]"
                        value={result.homepage.hero.subheadline}
                        onChange={(e) => {
                          const nextResult = { ...result };
                          nextResult.homepage.hero.subheadline = e.target.value;
                          setResult(nextResult);
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: '#a1a1aa' }}>Primary CTA Label</label>
                        <input
                          type="text"
                          className="input-field w-full text-xs"
                          value={result.homepage.hero.ctaButtons[0]?.label || ''}
                          onChange={(e) => {
                            const nextResult = { ...result };
                            if (nextResult.homepage.hero.ctaButtons[0]) {
                              nextResult.homepage.hero.ctaButtons[0].label = e.target.value;
                              setResult(nextResult);
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: '#a1a1aa' }}>Secondary CTA Label</label>
                        <input
                          type="text"
                          className="input-field w-full text-xs"
                          value={result.homepage.hero.ctaButtons[1]?.label || ''}
                          onChange={(e) => {
                            const nextResult = { ...result };
                            if (nextResult.homepage.hero.ctaButtons[1]) {
                              nextResult.homepage.hero.ctaButtons[1].label = e.target.value;
                              setResult(nextResult);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* About story content */}
                <SectionCard title="About Story Content" icon={<Briefcase size={16} style={{ color: '#60a5fa' }} />} color="#60a5fa">
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#a1a1aa' }}>Mission</label>
                      <textarea
                        className="input-field w-full text-xs min-h-[60px]"
                        value={result.about.mission}
                        onChange={(e) => {
                          const nextResult = { ...result };
                          nextResult.about.mission = e.target.value;
                          setResult(nextResult);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#a1a1aa' }}>Vision</label>
                      <textarea
                        className="input-field w-full text-xs min-h-[60px]"
                        value={result.about.vision}
                        onChange={(e) => {
                          const nextResult = { ...result };
                          nextResult.about.vision = e.target.value;
                          setResult(nextResult);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#a1a1aa' }}>Story Content</label>
                      <textarea
                        className="input-field w-full text-xs min-h-[100px]"
                        value={result.about.content}
                        onChange={(e) => {
                          const nextResult = { ...result };
                          nextResult.about.content = e.target.value;
                          setResult(nextResult);
                        }}
                      />
                    </div>
                  </div>
                </SectionCard>

                {/* Image Gallery Editor */}
                <SectionCard title="Product Image Gallery" icon={<Layers size={16} style={{ color: '#a855f7' }} />} color="#a855f7">
                  <div className="flex flex-col gap-3">
                    {result.ecommerce?.images?.map((img, idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <label className="block text-xs font-semibold" style={{ color: '#a1a1aa' }}>Image URL {idx + 1}</label>
                        <input
                          type="text"
                          className="input-field w-full text-xs"
                          value={img}
                          onChange={(e) => {
                            const nextResult = { ...result };
                            if (nextResult.ecommerce?.images) {
                              nextResult.ecommerce.images[idx] = e.target.value;
                              setResult(nextResult);
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Pricing & Display */}
                <SectionCard title="Product Pricing & Variations" icon={<Target size={16} style={{ color: '#22c55e' }} />} color="#22c55e">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#a1a1aa' }}>Product Price</label>
                      <input
                        type="text"
                        className="input-field w-full text-xs"
                        value={result.ecommerce?.price || ''}
                        onChange={(e) => {
                          const nextResult = { ...result };
                          if (nextResult.ecommerce) {
                            nextResult.ecommerce.price = e.target.value;
                            setResult(nextResult);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#a1a1aa' }}>Compare-At Price</label>
                      <input
                        type="text"
                        className="input-field w-full text-xs"
                        value={result.ecommerce?.compareAtPrice || ''}
                        onChange={(e) => {
                          const nextResult = { ...result };
                          if (nextResult.ecommerce) {
                            nextResult.ecommerce.compareAtPrice = e.target.value;
                            setResult(nextResult);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#a1a1aa' }}>Shipping Description</label>
                    <input
                      type="text"
                      className="input-field w-full text-xs"
                      value={result.ecommerce?.shippingText || ''}
                      onChange={(e) => {
                        const nextResult = { ...result };
                        if (nextResult.ecommerce) {
                          nextResult.ecommerce.shippingText = e.target.value;
                          setResult(nextResult);
                        }
                      }}
                    />
                  </div>
                </SectionCard>

                {/* Trust Badges & Policies */}
                <SectionCard title="Trust Badges & Policies" icon={<Shield size={16} style={{ color: '#ef4444' }} />} color="#ef4444">
                  <div className="flex flex-col gap-2">
                    {result.ecommerce?.trustBadges?.map((badge, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          className="input-field flex-1 text-xs"
                          value={badge}
                          onChange={(e) => {
                            const nextResult = { ...result };
                            if (nextResult.ecommerce?.trustBadges) {
                              nextResult.ecommerce.trustBadges[idx] = e.target.value;
                              setResult(nextResult);
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* FAQ */}
                <SectionCard title="FAQ Editor" icon={<Hash size={16} style={{ color: '#eab308' }} />} color="#eab308">
                  <div className="flex flex-col gap-3">
                    {(result.ecommerce?.faq && result.ecommerce.faq.length > 0 ? result.ecommerce.faq : result.faq.items).map((item, i) => (
                      <div key={i} className="p-3 rounded-xl flex flex-col gap-2" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                        <input
                          type="text"
                          className="input-field w-full text-xs font-semibold"
                          value={item.question}
                          onChange={(e) => {
                            const nextResult = { ...result };
                            if (nextResult.ecommerce?.faq?.[i]) {
                              nextResult.ecommerce.faq[i].question = e.target.value;
                            } else {
                              nextResult.faq.items[i].question = e.target.value;
                            }
                            setResult(nextResult);
                          }}
                        />
                        <textarea
                          className="input-field w-full text-xs min-h-[50px]"
                          value={item.answer}
                          onChange={(e) => {
                            const nextResult = { ...result };
                            if (nextResult.ecommerce?.faq?.[i]) {
                              nextResult.ecommerce.faq[i].answer = e.target.value;
                            } else {
                              nextResult.faq.items[i].answer = e.target.value;
                            }
                            setResult(nextResult);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Reviews Editor */}
                <SectionCard title="Reviews & Testimonials" icon={<Quote size={16} style={{ color: '#f97316' }} />} color="#f97316">
                  <div className="flex flex-col gap-3">
                    {(result.ecommerce?.reviews && result.ecommerce.reviews.length > 0 ? result.ecommerce.reviews : result.testimonials.testimonials).map((t: { author?: string; name?: string; rating: number; date?: string; title?: string; content?: string; quote?: string; role?: string; company?: string; }, i: number) => (
                      <div key={i} className="p-3 rounded-xl flex flex-col gap-2" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            className="input-field flex-1 text-xs"
                            placeholder="Author Name"
                            value={t.author || t.name || ''}
                            onChange={(e) => {
                              const nextResult = { ...result };
                              if (nextResult.ecommerce?.reviews?.[i]) {
                                nextResult.ecommerce.reviews[i].author = e.target.value;
                              } else {
                                nextResult.testimonials.testimonials[i].name = e.target.value;
                              }
                              setResult(nextResult);
                            }}
                          />
                          <input
                            type="number"
                            min="1"
                            max="5"
                            className="input-field w-16 text-xs"
                            placeholder="Rating"
                            value={t.rating || 5}
                            onChange={(e) => {
                              const nextResult = { ...result };
                              const val = parseInt(e.target.value) || 5;
                              if (nextResult.ecommerce?.reviews?.[i]) {
                                nextResult.ecommerce.reviews[i].rating = val;
                              } else {
                                nextResult.testimonials.testimonials[i].rating = val;
                              }
                              setResult(nextResult);
                            }}
                          />
                        </div>
                        <textarea
                          className="input-field w-full text-xs min-h-[50px]"
                          placeholder="Review Content"
                          value={t.content || t.quote || ''}
                          onChange={(e) => {
                            const nextResult = { ...result };
                            if (nextResult.ecommerce?.reviews?.[i]) {
                              nextResult.ecommerce.reviews[i].content = e.target.value;
                            } else {
                              nextResult.testimonials.testimonials[i].quote = e.target.value;
                            }
                            setResult(nextResult);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Footer */}
                <SectionCard title="Footer" icon={<Layers size={16} style={{ color: '#71717a' }} />} color="#71717a">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {result.footer.columns.map((col, i) => (
                      <div key={i}>
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#a1a1aa' }}>{col.title}</p>
                        <ul className="flex flex-col gap-1">
                          {col.links.map((link, li) => (
                            <li key={li} className="text-xs" style={{ color: '#52525b' }}>{link.label}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <p className="text-xs" style={{ color: '#3f3f46' }}>{result.footer.copyright}</p>
                    <div className="flex gap-2">
                      {result.footer.socialLinks.map((s, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: '#52525b' }}>
                          {s.icon} {s.platform}
                        </span>
                      ))}
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ═══════ BRANDING TAB ═══════ */}
            {activeTab === 'branding' && (
              <div className="flex flex-col gap-5">
                {/* Color Palette */}
                {/* Color Palette Editor */}
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                    <Palette size={14} style={{ color: '#a855f7' }} />
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#a855f7' }}>Color Palette Editor</span>
                  </div>
                  <div className="p-5 flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: '#a1a1aa' }}>Primary Accent Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={input.primaryColor}
                            onChange={(e) => {
                              setInput({ ...input, primaryColor: e.target.value });
                              if (result) {
                                const nextResult = { ...result };
                                const pri = nextResult.branding.colorPalette.find(c => c.name === 'Primary' || c.name === 'Primary Accent');
                                if (pri) pri.hex = e.target.value;
                                setResult(nextResult);
                              }
                            }}
                            className="w-8 h-8 rounded-lg cursor-pointer"
                            style={{ background: 'transparent', border: 'none' }}
                          />
                          <span className="text-xs font-mono" style={{ color: '#a1a1aa' }}>{input.primaryColor}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: '#a1a1aa' }}>Secondary Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={input.secondaryColor}
                            onChange={(e) => {
                              setInput({ ...input, secondaryColor: e.target.value });
                              if (result) {
                                const nextResult = { ...result };
                                const sec = nextResult.branding.colorPalette.find(c => c.name === 'Secondary');
                                if (sec) sec.hex = e.target.value;
                                setResult(nextResult);
                              }
                            }}
                            className="w-8 h-8 rounded-lg cursor-pointer"
                            style={{ background: 'transparent', border: 'none' }}
                          />
                          <span className="text-xs font-mono" style={{ color: '#a1a1aa' }}>{input.secondaryColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typography Editor */}
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                    <Type size={14} style={{ color: '#60a5fa' }} />
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#60a5fa' }}>Typography Editor</span>
                  </div>
                  <div className="p-5 flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: '#a1a1aa' }}>Heading Font</label>
                        <select
                          className="input-field w-full text-xs"
                          value={result.branding.typography.heading}
                          onChange={(e) => {
                            const nextResult = { ...result };
                            nextResult.branding.typography.heading = e.target.value;
                            nextResult.branding.typography.googleFontsUrl = `https://fonts.googleapis.com/css2?family=${e.target.value.replace(/ /g, '+')}:wght@400;600;700;800&family=${result.branding.typography.body.replace(/ /g, '+')}:wght@300;400;500;600&display=swap`;
                            setResult(nextResult);
                          }}
                        >
                          {['Inter', 'Space Grotesk', 'Playfair Display', 'Oswald', 'Cinzel', 'Montserrat', 'Lora', 'Outfit', 'Roboto', 'Poppins'].map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: '#a1a1aa' }}>Body Font</label>
                        <select
                          className="input-field w-full text-xs"
                          value={result.branding.typography.body}
                          onChange={(e) => {
                            const nextResult = { ...result };
                            nextResult.branding.typography.body = e.target.value;
                            nextResult.branding.typography.googleFontsUrl = `https://fonts.googleapis.com/css2?family=${result.branding.typography.heading.replace(/ /g, '+')}:wght@400;600;700;800&family=${e.target.value.replace(/ /g, '+')}:wght@300;400;500;600&display=swap`;
                            setResult(nextResult);
                          }}
                        >
                          {['Inter', 'Montserrat', 'Roboto', 'Lora', 'Poppins', 'Open Sans', 'Lato'].map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Icon Suggestions */}
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)' }}>
                      <ImageIcon size={14} style={{ color: '#eab308' }} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#eab308' }}>Icon Suggestions</span>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {result.branding.iconSuggestions.map((ic, i) => (
                        <div key={i} className="rounded-xl p-3 text-center" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                          <div className="text-2xl mb-1">{ic.emoji}</div>
                          <p className="text-xs font-bold">{ic.name}</p>
                          <p className="text-xs" style={{ color: '#52525b' }}>{ic.usage}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Logo Description */}
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center justify-between px-5 py-3.5" style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <PenTool size={14} style={{ color: '#ef4444' }} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>Logo Concept</span>
                    </div>
                    <CopyBtn text={result.branding.logoDescription} id="logo-desc" copiedId={copiedId} onCopy={copy} size="sm" />
                  </div>
                  <div className="p-5">
                    <p className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>{result.branding.logoDescription}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════ SEO TAB ═══════ */}
            {activeTab === 'seo' && (
              <div className="flex flex-col gap-4">
                {/* SEO Title */}
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center justify-between px-5 py-3.5" style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                        <Search size={14} style={{ color: '#22c55e' }} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#22c55e' }}>SEO Title</span>
                    </div>
                    <CopyBtn text={result.seo.title} id="seo-title" copiedId={copiedId} onCopy={copy} size="sm" />
                  </div>
                  <div className="p-5">
                    <p className="text-sm font-semibold mb-2">{result.seo.title}</p>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (result.seo.title.length / 60) * 100)}%`,
                            background: result.seo.title.length <= 60 ? '#22c55e' : '#eab308',
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono" style={{ color: result.seo.title.length <= 60 ? '#22c55e' : '#eab308' }}>
                        {result.seo.title.length}/60
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: '#3f3f46' }}>Optimal: 50-60 characters</p>
                  </div>
                </div>

                {/* Meta Description */}
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center justify-between px-5 py-3.5" style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)' }}>
                        <Search size={14} style={{ color: '#60a5fa' }} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#60a5fa' }}>Meta Description</span>
                    </div>
                    <CopyBtn text={result.seo.metaDescription} id="seo-meta" copiedId={copiedId} onCopy={copy} size="sm" />
                  </div>
                  <div className="p-5">
                    <p className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>{result.seo.metaDescription}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="h-1.5 flex-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (result.seo.metaDescription.length / 160) * 100)}%`,
                            background: result.seo.metaDescription.length <= 160 ? '#22c55e' : '#eab308',
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono" style={{ color: result.seo.metaDescription.length <= 160 ? '#22c55e' : '#eab308' }}>
                        {result.seo.metaDescription.length}/160
                      </span>
                    </div>
                  </div>
                </div>

                {/* Keywords */}
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center justify-between px-5 py-3.5" style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
                        <Hash size={14} style={{ color: '#a855f7' }} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#a855f7' }}>Keywords</span>
                    </div>
                    <CopyBtn text={result.seo.keywords.join(', ')} id="seo-keywords" copiedId={copiedId} onCopy={copy} size="sm" />
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap gap-2">
                      {result.seo.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer transition-all duration-200"
                          style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', color: '#a855f7' }}
                          onClick={() => copy(kw, `kw-${i}`)}
                          title="Click to copy"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs mt-3" style={{ color: '#3f3f46' }}>Click any keyword to copy individually</p>
                  </div>
                </div>

                {/* Open Graph */}
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}>
                      <Globe size={14} style={{ color: '#f97316' }} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#f97316' }}>Open Graph</span>
                  </div>
                  <div className="p-5 flex flex-col gap-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#3f3f46' }}>OG Title</p>
                        <CopyBtn text={result.seo.ogTitle} id="og-title" copiedId={copiedId} onCopy={copy} size="xs" />
                      </div>
                      <p className="text-sm" style={{ color: '#a1a1aa' }}>{result.seo.ogTitle}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#3f3f46' }}>OG Description</p>
                        <CopyBtn text={result.seo.ogDescription} id="og-desc" copiedId={copiedId} onCopy={copy} size="xs" />
                      </div>
                      <p className="text-sm" style={{ color: '#a1a1aa' }}>{result.seo.ogDescription}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#3f3f46' }}>OG Image Prompt</p>
                        <CopyBtn text={result.seo.ogImagePrompt} id="og-img" copiedId={copiedId} onCopy={copy} size="xs" />
                      </div>
                      <p className="text-sm italic" style={{ color: '#71717a' }}>{result.seo.ogImagePrompt}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════ MARKETING TAB ═══════ */}
            {activeTab === 'marketing' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Google Ads */}
                <ResultCard
                  icon={Search} label="Google Ads" color="#22c55e"
                  copyId="gads" copyText={[...result.marketing.googleAdsHeadlines, ...result.marketing.googleAdsDescriptions].join('\n')}
                  copiedId={copiedId} onCopy={copy}
                >
                  <div className="mb-3">
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#3f3f46' }}>Headlines</p>
                    <div className="flex flex-col gap-1.5">
                      {result.marketing.googleAdsHeadlines.map((h, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2"
                          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                          <p className="text-sm" style={{ color: '#a1a1aa' }}>{h}</p>
                          <span className="text-xs font-mono flex-shrink-0" style={{ color: h.length <= 30 ? '#22c55e' : '#eab308' }}>{h.length}/30</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#3f3f46' }}>Descriptions</p>
                    <div className="flex flex-col gap-1.5">
                      {result.marketing.googleAdsDescriptions.map((d, i) => (
                        <div key={i} className="rounded-lg px-3 py-2" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                          <p className="text-sm" style={{ color: '#a1a1aa' }}>{d}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </ResultCard>

                {/* Facebook Ad */}
                <ResultCard
                  icon={Megaphone} label="Facebook Ad" color="#60a5fa"
                  copyId="fb" copyText={result.marketing.facebookAdCopy}
                  copiedId={copiedId} onCopy={copy}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#a1a1aa' }}>
                    {result.marketing.facebookAdCopy}
                  </p>
                </ResultCard>

                {/* Instagram */}
                <ResultCard
                  icon={ImageIcon} label="Instagram" color="#a855f7"
                  copyId="ig" copyText={result.marketing.instagramCaption}
                  copiedId={copiedId} onCopy={copy}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#a1a1aa' }}>
                    {result.marketing.instagramCaption}
                  </p>
                </ResultCard>

                {/* LinkedIn */}
                <ResultCard
                  icon={Briefcase} label="LinkedIn" color="#0077b5"
                  copyId="li" copyText={result.marketing.linkedInPost}
                  copiedId={copiedId} onCopy={copy}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#a1a1aa' }}>
                    {result.marketing.linkedInPost}
                  </p>
                </ResultCard>

                {/* X (Twitter) */}
                <ResultCard
                  icon={Hash} label="X (Twitter)" color="#f8f8f8"
                  copyId="tw" copyText={result.marketing.twitterPost}
                  copiedId={copiedId} onCopy={copy}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#a1a1aa' }}>
                    {result.marketing.twitterPost}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="h-1.5 flex-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (result.marketing.twitterPost.length / 280) * 100)}%`,
                          background: result.marketing.twitterPost.length <= 280 ? '#22c55e' : '#ef4444',
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono" style={{ color: result.marketing.twitterPost.length <= 280 ? '#22c55e' : '#ef4444' }}>
                      {result.marketing.twitterPost.length}/280
                    </span>
                  </div>
                </ResultCard>

                {/* Email Campaign */}
                <ResultCard
                  icon={Mail} label="Email Campaign" color="#ef4444"
                  copyId="email"
                  copyText={`Subject: ${result.marketing.emailCampaign.subject}\nPreheader: ${result.marketing.emailCampaign.preheader}\n\n${result.marketing.emailCampaign.body}\n\nCTA: ${result.marketing.emailCampaign.cta}`}
                  copiedId={copiedId} onCopy={copy}
                >
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#ef4444' }}>Subject</p>
                      <p className="text-sm font-semibold">{result.marketing.emailCampaign.subject}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#3f3f46' }}>Preheader</p>
                      <p className="text-sm" style={{ color: '#71717a' }}>{result.marketing.emailCampaign.preheader}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#3f3f46' }}>Body</p>
                      <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#a1a1aa' }}>
                        {result.marketing.emailCampaign.body}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#22c55e' }}>CTA</p>
                      <span className="inline-block text-xs font-bold px-4 py-2 rounded-lg" style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)', color: '#ef4444' }}>
                        {result.marketing.emailCampaign.cta}
                      </span>
                    </div>
                  </div>
                </ResultCard>
              </div>
            )}

            {/* ═══════ PREVIEW TAB ═══════ */}
            {activeTab === 'preview' && (
              <div className="flex flex-col gap-6">
                {/* Image Pipeline Diagnostics Panel (Dev Mode) */}
                {designEngineResult?.imagePipelineResult && (
                  <ImageDiagnosticsPanel
                    pipelineResult={designEngineResult.imagePipelineResult}
                    debugMode={debugMode}
                  />
                )}

                {/* Toolbar for Image Management */}
                <div className="flex items-center justify-between p-4 rounded-xl border bg-zinc-900 border-zinc-800">
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <ImageIcon size={16} className="text-blue-400" />
                      Product Image Pipeline
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Manage hero selection, section roles, and manual uploads.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowImageManager(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-all"
                  >
                    <ImageIcon size={14} /> Open Image Manager
                  </button>
                </div>

                {/* Image Manager Modal */}
                {designEngineResult?.imagePipelineResult && (
                  <ImageManagerModal
                    isOpen={showImageManager}
                    onClose={() => setShowImageManager(false)}
                    images={designEngineResult.imagePipelineResult.images}
                    onUpdateImages={(updatedImages) => {
                      if (result && designEngineResult) {
                        const updatedPipeline = {
                          ...designEngineResult.imagePipelineResult!,
                          images: updatedImages,
                          heroImage: updatedImages.find((img) => img.role === 'hero') || updatedImages[0] || null,
                          galleryImages: updatedImages,
                        };
                        setDesignEngineResult({
                          ...designEngineResult,
                          imagePipelineResult: updatedPipeline,
                        });
                      }
                    }}
                  />
                )}

                {/* 1. Design Score Panel (0-100 Quality Score) */}
                {designEngineResult && (
                  <DesignScorePanel
                    score={designEngineResult.score}
                    onRegenerate={() => {
                      if (result) {
                        try {
                          const newResult = generateShopifyThemeV2(result, input);
                          setDesignEngineResult(newResult);
                        } catch (err) {
                          console.error(err);
                        }
                      }
                    }}
                  />
                )}

                {/* 2. Archetype Selector & Override */}
                {designEngineResult && (
                  <ArchetypeSelector
                    selectedArchetype={designEngineResult.archetype}
                    onSelectArchetype={(newArchId) => {
                      const updatedInput = { ...input, preferredStyle: newArchId };
                      setInput(updatedInput);
                      if (result) {
                        const newResult = generateShopifyThemeV2(result, updatedInput);
                        setDesignEngineResult(newResult);
                      }
                    }}
                  />
                )}

                {/* 3. Interactive Desktop/Mobile Preview */}
                {designEngineResult && (
                  <DesignPreviewPanel result={designEngineResult} />
                )}

                {/* 4. OpenRouter Multi-Model Routing Telemetry */}
                {designEngineResult && designEngineResult.modelLogs.length > 0 && (
                  <ModelLogPanel logs={designEngineResult.modelLogs} />
                )}
              </div>
            )}

            {activeTab === 'export' && (
              <div className="flex flex-col gap-6">
                {/* Deploy to Shopify — featured card */}
                <div
                  className="rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5"
                  style={{
                    background: 'linear-gradient(135deg, rgba(150,191,71,0.08) 0%, rgba(92,138,31,0.04) 100%)',
                    border: '1px solid rgba(150,191,71,0.2)',
                  }}
                >
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(150,191,71,0.12)', border: '1px solid rgba(150,191,71,0.25)' }}>
                    <ShoppingBag size={28} style={{ color: '#96bf47' }} />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="font-bold text-lg mb-1">Deploy to Shopify</h4>
                    <p className="text-xs leading-relaxed" style={{ color: '#71717a' }}>
                      Automatically convert your AI-generated website into a full Shopify Online Store 2.0 theme with
                      homepage, product pages, collections, blog, and more. One-click upload and publish.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowShopifyDeploy(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #96bf47, #5c8a1f)',
                      color: '#fff',
                      border: 'none',
                      boxShadow: '0 4px 16px rgba(150,191,71,0.3)',
                    }}
                  >
                    <Upload size={16} /> Deploy to Shopify
                  </button>
                </div>

                {/* Export format cards */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#52525b' }}>Download Formats</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {([
                      { format: 'html' as ExportFormat, icon: <Code size={24} style={{ color: '#ef4444' }} />, name: 'HTML', desc: 'Complete standalone HTML page with inline CSS and responsive layout', size: '~25 KB', color: '#ef4444' },
                      { format: 'react' as ExportFormat, icon: <Layers size={24} style={{ color: '#60a5fa' }} />, name: 'React', desc: 'Functional React component with JSX and inline styles', size: '~18 KB', color: '#60a5fa' },
                      { format: 'nextjs' as ExportFormat, icon: <Globe size={24} style={{ color: '#f8f8f8' }} />, name: 'Next.js', desc: 'Next.js App Router page with metadata export and SEO', size: '~20 KB', color: '#f8f8f8' },
                      { format: 'tailwind' as ExportFormat, icon: <Palette size={24} style={{ color: '#06b6d4' }} />, name: 'Tailwind', desc: 'HTML with Tailwind CSS CDN utility classes', size: '~15 KB', color: '#06b6d4' },
                      { format: 'json' as ExportFormat, icon: <FileJson size={24} style={{ color: '#eab308' }} />, name: 'JSON', desc: 'Raw generation data for custom integrations', size: '~12 KB', color: '#eab308' },
                    ]).map((exp) => (
                      <div
                        key={exp.format}
                        className="rounded-2xl p-5 flex flex-col"
                        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', transition: 'border-color 0.25s' }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = `${exp.color}44`)}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)')}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${exp.color}12`, border: `1px solid ${exp.color}25` }}>
                            {exp.icon}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold">{exp.name}</h4>
                            <p className="text-xs" style={{ color: '#52525b' }}>{exp.size}</p>
                          </div>
                        </div>
                        <p className="text-xs leading-relaxed mb-4 flex-1" style={{ color: '#71717a' }}>{exp.desc}</p>
                        <button
                          onClick={() => handleExport(exp.format)}
                          className="w-full flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-lg transition-all"
                          style={{
                            background: `${exp.color}12`,
                            border: `1px solid ${exp.color}25`,
                            color: exp.color,
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = `${exp.color}20`;
                            (e.currentTarget as HTMLElement).style.borderColor = `${exp.color}40`;
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = `${exp.color}12`;
                            (e.currentTarget as HTMLElement).style.borderColor = `${exp.color}25`;
                          }}
                        >
                          <Download size={14} /> Download {exp.name}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════ SHOPIFY TAB ═══════ */}
            {activeTab === 'shopify' && (
              <div className="flex flex-col gap-6">

                {/* ── Section 1: Export Theme ── */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)' }}>
                      <Download size={16} style={{ color: '#eab308' }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">Manual Theme Export</h4>
                      <p className="text-xs" style={{ color: '#71717a' }}>Generate and package theme as ZIP without connecting Shopify account</p>
                    </div>
                    <button
                      onClick={handleExportThemeZip}
                      disabled={deployStatus === 'generating-files'}
                      className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                      style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', color: '#eab308', cursor: deployStatus === 'generating-files' ? 'not-allowed' : 'pointer' }}
                    >
                      {deployStatus === 'generating-files' ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Generating ZIP...
                        </>
                      ) : (
                        <>
                          <Download size={14} /> Download Shopify Theme ZIP
                        </>
                      )}
                    </button>
                  </div>
                  
                  {deployError && deployStatus === 'error' && (
                    <div className="mx-5 mt-4 flex items-start gap-2 px-3 py-2.5 rounded-lg"
                      style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.12)' }}>
                      <AlertTriangle size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                      <div className="text-xs flex flex-col gap-0.5">
                        <span className="font-bold text-red-400">Theme Validation / Generation Failed</span>
                        <p style={{ color: '#fca5a5' }}>{deployError}</p>
                      </div>
                    </div>
                  )}

                  <div className="px-5 py-4">
                    <p className="text-xs mb-4" style={{ color: '#a1a1aa' }}>
                      Exports a fully valid Shopify Online Store 2.0 theme containing layout, templates, sections, snippets, assets, config, and locales pre-populated with your generated brand and product data.
                    </p>

                    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <h5 className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: '#e4e4e7' }}>
                        Step-by-Step Shopify Manual Upload Instructions
                      </h5>
                      <ol className="flex flex-col gap-2.5 text-xs text-zinc-400 list-decimal pl-4">
                        <li>
                          Click the <strong style={{ color: '#eab308' }}>Download Shopify Theme ZIP</strong> button above to download the theme package.
                        </li>
                        <li>
                          Log in to your <strong>Shopify Admin</strong> dashboard.
                        </li>
                        <li>
                          In the left sidebar, navigate to <strong>Online Store</strong> &rarr; <strong>Themes</strong>.
                        </li>
                        <li>
                          Scroll down to the <strong>Theme library</strong> section, click <strong>Add theme</strong>, and select <strong>Upload zip file</strong>.
                        </li>
                        <li>
                          Select the downloaded <code className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300">rootx-shopify-theme-*.zip</code> file and click <strong>Upload file</strong>.
                        </li>
                        <li>
                          Once the theme is uploaded and installed, click <strong>Publish</strong> on the new theme block to make it live for your store visitors.
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Connect Shopify Store ── */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--color-surface)', border: `1px solid ${isShopifyConnected ? 'rgba(34,197,94,0.25)' : 'var(--color-border)'}` }}
                >
                  <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        background: isShopifyConnected ? 'rgba(34,197,94,0.1)' : 'rgba(150,191,71,0.1)',
                        border: `1px solid ${isShopifyConnected ? 'rgba(34,197,94,0.25)' : 'rgba(150,191,71,0.25)'}`,
                      }}
                    >
                      {isShopifyConnected
                        ? <CheckCircle2 size={16} style={{ color: '#22c55e' }} />
                        : <Plug size={16} style={{ color: '#96bf47' }} />
                      }
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold">
                        {isShopifyConnected ? 'Store Connected' : 'Connect Shopify Store'}
                      </h4>
                      <p className="text-xs" style={{ color: isShopifyConnected ? '#22c55e' : '#71717a' }}>
                        {isShopifyConnected ? shopifyShopName : 'Enter your Shopify store URL to connect'}
                      </p>
                    </div>
                    {isShopifyConnected && (
                      <button
                        onClick={handleShopifyDisconnect}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444' }}
                      >
                        <X size={12} /> Disconnect
                      </button>
                    )}
                  </div>

                  {!isShopifyConnected && (
                    <div className="px-5 py-4 flex flex-col gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Store Domain *</label>
                        <input
                          type="text"
                          placeholder="your-store.myshopify.com"
                          value={shopifyDomain}
                          onChange={(e) => setShopifyDomain(e.target.value)}
                          className="input-field w-full"
                          disabled={deployStatus === 'connecting'}
                        />
                        <p className="text-[10px] mt-1" style={{ color: '#52525b' }}>
                          e.g. my-brand.myshopify.com or just your-store
                        </p>
                      </div>

                      {deployError && (
                        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
                          style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.12)' }}>
                          <AlertTriangle size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                          <p className="text-xs" style={{ color: '#fca5a5' }}>{deployError}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleShopifyConnect}
                          disabled={!shopifyDomain.trim() || deployStatus === 'connecting'}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all"
                          style={{
                            background: !shopifyDomain.trim() ? 'rgba(150,191,71,0.06)' : 'rgba(150,191,71,0.15)',
                            border: '1px solid rgba(150,191,71,0.25)',
                            color: '#96bf47',
                            opacity: !shopifyDomain.trim() ? 0.5 : 1,
                          }}
                        >
                          {deployStatus === 'connecting'
                            ? <><Loader2 size={14} className="animate-spin" /> Connecting...</>
                            : <><Plug size={14} /> Connect Shopify Store</>
                          }
                        </button>
                        <p className="text-xs" style={{ color: '#52525b' }}>
                          Uses official secure Shopify OAuth
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Section 3: Deploy to Shopify (one-click if connected) ── */}
                {deployStatus === 'idle' && (
                  <div
                    className="rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5"
                    style={{
                      background: 'linear-gradient(135deg, rgba(150,191,71,0.08) 0%, rgba(92,138,31,0.04) 100%)',
                      border: '1px solid rgba(150,191,71,0.2)',
                    }}
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(150,191,71,0.12)', border: '1px solid rgba(150,191,71,0.25)' }}>
                      <Upload size={24} style={{ color: '#96bf47' }} />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="font-bold mb-1">Upload Theme to Shopify</h4>
                      <p className="text-xs" style={{ color: '#71717a' }}>
                        {isShopifyConnected
                          ? `Deploy to ${shopifyShopName} — creates a new OS 2.0 theme with all pages, sections, and assets.`
                          : 'Connect your store first, then deploy your AI-generated theme with one click.'
                        }
                      </p>
                    </div>
                    <button
                      onClick={handleShopifyDeploy}
                      disabled={!isShopifyConnected}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all flex-shrink-0"
                      style={{
                        background: isShopifyConnected ? 'linear-gradient(135deg, #96bf47, #5c8a1f)' : 'rgba(150,191,71,0.06)',
                        color: isShopifyConnected ? '#fff' : '#52525b',
                        border: 'none',
                        boxShadow: isShopifyConnected ? '0 4px 16px rgba(150,191,71,0.3)' : 'none',
                        opacity: isShopifyConnected ? 1 : 0.5,
                        cursor: isShopifyConnected ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <Upload size={16} /> Deploy to Shopify
                    </button>
                  </div>
                )}

                {/* ── Section 4: Upload Progress ── */}
                {isDeploying && (
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: 'var(--color-surface)', border: '1px solid rgba(150,191,71,0.2)' }}
                  >
                    <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <Loader2 size={18} className="animate-spin" style={{ color: '#96bf47' }} />
                      <div>
                        <h4 className="text-sm font-bold">
                          {deployStatus === 'connecting' && 'Connecting to Shopify...'}
                          {deployStatus === 'generating-files' && 'Generating Liquid templates...'}
                          {deployStatus === 'creating' && 'Creating theme & uploading files...'}
                          {deployStatus === 'uploading' && `Uploading files (${deployProgress.uploaded}/${deployProgress.total})...`}
                          {deployStatus === 'publishing' && 'Publishing theme...'}
                        </h4>
                        <p className="text-xs" style={{ color: '#71717a' }}>
                          {deployStatus === 'creating' && 'Uploading ~26 files. This takes 30-60 seconds due to Shopify API rate limits.'}
                          {deployStatus === 'generating-files' && 'Converting your AI website into Shopify OS 2.0 format.'}
                          {deployStatus === 'publishing' && 'Setting your theme as the live store theme.'}
                        </p>
                      </div>
                    </div>
                    {deployProgress.total > 0 && (
                      <div className="px-5 py-4">
                        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${deployProgress.total > 0 ? Math.round((deployProgress.uploaded / deployProgress.total) * 100) : 0}%`,
                              background: 'linear-gradient(90deg, #96bf47, #5c8a1f)',
                            }}
                          />
                        </div>
                        <p className="text-xs text-center mt-2" style={{ color: '#52525b' }}>
                          {deployProgress.uploaded} / {deployProgress.total} files uploaded
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Section 5: Success + Publish ── */}
                {(deployStatus === 'done' || deployStatus === 'published') && (
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: 'var(--color-surface)', border: '1px solid rgba(34,197,94,0.25)' }}
                  >
                    <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
                      <div className="flex-1">
                        <h4 className="text-sm font-bold" style={{ color: '#22c55e' }}>
                          {deployStatus === 'published' ? 'Theme Published! 🎉' : 'Theme Uploaded Successfully!'}
                        </h4>
                        <p className="text-xs" style={{ color: '#71717a' }}>
                          {deployStatus === 'published' ? 'Your theme is now live on your Shopify store.' : 'Your theme is ready to preview and publish.'}
                        </p>
                      </div>
                      <button
                        onClick={handleDeployReset}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: '#71717a' }}
                      >
                        <RefreshCw size={12} /> Deploy Again
                      </button>
                    </div>

                    <div className="px-5 py-4 flex flex-col gap-4">
                      {/* Theme details grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Theme Name', value: deployThemeName, icon: <ShoppingBag size={14} /> },
                          { label: 'Theme ID', value: String(deployThemeId), icon: <Hash size={14} /> },
                          { label: 'Store', value: shopifyShopName, icon: <Globe size={14} /> },
                          { label: 'Files', value: `${deployProgress.uploaded}/${deployProgress.total}`, icon: <Layers size={14} /> },
                        ].map((item) => (
                          <div key={item.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)' }}>
                            <div className="flex items-center gap-1.5 mb-1" style={{ color: '#52525b' }}>
                              {item.icon}
                              <span className="text-xs">{item.label}</span>
                            </div>
                            <p className="text-xs font-bold font-mono truncate">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* File errors */}
                      {deployFileErrors.length > 0 && (
                        <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                          <p className="text-xs font-bold mb-1" style={{ color: '#f59e0b' }}>⚠ {deployFileErrors.length} file(s) had upload issues:</p>
                          {deployFileErrors.slice(0, 5).map((e, i) => (
                            <p key={i} className="text-xs" style={{ color: '#a16207' }}>{e}</p>
                          ))}
                          {deployFileErrors.length > 5 && <p className="text-xs" style={{ color: '#a16207' }}>...and {deployFileErrors.length - 5} more</p>}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        {deployPreviewUrl && (
                          <a
                            href={deployPreviewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                            style={{
                              background: 'rgba(150,191,71,0.08)',
                              border: '1px solid rgba(150,191,71,0.25)',
                              color: '#96bf47',
                              textDecoration: 'none',
                            }}
                          >
                            <ExternalLink size={16} /> Preview Theme
                          </a>
                        )}
                        {deployStatus === 'done' && (
                          <button
                            onClick={handleShopifyPublish}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                            style={{
                              background: 'linear-gradient(135deg, #96bf47, #5c8a1f)',
                              color: '#fff',
                              border: 'none',
                              boxShadow: '0 4px 16px rgba(150,191,71,0.3)',
                            }}
                          >
                            <Globe size={16} /> Publish Theme (Make Live)
                          </button>
                        )}
                      </div>

                      {deployStatus === 'published' && (
                        <div className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
                          <CheckCircle2 size={16} /> Your theme is now live!
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Error state ── */}
                {deployStatus === 'error' && (
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: 'var(--color-surface)', border: '1px solid rgba(239,68,68,0.25)' }}
                  >
                    <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <AlertTriangle size={18} style={{ color: '#ef4444' }} />
                      <div className="flex-1">
                        <h4 className="text-sm font-bold" style={{ color: '#ef4444' }}>Deployment Failed</h4>
                      </div>
                    </div>
                    <div className="px-5 py-4 flex flex-col gap-3">
                      <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
                        <p className="text-xs font-mono" style={{ color: '#fca5a5' }}>{deployError}</p>
                      </div>
                      <button
                        onClick={handleDeployReset}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
                      >
                        <RefreshCw size={14} /> Try Again
                      </button>
                    </div>
                  </div>
                )}

                {/* Info note */}
                <div
                  className="flex items-start gap-2 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(150,191,71,0.04)', border: '1px solid rgba(150,191,71,0.1)' }}
                >
                  <ShoppingBag size={16} style={{ color: '#96bf47', flexShrink: 0, marginTop: 1 }} />
                  <p className="text-xs leading-relaxed" style={{ color: '#71717a' }}>
                    Generates a full Shopify Online Store 2.0 theme: layout, 12 page templates, 17 sections (hero, header, footer, product, collection, FAQ, testimonials, pricing, blog, contact), CSS design system with style presets, and JavaScript for interactivity. Your access token requires the <strong>write_themes</strong> scope.
                  </p>
                </div>
              </div>
            )}

            {/* ═══════ SETTINGS TAB ═══════ */}
            {activeTab === 'settings' && (
              <div className="flex flex-col gap-5 max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#52525b' }}>AI Provider</p>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {([
                    { key: 'auto' as AIProvider, name: 'Auto Best', model: 'Smart Routing', color: '#f59e0b', icon: <Sparkles size={20} /> },
                    { key: 'openrouter' as AIProvider, name: 'OpenRouter', model: 'Multi-Model', color: '#e11d48', icon: <Zap size={20} /> },
                    { key: 'gemini' as AIProvider, name: 'Gemini', model: '2.5 Flash', color: '#60a5fa', icon: <Star size={20} /> },
                    { key: 'claude' as AIProvider, name: 'Claude', model: 'Sonnet 4', color: '#a855f7', icon: <Zap size={20} /> },
                    { key: 'kimi' as AIProvider, name: 'Kimi', model: 'K2', color: '#06b6d4', icon: <Globe size={20} /> },
                    { key: 'openai' as AIProvider, name: 'OpenAI', model: 'GPT-4o', color: '#22c55e', icon: <Sparkles size={20} /> },
                  ]).map((p) => {
                    const active = provider === p.key;
                    return (
                      <button
                        key={p.key}
                        onClick={() => setProvider(p.key)}
                        className="rounded-xl p-4 text-left transition-all"
                        style={{
                          background: active ? `${p.color}08` : 'var(--color-surface)',
                          border: `1px solid ${active ? `${p.color}40` : 'var(--color-border)'}`,
                        }}
                        onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = `${p.color}30`; }}
                        onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; }}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${p.color}15`, border: `1px solid ${p.color}25` }}>
                            <span style={{ color: p.color }}>{p.icon}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold">{p.name}</p>
                            <p className="text-xs" style={{ color: '#52525b' }}>{p.model}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: active ? p.color : '#27272a', boxShadow: active ? `0 0 8px ${p.color}60` : 'none' }}
                          />
                          <span className="text-xs font-semibold" style={{ color: active ? p.color : '#3f3f46' }}>
                            {active ? 'Selected' : 'Select'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Provider note */}
                <div
                  className="flex items-start gap-2 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.12)' }}
                >
                  <Sparkles size={16} style={{ color: '#60a5fa', flexShrink: 0, marginTop: 1 }} />
                  <p className="text-xs leading-relaxed" style={{ color: '#93c5fd' }}>
                    <strong>Auto Best</strong> intelligently routes tasks to the optimal AI model: Gemini for fast extraction, Claude for premium copywriting, Kimi for long-context analysis, and OpenAI for reliable JSON. Fallback chain: Gemini → Claude → Kimi → OpenAI. API keys are configured server-side.
                  </p>
                </div>
              </div>
            )}

            {/* Bottom CTA */}
            <div
              className="mt-8 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{
                background: 'linear-gradient(135deg, rgba(220,38,38,0.1) 0%, rgba(0,0,0,0) 100%)',
                border: '1px solid rgba(220,38,38,0.2)',
              }}
            >
              <div>
                <p className="font-bold text-lg mb-1">
                  Love your website? <span className="gradient-text">Generate another one!</span>
                </p>
                <p className="text-sm" style={{ color: '#71717a' }}>
                  Try different styles, industries, and color schemes — unlimited AI website generations.
                </p>
              </div>
              <button
                onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="btn-primary flex-shrink-0"
                style={{ whiteSpace: 'nowrap' }}
              >
                <RefreshCw size={16} /> Build Another Website
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bounce keyframes for loading dots */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Shopify Deploy Modal */}
      {result && (
        <ShopifyDeployModal
          isOpen={showShopifyDeploy}
          onClose={() => setShowShopifyDeploy(false)}
          generation={result}
          input={input}
        />
      )}
    </section>
  );
}
