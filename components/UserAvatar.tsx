'use client';

import Link from 'next/link';

interface UserAvatarProps {
  email: string | null | undefined;
  size?: number;  // px size of the circle
  href?: string;  // if set, wraps in a link
  className?: string;
}

function getInitials(email: string | null | undefined): string {
  if (!email) return '?';
  const local = email.split('@')[0];
  const parts = local.split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

function getAvatarGradient(email: string | null | undefined): string {
  const palettes = [
    'linear-gradient(135deg, #dc2626, #991b1b)',   // red
    'linear-gradient(135deg, #7c3aed, #4c1d95)',   // purple
    'linear-gradient(135deg, #0284c7, #075985)',   // blue
    'linear-gradient(135deg, #059669, #064e3b)',   // green
    'linear-gradient(135deg, #d97706, #92400e)',   // amber
    'linear-gradient(135deg, #db2777, #831843)',   // pink
    'linear-gradient(135deg, #0891b2, #164e63)',   // cyan
    'linear-gradient(135deg, #65a30d, #365314)',   // lime
  ];
  if (!email) return palettes[0];
  const code = email.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return palettes[code % palettes.length];
}

export { getInitials, getAvatarGradient };

export default function UserAvatar({ email, size = 32, href, className = '' }: UserAvatarProps) {
  const initials = getInitials(email);
  const gradient = getAvatarGradient(email);
  const fontSize = Math.max(10, Math.round(size * 0.38));
  const borderRadius = Math.round(size * 0.28);

  const inner = (
    <div
      className={`flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius,
        background: gradient,
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        fontSize,
        letterSpacing: '0.02em',
        cursor: href ? 'pointer' : 'default',
      }}
      title={email ?? undefined}
    >
      {initials}
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', display: 'inline-flex' }}>
        {inner}
      </Link>
    );
  }

  return inner;
}
