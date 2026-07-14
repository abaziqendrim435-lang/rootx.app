'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Store, Plug, Loader2, CheckCircle2, AlertTriangle, Eye, EyeOff,
  ShoppingCart, Sparkles, ArrowRight, RefreshCw, Search, X,
  Package, Tag, FileText, Copy, Check, Edit3, ExternalLink,
  ImageIcon, Unplug, Zap, Key, Shield, DollarSign, Palette,
  TrendingUp, Layers, BarChart3, Info,
} from 'lucide-react';
import { saveGeneration } from '@/lib/dashboard-storage';
import type {
  ShopifyProduct, ShopifyCredentials, AIProductGeneration,
  UpdateResponse, VerificationResult,
} from '@/lib/shopify-types';

import { supabaseClient } from '@/lib/supabase-auth';

// ════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'rootx_shopify_creds_demo';

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

function getStored(): ShopifyCredentials | null { return null; }
function setStored(c: ShopifyCredentials) {}
function clearStored() {}

function useCopy() {
  const [id, setId] = useState<string | null>(null);
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setId(key);
      setTimeout(() => setId(null), 2000);
    });
  };
  return { copiedId: id, copy };
}

// ════════════════════════════════════════════════════════════════
// Micro-components
// ════════════════════════════════════════════════════════════════

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const labels = ['Connect Store', 'Browse Products', 'Generate & Push'];
  return (
    <div className="flex items-center gap-2 mb-8">
      {labels.map((label, i) => {
        const num = (i + 1) as 1 | 2 | 3;
        const active = num === step;
        const done = num < step;
        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && (
              <div className="w-8 h-px" style={{ background: done ? '#22c55e' : 'var(--color-border)' }} />
            )}
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: done ? 'rgba(34,197,94,0.15)' : active ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${done ? 'rgba(34,197,94,0.3)' : active ? 'rgba(220,38,38,0.3)' : 'var(--color-border)'}`,
                  color: done ? '#22c55e' : active ? '#ef4444' : '#52525b',
                }}>
                {done ? <Check size={14} /> : num}
              </div>
              <span
                className="text-xs font-semibold tracking-wide uppercase hidden sm:inline"
                style={{ color: active ? '#f8f8f8' : done ? '#22c55e' : '#52525b' }}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusChip({ status }: { status: ShopifyProduct['status'] }) {
  const map = {
    active:   { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.25)',  color: '#22c55e', label: 'Active' },
    draft:    { bg: 'rgba(234,179,8,0.1)',   border: 'rgba(234,179,8,0.25)',  color: '#eab308', label: 'Draft' },
    archived: { bg: 'rgba(113,113,122,0.1)', border: 'rgba(113,113,122,0.25)', color: '#71717a', label: 'Archived' },
  };
  const c = map[status] || map.draft;
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
      {c.label}
    </span>
  );
}

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

// ════════════════════════════════════════════════════════════════
// ConnectStep (KEPT EXACTLY AS-IS)
// ════════════════════════════════════════════════════════════════

function ConnectStep({ onConnected, oauthError }: {
  onConnected: (c: ShopifyCredentials) => void;
  oauthError?: string;
}) {
  const [domain, setDomain] = useState('');
  const [oauthStatus, setOauthStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [oauthErr, setOauthErr] = useState(oauthError || '');

  async function handleOAuth(e: React.FormEvent) {
    e.preventDefault();
    setOauthStatus('loading');
    setOauthErr('');
    let d = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
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
        body: JSON.stringify({ storeDomain: d, redirectPath: '/agents/shopify-ai-agent' }),
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.15)' }}>
          <Store size={28} style={{ color: '#ef4444' }} />
        </div>
        <h2 className="text-xl font-bold mb-2">Connect Your Shopify Store</h2>
        <p style={{ color: '#71717a', maxWidth: '440px', margin: '0 auto' }}>
          Connect your Shopify store in one click to manage products and themes.
        </p>
      </div>

      <form onSubmit={handleOAuth}>
        <div className="rounded-2xl p-6"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 24px 48px rgba(0,0,0,0.3)' }}>
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="oauth-domain" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
                Store URL <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input id="oauth-domain" type="text" placeholder="your-store.myshopify.com"
                value={domain} onChange={(e) => setDomain(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm bg-transparent outline-none"
                style={{ border: '1px solid var(--color-border)' }} />
              <p className="text-xs mt-1.5" style={{ color: '#3f3f46' }}>
                e.g. my-brand.myshopify.com or just your-store
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-lg"
            style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.12)' }}>
            <Shield size={16} style={{ color: '#60a5fa', flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs leading-relaxed" style={{ color: '#93c5fd' }}>
              We use official Shopify OAuth. Your credentials are encrypted and stored securely server-side.
            </p>
          </div>

          {oauthErr && (
            <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-lg"
              style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.12)' }}>
              <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
              <p className="text-sm" style={{ color: '#fca5a5' }}>{oauthErr}</p>
            </div>
          )}

          <button type="submit" disabled={oauthStatus === 'loading'}
            className="w-full mt-5 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
            style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)', color: '#ef4444' }}>
            {oauthStatus === 'loading' ? <><Loader2 size={16} className="animate-spin" /> Connecting…</> :
              <><Plug size={16} /> Connect Shopify Store</>}
          </button>
        </div>
      </form>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ProductGrid (KEPT EXACTLY AS-IS)
// ════════════════════════════════════════════════════════════════

function ProductGrid({ products, loading, error, onSelect, onRefresh }: {
  products: ShopifyProduct[];
  loading: boolean;
  error: string;
  onSelect: (p: ShopifyProduct) => void;
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');

  const filtered = products.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 size={28} className="animate-spin" style={{ color: '#ef4444' }} />
        <p className="text-sm font-semibold" style={{ color: '#71717a' }}>Loading products…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl px-6"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-start gap-3 max-w-md">
          <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="font-semibold mb-1" style={{ color: '#ef4444' }}>Failed to load products</p>
            <p className="text-sm mb-3" style={{ color: '#a1a1aa' }}>{error}</p>
            <button onClick={onRefresh}
              className="text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#ef4444' }}>
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#52525b' }} />
          <input type="text" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-transparent outline-none"
            style={{ border: '1px solid var(--color-border)' }} />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'active', 'draft', 'archived'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="text-xs font-bold px-3 py-2 rounded-lg capitalize transition-all"
              style={{
                background: filter === f ? 'rgba(220,38,38,0.08)' : 'rgba(255,255,255,0.02)',
                border: filter === f ? '1px solid rgba(220,38,38,0.3)' : '1px solid var(--color-border)',
                color: filter === f ? '#ef4444' : '#71717a',
              }}>{f}</button>
          ))}
        </div>
        <button onClick={onRefresh}
          className="text-xs font-bold flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: '#71717a' }}
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(p => {
            const img = p.images?.[0]?.src;
            const price = p.variants?.[0]?.price ? `$${p.variants[0].price}` : '';
            const inv = p.variants?.reduce((s, v) => s + (v.inventory_quantity ?? 0), 0) ?? 0;
            return (
              <button key={p.id} onClick={() => onSelect(p)}
                className="text-left rounded-xl p-3 transition-all group"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(220,38,38,0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}>
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {img ? (
                      <img src={img} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={28} style={{ color: '#27272a' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold truncate">{p.title}</h3>
                      <StatusChip status={p.status} />
                    </div>
                    {p.product_type && <p className="text-xs" style={{ color: '#52525b' }}>{p.product_type}</p>}
                    <div className="flex items-center gap-3 mt-1.5">
                      {price && <span className="text-sm font-bold" style={{ color: '#22c55e' }}>{price}</span>}
                      <span className="text-xs" style={{ color: inv <= 5 ? '#ef4444' : '#52525b' }}>{inv} in stock</span>
                    </div>
                    {p.tags && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.tags.split(',').slice(0, 3).map(t => (
                          <span key={t.trim()} className="px-1.5 py-0.5 rounded-md text-xs"
                            style={{ background: 'rgba(220,38,38,0.06)', color: '#71717a', fontSize: '0.65rem' }}>
                            {t.trim()}
                          </span>
                        ))}
                        {p.tags.split(',').length > 3 && (
                          <span className="text-xs" style={{ color: '#3f3f46' }}>+{p.tags.split(',').length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : search || filter !== 'all' ? (
        <div className="text-center py-12" style={{ color: '#52525b' }}>
          <Search size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">No products match your filters</p>
        </div>
      ) : (
        <div className="text-center py-12" style={{ color: '#52525b' }}>
          <Package size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">No products found in this store</p>
        </div>
      )}
    </div>
  );
}

interface ComparisonFieldProps {
  label: string;
  icon: React.ReactNode;
  color: string;
  before: string;
  after: string;
  fieldId: string;
  editValue?: string;
  onEditChange?: (v: string) => void;
  multiline?: boolean;
  editMode: boolean;
  copiedId: string | null;
  copy: (t: string, k: string) => void;
}

function ComparisonField({
  label, icon, color, before, after, fieldId, editValue, onEditChange, multiline,
  editMode, copiedId, copy
}: ComparisonFieldProps) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
      <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest"
        style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ color }}>{label}</span>
        <CopyBtn text={after} id={fieldId} copiedId={copiedId} onCopy={copy} size="xs" />
      </div>
      <div className="grid grid-cols-2">
        <div className="px-4 py-3" style={{ background: 'rgba(255,255,255,0.01)', borderRight: '1px solid var(--color-border)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#3f3f46' }}>Before</p>
          <p className="text-sm leading-relaxed" style={{ color: '#71717a' }}>
            {before || <span style={{ color: '#27272a', fontStyle: 'italic' }}>Empty</span>}
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#22c55e' }}>After (AI)</p>
          {editMode && onEditChange ? (
            multiline ? (
              <textarea value={editValue ?? after} onChange={(e) => onEditChange(e.target.value)}
                className="w-full text-sm bg-transparent outline-none resize-none leading-relaxed"
                style={{ border: '1px solid rgba(220,38,38,0.2)', borderRadius: '0.5rem', padding: '0.5rem', minHeight: '80px' }}
                rows={4} />
            ) : (
              <input type="text" value={editValue ?? after} onChange={(e) => onEditChange(e.target.value)}
                className="w-full text-sm bg-transparent outline-none leading-relaxed"
                style={{ border: '1px solid rgba(220,38,38,0.2)', borderRadius: '0.5rem', padding: '0.5rem' }} />
            )
          ) : (
            <p className="text-sm leading-relaxed">{after}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// GenerationModal (UPDATED with AI agent features)
// ════════════════════════════════════════════════════════════════

function GenerationModal({ product, credentials, onClose, onPushed }: {
  product: ShopifyProduct;
  credentials: ShopifyCredentials;
  onClose: () => void;
  onPushed: () => void;
}) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<AIProductGeneration | null>(null);
  const [pushStatus, setPushStatus] = useState<'idle' | 'pushing' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [editedTags, setEditedTags] = useState('');
  const [verifiedProduct, setVerifiedProduct] = useState<ShopifyProduct | null>(null);
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const { copiedId, copy } = useCopy();
  const scrollRef = useRef<HTMLDivElement>(null);

  async function handleGenerate() {
    setStatus('generating');
    setError('');
    setResult(null);
    setPushStatus('idle');
    setVerifiedProduct(null);
    setVerificationResults([]);
    setEditMode(false);
    try {
      const res = await authenticatedFetch('/api/shopify/generate', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          title: product.title,
          bodyHtml: product.body_html || '',
          productType: product.product_type,
          tags: product.tags,
          vendor: product.vendor,
          imageUrl: product.images?.[0]?.src || '',
          currentPrice: product.variants?.[0]?.price || '',
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Generation failed (${res.status})`);
      }

      const data: AIProductGeneration = await res.json();
      setResult(data);
      setEditedTitle(data.title);
      setEditedBody(data.bodyHtml);
      setEditedTags(data.tags.join(', '));
      setStatus('done');

      await saveGeneration({
        agentType: 'shopify',
        agentName: 'Shopify AI Agent',
        agentIcon: '🛒',
        inputs: {
          productTitle: product.title,
          productType: product.product_type,
          storeDomain: credentials.storeDomain,
        },
        outputs: {
          generatedTitle: data.title,
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          tags: data.tags.join(', '),
        },
        isSaved: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setStatus('error');
    }
  }

  async function handlePush() {
    if (!result) return;
    setPushStatus('pushing');
    setError('');
    try {
      const res = await authenticatedFetch('/api/shopify/update', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          title: editMode ? editedTitle : result?.title,
          body_html: editMode ? editedBody : result?.bodyHtml,
          tags: editMode ? editedTags : result?.tags.join(', '),
          product_type: result?.categorySuggestion?.primary || '',
          storeDomain: credentials.storeDomain,
          accessToken: 'oauth',
        }),
      });
      const data: UpdateResponse = await res.json().catch(() => ({ success: false, error: 'Invalid response' }));
      if (!res.ok || !data.success) throw new Error(data.error || `Push failed`);
      if (data.product) setVerifiedProduct(data.product);
      if (data.verification) setVerificationResults(data.verification);
      setPushStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Push failed');
      setPushStatus('error');
    }
  }

  const img = product.images?.[0]?.src;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="w-full max-w-5xl my-8 mx-4 rounded-2xl overflow-hidden animate-fade-up"
        style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}>

        {/* ── Header ──────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'rgba(255,255,255,0.03)' }}>
              {img ? <img src={img} alt="" className="w-full h-full object-cover" /> :
                <div className="w-full h-full flex items-center justify-center"><ImageIcon size={18} style={{ color: '#27272a' }} /></div>}
            </div>
            <div>
              <h3 className="text-sm font-bold truncate max-w-xs">{product.title}</h3>
              <p className="text-xs" style={{ color: '#52525b' }}>
                ID: {product.id} • {product.product_type || 'No type'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)' }}>
            <X size={16} style={{ color: '#71717a' }} />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────── */}
        <div className="p-6 max-h-[75vh] overflow-y-auto" ref={scrollRef}>
          {/* Ready to generate */}
          {status === 'idle' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.15)' }}>
                <Sparkles size={28} style={{ color: '#ef4444' }} />
              </div>
              <h3 className="text-lg font-bold mb-2">Ready to Generate</h3>
              <p className="text-sm mb-6" style={{ color: '#71717a', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                AI will analyze the product image, generate optimized copy, suggest pricing, recommend categories, and find upsell opportunities.
              </p>
              <button onClick={handleGenerate}
                className="px-8 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2 mx-auto transition-all"
                style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)', color: '#ef4444' }}>
                <Sparkles size={16} /> Generate AI Content
              </button>
            </div>
          )}

          {/* Generating */}
          {status === 'generating' && (
            <div className="text-center py-16">
              <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: '#ef4444' }} />
              <p className="font-semibold mb-1">Generating AI content…</p>
              <p className="text-sm" style={{ color: '#52525b' }}>Analyzing product image, generating copy, calculating price, finding upsells…</p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="text-center py-12">
              <AlertTriangle size={32} className="mx-auto mb-4" style={{ color: '#ef4444' }} />
              <p className="font-semibold mb-1" style={{ color: '#ef4444' }}>Generation Failed</p>
              <p className="text-sm mb-4" style={{ color: '#71717a' }}>{error}</p>
              <button onClick={handleGenerate}
                className="px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 mx-auto transition-all"
                style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)', color: '#ef4444' }}>
                <RefreshCw size={14} /> Try Again
              </button>
            </div>
          )}

          {/* Results */}
          {status === 'done' && result && pushStatus !== 'done' && (
            <div className="flex flex-col gap-4">
              {/* ── Edit toggle ───────────────────────── */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#52525b' }}>
                  AI Generation Results
                </p>
                <button onClick={() => setEditMode(!editMode)}
                  className="text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    background: editMode ? 'rgba(220,38,38,0.08)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${editMode ? 'rgba(220,38,38,0.25)' : 'var(--color-border)'}`,
                    color: editMode ? '#ef4444' : '#71717a',
                  }}>
                  <Edit3 size={12} /> {editMode ? 'Editing' : 'Edit'}
                </button>
                <button onClick={() => { setStatus('idle'); setResult(null); }}
                  className="text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: '#71717a' }}>
                  <RefreshCw size={12} /> Regenerate
                </button>
              </div>

              {/* ── Title comparison ──────────────────── */}
              <ComparisonField
                label="TITLE" icon={<FileText size={14} />} color="#ef4444"
                before={product.title} after={result.title}
                fieldId="gen-title" editValue={editedTitle} onEditChange={setEditedTitle}
                editMode={editMode} copiedId={copiedId} copy={copy}
              />

              {/* ── Description comparison ───────────── */}
              <ComparisonField
                label="DESCRIPTION" icon={<FileText size={14} />} color="#60a5fa"
                before={product.body_html || ''} after={result.bodyHtml}
                fieldId="gen-body" editValue={editedBody} onEditChange={setEditedBody} multiline
                editMode={editMode} copiedId={copiedId} copy={copy}
              />

              {/* ── Tags ──────────────────────────────── */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest"
                  style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                  <Tag size={14} style={{ color: '#a855f7' }} />
                  <span style={{ color: '#a855f7' }}>TAGS</span>
                </div>
                <div className="px-4 py-3">
                  {editMode ? (
                    <input type="text" value={editedTags} onChange={(e) => setEditedTags(e.target.value)}
                      className="w-full text-sm bg-transparent outline-none"
                      style={{ border: '1px solid rgba(220,38,38,0.2)', borderRadius: '0.5rem', padding: '0.5rem' }} />
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {result.tags.map((t, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-md font-semibold"
                          style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', color: '#a855f7' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── SEO ──────────────────────────────── */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest"
                  style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                  <Search size={14} style={{ color: '#22c55e' }} />
                  <span style={{ color: '#22c55e' }}>SEO METADATA</span>
                </div>
                <div className="grid grid-cols-2 gap-px" style={{ background: 'var(--color-border)' }}>
                  <div className="px-4 py-3" style={{ background: 'var(--color-bg)', borderRight: '1px solid var(--color-border)' }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#3f3f46' }}>Meta Title</p>
                    <p className="text-sm" style={{ color: '#a1a1aa' }}>{result.seoTitle}</p>
                  </div>
                  <div className="px-4 py-3" style={{ background: 'var(--color-bg)' }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#3f3f46' }}>Meta Description</p>
                    <p className="text-sm" style={{ color: '#a1a1aa' }}>{result.seoDescription}</p>
                  </div>
                </div>
              </div>

              {/* ── Image Analysis Card ──────────────── */}
              {result.imageAnalysis && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest"
                    style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ color: '#f97316' }}>🖼️</span>
                    <span style={{ color: '#f97316' }}>IMAGE ANALYSIS</span>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    {/* Description */}
                    <p className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>
                      {result.imageAnalysis.description}
                    </p>

                    {/* Color palette + Style + Quality row */}
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Color swatches */}
                      {result.imageAnalysis.dominantColors && result.imageAnalysis.dominantColors.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#3f3f46' }}>Colors</span>
                          <div className="flex gap-1.5">
                            {result.imageAnalysis.dominantColors.map((c, i) => (
                              <div key={i} className="w-6 h-6 rounded-full" title={c}
                                style={{
                                  background: c,
                                  border: '2px solid var(--color-border)',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                }} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Style badge */}
                      {result.imageAnalysis.style && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md"
                          style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', color: '#f97316' }}>
                          {result.imageAnalysis.style}
                        </span>
                      )}

                      {/* Quality meter */}
                      {result.imageAnalysis.quality && (() => {
                        const q = result.imageAnalysis!.quality.toLowerCase();
                        const qColor = q === 'high' ? '#22c55e' : q === 'medium' ? '#eab308' : '#ef4444';
                        const qBg = q === 'high' ? 'rgba(34,197,94,0.08)' : q === 'medium' ? 'rgba(234,179,8,0.08)' : 'rgba(239,68,68,0.08)';
                        const qBorder = q === 'high' ? 'rgba(34,197,94,0.2)' : q === 'medium' ? 'rgba(234,179,8,0.2)' : 'rgba(239,68,68,0.2)';
                        const qWidth = q === 'high' ? '100%' : q === 'medium' ? '60%' : '30%';
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#3f3f46' }}>Quality</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                <div className="h-full rounded-full transition-all" style={{ width: qWidth, background: qColor }} />
                              </div>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-md capitalize"
                                style={{ background: qBg, border: `1px solid ${qBorder}`, color: qColor }}>
                                {result.imageAnalysis!.quality}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Suggestions */}
                    {result.imageAnalysis.suggestions && result.imageAnalysis.suggestions.length > 0 && (
                      <div className="mt-1">
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#3f3f46' }}>Improvement Tips</p>
                        <ul className="flex flex-col gap-1.5">
                          {result.imageAnalysis.suggestions.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: '#71717a' }}>
                              <span style={{ color: '#f97316', flexShrink: 0, marginTop: 1 }}>•</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Price Analysis Card ──────────────── */}
              {result.priceAnalysis && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest"
                    style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ color: '#22c55e' }}>💰</span>
                    <span style={{ color: '#22c55e' }}>PRICE ANALYSIS</span>
                  </div>
                  <div className="p-4 flex flex-col gap-4">
                    {/* Current → Suggested */}
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#3f3f46' }}>Current</p>
                        <p className="text-2xl font-bold" style={{ color: '#71717a' }}>
                          ${result.priceAnalysis.currentPrice}
                        </p>
                      </div>
                      <ArrowRight size={20} style={{ color: '#22c55e' }} />
                      <div className="text-center">
                        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#22c55e' }}>Suggested</p>
                        <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>
                          ${result.priceAnalysis.suggestedPrice}
                        </p>
                      </div>
                    </div>

                    {/* Price range bar */}
                    {result.priceAnalysis.priceRange && (() => {
                      const { min, max } = result.priceAnalysis!.priceRange;
                      const suggested = Number(result.priceAnalysis!.suggestedPrice) || 0;
                      const range = (Number(max) || 1) - (Number(min) || 0);
                      const pct = range > 0 ? Math.min(100, Math.max(0, ((suggested - (Number(min) || 0)) / range) * 100)) : 50;
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold" style={{ color: '#52525b' }}>${min}</span>
                            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#3f3f46' }}>Price Range</span>
                            <span className="text-xs font-semibold" style={{ color: '#52525b' }}>${max}</span>
                          </div>
                          <div className="relative w-full h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="absolute h-full rounded-full"
                              style={{ left: 0, width: `${pct}%`, background: 'linear-gradient(90deg, rgba(34,197,94,0.3), rgba(34,197,94,0.6))' }} />
                            <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                              style={{
                                left: `${pct}%`, transform: `translate(-50%, -50%)`,
                                background: '#22c55e', border: '2px solid var(--color-bg)',
                                boxShadow: '0 0 8px rgba(34,197,94,0.4)',
                              }} />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Competitive position */}
                    {result.priceAnalysis.competitivePosition && (() => {
                      const pos = result.priceAnalysis!.competitivePosition.toLowerCase();
                      const posColor = pos.includes('premium') ? '#22c55e' : pos.includes('mid') ? '#60a5fa' : '#eab308';
                      const posBg = pos.includes('premium') ? 'rgba(34,197,94,0.08)' : pos.includes('mid') ? 'rgba(96,165,250,0.08)' : 'rgba(234,179,8,0.08)';
                      const posBorder = pos.includes('premium') ? 'rgba(34,197,94,0.2)' : pos.includes('mid') ? 'rgba(96,165,250,0.2)' : 'rgba(234,179,8,0.2)';
                      return (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#3f3f46' }}>Position</span>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-md"
                            style={{ background: posBg, border: `1px solid ${posBorder}`, color: posColor }}>
                            {result.priceAnalysis!.competitivePosition}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Reasoning */}
                    {result.priceAnalysis.reasoning && (
                      <p className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>
                        {result.priceAnalysis.reasoning}
                      </p>
                    )}

                    {/* Disclaimer */}
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg"
                      style={{ background: 'rgba(234,179,8,0.04)', border: '1px solid rgba(234,179,8,0.1)' }}>
                      <Info size={14} style={{ color: '#eab308', flexShrink: 0, marginTop: 1 }} />
                      <p className="text-xs leading-relaxed" style={{ color: '#eab308' }}>
                        AI estimate — not based on live market data
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Category Suggestion Card ─────────── */}
              {result.categorySuggestion && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest"
                    style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ color: '#60a5fa' }}>📂</span>
                    <span style={{ color: '#60a5fa' }}>CATEGORY SUGGESTION</span>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    {/* Primary category */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#3f3f46' }}>Primary</span>
                      <span className="text-sm font-bold px-3 py-1.5 rounded-lg"
                        style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa' }}>
                        {result.categorySuggestion.primary}
                      </span>
                    </div>

                    {/* Alternatives */}
                    {result.categorySuggestion.alternatives && result.categorySuggestion.alternatives.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#3f3f46' }}>Alternatives</p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.categorySuggestion.alternatives.map((alt, i) => (
                            <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-md cursor-default"
                              style={{ background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.15)', color: '#93c5fd' }}>
                              {alt}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reasoning */}
                    {result.categorySuggestion.reasoning && (
                      <p className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>
                        {result.categorySuggestion.reasoning}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ── Upsell & Cross-sell Card ─────────── */}
              {result.upsellCrossSell && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest"
                    style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ color: '#a855f7' }}>📦</span>
                    <span style={{ color: '#a855f7' }}>UPSELL & CROSS-SELL</span>
                  </div>
                  <div className="p-4 flex flex-col gap-4">
                    {/* Upsell Opportunities */}
                    {result.upsellCrossSell.upsell && result.upsellCrossSell.upsell.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: '#a855f7' }}>
                          <TrendingUp size={12} /> Upsell Opportunities
                        </p>
                        <div className="flex flex-col gap-2">
                          {result.upsellCrossSell.upsell.map((item, i) => (
                            <div key={i} className="rounded-lg px-3 py-2.5 flex items-start justify-between gap-3"
                              style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.1)' }}>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold mb-0.5">{item.title}</p>
                                <p className="text-xs leading-relaxed" style={{ color: '#71717a' }}>{item.reason}</p>
                              </div>
                              {item.pricePoint && (
                                <span className="text-xs font-bold px-2 py-1 rounded-md flex-shrink-0"
                                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
                                  {item.pricePoint}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cross-sell Recommendations */}
                    {result.upsellCrossSell.crossSell && result.upsellCrossSell.crossSell.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: '#a855f7' }}>
                          <Layers size={12} /> Cross-sell Recommendations
                        </p>
                        <div className="flex flex-col gap-2">
                          {result.upsellCrossSell.crossSell.map((item, i) => (
                            <div key={i} className="rounded-lg px-3 py-2.5 flex items-start justify-between gap-3"
                              style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.1)' }}>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold mb-0.5">{item.title}</p>
                                <p className="text-xs leading-relaxed" style={{ color: '#71717a' }}>{item.reason}</p>
                              </div>
                              {item.pricePoint && (
                                <span className="text-xs font-bold px-2 py-1 rounded-md flex-shrink-0"
                                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
                                  {item.pricePoint}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bundle idea */}
                    {result.upsellCrossSell.bundleIdea && (
                      <div className="rounded-lg px-4 py-3"
                        style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(96,165,250,0.06) 100%)', border: '1px solid rgba(168,85,247,0.2)' }}>
                        <p className="text-xs font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: '#c084fc' }}>
                          <Sparkles size={12} /> Bundle Idea
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: '#d8b4fe' }}>
                          {result.upsellCrossSell.bundleIdea}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Push to Shopify ───────────────────── */}
              <div className="flex items-center gap-3 mt-2">
                {pushStatus === 'error' && (
                  <div className="flex items-center gap-2 flex-1">
                    <AlertTriangle size={14} style={{ color: '#ef4444' }} />
                    <p className="text-xs" style={{ color: '#fca5a5' }}>{error}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  {pushStatus === 'error' && (
                    <button onClick={handlePush}
                      className="text-xs font-bold flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all"
                      style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#ef4444' }}>
                      <ArrowRight size={14} style={{ color: '#ef4444' }} /> Push to Shopify
                    </button>
                  )}
                  {pushStatus === 'pushing' && (
                    <button disabled
                      className="text-xs font-bold flex items-center gap-1.5 px-4 py-2 rounded-lg"
                      style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#ef4444', opacity: 0.6 }}>
                      <Loader2 size={14} className="animate-spin" /> Pushing…
                    </button>
                  )}
                  {pushStatus === 'idle' && (
                    <button onClick={handlePush}
                      className="text-sm font-bold flex items-center gap-2 px-6 py-3 rounded-xl transition-all"
                      style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)', color: '#ef4444' }}>
                      <ArrowRight size={16} /> Push to Shopify
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Push Success with Verification ──────── */}
          {status === 'done' && pushStatus === 'done' && (
            <div className="flex flex-col gap-4">
              {/* Verification Results Table */}
              {verificationResults.length > 0 && (() => {
                const matchCount = verificationResults.filter(v => v.match).length;
                const totalCount = verificationResults.length;
                const allMatch = matchCount === totalCount;
                return (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                    <div className="flex items-center justify-between px-4 py-3"
                      style={{ background: allMatch ? 'rgba(34,197,94,0.06)' : 'rgba(234,179,8,0.06)', borderBottom: '1px solid var(--color-border)' }}>
                      <div className="flex items-center gap-2">
                        {allMatch ? (
                          <CheckCircle2 size={18} style={{ color: '#22c55e' }} />
                        ) : (
                          <AlertTriangle size={18} style={{ color: '#eab308' }} />
                        )}
                        <span className="text-sm font-bold" style={{ color: allMatch ? '#22c55e' : '#eab308' }}>
                          {allMatch
                            ? `All ${totalCount} fields verified ✓`
                            : `${matchCount}/${totalCount} fields verified, ${totalCount - matchCount} mismatch${totalCount - matchCount > 1 ? 'es' : ''}`
                          }
                        </span>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#3f3f46' }}>
                        Post-Push Verification
                      </span>
                    </div>
                    <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                      {/* Table header */}
                      <div className="grid grid-cols-[120px_28px_1fr_1fr] gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest"
                        style={{ background: 'var(--color-surface)', color: '#3f3f46' }}>
                        <span>Field</span>
                        <span></span>
                        <span>Expected</span>
                        <span>Actual</span>
                      </div>
                      {/* Table rows */}
                      {verificationResults.map((v, i) => (
                        <div key={i} className="grid grid-cols-[120px_28px_1fr_1fr] gap-2 px-4 py-2.5 items-start"
                          style={{ borderTop: '1px solid var(--color-border)' }}>
                          <span className="text-xs font-bold capitalize" style={{ color: '#a1a1aa' }}>
                            {v.field}
                          </span>
                          <span>
                            {v.match ? (
                              <CheckCircle2 size={16} style={{ color: '#22c55e' }} />
                            ) : (
                              <AlertTriangle size={16} style={{ color: '#eab308' }} />
                            )}
                          </span>
                          <p className="text-xs leading-relaxed truncate" style={{ color: '#71717a' }} title={v.expected}>
                            {v.expected || <span style={{ fontStyle: 'italic', color: '#27272a' }}>Empty</span>}
                          </p>
                          <p className="text-xs leading-relaxed truncate" style={{ color: v.match ? '#a1a1aa' : '#eab308' }} title={v.actual}>
                            {v.actual || <span style={{ fontStyle: 'italic', color: '#27272a' }}>Empty</span>}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Verified product details */}
              {verifiedProduct && (
                <div className="rounded-xl p-4" style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={18} style={{ color: '#22c55e' }} />
                    <p className="text-sm font-bold" style={{ color: '#22c55e' }}>Successfully pushed to Shopify</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg px-3 py-2" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                      <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#3f3f46' }}>Title</p>
                      <p className="text-sm truncate" style={{ color: '#a1a1aa' }}>{verifiedProduct.title}</p>
                    </div>
                    <div className="rounded-lg px-3 py-2" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                      <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#3f3f46' }}>Type</p>
                      <p className="text-sm truncate" style={{ color: '#a1a1aa' }}>{verifiedProduct.product_type || '—'}</p>
                    </div>
                    <div className="rounded-lg px-3 py-2" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                      <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#3f3f46' }}>Status</p>
                      <StatusChip status={verifiedProduct.status} />
                    </div>
                  </div>
                </div>
              )}

              {/* If no verification results, show simple success */}
              {verificationResults.length === 0 && !verifiedProduct && (
                <div className="text-center py-8">
                  <CheckCircle2 size={40} className="mx-auto mb-3" style={{ color: '#22c55e' }} />
                  <p className="text-lg font-bold mb-1" style={{ color: '#22c55e' }}>Pushed Successfully</p>
                  <p className="text-sm" style={{ color: '#71717a' }}>Your product has been updated on Shopify.</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2"
                style={{ background: 'var(--color-surface)', borderTop: '1px solid rgba(34,197,94,0.15)', borderRadius: '0 0 1rem 1rem', margin: '0 -1.5rem -1.5rem', padding: '1rem 1.5rem' }}>
                <a href={`https://${credentials.storeDomain}/admin/products/${product.id}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs font-bold flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all"
                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
                  <ExternalLink size={14} /> Open Shopify product
                </a>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setStatus('idle'); setResult(null); setPushStatus('idle'); setVerifiedProduct(null); setVerificationResults([]); }}
                    className="text-xs font-bold flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: '#71717a' }}>
                    <RefreshCw size={12} /> Generate Again
                  </button>
                  <button onClick={onPushed}
                    className="text-xs font-bold flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all"
                    style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}>
                    <Check size={14} /> Done
                  </button>
                </div>
              </div>
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

export default function ShopifyAgentDemo() {
  const [credentials, setCredentials] = useState<ShopifyCredentials | null>(() => getStored());
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);
  const [oauthError, setOauthError] = useState('');
  const [isServerConnected, setIsServerConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);

  const step: 1 | 2 | 3 = !credentials ? 1 : selectedProduct ? 3 : 2;

  const fetchProducts = useCallback(async () => {
    if (!credentials) return;
    setLoadingProducts(true);
    setProductsError('');
    try {
      const res = await authenticatedFetch('/api/shopify/products');
      const data = await res.json().catch(() => ({ success: false, error: 'Invalid response' }));
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load products');
      setProducts(data.products || []);
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  }, [credentials]);

  const checkConnection = useCallback(async () => {
    try {
      const res = await authenticatedFetch('/api/shopify/connect');
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.connected) {
        setIsServerConnected(true);
        setCredentials({
          storeDomain: data.storeDomain,
          accessToken: 'oauth',
          shopName: data.shopName,
        });
      } else {
        setIsServerConnected(false);
        setCredentials(null);
      }
    } catch (err) {
      console.error('Failed to check connection:', err);
    } finally {
      setCheckingConnection(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    if (credentials) {
      const t = setTimeout(() => {
        fetchProducts();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [credentials, fetchProducts]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('shopify_error');
    const success = params.get('oauth_success');

    if (err) {
      setOauthError(err);
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (success) {
      checkConnection();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [checkConnection]);

  function handleConnected(creds: ShopifyCredentials) {
    setCredentials(creds);
    setProducts([]);
    setProductsError('');
    checkConnection();
  }

  async function handleDisconnect() {
    try {
      if (isServerConnected) {
        await authenticatedFetch('/api/shopify/connect', { method: 'DELETE' });
      }
    } catch (err) {
      console.error('Failed to disconnect store server-side:', err);
    }
    clearStored();
    setCredentials(null);
    setIsServerConnected(false);
    setProducts([]);
    setProductsError('');
    setSelectedProduct(null);
  }

  function handlePushed() {
    setSelectedProduct(null);
    fetchProducts();
  }

  return (
    <section className="py-16" style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#ef4444' }}>
            <Zap size={12} /> Live Demo
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Shopify AI Agent
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: '#71717a' }}>
            Connect your store, import your products, and let AI generate optimized titles, descriptions, SEO metadata, and tags — then push updates back with one click.
          </p>
        </div>

        <StepIndicator step={step} />

        {/* Connected banner */}
        {credentials && (
          <div className="rounded-xl p-4 mb-6 flex items-center justify-between"
            style={{ border: '1px solid rgba(34,197,94,0.25)', background: 'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, var(--color-surface) 60%)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: '#22c55e' }}>
                  Connected to {credentials.shopName || credentials.storeDomain}
                </p>
                <p className="text-xs" style={{ color: '#52525b' }}>
                  {credentials.storeDomain} • {products.length} products loaded
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href={`https://${credentials.storeDomain}/admin`} target="_blank" rel="noopener noreferrer"
                className="text-xs font-bold flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: '#71717a' }}>
                <ExternalLink size={12} /> Open Shopify Admin
              </a>
              <button onClick={handleDisconnect}
                className="text-xs font-bold flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: '#71717a' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}>
                <Unplug size={12} /> Disconnect
              </button>
            </div>
          </div>
        )}

        {/* Steps */}
        {!credentials && (
          <ConnectStep onConnected={handleConnected} oauthError={oauthError} />
        )}
        {credentials && !selectedProduct && (
          <ProductGrid
            products={products}
            loading={loadingProducts}
            error={productsError}
            onSelect={setSelectedProduct}
            onRefresh={fetchProducts}
          />
        )}
        {credentials && selectedProduct && (
          <GenerationModal
            product={selectedProduct}
            credentials={credentials}
            onClose={() => setSelectedProduct(null)}
            onPushed={handlePushed}
          />
        )}
      </div>
    </section>
  );
}
