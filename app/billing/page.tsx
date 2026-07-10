'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2, CreditCard, Zap, ArrowRight, Loader2,
  AlertCircle, Star, Building2, Calendar, RefreshCw,
} from 'lucide-react';
import { PLANS, type PlanId } from '@/lib/stripe';
import { useAuth } from '@/components/AuthProvider';
import { usePlan } from '@/lib/use-plan';

const PLAN_COLORS: Record<PlanId, string> = {
  free: '#71717a',
  pro: '#f59e0b',
  business: '#60a5fa',
};

const PLAN_ICONS: Record<PlanId, React.ReactNode> = {
  free: <Zap size={20} />,
  pro: <Star size={20} />,
  business: <Building2 size={20} />,
};

// ── Inner component (uses useSearchParams — must be inside Suspense) ──
function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { planId, plan, status, currentPeriodEnd, cancelAtPeriodEnd, stripeCustomerId, loading: planLoading } = usePlan(user?.id);

  const [portalLoading, setPortalLoading] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchParams.get('success') === '1') setSuccessBanner(true);
      if (searchParams.get('demo') === '1') setDemoMode(true);
    }, 0);
    return () => clearTimeout(t);
  }, [searchParams]);

  async function openPortal() {
    if (!stripeCustomerId) {
      router.push('/pricing');
      return;
    }
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: stripeCustomerId }),
      });
      const data = await res.json() as { url?: string; demo?: boolean };
      if (data.url) window.location.href = data.url;
    } catch {
      // silent
    } finally {
      setPortalLoading(false);
    }
  }

  if (authLoading || planLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: '#ef4444' }} />
      </div>
    );
  }

  const color = PLAN_COLORS[planId];
  const periodEndDate = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div
      className="min-h-screen py-24 px-4"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(220,38,38,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-2xl mx-auto animate-fade-up">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-sm transition-colors" style={{ color: '#52525b', textDecoration: 'none' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#52525b')}
          >
            Dashboard
          </Link>
          <span style={{ color: '#3f3f46' }}>/</span>
          <span className="text-sm font-medium" style={{ color: '#a1a1aa' }}>Billing</span>
        </div>

        {/* Success banner */}
        {successBanner && (
          <div
            className="flex items-center gap-3 p-4 rounded-2xl mb-6"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}
          >
            <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
            <div>
              <p className="font-bold text-sm" style={{ color: '#22c55e' }}>
                🎉 You&apos;re now on {PLANS[searchParams.get('plan') as PlanId]?.name ?? 'a new plan'}!
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#71717a' }}>
                Your plan is active. Enjoy unlimited AI generation power.
              </p>
            </div>
          </div>
        )}

        {/* Demo banner */}
        {demoMode && (
          <div
            className="flex items-start gap-3 p-4 rounded-2xl mb-6"
            style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)' }}
          >
            <AlertCircle size={16} style={{ color: '#eab308', marginTop: 2, flexShrink: 0 }} />
            <div>
              <p className="font-bold text-sm" style={{ color: '#eab308' }}>Demo mode</p>
              <p className="text-xs mt-0.5" style={{ color: '#71717a' }}>
                Stripe is not configured. Add your Stripe keys to enable real payments.
              </p>
            </div>
          </div>
        )}

        {/* Plan card */}
        <div
          className="rounded-2xl p-7 mb-6"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
          }}
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#52525b' }}>
                Current Plan
              </p>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}
                >
                  {PLAN_ICONS[planId]}
                </div>
                <div>
                  <h1 className="text-2xl font-black">{plan.name}</h1>
                  <p className="text-sm" style={{ color: '#71717a' }}>
                    {plan.price === 0 ? 'Free forever' : `$${plan.price}/month`}
                  </p>
                </div>
              </div>

              {/* Status chip */}
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mt-2"
                style={{
                  background: status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${status === 'active' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  color: status === 'active' ? '#22c55e' : '#ef4444',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: status === 'active' ? '#22c55e' : '#ef4444' }}
                />
                {status === 'active' ? 'Active' : status === 'past_due' ? 'Payment Due' : status}
              </div>
            </div>

            {/* Upgrade button */}
            {planId !== 'business' && (
              <Link
                href="/pricing"
                className="btn-primary flex-shrink-0"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
              >
                <ArrowRight size={15} />
                {planId === 'free' ? 'Upgrade Plan' : 'Upgrade to Business'}
              </Link>
            )}
          </div>

          {/* Period info */}
          {periodEndDate && (
            <div
              className="mt-5 pt-5 flex items-center gap-2 text-sm"
              style={{ borderTop: '1px solid var(--color-border)', color: '#71717a' }}
            >
              <Calendar size={15} />
              {cancelAtPeriodEnd
                ? <span>Your plan cancels on <strong style={{ color: '#f8f8f8' }}>{periodEndDate}</strong></span>
                : <span>Renews on <strong style={{ color: '#f8f8f8' }}>{periodEndDate}</strong></span>}
            </div>
          )}

          {/* Generation limit */}
          <div
            className="mt-4 flex items-center gap-2 text-sm"
            style={{ color: '#71717a' }}
          >
            <Zap size={15} style={{ color }} />
            {plan.generationsPerMonth === -1
              ? <span><strong style={{ color: '#f8f8f8' }}>Unlimited</strong> AI generations</span>
              : <span><strong style={{ color: '#f8f8f8' }}>{plan.generationsPerMonth}</strong> AI generations / month</span>}
          </div>
        </div>

        {/* Manage subscription */}
        {planId !== 'free' && (
          <div
            className="rounded-2xl p-6 mb-6"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="font-bold text-sm mb-1">Manage Subscription</h2>
                <p className="text-xs" style={{ color: '#71717a' }}>
                  Update payment method, download invoices, or cancel your plan.
                </p>
              </div>
              <button
                onClick={openPortal}
                disabled={portalLoading}
                className="btn-secondary flex-shrink-0"
                style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem', opacity: portalLoading ? 0.6 : 1 }}
              >
                {portalLoading ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                {portalLoading ? 'Opening…' : 'Billing Portal'}
              </button>
            </div>
          </div>
        )}

        {/* Features of current plan */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h2 className="font-bold text-sm mb-4" style={{ color: '#a1a1aa' }}>
            What&apos;s included in {plan.name}
          </h2>
          <div className="flex flex-col gap-2.5">
            {plan.features.map((feat) => (
              <div key={feat} className="flex items-center gap-2.5">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}15` }}
                >
                  <CheckCircle2 size={11} style={{ color }} />
                </div>
                <span className="text-sm" style={{ color: '#a1a1aa' }}>{feat}</span>
              </div>
            ))}
          </div>

          {planId === 'free' && (
            <Link
              href="/pricing"
              className="btn-primary w-full text-center justify-center mt-6"
              style={{ padding: '0.75rem' }}
            >
              <RefreshCw size={15} /> View all plans
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page shell — wraps inner component with Suspense ──
export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
          <Loader2 size={28} className="animate-spin" style={{ color: '#ef4444' }} />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
