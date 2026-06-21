'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Send, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { agents } from '@/lib/agents';
import { submitRequest } from '@/lib/supabase';

const businessTypes = [
  'E-Commerce / Retail',
  'SaaS / Software',
  'Agency / Consulting',
  'Local Service Business',
  'Healthcare / Medical',
  'Finance / Accounting',
  'Real Estate',
  'Education / Coaching',
  'Media / Content',
  'Other',
];

interface FormData {
  name: string;
  email: string;
  business_type: string;
  selected_agent: string;
  message: string;
}

function RequestFormInner() {
  const searchParams = useSearchParams();
  const preselectedAgent = searchParams.get('agent') ?? '';

  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    business_type: '',
    selected_agent: preselectedAgent,
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Update agent if URL changes
  useEffect(() => {
    if (preselectedAgent) {
      setForm((prev) => ({ ...prev, selected_agent: preselectedAgent }));
    }
  }, [preselectedAgent]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    // Always save to localStorage first (works without Supabase)
    try {
      const existing = JSON.parse(localStorage.getItem('rootx_requests') || '[]');
      const agent = agents.find(a => a.id === form.selected_agent);
      existing.unshift({
        ...form,
        agent_name: agent?.name ?? form.selected_agent,
        id: crypto.randomUUID(),
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      localStorage.setItem('rootx_requests', JSON.stringify(existing));
    } catch { /* localStorage unavailable */ }

    const result = await submitRequest(form);

    if (result.success) {
      setStatus('success');
    } else {
      setStatus('error');
      setErrorMessage(result.error ?? 'Something went wrong. Please try again.');
    }
  };


  const selectedAgentData = agents.find((a) => a.id === form.selected_agent);

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ paddingTop: '64px' }}>
        <div className="text-center max-w-md mx-auto px-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-glow"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            <CheckCircle2 size={36} style={{ color: '#22c55e' }} />
          </div>
          <h1 className="text-3xl font-bold mb-4">Request Received! 🎉</h1>
          <p className="leading-relaxed mb-8" style={{ color: '#71717a' }}>
            Our team will review your request and reach out within{' '}
            <strong style={{ color: '#f8f8f8' }}>24 hours</strong> to begin your setup.
            Check your inbox for a confirmation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/agents" className="btn-secondary">
              Browse More Agents
            </Link>
            <Link href="/" className="btn-primary">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '64px' }}>
      {/* Page header */}
      <section
        className="py-16 relative"
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at top center, rgba(220,38,38,0.08) 0%, transparent 60%)',
          }}
        />
        <div className="section-container relative z-10">
          <Link
            href="/agents"
            className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
            style={{ color: '#52525b', textDecoration: 'none' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#52525b')}
          >
            <ArrowLeft size={14} />
            Back to Agents
          </Link>
          <h1 className="font-bold text-4xl md:text-5xl mb-4">
            Request <span className="gradient-text">Agent Setup</span>
          </h1>
          <p style={{ color: '#71717a' }}>
            Fill out the form below and we'll configure your AI agent in 48 hours.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Form */}
            <div className="lg:col-span-2">
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl p-8 flex flex-col gap-6"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {/* Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium mb-2"
                      style={{ color: '#a1a1aa' }}
                    >
                      Full Name *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="John Smith"
                      value={form.name}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium mb-2"
                      style={{ color: '#a1a1aa' }}
                    >
                      Email Address *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="john@company.com"
                      value={form.email}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Business type */}
                <div>
                  <label
                    htmlFor="business_type"
                    className="block text-sm font-medium mb-2"
                    style={{ color: '#a1a1aa' }}
                  >
                    Business Type *
                  </label>
                  <select
                    id="business_type"
                    name="business_type"
                    required
                    value={form.business_type}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="" disabled style={{ background: '#0f0f12' }}>
                      Select your business type
                    </option>
                    {businessTypes.map((bt) => (
                      <option key={bt} value={bt} style={{ background: '#0f0f12' }}>
                        {bt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Agent selector */}
                <div>
                  <label
                    htmlFor="selected_agent"
                    className="block text-sm font-medium mb-2"
                    style={{ color: '#a1a1aa' }}
                  >
                    Which Agent? *
                  </label>
                  <select
                    id="selected_agent"
                    name="selected_agent"
                    required
                    value={form.selected_agent}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="" disabled style={{ background: '#0f0f12' }}>
                      Select an agent
                    </option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id} style={{ background: '#0f0f12' }}>
                        {agent.icon} {agent.name} — {agent.priceLabel}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium mb-2"
                    style={{ color: '#a1a1aa' }}
                  >
                    Tell us about your goals
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    placeholder="Describe your business, what you want to automate, and any specific requirements..."
                    value={form.message}
                    onChange={handleChange}
                    className="input-field"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Error */}
                {status === 'error' && (
                  <div
                    className="p-4 rounded-xl text-sm"
                    style={{
                      background: 'rgba(220,38,38,0.1)',
                      border: '1px solid rgba(220,38,38,0.3)',
                      color: '#ef4444',
                    }}
                  >
                    ⚠️ {errorMessage}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    opacity: status === 'loading' ? 0.7 : 1,
                    cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    padding: '0.875rem',
                  }}
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Request
                    </>
                  )}
                </button>

                <p className="text-xs text-center" style={{ color: '#52525b' }}>
                  By submitting, you agree to our Terms of Service. No credit card required.
                </p>
              </form>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-6">
              {/* Selected agent preview */}
              {selectedAgentData && (
                <div
                  className="rounded-2xl p-6"
                  style={{
                    background: 'rgba(220,38,38,0.06)',
                    border: '1px solid rgba(220,38,38,0.2)',
                  }}
                >
                  <p className="text-xs font-medium mb-3 uppercase tracking-widest" style={{ color: '#ef4444' }}>
                    Selected Agent
                  </p>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{selectedAgentData.icon}</span>
                    <div>
                      <p className="font-semibold">{selectedAgentData.name}</p>
                      <p className="text-sm font-bold" style={{ color: '#ef4444' }}>
                        {selectedAgentData.priceLabel}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: '#71717a' }}>
                    {selectedAgentData.tagline}
                  </p>
                </div>
              )}

              {/* What happens next */}
              <div
                className="rounded-2xl p-6"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <p className="font-semibold mb-4">What happens next?</p>
                <div className="flex flex-col gap-4">
                  {[
                    { step: '1', label: 'We review your request within 24 hours' },
                    { step: '2', label: 'We send you a tailored proposal & timeline' },
                    { step: '3', label: 'Setup begins — live in 48 hours' },
                    { step: '4', label: '30-day support & optimization included' },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                        style={{ background: 'rgba(220,38,38,0.15)', color: '#ef4444' }}
                      >
                        {item.step}
                      </span>
                      <p className="text-sm leading-relaxed" style={{ color: '#71717a' }}>
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust badges */}
              <div
                className="rounded-2xl p-6"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {['🔒 Secure & confidential', '⚡ 48-hour setup guarantee', '💰 30-day money-back', '🌍 Works for any industry'].map((trust) => (
                  <div key={trust} className="text-sm py-2 flex items-center gap-2" style={{ color: '#71717a', borderBottom: '1px solid var(--color-border)' }}>
                    {trust}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function RequestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ paddingTop: '64px' }}>
        <Loader2 size={36} className="animate-spin" style={{ color: '#ef4444' }} />
      </div>
    }>
      <RequestFormInner />
    </Suspense>
  );
}
