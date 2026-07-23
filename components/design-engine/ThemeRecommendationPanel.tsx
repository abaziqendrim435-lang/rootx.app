'use client';

import React from 'react';
import type { DesignArchetypeId } from '@/lib/website-builder-types';
import type { ThemeRecommendation } from '@/lib/design-engine/category-detector';
import { Sparkles, Check, ArrowRight } from 'lucide-react';

interface Props {
  recommendations: ThemeRecommendation[];
  selectedArchetype: DesignArchetypeId;
  onSelectTheme: (themeId: DesignArchetypeId) => void;
}

export default function ThemeRecommendationPanel({
  recommendations,
  selectedArchetype,
  onSelectTheme,
}: Props) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="space-y-4 mb-6 bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Recommended Theme Options</h3>
            <p className="text-xs text-zinc-400">
              AI Category Matcher analyzed your product and generated 3 tailored theme options.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.slice(0, 3).map((rec, idx) => {
          const isSelected = selectedArchetype === rec.id;

          return (
            <div
              key={rec.id}
              onClick={() => onSelectTheme(rec.id)}
              className={`relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-950/30 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500'
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center gap-1">
                  <Check size={10} /> Active Theme
                </div>
              )}

              <div>
                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                  Option 0{idx + 1} {idx === 0 ? '• Best Fit' : ''}
                </span>
                <h4 className="font-bold text-base text-white mt-1">{rec.name}</h4>
                <p className="text-xs text-zinc-400 mt-1 mb-3 line-clamp-2">{rec.tagline}</p>

                {/* Color Swatches */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full border border-zinc-700" style={{ background: rec.colors.primary }} />
                    <span className="w-4 h-4 rounded-full border border-zinc-700" style={{ background: rec.colors.secondary }} />
                    <span className="w-4 h-4 rounded-full border border-zinc-700" style={{ background: rec.colors.background }} />
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {rec.fonts.heading} / {rec.fonts.body}
                  </span>
                </div>

                {/* Hero Variant */}
                <div className="text-[11px] bg-zinc-950 px-2.5 py-1 rounded text-zinc-300 font-mono mb-3 border border-zinc-800">
                  Hero: {rec.heroType}
                </div>

                {/* Section Sequence Plan */}
                <div className="space-y-1 mb-3">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Section Sequence:</span>
                  <div className="flex flex-wrap gap-1">
                    {rec.sectionPlanSummary.slice(0, 5).map((sec, i) => (
                      <span key={i} className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={`w-full py-2 px-3 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1 mt-2 ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                }`}
              >
                {isSelected ? 'Currently Selected' : 'Apply Theme'} <ArrowRight size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
