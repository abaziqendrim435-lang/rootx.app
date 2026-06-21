import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/components/AuthProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'RootX — AI Agent Marketplace',
    template: '%s | RootX',
  },
  description:
    'Browse and deploy ready-made AI agents for business automation. From sales and marketing to customer support and finance — RootX has an agent for every workflow.',
  keywords: [
    'AI agents',
    'business automation',
    'AI marketplace',
    'sales automation',
    'marketing AI',
    'RootX',
  ],
  openGraph: {
    title: 'RootX — AI Agent Marketplace',
    description: 'Deploy AI agents that work for your business 24/7',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
