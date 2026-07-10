'use client';

import { useState, useEffect } from 'react';
import { Request } from '@/lib/types';
import { agents } from '@/lib/agents';
import {
  LayoutDashboard,
  Users,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  Database,
  HardDrive,
} from 'lucide-react';

interface AdminDashboardProps {
  requests: Request[];
  isDemo: boolean;
}

type LocalRequest = {
  id: string;
  name: string;
  email: string;
  business_type: string;
  selected_agent: string;
  agent_name?: string;
  message: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
};

const statusConfig: Record<
  'pending' | 'in_progress' | 'completed',
  { label: string; dot: string; badge: string }
> = {
  pending: { label: 'Pending', dot: 'status-dot-pending', badge: 'badge-yellow' },
  in_progress: { label: 'In Progress', dot: 'status-dot-in_progress', badge: 'badge-blue' },
  completed: { label: 'Completed', dot: 'status-dot-completed', badge: 'badge-green' },
};

function getAgentName(agentId: string, fallback?: string): string {
  return agents.find((a) => a.id === agentId)?.name ?? fallback ?? agentId;
}

function getAgentIcon(agentId: string): string {
  return agents.find((a) => a.id === agentId)?.icon ?? '🤖';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

function loadLocalRequests(): LocalRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('rootx_requests') || '[]');
  } catch {
    return [];
  }
}

function updateLocalStatus(id: string, status: LocalRequest['status']) {
  const all = loadLocalRequests();
  const updated = all.map(r => r.id === id ? { ...r, status } : r);
  localStorage.setItem('rootx_requests', JSON.stringify(updated));
  return updated;
}

function deleteLocalRequest(id: string) {
  const all = loadLocalRequests().filter(r => r.id !== id);
  localStorage.setItem('rootx_requests', JSON.stringify(all));
  return all;
}

type TabType = 'local' | 'supabase';

