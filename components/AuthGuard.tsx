'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Wraps protected pages. In demo mode (no Supabase config):
 *   - Shows a local-storage based demo dashboard (no redirect)
 * In live mode (Supabase configured):
 *   - Redirects unauthenticated users to /login
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, isSupabaseEnabled } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect when Supabase is configured AND user is confirmed to be logged out
    if (isSupabaseEnabled && !loading && !user) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, isSupabaseEnabled, router, pathname]);

  // While checking session — show spinner
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-bg)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)' }}
          >
            <Loader2 size={22} className="animate-spin" style={{ color: '#ef4444' }} />
          </div>
          <p className="text-sm" style={{ color: '#52525b' }}>
            Checking session…
          </p>
        </div>
      </div>
    );
  }

  // Supabase enabled but not logged in — show redirect blocker
  if (isSupabaseEnabled && !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-bg)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <Lock size={22} style={{ color: '#52525b' }} />
          <p className="text-sm" style={{ color: '#52525b' }}>Redirecting to login…</p>
        </div>
      </div>
    );
  }

  // Either demo mode (no Supabase) or authenticated — render children
  return <>{children}</>;
}
