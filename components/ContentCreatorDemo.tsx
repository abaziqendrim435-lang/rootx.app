'use client';

import { useState, useRef } from 'react';
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  TrendingUp,
  Megaphone,
  Hash,
  Video,
  AlertTriangle,
  Zap,
  RefreshCw,
} from 'lucide-react';
import type { ContentResponse } from '@/app/api/agents/content/route';
import { saveGeneration } from '@/lib/dashboard-storage';

// ── Copy-to-clipboard hook ───────────────────────────────────
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

// ── Single result card ────────────────────────────────────────
function ResultCard({
  icon: Icon,
  label,
  color,
  children,
  copyId,
  copyText,
  copied,
  onCopy,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  children: React.ReactNode;
  copyId: string;
  copyText: string;
  copied: string | null;
  onCopy: (text: string, id: string) => void;
}) {
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
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)')
      }
    >
      {/* Card header */}
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
      {/* Card body */}
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Loading skeleton ─────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-5 mt-10">
      {/* Animated "thinking" message */}
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
          <p className="font-semibold text-lg mb-1">AI is crafting your content…</p>
          <p className="text-sm" style={{ color: '#52525b' }}>
            Generating TikTok caption, ad copy, hashtags & video script
          </p>
        </div>
        {/* Progress dots */}
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

