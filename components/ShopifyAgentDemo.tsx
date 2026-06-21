'use client';

import { useState, useRef } from 'react';
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  ShoppingCart,
  FileText,
  DollarSign,
  Video,
  Star,
  Megaphone,
  AlertTriangle,
  Zap,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { ShopifyResponse } from '@/app/api/agents/shopify/route';
import { saveGeneration } from '@/lib/dashboard-storage';

// ── Copy hook ─────────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }
  return { copied, copy };
}

// ── Result Card ───────────────────────────────────────────────
function ResultCard({
  icon: Icon,
  label,
  color,
  children,
  copyId,
  copyText,
  copied,
  onCopy,
  collapsible = false,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  children: React.ReactNode;
  copyId: string;
  copyText: string;
  copied: string | null;
  onCopy: (text: string, id: string) => void;
  collapsible?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const isCopied = copied === copyId;

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
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: expanded ? '1px solid var(--color-border)' : 'none', background: 'var(--color-surface-2)' }}
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
        <div className="flex items-center gap-2">
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
          {collapsible && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#52525b' }}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>
      {/* Body */}
      {expanded && <div className="p-5">{children}</div>}
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────
function LoadingSkeleton() {
  const steps = [
    'Analyzing product details…',
    'Crafting SEO description…',
    'Calculating pricing strategy…',
    'Writing TikTok ad copy…',
    'Generating benefits & angles…',
  ];
  const [stepIdx] = useState(0);

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
            <ShoppingCart size={32} style={{ color: '#ef4444' }} />
          </div>
          <div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: '#dc2626' }}
          >
            <Loader2 size={12} className="animate-spin" style={{ color: '#fff' }} />
          </div>
        </div>
        <div className="text-center">
          <p className="font-semibold text-lg mb-1">AI is building your Shopify package…</p>
          <p className="text-sm" style={{ color: '#52525b' }}>
            {steps[stepIdx]}
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

      {/* Skeleton cards */}
      {[...Array(6)].map((_, i) => (
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
            <div className="shimmer rounded-lg" style={{ height: '16px', width: '92%' }} />
            <div className="shimmer rounded-lg" style={{ height: '16px', width: '78%' }} />
            {i < 3 && <div className="shimmer rounded-lg" style={{ height: '16px', width: '65%' }} />}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Benefit / Angle item ──────────────────────────────────────
function ListItem({ text, index, color }: { text: string; index: number; color: string }) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--color-border)',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = `${color}08`)}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)')}
    >
      <span
        className="text-xs font-black flex-shrink-0 mt-0.5 w-5 h-5 rounded-md flex items-center justify-center"
        style={{ background: `${color}20`, color }}
      >
        {index + 1}
      </span>
      <span className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>
        {text}
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
const productCategories = [
  'Beauty & Skincare',
  'Health & Wellness',
  'Fitness & Sports',
  'Home & Kitchen',
  'Tech & Gadgets',
  'Fashion & Apparel',
  'Food & Beverage',
  'Pet Supplies',
  'Baby & Kids',
  'Office & Productivity',
  'Outdoor & Garden',
  'Toys & Games',
  'Other',
];

const examples = [
  {
    productName: 'AuraGlow LED Face Mask',
    productCategory: 'Beauty & Skincare',
    targetAudience: 'women aged 25–45 interested in at-home skincare routines',
    productFeatures: '7 LED light modes, clinically proven, 20-min sessions, rechargeable, dermatologist approved',
  },
  {
    productName: 'FlexPod Standing Desk Mat',
    productCategory: 'Office & Productivity',
    targetAudience: 'remote workers and entrepreneurs who stand at desks',
    productFeatures: 'anti-fatigue memory foam, non-slip base, 3/4 inch thick, 3 sizes, washable cover',
  },
  {
    productName: 'PurrFresh Self-Cleaning Litter Box',
    productCategory: 'Pet Supplies',
    targetAudience: 'cat owners living in apartments or small spaces',
    productFeatures: 'auto-cleans every 20 mins, odor sealing lid, app control, quiet motor, fits 1-3 cats',
  },
];

