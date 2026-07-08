'use client';

import { useState, useRef } from 'react';
import {
  Sparkles, Loader2, Copy, Check, RefreshCw, AlertTriangle, Zap, Eye,
  Download, Settings, Search, Megaphone, Palette, Layout, Code, FileJson,
  Globe, ChevronDown, ChevronRight, Edit3, X, Monitor, Tablet, Smartphone,
  ExternalLink, Mail, Phone, MapPin, Star, Quote, ArrowRight, Hash,
  Type, Image as ImageIcon, Layers, Target, PenTool, Briefcase,
  ShoppingBag, Upload, CheckCircle2, Plug,
} from 'lucide-react';
import type {
  WebsiteBuilderInput, WebsiteGeneration, PreferredStyle, AIProvider, ExportFormat,
  HomepageSection, AboutSection, ServicesSection, PricingSection, FAQSection,
  TestimonialsSection, ContactSection, FooterSection, SEOData, BrandingData, MarketingData,
} from '@/lib/website-builder-types';
import { saveGeneration } from '@/lib/dashboard-storage';
import { generateShopifyTheme } from '@/lib/shopify-theme-generator';
import type {
  ShopifyThemeFile, ThemeCreateResponse, ThemePublishResponse, ThemeDeployStatus,
} from '@/lib/shopify-types';

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

// ════════════════════════════════════════════════════════════════
// Preview HTML Generator
// ════════════════════════════════════════════════════════════════

