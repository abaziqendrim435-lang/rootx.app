'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, X, Send, CheckCircle2, Loader2, Zap, ArrowRight } from 'lucide-react';
import { agents, agentCategories } from '@/lib/agents';
import AgentCard from '@/components/AgentCard';

// ── localStorage helpers ────────────────────────────────────
function saveRequestToStorage(data: Record<string, string>) {
  try {
    const existing = JSON.parse(localStorage.getItem('rootx_requests') || '[]');
    const newRequest = {
      ...data,
      id: crypto.randomUUID(),
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    existing.unshift(newRequest);
    localStorage.setItem('rootx_requests', JSON.stringify(existing));
    return true;
  } catch {
    return false;
  }
}

const businessTypes = [
  'E-Commerce / Retail',
  'SaaS / Software',
  'Agency / Consulting',
  'Local Service Business',
  'Healthcare / Medical',
  'Finance / Accounting',
  'Real Estate',
  'Education / Coaching',
  'Media / Content',
  'Other',
];

const priceTiers = [
  { label: 'All Prices', value: 'all' },
  { label: '$197/mo', value: '197' },
  { label: '$297/mo', value: '297' },
  { label: '$397/mo', value: '397' },
  { label: '$997 one-time', value: '997' },
];

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activePriceTier, setActivePriceTier] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Quick-request modal state
  const [modalAgent, setModalAgent] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', business_type: '', message: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const modalRef = useRef<HTMLDivElement>(null);

  // CTA audit form
  const [auditForm, setAuditForm] = useState({ name: '', email: '', business_type: '' });
  const [auditStatus, setAuditStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  // Close modal on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setModalAgent(null);
        setFormStatus('idle');
      }
    }
    if (modalAgent) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [modalAgent]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = modalAgent ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modalAgent]);

  const filtered = agents.filter((agent) => {
    const matchesCategory = activeCategory === 'All' || agent.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = activePriceTier === 'all' || String(agent.price) === activePriceTier;
    return matchesCategory && matchesSearch && matchesPrice;
  });

  function openModal(agentId: string) {
    setModalAgent(agentId);
    setFormStatus('idle');
    setFormData({ name: '', email: '', business_type: '', message: '' });
  }

  function handleModalSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormStatus('loading');
    setTimeout(() => {
      const agent = agents.find(a => a.id === modalAgent);
      saveRequestToStorage({ ...formData, selected_agent: modalAgent ?? '', agent_name: agent?.name ?? '' });
      setFormStatus('success');
    }, 800);
  }

  function handleAuditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuditStatus('loading');
    setTimeout(() => {
      saveRequestToStorage({ ...auditForm, selected_agent: 'audit', agent_name: 'Automation Audit', message: 'Free automation audit request' });
      setAuditStatus('success');
    }, 800);
  }

  const selectedAgent = agents.find(a => a.id === modalAgent);

  return (
    <div style={{ paddingTop: '64px' }}>

      {/* ── Page Header ──────────────────────────────────────── */}
      <section
        className="relative"
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          paddingTop: '72px',
          paddingBottom: '60px',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at top center, rgba(220,38,38,0.12) 0%, transparent 60%)',
          }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: 'linear-gradient(rgba(220,38,38,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.05) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="section-container relative z-10 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            style={{
              background: 'rgba(220,38,38,0.1)',
              border: '1px solid rgba(220,38,38,0.2)',
              color: '#ef4444',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
            {agents.length} Agents Live
          </div>

          <h1
            className="font-black mb-5 leading-[1.05]"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)' }}
          >
            Choose Your{' '}
            <span className="gradient-text">AI Agent</span>
          </h1>

          <p
            className="text-lg mx-auto mb-10"
            style={{ color: '#71717a', maxWidth: '520px', lineHeight: '1.7' }}
          >
            Production-ready AI agents for every business function.
            Built, configured & deployed in 48 hours.
          </p>

          {/* Pricing legend */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { label: '$197/mo', desc: 'Starter', color: '#22c55e' },
              { label: '$297/mo', desc: 'Growth', color: '#ef4444' },
              { label: '$397/mo', desc: 'Pro', color: '#f97316' },
              { label: '$997', desc: 'One-time', color: '#a855f7' },
            ].map(tier => (
              <div key={tier.label} className="flex items-center gap-1.5 text-xs" style={{ color: '#52525b' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: tier.color }} />
                <span style={{ color: tier.color }} className="font-semibold">{tier.label}</span>
                <span>— {tier.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sticky Filter Bar ─────────────────────────────────── */}
      <div
        className="sticky top-16 z-40 py-3"
        style={{
          background: 'rgba(7,7,9,0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="section-container">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#52525b' }} />
              <input
                id="agent-search"
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.2rem', height: '36px', fontSize: '0.85rem' }}
              />
            </div>

            {/* Category chips */}
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              {agentCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200"
                  style={{
                    background: activeCategory === cat ? 'rgba(220,38,38,0.18)' : 'rgba(255,255,255,0.03)',
                    color: activeCategory === cat ? '#ef4444' : '#71717a',
                    border: activeCategory === cat ? '1px solid rgba(220,38,38,0.4)' : '1px solid var(--color-border)',
                    height: '28px',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Filter toggle (mobile-friendly) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 flex-shrink-0"
              style={{
                background: showFilters ? 'rgba(220,38,38,0.18)' : 'rgba(255,255,255,0.03)',
                border: showFilters ? '1px solid rgba(220,38,38,0.4)' : '1px solid var(--color-border)',
                color: showFilters ? '#ef4444' : '#71717a',
                height: '28px',
              }}
            >
              <SlidersHorizontal size={13} />
              Price
            </button>
          </div>

          {/* Price filter panel */}
          {showFilters && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs" style={{ color: '#52525b' }}>Filter by price:</span>
              {priceTiers.map((tier) => (
                <button
                  key={tier.value}
                  onClick={() => setActivePriceTier(tier.value)}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200"
                  style={{
                    background: activePriceTier === tier.value ? 'rgba(220,38,38,0.18)' : 'rgba(255,255,255,0.03)',
                    color: activePriceTier === tier.value ? '#ef4444' : '#71717a',
                    border: activePriceTier === tier.value ? '1px solid rgba(220,38,38,0.4)' : '1px solid var(--color-border)',
                    height: '28px',
                  }}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Agents Grid ──────────────────────────────────────── */}
      <section className="py-14">
        <div className="section-container">
          {filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg font-semibold mb-2">No agents found</p>
              <p style={{ color: '#71717a' }}>Try adjusting your search or filters.</p>
              <button
                className="btn-secondary mt-6"
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); setActivePriceTier('all'); }}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <p className="text-sm" style={{ color: '#52525b' }}>
                  Showing <span style={{ color: '#ef4444', fontWeight: 700 }}>{filtered.length}</span> of {agents.length} agents
                </p>
                {(searchQuery || activeCategory !== 'All' || activePriceTier !== 'all') && (
                  <button
                    className="text-xs flex items-center gap-1"
                    style={{ color: '#52525b' }}
                    onClick={() => { setSearchQuery(''); setActiveCategory('All'); setActivePriceTier('all'); }}
                  >
                    <X size={12} /> Clear filters
                  </button>
                )}
              </div>

              {/* Equal-height grid — auto-rows ensures all cards same height per row */}
              <div
                className="grid gap-5"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                  alignItems: 'stretch',
                }}
              >
                {filtered.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onRequestSetup={openModal}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── CTA: Automation Audit ─────────────────────────────── */}
      <section
        className="py-20"
        style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}
      >
        <div className="section-container">
          <div
            className="rounded-3xl overflow-hidden relative"
            style={{
              background: 'linear-gradient(135deg, rgba(220,38,38,0.12) 0%, rgba(0,0,0,0) 50%, rgba(249,115,22,0.06) 100%)',
              border: '1px solid rgba(220,38,38,0.2)',
            }}
          >
            {/* Glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.08) 0%, transparent 65%)' }}
            />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 p-10 md:p-14">
              {/* Left: copy */}
              <div className="flex flex-col justify-center">
                <div
                  className="inline-flex items-center gap-2 mb-4 self-start px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(220,38,38,0.12)', color: '#ef4444', border: '1px solid rgba(220,38,38,0.25)' }}
                >
                  <Zap size={12} />
                  Free Service
                </div>
                <h2 className="font-black text-3xl md:text-4xl mb-4 leading-tight">
                  Not sure which agent
                  <br />
                  <span className="gradient-text">you need?</span>
                </h2>
                <p className="text-base leading-relaxed mb-6" style={{ color: '#71717a' }}>
                  Request a <strong style={{ color: '#f8f8f8' }}>free automation audit</strong>. Our team will
                  analyze your workflows and recommend the exact agents that will save you the most time and money.
                </p>
                <ul className="flex flex-col gap-2">
                  {['No sales pitch — just honest advice', '30-minute call with our automation team', 'Custom recommendation report included'].map(p => (
                    <li key={p} className="flex items-center gap-2 text-sm" style={{ color: '#a1a1aa' }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#22c55e' }} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right: inline form */}
              <div>
                {auditStatus === 'success' ? (
                  <div
                    className="rounded-2xl p-10 text-center flex flex-col items-center gap-4 h-full justify-center"
                    style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}
                  >
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)' }}>
                      <CheckCircle2 size={32} style={{ color: '#22c55e' }} />
                    </div>
                    <h3 className="font-bold text-xl">Audit request received!</h3>
                    <p className="text-sm" style={{ color: '#71717a' }}>We'll reach out within 24 hours to schedule your free call.</p>
                    <button onClick={() => setAuditStatus('idle')} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                      Submit Another
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleAuditSubmit}
                    className="rounded-2xl p-8 flex flex-col gap-4"
                    style={{ background: 'rgba(7,7,9,0.7)', border: '1px solid var(--color-border)' }}
                  >
                    <h3 className="font-bold text-lg">Request Free Audit</h3>

                    <div>
                      <label htmlFor="audit-name" className="block text-xs font-medium mb-1.5" style={{ color: '#71717a' }}>Full Name *</label>
                      <input
                        id="audit-name"
                        type="text"
                        required
                        placeholder="John Smith"
                        value={auditForm.name}
                        onChange={e => setAuditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="input-field"
                        style={{ height: '40px', fontSize: '0.875rem' }}
                      />
                    </div>

                    <div>
                      <label htmlFor="audit-email" className="block text-xs font-medium mb-1.5" style={{ color: '#71717a' }}>Work Email *</label>
                      <input
                        id="audit-email"
                        type="email"
                        required
                        placeholder="john@company.com"
                        value={auditForm.email}
                        onChange={e => setAuditForm(prev => ({ ...prev, email: e.target.value }))}
                        className="input-field"
                        style={{ height: '40px', fontSize: '0.875rem' }}
                      />
                    </div>

                    <div>
                      <label htmlFor="audit-biz" className="block text-xs font-medium mb-1.5" style={{ color: '#71717a' }}>Business Type *</label>
                      <select
                        id="audit-biz"
                        required
                        value={auditForm.business_type}
                        onChange={e => setAuditForm(prev => ({ ...prev, business_type: e.target.value }))}
                        className="input-field"
                        style={{ height: '40px', fontSize: '0.875rem' }}
                      >
                        <option value="" disabled style={{ background: '#0f0f12' }}>Select type</option>
                        {businessTypes.map(bt => (
                          <option key={bt} value={bt} style={{ background: '#0f0f12' }}>{bt}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={auditStatus === 'loading'}
                      className="btn-primary"
                      style={{ justifyContent: 'center', marginTop: '4px' }}
                    >
                      {auditStatus === 'loading' ? (
                        <><Loader2 size={16} className="animate-spin" /> Sending...</>
                      ) : (
                        <><Send size={16} /> Request Free Audit</>
                      )}
                    </button>

                    <p className="text-xs text-center" style={{ color: '#3f3f46' }}>
                      No credit card. No spam. Just honest advice.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick Request Modal ───────────────────────────────── */}
      {modalAgent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        >
          <div
            ref={modalRef}
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedAgent?.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{selectedAgent?.name}</p>
                  <p className="text-xs font-bold" style={{ color: '#ef4444' }}>{selectedAgent?.priceLabel}</p>
                </div>
              </div>
              <button
                onClick={() => setModalAgent(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: 'var(--color-surface-2)', color: '#71717a' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6">
              {formStatus === 'success' ? (
                <div className="text-center py-8 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)' }}>
                    <CheckCircle2 size={32} style={{ color: '#22c55e' }} />
                  </div>
                  <h3 className="font-bold text-xl">Request Sent! 🎉</h3>
                  <p className="text-sm" style={{ color: '#71717a' }}>
                    We'll contact you within 24 hours to discuss your setup.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setModalAgent(null)} className="btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}>
                      Close
                    </button>
                    <Link href="/request" className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem' }} onClick={() => setModalAgent(null)}>
                      View Full Form
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleModalSubmit} className="flex flex-col gap-4">
                  <h3 className="font-bold text-lg mb-1">Request Setup</h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="modal-name" className="block text-xs font-medium mb-1.5" style={{ color: '#71717a' }}>Name *</label>
                      <input
                        id="modal-name"
                        type="text"
                        required
                        placeholder="John Smith"
                        value={formData.name}
                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                        className="input-field"
                        style={{ height: '40px', fontSize: '0.875rem' }}
                      />
                    </div>
                    <div>
                      <label htmlFor="modal-email" className="block text-xs font-medium mb-1.5" style={{ color: '#71717a' }}>Email *</label>
                      <input
                        id="modal-email"
                        type="email"
                        required
                        placeholder="you@co.com"
                        value={formData.email}
                        onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                        className="input-field"
                        style={{ height: '40px', fontSize: '0.875rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="modal-biz" className="block text-xs font-medium mb-1.5" style={{ color: '#71717a' }}>Business Type *</label>
                    <select
                      id="modal-biz"
                      required
                      value={formData.business_type}
                      onChange={e => setFormData(p => ({ ...p, business_type: e.target.value }))}
                      className="input-field"
                      style={{ height: '40px', fontSize: '0.875rem' }}
                    >
                      <option value="" disabled style={{ background: '#0f0f12' }}>Select type</option>
                      {businessTypes.map(bt => <option key={bt} value={bt} style={{ background: '#0f0f12' }}>{bt}</option>)}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="modal-msg" className="block text-xs font-medium mb-1.5" style={{ color: '#71717a' }}>Brief message (optional)</label>
                    <textarea
                      id="modal-msg"
                      rows={3}
                      placeholder="Tell us about your goals..."
                      value={formData.message}
                      onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                      className="input-field"
                      style={{ resize: 'none', fontSize: '0.875rem' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formStatus === 'loading'}
                    className="btn-primary"
                    style={{ justifyContent: 'center' }}
                  >
                    {formStatus === 'loading' ? (
                      <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                    ) : (
                      <><Send size={16} /> Submit Request</>
                    )}
                  </button>

                  <p className="text-xs text-center" style={{ color: '#3f3f46' }}>
                    Your data is saved locally. We'll reach out within 24h.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
