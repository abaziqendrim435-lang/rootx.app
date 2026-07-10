'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Check, Zap, ArrowRight, Sparkles, Star, Building2,
  Loader2, AlertCircle, CheckCircle2, X,
} from 'lucide-react';
import { PLANS, PLAN_ORDER, type PlanId } from '@/lib/stripe';
import { useAuth } from '@/components/AuthProvider';
import { usePlan } from '@/lib/use-plan';

const PLAN_ICONS: Record<PlanId, React.ReactNode> = {
  free: <Zap size={22} style={{ color: '#71717a' }} />,
  pro: <Star size={22} style={{ color: '#f59e0b' }} />,
  business: <Building2 size={22} style={{ color: '#60a5fa' }} />,
};

const PLAN_COLORS: Record<PlanId, string> = {
  free: '#71717a',
  pro: '#f59e0b',
  business: '#60a5fa',
};

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { planId: currentPlan, loading: planLoading } = usePlan(user?.id);

  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);

  // Handle return from Stripe
  useEffect(() => {
    if (searchParams.get('canceled') === '1') {
      const t = setTimeout(() => {
        setToast({ type: 'info', msg: 'Checkout canceled — you were not charged.' });
      }, 0);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  function showToast(type: 'success' | 'error' | 'info', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  }

  async function handleUpgrade(planId: PlanId) {
    if (planId === 'free') return;
    if (!user) {
      router.push('/signup?next=/pricing');
      return;
    }
    if (currentPlan === planId) {
      showToast('info', `You're already on the ${PLANS[planId].name} plan.`);
      return;
    }

    setLoadingPlan(planId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          userEmail: user.email,
          userId: user.id,
        }),
      });

      const data = await res.json() as { url?: string; demo?: boolean; error?: string };

      if (data.error) {
        showToast('error', data.error);
        return;
      }

      if (data.url) {
        if (data.demo) {
          showToast('info', `Demo mode — Stripe is not configured. Would redirect to checkout for ${PLANS[planId].name} plan.`);
        } else {
          window.location.assign(data.url);
        }
      }
    } catch {
      showToast('error', 'Something went wrong. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div
      className="min-h-screen py-24 px-4"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(220,38,38,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Glow */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: '800px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(220,38,38,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl animate-fade-up"
          style={{
            background: 'var(--color-surface)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.4)' : toast.type === 'error' ? 'rgba(220,38,38,0.4)' : 'rgba(234,179,8,0.4)'}`,
            color: toast.type === 'success' ? '#22c55e' : toast.type === 'error' ? '#ef4444' : '#eab308',
            maxWidth: '360px',
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : toast.type === 'error' ? <AlertCircle size={16} /> : <AlertCircle size={16} />}
          <span style={{ color: '#e4e4e7' }}>{toast.msg}</span>
          <button onClick={() => setToast(null)} style={{ color: '#52525b', marginLeft: 'auto' }}>
            <X size={14} />
          </button>
        </div>
      )}

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-up">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.25)' }}
            >
              <Sparkles size={16} style={{ color: '#ef4444' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>
              Pricing
            </span>
          </div>
          <h1 className="text-5xl font-black mb-4 leading-tight">
            Simple, transparent
            <br />
            <span className="gradient-text">pricing</span>
          </h1>
          <p className="text-lg max-w-xl mx-auto" style={{ color: '#71717a' }}>
            Start free. Scale as you grow. No hidden fees, no contracts.
          </p>

          {/* Current plan chip */}
          {user && !planLoading && (
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mt-6"
              style={{
                background: 'rgba(220,38,38,0.08)',
                border: '1px solid rgba(220,38,38,0.2)',
                color: '#ef4444',
              }}
            >
              <CheckCircle2 size={14} />
              You&apos;re on the <strong>{PLANS[currentPlan].name}</strong> plan
            </div>
          )}
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLAN_ORDER.map((planId) => {
            const plan = PLANS[planId];
            const isPro = planId === 'pro';
            const isCurrent = currentPlan === planId;
            const color = PLAN_COLORS[planId];
            const isLoading = loadingPlan === planId;

            return (
              <div
                key={planId}
                className="rounded-2xl overflow-hidden relative transition-all duration-300"
                style={{
                  background: isPro
                    ? 'linear-gradient(180deg, rgba(220,38,38,0.08) 0%, var(--color-surface) 40%)'
                    : 'var(--color-surface)',
                  border: isPro ? '1px solid rgba(220,38,38,0.35)' : '1px solid var(--color-border)',
                  boxShadow: isPro ? '0 0 40px rgba(220,38,38,0.08)' : 'none',
                  transform: isPro ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                {/* Badge */}
                {plan.badge && (
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full text-xs font-bold"
                    style={{ background: 'linear-gradient(90deg, #dc2626, #991b1b)', color: '#fff' }}
                  >
                    {plan.badge}
                  </div>
                )}

                {/* Card header */}
                <div className="p-7 pb-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                    >
                      {PLAN_ICONS[planId]}
                    </div>
                    <div>
                      <h2 className="text-lg font-black">{plan.name}</h2>
                      <p className="text-xs" style={{ color: '#52525b' }}>{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-4xl font-black">
                      {plan.price === 0 ? 'Free' : `$${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-sm mb-1.5" style={{ color: '#71717a' }}>/month</span>
                    )}
                  </div>
                  {plan.price > 0 && (
                    <p className="text-xs" style={{ color: '#52525b' }}>
                      Billed monthly · Cancel anytime
                    </p>
                  )}

                  {/* Generation limit badge */}
                  <div
                    className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: `${color}12`, border: `1px solid ${color}25`, color }}
                  >
                    <Zap size={11} />
                    {plan.generationsPerMonth === -1
                      ? 'Unlimited generations'
                      : `${plan.generationsPerMonth} generations / month`}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'var(--color-border)', margin: '0 1.75rem' }} />

                {/* Features */}
                <div className="p-7 pt-5 pb-6 flex flex-col gap-2.5">
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2.5">
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}15` }}
                      >
                        <Check size={12} style={{ color }} />
                      </div>
                      <span className="text-sm" style={{ color: '#a1a1aa' }}>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="px-7 pb-7">
                  {isCurrent ? (
                    <div
                      className="w-full py-3 rounded-xl text-center text-sm font-bold"
                      style={{
                        background: `${color}10`,
                        border: `1px solid ${color}30`,
                        color,
                      }}
                    >
                      <CheckCircle2 size={15} className="inline mr-2" />
                      Current Plan
                    </div>
                  ) : planId === 'free' ? (
                    user ? (
                      <Link
                        href="/dashboard"
                        className="btn-secondary w-full text-center justify-center"
                        style={{ padding: '0.75rem' }}
                      >
                        Go to Dashboard
                      </Link>
                    ) : (
                      <Link
                        href="/signup"
                        className="btn-secondary w-full text-center justify-center"
                        style={{ padding: '0.75rem' }}
                      >
                        Get Started Free
                      </Link>
                    )
                  ) : (
                    <button
                      onClick={() => handleUpgrade(planId)}
                      disabled={isLoading || loadingPlan !== null}
                      className="btn-primary w-full justify-center"
                      style={{
                        padding: '0.75rem',
                        background: isPro ? 'linear-gradient(135deg, #dc2626, #991b1b)' : undefined,
                        opacity: loadingPlan !== null && !isLoading ? 0.5 : 1,
                      }}
                    >
                      {isLoading ? (
                        <><Loader2 size={16} className="animate-spin" /> Processing…</>
                      ) : (
                        <><ArrowRight size={16} /> Upgrade to {plan.name}</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ / trust row */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: '🔒', title: 'Secure payments', desc: 'Processed by Stripe — no card data touches our servers' },
            { icon: '🔄', title: 'Cancel anytime', desc: 'No lock-in. Cancel from your billing portal in one click' },
            { icon: '⚡', title: 'Instant activation', desc: 'Your plan upgrades immediately after payment' },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl p-6"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <p className="font-bold text-sm mb-1">{item.title}</p>
              <p className="text-xs" style={{ color: '#71717a' }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-sm" style={{ color: '#52525b' }}>
            Questions? <Link href="/request" style={{ color: '#ef4444', textDecoration: 'none' }}>Contact us →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Page shell — required so useSearchParams works at build time ──
export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
          <Loader2 size={28} className="animate-spin" style={{ color: '#ef4444' }} />
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
