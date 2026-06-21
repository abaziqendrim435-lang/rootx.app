'use client';

import { useState, useEffect, useCallback } from 'react';
import { History, Search, Filter, Trash2, Zap, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import GenerationCard from '@/components/dashboard/GenerationCard';
import {
  getAllGenerations,
  toggleSaved,
  deleteGeneration,
  clearAllGenerations,
  type GenerationRecord,
} from '@/lib/dashboard-storage';

const filterOptions = [
  { value: 'all', label: 'All Agents' },
  { value: 'content-creator', label: 'Content Creator' },
  { value: 'shopify', label: 'Shopify Agent' },
];

export default function HistoryPage() {
  const [records, setRecords] = useState<GenerationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState('all');
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getAllGenerations();
    setRecords(data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleToggleSave(id: string) {
    await toggleSaved(id);
    await refresh();
  }

  async function handleDelete(id: string) {
    await deleteGeneration(id);
    await refresh();
  }

  async function handleClearAll() {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 4000);
      return;
    }
    setClearing(true);
    await clearAllGenerations();
    await refresh();
    setClearing(false);
    setConfirmClear(false);
  }

  const filtered = records.filter((r) => {
    const matchesAgent = agentFilter === 'all' || r.agentType === agentFilter;
    const matchesSearch =
      search === '' ||
      r.agentName.toLowerCase().includes(search.toLowerCase()) ||
      Object.values(r.inputs).some((v) =>
        String(v).toLowerCase().includes(search.toLowerCase())
      );
    return matchesAgent && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.25)' }}
            >
              <History size={16} style={{ color: '#ef4444' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>
              History
            </span>
          </div>
          <h1 className="text-3xl font-black mb-1">Generation History</h1>
          <p style={{ color: '#71717a', fontSize: '0.95rem' }}>
            {loading
              ? 'Loading your generations…'
              : `All ${records.length} generation${records.length !== 1 ? 's' : ''} — expand any card to view and copy outputs.`}
          </p>
        </div>

        {records.length > 0 && !loading && (
          <button
            onClick={handleClearAll}
            disabled={clearing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
            style={{
              background: confirmClear ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.04)',
              border: confirmClear ? '1px solid rgba(220,38,38,0.35)' : '1px solid var(--color-border)',
              color: confirmClear ? '#ef4444' : '#52525b',
              opacity: clearing ? 0.6 : 1,
            }}
          >
            {clearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {clearing ? 'Clearing…' : confirmClear ? 'Click again to confirm' : 'Clear all'}
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 animate-pulse"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', height: '72px' }}
            />
          ))}
        </div>
      ) : records.length === 0 ? (
        <EmptyHistoryState />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#52525b' }} />
              <input
                type="text"
                placeholder="Search by agent or input…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.2rem', height: '38px', fontSize: '0.85rem' }}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#52525b' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Agent filter chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={14} style={{ color: '#3f3f46' }} />
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAgentFilter(opt.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                  style={{
                    background: agentFilter === opt.value ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.04)',
                    border: agentFilter === opt.value ? '1px solid rgba(220,38,38,0.35)' : '1px solid var(--color-border)',
                    color: agentFilter === opt.value ? '#ef4444' : '#71717a',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          {(search || agentFilter !== 'all') && (
            <p className="text-sm" style={{ color: '#52525b' }}>
              Showing <span style={{ color: '#ef4444', fontWeight: 700 }}>{filtered.length}</span> of {records.length}
            </p>
          )}

          {/* List */}
          {filtered.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <p className="text-lg font-bold mb-2">No results found</p>
              <p className="text-sm mb-4" style={{ color: '#71717a' }}>Try adjusting your search or filters.</p>
              <button
                onClick={() => { setSearch(''); setAgentFilter('all'); }}
                className="btn-secondary"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((record) => (
                <GenerationCard
                  key={record.id}
                  record={record}
                  onToggleSave={handleToggleSave}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyHistoryState() {
  return (
    <div
      className="rounded-2xl p-12 text-center flex flex-col items-center gap-5"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}
      >
        <History size={28} style={{ color: '#ef4444' }} />
      </div>
      <div>
        <p className="font-bold text-lg mb-2">Your history is empty</p>
        <p className="text-sm" style={{ color: '#71717a', maxWidth: '340px' }}>
          Generate content with any AI agent and it will automatically appear here.
        </p>
      </div>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link href="/agents/content-creator-agent" className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}>
          <Zap size={15} /> Content Creator
        </Link>
        <Link href="/agents/shopify-ai-agent" className="btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}>
          🛒 Shopify Agent
        </Link>
      </div>
    </div>
  );
}
