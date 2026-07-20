'use client';

import React, { useState } from 'react';
import type { ImagePipelineResult } from '@/lib/image-pipeline/types';
import { Image, CheckCircle2, AlertCircle, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  pipelineResult: ImagePipelineResult;
  debugMode?: boolean;
}

export default function ImageDiagnosticsPanel({ pipelineResult, debugMode = true }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!debugMode) return null;

  const { diagnosticInfo, heroImage, images, hasSingleImageFallback, hasNoImageFallback } = pipelineResult;

  return (
    <div
      className="p-4 rounded-2xl border mb-6 text-xs font-mono space-y-3"
      style={{
        background: 'rgba(24, 24, 27, 0.95)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
      }}
    >
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
          <Image size={16} />
          Image Pipeline Diagnostics (Dev Mode)
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <CheckCircle2 size={12} /> {diagnosticInfo.validCount} Valid
          </span>
          <span className="flex items-center gap-1 text-amber-400 font-semibold">
            <AlertCircle size={12} /> {diagnosticInfo.rejectedCount} Rejected
          </span>
          <button className="text-zinc-400 hover:text-white">
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="pt-3 border-t border-zinc-800 space-y-3">
          {/* Summary grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400 block">Total Extracted:</span>
              <strong className="text-white text-sm">{diagnosticInfo.totalExtracted}</strong>
            </div>
            <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400 block">Valid Images:</span>
              <strong className="text-emerald-400 text-sm">{diagnosticInfo.validCount}</strong>
            </div>
            <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400 block">Hero Image:</span>
              <strong className="text-blue-400 text-xs truncate block">{heroImage ? heroImage.source : 'None'}</strong>
            </div>
            <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400 block">Fallback Strategy:</span>
              <strong className="text-amber-400 text-xs">
                {hasNoImageFallback ? 'No Image Fallback' : hasSingleImageFallback ? 'Single Image Crop' : 'Multi-Image Direct'}
              </strong>
            </div>
          </div>

          {/* Sources breakdown */}
          <div className="flex gap-4 text-[11px] text-zinc-300">
            <span>Sources:</span>
            {Object.entries(diagnosticInfo.sourcesFound).map(([src, count]) => (
              count > 0 && (
                <span key={src} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {src}: {count}
                </span>
              )
            ))}
          </div>

          {/* Rejection log if any */}
          {diagnosticInfo.rejectionLog.length > 0 && (
            <div className="space-y-1">
              <span className="text-amber-400 font-semibold block">Rejection Audit Log:</span>
              <div className="max-h-28 overflow-y-auto space-y-1 bg-zinc-950 p-2 rounded border border-zinc-800">
                {diagnosticInfo.rejectionLog.map((log, i) => (
                  <div key={i} className="text-[10px] text-zinc-400 flex justify-between">
                    <span className="truncate max-w-[280px]">{log.url}</span>
                    <span className="text-amber-400">{log.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
