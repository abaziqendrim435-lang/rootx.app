'use client';

import { useState } from 'react';
import {
  Settings, Bell, Shield, Palette, Globe, Loader2, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

type Tab = 'notifications' | 'appearance' | 'privacy' | 'api';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance',    label: 'Appearance',    icon: Palette },
  { id: 'privacy',       label: 'Privacy',       icon: Shield },
  { id: 'api',           label: 'API Access',    icon: Globe },
];

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className="relative w-10 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
      style={{ background: enabled ? '#dc2626' : 'var(--color-border)' }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200"
        style={{ transform: enabled ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('notifications');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Notification settings
  const [notifs, setNotifs] = useState({
    email_generations: true,
    email_billing: true,
    email_product: false,
    email_weekly: true,
    browser_push: false,
  });

  // Appearance settings
  const [appearance, setAppearance] = useState({
    dense_mode: false,
    reduced_motion: false,
    high_contrast: false,
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    analytics: true,
    crash_reports: true,
    personalization: false,
  });

  // API key mock
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const mockApiKey = 'rx_live_••••••••••••••••••••••';
  const realApiKey = 'rx_live_wT8kP2mNqRvA9sHuJxYbCdEzL3fGoQi';

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 900);
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.25)' }}>
            <Settings size={16} style={{ color: '#ef4444' }} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>Settings</span>
        </div>
        <h1 className="text-3xl font-black mb-1">Account Settings</h1>
        <p style={{ color: '#71717a', fontSize: '0.95rem' }}>
          Manage your notifications, appearance, and privacy preferences.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab sidebar */}
        <div className="lg:w-48 flex-shrink-0">
          <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap"
                style={{
                  background: activeTab === id ? 'rgba(220,38,38,0.12)' : 'transparent',
                  border: activeTab === id ? '1px solid rgba(220,38,38,0.2)' : '1px solid transparent',
                  color: activeTab === id ? '#ef4444' : '#71717a',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content panel */}
        <div className="flex-1 rounded-2xl p-6"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>

          {/* ── Notifications ── */}
          {activeTab === 'notifications' && (
            <div className="flex flex-col gap-1">
              <h2 className="font-bold text-base mb-5">Email Notifications</h2>
              {[
                { key: 'email_generations' as const, label: 'Generation complete', desc: 'Email when an AI generation finishes' },
                { key: 'email_billing'     as const, label: 'Billing & invoices',   desc: 'Receipts, plan changes, payment alerts' },
                { key: 'email_product'     as const, label: 'Product updates',      desc: 'New features and changelog announcements' },
                { key: 'email_weekly'      as const, label: 'Weekly digest',        desc: 'Summary of your usage and activity' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-4"
                  style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#52525b' }}>{desc}</p>
                  </div>
                  <Toggle enabled={notifs[key]} onChange={(v) => setNotifs((n) => ({ ...n, [key]: v }))} />
                </div>
              ))}
              <h2 className="font-bold text-base mt-6 mb-4">Push Notifications</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Browser push</p>
                  <p className="text-xs mt-0.5" style={{ color: '#52525b' }}>Real-time alerts in your browser</p>
                </div>
                <Toggle enabled={notifs.browser_push} onChange={(v) => setNotifs((n) => ({ ...n, browser_push: v }))} />
              </div>
            </div>
          )}

          {/* ── Appearance ── */}
          {activeTab === 'appearance' && (
            <div className="flex flex-col gap-1">
              <h2 className="font-bold text-base mb-5">Display Preferences</h2>
              {[
                { key: 'dense_mode'       as const, label: 'Dense mode',       desc: 'Compact spacing for more content on screen' },
                { key: 'reduced_motion'   as const, label: 'Reduced motion',   desc: 'Minimize animations and transitions' },
                { key: 'high_contrast'    as const, label: 'High contrast',    desc: 'Increase border and text contrast' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-4"
                  style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#52525b' }}>{desc}</p>
                  </div>
                  <Toggle enabled={appearance[key]} onChange={(v) => setAppearance((a) => ({ ...a, [key]: v }))} />
                </div>
              ))}
              <div className="mt-6 p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)' }}>
                <p className="text-xs" style={{ color: '#52525b' }}>
                  RootX uses a dark theme only. Light mode is not available in the current version.
                </p>
              </div>
            </div>
          )}

          {/* ── Privacy ── */}
          {activeTab === 'privacy' && (
            <div className="flex flex-col gap-1">
              <h2 className="font-bold text-base mb-5">Privacy & Data</h2>
              {[
                { key: 'analytics'        as const, label: 'Usage analytics',    desc: 'Help us improve by sharing anonymized usage data' },
                { key: 'crash_reports'    as const, label: 'Crash reports',      desc: 'Automatically send error reports to our team' },
                { key: 'personalization'  as const, label: 'Personalization',    desc: 'Let AI agents adapt to your content style over time' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-4"
                  style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#52525b' }}>{desc}</p>
                  </div>
                  <Toggle enabled={privacy[key]} onChange={(v) => setPrivacy((p) => ({ ...p, [key]: v }))} />
                </div>
              ))}
              <div className="mt-6">
                <h3 className="font-bold text-sm mb-3" style={{ color: '#ef4444' }}>Danger Zone</h3>
                <div className="rounded-xl p-4 flex items-center justify-between"
                  style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.15)' }}>
                  <div>
                    <p className="text-sm font-medium">Delete all my data</p>
                    <p className="text-xs mt-0.5" style={{ color: '#52525b' }}>
                      Permanently deletes your account and all generations.
                    </p>
                  </div>
                  <button className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#ef4444' }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── API ── */}
          {activeTab === 'api' && (
            <div className="flex flex-col gap-5">
              <h2 className="font-bold text-base">API Access</h2>
              <div className="p-4 rounded-xl"
                style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)' }}>
                <p className="text-xs leading-relaxed" style={{ color: '#60a5fa' }}>
                  Use your API key to integrate RootX agents directly into your own applications.
                  Keep it secret — never expose it in client-side code.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#a1a1aa' }}>Your API Key</label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    type={apiKeyVisible ? 'text' : 'password'}
                    value={apiKeyVisible ? realApiKey : mockApiKey}
                    className="input-field flex-1 font-mono text-sm"
                  />
                  <button
                    onClick={() => setApiKeyVisible(!apiKeyVisible)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                      color: '#a1a1aa',
                    }}
                  >
                    {apiKeyVisible ? 'Hide' : 'Reveal'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#a1a1aa' }}>Account Email</label>
                <input
                  readOnly
                  value={user?.email ?? 'Not connected'}
                  className="input-field w-full text-sm"
                  style={{ color: '#52525b' }}
                />
              </div>
              <div className="flex gap-3">
                <button className="btn-secondary flex-1 text-sm">Regenerate Key</button>
                <a
                  href="https://docs.rootx.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex-1 text-sm"
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                >
                  View API Docs
                </a>
              </div>
            </div>
          )}

          {/* Save button — shown on tabs with toggles */}
          {(activeTab === 'notifications' || activeTab === 'appearance' || activeTab === 'privacy') && (
            <div className="flex items-center gap-4 mt-6 pt-5" style={{ borderTop: '1px solid var(--color-border)' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
                style={{ padding: '0.6rem 1.5rem', fontSize: '0.875rem' }}
              >
                {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : 'Save Changes'}
              </button>
              {saved && (
                <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#22c55e' }}>
                  <CheckCircle2 size={15} /> Saved!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
