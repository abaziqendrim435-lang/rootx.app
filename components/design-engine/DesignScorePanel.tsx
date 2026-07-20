'use client';

import React from 'react';
import type { DesignScore } from '@/lib/website-builder-types';
import { CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';

interface Props {
  score: DesignScore;
  onRegenerate?: () => void;
}

export default function DesignScorePanel({ score, onRegenerate }: Props) {
  const dimensions = [
    { label: 'Visual Hierarchy', score: score.visualHierarchy },
    { label: 'Brand Consistency', score: score.brandConsistency },
    { label: 'Mobile Responsiveness', score: score.mobileResponsiveness },
    { label: 'Typography', score: score.typography },
    { label: 'Spacing & Rhythm', score: score.spacing },
    { label: 'Image Diversity', score: score.imageDiversity },
    { label: 'Conversion Clarity', score: score.conversionClarity },
    { label: 'Accessibility', score: score.accessibility },
    { label: 'Content Quality', score: score.contentQuality },
    { label: 'Shopify OS 2.0 Compat', score: score.shopifyCompatibility },
  ];

  const getScoreColor = (val: number) => {
    if (val >= 9) return '#10b981';
    if (val >= 7.5) return '#3b82f6';
    if (val >= 6) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div
      className="p-6 rounded-2xl border mb-6"
      style={{
        background: 'var(--color-surface, #18181b)',
        borderColor: score.passed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
      }}
    >
      {/* Header Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black"
            style={{
              background: score.passed
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.4))'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.4))',
              color: score.passed ? '#34d399' : '#f87171',
              border: `1px solid ${score.passed ? '#059669' : '#dc2626'}`,
            }}
          >
            {score.total}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-white">Design Quality Score</h3>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1"
                style={{
                  background: score.passed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: score.passed ? '#34d399' : '#f87171',
                  border: `1px solid ${score.passed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                }}
              >
                {score.passed ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                {score.passed ? 'PASSED (≥85)' : 'NEEDS OPTIMIZATION (<85)'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Automated 10-point audit evaluating typography, spacing, conversion, and Shopify standards.
            </p>
          </div>
        </div>

        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff',
            }}
          >
            <Sparkles size={14} />
            Regenerate & Re-Score
          </button>
        )}
      </div>

      {/* 10 Dimension Bars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mb-6">
        {dimensions.map((d, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-300">{d.label}</span>
              <span style={{ color: getScoreColor(d.score) }}>
                {d.score.toFixed(1)} / 10
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(d.score / 10) * 100}%`,
                  background: getScoreColor(d.score),
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Flagged Issues Section */}
      {score.issues && score.issues.length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
            <AlertCircle size={14} className="text-amber-400" />
            Flagged Quality Rule Audit ({score.issues.length})
          </h4>
          <div className="space-y-2">
            {score.issues.map((iss, i) => (
              <div
                key={i}
                className="p-3 rounded-xl text-xs space-y-1"
                style={{
                  background: iss.severity === 'error' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  border: `1px solid ${iss.severity === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                }}
              >
                <div className="flex items-center gap-2 font-medium text-white">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: iss.severity === 'error' ? '#ef4444' : '#f59e0b' }}
                  />
                  {iss.message}
                </div>
                <div className="text-zinc-400 pl-4">{iss.recommendation}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
