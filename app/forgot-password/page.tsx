'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Zap, Mail, ArrowLeft, AlertCircle,
  CheckCircle2, Loader2, Info, Send,
} from 'lucide-react';
import { resetPasswordForEmail, hasSupabaseConfig } from '@/lib/supabase-auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setErrorMsg('');

    if (!hasSupabaseConfig) {
      await new Promise((r) => setTimeout(r, 800));
      setStatus('sent');
      return;
    }

    const { error } = await resetPasswordForEmail(email.trim());
    if (error) {
      setStatus('error');
      setErrorMsg(error);
    } else {
      setStatus('sent');
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-20"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(220,38,38,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Glow */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: '500px', height: '260px',
          background: 'radial-gradient(ellipse, rgba(220,38,38,0.07) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6" style={{ textDecoration: 'none' }}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', boxShadow: '0 0 24px rgba(220,38,38,0.5)' }}
            >
              <Zap size={20} className="text-white" />
            </div>
            <span className="gradient-text text-2xl font-black">RootX</span>
          </Link>
          <h1 className="text-3xl font-black mb-2">Reset your password</h1>
          <p style={{ color: '#71717a', fontSize: '0.95rem' }}>
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {/* Demo notice */}
        {!hasSupabaseConfig && (
          <div
            className="flex items-start gap-3 p-4 rounded-xl mb-6"
            style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)' }}
          >
            <Info size={16} style={{ color: '#eab308', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="text-sm font-semibold mb-0.5" style={{ color: '#eab308' }}>Demo mode</p>
              <p className="text-xs leading-relaxed" style={{ color: '#71717a' }}>
                Supabase is not configured. No email will actually be sent.
              </p>
            </div>
          </div>
        )}

        {status === 'sent' ? (
          /* ── Success state ── */
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 32px 64px rgba(0,0,0,0.4)' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}
            >
              <Mail size={30} style={{ color: '#22c55e' }} />
            </div>
            <h2 className="text-xl font-bold mb-2">Check your inbox</h2>
            <p className="text-sm mb-2" style={{ color: '#71717a' }}>
              {hasSupabaseConfig
                ? <>We sent a password reset link to <strong style={{ color: '#f8f8f8' }}>{email}</strong>.</>
                : 'Demo mode — no email was actually sent.'}
            </p>
            <p className="text-xs mb-8" style={{ color: '#52525b' }}>
              Didn't get it? Check your spam folder or try again.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setStatus('idle'); setEmail(''); }}
                className="btn-secondary w-full"
                style={{ padding: '0.75rem' }}
              >
                Try a different email
              </button>
              <Link href="/login" className="btn-primary w-full text-center justify-center" style={{ padding: '0.75rem' }}>
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          /* ── Form state ── */
          <div
            className="rounded-2xl p-8"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 32px 64px rgba(0,0,0,0.4)' }}
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Email */}
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === 'loading'}
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#52525b' }} />
                </div>
              </div>

              {/* Error */}
              {status === 'error' && (
                <div
                  className="flex items-start gap-3 p-3.5 rounded-xl"
                  style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)' }}
                >
                  <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                  <p className="text-sm" style={{ color: '#fca5a5' }}>{errorMsg}</p>
                </div>
              )}

              {/* Submit */}
              <button
                id="forgot-submit"
                type="submit"
                disabled={status === 'loading' || !email.trim()}
                className="btn-primary w-full justify-center"
                style={{
                  opacity: status === 'loading' || !email.trim() ? 0.6 : 1,
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  padding: '0.875rem',
                  fontSize: '1rem',
                }}
              >
                {status === 'loading' ? (
                  <><Loader2 size={18} className="animate-spin" /> Sending reset link…</>
                ) : (
                  <><Send size={17} /> Send reset link</>
                )}
              </button>
            </form>

            {/* Back */}
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 mt-6 text-sm transition-colors"
              style={{ color: '#52525b', textDecoration: 'none' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#52525b')}
            >
              <ArrowLeft size={15} />
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
