'use client';

import React, { useState } from 'react';
import type { DesignEngineResult } from '@/lib/website-builder-types';
import { Monitor, Smartphone, Layers, Palette, Type } from 'lucide-react';

interface Props {
  result: DesignEngineResult;
}

export default function DesignPreviewPanel({ result }: Props) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Find theme.liquid or template file
  const themeFile = result.files.find((f) => f.key === 'layout/theme.liquid')?.value || '';
  const indexJson = result.files.find((f) => f.key === 'templates/index.json')?.value || '';
  const themeCss = result.files.find((f) => f.key === 'assets/theme.css')?.value || '';

  // Generate a mock rendered preview HTML doc
  const previewHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@600;700;800&family=Playfair+Display:ital,wght@0,600;0,700&display=swap" rel="stylesheet">
  <style>
    ${themeCss}
    body { font-family: ${result.tokens['--font-body']}; color: ${result.tokens['--color-text']}; background: ${result.tokens['--color-background']}; margin: 0; padding: 0; }
    .preview-header { padding: 1.25rem 2rem; border-bottom: 1px solid ${result.tokens['--color-border']}; display: flex; justify-content: space-between; align-items: center; background: ${result.tokens['--color-surface']}; }
    .preview-logo { font-family: ${result.tokens['--font-heading']}; font-size: 1.5rem; font-weight: 800; color: ${result.tokens['--color-primary']}; }
    .preview-hero { padding: 4rem 2rem; text-align: center; background: ${result.tokens['--color-surface']}; border-bottom: 1px solid ${result.tokens['--color-border']}; }
    .preview-title { font-family: ${result.tokens['--font-heading']}; font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; color: ${result.tokens['--color-text']}; }
    .preview-desc { max-width: 600px; margin: 0 auto 2rem; color: ${result.tokens['--color-muted']}; line-height: 1.6; }
    .preview-btn { display: inline-block; padding: 0.9rem 2.5rem; height: ${result.tokens['--button-height']}; border-radius: ${result.tokens['--button-radius']}; background: ${result.tokens['--color-primary']}; color: #fff; text-decoration: none; font-weight: 700; }
    .preview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; padding: 3rem 2rem; }
    .preview-card { padding: 1.5rem; border: 1px solid ${result.tokens['--color-border']}; border-radius: ${result.tokens['--radius-medium']}; background: ${result.tokens['--color-surface']}; box-shadow: ${result.tokens['--shadow-soft']}; }
  </style>
</head>
<body>
  <div class="preview-header">
    <div class="preview-logo">${result.brandName}</div>
    <div style="display:flex; gap:1.5rem; font-size:0.9rem;">
      <span>Shop</span><span>Features</span><span>FAQ</span>
    </div>
  </div>
  <div class="preview-hero">
    <div class="preview-title">${result.brandName} Store</div>
    <div class="preview-desc">${result.brandSlogan}</div>
    <a href="#" class="preview-btn">Shop Now — Best Sellers</a>
  </div>
  <div class="preview-grid">
    <div class="preview-card">
      <div style="font-size:1.5rem; margin-bottom:0.5rem;">🛡️</div>
      <strong>Guaranteed Quality</strong>
      <p style="font-size:0.85rem; color:${result.tokens['--color-muted']}; margin-top:0.25rem;">Crafted with premium components.</p>
    </div>
    <div class="preview-card">
      <div style="font-size:1.5rem; margin-bottom:0.5rem;">🚚</div>
      <strong>Free Express Delivery</strong>
      <p style="font-size:0.85rem; color:${result.tokens['--color-muted']}; margin-top:0.25rem;">Tracked shipping on all orders.</p>
    </div>
    <div class="preview-card">
      <div style="font-size:1.5rem; margin-bottom:0.5rem;">🔒</div>
      <strong>Secure Checkout</strong>
      <p style="font-size:0.85rem; color:${result.tokens['--color-muted']}; margin-top:0.25rem;">256-Bit SSL protection.</p>
    </div>
  </div>
</body>
</html>`;

  return (
    <div className="space-y-4 mb-6">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between p-4 rounded-xl border bg-zinc-900 border-zinc-800">
        <div className="flex items-center gap-4 text-xs text-zinc-300">
          <span className="flex items-center gap-1.5 font-bold text-white">
            <Palette size={14} className="text-blue-400" />
            Archetype: <span className="text-blue-400 capitalize">{result.archetype.replace('_', ' ')}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Type size={14} className="text-emerald-400" />
            Fonts: <span className="text-white">{result.fonts.heading}</span> / {result.fonts.body}
          </span>
          <span className="flex items-center gap-1.5">
            <Layers size={14} className="text-amber-400" />
            Sections: <span className="text-white">{result.sectionPlan.totalSections} Rendered</span>
          </span>
        </div>

        {/* Viewport Device Toggle */}
        <div className="flex items-center gap-1 bg-zinc-800 p-1 rounded-lg">
          <button
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              device === 'desktop' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Monitor size={14} />
            Desktop
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              device === 'mobile' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone size={14} />
            Mobile
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex justify-center bg-zinc-950 p-6 rounded-2xl border border-zinc-800 overflow-hidden min-h-[500px]">
        <div
          className="transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border border-zinc-800 bg-white"
          style={{
            width: device === 'desktop' ? '100%' : '375px',
            height: device === 'desktop' ? '550px' : '650px',
          }}
        >
          <iframe
            srcDoc={previewHtml}
            title="Theme Preview"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
