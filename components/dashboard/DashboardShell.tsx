'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, LogOut } from 'lucide-react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { useAuth } from '@/components/AuthProvider';
import UserAvatar from '@/components/UserAvatar';
import PlanBadge from '@/components/PlanBadge';
import { usePlan } from '@/lib/use-plan';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout, isSupabaseEnabled } = useAuth();
  const { planId, loading: planLoading } = usePlan(user?.id);
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Sidebar */}
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        userEmail={user?.email ?? null}
      />

      {/* Main content area */}
      <div
        className="transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? '240px' : '0' }}
      >
        {/* Top bar */}
        <div
          className="sticky top-0 z-20 flex items-center gap-4 px-6 h-16"
          style={{
            background: 'rgba(7,7,9,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--color-border)',
              color: '#71717a',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#ef4444';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(220,38,38,0.35)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#71717a';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
            }}
            aria-label="Toggle sidebar"
          >
            <Menu size={16} />
          </button>
          <div className="h-4 w-px" style={{ background: 'var(--color-border)' }} />
          <span className="text-sm font-medium" style={{ color: '#52525b' }}>
            RootX Dashboard
          </span>

          <div className="flex-1" />

          {/* User section */}
          <div className="flex items-center gap-3">
            {/* Mode badge */}
            {isSupabaseEnabled && user ? (
              <div
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  color: '#22c55e',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
                Connected
              </div>
            ) : (
              <div
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: 'rgba(220,38,38,0.08)',
                  border: '1px solid rgba(220,38,38,0.2)',
                  color: '#ef4444',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
                Local mode
              </div>
            )}

            {/* Plan badge */}
            {!planLoading && (
              <div className="hidden sm:block">
                <PlanBadge planId={planId} size="sm" />
              </div>
            )}

            {/* User avatar chip → links to profile */}
            {user?.email && (
              <UserAvatar email={user.email} size={30} href="/profile" />
            )}

            {/* Logout */}
            {isSupabaseEnabled && (
              <button
                onClick={handleLogout}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--color-border)',
                  color: '#71717a',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = '#ef4444';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(220,38,38,0.35)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = '#71717a';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                }}
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Page content */}
        <div className="p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}
