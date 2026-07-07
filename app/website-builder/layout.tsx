import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Website Builder — RootX',
  description:
    'Generate complete, modern websites for any business using AI. Enter your business details, preview your site live, and export as HTML, React, Next.js, or Tailwind.',
};

export default function WebsiteBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
