'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, History, Bookmark, Zap, ChevronRight,
  X, LogOut, CreditCard, Bot, BarChart3, HeadphonesIcon,
  Settings, User, ShoppingCart,
} from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';

const sidebarSections = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard',         icon: LayoutDashboard,   label: 'Dashboard' },
      { href: '/dashboard/usage',   icon: BarChart3,         label: 'Usage Stats' },
    ],
  },
  {
    label: 'My Workspace',
    items: [
      { href: '/dashboard/shopify', icon: ShoppingCart,      label: 'Shopify Agent' },
      { href: '/dashboard/agents',  icon: Bot,               label: 'My Agents' },
      { href: '/dashboard/history', icon: History,           label: 'Generation History' },
      { href: '/dashboard/saved',   icon: Bookmark,          label: 'Saved Items' },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/billing',                icon: CreditCard,        label: 'Billing & Plan' },
      { href: '/profile',                icon: User,              label: 'Profile' },
      { href: '/dashboard/tickets',      icon: HeadphonesIcon,    label: 'Support Tickets' },
      { href: '/dashboard/settings',     icon: Settings,          label: 'Settings' },
    ],
  },
];

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
  userEmail?: string | null;
}

export default function DashboardSidebar({ isOpen, onClose, onLogout, userEmail }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className="fixed top-0 left-0 z-40 h-screen flex flex-col transition-transform duration-300"
        style={{
          width: '240px',
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Logo strip */}
        <div
          className="flex items-center justify-between px-5 h-16 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <Link href="/" className="flex items-center gap-2 font-bold text-lg" style={{ textDecoration: 'none' }}>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                boxShadow: '0 0 14px rgba(220,38,38,0.4)',
              }}
            >
              <Zap size={14} className="text-white" />
            </div>
            <span className="gradient-text">RootX</span>
          </Link>
          <button
            onClick={onClose}
            className="md:hidden w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#71717a' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {sidebarSections.map((section) => (
            <div key={section.label} className="mb-5">
              <p
                className="px-3 mb-1.5 text-xs font-bold uppercase tracking-widest"
                style={{ color: '#3f3f46' }}
              >
                {section.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                      style={{
                        background: isActive ? 'rgba(220,38,38,0.12)' : 'transparent',
                        color: isActive ? '#ef4444' : '#71717a',
                        border: isActive ? '1px solid rgba(220,38,38,0.2)' : '1px solid transparent',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                          (e.currentTarget as HTMLElement).style.color = '#f8f8f8';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                          (e.currentTarget as HTMLElement).style.color = '#71717a';
                        }
                      }}
                    >
                      <item.icon size={16} style={{ flexShrink: 0 }} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {isActive && <ChevronRight size={14} style={{ opacity: 0.6 }} />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: user + logout */}
        <div className="p-4 flex-shrink-0 flex flex-col gap-2" style={{ borderTop: '1px solid var(--color-border)' }}>
          {/* User email chip → links to profile */}
          {userEmail && (
            <Link
              href="/profile"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--color-border)',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(220,38,38,0.25)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
              }}
            >
              <UserAvatar email={userEmail} size={26} />
              <span className="text-xs truncate flex-1" style={{ color: '#71717a' }}>{userEmail}</span>
            </Link>
          )}

          {/* Logout button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all duration-200"
              style={{
                background: 'transparent',
                border: '1px solid transparent',
                color: '#71717a',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.08)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(220,38,38,0.2)';
                (e.currentTarget as HTMLElement).style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                (e.currentTarget as HTMLElement).style.color = '#71717a';
              }}
            >
              <LogOut size={15} />
              Sign Out
            </button>
          )}

          <Link
            href="/agents"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all duration-200"
            style={{
              background: 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.2)',
              color: '#ef4444',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.16)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.08)')}
          >
            <Zap size={15} />
            Browse All Agents
          </Link>
        </div>
      </aside>
    </>
  );
}
