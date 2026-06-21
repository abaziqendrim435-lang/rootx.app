import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, ChevronRight, Zap } from 'lucide-react';
import { agents, getAgentById } from '@/lib/agents';
import type { Metadata } from 'next';
import ContentCreatorDemo from '@/components/ContentCreatorDemo';
import ShopifyAgentDemo from '@/components/ShopifyAgentDemo';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return agents.map((agent) => ({ id: agent.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const agent = getAgentById(id);
  if (!agent) return { title: 'Agent Not Found' };
  return {
    title: `${agent.name} — RootX AI Marketplace`,
    description: agent.description,
  };
}

export default async function AgentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const agent = getAgentById(id);

  if (!agent) {
    notFound();
  }

  const isContentCreator = agent.id === 'content-creator-agent';
  const isShopify = agent.id === 'shopify-ai-agent';
  const hasLiveDemo = isContentCreator || isShopify;

  return (
    <div style={{ paddingTop: '64px' }}>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section
        className="relative py-20"
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {/* Background radial */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at top left, rgba(220,38,38,0.12) 0%, transparent 60%)',
          }}
        />

        {/* Grid pattern for live-demo agents */}
        {hasLiveDemo && (
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(rgba(220,38,38,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.06) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        )}

        <div className="section-container relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8 text-sm" style={{ color: '#52525b' }}>
            <Link
              href="/agents"
              className="flex items-center gap-1.5 transition-colors hover:text-red-400"
              style={{ color: '#52525b', textDecoration: 'none' }}
            >
              <ArrowLeft size={14} />
              All Agents
            </Link>
            <ChevronRight size={12} />
            <span style={{ color: '#a1a1aa' }}>{agent.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 items-start">
            {/* Left: content */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
                  style={{
                    background: 'rgba(220,38,38,0.15)',
                    border: '1px solid rgba(220,38,38,0.25)',
                  }}
                >
                  {agent.icon}
                </div>
                <div>
                  {agent.badge && (
                    <span className="badge badge-red mb-1">{agent.badge}</span>
                  )}
                  <div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        color: '#71717a',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      {agent.category}
                    </span>
                  </div>
                </div>
              </div>

              <h1 className="font-bold text-4xl md:text-5xl mb-4">{agent.name}</h1>
              <p
                className="text-xl leading-relaxed mb-8"
                style={{ color: '#a1a1aa' }}
              >
                {agent.tagline}
              </p>
              <p className="leading-relaxed" style={{ color: '#71717a', maxWidth: '600px' }}>
                {agent.description}
              </p>

              {/* Live demo badge */}
              {hasLiveDemo && (
                <div
                  className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full text-sm font-semibold"
                  style={{
                    background: 'rgba(220,38,38,0.1)',
                    border: '1px solid rgba(220,38,38,0.25)',
                    color: '#ef4444',
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: '#ef4444' }}
                  />
                  Live AI Demo available below ↓
                </div>
              )}
            </div>

            {/* Right: pricing card */}
            <div
              className="w-full lg:w-80 rounded-2xl p-8 flex-shrink-0"
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                position: 'sticky',
                top: '88px',
              }}
            >
              <div className="mb-6">
                <p className="text-sm mb-1" style={{ color: '#71717a' }}>Starting at</p>
                <div className="text-4xl font-bold" style={{ color: '#ef4444' }}>
                  {agent.priceLabel}
                </div>
                <p className="text-xs mt-2" style={{ color: '#52525b' }}>
                  Includes setup, training & 30-day support
                </p>
              </div>

              <Link
                href={`/request?agent=${agent.id}`}
                className="btn-primary w-full mb-4 animate-pulse-glow"
                style={{ justifyContent: 'center' }}
              >
                <Zap size={16} />
                Buy / Request Setup
              </Link>
              <Link
                href="/request"
                className="btn-secondary w-full"
                style={{ justifyContent: 'center' }}
              >
                Ask a Question
              </Link>

              <div
                className="mt-6 pt-6 flex flex-col gap-2"
                style={{ borderTop: '1px solid var(--color-border)' }}
              >
                {['48-hour setup', 'Dedicated onboarding', '30-day guarantee', 'Cancel anytime'].map((perk) => (
                  <div key={perk} className="flex items-center gap-2 text-xs" style={{ color: '#71717a' }}>
                    <Check size={13} style={{ color: '#22c55e', flexShrink: 0 }} />
                    {perk}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Live AI Demo ─────────────────────────────────────── */}
      {isContentCreator && <ContentCreatorDemo />}
      {isShopify && <ShopifyAgentDemo />}

      {/* ── Features + Use Cases ──────────────────────────────── */}
      <section className="py-16">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Features */}
            <div>
              <h2 className="text-2xl font-bold mb-8">What&apos;s included</h2>
              <div className="flex flex-col gap-4">
                {agent.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-start gap-3 p-4 rounded-xl"
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(220,38,38,0.15)' }}
                    >
                      <Check size={13} style={{ color: '#ef4444' }} />
                    </div>
                    <span className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Use Cases */}
            <div>
              <h2 className="text-2xl font-bold mb-8">Perfect for</h2>
              <div className="flex flex-col gap-4 mb-10">
                {agent.useCases.map((uc, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 rounded-xl"
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <span
                      className="text-sm font-bold flex-shrink-0 mt-0.5"
                      style={{ color: '#ef4444' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>
                      {uc}
                    </span>
                  </div>
                ))}
              </div>

              {/* Final CTA */}
              <div
                className="rounded-2xl p-8 text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(220,38,38,0.1) 0%, rgba(0,0,0,0) 100%)',
                  border: '1px solid rgba(220,38,38,0.2)',
                }}
              >
                <p className="font-semibold text-lg mb-2">Ready to get started?</p>
                <p className="text-sm mb-6" style={{ color: '#71717a' }}>
                  Submit your setup request and our team will reach out within 24 hours.
                </p>
                <Link href={`/request?agent=${agent.id}`} className="btn-primary">
                  <Zap size={16} />
                  Request Setup Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Back nav ─────────────────────────────────────────── */}
      <section
        className="py-12"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <div className="section-container flex items-center justify-between">
          <Link href="/agents" className="btn-secondary">
            ← Back to Marketplace
          </Link>
          <Link href="/request" className="btn-primary">
            Request Any Agent →
          </Link>
        </div>
      </section>
    </div>
  );
}