// ── Main component ────────────────────────────────────────────
export default function ContentCreatorDemo() {
  const [productName, setProductName] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<ContentResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const { copied, copy } = useCopy();
  const resultsRef = useRef<HTMLDivElement>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!productName.trim() || !targetAudience.trim()) return;

    setStatus('loading');
    setResult(null);
    setErrorMsg('');

    try {
      const res = await fetch('/api/agents/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: productName.trim(), targetAudience: targetAudience.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }

      const data: ContentResponse = await res.json();
      setResult(data);
      setStatus('done');

      // Auto-save to dashboard history (Supabase or localStorage)
      await saveGeneration({
        agentType: 'content-creator',
        agentName: 'Content Creator Agent',
        agentIcon: '✍️',
        inputs: {
          productName: productName.trim(),
          targetAudience: targetAudience.trim(),
        },
        outputs: {
          tiktokCaption: data.tiktokCaption,
          adCopy: data.adCopy,
          hashtags: data.hashtags,
          videoScript: data.videoScript,
        },
        isSaved: false,
      });

      // Smooth scroll to results
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

  const examples = [
    { product: 'RootX AI Platform', audience: 'small business owners' },
    { product: 'FitFlow Protein Bar', audience: 'fitness enthusiasts aged 25-35' },
    { product: 'LegalEase Contract Tool', audience: 'freelancers and consultants' },
  ];

  return (
    <section
      className="py-16"
      style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)' }}
    >
      <div className="section-container">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.25)' }}
          >
            <Sparkles size={18} style={{ color: '#ef4444' }} />
          </div>
          <div>
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: '#ef4444' }}
            >
              Live Demo
            </span>
          </div>
        </div>
        <h2 className="text-3xl font-black mb-2">
          Try It <span className="gradient-text">Right Now</span>
        </h2>
        <p className="mb-10" style={{ color: '#71717a', maxWidth: '520px' }}>
          Enter your product and target audience. The AI agent will generate 4 pieces of content
          instantly — TikTok caption, ad copy, hashtags & a video script.
        </p>

        {/* ── Input form ─────────────────────────────────────── */}
        <form onSubmit={handleGenerate}>
          <div
            className="rounded-2xl p-6 md:p-8"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              {/* Product Name */}
              <div>
                <label
                  htmlFor="cc-product"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: '#a1a1aa' }}
                >
                  Product / Brand Name{' '}
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="cc-product"
                  type="text"
                  required
                  maxLength={80}
                  placeholder="e.g. AuraFit App, Tesla Model Y, Notion…"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  disabled={status === 'loading'}
                  className="input-field"
                  style={{ fontSize: '0.95rem' }}
                />
              </div>

              {/* Target Audience */}
              <div>
                <label
                  htmlFor="cc-audience"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: '#a1a1aa' }}
                >
                  Target Audience{' '}
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="cc-audience"
                  type="text"
                  required
                  maxLength={80}
                  placeholder="e.g. female entrepreneurs, gym beginners, SaaS founders…"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  disabled={status === 'loading'}
                  className="input-field"
                  style={{ fontSize: '0.95rem' }}
                />
              </div>
            </div>

            {/* Quick examples */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-xs" style={{ color: '#3f3f46', paddingTop: '2px' }}>
                Try:
              </span>
              {examples.map((ex) => (
                <button
                  key={ex.product}
                  type="button"
                  onClick={() => {
                    setProductName(ex.product);
                    setTargetAudience(ex.audience);
                  }}
                  disabled={status === 'loading'}
                  className="text-xs px-2.5 py-1 rounded-lg transition-all duration-200"
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
                  {ex.product}
                </button>
              ))}
            </div>

            {/* Buttons row */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                id="cc-generate-btn"
                type="submit"
                disabled={status === 'loading' || !productName.trim() || !targetAudience.trim()}
                className="btn-primary"
                style={{
                  opacity:
                    status === 'loading' || !productName.trim() || !targetAudience.trim() ? 0.6 : 1,
                  cursor:
                    status === 'loading' || !productName.trim() || !targetAudience.trim()
                      ? 'not-allowed'
                      : 'pointer',
                  minWidth: '200px',
                  justifyContent: 'center',
                }}
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Zap size={17} />
                    Generate Content
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
                  New Content
                </button>
              )}
            </div>
          </div>
        </form>

        {/* ── Loading ────────────────────────────────────────── */}
        {status === 'loading' && <LoadingSkeleton />}

        {/* ── Error ─────────────────────────────────────────── */}
        {status === 'error' && (
          <div
            className="mt-8 rounded-2xl p-5 flex items-start gap-4"
            style={{
              background: 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.25)',
            }}
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
                onClick={handleReset}
                className="btn-secondary mt-3"
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* ── Results ───────────────────────────────────────── */}
        {status === 'done' && result && (
          <div ref={resultsRef} className="mt-10">
            {/* Header row */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h3 className="text-xl font-black mb-1">
                  Content Generated{' '}
                  <span style={{ color: '#22c55e' }}>✓</span>
                </h3>
                <p className="text-sm" style={{ color: '#52525b' }}>
                  4 assets for{' '}
                  <strong style={{ color: '#f8f8f8' }}>{productName}</strong> targeting{' '}
                  <strong style={{ color: '#f8f8f8' }}>{targetAudience}</strong>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* TikTok Caption */}
              <ResultCard
                icon={TrendingUp}
                label="TikTok Caption"
                color="#ef4444"
                copyId="tiktok"
                copyText={result.tiktokCaption}
                copied={copied}
                onCopy={copy}
              >
                <p
                  className="text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: '#a1a1aa' }}
                >
                  {result.tiktokCaption}
                </p>
              </ResultCard>

              {/* Ad Copy */}
              <ResultCard
                icon={Megaphone}
                label="Ad Copy"
                color="#f97316"
                copyId="adcopy"
                copyText={result.adCopy}
                copied={copied}
                onCopy={copy}
              >
                <p
                  className="text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: '#a1a1aa' }}
                >
                  {result.adCopy}
                </p>
              </ResultCard>

              {/* Hashtags */}
              <ResultCard
                icon={Hash}
                label="Hashtags"
                color="#a855f7"
                copyId="hashtags"
                copyText={result.hashtags.join(' ')}
                copied={copied}
                onCopy={copy}
              >
                <div className="flex flex-wrap gap-2">
                  {result.hashtags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer transition-all duration-200"
                      style={{
                        background: 'rgba(168,85,247,0.1)',
                        border: '1px solid rgba(168,85,247,0.25)',
                        color: '#a855f7',
                      }}
                      onClick={() => copy(tag, `tag-${i}`)}
                      title="Click to copy this tag"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs mt-3" style={{ color: '#3f3f46' }}>
                  Click any tag to copy individually
                </p>
              </ResultCard>

              {/* Video Script */}
              <ResultCard
                icon={Video}
                label="45-Sec Video Script"
                color="#22c55e"
                copyId="script"
                copyText={result.videoScript}
                copied={copied}
                onCopy={copy}
              >
                <pre
                  className="text-xs leading-relaxed whitespace-pre-wrap font-mono overflow-auto"
                  style={{ color: '#a1a1aa', maxHeight: '280px' }}
                >
                  {result.videoScript}
                </pre>
              </ResultCard>
            </div>

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
                  Want this agent running <span className="gradient-text">24/7 for your brand?</span>
                </p>
                <p className="text-sm" style={{ color: '#71717a' }}>
                  Get the Content Creator Agent deployed for your business — posts, captions &
                  scripts on autopilot.
                </p>
              </div>
              <a
                href="/request?agent=content-creator-agent"
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

      {/* Bounce keyframes for loading dots */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </section>
  );
}
