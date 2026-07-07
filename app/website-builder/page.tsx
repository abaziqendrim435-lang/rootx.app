'use client';

import Link from 'next/link';
import { ArrowLeft, Globe } from 'lucide-react';
import WebsiteBuilderDemo from '@/components/WebsiteBuilderDemo';

export default function WebsiteBuilderPage() {
  return (
    <div style={{ paddingTop: '64px' }}>
      {/* ── Compact Header ──────────────────────────────────── */}
      <section
        className="py-8"
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
              'radial-gradient(ellipse at top left, rgba(220,38,38,0.08) 0%, transparent 60%)',
          }}
        />

        <div className="section-container relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-4 text-sm" style={{ color: '#52525b' }}>
            <Link
              href="/agents"
              className="flex items-center gap-1.5 transition-colors hover:text-red-400"
              style={{ color: '#52525b', textDecoration: 'none' }}
            >
              <ArrowLeft size={14} />
              All Agents
            </Link>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{
                background: 'rgba(220,38,38,0.15)',
                border: '1px solid rgba(220,38,38,0.25)',
              }}
            >
              <Globe size={24} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <h1 className="font-bold text-2xl md:text-3xl">
                AI Website Builder
              </h1>
              <p className="text-sm" style={{ color: '#71717a' }}>
                Generate complete, modern websites for any business using AI
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Live AI Demo ────────────────────────────────────── */}
      <WebsiteBuilderDemo />
    </div>
  );
}
