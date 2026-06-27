'use client';

import { useState } from 'react';
import {
  HeadphonesIcon, Plus, ChevronDown, ChevronUp,
  Clock, CheckCircle2, AlertCircle, MessageSquare, X,
  Send, Loader2,
} from 'lucide-react';

type TicketStatus = 'open' | 'in_progress' | 'resolved';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  messages: { role: 'user' | 'support'; text: string; time: string }[];
}

const DEMO_TICKETS: Ticket[] = [
  {
    id: 'TKT-001',
    subject: 'Content Creator Agent not generating TikTok captions',
    category: 'Bug Report',
    status: 'in_progress',
    priority: 'high',
    createdAt: '2026-06-25',
    updatedAt: '2026-06-26',
    messages: [
      { role: 'user', text: 'When I click Generate, I get a blank output for TikTok captions. The rest of the fields work fine.', time: '2 days ago' },
      { role: 'support', text: 'Thanks for reporting! We can reproduce this. Our team is looking into it — we\'ll have a fix in 24h.', time: '1 day ago' },
    ],
  },
  {
    id: 'TKT-002',
    subject: 'How do I connect my Shopify store?',
    category: 'How-to',
    status: 'resolved',
    priority: 'low',
    createdAt: '2026-06-20',
    updatedAt: '2026-06-21',
    messages: [
      { role: 'user', text: 'I signed up for the Shopify Agent but I\'m not sure how to connect my store.', time: '7 days ago' },
      { role: 'support', text: 'Great question! Head to your Agent settings → Integrations → Shopify and enter your store URL + API key. Let us know if you need any help!', time: '7 days ago' },
    ],
  },
];

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  open:        { label: 'Open',        color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  icon: <Clock size={12} /> },
  in_progress: { label: 'In Progress', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)',  icon: <AlertCircle size={12} /> },
  resolved:    { label: 'Resolved',    color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',   icon: <CheckCircle2 size={12} /> },
};

