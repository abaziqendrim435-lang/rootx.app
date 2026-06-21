'use client';

import { Sparkles, Bookmark, Bot, TrendingUp } from 'lucide-react';
import type { DashboardStats } from '@/lib/dashboard-storage';

const statConfig = [
  {
    key: 'totalGenerations' as const,
    label: 'Total Generations',
    icon: Sparkles,
    color: '#ef4444',
    bgColor: 'rgba(220,38,38,0.1)',
    borderColor: 'rgba(220,38,38,0.2)',
    suffix: '',
  },
  {
    key: 'savedItems' as const,
    label: 'Saved Items',
    icon: Bookmark,
    color: '#eab308',
    bgColor: 'rgba(234,179,8,0.1)',
    borderColor: 'rgba(234,179,8,0.2)',
    suffix: '',
  },
  {
    key: 'agentsUsed' as const,
    label: 'Agents Used',
    icon: Bot,
    color: '#a855f7',
    bgColor: 'rgba(168,85,247,0.1)',
    borderColor: 'rgba(168,85,247,0.2)',
    suffix: '',
  },
  {
    key: 'thisWeek' as const,
    label: 'This Week',
    icon: TrendingUp,
    color: '#22c55e',
    bgColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.2)',
    suffix: '',
  },
];

export default function StatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statConfig.map((cfg) => {
        const Icon = cfg.icon;
        const value = stats[cfg.key];
        return (
          <div
            key={cfg.key}
            className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.borderColor = cfg.borderColor)
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)')
            }
          >
            <div className="flex items-center justify-between">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: cfg.bgColor, border: `1px solid ${cfg.borderColor}` }}
              >
                <Icon size={17} style={{ color: cfg.color }} />
              </div>
              {value > 0 && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: cfg.bgColor, color: cfg.color }}
                >
                  ↑ active
                </span>
              )}
            </div>
            <div>
              <p className="text-3xl font-black" style={{ color: cfg.color, lineHeight: 1 }}>
                {value}
                {cfg.suffix}
              </p>
              <p className="text-xs mt-1.5 font-medium" style={{ color: '#52525b' }}>
                {cfg.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
