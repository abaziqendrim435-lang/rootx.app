'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Sparkles, ArrowRight,
  Zap, History, ArrowUpRight,
} from 'lucide-react';
import StatsCards from '@/components/dashboard/StatsCards';
import GenerationCard from '@/components/dashboard/GenerationCard';
import PlanBadge from '@/components/PlanBadge';
import {
  getAllGenerations,
  computeStats,
  toggleSaved,
  deleteGeneration,
  type GenerationRecord,
  type DashboardStats,
} from '@/lib/dashboard-storage';
import { hasSupabaseConfig } from '@/lib/supabase-auth';
import { useAuth } from '@/components/AuthProvider';
import { usePlan } from '@/lib/use-plan';

const quickLaunchAgents = [
  {
    id: 'content-creator-agent',
    name: 'Content Creator',
    icon: '✍️',
    desc: 'TikTok captions, ad copy, hashtags & video scripts',
    color: '#ef4444',
    href: '/agents/content-creator-agent',
  },
  {
    id: 'shopify-ai-agent',
    name: 'Shopify Agent',
    icon: '🛒',
    desc: 'Product titles, SEO descriptions, pricing & TikTok ads',
    color: '#22c55e',
    href: '/agents/shopify-ai-agent',
  },
];

const emptyStats: DashboardStats = { totalGenerations: 0, savedItems: 0, agentsUsed: 0, thisWeek: 0 };

export default function DashboardPage() {
  const { user } = useAuth();
  const { planId, plan, loading: planLoading } = usePlan(user?.id);
  const [records, setRecords] = useState<GenerationRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getAllGenerations();
    setRecords(data);
    setStats(computeStats(data));
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleToggleSave(id: string) {
    await toggleSaved(id);
    await refresh();
  }

  async function handleDelete(id: string) {
    await deleteGeneration(id);
    await refresh();
  }

  const recentRecords = records.slice(0, 5);
  const isSupabaseActive = hasSupabaseConfig && !!user;
  const isFreePlan = planId === 'free';

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.25)' }}
            >
              <Sparkles size={16} style={{ color: '#ef4444' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>
              Dashboard
            </span>
          </div>
          <h1 className="text-3xl font-black mb-1">
            Welcome back{user?.user_metadata?.display_name ? `, ${user.user_metadata.display_name}` : user?.email ? `, ${user.email.split('@')[0]}` : ''}
          </h1>
          <p style={{ color: '#71717a', fontSize: '0.95rem' }}>
            Your AI generation hub — history, saved outputs, and quick access to all agents.
          </p>
        </div>

        {/* Plan badge */}
        {!planLoading && (
          <PlanBadge planId={planId} />
        )}
      </div>

      {/* ── Free plan upgrade banner ─────────────────────────── */}
      {isFreePlan && !planLoading && (
        <div
          className="rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap"
          style={{
            background: 'linear-gradient(135deg, rgba(220,38,38,0.08) 0%, rgba(0,0,0,0) 70%)',
            border: '1px solid rgba(220,38,38,0.2)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)' }}
            >
              <Zap size={17} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <p className="font-bold text-sm">You're on the Free plan</p>
              <p className="text-xs" style={{ color: '#71717a' }}>
                {plan.generationsPerMonth} generations/month · Upgrade for more power
              </p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="btn-primary flex-shrink-0"
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
          >
            <ArrowUpRight size={15} /> Upgrade Plan
          </Link>
        </div>
      )}

      {/* ── Stats cards ─────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 animate-pulse"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', height: '90px' }}
            />
          ))}
        </div>
      ) : (
        <StatsCards stats={stats} />
      )}

      {/* ── Quick launch ────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Quick Launch</h2>
          <Link
            href="/agents"
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: '#52525b', textDecoration: 'none' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#52525b')}
          >
            Browse all agents <ArrowRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickLaunchAgents.map((agent) => (
            <Link
              key={agent.id}
              href={agent.href}
              className="rounded-2xl p-5 flex items-start gap-4 transition-all duration-300 group"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', textDecoration: 'none' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${agent.color}44`;
                (e.currentTarget as HTMLElement).style.background = `${agent.color}06`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                (e.currentTarget as HTMLElement).style.background = 'var(--color-surface)';
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}25` }}
              >
                {agent.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm">{agent.name}</p>
                  <ArrowRight size={15} style={{ color: '#52525b', flexShrink: 0 }} />
                </div>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: '#52525b' }}>{agent.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Recent generations ───────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <History size={18} style={{ color: '#71717a' }} />
            Recent Generations
          </h2>
          {records.length > 0 && (
            <Link
              href="/dashboard/history"
              className="flex items-center gap-1.5 text-xs font-medium transition-colors"
              style={{ color: '#52525b', textDecoration: 'none' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#52525b')}
            >
              View all ({records.length}) <ArrowRight size={13} />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 animate-pulse"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', height: '72px' }}
              />
            ))}
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={<Zap size={28} style={{ color: '#ef4444' }} />}
            title="No generations yet"
            description="Use an AI agent to generate content — your history will appear here automatically."
            action={
              <Link href="/agents/content-creator-agent" className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}>
                <Zap size={15} /> Try Content Creator
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {recentRecords.map((record) => (
              <GenerationCard
                key={record.id}
                record={record}
                onToggleSave={handleToggleSave}
                onDelete={handleDelete}
              />
            ))}
            {records.length > 5 && (
              <Link
                href="/dashboard/history"
                className="btn-secondary text-center text-sm"
                style={{ padding: '0.6rem 1.5rem' }}
              >
                View all {records.length} generations →
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({
  icon, title, description, action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-12 text-center flex flex-col items-center gap-4"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}
      >
        {icon}
      </div>
      <div>
        <p className="font-bold text-lg mb-1">{title}</p>
        <p className="text-sm" style={{ color: '#71717a', maxWidth: '340px' }}>{description}</p>
      </div>
      {action}
    </div>
  );
}
