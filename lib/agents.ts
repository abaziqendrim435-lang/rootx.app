// ============================================================
// RootX — Mock Agent Data (10 AI Agents)
// Replace with Supabase query when database is connected
// ============================================================

import { Agent } from './types';

export const agents: Agent[] = [
  {
    id: 'shopify-ai-agent',
    name: 'Shopify AI Agent',
    tagline: 'Automate your entire Shopify store operations',
    description:
      'A fully autonomous AI agent that manages your Shopify store end-to-end. It handles product listings, inventory alerts, order processing communications, abandoned cart recovery, and dynamic pricing — all without manual effort.',
    icon: '🛒',
    category: 'E-Commerce',
    price: 297,
    priceLabel: '$297/mo',
    features: [
      'Automated product description generation',
      'Inventory level monitoring & alerts',
      'Abandoned cart email sequences',
      'Dynamic pricing recommendations',
      'Customer review response automation',
      'Sales performance reporting',
    ],
    useCases: [
      'Shopify store owners wanting to scale without extra staff',
      'Dropshippers managing multiple products',
      'E-commerce brands looking to automate customer communications',
    ],
    badge: 'Popular',
    gradient: 'from-red-600 to-orange-600',
  },
  {
    id: 'sales-lead-agent',
    name: 'Sales Lead Agent',
    tagline: 'Find, qualify, and close leads on autopilot',
    description:
      'An intelligent sales prospecting agent that identifies ideal customers, sends personalized outreach, follows up automatically, and qualifies leads before handing them off to your sales team. Works 24/7 without fatigue.',
    icon: '🎯',
    category: 'Sales',
    price: 397,
    priceLabel: '$397/mo',
    features: [
      'LinkedIn & email prospecting automation',
      'AI-powered lead scoring & qualification',
      'Personalized outreach message generation',
      'Multi-touch follow-up sequences',
      'CRM integration (HubSpot, Salesforce)',
      'Pipeline analytics dashboard',
    ],
    useCases: [
      'B2B companies needing consistent lead flow',
      'Sales teams wanting to focus on closing, not prospecting',
      'Startups building their first sales engine',
    ],
    badge: 'Best Seller',
    gradient: 'from-red-700 to-pink-600',
  },
  {
    id: 'content-creator-agent',
    name: 'Content Creator Agent',
    tagline: 'Publish high-quality content at scale',
    description:
      'An AI-powered content engine that researches trending topics, writes SEO-optimized blog posts, creates social media captions, generates video scripts, and maintains your brand voice across all channels — consistently.',
    icon: '✍️',
    category: 'Marketing',
    price: 297,
    priceLabel: '$297/mo',
    features: [
      'SEO blog post writing (2,000+ words)',
      'Social media caption generation',
      'Video script & YouTube description writing',
      'Keyword research & content planning',
      'Brand voice consistency enforcement',
      'Content calendar management',
    ],
    useCases: [
      'Marketing agencies managing multiple clients',
      'SaaS companies needing consistent blog output',
      'Influencers scaling their content production',
    ],
    gradient: 'from-rose-600 to-red-500',
  },
  {
    id: 'customer-support-agent',
    name: 'Customer Support Agent',
    tagline: 'Resolve 80% of tickets without human intervention',
    description:
      'A smart customer service AI that understands your products, policies, and FAQs to handle support tickets, live chat, and email inquiries instantly — escalating only the complex cases to your human team.',
    icon: '🤝',
    category: 'Support',
    price: 197,
    priceLabel: '$197/mo',
    features: [
      'Instant ticket response & resolution',
      'Live chat integration (Intercom, Zendesk)',
      'Multi-language support (50+ languages)',
      'Sentiment detection & escalation',
      'Knowledge base auto-updating',
      'CSAT tracking & reporting',
    ],
    useCases: [
      'E-commerce brands with high ticket volume',
      'SaaS companies with global user bases',
      'Businesses wanting 24/7 support coverage',
    ],
    badge: 'Popular',
    gradient: 'from-red-500 to-rose-700',
  },
  {
    id: 'research-agent',
    name: 'Research Agent',
    tagline: 'Deep research delivered in minutes, not days',
    description:
      'A powerful AI research analyst that scours the web, academic databases, and industry reports to compile comprehensive research briefs, competitive analyses, market insights, and data-driven summaries — on demand.',
    icon: '🔬',
    category: 'Intelligence',
    price: 297,
    priceLabel: '$297/mo',
    features: [
      'Web & academic database research',
      'Competitor analysis reports',
      'Market sizing & trend reports',
      'Source citation & fact verification',
      'Custom research templates',
      'Slack/email delivery of reports',
    ],
    useCases: [
      'Strategy consultants needing fast research',
      'Investors conducting due diligence',
      'Product teams mapping competitive landscape',
    ],
    gradient: 'from-red-800 to-red-600',
  },
  {
    id: 'finance-assistant-agent',
    name: 'Finance Assistant Agent',
    tagline: 'Your AI CFO for smarter financial decisions',
    description:
      'An intelligent finance agent that monitors cash flow, categorizes expenses, generates financial reports, flags anomalies, forecasts revenue, and provides actionable insights — giving you CFO-level visibility at a fraction of the cost.',
    icon: '💰',
    category: 'Finance',
    price: 397,
    priceLabel: '$397/mo',
    features: [
      'Cash flow monitoring & forecasting',
      'Expense categorization & tagging',
      'Monthly P&L report generation',
      'Invoice tracking & payment reminders',
      'Budget vs. actual variance analysis',
      'QuickBooks & Xero integration',
    ],
    useCases: [
      'Small businesses without a dedicated CFO',
      'Freelancers tracking income & expenses',
      'E-commerce brands managing thin margins',
    ],
    gradient: 'from-orange-600 to-red-600',
  },
  {
    id: 'website-builder-agent',
    name: 'Website Builder Agent',
    tagline: 'Launch professional websites in 24 hours',
    description:
      'An AI agent that designs, builds, and deploys your entire website — from landing pages to full multi-page sites. It gathers your requirements, generates the design, writes the copy, and publishes it live.',
    icon: '🌐',
    category: 'Development',
    price: 997,
    priceLabel: '$997 one-time',
    features: [
      'Automated website design generation',
      'AI-written copy & content',
      'Mobile-responsive layouts',
      'SEO optimization built-in',
      'CMS setup (WordPress/Webflow)',
      '30-day post-launch support',
    ],
    useCases: [
      'Entrepreneurs launching new businesses',
      'Local businesses needing an online presence',
      'Agencies automating client website delivery',
    ],
    badge: 'New',
    gradient: 'from-red-600 to-red-900',
  },
  {
    id: 'local-business-agent',
    name: 'Local Business Agent',
    tagline: 'Dominate local search and grow foot traffic',
    description:
      'A specialized AI agent for brick-and-mortar businesses that manages Google Business Profile, local SEO, review responses, appointment booking, local ad campaigns, and neighborhood marketing — fully automated.',
    icon: '📍',
    category: 'Local Marketing',
    price: 197,
    priceLabel: '$197/mo',
    features: [
      'Google Business Profile optimization',
      'Automated review response & generation',
      'Local SEO ranking improvement',
      'Appointment booking automation',
      'Local ad campaign management',
      'Monthly local analytics report',
    ],
    useCases: [
      'Restaurants, salons, and retail shops',
      'Medical and dental practices',
      'Service businesses (plumbers, cleaners)',
    ],
    gradient: 'from-rose-700 to-red-800',
  },
  {
    id: 'email-automation-agent',
    name: 'Email Automation Agent',
    tagline: 'Revenue-generating email sequences on autopilot',
    description:
      'An AI email marketing agent that builds, segments, and manages your entire email list strategy. It writes compelling campaigns, sets up automated flows, A/B tests subject lines, and maximizes open rates and revenue.',
    icon: '📧',
    category: 'Marketing',
    price: 197,
    priceLabel: '$197/mo',
    features: [
      'Welcome, nurture & win-back sequences',
      'List segmentation & personalization',
      'A/B testing for subject lines & content',
      'Deliverability optimization',
      'Revenue attribution tracking',
      'Klaviyo, Mailchimp & ActiveCampaign integration',
    ],
    useCases: [
      'E-commerce brands wanting email-driven revenue',
      'Coaches & course creators monetizing lists',
      'SaaS companies improving trial-to-paid conversion',
    ],
    gradient: 'from-red-500 to-red-700',
  },
  {
    id: 'social-media-growth-agent',
    name: 'Social Media Growth Agent',
    tagline: 'Grow your audience while you sleep',
    description:
      'A comprehensive social media AI that creates platform-native content, schedules posts at optimal times, engages with your audience, analyzes performance, and executes growth strategies across Instagram, X, LinkedIn, and TikTok.',
    icon: '📱',
    category: 'Social Media',
    price: 297,
    priceLabel: '$297/mo',
    features: [
      'Multi-platform content creation',
      'Optimal-time post scheduling',
      'Comment & DM engagement automation',
      'Hashtag research & optimization',
      'Competitor growth analysis',
      'Monthly growth performance report',
    ],
    useCases: [
      'Personal brands building their following',
      'Businesses wanting consistent social presence',
      'Agencies managing multiple brand accounts',
    ],
    badge: 'Trending',
    gradient: 'from-red-600 to-rose-500',
  },
];

export function getAgentById(id: string): Agent | undefined {
  return agents.find((a) => a.id === id);
}

export const agentCategories = [
  'All',
  ...Array.from(new Set(agents.map((a) => a.category))),
];
