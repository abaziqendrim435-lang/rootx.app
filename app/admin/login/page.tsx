'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, Zap } from 'lucide-react';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push('/admin');
      router.refresh();
    } else {
      setError('Incorrect password. Try again.');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: 'var(--color-bg)',
        paddingTop: '64px',
      }}
    >
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.07) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm mx-auto px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              boxShadow: '0 0 30px rgba(220, 38, 38, 0.4)',
            }}
          >
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-1">
            <span className="gradient-text">RootX</span> Admin
          </h1>
          <p className="text-sm" style={{ color: '#52525b' }}>
            Restricted access — authorized personnel only
          </p>
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="admin-password"
                className="block text-sm font-medium mb-2"
                style={{ color: '#a1a1aa' }}
              >
                Admin Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#52525b' }}
                />
                <input
                  id="admin-password"
                  type="password"
                  required
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '2.25rem' }}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div
                className="text-sm p-3 rounded-lg"
                style={{
                  background: 'rgba(220,38,38,0.1)',
                  border: '1px solid rgba(220,38,38,0.3)',
                  color: '#ef4444',
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                justifyContent: 'center',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Checking...
                </>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>

          <p className="text-xs text-center mt-5" style={{ color: '#3f3f46' }}>
            Default password:{' '}
            <code
              className="px-1 py-0.5 rounded"
              style={{ background: 'var(--color-surface-2)', color: '#71717a' }}
            >
              rootx_admin_2024
            </code>
            {' '}(set ADMIN_PASSWORD in .env.local)
          </p>
        </div>
      </div>
    </div>
  );
}