function generatePreviewHtml(result: WebsiteGeneration, input: WebsiteBuilderInput): string {
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
  const [accessToken, setAccessToken] = useState('');
  const [shopName, setShopName] = useState('');

  // Deploy state
  const [deployStatus, setDeployStatus] = useState<ThemeDeployStatus>('idle');
  const [themeId, setThemeId] = useState<number | null>(null);
  const [themeName, setThemeName] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState({ uploaded: 0, total: 0 });
  const [deployError, setDeployError] = useState('');
  const [fileErrors, setFileErrors] = useState<string[]>([]);

  // Load saved credentials
  useState(() => {
    try {
      const stored = localStorage.getItem(SHOPIFY_CREDS_KEY);
      if (stored) {
        const creds = JSON.parse(stored);
        if (creds.storeDomain) setStoreDomain(creds.storeDomain);
        if (creds.accessToken) setAccessToken(creds.accessToken);
        if (creds.shopName) setShopName(creds.shopName);
      }
    } catch { /* ignore */ }
  });

  async function handleDeploy() {
    if (!storeDomain.trim() || !accessToken.trim()) return;

    setDeployError('');
    setFileErrors([]);

    // Step 1: Test connection
    setDeployStatus('connecting');
    try {
      const connectRes = await fetch('/api/shopify/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeDomain: storeDomain.trim(), accessToken: accessToken.trim() }),
      });
      const connectData = await connectRes.json();
      if (!connectData.success) throw new Error(connectData.error || 'Connection failed');
      setShopName(connectData.shopName || storeDomain);
      // Save credentials
      try {
        localStorage.setItem(SHOPIFY_CREDS_KEY, JSON.stringify({
          storeDomain: storeDomain.trim(),
          accessToken: accessToken.trim(),
          shopName: connectData.shopName,
        }));
      } catch { /* ignore */ }
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : 'Connection failed');
      setDeployStatus('error');
      return;
    }

    // Step 2: Generate theme files
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

    // Step 3: Create theme + upload to Shopify
    setDeployStatus('creating');
    const name = `${input.businessName || 'RootX'} Theme — ${new Date().toLocaleDateString()}`;
    setThemeName(name);

    try {
      const res = await fetch('/api/shopify/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          storeDomain: storeDomain.trim(),
          accessToken: accessToken.trim(),
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
      const res = await fetch('/api/shopify/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish',
          storeDomain: storeDomain.trim(),
          accessToken: accessToken.trim(),
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
        className="w-full max-w-lg rounded-2xl overflow-hidden"
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
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* ── IDLE: Connection form ── */}
          {deployStatus === 'idle' && (
            <>
              {shopName && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                  <CheckCircle2 size={14} style={{ color: '#22c55e' }} />
                  <span className="text-xs" style={{ color: '#22c55e' }}>Connected to <strong>{shopName}</strong></span>
                  <button onClick={() => { setShopName(''); setStoreDomain(''); setAccessToken(''); }} className="ml-auto text-xs" style={{ color: '#52525b' }}>Change</button>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Store Domain *</label>
                <input
                  type="text"
                  placeholder="my-store.myshopify.com"
                  value={storeDomain}
                  onChange={(e) => setStoreDomain(e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Admin API Access Token *</label>
                <input
                  type="password"
                  placeholder="shpat_xxxxxxxxxxxxx"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <p className="text-xs" style={{ color: '#52525b' }}>
                Requires <strong>write_themes</strong> scope. Your token is stored locally and never shared.
              </p>
              <button
                onClick={handleDeploy}
                disabled={!storeDomain.trim() || !accessToken.trim()}
                className="btn-primary w-full"
                style={{ justifyContent: 'center', opacity: (!storeDomain.trim() || !accessToken.trim()) ? 0.5 : 1 }}
              >
                <Upload size={16} /> Deploy Theme to Shopify
              </button>
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

// ════════════════════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════════════════════

export default function WebsiteBuilderDemo() {
  // Form state
  const [input, setInput] = useState<WebsiteBuilderInput>({
    businessName: '', businessType: '', targetAudience: '', brandDescription: '',
    preferredStyle: 'modern', primaryColor: '#dc2626', secondaryColor: '#1e40af',
    language: 'English', country: 'United States',
  });

  // Generation state
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<WebsiteGeneration | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // UI state
  const [activeTab, setActiveTab] = useState<'pages' | 'branding' | 'seo' | 'marketing' | 'preview' | 'export' | 'shopify' | 'settings'>('pages');
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [editMode, setEditMode] = useState(false);
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());
  const { copiedId, copy } = useCopy();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [showShopifyDeploy, setShowShopifyDeploy] = useState(false);

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

  // Load Shopify creds from localStorage on mount
  const shopifyCredsLoaded = useRef(false);
  if (!shopifyCredsLoaded.current) {
    shopifyCredsLoaded.current = true;
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(SHOPIFY_CREDS_KEY) : null;
      if (stored) {
        const c = JSON.parse(stored);
        if (c.storeDomain) setShopifyDomain(c.storeDomain);
        if (c.accessToken) setShopifyToken(c.accessToken);
        if (c.shopName) setShopifyShopName(c.shopName);
      }
    } catch { /* ignore */ }
  }

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

  // ── Shopify deploy handlers ──────────────────────────────────

  function saveShopifyCreds(domain: string, token: string, name: string) {
    try {
      localStorage.setItem(SHOPIFY_CREDS_KEY, JSON.stringify({
        storeDomain: domain, accessToken: token, shopName: name,
      }));
    } catch { /* ignore */ }
  }

  async function handleShopifyConnect() {
    if (!shopifyDomain.trim() || !shopifyToken.trim()) return;
    setDeployStatus('connecting');
    setDeployError('');
    try {
      const res = await fetch('/api/shopify/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeDomain: shopifyDomain.trim(), accessToken: shopifyToken.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Connection failed');
      setShopifyShopName(data.shopName || shopifyDomain);
      saveShopifyCreds(shopifyDomain.trim(), shopifyToken.trim(), data.shopName || '');
      setDeployStatus('idle');
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : 'Connection failed');
      setDeployStatus('error');
    }
  }

  function handleShopifyDisconnect() {
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
      const res = await fetch('/api/shopify/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch('/api/shopify/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  function handleExportThemeZip() {
    if (!result) return;
    const files = generateShopifyTheme(result, input);
    // Build a simple concatenated text file with all theme files
    let content = '';
    for (const f of files) {
      content += `\n${'='.repeat(60)}\n`;
      content += `FILE: ${f.key}\n`;
      content += `${'='.repeat(60)}\n\n`;
      content += f.value;
      content += '\n';
    }
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(input.businessName || 'shopify-theme').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-theme.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
            style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.25)' }}
          >
            <Globe size={18} style={{ color: '#ef4444' }} />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>
              Live Demo
            </span>
          </div>
        </div>
        <h2 className="text-3xl font-black mb-2">
          Build Your Website <span className="gradient-text">With AI</span>
        </h2>
        <p className="mb-10" style={{ color: '#71717a', maxWidth: '560px' }}>
          Enter your business details and let AI generate a complete website — pages, branding, SEO, and marketing content — in seconds.
        </p>

        {/* Input Form */}
        <InputForm input={input} setInput={setInput} status={status} onSubmit={handleGenerate} onReset={handleReset} />

        {/* Loading */}
        {status === 'loading' && <LoadingSkeleton />}

        {/* Error */}
        {status === 'error' && (
          <div
            className="mt-8 rounded-2xl p-5 flex items-start gap-4"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)' }}
          >
            <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="font-semibold mb-1" style={{ color: '#ef4444' }}>Generation failed</p>
              <p className="text-sm" style={{ color: '#a1a1aa' }}>{errorMsg}</p>
              <button onClick={handleReset} className="btn-secondary mt-3" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
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
                  Website Generated <span style={{ color: '#22c55e' }}>✓</span>
                </h3>
                <p className="text-sm" style={{ color: '#52525b' }}>
                  Complete website for <strong style={{ color: '#f8f8f8' }}>{input.businessName}</strong> ({input.businessType})
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
                {/* Homepage */}
                <SectionCard title="Homepage" icon={<Layout size={16} style={{ color: '#ef4444' }} />} color="#ef4444" defaultOpen>
                  {/* Hero preview */}
                  <div
                    className="rounded-xl p-6 mb-5 text-center"
                    style={{
                      background: `linear-gradient(135deg, ${input.primaryColor} 0%, ${input.secondaryColor} 100%)`,
                      color: '#fff',
                    }}
                  >
                    <div className="flex items-center justify-end gap-1 mb-4">
                      <CopyBtn text={result.homepage.hero.headline} id="hero-hl" copiedId={copiedId} onCopy={copy} size="xs" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">{result.homepage.hero.headline}</h3>
                    <p className="text-sm mb-4" style={{ opacity: 0.9 }}>{result.homepage.hero.subheadline}</p>
                    <div className="flex gap-2 justify-center flex-wrap">
                      {result.homepage.hero.ctaButtons.map((btn, i) => (
                        <span
                          key={i}
                          className="text-xs font-bold px-4 py-2 rounded-lg"
                          style={{
                            background: btn.variant === 'primary' ? '#fff' : 'transparent',
                            color: btn.variant === 'primary' ? input.primaryColor : '#fff',
                            border: btn.variant === 'secondary' ? '1px solid rgba(255,255,255,0.4)' : 'none',
                          }}
                        >
                          {btn.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Social proof */}
                  <p className="text-xs mb-4" style={{ color: '#71717a' }}>
                    <strong style={{ color: '#a1a1aa' }}>Social Proof:</strong> {result.homepage.socialProof}
                  </p>
                  {/* Features grid */}
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#52525b' }}>Features</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {result.homepage.features.map((f, i) => (
                      <div key={i} className="rounded-xl p-4" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                        <div className="text-2xl mb-2">{f.icon}</div>
                        <h4 className="text-sm font-bold mb-1">{f.title}</h4>
                        <p className="text-xs" style={{ color: '#71717a' }}>{f.description}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* About */}
                <SectionCard title="About" icon={<Briefcase size={16} style={{ color: '#60a5fa' }} />} color="#60a5fa">
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#3f3f46' }}>Mission</p>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>{result.about.mission}</p>
                        <CopyBtn text={result.about.mission} id="about-mission" copiedId={copiedId} onCopy={copy} size="xs" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#3f3f46' }}>Vision</p>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>{result.about.vision}</p>
                        <CopyBtn text={result.about.vision} id="about-vision" copiedId={copiedId} onCopy={copy} size="xs" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#3f3f46' }}>Values</p>
                      <div className="flex flex-wrap gap-2">
                        {result.about.values.map((v, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa' }}>
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#3f3f46' }}>Content</p>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>{result.about.content}</p>
                        <CopyBtn text={result.about.content} id="about-content" copiedId={copiedId} onCopy={copy} size="xs" />
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* Services */}
                <SectionCard title="Services" icon={<Layers size={16} style={{ color: '#a855f7' }} />} color="#a855f7">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.services.services.map((s, i) => (
                      <div key={i} className="rounded-xl p-4" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{s.icon}</span>
                            <h4 className="text-sm font-bold">{s.title}</h4>
                          </div>
                          <CopyBtn text={`${s.title}\n${s.description}\n${s.features.join('\n')}`} id={`svc-${i}`} copiedId={copiedId} onCopy={copy} size="xs" />
                        </div>
                        <p className="text-xs mb-3" style={{ color: '#71717a' }}>{s.description}</p>
                        <ul className="flex flex-col gap-1">
                          {s.features.map((f, fi) => (
                            <li key={fi} className="text-xs flex items-center gap-1.5" style={{ color: '#a1a1aa' }}>
                              <span style={{ color: '#a855f7', fontWeight: 700 }}>✓</span> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Pricing */}
                <SectionCard title="Pricing" icon={<Target size={16} style={{ color: '#22c55e' }} />} color="#22c55e">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {result.pricing.plans.map((plan, i) => (
                      <div
                        key={i}
                        className="rounded-xl p-5 text-center relative"
                        style={{
                          background: plan.isPopular ? 'rgba(220,38,38,0.04)' : 'var(--color-surface-2)',
                          border: plan.isPopular ? '1px solid rgba(220,38,38,0.3)' : '1px solid var(--color-border)',
                        }}
                      >
                        {plan.isPopular && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-0.5 rounded-full"
                            style={{ background: '#dc2626', color: '#fff', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Most Popular
                          </span>
                        )}
                        <h4 className="text-sm font-bold mb-1 mt-1">{plan.name}</h4>
                        <div className="text-2xl font-black mb-0.5" style={{ color: plan.isPopular ? '#ef4444' : '#f8f8f8' }}>{plan.price}</div>
                        <p className="text-xs mb-3" style={{ color: '#52525b' }}>{plan.period}</p>
                        <p className="text-xs mb-3" style={{ color: '#71717a' }}>{plan.description}</p>
                        <ul className="text-left flex flex-col gap-1 mb-4">
                          {plan.features.map((f, fi) => (
                            <li key={fi} className="text-xs flex items-center gap-1.5" style={{ color: '#a1a1aa' }}>
                              <Check size={10} style={{ color: '#22c55e', flexShrink: 0 }} /> {f}
                            </li>
                          ))}
                        </ul>
                        <span
                          className="block text-xs font-bold py-2 rounded-lg"
                          style={{
                            background: plan.isPopular ? '#dc2626' : 'rgba(255,255,255,0.04)',
                            color: plan.isPopular ? '#fff' : '#a1a1aa',
                            border: plan.isPopular ? 'none' : '1px solid var(--color-border)',
                          }}
                        >
                          {plan.cta}
                        </span>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* FAQ */}
                <SectionCard title="FAQ" icon={<Hash size={16} style={{ color: '#eab308' }} />} color="#eab308">
                  <div className="flex flex-col gap-0">
                    {result.faq.items.map((item, i) => (
                      <div key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <button
                          className="w-full flex items-center justify-between py-3 text-left"
                          onClick={() => {
                            const next = new Set(openFaqs);
                            if (next.has(i)) next.delete(i); else next.add(i);
                            setOpenFaqs(next);
                          }}
                        >
                          <span className="text-sm font-semibold pr-4">{item.question}</span>
                          {openFaqs.has(i) ? <ChevronDown size={14} style={{ color: '#eab308', flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: '#52525b', flexShrink: 0 }} />}
                        </button>
                        {openFaqs.has(i) && (
                          <p className="text-sm pb-3 leading-relaxed" style={{ color: '#a1a1aa' }}>{item.answer}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Testimonials */}
                <SectionCard title="Testimonials" icon={<Quote size={16} style={{ color: '#f97316' }} />} color="#f97316">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.testimonials.testimonials.map((t, i) => (
                      <div key={i} className="rounded-xl p-4" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                        <div className="flex items-center gap-0.5 mb-2">
                          {Array.from({ length: 5 }).map((_, si) => (
                            <Star key={si} size={14} style={{ color: si < t.rating ? '#f59e0b' : '#27272a' }} fill={si < t.rating ? '#f59e0b' : 'none'} />
                          ))}
                        </div>
                        <p className="text-sm italic leading-relaxed mb-3" style={{ color: '#a1a1aa' }}>
                          &ldquo;{t.quote}&rdquo;
                        </p>
                        <div>
                          <p className="text-sm font-bold">{t.name}</p>
                          <p className="text-xs" style={{ color: '#52525b' }}>{t.role}, {t.company}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Contact */}
                <SectionCard title="Contact" icon={<Mail size={16} style={{ color: '#06b6d4' }} />} color="#06b6d4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Mail size={14} style={{ color: '#06b6d4' }} />
                        <span className="text-sm" style={{ color: '#a1a1aa' }}>{result.contact.email}</span>
                        <CopyBtn text={result.contact.email} id="contact-email" copiedId={copiedId} onCopy={copy} size="xs" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={14} style={{ color: '#06b6d4' }} />
                        <span className="text-sm" style={{ color: '#a1a1aa' }}>{result.contact.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} style={{ color: '#06b6d4' }} />
                        <span className="text-sm" style={{ color: '#a1a1aa' }}>{result.contact.address}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#3f3f46' }}>Form Fields</p>
                      {result.contact.formFields.map((f, i) => (
                        <div key={i} className="rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: '#71717a' }}>
                          <span className="font-semibold" style={{ color: '#a1a1aa' }}>{f.label}</span>
                          <span style={{ color: '#3f3f46' }}> • {f.type}</span>
                          {f.required && <span style={{ color: '#ef4444' }}> *</span>}
                        </div>
                      ))}
                    </div>
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
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
                      <Palette size={14} style={{ color: '#a855f7' }} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#a855f7' }}>Color Palette</span>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {result.branding.colorPalette.map((c, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => copy(c.hex, `color-${i}`)}>
                          <div
                            className="w-14 h-14 rounded-full shadow-lg"
                            style={{ background: c.hex, border: '3px solid var(--color-border)', boxShadow: `0 4px 16px ${c.hex}40` }}
                          />
                          <div className="text-center">
                            <p className="text-xs font-bold font-mono" style={{ color: copiedId === `color-${i}` ? '#22c55e' : '#a1a1aa' }}>
                              {copiedId === `color-${i}` ? 'Copied!' : c.hex}
                            </p>
                            <p className="text-xs" style={{ color: '#3f3f46' }}>{c.name}</p>
                            <p className="text-xs" style={{ color: '#27272a' }}>{c.usage}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Typography */}
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)' }}>
                      <Type size={14} style={{ color: '#60a5fa' }} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#60a5fa' }}>Typography</span>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { label: 'Heading Font', value: result.branding.typography.heading, icon: <Type size={16} /> },
                        { label: 'Body Font', value: result.branding.typography.body, icon: <PenTool size={16} /> },
                        { label: 'Accent Font', value: result.branding.typography.accent, icon: <Sparkles size={16} /> },
                      ].map((t, i) => (
                        <div key={i} className="rounded-xl p-4" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <span style={{ color: '#60a5fa' }}>{t.icon}</span>
                            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#3f3f46' }}>{t.label}</span>
                          </div>
                          <p className="text-lg font-bold" style={{ fontFamily: `'${t.value}', sans-serif` }}>{t.value}</p>
                        </div>
                      ))}
                    </div>
                    {result.branding.typography.googleFontsUrl && (
                      <div className="mt-3 flex items-center gap-2">
                        <ExternalLink size={12} style={{ color: '#60a5fa' }} />
                        <a
                          href={result.branding.typography.googleFontsUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs" style={{ color: '#60a5fa' }}
                        >
                          View on Google Fonts
                        </a>
                      </div>
                    )}
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
              <div className="flex flex-col gap-4">
                {/* Viewport toggle */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#52525b' }}>Live Preview</p>
                  <div className="flex gap-1.5">
                    {([
                      { key: 'desktop' as const, icon: <Monitor size={14} />, label: 'Desktop' },
                      { key: 'tablet' as const, icon: <Tablet size={14} />, label: 'Tablet' },
                      { key: 'mobile' as const, icon: <Smartphone size={14} />, label: 'Mobile' },
                    ]).map((vp) => (
                      <button
                        key={vp.key}
                        onClick={() => setPreviewViewport(vp.key)}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all"
                        style={{
                          background: previewViewport === vp.key ? 'rgba(220,38,38,0.08)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${previewViewport === vp.key ? 'rgba(220,38,38,0.3)' : 'var(--color-border)'}`,
                          color: previewViewport === vp.key ? '#ef4444' : '#71717a',
                        }}
                      >
                        {vp.icon} {vp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* iframe */}
                <div
                  className="rounded-2xl overflow-hidden mx-auto transition-all duration-300"
                  style={{
                    width: viewportWidths[previewViewport],
                    maxWidth: '100%',
                    border: '1px solid var(--color-border)',
                    background: '#fff',
                  }}
                >
                  <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#eab308' }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#22c55e' }} />
                    <div className="flex-1 mx-3 px-3 py-1 rounded-md text-xs font-mono" style={{ background: 'var(--color-surface-2)', color: '#52525b' }}>
                      {input.businessName.toLowerCase().replace(/\s+/g, '')}.com
                    </div>
                  </div>
                  <iframe
                    srcDoc={generatePreviewHtml(result, input)}
                    title="Website Preview"
                    className="w-full border-0"
                    style={{ height: '600px', background: '#fff' }}
                    sandbox="allow-scripts"
                  />
                </div>
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
                      <h4 className="text-sm font-bold">Export Theme Files</h4>
                      <p className="text-xs" style={{ color: '#71717a' }}>Download all Shopify Liquid theme files</p>
                    </div>
                    <button
                      onClick={handleExportThemeZip}
                      className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', color: '#eab308' }}
                    >
                      <Download size={14} /> Download Theme
                    </button>
                  </div>
                  <div className="px-5 py-3">
                    <p className="text-xs" style={{ color: '#52525b' }}>
                      Exports all 26+ Shopify OS 2.0 theme files — layout, templates, sections, snippets, assets, config, and locales.
                    </p>
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
                        {isShopifyConnected ? shopifyShopName : 'Enter your Shopify Admin API credentials'}
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Store Domain *</label>
                          <input
                            type="text"
                            placeholder="my-store.myshopify.com"
                            value={shopifyDomain}
                            onChange={(e) => setShopifyDomain(e.target.value)}
                            className="input-field w-full"
                            disabled={deployStatus === 'connecting'}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Admin API Access Token *</label>
                          <input
                            type="password"
                            placeholder="shpat_xxxxxxxxxxxxx"
                            value={shopifyToken}
                            onChange={(e) => setShopifyToken(e.target.value)}
                            className="input-field w-full"
                            disabled={deployStatus === 'connecting'}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleShopifyConnect}
                          disabled={!shopifyDomain.trim() || !shopifyToken.trim() || deployStatus === 'connecting'}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all"
                          style={{
                            background: (!shopifyDomain.trim() || !shopifyToken.trim()) ? 'rgba(150,191,71,0.06)' : 'rgba(150,191,71,0.15)',
                            border: '1px solid rgba(150,191,71,0.25)',
                            color: '#96bf47',
                            opacity: (!shopifyDomain.trim() || !shopifyToken.trim()) ? 0.5 : 1,
                          }}
                        >
                          {deployStatus === 'connecting'
                            ? <><Loader2 size={14} className="animate-spin" /> Connecting...</>
                            : <><Plug size={14} /> Connect Store</>
                          }
                        </button>
                        <p className="text-xs" style={{ color: '#52525b' }}>
                          Requires <strong>write_themes</strong> scope
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {([
                    { key: 'openai' as AIProvider, name: 'OpenAI', model: 'GPT-4o', color: '#22c55e', icon: <Sparkles size={20} /> },
                    { key: 'claude' as AIProvider, name: 'Claude', model: 'Sonnet 4', color: '#a855f7', icon: <Zap size={20} /> },
                    { key: 'gemini' as AIProvider, name: 'Gemini', model: '2.5 Pro', color: '#60a5fa', icon: <Star size={20} /> },
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
                    API keys are configured server-side. Switch between providers to compare output quality and style. Each provider generates unique content based on its AI model characteristics.
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
