import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy — RootX',
  description: 'How RootX collects, uses, and protects your data.',
};

const sections = [
  {
    title: '1. Information We Collect',
    content: `We collect information you provide directly to us, including when you create an account, subscribe to a plan, or contact support. This includes your name, email address, payment information (processed securely by Stripe), and usage data.

We also automatically collect certain information when you use RootX: log data (IP address, browser type, pages visited), device information, and cookies for session management.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use the information we collect to:
• Provide, maintain, and improve our services
• Process transactions and send related information
• Send technical notices, updates, and support messages
• Respond to your comments and questions
• Monitor and analyse usage patterns
• Detect and prevent fraudulent activity`,
  },
  {
    title: '3. Information Sharing',
    content: `We do not sell, trade, or rent your personal information to third parties. We may share your information with:
• Service providers (Stripe for payments, Supabase for auth/database, Vercel for hosting)
• Law enforcement when required by law
• Other parties with your consent

All third-party providers are bound by confidentiality agreements.`,
  },
  {
    title: '4. Data Security',
    content: `We take reasonable measures to protect your information from unauthorised access, alteration, disclosure, or destruction. All data is encrypted in transit using TLS and at rest. Payment information is processed by Stripe and never stored on our servers.`,
  },
  {
    title: '5. Cookies',
    id: 'cookies',
    content: `We use cookies and similar tracking technologies to track activity on our services. Cookies used by RootX:
• Session cookies — maintain your login state
• Analytics cookies — understand how you use the service (anonymous)
• Preference cookies — remember your settings

You can instruct your browser to refuse all cookies or indicate when a cookie is being sent.`,
  },
  {
    title: '6. Data Retention',
    content: `We retain your personal data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting us or using the deletion option in Settings.`,
  },
  {
    title: '7. Your Rights',
    content: `Depending on your location, you may have rights including:
• Access to your personal data
• Correction of inaccurate data
• Deletion of your data
• Portability of your data
• Objection to processing

To exercise these rights, contact us at privacy@rootx.ai.`,
  },
  {
    title: '8. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of any significant changes by email or by posting a notice on our website. Your continued use of RootX after such notice constitutes your acceptance of the updated policy.`,
  },
  {
    title: '9. Contact Us',
    content: `If you have any questions about this Privacy Policy, please contact us at privacy@rootx.ai or write to us at RootX, Inc.`,
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ paddingTop: '64px', background: 'var(--color-bg)', minHeight: '100vh' }}>
      {/* Header */}
      <section className="py-16" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="section-container">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.2)' }}>
              <Shield size={20} style={{ color: '#ef4444' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>Legal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Privacy Policy</h1>
          <p style={{ color: '#71717a' }}>Last updated: June 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="section-container max-w-3xl">
          <div className="flex flex-col gap-10">
            {sections.map((section) => (
              <div key={section.title} id={section.id}>
                <h2 className="text-xl font-bold mb-4">{section.title}</h2>
                <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#a1a1aa' }}>
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 pt-8" style={{ borderTop: '1px solid var(--color-border)' }}>
            <Link href="/terms" style={{ color: '#ef4444', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
              View Terms of Service →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
