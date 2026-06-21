'use client';

import { useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Clock,
} from 'lucide-react';
import type { GenerationRecord } from '@/lib/dashboard-storage';

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const agentColors: Record<string, string> = {
  'content-creator': '#ef4444',
  shopify: '#22c55e',
};

const defaultColor = '#a855f7';

function getColor(agentType: string) {
  return agentColors[agentType] ?? defaultColor;
}

interface GenerationCardProps {
  record: GenerationRecord;
  onToggleSave: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function GenerationCard({ record, onToggleSave, onDelete }: GenerationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const color = getColor(record.agentType);

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  // Flatten outputs to displayable key/value pairs
  const outputEntries = Object.entries(record.outputs).filter(
    ([key]) => key !== 'isDemo'
  );

  const inputSummary = Object.values(record.inputs).filter(Boolean).slice(0, 2).join(' · ');

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = `${color}33`)}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)')}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: expanded ? '1px solid var(--color-border)' : 'none' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Agent icon */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
            style={{ background: `${color}15`, border: `1px solid ${color}30` }}
          >
            {record.agentIcon}
          </div>

          {/* Name + meta */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold truncate">{record.agentName}</span>
              {record.isSaved && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: 'rgba(234,179,8,0.1)',
                    color: '#eab308',
                    border: '1px solid rgba(234,179,8,0.25)',
                  }}
                >
                  Saved
                </span>
              )}
            </div>
            <p className="text-xs truncate mt-0.5" style={{ color: '#52525b' }}>
              {inputSummary}
            </p>
          </div>
        </div>

        {/* Right: time + actions */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <span className="hidden sm:flex items-center gap-1 text-xs" style={{ color: '#3f3f46' }}>
            <Clock size={11} />
            {timeAgo(record.createdAt)}
          </span>

          {/* Save toggle */}
          <button
            onClick={() => onToggleSave(record.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
            style={{
              background: record.isSaved ? 'rgba(234,179,8,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${record.isSaved ? 'rgba(234,179,8,0.3)' : 'var(--color-border)'}`,
              color: record.isSaved ? '#eab308' : '#52525b',
            }}
            title={record.isSaved ? 'Remove from saved' : 'Save this generation'}
          >
            {record.isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(record.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--color-border)',
              color: '#52525b',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#ef4444';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(220,38,38,0.35)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#52525b';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
            }}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>

          {/* Expand */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
            style={{
              background: expanded ? `${color}15` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${expanded ? color + '30' : 'var(--color-border)'}`,
              color: expanded ? color : '#52525b',
            }}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded outputs */}
      {expanded && (
        <div className="p-5 flex flex-col gap-4">
          {/* Inputs summary */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#3f3f46' }}>
              Inputs
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(record.inputs).map(([key, val]) => (
                <div key={key}>
                  <p className="text-xs font-medium" style={{ color: '#52525b' }}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: '#a1a1aa' }}>
                    {val}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Output fields */}
          {outputEntries.map(([key, value]) => {
            const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
            const textValue = Array.isArray(value)
              ? (value as string[]).join('\n')
              : typeof value === 'string'
              ? value
              : JSON.stringify(value, null, 2);
            const isCopied = copied === key;

            return (
              <div
                key={key}
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid var(--color-border)' }}
              >
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ background: 'var(--color-surface-2)' }}
                >
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
                    {displayKey}
                  </span>
                  <button
                    onClick={() => copy(textValue, key)}
                    className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-all duration-200"
                    style={{
                      background: isCopied ? `${color}18` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isCopied ? color + '40' : 'var(--color-border)'}`,
                      color: isCopied ? color : '#71717a',
                    }}
                  >
                    {isCopied ? <Check size={11} /> : <Copy size={11} />}
                    {isCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="p-4">
                  {Array.isArray(value) ? (
                    <ul className="flex flex-col gap-1.5">
                      {(value as string[]).map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs" style={{ color: '#a1a1aa' }}>
                          <span
                            className="flex-shrink-0 w-4 h-4 rounded-md text-xs flex items-center justify-center font-bold mt-0.5"
                            style={{ background: `${color}18`, color }}
                          >
                            {i + 1}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p
                      className="text-xs leading-relaxed whitespace-pre-wrap"
                      style={{ color: '#a1a1aa', maxHeight: '200px', overflow: 'auto' }}
                    >
                      {textValue}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
