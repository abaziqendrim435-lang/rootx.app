'use client';

import { useState } from 'react';
import {
  BarChart3, Zap, TrendingUp, Calendar, Bot,
  PenTool, ShoppingCart, ArrowUpRight,
} from 'lucide-react';
import { usePlan } from '@/lib/use-plan';
import { useAuth } from '@/components/AuthProvider';
import { PLANS } from '@/lib/stripe';
import Link from 'next/link';

// Static usage demo data — will come from Supabase in production
const MONTHLY_DATA = [
  { month: 'Jan', gens: 4 },
  { month: 'Feb', gens: 7 },
  { month: 'Mar', gens: 12 },
  { month: 'Apr', gens: 9 },
  { month: 'May', gens: 18 },
  { month: 'Jun', gens: 24 },
];

const AGENT_BREAKDOWN = [
  { name: 'Content Creator', icon: '✍️', count: 14, pct: 58 },
  { name: 'Shopify Agent', icon: '🛒', count: 7, pct: 29 },
  { name: 'Other', icon: '🔬', count: 3, pct: 13 },
];

const PERIOD_OPTIONS = ['This Month', 'Last 30 Days', 'Last 90 Days', 'All Time'] as const;
type Period = typeof PERIOD_OPTIONS[number];

export default function UsagePage() {
  const { user } = useAuth();
  const { planId, plan, loading: planLoading } = usePlan(user?.id);
  const [period, setPeriod] = useState<Period>('This Month');

  const totalThisPeriod = 24;
  const limit = plan.generationsPerMonth;
  const pct = limit === -1 ? 100 : Math.min((totalThisPeriod / limit) * 100, 100);
  const maxBar = Math.max(...MONTHLY_DATA.map((d) => d.gens));

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.25)' }}>
              <BarChart3 size={16} style={{ color: '#ef4444' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>Usage</span>
          </div>
          <h1 className="text-3xl font-black mb-1">Usage Statistics</h1>
          <p style={{ color: '#71717a', fontSize: '0.95rem' }}>
            Track your AI generation activity and quota usage.
          </p>
        </div>

        {/* Period selector */}
        <div className="flex gap-1.5 flex-wrap">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{
                background: period === p ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.04)',
                border: period === p ? '1px solid rgba(220,38,38,0.3)' : '1px solid var(--color-border)',
                color: period === p ? '#ef4444' : '#71717a',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Generations Used', value: '24', sub: 'This month', icon: Zap, color: '#ef4444' },
          { label: 'Remaining', value: limit === -1 ? '∞' : String(limit - totalThisPeriod), sub: 'This month', icon: TrendingUp, color: '#22c55e' },
          { label: 'Active Agents', value: '2', sub: 'In use', icon: Bot, color: '#f59e0b' },
          { label: 'Avg / Day', value: '0.8', sub: 'This month', icon: Calendar, color: '#60a5fa' },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl p-5"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium" style={{ color: '#52525b' }}>{card.label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `${card.color}15` }}>
                <card.icon size={14} style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-2xl font-black mb-0.5">{card.value}</p>
            <p className="text-xs" style={{ color: '#52525b' }}>{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly bar chart */}
        <div className="lg:col-span-2 rounded-2xl p-6"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold">Monthly Generations</h2>
            <span className="text-xs" style={{ color: '#52525b' }}>Last 6 months</span>
          </div>
          <div className="flex items-end gap-3 h-36">
            {MONTHLY_DATA.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-bold" style={{ color: '#52525b' }}>{d.gens}</span>
                <div
                  className="w-full rounded-t-lg transition-all duration-500 relative overflow-hidden"
                  style={{
                    height: `${Math.max((d.gens / maxBar) * 100, 8)}%`,
                    background: 'linear-gradient(180deg, #ef4444 0%, #991b1b 100%)',
                  }}
                >
                  <div className="absolute inset-0 opacity-30"
                    style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)' }} />
                </div>
                <span className="text-xs" style={{ color: '#52525b' }}>{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Agent breakdown */}
        <div className="rounded-2xl p-6"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <h2 className="font-bold mb-5">By Agent</h2>
          <div className="flex flex-col gap-4">
            {AGENT_BREAKDOWN.map((a) => (
              <div key={a.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{a.icon}</span>
                    <span className="text-xs font-medium">{a.name}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: '#ef4444' }}>{a.count}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--color-border)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${a.pct}%`,
                      background: 'linear-gradient(90deg, #dc2626, #ef4444)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quota card */}
      <div className="rounded-2xl p-6"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
          <div>
            <h2 className="font-bold mb-0.5">Monthly Quota</h2>
            <p className="text-xs" style={{ color: '#71717a' }}>
              {planLoading ? '…' : `${PLANS[planId].name} plan · resets on the 1st of each month`}
            </p>
          </div>
          {planId !== 'business' && (
            <Link href="/pricing" className="btn-primary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.8rem' }}>
              <ArrowUpRight size={14} /> Increase Limit
            </Link>
          )}
        </div>
        <div className="flex items-end gap-4 mb-3">
          <span className="text-4xl font-black">{totalThisPeriod}</span>
          <span className="text-lg mb-1" style={{ color: '#52525b' }}>
            / {limit === -1 ? '∞' : limit}
          </span>
          <span className="ml-auto text-sm font-bold" style={{ color: limit === -1 ? '#22c55e' : '#ef4444' }}>
            {limit === -1 ? 'Unlimited' : `${Math.round(pct)}% used`}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: pct > 85
                ? 'linear-gradient(90deg, #dc2626, #ef4444)'
                : 'linear-gradient(90deg, #16a34a, #22c55e)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
