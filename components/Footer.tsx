'use client';

import Link from 'next/link';
import { Zap, X, Globe, GitBranch } from 'lucide-react';

const footerLinks = {
  Product: [
    { label: 'Agent Marketplace', href: '/agents' },
    { label: 'Request Setup', href: '/request' },
    { label: 'Pricing', href: '/agents' },
  ],
  Company: [
    { label: 'About', href: '/' },
    { label: 'Blog', href: '/' },
    { label: 'Careers', href: '/' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/' },
    { label: 'Terms of Service', href: '/' },
    { label: 'Cookie Policy', href: '/' },
  ],
};

export default function Footer() {
  return (
    <footer
      style={{
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <div className="section-container py-16">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4" style={{ textDecoration: 'none' }}>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                  boxShadow: '0 0 16px rgba(220, 38, 38, 0.3)',
                }}
              >
                <Zap size={16} className="text-white" />
              </div>
              <span className="gradient-text font-bold text-xl">RootX</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#71717a', maxWidth: '280px' }}>
              The AI Agent Marketplace built for serious businesses. Deploy automation that works 24/7.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              {[
                { icon: X, href: '#', label: 'X (Twitter)' },
                { icon: Globe, href: '#', label: 'LinkedIn' },
                { icon: GitBranch, href: '#', label: 'GitHub' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
                  style={{
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    color: '#71717a',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = 'rgba(220,38,38,0.4)';
                    el.style.color = '#ef4444';
                    el.style.background = 'rgba(220,38,38,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = 'var(--color-border)';
                    el.style.color = '#71717a';
                    el.style.background = 'var(--color-surface-2)';
                  }}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-sm font-semibold mb-4" style={{ color: '#f8f8f8' }}>
                {group}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors duration-200"
                      style={{ color: '#71717a', textDecoration: 'none' }}
                      onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#a1a1aa')}
                      onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#71717a')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <p className="text-xs" style={{ color: '#52525b' }}>
            © {new Date().getFullYear()} RootX. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: '#22c55e', boxShadow: '0 0 8px rgba(34, 197, 94, 0.5)' }}
            />
            <span className="text-xs" style={{ color: '#52525b' }}>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
