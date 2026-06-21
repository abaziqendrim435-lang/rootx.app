'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Eye, EyeOff, LogIn, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';
import { signIn, hasSupabaseConfig } from '@/lib/supabase-auth';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // If already logged in, go straight to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setStatus('loading');
    setErrorMsg('');

    if (!hasSupabaseConfig) {
      // Demo mode: any non-empty credentials "succeed"
      await new Promise((r) => setTimeout(r, 900));
      setStatus('success');
      setTimeout(() => router.push('/dashboard'), 1200);
      return;
    }

    const { error } = await signIn(email.trim(), password);

    if (error) {
      setStatus('error');
      setErrorMsg(
        error.toLowerCase().includes('invalid')
          ? 'Email or password is incorrect.'
          : error.toLowerCase().includes('confirm')
          ? 'Please check your email and confirm your account first.'
          : error
      );
    } else {
      setStatus('success');
      setTimeout(() => router.push('/dashboard'), 1000);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: '#ef4444' }} />
      </div>
    );
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

      {/* Glow orb */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '300px',
          background: 'radial-gradient(ellipse, rgba(220,38,38,0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6" style={{ textDecoration: 'none' }}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                boxShadow: '0 0 24px rgba(220,38,38,0.5)',
              }}
            >
              <Zap size={20} className="text-white" />
            </div>
            <span className="gradient-text text-2xl font-black">RootX</span>
          </Link>
          <h1 className="text-3xl font-black mb-2">Welcome back</h1>
          <p style={{ color: '#71717a', fontSize: '0.95rem' }}>
            Sign in to access your AI dashboard
          </p>
        </div>

        {/* Demo mode notice */}
        {!hasSupabaseConfig && (
          <div
            className="flex items-start gap-3 p-4 rounded-xl mb-6"
            style={{
              background: 'rgba(234,179,8,0.06)',
              border: '1px solid rgba(234,179,8,0.2)',
            }}
          >
            <Info size={16} style={{ color: '#eab308', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="text-sm font-semibold mb-0.5" style={{ color: '#eab308' }}>Demo mode</p>
              <p className="text-xs leading-relaxed" style={{ color: '#71717a' }}>
                Supabase is not configured. Any email + password will work for the demo. Add{' '}
                <code className="font-mono text-xs" style={{ color: '#a1a1aa' }}>NEXT_PUBLIC_SUPABASE_URL</code>{' '}
                and{' '}
                <code className="font-mono text-xs" style={{ color: '#a1a1aa' }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{' '}
                to <code className="font-mono text-xs" style={{ color: '#a1a1aa' }}>.env.local</code> to enable real auth.
              </p>
            </div>
          </div>
        )}

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
          }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading' || status === 'success'}
                className="input-field"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="login-password" className="text-sm font-semibold" style={{ color: '#a1a1aa' }}>
                  Password
                </label>
                {hasSupabaseConfig && (
                  <Link
                    href="/forgot-password"
                    className="text-xs transition-colors"
                    style={{ color: '#52525b', textDecoration: 'none' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#52525b')}
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={status === 'loading' || status === 'success'}
                  className="input-field"
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#52525b' }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
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

            {/* Success */}
            {status === 'success' && (
              <div
                className="flex items-center gap-3 p-3.5 rounded-xl"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}
              >
                <CheckCircle2 size={16} style={{ color: '#22c55e' }} />
                <p className="text-sm font-medium" style={{ color: '#86efac' }}>
                  {hasSupabaseConfig ? 'Signed in! Redirecting…' : 'Demo access granted! Redirecting…'}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={status === 'loading' || status === 'success' || !email.trim() || !password}
              className="btn-primary w-full justify-center"
              style={{
                opacity: status === 'loading' || status === 'success' || !email.trim() || !password ? 0.6 : 1,
                cursor: status === 'loading' || status === 'success' ? 'not-allowed' : 'pointer',
                padding: '0.875rem',
                fontSize: '1rem',
              }}
            >
              {status === 'loading' ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in…
                </>
              ) : status === 'success' ? (
                <>
                  <CheckCircle2 size={18} />
                  Success!
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign in
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
            <span className="text-xs" style={{ color: '#3f3f46' }}>
              New to RootX?
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
          </div>

          <Link
            href="/signup"
            className="btn-secondary w-full text-center"
            style={{ padding: '0.75rem', fontSize: '0.95rem' }}
          >
            Create an account →
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: '#3f3f46' }}>
          By signing in you agree to our{' '}
          <span style={{ color: '#52525b' }}>Terms of Service</span> and{' '}
          <span style={{ color: '#52525b' }}>Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
