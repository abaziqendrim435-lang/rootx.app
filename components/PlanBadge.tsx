'use client';

import Link from 'next/link';
import { Zap, Star, Building2, ArrowRight } from 'lucide-react';
import { type PlanId, PLANS } from '@/lib/stripe';

interface PlanBadgeProps {
  planId: PlanId;
  showUpgrade?: boolean;
  size?: 'sm' | 'md';
}

const PLAN_CONFIG: Record<PlanId, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  free:     { color: '#71717a', bg: 'rgba(113,113,122,0.1)',  border: 'rgba(113,113,122,0.2)', icon: <Zap size={12} /> },
  pro:      { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)', icon: <Star size={12} /> },
  business: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.25)', icon: <Building2 size={12} /> },
};

export default function PlanBadge({ planId, showUpgrade = true, size = 'md' }: PlanBadgeProps) {
  const { color, bg, border, icon } = PLAN_CONFIG[planId];
  const plan = PLANS[planId];
  const padding = size === 'sm' ? '0.2rem 0.6rem' : '0.3rem 0.75rem';
  const fontSize = size === 'sm' ? '0.7rem' : '0.75rem';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div
        className="inline-flex items-center gap-1.5 rounded-full font-bold"
        style={{ background: bg, border: `1px solid ${border}`, color, padding, fontSize }}
      >
        {icon}
        {plan.name}
      </div>
      {showUpgrade && planId !== 'business' && (
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1 rounded-full font-bold transition-all duration-200"
          style={{
            padding,
            fontSize,
            background: 'rgba(220,38,38,0.1)',
            border: '1px solid rgba(220,38,38,0.25)',
            color: '#ef4444',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.2)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.1)'; }}
        >
          <ArrowRight size={10} />
          Upgrade
        </Link>
      )}
    </div>
  );
}
