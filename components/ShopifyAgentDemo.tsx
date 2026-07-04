'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Store, Plug, Loader2, CheckCircle2, AlertTriangle, Eye, EyeOff,
  ShoppingCart, Sparkles, ArrowRight, RefreshCw, Search, X,
  Package, Tag, FileText, Copy, Check, Edit3, ExternalLink,
  ChevronDown, ChevronUp, ImageIcon, Unplug, Zap, Key, Shield,
} from 'lucide-react';
import { saveGeneration } from '@/lib/dashboard-storage';
import type {
  ShopifyProduct, ShopifyCredentials, AIProductGeneration,
} from '@/lib/shopify-types';

// ════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'rootx_shopify_creds_demo';

function getStored(): ShopifyCredentials | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'); }
  catch { return null; }
}
function setStored(c: ShopifyCredentials) { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); }
function clearStored() { localStorage.removeItem(STORAGE_KEY); }

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
        const num = i + 1;
        const active = num === step;
        const done = num < step;
        return (
          <div key={num} className="flex items-center gap-2">
            {i > 0 && (
              <div className="w-8 h-px" style={{ background: done ? '#22c55e' : 'var(--color-border)' }} />
            )}
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all"
                style={{
                  background: done ? 'rgba(34,197,94,0.15)' : active ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${done ? 'rgba(34,197,94,0.3)' : active ? 'rgba(220,38,38,0.3)' : 'var(--color-border)'}`,
                  color: done ? '#22c55e' : active ? '#ef4444' : '#52525b',
                }}
              >
                {done ? <Check size={13} /> : num}
              </div>
              <span
                className="text-xs font-semibold hidden sm:inline"
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
  const c = {
    active:   { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.25)',  color: '#22c55e', label: 'Active' },
    draft:    { bg: 'rgba(234,179,8,0.1)',   border: 'rgba(234,179,8,0.25)',  color: '#eab308', label: 'Draft' },
    archived: { bg: 'rgba(113,113,122,0.1)', border: 'rgba(113,113,122,0.25)', color: '#71717a', label: 'Archived' },
  }[status];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
      {c.label}
    </span>
  );
}

function CopyBtn({ text, id, copiedId, onCopy, size = 'sm' }: {
  text: string; id: string; copiedId: string | null;
  onCopy: (t: string, id: string) => void; size?: 'sm' | 'xs';
}) {
  const is = copiedId === id;
  return (
    <button onClick={() => onCopy(text, id)}
      className="flex items-center gap-1 rounded-lg transition-all duration-200"
      style={{
        padding: size === 'xs' ? '0.2rem 0.5rem' : '0.3rem 0.6rem',
        fontSize: size === 'xs' ? '0.65rem' : '0.7rem',
        background: is ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${is ? 'rgba(34,197,94,0.3)' : 'var(--color-border)'}`,
        color: is ? '#22c55e' : '#52525b',
      }}>
      {is ? <Check size={10} /> : <Copy size={10} />}
      {is ? 'Copied' : 'Copy'}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════
// Step 1 — Connect Store (OAuth primary + Direct Token fallback)
// ════════════════════════════════════════════════════════════════

function ConnectStep({ onConnected, oauthError }: {
  onConnected: (c: ShopifyCredentials) => void;
  oauthError?: string;
}) {
  const [tab, setTab] = useState<'oauth' | 'token'>('oauth');

  // ── OAuth tab state ───────────────────────────────────────
  const [domain, setDomain] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [oauthStatus, setOauthStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [oauthErr, setOauthErr] = useState(oauthError || '');

  // ── Direct token tab state ────────────────────────────────
  const [tokenDomain, setTokenDomain] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [tokenErr, setTokenErr] = useState('');

  // ── OAuth submit ──────────────────────────────────────────
  async function handleOAuth(e: React.FormEvent) {
    e.preventDefault();
    const d = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const cid = clientId.trim();
    const cs = clientSecret.trim();
    if (!d || !cid || !cs) return;

    setOauthStatus('loading');
    setOauthErr('');

    try {
      const res = await fetch('/api/shopify/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeDomain: d, clientId: cid, clientSecret: cs }),
      });
      const data = await res.json();
      if (!res.ok || !data.authUrl) throw new Error(data.error || 'Failed to start OAuth flow');

      // Redirect to Shopify authorization page
      window.location.href = data.authUrl;
    } catch (err) {
      setOauthErr(err instanceof Error ? err.message : 'OAuth failed');
      setOauthStatus('error');
    }
  }

  // ── Direct token submit ───────────────────────────────────
  async function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    const d = tokenDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const t = token.trim();
    if (!d || !t) return;

    setTokenStatus('loading');
    setTokenErr('');

    try {
      const res = await fetch('/api/shopify/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeDomain: d, accessToken: t }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Connection failed');

      const creds: ShopifyCredentials = { storeDomain: d, accessToken: t, shopName: data.shopName };
      setStored(creds);
      onConnected(creds);
    } catch (err) {
      setTokenErr(err instanceof Error ? err.message : 'Connection failed');
      setTokenStatus('error');
    }
  }

  const isOAuthValid = domain.trim() && clientId.trim() && clientSecret.trim();
  const isTokenValid = tokenDomain.trim() && token.trim();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.2)' }}>
          <Store size={28} style={{ color: '#ef4444' }} />
        </div>
        <h3 className="text-2xl font-black mb-2">Connect Your Shopify Store</h3>
        <p style={{ color: '#71717a', maxWidth: '440px', margin: '0 auto' }}>
          Enter your app credentials and we&apos;ll automatically connect to your store — no need to manually copy access tokens.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <button onClick={() => setTab('oauth')}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all"
          style={{
            background: tab === 'oauth' ? 'rgba(220,38,38,0.12)' : 'transparent',
            color: tab === 'oauth' ? '#ef4444' : '#52525b',
            border: tab === 'oauth' ? '1px solid rgba(220,38,38,0.25)' : '1px solid transparent',
          }}>
          <Shield size={14} /> App Credentials
          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
            background: 'rgba(34,197,94,0.12)', color: '#22c55e', fontSize: '0.6rem', fontWeight: 800,
          }}>RECOMMENDED</span>
        </button>
        <button onClick={() => setTab('token')}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: tab === 'token' ? 'rgba(255,255,255,0.06)' : 'transparent',
            color: tab === 'token' ? '#a1a1aa' : '#3f3f46',
            border: tab === 'token' ? '1px solid var(--color-border)' : '1px solid transparent',
          }}>
          <Key size={14} /> Access Token
        </button>
      </div>

      {/* ── OAuth Tab ──────────────────────────────────────────── */}
      {tab === 'oauth' && (
        <div className="rounded-2xl p-6 md:p-8"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 24px 48px rgba(0,0,0,0.3)' }}>
          <form onSubmit={handleOAuth} className="flex flex-col gap-5">
            {/* Store Domain */}
            <div>
              <label htmlFor="oauth-domain" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
                Store URL <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input id="oauth-domain" type="text" required placeholder="my-store.myshopify.com"
                value={domain} onChange={(e) => setDomain(e.target.value)} disabled={oauthStatus === 'loading'}
                className="input-field" />
              <p className="text-xs mt-1.5" style={{ color: '#3f3f46' }}>
                Your Shopify store domain (e.g. your-store.myshopify.com)
              </p>
            </div>

            {/* Client ID + Secret */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="oauth-client-id" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
                  Client ID <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input id="oauth-client-id" type="text" required placeholder="App API key"
                  value={clientId} onChange={(e) => setClientId(e.target.value)} disabled={oauthStatus === 'loading'}
                  className="input-field" />
              </div>
              <div>
                <label htmlFor="oauth-client-secret" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
                  Client Secret <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="relative">
                  <input id="oauth-client-secret" type={showSecret ? 'text' : 'password'} required
                    placeholder="App API secret key"
                    value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} disabled={oauthStatus === 'loading'}
                    className="input-field" style={{ paddingRight: '2.75rem' }} />
                  <button type="button" onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#52525b' }} tabIndex={-1}>
                    {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl"
              style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)' }}>
              <Shield size={16} style={{ color: '#60a5fa', flexShrink: 0, marginTop: 1 }} />
              <p className="text-xs leading-relaxed" style={{ color: '#93c5fd' }}>
                RootX will redirect you to Shopify for authorization. Your Client Secret is encrypted and never stored — it&apos;s only used once to exchange for an access token.
              </p>
            </div>

            {/* Error */}
            {oauthStatus === 'error' && oauthErr && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl"
                style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)' }}>
                <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                <p className="text-sm" style={{ color: '#fca5a5' }}>{oauthErr}</p>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={oauthStatus === 'loading' || !isOAuthValid}
              className="btn-primary w-full justify-center"
              style={{ padding: '0.875rem', fontSize: '1rem', opacity: oauthStatus === 'loading' || !isOAuthValid ? 0.6 : 1 }}>
              {oauthStatus === 'loading' ? (
                <><Loader2 size={18} className="animate-spin" /> Redirecting to Shopify…</>
              ) : (
                <><Plug size={18} /> Connect via Shopify</>
              )}
            </button>
          </form>

          {/* How-to */}
          <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#3f3f46' }}>
              How to get your app credentials
            </p>
            <ol className="flex flex-col gap-2 text-xs leading-relaxed" style={{ color: '#71717a' }}>
              {[
                'Go to your Shopify Admin → Settings → Apps and sales channels → Develop apps',
                'Click "Create an app" → name it "RootX"',
                'Configure Admin API scopes → enable read_products and write_products',
                'Go to "API credentials" → copy the Client ID and Client Secret',
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-bold flex-shrink-0" style={{ color: '#ef4444' }}>{i + 1}.</span>
                  {text}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* ── Direct Token Tab ───────────────────────────────────── */}
      {tab === 'token' && (
        <div className="rounded-2xl p-6 md:p-8"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 24px 48px rgba(0,0,0,0.3)' }}>
          <form onSubmit={handleTokenSubmit} className="flex flex-col gap-5">
            {/* Domain */}
            <div>
              <label htmlFor="token-domain" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
                Store URL <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input id="token-domain" type="text" required placeholder="my-store.myshopify.com"
                value={tokenDomain} onChange={(e) => setTokenDomain(e.target.value)} disabled={tokenStatus === 'loading'}
                className="input-field" />
            </div>

            {/* Token */}
            <div>
              <label htmlFor="direct-token" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
                Admin API Access Token <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div className="relative">
                <input id="direct-token" type={showToken ? 'text' : 'password'} required
                  placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={token} onChange={(e) => setToken(e.target.value)} disabled={tokenStatus === 'loading'}
                  className="input-field" style={{ paddingRight: '2.75rem' }} />
                <button type="button" onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#52525b' }} tabIndex={-1}>
                  {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {tokenStatus === 'error' && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl"
                style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)' }}>
                <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                <p className="text-sm" style={{ color: '#fca5a5' }}>{tokenErr}</p>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={tokenStatus === 'loading' || !isTokenValid}
              className="btn-primary w-full justify-center"
              style={{ padding: '0.875rem', fontSize: '1rem', opacity: tokenStatus === 'loading' || !isTokenValid ? 0.6 : 1 }}>
              {tokenStatus === 'loading' ? (
                <><Loader2 size={18} className="animate-spin" /> Testing connection…</>
              ) : (
                <><Plug size={18} /> Test & Connect Store</>
              )}
            </button>
          </form>

          {/* How-to */}
          <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#3f3f46' }}>
              How to get your access token
            </p>
            <ol className="flex flex-col gap-2 text-xs leading-relaxed" style={{ color: '#71717a' }}>
              {[
                'Go to your Shopify Admin → Settings → Apps and sales channels → Develop apps',
                'Click "Create an app" → name it "RootX"',
                'Configure Admin API scopes → enable read_products and write_products',
                'Click "Install app" → copy the Admin API access token',
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-bold flex-shrink-0" style={{ color: '#ef4444' }}>{i + 1}.</span>
                  {text}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Step 2 — Product Grid
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

  const filtered = products.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.product_type?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filter === 'all' || p.status === filter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="shimmer" style={{ paddingTop: '70%' }} />
            <div className="p-4 flex flex-col gap-3">
              <div className="shimmer rounded-lg" style={{ height: '16px', width: '80%' }} />
              <div className="shimmer rounded-lg" style={{ height: '12px', width: '50%' }} />
              <div className="shimmer rounded-lg" style={{ height: '36px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl p-6 flex items-start gap-4"
        style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}>
        <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
        <div>
          <p className="font-semibold mb-1" style={{ color: '#ef4444' }}>Failed to load products</p>
          <p className="text-sm mb-3" style={{ color: '#a1a1aa' }}>{error}</p>
          <button onClick={onRefresh} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
            <RefreshCw size={13} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#52525b' }} />
          <input type="text" placeholder="Search products…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-full" style={{ paddingLeft: '2.25rem', height: '40px', fontSize: '0.875rem' }} />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'draft', 'archived'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-2 rounded-xl text-xs font-bold transition-all capitalize"
              style={{
                background: filter === f ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.04)',
                border: filter === f ? '1px solid rgba(220,38,38,0.3)' : '1px solid var(--color-border)',
                color: filter === f ? '#ef4444' : '#71717a',
              }}>
              {f}
            </button>
          ))}
          <button onClick={onRefresh} className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: '#71717a' }}
            title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const img = p.images?.[0];
            const v = p.variants?.[0];
            const price = v?.price ? `$${parseFloat(v.price).toFixed(2)}` : null;
            const inv = p.variants?.reduce((s, x) => s + (x.inventory_quantity ?? 0), 0) ?? 0;
            return (
              <div key={p.id} className="rounded-2xl overflow-hidden transition-all duration-300 group"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(220,38,38,0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}>
                {/* Image */}
                <div className="relative w-full" style={{ paddingTop: '70%', background: '#0a0a0c' }}>
                  {img ? (
                    <img src={img.src} alt={img.alt || p.title}
                      className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon size={28} style={{ color: '#27272a' }} />
                    </div>
                  )}
                  <div className="absolute top-2 left-2"><StatusChip status={p.status} /></div>
                </div>
                {/* Content */}
                <div className="p-4 flex flex-col gap-3">
                  <div>
                    <h4 className="font-bold text-sm leading-tight mb-1 line-clamp-2">{p.title}</h4>
                    {p.product_type && <p className="text-xs" style={{ color: '#52525b' }}>{p.product_type}</p>}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {price && <span className="text-sm font-bold" style={{ color: '#22c55e' }}>{price}</span>}
                    <span className="text-xs" style={{ color: inv <= 5 ? '#ef4444' : '#52525b' }}>{inv} in stock</span>
                  </div>
                  {p.tags && (
                    <div className="flex flex-wrap gap-1">
                      {p.tags.split(',').slice(0, 3).map((t) => (
                        <span key={t} className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(220,38,38,0.06)', color: '#71717a', fontSize: '0.65rem' }}>
                          {t.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  <button onClick={() => onSelect(p)} className="btn-primary w-full justify-center mt-auto"
                    style={{ padding: '0.6rem', fontSize: '0.8rem' }}>
                    <Sparkles size={14} /> Generate AI Content
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : products.length > 0 ? (
        <div className="text-center py-12" style={{ color: '#52525b' }}>
          <Search size={28} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No products match your search</p>
        </div>
      ) : (
        <div className="text-center py-12" style={{ color: '#52525b' }}>
          <Package size={28} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No products found in this store</p>
        </div>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// Step 3 — AI Generation + Push Modal
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
  const [showOriginal, setShowOriginal] = useState(true);
  const { copiedId, copy } = useCopy();

  async function handleGenerate() {
    setStatus('generating');
    setError('');
    setPushStatus('idle');

    try {
      const res = await fetch('/api/shopify/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          title: product.title,
          bodyHtml: product.body_html || '',
          productType: product.product_type,
          tags: product.tags,
          vendor: product.vendor,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Generation failed (${res.status})`);
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
        inputs: { productTitle: product.title, productType: product.product_type, storeDomain: credentials.storeDomain },
        outputs: { generatedTitle: data.title, seoTitle: data.seoTitle, seoDescription: data.seoDescription, tags: data.tags.join(', ') },
        isSaved: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setStatus('error');
    }
  }

  async function handlePush() {
    setPushStatus('pushing');
    try {
      const res = await fetch('/api/shopify/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          title: editMode ? editedTitle : result?.title,
          body_html: editMode ? editedBody : result?.bodyHtml,
          tags: editMode ? editedTags : result?.tags.join(', '),
          storeDomain: credentials.storeDomain,
          accessToken: credentials.accessToken,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Push failed');
      }
      setPushStatus('done');
      setTimeout(() => onPushed(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Push failed');
      setPushStatus('error');
    }
  }

  const img = product.images?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-4xl my-8 mx-4 rounded-2xl overflow-hidden animate-fade-up"
        style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.2)' }}>
              <Sparkles size={16} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <p className="font-bold text-sm">AI Content Generator</p>
              <p className="text-xs" style={{ color: '#52525b' }}>{product.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#71717a' }}>
            <X size={16} />
          </button>
        </div>

        <div className="p-6">
          {/* Product summary */}
          <div className="flex items-start gap-5 mb-6 p-4 rounded-xl"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            {img && <img src={img.src} alt={product.title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold mb-1 truncate">{product.title}</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <StatusChip status={product.status} />
                {product.product_type && <span className="text-xs" style={{ color: '#52525b' }}>{product.product_type}</span>}
                {product.vendor && <span className="text-xs" style={{ color: '#52525b' }}>by {product.vendor}</span>}
              </div>
            </div>
          </div>

          {/* Idle */}
          {status === 'idle' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)' }}>
                <Sparkles size={28} style={{ color: '#ef4444' }} />
              </div>
              <h3 className="text-xl font-black mb-2">Ready to Generate</h3>
              <p className="text-sm mb-6" style={{ color: '#71717a', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                AI will create an optimized title, rich description, SEO metadata, and tags for this product.
              </p>
              <button onClick={handleGenerate} className="btn-primary" style={{ padding: '0.75rem 2rem' }}>
                <Sparkles size={16} /> Generate AI Content
              </button>
            </div>
          )}

          {/* Generating */}
          {status === 'generating' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', animation: 'pulse-glow 2s ease-in-out infinite' }}>
                <Sparkles size={24} className="animate-spin" style={{ color: '#ef4444' }} />
              </div>
              <p className="font-semibold mb-1">Generating AI content…</p>
              <p className="text-sm" style={{ color: '#52525b' }}>Analyzing product and creating optimized copy</p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)' }}>
                <AlertTriangle size={28} style={{ color: '#ef4444' }} />
              </div>
              <h3 className="text-xl font-bold mb-2">Generation Failed</h3>
              <p className="text-sm mb-6" style={{ color: '#71717a' }}>{error}</p>
              <button onClick={handleGenerate} className="btn-primary" style={{ padding: '0.75rem 2rem' }}>
                <RefreshCw size={16} /> Try Again
              </button>
            </div>
          )}

          {/* Results */}
          {status === 'done' && result && (
            <div className="flex flex-col gap-5">
              {result.isDemo && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                  style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
                  <AlertTriangle size={14} style={{ color: '#eab308' }} />
                  <p className="text-xs" style={{ color: '#eab308' }}>
                    Demo mode — Add <strong>OPENAI_API_KEY</strong> for real AI-generated content
                  </p>
                </div>
              )}

              {/* Toolbar */}
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => setShowOriginal(!showOriginal)}
                  className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: '#71717a' }}>
                  {showOriginal ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {showOriginal ? 'Hide' : 'Show'} original
                </button>
                <button onClick={() => setEditMode(!editMode)}
                  className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{
                    background: editMode ? 'rgba(220,38,38,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${editMode ? 'rgba(220,38,38,0.25)' : 'var(--color-border)'}`,
                    color: editMode ? '#ef4444' : '#71717a',
                  }}>
                  <Edit3 size={12} /> {editMode ? 'Editing' : 'Edit before push'}
                </button>
                <button onClick={handleGenerate}
                  className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: '#71717a' }}>
                  <RefreshCw size={12} /> Regenerate
                </button>
              </div>

              {/* Title */}
              <div className="rounded-xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>
                    <ShoppingCart size={11} className="inline mr-1" /> Product Title
                  </span>
                  <CopyBtn text={editMode ? editedTitle : result.title} id="title" copiedId={copiedId} onCopy={copy} />
                </div>
                {showOriginal && (
                  <p className="text-xs mb-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', color: '#52525b', border: '1px dashed var(--color-border)' }}>
                    <span style={{ color: '#3f3f46' }}>Original:</span> {product.title}
                  </p>
                )}
                {editMode ? (
                  <input type="text" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)}
                    className="input-field" style={{ fontSize: '0.95rem', fontWeight: 600 }} />
                ) : (
                  <p className="font-semibold" style={{ color: '#f8f8f8' }}>{result.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="rounded-xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#f97316' }}>
                    <FileText size={11} className="inline mr-1" /> Description
                  </span>
                  <CopyBtn text={editMode ? editedBody : result.bodyHtml} id="body" copiedId={copiedId} onCopy={copy} />
                </div>
                {editMode ? (
                  <textarea value={editedBody} onChange={(e) => setEditedBody(e.target.value)}
                    className="input-field" rows={6} style={{ fontSize: '0.85rem', resize: 'vertical' }} />
                ) : (
                  <div className="text-sm leading-relaxed prose-invert" style={{ color: '#a1a1aa' }}
                    dangerouslySetInnerHTML={{ __html: result.bodyHtml }} />
                )}
              </div>

              {/* SEO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#60a5fa' }}>SEO Title</span>
                    <CopyBtn text={result.seoTitle} id="seo-t" copiedId={copiedId} onCopy={copy} size="xs" />
                  </div>
                  <p className="text-sm font-medium" style={{ color: '#f8f8f8' }}>{result.seoTitle}</p>
                  <p className="text-xs mt-1" style={{ color: '#3f3f46' }}>{result.seoTitle.length}/60 chars</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#a855f7' }}>SEO Description</span>
                    <CopyBtn text={result.seoDescription} id="seo-d" copiedId={copiedId} onCopy={copy} size="xs" />
                  </div>
                  <p className="text-sm" style={{ color: '#a1a1aa' }}>{result.seoDescription}</p>
                  <p className="text-xs mt-1" style={{ color: '#3f3f46' }}>{result.seoDescription.length}/160 chars</p>
                </div>
              </div>

              {/* Tags */}
              <div className="rounded-xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#22c55e' }}>
                    <Tag size={11} className="inline mr-1" /> Tags
                  </span>
                  <CopyBtn text={editMode ? editedTags : result.tags.join(', ')} id="tags" copiedId={copiedId} onCopy={copy} />
                </div>
                {editMode ? (
                  <input type="text" value={editedTags} onChange={(e) => setEditedTags(e.target.value)}
                    className="input-field" placeholder="tag1, tag2, tag3" />
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {result.tags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Push to Shopify */}
              <div className="rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
                style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.08) 0%, rgba(0,0,0,0) 100%)', border: '1px solid rgba(220,38,38,0.2)' }}>
                <div>
                  <p className="font-bold mb-0.5">Push to Shopify</p>
                  <p className="text-xs" style={{ color: '#71717a' }}>Update this product on your store with the AI-generated content</p>
                </div>
                <button onClick={handlePush} disabled={pushStatus === 'pushing' || pushStatus === 'done'}
                  className="btn-primary flex-shrink-0"
                  style={{ padding: '0.6rem 1.5rem', opacity: pushStatus === 'pushing' || pushStatus === 'done' ? 0.6 : 1 }}>
                  {pushStatus === 'pushing' ? <><Loader2 size={15} className="animate-spin" /> Pushing…</> :
                   pushStatus === 'done' ? <><CheckCircle2 size={15} /> Updated!</> :
                   <><ArrowRight size={15} /> Push to Shopify</>}
                </button>
              </div>

              {pushStatus === 'done' && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
                  <CheckCircle2 size={16} style={{ color: '#22c55e' }} />
                  <p className="text-sm font-medium" style={{ color: '#86efac' }}>Product updated successfully on Shopify!</p>
                </div>
              )}
              {pushStatus === 'error' && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)' }}>
                  <AlertTriangle size={16} style={{ color: '#ef4444' }} />
                  <p className="text-sm" style={{ color: '#fca5a5' }}>{error}</p>
                </div>
              )}
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
  const resultsRef = useRef<HTMLDivElement>(null);

  // ── Handle OAuth callback redirect ───────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);

    // Check for OAuth error
    const err = params.get('oauth_error');
    if (err) {
      setOauthError(decodeURIComponent(err));
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname + '#connect-store');
      return;
    }

    // Check for OAuth success — read credentials from cookie
    if (params.get('oauth_success') === 'true') {
      const cookie = document.cookie
        .split('; ')
        .find((c) => c.startsWith('rootx_shopify_creds='));
      if (cookie) {
        try {
          const val = cookie.split('=')[1];
          const creds = JSON.parse(atob(val.replace(/-/g, '+').replace(/_/g, '/'))) as ShopifyCredentials;
          setStored(creds);
          setCredentials(creds);
          fetchProducts(creds);
          // Clear the cookie
          document.cookie = 'rootx_shopify_creds=; path=/; max-age=0';
        } catch {
          setOauthError('Failed to read OAuth credentials. Please try again.');
        }
      }
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname + '#connect-store');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step: 1 | 2 | 3 = !credentials ? 1 : selectedProduct ? 3 : 2;

  const fetchProducts = useCallback(async (creds: ShopifyCredentials) => {
    setLoadingProducts(true);
    setProductsError('');
    try {
      const params = new URLSearchParams({ storeDomain: creds.storeDomain, accessToken: creds.accessToken });
      const res = await fetch(`/api/shopify/products?${params}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed to fetch products (${res.status})`);
      }
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  function handleConnected(creds: ShopifyCredentials) {
    setCredentials(creds);
    fetchProducts(creds);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
  }

  function handleDisconnect() {
    clearStored();
    setCredentials(null);
    setProducts([]);
    setSelectedProduct(null);
  }

  function handlePushed() {
    setSelectedProduct(null);
    if (credentials) fetchProducts(credentials);
  }

  return (
    <section className="py-16" style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
      <div className="section-container" ref={resultsRef}>
        {/* Section header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.25)' }}>
            <Plug size={18} style={{ color: '#ef4444' }} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>
            Connect & Launch
          </span>
        </div>
        <h2 className="text-3xl font-black mb-2">
          Get Started with Your{' '}
          <span className="gradient-text">Shopify Store</span>
        </h2>
        <p className="mb-8" style={{ color: '#71717a', maxWidth: '560px' }}>
          Connect your store, import your products, and let AI generate optimized titles, descriptions, SEO metadata, and tags — then push updates back with one click.
        </p>

        {/* Step indicator */}
        <StepIndicator step={step} />

        {/* Connected header bar */}
        {credentials && (
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8 p-4 rounded-2xl"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
                Connected
              </div>
              <div>
                <p className="font-bold text-sm">{credentials.shopName || credentials.storeDomain}</p>
                <p className="text-xs" style={{ color: '#52525b' }}>{products.length} products loaded</p>
              </div>
            </div>
            <button onClick={handleDisconnect}
              className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: '#71717a' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}>
              <Unplug size={12} /> Disconnect
            </button>
          </div>
        )}

        {/* Step content */}
        {!credentials && <ConnectStep onConnected={handleConnected} oauthError={oauthError} />}

        {credentials && !selectedProduct && (
          <ProductGrid
            products={products}
            loading={loadingProducts}
            error={productsError}
            onSelect={(p) => setSelectedProduct(p)}
            onRefresh={() => credentials && fetchProducts(credentials)}
          />
        )}

        {selectedProduct && credentials && (
          <GenerationModal
            product={selectedProduct}
            credentials={credentials}
            onClose={() => setSelectedProduct(null)}
            onPushed={handlePushed}
          />
        )}

        {/* Bottom CTA — secondary request setup */}
        <div className="mt-12 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.06) 0%, rgba(0,0,0,0) 100%)', border: '1px solid rgba(220,38,38,0.15)' }}>
          <div>
            <p className="font-bold mb-0.5">Need help setting up?</p>
            <p className="text-sm" style={{ color: '#71717a' }}>
              Our team can configure your Shopify AI Agent end-to-end — automated listings, inventory alerts, and more.
            </p>
          </div>
          <Link href="/request?agent=shopify-ai-agent" className="btn-secondary flex-shrink-0" style={{ whiteSpace: 'nowrap' }}>
            <Zap size={15} /> Request Setup
          </Link>
        </div>
      </div>
    </section>
  );
}
