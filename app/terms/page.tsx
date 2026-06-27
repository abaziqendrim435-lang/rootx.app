import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service — RootX',
  description: 'Terms and conditions for using the RootX AI Agent platform.',
};

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using RootX ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service.`,
  },
  {
    title: '2. Description of Service',
    content: `RootX provides an AI agent marketplace and automation platform. The Service includes access to AI-powered agents, generation history, and related features depending on your subscription plan. We reserve the right to modify, suspend, or discontinue any part of the Service at any time.`,
  },
  {
    title: '3. Accounts and Registration',
    content: `When you create an account, you must provide accurate and complete information. You are responsible for:
• Maintaining the confidentiality of your account credentials
• All activities that occur under your account
• Notifying us immediately of any unauthorised use

You must be at least 18 years old to use this Service.`,
  },
  {
    title: '4. Subscription Plans and Billing',
    content: `RootX offers Free, Pro ($29/month), and Business ($99/month) subscription plans. By subscribing to a paid plan, you agree to pay the applicable fees. Fees are charged in advance on a monthly basis and are non-refundable except as required by law.

You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. We reserve the right to change pricing with 30 days notice.`,
  },
  {
    title: '5. Acceptable Use',
    content: `You agree not to use the Service to:
• Generate content that is illegal, harmful, deceptive, or harassing
• Violate any applicable laws or regulations
• Infringe on intellectual property rights of others
• Attempt to gain unauthorised access to our systems
• Resell or distribute AI-generated outputs as your own original AI models
• Use the Service to train competing AI systems without written permission

We reserve the right to terminate accounts that violate these terms.`,
  },
  {
    title: '6. Intellectual Property',
    content: `RootX and its licensors own all intellectual property rights in the Service. Subject to your subscription, we grant you a limited, non-exclusive licence to use the Service for your business purposes.

Content you generate using our AI agents belongs to you, subject to the limits of your subscription plan. You represent that you have all necessary rights to any inputs you provide.`,
  },
  {
    title: '7. Privacy',
    content: `Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our practices.`,
  },
  {
    title: '8. Disclaimers and Limitation of Liability',
    content: `THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, ROOTX SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE SERVICE.

AI-generated content may be inaccurate, incomplete, or inappropriate. You are responsible for reviewing and verifying all generated content before use.`,
  },
  {
    title: '9. Governing Law',
    content: `These Terms are governed by the laws of the jurisdiction in which RootX operates, without regard to conflict of law principles. Any disputes shall be resolved in the courts of that jurisdiction.`,
  },
  {
    title: '10. Changes to Terms',
    content: `We reserve the right to modify these Terms at any time. We will provide notice of material changes by email or by posting on the Service. Your continued use of the Service after such notice constitutes acceptance of the updated Terms.`,
  },
  {
    title: '11. Contact',
    content: `For questions about these Terms, please contact us at legal@rootx.ai.`,
  },
];

export default function TermsPage() {
  return (
    <div style={{ paddingTop: '64px', background: 'var(--color-bg)', minHeight: '100vh' }}>
      {/* Header */}
      <section className="py-16" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="section-container">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.2)' }}>
              <FileText size={20} style={{ color: '#ef4444' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>Legal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Terms of Service</h1>
          <p style={{ color: '#71717a' }}>Last updated: June 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="section-container max-w-3xl">
          <div className="flex flex-col gap-10">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-xl font-bold mb-4">{section.title}</h2>
                <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#a1a1aa' }}>
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 pt-8" style={{ borderTop: '1px solid var(--color-border)' }}>
            <Link href="/privacy" style={{ color: '#ef4444', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
              View Privacy Policy →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
