// ============================================================
// RootX — Live Image Debug Panel V1
// Development-only image pipeline diagnostic panel.
// Displays product source, raw/accepted/cached/failed counts,
// hero domain & HTTP status, and gallery cache status indicators.
// ============================================================

import React from 'react';
import type { ProductImageLibrary } from '@/lib/image-pipeline/types';

export interface LiveImageDebugPanelProps {
  productSource?: string;
  imageLibrary?: ProductImageLibrary | null;
  rawImagesCount?: number;
  heroOriginalUrl?: string;
  heroCachedUrl?: string;
  isVisible?: boolean;
}

export const LiveImageDebugPanel: React.FC<LiveImageDebugPanelProps> = ({
  productSource = 'AliExpress',
  imageLibrary,
  rawImagesCount = 0,
  heroOriginalUrl = '',
  heroCachedUrl = '',
  isVisible = true,
}) => {
  if (!isVisible && process.env.NODE_ENV === 'production') return null;

  const validImages = imageLibrary?.allValidImages || [];
  const rejectedImages = imageLibrary?.rejectedImages || [];
  
  const acceptedCount = validImages.length;
  const cachedCount = imageLibrary?.cachedImageCount ?? validImages.filter((img) => img.status === 'cached' || Boolean(img.cachedUrl)).length;
  const failedCount = (imageLibrary?.failedImageCount ?? 0) + rejectedImages.length;

  let heroDomain = 'none';
  if (heroOriginalUrl) {
    try {
      heroDomain = new URL(heroOriginalUrl).hostname;
    } catch {
      heroDomain = 'invalid-url';
    }
  }

  const heroStatus = heroCachedUrl ? '200 OK (Cached)' : 'Not Cached';

  return (
    <div
      className="rounded-xl p-4 my-4 border text-xs font-mono"
      style={{
        background: '#090a0f',
        borderColor: cachedCount === 0 ? '#ef4444' : '#22c55e',
        color: '#e4e4e7',
      }}
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
        <span className="font-bold uppercase tracking-wider text-emerald-400">
          🛠 RootX Image Cache V1 — Live Debug Panel
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300">
          Source: {productSource}
        </span>
      </div>

      {cachedCount === 0 && (
        <div className="p-3 mb-3 rounded bg-red-950/80 border border-red-800 text-red-200">
          <strong className="block text-red-400 font-bold mb-1">
            ❌ PIPELINE HALTED: 0 IMAGES CACHED
          </strong>
          No product images could be cached server-side. Halting storefront generation to prevent rendering broken placeholders.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800">
          <span className="text-zinc-400 block text-[10px]">RAW IMAGES</span>
          <span className="text-base font-bold text-zinc-100">{rawImagesCount || validImages.length}</span>
        </div>
        <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800">
          <span className="text-zinc-400 block text-[10px]">ACCEPTED IMAGES</span>
          <span className="text-base font-bold text-blue-400">{acceptedCount}</span>
        </div>
        <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800">
          <span className="text-zinc-400 block text-[10px]">CACHED IMAGES</span>
          <span className="text-base font-bold text-emerald-400">{cachedCount}</span>
        </div>
        <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800">
          <span className="text-zinc-400 block text-[10px]">FAILED IMAGES</span>
          <span className="text-base font-bold text-rose-400">{failedCount}</span>
        </div>
      </div>

      <div className="space-y-1.5 mb-3 pt-2 border-t border-zinc-800">
        <div className="text-zinc-300 font-semibold">Hero Image Diagnostic:</div>
        <div className="text-zinc-400 truncate">Original Domain: <span className="text-zinc-200">{heroDomain}</span></div>
        <div className="text-zinc-400 truncate">Cached URL: <span className="text-emerald-400">{heroCachedUrl || 'None'}</span></div>
        <div className="text-zinc-400">HTTP Status: <span className={heroCachedUrl ? 'text-emerald-400 font-bold' : 'text-rose-400'}>{heroStatus}</span></div>
      </div>

      <div className="pt-2 border-t border-zinc-800">
        <div className="text-zinc-300 font-semibold mb-1">Gallery Cache Status:</div>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {validImages.map((img, idx) => (
            <span
              key={img.id || idx}
              className={`px-2 py-0.5 rounded text-[11px] border ${
                img.cachedUrl || img.status === 'cached'
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-800 text-rose-300'
              }`}
            >
              {idx + 1} {img.cachedUrl || img.status === 'cached' ? 'cached ✅' : 'failed ❌'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
