'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bot, Zap, ArrowRight, Star, Building2, Search,
  CheckCircle2, Lock, ExternalLink,
} from 'lucide-react';
import { agents } from '@/lib/agents';
import { PLANS } from '@/lib/stripe';
import { usePlan } from '@/lib/use-plan';
import { useAuth } from '@/components/AuthProvider';

const PLAN_CONFIG = {
  pro: { label: 'Pro', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', icon: Star },
  business: { label: 'Business', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)', icon: Building2 },
};

export default function MyAgentsPage() {
  const { user } = useAuth();
  const { planId, loading: planLoading } = usePlan(user?.id);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pro' | 'business'>('all');

  const filtered = agents.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || a.plan === filter;
    return matchSearch && matchFilter;
  });

  const canAccess = (agentPlan: 'pro' | 'business') => {
    if (planId === 'business') return true;
    if (planId === 'pro' && agentPlan === 'pro') return true;
    return false;
  };

  const unlockedCount = agents.filter((a) => canAccess(a.plan)).length;

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.25)' }}>
              <Bot size={16} style={{ color: '#ef4444' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>My Agents</span>
          </div>
          <h1 className="text-3xl font-black mb-1">Agent Library</h1>
          <p style={{ color: '#71717a', fontSize: '0.95rem' }}>
            {planLoading ? '…' : `${unlockedCount} of ${agents.length} agents unlocked on your ${PLANS[planId].name} plan`}
          </p>
        </div>
        <Link href="/pricing" className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
          <Zap size={14} /> Upgrade Plan
        </Link>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#52525b' }} />
          <input
            type="text"
            placeholder="Search agents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-full"
            style={{ paddingLeft: '2.25rem', height: '40px', fontSize: '0.875rem' }}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pro', 'business'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 capitalize"
              style={{
                background: filter === f ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.04)',
                border: filter === f ? '1px solid rgba(220,38,38,0.3)' : '1px solid var(--color-border)',
                color: filter === f ? '#ef4444' : '#71717a',
              }}
            >
              {f === 'all' ? 'All' : f === 'pro' ? '⭐ Pro' : '🏢 Business'}
            </button>
          ))}
        </div>
      </div>

      {/* Agent grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((agent) => {
          const accessible = canAccess(agent.plan);
          const plan = PLAN_CONFIG[agent.plan];
          const PlanIcon = plan.icon;

          return (
            <div
              key={agent.id}
              className="rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden transition-all duration-300"
              style={{
                background: 'var(--color-surface)',
                border: `1px solid ${accessible ? 'var(--color-border)' : 'var(--color-border)'}`,
                opacity: accessible ? 1 : 0.6,
              }}
            >
              {/* Lock overlay for locked agents */}
              {!accessible && (
                <div className="absolute top-3 right-3 z-10">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid var(--color-border)' }}>
                    <Lock size={11} style={{ color: '#52525b' }} />
                  </div>
                </div>
              )}
              {accessible && (
                <div className="absolute top-3 right-3 z-10">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                    <CheckCircle2 size={11} style={{ color: '#22c55e' }} />
                  </div>
                </div>
              )}

              {/* Icon + name */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.15)' }}>
                  {agent.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{agent.name}</p>
                  <p className="text-xs truncate" style={{ color: '#52525b' }}>{agent.category}</p>
                </div>
              </div>

              {/* Tagline */}
              <p className="text-xs leading-relaxed" style={{ color: '#71717a' }}>{agent.tagline}</p>

              {/* Plan chip + CTA */}
              <div className="flex items-center justify-between mt-auto">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: plan.bg, border: `1px solid ${plan.border}`, color: plan.color }}>
                  <PlanIcon size={10} />
                  {plan.label}
                </div>
                {accessible ? (
                  <Link
                    href={agent.id === 'website-builder-agent' ? '/website-builder' : `/agents/${agent.id}`}
                    className="flex items-center gap-1 text-xs font-semibold transition-colors"
                    style={{ color: '#ef4444', textDecoration: 'none' }}
                  >
                    Launch <ExternalLink size={11} />
                  </Link>
                ) : (
                  <Link
                    href="/pricing"
                    className="flex items-center gap-1 text-xs font-semibold"
                    style={{ color: '#52525b', textDecoration: 'none' }}
                  >
                    Upgrade <ArrowRight size={11} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16" style={{ color: '#52525b' }}>
          <Bot size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No agents found for &quot;{search}&quot;</p>
        </div>
      )}
    </div>
  );
}
