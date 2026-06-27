'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Menu, X, Zap, LayoutDashboard, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import UserAvatar from '@/components/UserAvatar';

const navLinks = [
  { href: '/',        label: 'Home' },
  { href: '/agents',  label: 'Agents' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/request', label: 'Get Started' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, loading, logout, isSupabaseEnabled } = useAuth();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close both menus on route change
  useEffect(() => {
    setDropdownOpen(false);
    setIsOpen(false);
  }, [pathname]);

  async function handleLogout() {
    setDropdownOpen(false);
    setIsOpen(false);
    await logout();
    router.push('/');
  }

  // Show logged-in state if: Supabase enabled + user exists, OR demo mode + not loading
  const isLoggedIn = isSupabaseEnabled ? !!user : false;

  // Don't render nav user controls until auth is resolved (prevents flash)
  const authReady = !loading;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(7, 7, 9, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(31, 31, 37, 0.8)',
      }}
    >
      <div className="section-container">
        <nav className="flex items-center justify-between h-16">
          {/* ── Logo ── */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl tracking-tight"
            style={{ textDecoration: 'none' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                boxShadow: '0 0 16px rgba(220, 38, 38, 0.4)',
              }}
            >
              <Zap size={16} className="text-white" />
            </div>
            <span className="gradient-text">RootX</span>
          </Link>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium transition-colors duration-200"
                  style={{ color: isActive ? '#ef4444' : '#a1a1aa', textDecoration: 'none' }}
                  onMouseEnter={(e) => !isActive && ((e.target as HTMLElement).style.color = '#f8f8f8')}
                  onMouseLeave={(e) => !isActive && ((e.target as HTMLElement).style.color = '#a1a1aa')}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* ── Desktop CTA ── */}
          <div className="hidden md:flex items-center gap-3">
            {authReady && isLoggedIn && user ? (
              /* ─── Logged in: avatar dropdown ─── */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-all duration-200"
                  style={{
                    background: dropdownOpen ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${dropdownOpen ? 'rgba(220,38,38,0.3)' : 'var(--color-border)'}`,
                  }}
                  aria-label="Account menu"
                  aria-expanded={dropdownOpen}
                >
                  <UserAvatar email={user.email} size={28} />
                  <span className="text-sm font-medium max-w-[120px] truncate" style={{ color: '#e4e4e7' }}>
                    {user?.user_metadata?.display_name ?? user.email?.split('@')[0]}
                  </span>
                  <ChevronDown
                    size={14}
                    style={{
                      color: '#71717a',
                      transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>

                {/* Dropdown menu */}
                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden"
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                      zIndex: 100,
                    }}
                  >
                    {/* User info header */}
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <p className="text-xs font-bold truncate">{user?.user_metadata?.display_name ?? user.email?.split('@')[0]}</p>
                      <p className="text-xs truncate mt-0.5" style={{ color: '#71717a' }}>{user.email}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      {[
                        { href: '/profile',   icon: User,            label: 'Your Profile' },
                        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                      ].map(({ href, icon: Icon, label }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150"
                          style={{ color: '#a1a1aa', textDecoration: 'none' }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                            (e.currentTarget as HTMLElement).style.color = '#f8f8f8';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                            (e.currentTarget as HTMLElement).style.color = '#a1a1aa';
                          }}
                        >
                          <Icon size={15} />
                          {label}
                        </Link>
                      ))}
                    </div>

                    <div style={{ borderTop: '1px solid var(--color-border)' }} className="py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm w-full transition-all duration-150"
                        style={{ color: '#ef4444' }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.08)')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                      >
                        <LogOut size={15} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : authReady ? (
              /* ─── Guest ─── */
              <>
                {isSupabaseEnabled && (
                  <Link href="/login" className="btn-secondary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}>
                    Sign in
                  </Link>
                )}
                <Link href="/request" className="btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}>
                  Get Started →
                </Link>
              </>
            ) : (
              /* ─── Loading skeleton ─── */
              <div className="w-24 h-8 rounded-xl animate-pulse" style={{ background: 'var(--color-surface)' }} />
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: '#a1a1aa' }}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {/* ── Mobile menu ── */}
        {isOpen && (
          <div
            className="md:hidden py-4 pb-6 flex flex-col gap-3"
            style={{ borderTop: '1px solid rgba(31, 31, 37, 0.8)' }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium px-1 py-1.5"
                style={{ color: pathname === link.href ? '#ef4444' : '#a1a1aa', textDecoration: 'none' }}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="h-px my-1" style={{ background: 'var(--color-border)' }} />

            <div className="flex flex-col gap-2">
              {authReady && isLoggedIn && user ? (
                <>
                  {/* Mobile: avatar info row */}
                  <div className="flex items-center gap-3 px-1 py-2">
                    <UserAvatar email={user.email} size={36} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{user?.user_metadata?.display_name ?? user.email?.split('@')[0]}</p>
                      <p className="text-xs truncate" style={{ color: '#71717a' }}>{user.email}</p>
                    </div>
                  </div>
                  <Link href="/profile" className="btn-secondary text-center" onClick={() => setIsOpen(false)}>
                    Your Profile
                  </Link>
                  <Link href="/dashboard" className="btn-secondary text-center" onClick={() => setIsOpen(false)}>
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className="btn-secondary w-full text-center" style={{ color: '#ef4444' }}>
                    Sign out
                  </button>
                </>
              ) : authReady ? (
                <>
                  {isSupabaseEnabled && (
                    <Link href="/login" className="btn-secondary text-center" onClick={() => setIsOpen(false)}>
                      Sign in
                    </Link>
                  )}
                  <Link href="/signup" className="btn-secondary text-center" onClick={() => setIsOpen(false)}>
                    Create Account
                  </Link>
                  <Link href="/request" className="btn-primary text-center" onClick={() => setIsOpen(false)}>
                    Get Started →
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
