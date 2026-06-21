'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2, Loader2, Info, Mail } from 'lucide-react';
import { signUp, hasSupabaseConfig } from '@/lib/supabase-auth';
import { useAuth } from '@/components/AuthProvider';

export default function SignupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'confirm-email'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Already logged in → dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const passwordStrength = (() => {
    if (password.length === 0) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength];
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'][passwordStrength];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password || !confirm) return;

    if (password !== confirm) {
      setStatus('error');
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setStatus('error');
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    if (!hasSupabaseConfig) {
      // Demo mode
      await new Promise((r) => setTimeout(r, 900));
      setStatus('success');
      setTimeout(() => router.push('/dashboard'), 1200);
      return;
    }

    const { error } = await signUp(email.trim(), password);

    if (error) {
      setStatus('error');
      setErrorMsg(
        error.toLowerCase().includes('already')
          ? 'An account with this email already exists. Try signing in.'
          : error
      );
    } else {
      // Supabase by default sends a confirmation email
      setStatus('confirm-email');
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
          <h1 className="text-3xl font-black mb-2">Create your account</h1>
          <p style={{ color: '#71717a', fontSize: '0.95rem' }}>
            Join RootX and start automating with AI agents
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
                Supabase is not configured. Signing up will grant dashboard access for this session.
              </p>
            </div>
          </div>
        )}

        {/* Email confirmation state */}
        {status === 'confirm-email' ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}
            >
              <Mail size={28} style={{ color: '#22c55e' }} />
            </div>
            <h2 className="text-xl font-bold mb-2">Check your email</h2>
            <p className="text-sm mb-6" style={{ color: '#71717a' }}>
              We sent a confirmation link to <strong style={{ color: '#f8f8f8' }}>{email}</strong>.
              Click it to activate your account, then sign in.
            </p>
            <Link href="/login" className="btn-primary w-full text-center justify-center" style={{ padding: '0.75rem' }}>
              Go to Sign In →
            </Link>
          </div>
        ) : (
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
                <label htmlFor="signup-email" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
                  Email address
                </label>
                <input
                  id="signup-email"
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
                <label htmlFor="signup-password" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
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
                {/* Strength bar */}
                {password.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4].map((n) => (
                        <div
                          key={n}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{
                            background: passwordStrength >= n ? strengthColor : 'var(--color-border-bright)',
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium" style={{ color: strengthColor }}>
                      {strengthLabel}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label htmlFor="signup-confirm" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
                  Confirm password
                </label>
                <input
                  id="signup-confirm"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={status === 'loading' || status === 'success'}
                  className="input-field"
                  style={{
                    borderColor:
                      confirm && password !== confirm
                        ? 'rgba(220,38,38,0.6)'
                        : confirm && password === confirm
                        ? 'rgba(34,197,94,0.5)'
                        : undefined,
                  }}
                />
                {confirm && password !== confirm && (
                  <p className="text-xs mt-1" style={{ color: '#ef4444' }}>Passwords do not match</p>
                )}
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

              {/* Success (demo mode) */}
              {status === 'success' && (
                <div
                  className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}
                >
                  <CheckCircle2 size={16} style={{ color: '#22c55e' }} />
                  <p className="text-sm font-medium" style={{ color: '#86efac' }}>Account created! Redirecting…</p>
                </div>
              )}

              {/* Submit */}
              <button
                id="signup-submit"
                type="submit"
                disabled={status === 'loading' || status === 'success' || !email.trim() || !password || !confirm}
                className="btn-primary w-full justify-center"
                style={{
                  opacity: status === 'loading' || status === 'success' || !email.trim() || !password || !confirm ? 0.6 : 1,
                  cursor: status === 'loading' || status === 'success' ? 'not-allowed' : 'pointer',
                  padding: '0.875rem',
                  fontSize: '1rem',
                }}
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating account…
                  </>
                ) : status === 'success' ? (
                  <>
                    <CheckCircle2 size={18} />
                    Done!
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Create account
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
              <span className="text-xs" style={{ color: '#3f3f46' }}>
                Already have an account?
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
            </div>

            <Link
              href="/login"
              className="btn-secondary w-full text-center"
              style={{ padding: '0.75rem', fontSize: '0.95rem' }}
            >
              Sign in instead →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
