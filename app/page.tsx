import Link from 'next/link';
import { ArrowRight, Zap, Shield, BarChart3, Bot, CheckCircle, Star } from 'lucide-react';
import { agents } from '@/lib/agents';
import AgentCard from '@/components/AgentCard';

const stats = [
  { value: '10+', label: 'AI Agents Ready' },
  { value: '500+', label: 'Businesses Automated' },
  { value: '24/7', label: 'Always Running' },
  { value: '48h', label: 'Setup Time' },
];

const features = [
  {
    icon: Bot,
    title: 'Ready-Made Agents',
    desc: 'Purpose-built AI agents for every business function — deployed in hours, not months.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    desc: 'Your data stays yours. We use bank-level encryption and never train models on your data.',
  },
  {
    icon: BarChart3,
    title: 'Measurable Results',
    desc: 'Every agent comes with built-in analytics so you see exactly what ROI you\'re getting.',
  },
];

const testimonials = [
  {
    quote: 'The Sales Lead Agent tripled our qualified pipeline in 60 days. It\'s like having a senior SDR who never sleeps.',
    author: 'Sarah K.',
    role: 'CEO, GrowthLab',
    rating: 5,
  },
  {
    quote: 'We replaced 3 contractors with the Content Creator Agent. Same output, 90% less cost.',
    author: 'Marcus D.',
    role: 'Marketing Director, Nexus Media',
    rating: 5,
  },
  {
    quote: 'Customer support response time went from 8 hours to 3 minutes. Our reviews have never been better.',
    author: 'Priya R.',
    role: 'Founder, ShopNative',
    rating: 5,
  },
];

export default function HomePage() {
  const featuredAgents = agents.slice(0, 3);

  return (
    <div className="noise-overlay" style={{ paddingTop: '64px' }}>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section
        className="hero-grid relative min-h-screen flex items-center"
        style={{ paddingTop: '80px', paddingBottom: '80px' }}
      >
        {/* Red radial glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '500px',
            background: 'radial-gradient(ellipse, rgba(220,38,38,0.18) 0%, transparent 70%)',
          }}
        />

        <div className="section-container relative z-10 text-center">
          {/* Pill badge */}
          <div className="flex justify-center mb-8">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{
                background: 'rgba(220,38,38,0.1)',
                border: '1px solid rgba(220,38,38,0.25)',
                color: '#ef4444',
              }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
              10 AI Agents Now Live
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Headline */}
          <h1
            className="font-bold leading-[1.1] mb-6"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
          >
            Automate Your Business
            <br />
            <span className="gradient-text">With AI Agents</span>
          </h1>

          <p
            className="mx-auto mb-10 text-lg leading-relaxed"
            style={{ maxWidth: '600px', color: '#a1a1aa' }}
          >
            Browse our marketplace of ready-made AI agents — built for real business workflows.
            Deploy in 48 hours. Save thousands in operational costs.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/agents" className="btn-primary" style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}>
              Browse Agents
              <ArrowRight size={18} />
            </Link>
            <Link href="/request" className="btn-secondary" style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}>
              Request Custom Setup
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-5 text-center"
                style={{
                  background: 'rgba(15,15,18,0.7)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div className="text-3xl font-bold mb-1" style={{ color: '#ef4444' }}>
                  {stat.value}
                </div>
                <div className="text-xs" style={{ color: '#71717a' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="py-24" style={{ background: 'var(--color-surface)' }}>
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why businesses choose <span className="gradient-text">RootX</span>
            </h2>
            <p style={{ color: '#71717a' }}>
              We don't sell software. We sell outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-2xl p-8 group hover:border-red-600/40 transition-all duration-300"
                  style={{
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: 'rgba(220,38,38,0.12)',
                      border: '1px solid rgba(220,38,38,0.2)',
                    }}
                  >
                    <Icon size={22} style={{ color: '#ef4444' }} />
                  </div>
                  <h3 className="font-semibold text-lg mb-3">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#71717a' }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Featured Agents ───────────────────────────────────── */}
      <section className="py-24">
        <div className="section-container">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                Featured <span className="gradient-text">Agents</span>
              </h2>
              <p style={{ color: '#71717a' }}>Hand-picked for maximum business impact</p>
            </div>
            <Link href="/agents" className="btn-secondary" style={{ flexShrink: 0 }}>
              View All 10 Agents →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section className="py-24" style={{ background: 'var(--color-surface)' }}>
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Up and running in <span className="gradient-text">3 steps</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop) */}
            <div
              className="hidden md:block absolute top-8 left-1/4 right-1/4"
              style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.4), transparent)' }}
            />
            {[
              { step: '01', title: 'Browse the Marketplace', desc: 'Explore 10 ready-made AI agents. Filter by category and read detailed use cases.' },
              { step: '02', title: 'Submit Your Request', desc: 'Fill out a quick form. Tell us your business, goal, and the agent you want.' },
              { step: '03', title: 'We Deploy & Train', desc: 'Our team configures the agent for your exact workflow. You\'re live in 48 hours.' },
            ].map((item) => (
              <div key={item.step} className="text-center px-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 font-bold text-xl"
                  style={{
                    background: 'rgba(220,38,38,0.12)',
                    border: '1px solid rgba(220,38,38,0.25)',
                    color: '#ef4444',
                  }}
                >
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-3">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#71717a' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────── */}
      <section className="py-24">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by <span className="gradient-text">growth-focused</span> businesses
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.author}
                className="rounded-2xl p-8 flex flex-col gap-4"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={14} fill="#ef4444" style={{ color: '#ef4444' }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed italic" style={{ color: '#a1a1aa' }}>
                  "{t.quote}"
                </p>
                <div className="mt-auto">
                  <p className="font-semibold text-sm">{t.author}</p>
                  <p className="text-xs" style={{ color: '#71717a' }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────── */}
      <section className="py-24" style={{ background: 'var(--color-surface)' }}>
        <div className="section-container">
          <div
            className="rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(220,38,38,0.15) 0%, rgba(0,0,0,0) 60%)',
              border: '1px solid rgba(220,38,38,0.2)',
            }}
          >
            {/* Decorative glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.1) 0%, transparent 65%)',
              }}
            />
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <CheckCircle size={40} style={{ color: '#ef4444' }} />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Ready to automate?
              </h2>
              <p className="text-lg mb-10 mx-auto" style={{ color: '#a1a1aa', maxWidth: '480px' }}>
                Pick your agent, submit your request, and let AI handle the heavy lifting — starting today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/agents" className="btn-primary" style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}>
                  Browse Agents
                  <ArrowRight size={18} />
                </Link>
                <Link href="/request" className="btn-secondary" style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}>
                  Request Setup Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
