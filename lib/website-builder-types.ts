// ============================================================
// RootX — Website Builder Agent Types
// ============================================================

// ── User Input ─────────────────────────────────────────────────

export type PreferredStyle =
  | 'minimal'
  | 'luxury'
  | 'startup'
  | 'dark'
  | 'modern'
  | 'corporate'
  | 'auto_best'
  | 'premium_minimal'
  | 'modern_commerce'
  | 'luxury_editorial'
  | 'bold_conversion'
  | 'tech_futuristic'
  | 'soft_lifestyle';

export type AIProvider = 'openai' | 'claude' | 'gemini' | 'kimi' | 'auto';

export interface WebsiteBuilderInput {
  businessName: string;
  businessType: string;
  targetAudience: string;
  brandDescription: string;
  preferredStyle: PreferredStyle;
  primaryColor: string;
  secondaryColor: string;
  language: string;
  country: string;
}

// ── AI Generation Output ───────────────────────────────────────

export interface HeroSection {
  headline: string;
  subheadline: string;
  ctaButtons: { label: string; url: string; variant: 'primary' | 'secondary' }[];
  backgroundStyle: string;
}

export interface FeatureItem {
  title: string;
  description: string;
  icon: string;
}

export interface HomepageSection {
  hero: HeroSection;
  features: FeatureItem[];
  socialProof: string;
}

export interface AboutSection {
  title: string;
  content: string;
  mission: string;
  vision: string;
  values: string[];
}

export interface ServiceItem {
  title: string;
  description: string;
  icon: string;
  features: string[];
}

export interface ServicesSection {
  title: string;
  subtitle: string;
  services: ServiceItem[];
}

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  isPopular: boolean;
}

export interface PricingSection {
  title: string;
  subtitle: string;
  plans: PricingPlan[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQSection {
  title: string;
  subtitle: string;
  items: FAQItem[];
}

export interface TestimonialItem {
  name: string;
  role: string;
  company: string;
  quote: string;
  rating: number;
}

export interface TestimonialsSection {
  title: string;
  subtitle: string;
  testimonials: TestimonialItem[];
}

export interface ContactSection {
  title: string;
  subtitle: string;
  email: string;
  phone: string;
  address: string;
  formFields: { label: string; type: string; placeholder: string; required: boolean }[];
}

export interface FooterLink {
  label: string;
  url: string;
}

export interface FooterSection {
  columns: { title: string; links: FooterLink[] }[];
  copyright: string;
  socialLinks: { platform: string; url: string; icon: string }[];
  tagline: string;
}

// ── SEO ────────────────────────────────────────────────────────

export interface SEOData {
  title: string;
  metaDescription: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImagePrompt: string;
  canonicalUrl: string;
  structuredData: string;
}

// ── Branding ───────────────────────────────────────────────────

export interface ColorPaletteEntry {
  name: string;
  hex: string;
  usage: string;
}

export interface TypographyRecommendation {
  heading: string;
  body: string;
  accent: string;
  googleFontsUrl: string;
}

export interface BrandingData {
  colorPalette: ColorPaletteEntry[];
  typography: TypographyRecommendation;
  iconSuggestions: { name: string; usage: string; emoji: string }[];
  logoDescription: string;
}

// ── Marketing ──────────────────────────────────────────────────

export interface MarketingData {
  googleAdsHeadlines: string[];
  googleAdsDescriptions: string[];
  facebookAdCopy: string;
  instagramCaption: string;
  linkedInPost: string;
  twitterPost: string;
  emailCampaign: {
    subject: string;
    preheader: string;
    body: string;
    cta: string;
  };
}

// ── Ecommerce (Dropshipping Store) ─────────────────────────────

export interface EcommerceProductVariant {
  name: string;
  values: string[];
}

export interface EcommerceFeatureSection {
  title: string;
  description: string;
  imageUrl: string;
}

export interface EcommerceReview {
  author: string;
  rating: number;
  date: string;
  title: string;
  content: string;
}

export interface EcommerceData {
  announcementBar: string;
  navigation: string[];
  price: string;
  compareAtPrice: string;
  variants: EcommerceProductVariant[];
  images: string[];
  trustBadges: string[];
  shippingText: string;
  featureSections: EcommerceFeatureSection[];
  specifications: { label: string; value: string }[];
  howItWorks: { step: string; title: string; description: string }[];
  faq: { question: string; answer: string }[];
  reviews: EcommerceReview[];
  stickyAddToCartText: string;
  preferredStyle?: PreferredStyle;
  sectionOrder?: string[];
}

// ── Full Generation Response ───────────────────────────────────

export interface WebsiteGeneration {
  homepage: HomepageSection;
  about: AboutSection;
  services: ServicesSection;
  pricing: PricingSection;
  faq: FAQSection;
  testimonials: TestimonialsSection;
  contact: ContactSection;
  footer: FooterSection;
  seo: SEOData;
  branding: BrandingData;
  marketing: MarketingData;
  isDemo: boolean;
  provider: string;
  ecommerce?: EcommerceData;
}

// ── Export ──────────────────────────────────────────────────────

export type ExportFormat = 'html' | 'react' | 'nextjs' | 'tailwind' | 'json';

// ── Builder Mode ────────────────────────────────────────────────

export type BuilderMode = 'business' | 'dropshipping';

// ── Product Analysis (Dropshipping) ─────────────────────────────

export interface ProductAnalysis {
  productTitle: string;
  productDescription: string;
  features: string[];
  sellingPoints: string[];
  targetAudience: string;
  category: string;
  priceRange: string;
  sourceUrl: string;
  images: string[];
  shippingInfo: string;
  specifications: { label: string; value: string }[];
  warnings: string[];
  isPlaceholder: boolean;
  ratings?: number;
  reviewCount?: number;
  analysisId?: string;
  timestamp?: string;
  requestId?: string;
}

export interface DropshippingInput {
  productUrl: string;
  storeName: string;
  preferredStyle: PreferredStyle;
  primaryColor: string;
  secondaryColor: string;
  language: string;
  country: string;
}