const PRIORITY_COLOR: Record<string, string> = {
  low: '#52525b', medium: '#f59e0b', high: '#ef4444',
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>(DEMO_TICKETS);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ subject: '', category: 'General', message: '' });
  const [replyText, setReplyText] = useState('');

  function handleNew(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      const newTicket: Ticket = {
        id: `TKT-00${tickets.length + 1}`,
        subject: form.subject,
        category: form.category,
        status: 'open',
        priority: 'medium',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        messages: [{ role: 'user', text: form.message, time: 'just now' }],
      };
      setTickets((prev) => [newTicket, ...prev]);
      setSubmitting(false);
      setSubmitted(true);
      setShowNew(false);
      setForm({ subject: '', category: 'General', message: '' });
      setTimeout(() => setSubmitted(false), 4000);
    }, 1200);
  }

  function handleReply(ticketId: string) {
    if (!replyText.trim()) return;
    setTickets((prev) => prev.map((t) =>
      t.id === ticketId
        ? { ...t, messages: [...t.messages, { role: 'user', text: replyText, time: 'just now' }] }
        : t
    ));
    setReplyText('');
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.25)' }}>
              <HeadphonesIcon size={16} style={{ color: '#ef4444' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>Support</span>
          </div>
          <h1 className="text-3xl font-black mb-1">Support Tickets</h1>
          <p style={{ color: '#71717a', fontSize: '0.95rem' }}>
            Get help from our team. Average response time: &lt; 4 hours.
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="btn-primary"
          style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
        >
          <Plus size={15} /> New Ticket
        </button>
      </div>

      {/* Success banner */}
      {submitted && (
        <div className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <CheckCircle2 size={17} style={{ color: '#22c55e' }} />
          <p className="text-sm font-medium" style={{ color: '#22c55e' }}>
            Ticket submitted! Our team will respond within 4 hours.
          </p>
        </div>
      )}

      {/* New ticket modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-lg rounded-2xl p-7"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">New Support Ticket</h2>
              <button onClick={() => setShowNew(false)} style={{ color: '#52525b' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleNew} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a1a1aa' }}>Subject *</label>
                <input
                  required
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="Briefly describe your issue"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a1a1aa' }}>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="input-field w-full"
                  style={{ background: 'var(--color-surface-2)' }}
                >
                  {['General', 'Bug Report', 'How-to', 'Billing', 'Feature Request'].map((c) => (
                    <option key={c} value={c} style={{ background: '#0f0f12' }}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a1a1aa' }}>Message *</label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Describe your issue in detail…"
                  className="input-field w-full"
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowNew(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : <><Send size={15} /> Submit Ticket</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket list */}
      <div className="flex flex-col gap-3">
        {tickets.length === 0 && (
          <div className="text-center py-16" style={{ color: '#52525b' }}>
            <HeadphonesIcon size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No support tickets yet</p>
          </div>
        )}
        {tickets.map((ticket) => {
          const status = STATUS_CONFIG[ticket.status];
          const isOpen = expanded === ticket.id;

          return (
            <div key={ticket.id} className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              {/* Ticket header — click to expand */}
              <button
                onClick={() => setExpanded(isOpen ? null : ticket.id)}
                className="w-full flex items-start gap-4 p-5 text-left transition-colors"
                style={{ background: isOpen ? 'rgba(255,255,255,0.02)' : 'transparent' }}
              >
                <MessageSquare size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#52525b' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold" style={{ color: '#52525b' }}>{ticket.id}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#71717a', border: '1px solid var(--color-border)' }}>
                      {ticket.category}
                    </span>
                    <span className="text-xs font-bold capitalize"
                      style={{ color: PRIORITY_COLOR[ticket.priority] }}>
                      {ticket.priority} priority
                    </span>
                  </div>
                  <p className="font-semibold text-sm truncate">{ticket.subject}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#52525b' }}>Updated {ticket.updatedAt}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: status.bg, border: `1px solid ${status.border}`, color: status.color }}>
                    {status.icon}
                    {status.label}
                  </div>
                  {isOpen ? <ChevronUp size={16} style={{ color: '#52525b' }} /> : <ChevronDown size={16} style={{ color: '#52525b' }} />}
                </div>
              </button>

              {/* Expanded thread */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--color-border)' }}>
                  <div className="p-5 flex flex-col gap-4">
                    {ticket.messages.map((msg, i) => (
                      <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                          style={{
                            background: msg.role === 'support' ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.08)',
                            border: `1px solid ${msg.role === 'support' ? 'rgba(220,38,38,0.2)' : 'var(--color-border)'}`,
                            color: msg.role === 'support' ? '#ef4444' : '#a1a1aa',
                          }}>
                          {msg.role === 'support' ? 'RX' : 'U'}
                        </div>
                        <div className={`max-w-sm flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : ''}`}>
                          <div className="rounded-xl px-4 py-2.5 text-sm"
                            style={{
                              background: msg.role === 'user' ? 'rgba(220,38,38,0.1)' : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${msg.role === 'user' ? 'rgba(220,38,38,0.2)' : 'var(--color-border)'}`,
                            }}>
                            {msg.text}
                          </div>
                          <span className="text-xs" style={{ color: '#52525b' }}>
                            {msg.role === 'support' ? 'RootX Support · ' : ''}{msg.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply box */}
                  {ticket.status !== 'resolved' && (
                    <div className="p-4 flex gap-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleReply(ticket.id)}
                        placeholder="Type a reply… (Enter to send)"
                        className="input-field flex-1"
                        style={{ height: '38px', fontSize: '0.875rem' }}
                      />
                      <button
                        onClick={() => handleReply(ticket.id)}
                        className="btn-primary"
                        style={{ padding: '0 1rem', height: '38px', fontSize: '0.8rem' }}
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
