'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingCart, Loader2, AlertTriangle, CheckCircle2, Plug, Package,
  Sparkles, ArrowRight, ExternalLink, Search, RefreshCw, Copy, Check,
  Edit3, Eye, X, Lock, Zap, Tag, FileText, Store, Unplug, ChevronDown,
  ChevronUp, ImageIcon, DollarSign, FolderOpen, Layers, TrendingUp, Camera,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { usePlan } from '@/lib/use-plan';
import { saveGeneration } from '@/lib/dashboard-storage';
import type {
  ShopifyProduct, ShopifyCredentials, AIProductGeneration,
  UpdateResponse, VerificationResult,
} from '@/lib/shopify-types';

// ════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'rootx_shopify_credentials';

function getStoredCredentials(): ShopifyCredentials | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function storeCredentials(creds: ShopifyCredentials) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
}

function clearStoredCredentials() {
  localStorage.removeItem(STORAGE_KEY);
}

// ════════════════════════════════════════════════════════════════
// Copy hook
// ════════════════════════════════════════════════════════════════

function useCopy() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }
  return { copiedId, copy };
}

// ════════════════════════════════════════════════════════════════
// Sub-components
// ════════════════════════════════════════════════════════════════

function CopyButton({ text, id, copiedId, onCopy, size = 'sm' }: {
  text: string; id: string; copiedId: string | null;
  onCopy: (t: string, id: string) => void; size?: 'sm' | 'xs';
}) {
  const isCopied = copiedId === id;
  const padding = size === 'xs' ? '0.2rem 0.5rem' : '0.3rem 0.6rem';
  const fontSize = size === 'xs' ? '0.65rem' : '0.7rem';
  return (
    <button
      onClick={() => onCopy(text, id)}
      className="flex items-center gap-1 rounded-lg transition-all duration-200"
      style={{
        padding, fontSize,
        background: isCopied ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isCopied ? 'rgba(34,197,94,0.3)' : 'var(--color-border)'}`,
        color: isCopied ? '#22c55e' : '#52525b',
      }}
    >
      {isCopied ? <Check size={10} /> : <Copy size={10} />}
      {isCopied ? 'Copied' : 'Copy'}
    </button>
  );
}

function StatusChip({ status }: { status: ShopifyProduct['status'] }) {
  const config = {
    active:   { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.25)',  color: '#22c55e', label: 'Active' },
    draft:    { bg: 'rgba(234,179,8,0.1)',   border: 'rgba(234,179,8,0.25)',  color: '#eab308', label: 'Draft' },
    archived: { bg: 'rgba(113,113,122,0.1)', border: 'rgba(113,113,122,0.25)', color: '#71717a', label: 'Archived' },
  }[status];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: config.bg, border: `1px solid ${config.border}`, color: config.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: config.color }} />
      {config.label}
    </span>
  );
}

// ════════════════════════════════════════════════════════════════
// Plan Gate
// ════════════════════════════════════════════════════════════════

function PlanGate() {
  return (
    <div className="max-w-lg mx-auto text-center py-20 px-4">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
        style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)' }}>
        <Lock size={32} style={{ color: '#ef4444' }} />
      </div>
      <h2 className="text-2xl font-black mb-3">Upgrade to Access</h2>
      <p className="mb-8" style={{ color: '#71717a' }}>
        The Shopify AI Agent requires a <strong style={{ color: '#f59e0b' }}>Pro</strong> or <strong style={{ color: '#60a5fa' }}>Business</strong> plan.
        Upgrade to connect your store and start generating AI content.
      </p>
      <Link href="/pricing" className="btn-primary" style={{ padding: '0.75rem 2rem' }}>
        <Zap size={16} /> View Plans &amp; Upgrade
      </Link>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Connection Form
// ════════════════════════════════════════════════════════════════

function ConnectionForm({ onConnected }: { onConnected: (creds: ShopifyCredentials) => void }) {
  const { user } = useAuth();
  const [domain, setDomain] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');
  const [showToken, setShowToken] = useState(false);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    const trimDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const trimToken = token.trim();

    if (!trimDomain || !trimToken) return;

    setStatus('loading');
    setError('');

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      // Attach auth token if logged in via Supabase
      if (user) {
        const { supabaseClient } = await import('@/lib/supabase-auth');
        if (supabaseClient) {
          const { data } = await supabaseClient.auth.getSession();
          if (data.session?.access_token) {
            headers['Authorization'] = `Bearer ${data.session.access_token}`;
          }
        }
      }

      const res = await fetch('/api/shopify/connect', {
        method: 'POST',
        headers,
        body: JSON.stringify({ storeDomain: trimDomain, accessToken: trimToken }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Connection failed (${res.status})`);
      }

      const creds: ShopifyCredentials = {
        storeDomain: trimDomain,
        accessToken: trimToken,
        shopName: data.shopName,
      };

      storeCredentials(creds);
      onConnected(creds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setStatus('error');
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.2)' }}>
          <Store size={28} style={{ color: '#ef4444' }} />
        </div>
        <h2 className="text-3xl font-black mb-2">Connect Your Store</h2>
        <p style={{ color: '#71717a', maxWidth: '440px', margin: '0 auto' }}>
          Enter your Shopify store URL and Admin API access token to get started.
        </p>
      </div>

      {/* Form card */}
      <div className="rounded-2xl p-6 md:p-8"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 24px 48px rgba(0,0,0,0.3)' }}>
        <form onSubmit={handleConnect} className="flex flex-col gap-5">
          {/* Store domain */}
          <div>
            <label htmlFor="store-domain" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
              Store URL <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="store-domain"
              type="text"
              required
              placeholder="my-store.myshopify.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={status === 'loading'}
              className="input-field"
            />
            <p className="text-xs mt-1.5" style={{ color: '#3f3f46' }}>
              Your Shopify store domain (e.g. your-store.myshopify.com)
            </p>
          </div>

          {/* Access token */}
          <div>
            <label htmlFor="access-token" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
              Admin API Access Token <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="relative">
              <input
                id="access-token"
                type={showToken ? 'text' : 'password'}
                required
                placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={status === 'loading'}
                className="input-field"
                style={{ paddingRight: '2.75rem' }}
              />
              <button type="button" onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#52525b' }} tabIndex={-1}>
                {showToken ? <X size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {status === 'error' && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl"
              style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)' }}>
              <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
              <p className="text-sm" style={{ color: '#fca5a5' }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={status === 'loading' || !domain.trim() || !token.trim()}
            className="btn-primary w-full justify-center"
            style={{ padding: '0.875rem', fontSize: '1rem', opacity: status === 'loading' ? 0.6 : 1 }}>
            {status === 'loading' ? (
              <><Loader2 size={18} className="animate-spin" /> Testing connection…</>
            ) : (
              <><Plug size={18} /> Test &amp; Connect Store</>
            )}
          </button>
        </form>

        {/* How-to section */}
        <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#3f3f46' }}>
            How to get your access token
          </p>
          <ol className="flex flex-col gap-2 text-xs leading-relaxed" style={{ color: '#71717a' }}>
            <li className="flex items-start gap-2">
              <span className="font-bold flex-shrink-0" style={{ color: '#ef4444' }}>1.</span>
              Go to your Shopify Admin → Settings → Apps and sales channels → Develop apps
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold flex-shrink-0" style={{ color: '#ef4444' }}>2.</span>
              Click &quot;Create an app&quot; → name it &quot;RootX&quot;
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold flex-shrink-0" style={{ color: '#ef4444' }}>3.</span>
              Go to &quot;Configure Admin API scopes&quot; → enable <strong style={{ color: '#a1a1aa' }}>read_products</strong> and <strong style={{ color: '#a1a1aa' }}>write_products</strong>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold flex-shrink-0" style={{ color: '#ef4444' }}>4.</span>
              Click &quot;Install app&quot; → copy the Admin API access token
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Product Card
// ════════════════════════════════════════════════════════════════

function ProductCard({ product, onGenerate }: {
  product: ShopifyProduct;
  onGenerate: (p: ShopifyProduct) => void;
}) {
  const mainImage = product.images?.[0];
  const mainVariant = product.variants?.[0];
  const price = mainVariant?.price ? `$${parseFloat(mainVariant.price).toFixed(2)}` : null;
  const inventory = product.variants?.reduce((sum, v) => sum + (v.inventory_quantity ?? 0), 0) ?? 0;

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-300 group"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(220,38,38,0.3)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}>

      {/* Image */}
      <div className="relative w-full" style={{ paddingTop: '75%', background: '#0a0a0c' }}>
        {mainImage ? (
          <img
            src={mainImage.src}
            alt={mainImage.alt || product.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon size={32} style={{ color: '#27272a' }} />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <StatusChip status={product.status} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <h3 className="font-bold text-sm leading-tight mb-1 line-clamp-2">{product.title}</h3>
          {product.product_type && (
            <p className="text-xs" style={{ color: '#52525b' }}>{product.product_type}</p>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap">
          {price && (
            <span className="text-sm font-bold" style={{ color: '#22c55e' }}>{price}</span>
          )}
          <span className="text-xs" style={{ color: inventory <= 5 ? '#ef4444' : '#52525b' }}>
            {inventory} in stock
          </span>
          {product.vendor && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: '#52525b' }}>
              {product.vendor}
            </span>
          )}
        </div>

        {/* Tags preview */}
        {product.tags && (
          <div className="flex flex-wrap gap-1">
            {product.tags.split(',').slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(220,38,38,0.06)', color: '#71717a', fontSize: '0.65rem' }}>
                {tag.trim()}
              </span>
            ))}
            {product.tags.split(',').length > 3 && (
              <span className="text-xs" style={{ color: '#3f3f46' }}>+{product.tags.split(',').length - 3}</span>
            )}
          </div>
        )}

        {/* Action */}
        <button onClick={() => onGenerate(product)}
          className="btn-primary w-full justify-center mt-auto"
          style={{ padding: '0.6rem', fontSize: '0.8rem' }}>
          <Sparkles size={14} /> Generate AI Content
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// AI Generation Panel
// ════════════════════════════════════════════════════════════════

function GenerationPanel({ product, credentials, onClose, onPushed }: {
  product: ShopifyProduct;
  credentials: ShopifyCredentials;
  onClose: () => void;
  onPushed: () => void;
}) {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<AIProductGeneration | null>(null);
  const [pushStatus, setPushStatus] = useState<'idle' | 'pushing' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [editedTags, setEditedTags] = useState('');
  const [showComparison, setShowComparison] = useState(true);
  const [verifiedProduct, setVerifiedProduct] = useState<ShopifyProduct | null>(null);
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const { copiedId, copy } = useCopy();

  async function getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (user) {
      const { supabaseClient } = await import('@/lib/supabase-auth');
      if (supabaseClient) {
        const { data } = await supabaseClient.auth.getSession();
        if (data.session?.access_token) {
          headers['Authorization'] = `Bearer ${data.session.access_token}`;
        }
      }
    }
    return headers;
  }

  async function handleGenerate() {
    setStatus('generating');
    setError('');
    setPushStatus('idle');
    setVerifiedProduct(null);
    setVerificationResults([]);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/shopify/generate', {
        method: 'POST',
        headers,
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
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Generation failed (${res.status})`);
      }

      const data: AIProductGeneration = await res.json();
      setResult(data);
      setEditedTitle(data.title);
      setEditedBody(data.bodyHtml);
      setEditedTags(data.tags.join(', '));
      setStatus('done');

      // Save to dashboard history
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
    setPushStatus('pushing');
    setError('');
    setVerifiedProduct(null);
    setVerificationResults([]);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/shopify/update', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          productId: product.id,
          title: editMode ? editedTitle : result?.title,
          body_html: editMode ? editedBody : result?.bodyHtml,
          tags: editMode ? editedTags : result?.tags.join(', '),
          product_type: result?.categorySuggestion?.primary || '',
          storeDomain: credentials.storeDomain,
          accessToken: credentials.accessToken,
        }),
      });

      const data: UpdateResponse = await res.json().catch(() => ({ success: false, error: 'Invalid response from server' }));

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Push failed (HTTP ${res.status})`);
      }

      if (data.product) setVerifiedProduct(data.product);
      if (data.verification) setVerificationResults(data.verification);
      setPushStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Push failed');
      setPushStatus('error');
    }
  }

  const mainImage = product.images?.[0];
  const shopifyProductUrl = `https://${credentials.storeDomain}/admin/products/${product.id}`;
  const matchCount = verificationResults.filter((v) => v.match).length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-5xl my-8 mx-4 rounded-2xl overflow-hidden animate-fade-up"
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
              <p className="font-bold text-sm">AI Ecommerce Agent</p>
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
            {mainImage && (
              <img src={mainImage.src} alt={product.title}
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold mb-1 truncate">{product.title}</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <StatusChip status={product.status} />
                {product.product_type && <span className="text-xs" style={{ color: '#52525b' }}>{product.product_type}</span>}
                {product.vendor && <span className="text-xs" style={{ color: '#52525b' }}>by {product.vendor}</span>}
              </div>
            </div>
          </div>

          {/* Idle state */}
          {status === 'idle' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)' }}>
                <Sparkles size={28} style={{ color: '#ef4444' }} />
              </div>
              <h3 className="text-xl font-black mb-2">Ready to Generate</h3>
              <p className="text-sm mb-6" style={{ color: '#71717a', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
                AI will analyze the product image, generate optimized copy, suggest pricing, recommend categories, and find upsell opportunities.
              </p>
              <button onClick={handleGenerate} className="btn-primary" style={{ padding: '0.75rem 2rem' }}>
                <Sparkles size={16} /> Generate AI Content
              </button>
            </div>
          )}

          {/* Generating state */}
          {status === 'generating' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', animation: 'pulse-glow 2s ease-in-out infinite' }}>
                <Sparkles size={24} className="animate-spin" style={{ color: '#ef4444' }} />
              </div>
              <p className="font-semibold mb-1">AI Agent is working…</p>
              <p className="text-sm" style={{ color: '#52525b' }}>Analyzing product image, generating copy, calculating price, finding upsells…</p>
            </div>
          )}

          {/* Error state */}
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

          {/* ══════════════ AI Results Panel ══════════════ */}
          {status === 'done' && result && (
            <div className="flex flex-col gap-5">
              {/* Demo badge */}
              {result.isDemo && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                  style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
                  <AlertTriangle size={14} style={{ color: '#eab308' }} />
                  <p className="text-xs" style={{ color: '#eab308' }}>
                    Demo mode — Add <strong>OPENAI_API_KEY</strong> for real AI-generated content
                  </p>
                </div>
              )}

              {/* Toggle bar */}
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => setShowComparison(!showComparison)}
                  className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: '#71717a' }}>
                  {showComparison ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {showComparison ? 'Hide' : 'Show'} original
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

              {/* ── Title ─────────────────────────────────── */}
              <div className="rounded-xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>
                    <ShoppingCart size={11} className="inline mr-1" /> Product Title
                  </span>
                  <CopyButton text={editMode ? editedTitle : result.title} id="title" copiedId={copiedId} onCopy={copy} />
                </div>
                {showComparison && (
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

              {/* ── Description ───────────────────────────── */}
              <div className="rounded-xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#f97316' }}>
                    <FileText size={11} className="inline mr-1" /> Description
                  </span>
                  <CopyButton text={editMode ? editedBody : result.bodyHtml} id="body" copiedId={copiedId} onCopy={copy} />
                </div>
                {editMode ? (
                  <textarea value={editedBody} onChange={(e) => setEditedBody(e.target.value)}
                    className="input-field" rows={8} style={{ fontSize: '0.85rem', resize: 'vertical' }} />
                ) : (
                  <div className="text-sm leading-relaxed prose-invert" style={{ color: '#a1a1aa' }}
                    dangerouslySetInnerHTML={{ __html: result.bodyHtml }} />
                )}
              </div>

              {/* ── SEO ────────────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#60a5fa' }}>SEO Title</span>
                    <CopyButton text={result.seoTitle} id="seo-title" copiedId={copiedId} onCopy={copy} size="xs" />
                  </div>
                  <p className="text-sm font-medium" style={{ color: '#f8f8f8' }}>{result.seoTitle}</p>
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${Math.min((result.seoTitle.length / 60) * 100, 100)}%`,
                      background: result.seoTitle.length <= 60 ? '#22c55e' : '#ef4444',
                    }} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: result.seoTitle.length <= 60 ? '#22c55e' : '#ef4444' }}>
                    {result.seoTitle.length}/60 chars {result.seoTitle.length <= 60 ? '✓' : '— too long'}
                  </p>
                </div>
                <div className="rounded-xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#a855f7' }}>Meta Description</span>
                    <CopyButton text={result.seoDescription} id="seo-desc" copiedId={copiedId} onCopy={copy} size="xs" />
                  </div>
                  <p className="text-sm" style={{ color: '#a1a1aa' }}>{result.seoDescription}</p>
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${Math.min((result.seoDescription.length / 160) * 100, 100)}%`,
                      background: result.seoDescription.length <= 160 ? '#22c55e' : '#ef4444',
                    }} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: result.seoDescription.length <= 160 ? '#22c55e' : '#ef4444' }}>
                    {result.seoDescription.length}/160 chars {result.seoDescription.length <= 160 ? '✓' : '— too long'}
                  </p>
                </div>
              </div>

              {/* ── Tags ───────────────────────────────────── */}
              <div className="rounded-xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#22c55e' }}>
                    <Tag size={11} className="inline mr-1" /> Tags
                  </span>
                  <CopyButton text={editMode ? editedTags : result.tags.join(', ')} id="tags" copiedId={copiedId} onCopy={copy} />
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

              {/* ═══════════════ NEW AI AGENT SECTIONS ═══════════════ */}

              {/* ── Image Analysis ─────────────────────────── */}
              {result.imageAnalysis && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                  <div className="px-4 py-2.5" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: '#f97316' }}>
                      <Camera size={11} /> Image Analysis
                    </span>
                  </div>
                  <div className="p-4 flex flex-col gap-4">
                    {/* Description */}
                    <p className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>
                      {result.imageAnalysis.description}
                    </p>
                    {/* Color palette + Style + Quality */}
                    <div className="flex items-center gap-6 flex-wrap">
                      {/* Colors */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold" style={{ color: '#71717a' }}>Colors:</span>
                        <div className="flex gap-1.5">
                          {result.imageAnalysis.dominantColors.map((color, i) => (
                            <div key={i} className="w-6 h-6 rounded-full border"
                              style={{ background: color, borderColor: 'rgba(255,255,255,0.1)' }}
                              title={color} />
                          ))}
                        </div>
                      </div>
                      {/* Style */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold" style={{ color: '#71717a' }}>Style:</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', color: '#f97316' }}>
                          {result.imageAnalysis.style}
                        </span>
                      </div>
                      {/* Quality */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold" style={{ color: '#71717a' }}>Quality:</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{
                            background: result.imageAnalysis.quality === 'high' ? 'rgba(34,197,94,0.1)' :
                              result.imageAnalysis.quality === 'medium' ? 'rgba(234,179,8,0.1)' : 'rgba(220,38,38,0.1)',
                            border: `1px solid ${result.imageAnalysis.quality === 'high' ? 'rgba(34,197,94,0.25)' :
                              result.imageAnalysis.quality === 'medium' ? 'rgba(234,179,8,0.25)' : 'rgba(220,38,38,0.25)'}`,
                            color: result.imageAnalysis.quality === 'high' ? '#22c55e' :
                              result.imageAnalysis.quality === 'medium' ? '#eab308' : '#ef4444',
                          }}>
                          {result.imageAnalysis.quality}
                        </span>
                      </div>
                    </div>
                    {/* Suggestions */}
                    {result.imageAnalysis.suggestions.length > 0 && (
                      <div>
                        <p className="text-xs font-bold mb-2" style={{ color: '#71717a' }}>Photo Improvement Tips:</p>
                        <ul className="flex flex-col gap-1.5">
                          {result.imageAnalysis.suggestions.map((tip, i) => (
                            <li key={i} className="text-xs flex items-start gap-2" style={{ color: '#a1a1aa' }}>
                              <span style={{ color: '#f97316' }}>•</span> {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Price Analysis ─────────────────────────── */}
              {result.priceAnalysis && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                  <div className="px-4 py-2.5" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: '#22c55e' }}>
                      <DollarSign size={11} /> Price Analysis
                    </span>
                  </div>
                  <div className="p-4 flex flex-col gap-4">
                    {/* Current vs Suggested */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="text-center">
                        <p className="text-xs font-semibold mb-1" style={{ color: '#71717a' }}>Current</p>
                        <p className="text-2xl font-black" style={{ color: '#71717a' }}>${result.priceAnalysis.currentPrice}</p>
                      </div>
                      <ArrowRight size={20} style={{ color: '#22c55e' }} />
                      <div className="text-center">
                        <p className="text-xs font-semibold mb-1" style={{ color: '#22c55e' }}>Suggested</p>
                        <p className="text-2xl font-black" style={{ color: '#22c55e' }}>${result.priceAnalysis.suggestedPrice}</p>
                      </div>
                      {/* Position badge */}
                      <span className="text-xs px-3 py-1 rounded-full font-bold ml-auto"
                        style={{
                          background: result.priceAnalysis.competitivePosition === 'premium' ? 'rgba(34,197,94,0.1)' :
                            result.priceAnalysis.competitivePosition === 'mid-range' ? 'rgba(96,165,250,0.1)' : 'rgba(234,179,8,0.1)',
                          border: `1px solid ${result.priceAnalysis.competitivePosition === 'premium' ? 'rgba(34,197,94,0.25)' :
                            result.priceAnalysis.competitivePosition === 'mid-range' ? 'rgba(96,165,250,0.25)' : 'rgba(234,179,8,0.25)'}`,
                          color: result.priceAnalysis.competitivePosition === 'premium' ? '#22c55e' :
                            result.priceAnalysis.competitivePosition === 'mid-range' ? '#60a5fa' : '#eab308',
                        }}>
                        {result.priceAnalysis.competitivePosition === 'mid-range' ? 'Mid-Range' :
                          result.priceAnalysis.competitivePosition.charAt(0).toUpperCase() + result.priceAnalysis.competitivePosition.slice(1)}
                      </span>
                    </div>
                    {/* Price range bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1" style={{ color: '#52525b' }}>
                        <span>${result.priceAnalysis.priceRange.min}</span>
                        <span>${result.priceAnalysis.priceRange.max}</span>
                      </div>
                      <div className="relative h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="absolute h-full rounded-full" style={{
                          background: 'linear-gradient(90deg, #22c55e, #60a5fa)',
                          left: '0', right: '0',
                        }} />
                        {(() => {
                          const min = parseFloat(result.priceAnalysis!.priceRange.min) || 0;
                          const max = parseFloat(result.priceAnalysis!.priceRange.max) || 100;
                          const suggested = parseFloat(result.priceAnalysis!.suggestedPrice) || 0;
                          const pct = max > min ? Math.min(Math.max(((suggested - min) / (max - min)) * 100, 0), 100) : 50;
                          return (
                            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2"
                              style={{ left: `${pct}%`, transform: `translate(-50%, -50%)`, background: '#f8f8f8', borderColor: '#22c55e' }} />
                          );
                        })()}
                      </div>
                    </div>
                    {/* Reasoning */}
                    <p className="text-sm" style={{ color: '#a1a1aa' }}>{result.priceAnalysis.reasoning}</p>
                    {/* Disclaimer */}
                    <p className="text-xs italic" style={{ color: '#3f3f46' }}>
                      AI estimate — not based on live market data
                    </p>
                  </div>
                </div>
              )}

              {/* ── Category Suggestion ────────────────────── */}
              {result.categorySuggestion && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                  <div className="px-4 py-2.5" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: '#60a5fa' }}>
                      <FolderOpen size={11} /> Category Suggestion
                    </span>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-bold px-3 py-1.5 rounded-lg"
                        style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa' }}>
                        {result.categorySuggestion.primary}
                      </span>
                      {result.categorySuggestion.alternatives.map((alt, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-lg"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: '#71717a' }}>
                          {alt}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm" style={{ color: '#a1a1aa' }}>{result.categorySuggestion.reasoning}</p>
                  </div>
                </div>
              )}

              {/* ── Upsell & Cross-sell ────────────────────── */}
              {result.upsellCrossSell && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                  <div className="px-4 py-2.5" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: '#a855f7' }}>
                      <Layers size={11} /> Upsell &amp; Cross-sell
                    </span>
                  </div>
                  <div className="p-4 flex flex-col gap-4">
                    {/* Upsell */}
                    {result.upsellCrossSell.upsell.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#a855f7' }}>
                          <TrendingUp size={10} className="inline mr-1" /> Upsell Opportunities
                        </p>
                        <div className="flex flex-col gap-2">
                          {result.upsellCrossSell.upsell.map((item, i) => (
                            <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-lg"
                              style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.1)' }}>
                              <div className="flex-1">
                                <p className="text-sm font-bold" style={{ color: '#e4e4e7' }}>{item.title}</p>
                                <p className="text-xs mt-0.5" style={{ color: '#71717a' }}>{item.reason}</p>
                              </div>
                              <span className="text-xs font-bold px-2 py-0.5 rounded flex-shrink-0"
                                style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
                                {item.pricePoint}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Cross-sell */}
                    {result.upsellCrossSell.crossSell.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#60a5fa' }}>
                          <Package size={10} className="inline mr-1" /> Cross-sell Recommendations
                        </p>
                        <div className="flex flex-col gap-2">
                          {result.upsellCrossSell.crossSell.map((item, i) => (
                            <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-lg"
                              style={{ background: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.1)' }}>
                              <div className="flex-1">
                                <p className="text-sm font-bold" style={{ color: '#e4e4e7' }}>{item.title}</p>
                                <p className="text-xs mt-0.5" style={{ color: '#71717a' }}>{item.reason}</p>
                              </div>
                              <span className="text-xs font-bold px-2 py-0.5 rounded flex-shrink-0"
                                style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>
                                {item.pricePoint}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Bundle idea */}
                    {result.upsellCrossSell.bundleIdea && (
                      <div className="p-3 rounded-lg"
                        style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.06) 0%, rgba(96,165,250,0.06) 100%)', border: '1px solid rgba(168,85,247,0.15)' }}>
                        <p className="text-xs font-bold mb-1" style={{ color: '#c084fc' }}>💡 Bundle Idea</p>
                        <p className="text-sm" style={{ color: '#a1a1aa' }}>{result.upsellCrossSell.bundleIdea}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══════════ Push to Shopify ═══════════ */}
              {pushStatus !== 'done' && (
                <div className="rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
                  style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.08) 0%, rgba(0,0,0,0) 100%)', border: '1px solid rgba(220,38,38,0.2)' }}>
                  <div>
                    <p className="font-bold mb-0.5 flex items-center gap-2">
                      <ArrowRight size={14} style={{ color: '#ef4444' }} /> Push to Shopify
                    </p>
                    <p className="text-xs" style={{ color: '#71717a' }}>
                      Update this product with AI-generated title, description, tags, and category
                    </p>
                  </div>
                  <button onClick={handlePush}
                    disabled={pushStatus === 'pushing'}
                    className="btn-primary flex-shrink-0"
                    style={{ padding: '0.7rem 1.8rem', fontSize: '0.9rem', opacity: pushStatus === 'pushing' ? 0.7 : 1 }}>
                    {pushStatus === 'pushing' ? <><Loader2 size={16} className="animate-spin" /> Updating Shopify…</> :
                     pushStatus === 'error' ? <><RefreshCw size={16} /> Try Again</> :
                     <><ArrowRight size={16} /> Push to Shopify</>}
                  </button>
                </div>
              )}

              {/* ═══════════ Push SUCCESS + Verification ═══════════ */}
              {pushStatus === 'done' && (
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(34,197,94,0.3)' }}>
                  {/* Success header */}
                  <div className="px-5 py-4 flex items-center gap-4"
                    style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.04) 100%)' }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)' }}>
                      <CheckCircle2 size={24} style={{ color: '#22c55e' }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold" style={{ color: '#86efac' }}>
                        Product updated successfully in Shopify!
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: '#52525b' }}>
                        {verificationResults.length > 0
                          ? `${matchCount}/${verificationResults.length} fields verified successfully`
                          : 'Verified — content confirmed by Shopify\'s servers'}
                      </p>
                    </div>
                  </div>

                  {/* Field-by-field verification */}
                  {verificationResults.length > 0 && (
                    <div className="px-5 py-4 flex flex-col gap-2"
                      style={{ borderTop: '1px solid rgba(34,197,94,0.12)', background: 'rgba(34,197,94,0.02)' }}>
                      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#22c55e' }}>
                        Field-by-Field Verification
                      </p>
                      {verificationResults.map((v, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg"
                          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                          {/* Status icon */}
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              background: v.match ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
                              border: `1px solid ${v.match ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}`,
                            }}>
                            {v.match
                              ? <Check size={12} style={{ color: '#22c55e' }} />
                              : <AlertTriangle size={12} style={{ color: '#eab308' }} />}
                          </div>
                          {/* Field name */}
                          <span className="text-sm font-semibold min-w-[100px]" style={{ color: '#e4e4e7' }}>
                            {v.field}
                          </span>
                          {/* Status text */}
                          <span className="text-xs flex-1" style={{ color: v.match ? '#22c55e' : '#eab308' }}>
                            {v.match ? '✓ Matches' : '⚠ Slight difference (Shopify may normalize content)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between px-5 py-3"
                    style={{ background: 'var(--color-surface)', borderTop: '1px solid rgba(34,197,94,0.15)' }}>
                    <a href={shopifyProductUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-semibold transition-all"
                      style={{ color: '#22c55e' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#86efac')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#22c55e')}>
                      <ExternalLink size={14} /> Open Shopify product
                    </a>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setPushStatus('idle'); setVerifiedProduct(null); setVerificationResults([]); handleGenerate(); }}
                        className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: '#71717a' }}>
                        <RefreshCw size={12} /> Generate Again
                      </button>
                      <button onClick={onPushed}
                        className="flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-lg"
                        style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}>
                        <Check size={12} /> Done
                      </button>
                    </div>
                  </div>
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
// Main Page Component
// ════════════════════════════════════════════════════════════════

export default function ShopifyAgentPage() {
  const { user } = useAuth();
  const { planId, loading: planLoading } = usePlan(user?.id);

  const [credentials, setCredentials] = useState<ShopifyCredentials | null>(null);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);

  // Check for stored credentials on mount
  useEffect(() => {
    const t = setTimeout(() => {
      const stored = getStoredCredentials();
      if (stored) {
        setCredentials(stored);
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Fetch products when credentials are set
  const fetchProducts = useCallback(async (creds: ShopifyCredentials) => {
    setLoadingProducts(true);
    setProductsError('');

    try {
      const headers: Record<string, string> = {};

      if (user) {
        const { supabaseClient } = await import('@/lib/supabase-auth');
        if (supabaseClient) {
          const { data } = await supabaseClient.auth.getSession();
          if (data.session?.access_token) {
            headers['Authorization'] = `Bearer ${data.session.access_token}`;
          }
        }
      }

      const params = new URLSearchParams({
        storeDomain: creds.storeDomain,
        accessToken: creds.accessToken,
      });

      const res = await fetch(`/api/shopify/products?${params}`, { headers });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to fetch products (${res.status})`);
      }

      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoadingProducts(false);
    }
  }, [user]);

  useEffect(() => {
    if (credentials) {
      const t = setTimeout(() => {
        fetchProducts(credentials);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [credentials, fetchProducts]);

  function handleConnected(creds: ShopifyCredentials) {
    setCredentials(creds);
  }

  function handleDisconnect() {
    clearStoredCredentials();
    setCredentials(null);
    setProducts([]);
    setSelectedProduct(null);
  }

  function handleProductPushed() {
    setSelectedProduct(null);
    if (credentials) fetchProducts(credentials);
  }

  // Plan gating
  const canAccess = planId === 'pro' || planId === 'business';

  if (planLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin" style={{ color: '#ef4444' }} />
      </div>
    );
  }

  if (!canAccess) {
    return <PlanGate />;
  }

  // Filter products
  const filtered = products.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.product_type?.toLowerCase().includes(search.toLowerCase()) ||
      p.vendor?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.25)' }}>
              <ShoppingCart size={16} style={{ color: '#ef4444' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>
              Shopify AI Agent
            </span>
          </div>
          <h1 className="text-3xl font-black mb-1">
            {credentials ? credentials.shopName || credentials.storeDomain : 'Connect Your Store'}
          </h1>
          <p style={{ color: '#71717a', fontSize: '0.95rem' }}>
            {credentials
              ? `${products.length} products loaded · Generate AI content and push updates`
              : 'Connect your Shopify store to start generating AI product content'
            }
          </p>
        </div>
        {credentials && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
              Connected
            </div>
            <button onClick={handleDisconnect}
              className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: '#71717a' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(220,38,38,0.3)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#71717a'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; }}>
              <Unplug size={12} /> Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Not connected → show form */}
      {!credentials && <ConnectionForm onConnected={handleConnected} />}

      {/* Connected → show products */}
      {credentials && (
        <>
          {/* Search + filter bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#52525b' }} />
              <input
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field w-full"
                style={{ paddingLeft: '2.25rem', height: '40px', fontSize: '0.875rem' }}
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'active', 'draft', 'archived'] as const).map((f) => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className="px-3 py-2 rounded-xl text-xs font-bold transition-all capitalize"
                  style={{
                    background: statusFilter === f ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.04)',
                    border: statusFilter === f ? '1px solid rgba(220,38,38,0.3)' : '1px solid var(--color-border)',
                    color: statusFilter === f ? '#ef4444' : '#71717a',
                  }}>
                  {f}
                </button>
              ))}
              <button onClick={() => credentials && fetchProducts(credentials)}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: '#71717a' }}
                title="Refresh products">
                <RefreshCw size={14} className={loadingProducts ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Loading */}
          {loadingProducts && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="shimmer" style={{ paddingTop: '75%' }} />
                  <div className="p-4 flex flex-col gap-3">
                    <div className="shimmer rounded-lg" style={{ height: '16px', width: '80%' }} />
                    <div className="shimmer rounded-lg" style={{ height: '12px', width: '50%' }} />
                    <div className="shimmer rounded-lg" style={{ height: '36px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {productsError && !loadingProducts && (
            <div className="rounded-2xl p-6 flex items-start gap-4"
              style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}>
              <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="font-semibold mb-1" style={{ color: '#ef4444' }}>Failed to load products</p>
                <p className="text-sm mb-3" style={{ color: '#a1a1aa' }}>{productsError}</p>
                <button onClick={() => credentials && fetchProducts(credentials)}
                  className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                  <RefreshCw size={13} /> Try Again
                </button>
              </div>
            </div>
          )}

          {/* Products grid */}
          {!loadingProducts && !productsError && (
            <>
              {filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onGenerate={(p) => setSelectedProduct(p)}
                    />
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className="text-center py-16" style={{ color: '#52525b' }}>
                  <Search size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No products match your search</p>
                </div>
              ) : (
                <div className="text-center py-16" style={{ color: '#52525b' }}>
                  <Package size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No products found in this store</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* AI Generation Modal */}
      {selectedProduct && credentials && (
        <GenerationPanel
          product={selectedProduct}
          credentials={credentials}
          onClose={() => setSelectedProduct(null)}
          onPushed={handleProductPushed}
        />
      )}
    </div>
  );
}