export default function AdminDashboard({ requests: supabaseRequests, isDemo }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('local');
  const [localRequests, setLocalRequests] = useState<LocalRequest[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Load localStorage on mount
  useEffect(() => {
    const t = setTimeout(() => {
      setLocalRequests(loadLocalRequests());
    }, 0);
    return () => clearTimeout(t);
  }, []);

  function refresh() {
    if (activeTab === 'local') {
      setLocalRequests(loadLocalRequests());
    } else {
      window.location.reload();
    }
  }

  function handleStatusChange(id: string, status: LocalRequest['status']) {
    const updated = updateLocalStatus(id, status);
    setLocalRequests(updated);
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this request?')) return;
    const updated = deleteLocalRequest(id);
    setLocalRequests(updated);
  }

  // Normalize to a common shape
  const displayRequests: LocalRequest[] =
    activeTab === 'local'
      ? localRequests
      : (supabaseRequests as unknown as LocalRequest[]);

  const pending = displayRequests.filter(r => r.status === 'pending').length;
  const inProgress = displayRequests.filter(r => r.status === 'in_progress').length;
  const completed = displayRequests.filter(r => r.status === 'completed').length;

  const filtered =
    filterStatus === 'All'
      ? displayRequests
      : displayRequests.filter(r => r.status === filterStatus);

  return (
    <div style={{ paddingTop: '64px', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Header */}
      <div
        className="py-6"
        style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="section-container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.25)' }}
            >
              <LayoutDashboard size={18} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <h1 className="font-bold text-xl">Admin Dashboard</h1>
              <p className="text-xs" style={{ color: '#52525b' }}>RootX — Request Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={refresh}
              className="btn-secondary flex items-center gap-1.5"
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
            >
              <RefreshCw size={13} />
              Refresh
            </button>
            <form action="/api/admin/logout" method="POST">
              <button type="submit" className="btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="section-container py-8">

        {/* ── Source Tabs ──────────────────────────────────── */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl mb-8 self-start"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', width: 'fit-content' }}
        >
          {([
            { id: 'local', label: 'localStorage Requests', icon: HardDrive },
            { id: 'supabase', label: 'Supabase Requests', icon: Database },
          ] as const).map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: isActive ? 'rgba(220,38,38,0.18)' : 'transparent',
                  color: isActive ? '#ef4444' : '#71717a',
                  border: isActive ? '1px solid rgba(220,38,38,0.3)' : '1px solid transparent',
                }}
              >
                <Icon size={14} />
                {tab.label}
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    background: isActive ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.05)',
                    color: isActive ? '#ef4444' : '#52525b',
                  }}
                >
                  {tab.id === 'local' ? localRequests.length : supabaseRequests.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Demo notice for Supabase tab */}
        {activeTab === 'supabase' && isDemo && (
          <div
            className="rounded-xl p-4 mb-6 flex items-start gap-3 text-sm"
            style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', color: '#eab308' }}
          >
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>
              <strong>Demo mode:</strong> No Supabase connection. Add{' '}
              <code className="px-1 rounded" style={{ background: 'rgba(234,179,8,0.15)', fontSize: '0.8em' }}>
                NEXT_PUBLIC_SUPABASE_URL
              </code>{' '}
              to your .env.local to see live requests.
            </span>
          </div>
        )}

        {/* Local info */}
        {activeTab === 'local' && (
          <div
            className="rounded-xl p-4 mb-6 flex items-start gap-3 text-sm"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}
          >
            <HardDrive size={16} className="flex-shrink-0 mt-0.5" />
            <span>
              Showing requests submitted via the marketplace and request form. These are stored in your browser&apos;s localStorage.
              {localRequests.length === 0 && ' Go to the Agents page and submit a request to see it here.'}
            </span>
          </div>
        )}

        {/* ── Stats ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Requests', value: displayRequests.length, icon: Users, color: '#a1a1aa' },
            { label: 'Pending', value: pending, icon: Clock, color: '#eab308' },
            { label: 'In Progress', value: inProgress, icon: Loader2, color: '#60a5fa' },
            { label: 'Completed', value: completed, icon: CheckCircle2, color: '#22c55e' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-2xl p-5"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs" style={{ color: '#52525b' }}>{stat.label}</p>
                  <Icon size={15} style={{ color: stat.color }} />
                </div>
                <p className="text-3xl font-black" style={{ color: stat.color }}>{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* ── Filter tabs ───────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {(['All', 'pending', 'in_progress', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                background: filterStatus === s ? 'rgba(220,38,38,0.18)' : 'var(--color-surface)',
                color: filterStatus === s ? '#ef4444' : '#71717a',
                border: filterStatus === s ? '1px solid rgba(220,38,38,0.4)' : '1px solid var(--color-border)',
              }}
            >
              {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== 'All' && (
                <span className="ml-1.5 opacity-60">({displayRequests.filter(r => r.status === s).length})</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Requests Table ─────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
          {filtered.length === 0 ? (
            <div
              className="text-center py-20"
              style={{ background: 'var(--color-surface)' }}
            >
              <div className="text-5xl mb-4">{activeTab === 'local' ? '📭' : '🗄️'}</div>
              <p className="text-lg font-semibold mb-2">No requests yet</p>
              <p style={{ color: '#71717a' }}>
                {activeTab === 'local'
                  ? 'Go to the Agents page and click "Request Setup" on any agent.'
                  : 'Connect Supabase and submit a request from the /request form.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: '640px' }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                    {['Customer', 'Agent', 'Business', 'Status', 'Received', activeTab === 'local' ? 'Actions' : ''].map((h) => (
                      <th
                        key={h}
                        className="text-left text-xs font-semibold px-5 py-3.5 uppercase tracking-wider"
                        style={{ color: '#52525b' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((req) => {
                    const isExpanded = expandedRow === req.id;
                    const sc = statusConfig[req.status] ?? statusConfig.pending;
                    return (
                      <>
                        <tr
                          key={req.id}
                          className="transition-colors"
                          style={{
                            background: isExpanded ? 'rgba(220,38,38,0.04)' : 'var(--color-surface)',
                            borderBottom: '1px solid var(--color-border)',
                          }}
                        >
                          {/* Customer */}
                          <td
                            className="px-5 py-4 cursor-pointer"
                            onClick={() => setExpandedRow(isExpanded ? null : req.id)}
                          >
                            <p className="font-semibold text-sm">{req.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: '#52525b' }}>{req.email}</p>
                          </td>
                          {/* Agent */}
                          <td className="px-5 py-4 cursor-pointer" onClick={() => setExpandedRow(isExpanded ? null : req.id)}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getAgentIcon(req.selected_agent)}</span>
                              <span className="text-xs leading-tight" style={{ color: '#a1a1aa' }}>
                                {getAgentName(req.selected_agent, req.agent_name)}
                              </span>
                            </div>
                          </td>
                          {/* Business */}
                          <td className="px-5 py-4 cursor-pointer" onClick={() => setExpandedRow(isExpanded ? null : req.id)}>
                            <span className="text-xs" style={{ color: '#71717a' }}>{req.business_type || '—'}</span>
                          </td>
                          {/* Status */}
                          <td className="px-5 py-4">
                            {activeTab === 'local' ? (
                              <select
                                value={req.status}
                                onChange={e => handleStatusChange(req.id, e.target.value as LocalRequest['status'])}
                                className="text-xs rounded-lg px-2 py-1 transition-colors"
                                style={{
                                  background: 'var(--color-surface-2)',
                                  border: '1px solid var(--color-border)',
                                  color: '#a1a1aa',
                                  cursor: 'pointer',
                                }}
                                onClick={e => e.stopPropagation()}
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </select>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={`status-dot ${sc.dot}`} />
                                <span className={`badge ${sc.badge}`}>{sc.label}</span>
                              </div>
                            )}
                          </td>
                          {/* Time */}
                          <td className="px-5 py-4 cursor-pointer" onClick={() => setExpandedRow(isExpanded ? null : req.id)}>
                            <span className="text-xs" style={{ color: '#52525b' }}>{timeAgo(req.created_at)}</span>
                          </td>
                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setExpandedRow(isExpanded ? null : req.id)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: '#52525b' }}
                              >
                                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              </button>
                              {activeTab === 'local' && (
                                <button
                                  onClick={() => handleDelete(req.id)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                  style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#ef4444' }}
                                  title="Delete request"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded detail row */}
                        {isExpanded && (
                          <tr key={`${req.id}-expanded`} style={{ background: 'rgba(220,38,38,0.025)', borderBottom: '1px solid var(--color-border)' }}>
                            <td colSpan={6} className="px-5 py-5">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                  <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#52525b' }}>Message</p>
                                  <p className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>
                                    {req.message || 'No message provided.'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#52525b' }}>Request Details</p>
                                  <div className="flex flex-col gap-1.5 text-xs" style={{ color: '#71717a' }}>
                                    <span>ID: <code style={{ color: '#52525b' }}>{req.id.slice(0, 8)}…</code></span>
                                    <span>Submitted: {new Date(req.created_at).toLocaleString()}</span>
                                    <span>Source: <span style={{ color: activeTab === 'local' ? '#60a5fa' : '#22c55e' }}>{activeTab === 'local' ? 'localStorage' : 'Supabase'}</span></span>
                                  </div>
                                </div>
                                {activeTab === 'local' && (
                                  <div>
                                    <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#52525b' }}>Update Status</p>
                                    <div className="flex flex-col gap-2">
                                      {(['pending', 'in_progress', 'completed'] as const).map(s => (
                                        <button
                                          key={s}
                                          onClick={() => handleStatusChange(req.id, s)}
                                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-all duration-200"
                                          style={{
                                            background: req.status === s ? 'rgba(220,38,38,0.18)' : 'var(--color-surface-2)',
                                            border: req.status === s ? '1px solid rgba(220,38,38,0.35)' : '1px solid var(--color-border)',
                                            color: req.status === s ? '#ef4444' : '#71717a',
                                          }}
                                        >
                                          {statusConfig[s].label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Clear all localStorage */}
        {activeTab === 'local' && localRequests.length > 0 && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                if (confirm('Clear ALL localStorage requests? This cannot be undone.')) {
                  localStorage.removeItem('rootx_requests');
                  setLocalRequests([]);
                }
              }}
              className="text-xs flex items-center gap-1.5 transition-colors"
              style={{ color: '#52525b' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#52525b')}
            >
              <Trash2 size={12} />
              Clear all local requests
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
