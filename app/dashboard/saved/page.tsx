'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bookmark, Zap } from 'lucide-react';
import Link from 'next/link';
import GenerationCard from '@/components/dashboard/GenerationCard';
import {
  getAllGenerations,
  toggleSaved,
  deleteGeneration,
  type GenerationRecord,
} from '@/lib/dashboard-storage';

export default function SavedPage() {
  const [saved, setSaved] = useState<GenerationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await getAllGenerations();
    setSaved(all.filter((r) => r.isSaved));
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      refresh();
    }, 0);
    return () => clearTimeout(t);
  }, [refresh]);

  async function handleToggleSave(id: string) {
    await toggleSaved(id);
    await refresh();
  }

  async function handleDelete(id: string) {
    await deleteGeneration(id);
    await refresh();
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.25)' }}
          >
            <Bookmark size={16} style={{ color: '#eab308' }} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#eab308' }}>
            Saved
          </span>
        </div>
        <h1 className="text-3xl font-black mb-1">Saved Items</h1>
        <p style={{ color: '#71717a', fontSize: '0.95rem' }}>
          {loading
            ? 'Loading your saved items…'
            : saved.length > 0
            ? `${saved.length} saved generation${saved.length !== 1 ? 's' : ''} — your favorites, always at hand.`
            : 'Bookmark any generation to keep it here for easy access.'}
        </p>
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 animate-pulse"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', height: '72px' }}
            />
          ))}
        </div>
      ) : saved.length === 0 ? (
        /* Empty state */
        <div
          className="rounded-2xl p-12 text-center flex flex-col items-center gap-5"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}
          >
            <Bookmark size={28} style={{ color: '#eab308' }} />
          </div>
          <div>
            <p className="font-bold text-lg mb-2">Nothing saved yet</p>
            <p className="text-sm" style={{ color: '#71717a', maxWidth: '340px' }}>
              Click the{' '}
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(234,179,8,0.1)', color: '#eab308', border: '1px solid rgba(234,179,8,0.25)' }}
              >
                <Bookmark size={11} /> Save
              </span>{' '}
              button on any generation to bookmark it here.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Link href="/dashboard/history" className="btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}>
              View History
            </Link>
            <Link href="/agents/content-creator-agent" className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}>
              <Zap size={15} /> Generate Content
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {saved.map((record) => (
            <GenerationCard
              key={record.id}
              record={record}
              onToggleSave={handleToggleSave}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
