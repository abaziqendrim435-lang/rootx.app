import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center text-center"
      style={{ paddingTop: '64px' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.06) 0%, transparent 60%)',
        }}
      />
      <div className="relative z-10 px-6">
        <div className="text-8xl font-black mb-4 gradient-text">404</div>
        <h1 className="text-2xl font-bold mb-4">Page not found</h1>
        <p className="mb-8" style={{ color: '#71717a' }}>
          This page doesn't exist or the agent you're looking for may have moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-secondary">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <Link href="/agents" className="btn-primary">
            Browse Agents →
          </Link>
        </div>
      </div>
    </div>
  );
}
