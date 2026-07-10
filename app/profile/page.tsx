'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Mail, Edit3, Save, AlertCircle, CheckCircle2,
  Loader2, LogOut, ShieldCheck, ArrowLeft, Eye, EyeOff,
  Calendar, Zap, LayoutDashboard, Key,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { updateProfile, updatePassword, resetPasswordForEmail, hasSupabaseConfig } from '@/lib/supabase-auth';

function getInitials(email: string | null | undefined): string {
  if (!email) return '?';
  const local = email.split('@')[0];
  const parts = local.split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

function getAvatarColor(email: string | null | undefined): string {
  const colors = [
    'linear-gradient(135deg, #dc2626, #991b1b)',
    'linear-gradient(135deg, #7c3aed, #4c1d95)',
    'linear-gradient(135deg, #0284c7, #075985)',
    'linear-gradient(135deg, #059669, #064e3b)',
    'linear-gradient(135deg, #d97706, #92400e)',
    'linear-gradient(135deg, #db2777, #831843)',
  ];
  if (!email) return colors[0];
  const code = email.charCodeAt(0) + email.charCodeAt(email.length - 1);
  return colors[code % colors.length];
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout, isSupabaseEnabled, refresh } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameStatus, setNameStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [nameError, setNameError] = useState('');

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwStatus, setPwStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [pwError, setPwError] = useState('');

  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'sent'>('idle');

  useEffect(() => {
    if (!loading && !user && isSupabaseEnabled) {
      router.replace('/login');
    }
  }, [user, loading, isSupabaseEnabled, router]);

  useEffect(() => {
    if (user?.user_metadata?.display_name) {
      const t = setTimeout(() => {
        setDisplayName(user.user_metadata.display_name);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [user]);

  const initials = getInitials(user?.email);
  const avatarGradient = getAvatarColor(user?.email);
  const joinedAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  // ── Save display name ──────────────────────────────────────────
  async function handleSaveName() {
    if (!displayName.trim()) return;
    setNameStatus('loading');
    setNameError('');

    if (!hasSupabaseConfig) {
      await new Promise((r) => setTimeout(r, 700));
      setNameStatus('success');
      setEditingName(false);
      setTimeout(() => setNameStatus('idle'), 2500);
      return;
    }

    const { error } = await updateProfile(displayName.trim());
    if (error) {
      setNameStatus('error');
      setNameError(error);
    } else {
      setNameStatus('success');
      setEditingName(false);
      await refresh();
      setTimeout(() => setNameStatus('idle'), 2500);
    }
  }

  // ── Change password ────────────────────────────────────────────
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setPwStatus('error');
      setPwError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPwStatus('error');
      setPwError('Password must be at least 8 characters.');
      return;
    }

    setPwStatus('loading');
    setPwError('');

    if (!hasSupabaseConfig) {
      await new Promise((r) => setTimeout(r, 800));
      setPwStatus('success');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => { setPwStatus('idle'); setShowChangePassword(false); }, 2500);
      return;
    }

    const { error } = await updatePassword(newPassword);
    if (error) {
      setPwStatus('error');
      setPwError(error);
    } else {
      setPwStatus('success');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => { setPwStatus('idle'); setShowChangePassword(false); }, 2500);
    }
  }

  // ── Send reset email ───────────────────────────────────────────
  async function handleResetEmail() {
    if (!user?.email) return;
    setResetStatus('loading');
    if (!hasSupabaseConfig) {
      await new Promise((r) => setTimeout(r, 700));
      setResetStatus('sent');
      return;
    }
    await resetPasswordForEmail(user.email);
    setResetStatus('sent');
  }

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  const passwordStrength = (() => {
    if (newPassword.length === 0) return 0;
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return score;
  })();
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'][passwordStrength];
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: '#ef4444' }} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-24 px-4"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(220,38,38,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-2xl mx-auto animate-fade-up">
        {/* Back nav */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: '#52525b', textDecoration: 'none' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#52525b')}
          >
            <ArrowLeft size={15} />
            Dashboard
          </Link>
          <span style={{ color: '#3f3f46' }}>/</span>
          <span className="text-sm font-medium" style={{ color: '#a1a1aa' }}>Profile</span>
        </div>

        {/* ── Profile header ── */}
        <div
          className="rounded-2xl p-8 mb-6"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.35)',
          }}
        >
          <div className="flex items-start gap-6 flex-wrap">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-2xl flex-shrink-0"
              style={{ background: avatarGradient, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
            >
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              {/* Display name */}
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                {editingName ? (
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') { setEditingName(false); setDisplayName(user?.user_metadata?.display_name ?? ''); }
                    }}
                    autoFocus
                    className="input-field"
                    style={{ maxWidth: '260px', padding: '0.5rem 0.75rem', fontSize: '1.125rem', fontWeight: 700 }}
                    placeholder="Your name"
                  />
                ) : (
                  <h1 className="text-2xl font-black truncate">
                    {displayName || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'}
                  </h1>
                )}
                <button
                  onClick={() => editingName ? handleSaveName() : setEditingName(true)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0"
                  style={{
                    background: editingName ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${editingName ? 'rgba(34,197,94,0.3)' : 'var(--color-border)'}`,
                    color: editingName ? '#22c55e' : '#71717a',
                  }}
                  title={editingName ? 'Save name' : 'Edit name'}
                >
                  {nameStatus === 'loading' ? <Loader2 size={14} className="animate-spin" />
                    : nameStatus === 'success' ? <CheckCircle2 size={14} />
                    : editingName ? <Save size={14} />
                    : <Edit3 size={14} />}
                </button>
              </div>

              {/* Email */}
              <div className="flex items-center gap-2 mb-3">
                <Mail size={13} style={{ color: '#52525b' }} />
                <span className="text-sm" style={{ color: '#71717a' }}>{user?.email ?? 'No email'}</span>
                {isSupabaseEnabled && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
                  >
                    Verified
                  </span>
                )}
              </div>

              {/* Meta chips */}
              <div className="flex flex-wrap gap-2">
                {joinedAt && (
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: '#52525b' }}
                  >
                    <Calendar size={11} />
                    Joined {joinedAt}
                  </div>
                )}
                {!hasSupabaseConfig && (
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                    style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', color: '#eab308' }}
                  >
                    <Zap size={11} />
                    Demo mode
                  </div>
                )}
              </div>

              {/* Name error */}
              {nameStatus === 'error' && (
                <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{nameError}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Quick links ── */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 p-4 rounded-xl transition-all duration-200 group"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', textDecoration: 'none' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(220,38,38,0.3)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.1)' }}>
              <LayoutDashboard size={18} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <p className="text-sm font-semibold">Dashboard</p>
              <p className="text-xs" style={{ color: '#71717a' }}>View generations</p>
            </div>
          </Link>
          <Link
            href="/agents"
            className="flex items-center gap-3 p-4 rounded-xl transition-all duration-200"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', textDecoration: 'none' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(220,38,38,0.3)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.1)' }}>
              <Zap size={18} style={{ color: '#7c3aed' }} />
            </div>
            <div>
              <p className="text-sm font-semibold">AI Agents</p>
              <p className="text-xs" style={{ color: '#71717a' }}>Browse all agents</p>
            </div>
          </Link>
        </div>

        {/* ── Security section ── */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
        >
          <div className="flex items-center gap-3 mb-5">
            <ShieldCheck size={18} style={{ color: '#ef4444' }} />
            <h2 className="text-lg font-bold">Security</h2>
          </div>

          {/* Change password toggle */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Password</p>
                <p className="text-xs" style={{ color: '#71717a' }}>Last updated: unknown</p>
              </div>
              <button
                onClick={() => setShowChangePassword(!showChangePassword)}
                className="btn-secondary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
              >
                <Key size={13} />
                Change
              </button>
            </div>

            {/* Password change form */}
            {showChangePassword && (
              <form onSubmit={handleChangePassword} className="mt-4 flex flex-col gap-4">
                <div
                  className="h-px"
                  style={{ background: 'var(--color-border)' }}
                />
                {/* New password */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a1a1aa' }}>
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={pwStatus === 'loading' || pwStatus === 'success'}
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
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex gap-1 flex-1">
                        {[1, 2, 3, 4].map((n) => (
                          <div
                            key={n}
                            className="h-0.5 flex-1 rounded-full transition-all duration-300"
                            style={{ background: passwordStrength >= n ? strengthColor : 'var(--color-border)' }}
                          />
                        ))}
                      </div>
                      <span className="text-xs" style={{ color: strengthColor }}>{strengthLabel}</span>
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a1a1aa' }}>
                    Confirm new password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={pwStatus === 'loading' || pwStatus === 'success'}
                    className="input-field"
                    style={{
                      borderColor:
                        confirmPassword && newPassword !== confirmPassword ? 'rgba(220,38,38,0.6)'
                        : confirmPassword && newPassword === confirmPassword ? 'rgba(34,197,94,0.5)'
                        : undefined,
                    }}
                  />
                </div>

                {/* PW Error */}
                {pwStatus === 'error' && (
                  <div
                    className="flex items-center gap-2 p-3 rounded-xl"
                    style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)' }}
                  >
                    <AlertCircle size={14} style={{ color: '#ef4444' }} />
                    <p className="text-xs" style={{ color: '#fca5a5' }}>{pwError}</p>
                  </div>
                )}
                {pwStatus === 'success' && (
                  <div
                    className="flex items-center gap-2 p-3 rounded-xl"
                    style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}
                  >
                    <CheckCircle2 size={14} style={{ color: '#22c55e' }} />
                    <p className="text-xs font-medium" style={{ color: '#86efac' }}>Password updated successfully!</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={pwStatus === 'loading' || pwStatus === 'success' || !newPassword || !confirmPassword}
                    className="btn-primary flex-1 justify-center"
                    style={{
                      padding: '0.625rem',
                      opacity: pwStatus === 'loading' || !newPassword || !confirmPassword ? 0.6 : 1,
                    }}
                  >
                    {pwStatus === 'loading' ? <Loader2 size={15} className="animate-spin" />
                      : pwStatus === 'success' ? <CheckCircle2 size={15} />
                      : <Save size={15} />}
                    {pwStatus === 'loading' ? 'Saving…' : pwStatus === 'success' ? 'Saved!' : 'Save password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowChangePassword(false); setNewPassword(''); setConfirmPassword(''); setPwStatus('idle'); }}
                    className="btn-secondary"
                    style={{ padding: '0.625rem 1rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Reset via email */}
          {hasSupabaseConfig && (
            <div
              className="pt-4"
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Forgot your password?</p>
                  <p className="text-xs" style={{ color: '#71717a' }}>Send a reset link to your email</p>
                </div>
                <button
                  onClick={handleResetEmail}
                  disabled={resetStatus === 'loading' || resetStatus === 'sent'}
                  className="btn-secondary"
                  style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', opacity: resetStatus === 'sent' ? 0.7 : 1 }}
                >
                  {resetStatus === 'loading' ? <Loader2 size={13} className="animate-spin" />
                    : resetStatus === 'sent' ? <CheckCircle2 size={13} style={{ color: '#22c55e' }} />
                    : <Mail size={13} />}
                  {resetStatus === 'sent' ? 'Email sent!' : 'Send reset email'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Sign out ── */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Sign out</p>
              <p className="text-xs" style={{ color: '#71717a' }}>Sign out from all devices</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: 'rgba(220,38,38,0.08)',
                border: '1px solid rgba(220,38,38,0.2)',
                color: '#ef4444',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.15)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.08)'; }}
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </div>

        {/* Bottom padding */}
        <div className="h-12" />
      </div>
    </div>
  );
}
