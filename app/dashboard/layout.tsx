import type { Metadata } from 'next';
import DashboardShell from '@/components/dashboard/DashboardShell';
import AuthGuard from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'Dashboard — RootX',
  description: 'View your AI generation history, saved outputs, and usage stats.',
};

// Dashboard uses its own layout — no public Navbar/Footer
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
