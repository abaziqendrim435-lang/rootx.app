'use client';

import React from 'react';
import type { DesignArchetypeId } from '@/lib/website-builder-types';
import { ARCHETYPES } from '@/lib/design-engine/archetypes';
import { Check } from 'lucide-react';

interface Props {
  selectedArchetype: DesignArchetypeId;
  onSelectArchetype: (archetypeId: DesignArchetypeId) => void;
}

export default function ArchetypeSelector({ selectedArchetype, onSelectArchetype }: Props) {
  const archetypeList = Object.values(ARCHETYPES);

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Design Archetype Selection</h3>
          <p className="text-xs text-zinc-400">
            Select a structured, deterministic archetype tailored for your product category.
          </p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 font-medium">
          8 Archetypes Available
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {archetypeList.map((arch) => {
          const isSelected = selectedArchetype === arch.id;

          return (
            <button
              key={arch.id}
              onClick={() => onSelectArchetype(arch.id)}
              className="relative p-4 rounded-xl text-left border transition-all hover:scale-[1.02] focus:outline-none"
              style={{
                background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-surface, #18181b)',
                borderColor: isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)',
                boxShadow: isSelected ? '0 0 15px rgba(59, 130, 246, 0.2)' : 'none',
              }}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                  <Check size={12} />
                </div>
              )}

              <h4 className="font-bold text-sm text-white mb-1 pr-6">{arch.name}</h4>
              <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{arch.tagline}</p>

              {/* Color Swatch Preview */}
              <div className="flex items-center gap-1.5 mb-2">
                <span
                  className="w-4 h-4 rounded-full border border-black/20"
                  style={{ background: arch.colorBehavior.primary }}
                  title="Primary Color"
                />
                <span
                  className="w-4 h-4 rounded-full border border-black/20"
                  style={{ background: arch.colorBehavior.secondary }}
                  title="Secondary Color"
                />
                <span
                  className="w-4 h-4 rounded-full border border-black/20"
                  style={{ background: arch.colorBehavior.accent }}
                  title="Accent Color"
                />
                <span
                  className="w-4 h-4 rounded-full border border-black/20"
                  style={{ background: arch.colorBehavior.background }}
                  title="Background"
                />
              </div>

              {/* Typography info */}
              <div className="text-[10px] text-zinc-400 font-mono bg-zinc-900/60 px-2 py-1 rounded">
                {arch.typography.headingFont} + {arch.typography.bodyFont}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
