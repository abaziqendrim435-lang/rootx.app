'use client';

import React, { useState } from 'react';
import type { DesignEngineResult } from '@/lib/website-builder-types';
import { Monitor, Smartphone, Layers, Palette, Type, Image as ImageIcon, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Props {
  result: DesignEngineResult;
}

function stripLiquidDirectives(liquidStr: string): string {
  if (!liquidStr) return '';
  return liquidStr
    .replace(/{%\s*schema\s*%}[\s\S]*?{%\s*endschema\s*%}/gi, '')
    .replace(/{%\s*if[\s\S]*?{%\s*endif\s*%}/gi, '')
    .replace(/{%\s*[\s\S]*?%\s*}/g, '')
    .replace(/\{\{\s*section\.settings\.headline\s*\}\}/g, 'Premium Collection')
    .replace(/\{\{\s*section\.settings\.subheadline\s*\}\}/g, 'Engineered for exceptional daily performance.')
    .replace(/\{\{\s*section\.settings\.cta_url\s*\}\}/g, '#')
    .replace(/\{\{\s*[\s\S]*?\s*\}\}/g, '');
}

export default function DesignPreviewPanel({ result }: Props) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  const themeCss = result.files.find((f) => f.key === 'assets/theme.css')?.value || '';
  const sectionFiles = result.files.filter((f) => f.key.startsWith('sections/'));

  // Hero image resolution
  const imgPipeline = result.imagePipelineResult;
  const heroUrl = imgPipeline?.heroImage?.normalizedUrl || imgPipeline?.images?.[0]?.normalizedUrl || '';
  const validImagesCount = imgPipeline?.images?.length || 0;
  const totalExtractedCount = imgPipeline?.diagnosticInfo?.totalExtracted || 0;

  // Render liquid section templates into clean HTML body
  const renderedSectionsHtml = sectionFiles.map((sf) => stripLiquidDirectives(sf.value)).join('\n');

  // Generate full interactive preview HTML document
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
    * { box-sizing: border-box; }
    body { font-family: ${result.tokens['--font-body']}, system-ui, sans-serif; color: ${result.tokens['--color-text']}; background: ${result.tokens['--color-background']}; margin: 0; padding: 0; }
    .header { padding: 1.25rem 2rem; border-bottom: 1px solid ${result.tokens['--color-border']}; display: flex; justify-content: space-between; align-items: center; background: ${result.tokens['--color-surface']}; }
    .logo { font-family: ${result.tokens['--font-heading']}; font-size: 1.5rem; font-weight: 800; color: ${result.tokens['--color-primary']}; }
    .btn { display: inline-block; padding: 0.8rem 1.8rem; border-radius: ${result.tokens['--button-radius']}; font-weight: 700; text-decoration: none; cursor: pointer; border: none; }
    .btn-primary { background: ${result.tokens['--color-primary']}; color: #fff; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
    .section { padding: 3.5rem 0; }
    img { max-width: 100%; height: auto; display: block; object-fit: cover; }
    
    /* Dev debug overlay */
    .debug-banner { background: #09090b; color: #a1a1aa; padding: 0.75rem 1rem; border-bottom: 1px solid #27272a; font-family: monospace; font-size: 11px; display: flex; gap: 1rem; flex-wrap: wrap; }
    .debug-badge { background: #18181b; padding: 0.2rem 0.5rem; border-radius: 4px; color: #e4e4e7; border: 1px solid #27272a; }
  </style>
</head>
<body>
  <!-- Header -->
  <header class="header">
    <div class="logo">${result.brandName}</div>
    <div style="display:flex; gap:1.5rem; font-size:0.9rem; font-weight:600;">
      <a href="#" style="color:inherit; text-decoration:none;">Shop</a>
      <a href="#" style="color:inherit; text-decoration:none;">Features</a>
      <a href="#" style="color:inherit; text-decoration:none;">FAQ</a>
    </div>
  </header>

  <!-- Sections Rendered from Theme Engine -->
  ${renderedSectionsHtml}
</body>
</html>`;

  return (
    <div className="space-y-4 mb-6">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between p-4 rounded-xl border bg-zinc-900 border-zinc-800 flex-wrap gap-3">
        <div className="flex items-center gap-4 text-xs text-zinc-300 flex-wrap">
          <span className="flex items-center gap-1.5 font-bold text-white">
            <Palette size={14} className="text-blue-400" />
            Archetype: <span className="text-blue-400 capitalize">{result.archetype.replace('_', ' ')}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Type size={14} className="text-emerald-400" />
            Fonts: <span className="text-white">{result.fonts.heading}</span> / {result.fonts.body}
          </span>
          <span className="flex items-center gap-1.5">
            <ImageIcon size={14} className="text-amber-400" />
            Hero Photo: <span className="text-amber-400 font-mono truncate max-w-[150px]">{heroUrl || 'No image'}</span>
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

      {/* Development Debug Result (Visible in Dev Mode) */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="p-3 rounded-xl border bg-zinc-950 border-zinc-800 text-[11px] font-mono text-zinc-300 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-blue-400 font-bold">Image Pipeline Output:</span>
            <span>Raw Found: <strong className="text-white">{totalExtractedCount}</strong></span>
            <span>Valid Images: <strong className="text-emerald-400">{validImagesCount}</strong></span>
            <span>Hero Rendered: <strong className="text-amber-400 truncate max-w-[250px]">{heroUrl ? heroUrl.slice(0, 40) + '...' : 'None'}</strong></span>
          </div>
          {imgPipeline?.diagnosticInfo?.rejectionLog && imgPipeline.diagnosticInfo.rejectionLog.length > 0 && (
            <span className="text-amber-400 text-[10px]">
              {imgPipeline.diagnosticInfo.rejectionLog.length} Rejected (Audit Log Active)
            </span>
          )}
        </div>
      )}

      {/* Frame Container */}
      <div className="flex justify-center bg-zinc-950 p-6 rounded-2xl border border-zinc-800 overflow-hidden min-h-[500px]">
        <div
          className="transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border border-zinc-800 bg-white"
          style={{
            width: device === 'desktop' ? '100%' : '375px',
            height: device === 'desktop' ? '650px' : '750px',
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
