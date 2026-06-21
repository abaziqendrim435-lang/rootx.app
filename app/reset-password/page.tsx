'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { updatePassword, supabaseClient, hasSupabaseConfig } from '@/lib/supabase-auth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'invalid'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Supabase sends the user here with a session via URL hash.
  // We need to detect if there's a valid recovery session.
  useEffect(() => {
    if (!supabaseClient) return;
    supabaseClient.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User arrived via the reset link — valid session
        setStatus('idle');
      }
    });

    // Check current session params from hash
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setStatus('idle');
    }
  }, []);

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
    if (!password || !confirm) return;

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
      await new Promise((r) => setTimeout(r, 900));
      setStatus('success');
      setTimeout(() => router.push('/dashboard'), 2000);
      return;
    }

    const { error } = await updatePassword(password);
    if (error) {
      setStatus('error');
      setErrorMsg(error);
    } else {
      setStatus('success');
      setTimeout(() => router.push('/dashboard'), 2000);
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center animate-fade-up">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)' }}
          >
            <CheckCircle2 size={36} style={{ color: '#22c55e' }} />
          </div>
          <h1 className="text-2xl font-black mb-2">Password updated!</h1>
          <p className="text-sm mb-6" style={{ color: '#71717a' }}>
            Your password has been changed. Redirecting to dashboard…
          </p>
          <Link href="/dashboard" className="btn-primary" style={{ padding: '0.75rem 2rem' }}>
            Go to Dashboard
          </Link>
        </div>
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
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)' }}
          >
            <ShieldCheck size={26} style={{ color: '#ef4444' }} />
          </div>
          <h1 className="text-3xl font-black mb-2">Set new password</h1>
          <p style={{ color: '#71717a', fontSize: '0.95rem' }}>
            Choose a strong password for your account
          </p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 32px 64px rgba(0,0,0,0.4)' }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* New password */}
            <div>
              <label htmlFor="reset-password" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
                New password
              </label>
              <div className="relative">
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={status === 'loading'}
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
                        style={{ background: passwordStrength >= n ? strengthColor : 'var(--color-border-bright)' }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium" style={{ color: strengthColor }}>{strengthLabel}</span>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label htmlFor="reset-confirm" className="block text-sm font-semibold mb-2" style={{ color: '#a1a1aa' }}>
                Confirm new password
              </label>
              <input
                id="reset-confirm"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="Repeat your new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={status === 'loading'}
                className="input-field"
                style={{
                  borderColor:
                    confirm && password !== confirm ? 'rgba(220,38,38,0.6)'
                    : confirm && password === confirm ? 'rgba(34,197,94,0.5)'
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

            {/* Submit */}
            <button
              id="reset-submit"
              type="submit"
              disabled={status === 'loading' || !password || !confirm}
              className="btn-primary w-full justify-center"
              style={{
                opacity: status === 'loading' || !password || !confirm ? 0.6 : 1,
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                padding: '0.875rem',
                fontSize: '1rem',
              }}
            >
              {status === 'loading' ? (
                <><Loader2 size={18} className="animate-spin" /> Updating password…</>
              ) : (
                <><ShieldCheck size={18} /> Update password</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