export default function ShopifyAgentDemo() {
  const [form, setForm] = useState({
    productName: '',
    productCategory: '',
    targetAudience: '',
    productFeatures: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<ShopifyResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const { copied, copy } = useCopy();
  const resultsRef = useRef<HTMLDivElement>(null);

  function fillExample(ex: typeof examples[0]) {
    setForm(ex);
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
  }

  function handleChange(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  const isFormValid = form.productName.trim() && form.productCategory.trim() && form.targetAudience.trim() && form.productFeatures.trim();

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;

    setStatus('loading');
    setResult(null);
    setErrorMsg('');

    try {
      const res = await fetch('/api/agents/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.productName.trim(),
          productCategory: form.productCategory.trim(),
          targetAudience: form.targetAudience.trim(),
          productFeatures: form.productFeatures.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }

      const data: ShopifyResponse = await res.json();
      setResult(data);
      setStatus('done');

      // Auto-save to dashboard history (Supabase or localStorage)
      await saveGeneration({
        agentType: 'shopify',
        agentName: 'Shopify AI Agent',
        agentIcon: '🛒',
        inputs: {
          productName: form.productName.trim(),
          productCategory: form.productCategory.trim(),
          targetAudience: form.targetAudience.trim(),
          productFeatures: form.productFeatures.trim(),
        },
        outputs: {
          productTitle: data.productTitle,
          seoDescription: data.seoDescription,
          priceSuggestion: data.priceSuggestion,
          tiktokAdCopy: data.tiktokAdCopy,
          productBenefits: data.productBenefits,
          marketingAngles: data.marketingAngles,
        },
        isSaved: false,
      });

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  function handleReset() {
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
    setForm({ productName: '', productCategory: '', targetAudience: '', productFeatures: '' });
  }

  return (
    <section
      className="py-16"
      style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)' }}
    >
      <div className="section-container">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.25)' }}
          >
            <Sparkles size={18} style={{ color: '#ef4444' }} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>
            Live Demo
          </span>
        </div>
        <h2 className="text-3xl font-black mb-2">
          Generate Your{' '}
          <span className="gradient-text">Shopify Package</span>
        </h2>
        <p className="mb-10" style={{ color: '#71717a', maxWidth: '560px' }}>
          Enter your product details and the AI will generate a complete launch package — title, SEO description, pricing, TikTok ad, benefits, and marketing angles.
        </p>

        {/* Quick examples */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-xs pt-1" style={{ color: '#3f3f46' }}>
            Try an example:
          </span>
          {examples.map((ex) => (
            <button
              key={ex.productName}
              type="button"
              onClick={() => fillExample(ex)}
              disabled={status === 'loading'}
              className="text-xs px-3 py-1.5 rounded-lg transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--color-border)',
                color: '#71717a',
                cursor: 'pointer',
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
              {ex.productName}
            </button>
          ))}
        </div>

        {/* ── Input Form ─────────────────────────────────────── */}
        <form onSubmit={handleGenerate}>
          <div
            className="rounded-2xl p-6 md:p-8"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              {/* Product Name */}
              <div>
                <label htmlFor="sh-product" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
                  Product Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="sh-product"
                  type="text"
                  required
                  maxLength={100}
                  placeholder="e.g. AuraGlow LED Face Mask"
                  value={form.productName}
                  onChange={handleChange('productName')}
                  disabled={status === 'loading'}
                  className="input-field"
                  style={{ fontSize: '0.95rem' }}
                />
              </div>

              {/* Product Category */}
              <div>
                <label htmlFor="sh-category" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
                  Product Category <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  id="sh-category"
                  required
                  value={form.productCategory}
                  onChange={handleChange('productCategory')}
                  disabled={status === 'loading'}
                  className="input-field"
                  style={{ fontSize: '0.95rem' }}
                >
                  <option value="" disabled style={{ background: '#0f0f12' }}>
                    Select a category
                  </option>
                  {productCategories.map((cat) => (
                    <option key={cat} value={cat} style={{ background: '#0f0f12' }}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Audience */}
              <div className="md:col-span-2">
                <label htmlFor="sh-audience" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
                  Target Audience <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="sh-audience"
                  type="text"
                  required
                  maxLength={120}
                  placeholder="e.g. women aged 25-45 interested in at-home skincare routines"
                  value={form.targetAudience}
                  onChange={handleChange('targetAudience')}
                  disabled={status === 'loading'}
                  className="input-field"
                  style={{ fontSize: '0.95rem' }}
                />
              </div>

              {/* Product Features */}
              <div className="md:col-span-2">
                <label htmlFor="sh-features" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
                  Product Features / Key Details <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  id="sh-features"
                  required
                  rows={3}
                  maxLength={400}
                  placeholder="e.g. 7 LED light modes, clinically proven, 20-min sessions, rechargeable, dermatologist approved…"
                  value={form.productFeatures}
                  onChange={handleChange('productFeatures')}
                  disabled={status === 'loading'}
                  className="input-field"
                  style={{ resize: 'vertical', fontSize: '0.95rem', minHeight: '88px' }}
                />
                <p className="text-xs mt-1.5" style={{ color: '#3f3f46' }}>
                  Tip: Comma-separated features work best. More detail = better AI output.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                id="sh-generate-btn"
                type="submit"
                disabled={status === 'loading' || !isFormValid}
                className="btn-primary"
                style={{
                  opacity: status === 'loading' || !isFormValid ? 0.6 : 1,
                  cursor: status === 'loading' || !isFormValid ? 'not-allowed' : 'pointer',
                  minWidth: '220px',
                  justifyContent: 'center',
                }}
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Generating Package…
                  </>
                ) : (
                  <>
                    <Zap size={17} />
                    Generate Shopify Package
                  </>
                )}
              </button>

              {status === 'done' && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-secondary flex items-center gap-2"
                  style={{ padding: '0.75rem 1.25rem' }}
                >
                  <RefreshCw size={15} />
                  New Product
                </button>
              )}
            </div>
          </div>
        </form>

        {/* ── Loading ──────────────────────────────────────── */}
        {status === 'loading' && <LoadingSkeleton />}

        {/* ── Error ────────────────────────────────────────── */}
        {status === 'error' && (
          <div
            className="mt-8 rounded-2xl p-5 flex items-start gap-4"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)' }}
          >
            <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="font-semibold mb-1" style={{ color: '#ef4444' }}>
                Generation failed
              </p>
              <p className="text-sm" style={{ color: '#a1a1aa' }}>
                {errorMsg}
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="btn-secondary mt-3"
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* ── Results ──────────────────────────────────────── */}
        {status === 'done' && result && (
          <div ref={resultsRef} className="mt-10">
            {/* Header row */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h3 className="text-xl font-black mb-1">
                  Package Generated{' '}
                  <span style={{ color: '#22c55e' }}>✓</span>
                </h3>
                <p className="text-sm" style={{ color: '#52525b' }}>
                  6 assets ready for{' '}
                  <strong style={{ color: '#f8f8f8' }}>{form.productName}</strong>
                </p>
              </div>
              {result.isDemo && (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                  style={{
                    background: 'rgba(234,179,8,0.08)',
                    border: '1px solid rgba(234,179,8,0.25)',
                    color: '#eab308',
                  }}
                >
                  <AlertTriangle size={13} />
                  Demo mode — Add OPENAI_API_KEY for real AI output
                </div>
              )}
            </div>

            {/* Top 2-col grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              {/* Product Title */}
              <ResultCard
                icon={ShoppingCart}
                label="Product Title"
                color="#ef4444"
                copyId="title"
                copyText={result.productTitle}
                copied={copied}
                onCopy={copy}
              >
                <p className="font-semibold text-base leading-relaxed" style={{ color: '#f8f8f8' }}>
                  {result.productTitle}
                </p>
                <p className="text-xs mt-2" style={{ color: '#52525b' }}>
                  {result.productTitle.length} characters — paste directly into Shopify
                </p>
              </ResultCard>

              {/* Price Suggestion */}
              <ResultCard
                icon={DollarSign}
                label="Price Strategy"
                color="#22c55e"
                copyId="price"
                copyText={result.priceSuggestion}
                copied={copied}
                onCopy={copy}
              >
                <p
                  className="text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: '#a1a1aa' }}
                >
                  {result.priceSuggestion}
                </p>
              </ResultCard>
            </div>

            {/* SEO Description — full width */}
            <div className="mb-5">
              <ResultCard
                icon={FileText}
                label="SEO Product Description"
                color="#f97316"
                copyId="seo"
                copyText={result.seoDescription}
                copied={copied}
                onCopy={copy}
                collapsible
              >
                <p className="text-sm leading-relaxed" style={{ color: '#a1a1aa', lineHeight: '1.8' }}>
                  {result.seoDescription}
                </p>
              </ResultCard>
            </div>

            {/* TikTok Ad Copy — full width */}
            <div className="mb-5">
              <ResultCard
                icon={Video}
                label="TikTok / Reels Ad Copy"
                color="#a855f7"
                copyId="tiktok"
                copyText={result.tiktokAdCopy}
                copied={copied}
                onCopy={copy}
                collapsible
              >
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#a1a1aa' }}>
                  {result.tiktokAdCopy}
                </p>
              </ResultCard>
            </div>

            {/* Bottom 2-col grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
              {/* 10 Benefits */}
              <ResultCard
                icon={Star}
                label="10 Product Benefits"
                color="#eab308"
                copyId="benefits"
                copyText={result.productBenefits.join('\n')}
                copied={copied}
                onCopy={copy}
              >
                <div className="flex flex-col gap-2">
                  {result.productBenefits.map((benefit, i) => (
                    <ListItem key={i} text={benefit} index={i} color="#eab308" />
                  ))}
                </div>
              </ResultCard>

              {/* Marketing Angles */}
              <ResultCard
                icon={Megaphone}
                label="Marketing Angles"
                color="#60a5fa"
                copyId="angles"
                copyText={result.marketingAngles.join('\n\n')}
                copied={copied}
                onCopy={copy}
              >
                <div className="flex flex-col gap-2">
                  {result.marketingAngles.map((angle, i) => (
                    <ListItem key={i} text={angle} index={i} color="#60a5fa" />
                  ))}
                </div>
              </ResultCard>
            </div>

            {/* Bottom CTA */}
            <div
              className="rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{
                background: 'linear-gradient(135deg, rgba(220,38,38,0.1) 0%, rgba(0,0,0,0) 100%)',
                border: '1px solid rgba(220,38,38,0.2)',
              }}
            >
              <div>
                <p className="font-bold text-lg mb-1">
                  Want this agent running{' '}
                  <span className="gradient-text">24/7 for your store?</span>
                </p>
                <p className="text-sm" style={{ color: '#71717a' }}>
                  Get the Shopify AI Agent deployed — auto-generates listings, manages inventory alerts, and recovers abandoned carts on autopilot.
                </p>
              </div>
              <a
                href="/request?agent=shopify-ai-agent"
                className="btn-primary flex-shrink-0"
                style={{ whiteSpace: 'nowrap' }}
              >
                <Zap size={16} />
                Request Setup — $297/mo
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Bounce keyframes */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </section>
  );
}
