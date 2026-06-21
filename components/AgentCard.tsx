'use client';

import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';
import { Agent } from '@/lib/types';

interface AgentCardProps {
  agent: Agent;
  variant?: 'default' | 'compact';
  onRequestSetup?: (agentId: string) => void;
}

const pricingTierColor = (price: number) => {
  if (price <= 197) return '#22c55e';
  if (price <= 297) return '#ef4444';
  if (price <= 397) return '#f97316';
  return '#a855f7';
};

export default function AgentCard({ agent, variant = 'default', onRequestSetup }: AgentCardProps) {
  const isOneTime = agent.priceLabel.includes('one-time');

  return (
    <div
      className="glass-card rounded-2xl flex flex-col group relative overflow-hidden"
      style={{
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'rgba(220,38,38,0.45)';
        el.style.transform = 'translateY(-5px)';
        el.style.boxShadow = '0 24px 48px rgba(0,0,0,0.4), 0 0 24px rgba(220,38,38,0.12)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'var(--color-border)';
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = 'none';
      }}
    >
      {/* Hover glow overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top left, rgba(220,38,38,0.07) 0%, transparent 65%)',
          transition: 'opacity 0.4s ease',
          zIndex: 0,
        }}
      />

      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100"
        style={{
          background: 'linear-gradient(90deg, transparent, #ef4444, transparent)',
          transition: 'opacity 0.3s ease',
          zIndex: 1,
        }}
      />

      <div className="p-6 flex flex-col gap-4 relative z-10 h-full">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div
            className="w-13 h-13 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{
              width: '52px',
              height: '52px',
              background: 'linear-gradient(135deg, rgba(220,38,38,0.2) 0%, rgba(153,27,27,0.1) 100%)',
              border: '1px solid rgba(220,38,38,0.2)',
            }}
          >
            {agent.icon}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {agent.badge && (
              <span
                className="badge badge-red"
                style={{ fontSize: '0.65rem', letterSpacing: '0.06em' }}
              >
                {agent.badge}
              </span>
            )}
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: '#71717a',
                border: '1px solid var(--color-border)',
              }}
            >
              {agent.category}
            </span>
          </div>
        </div>

        {/* Name & tagline */}
        <div>
          <h3
            className="font-bold text-base mb-1.5 leading-snug"
            style={{ color: '#f8f8f8' }}
          >
            {agent.name}
          </h3>
          <p
            className="text-sm leading-relaxed"
            style={{ color: '#71717a', minHeight: '2.8rem' }}
          >
            {agent.tagline}
          </p>
        </div>

        {/* Feature bullets — always exactly 3 lines */}
        {variant === 'default' && (
          <ul className="flex flex-col gap-2">
            {agent.features.slice(0, 3).map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs" style={{ color: '#a1a1aa' }}>
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: '#dc2626' }}
                />
                <span className="leading-relaxed">{f}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Spacer to push footer down */}
        <div className="flex-1" />

        {/* Price + CTAs */}
        <div
          className="pt-4 flex flex-col gap-3"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          {/* Pricing row */}
          <div className="flex items-end justify-between">
            <div>
              <span
                className="font-black text-xl leading-none"
                style={{ color: pricingTierColor(agent.price) }}
              >
                {agent.priceLabel.split('/')[0].split(' ')[0]}
              </span>
              <span className="text-xs ml-1" style={{ color: '#52525b' }}>
                {isOneTime ? 'one-time' : '/mo'}
              </span>
            </div>
            {isOneTime && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: 'rgba(168,85,247,0.12)',
                  color: '#a855f7',
                  border: '1px solid rgba(168,85,247,0.25)',
                }}
              >
                One-time fee
              </span>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/agents/${agent.id}`}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                color: '#a1a1aa',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = 'rgba(220,38,38,0.35)';
                el.style.color = '#f8f8f8';
                el.style.background = 'rgba(220,38,38,0.07)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = 'var(--color-border)';
                el.style.color = '#a1a1aa';
                el.style.background = 'var(--color-surface-2)';
              }}
            >
              <ArrowRight size={13} />
              Learn More
            </Link>

            <Link
              href={`/request?agent=${agent.id}`}
              onClick={onRequestSetup ? (e) => { e.preventDefault(); onRequestSetup(agent.id); } : undefined}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: '#fff',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                el.style.boxShadow = '0 6px 20px rgba(220,38,38,0.4)';
                el.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
                el.style.boxShadow = 'none';
                el.style.transform = 'scale(1)';
              }}
            >
              <Zap size={13} />
              Request Setup
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
