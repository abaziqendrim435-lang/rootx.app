// ============================================================
// RootX — Stripe + Plan Management Library
//
// Plan tiers and their limits.
// Stripe client is null when keys are not configured (demo mode).
// ============================================================

import Stripe from 'stripe';

// ── Plan definitions ─────────────────────────────────────────

export type PlanId = 'free' | 'pro' | 'business';

export interface Plan {
  id: PlanId;
  name: string;
  price: number;      // USD per month
  description: string;
  generationsPerMonth: number;   // -1 = unlimited
  features: string[];
  badge?: string;
  stripePriceId: string | null;  // null = free
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Get started with AI-powered content creation',
    generationsPerMonth: 10,
    features: [
      '10 AI generations / month',
      'Content Creator Agent',
      'Shopify Agent',
      'Generation history (last 10)',
      'Copy & export outputs',
    ],
    stripePriceId: null,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    description: 'For creators and solo entrepreneurs',
    generationsPerMonth: 200,
    badge: 'Most Popular',
    features: [
      '200 AI generations / month',
      'All Free features',
      'Full generation history',
      'Save & bookmark outputs',
      'Priority AI processing',
      'Email support',
    ],
    stripePriceId: process.env.STRIPE_PRICE_PRO ?? null,
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 99,
    description: 'For growing teams and agencies',
    generationsPerMonth: -1,
    features: [
      'Unlimited AI generations',
      'All Pro features',
      'Team workspace (coming soon)',
      'Advanced analytics',
      'API access (coming soon)',
      'Priority support + Slack',
    ],
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS ?? null,
  },
};

export const PLAN_ORDER: PlanId[] = ['free', 'pro', 'business'];

export function getPlan(id: PlanId): Plan {
  return PLANS[id] ?? PLANS.free;
}

// ── Stripe client (server-side only) ─────────────────────────

const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? '';
export const hasStripeConfig =
  stripeSecretKey.startsWith('sk_') &&
  !stripeSecretKey.includes('your_stripe');

export const stripe = hasStripeConfig
  ? new Stripe(stripeSecretKey, { apiVersion: '2026-05-27.dahlia' })
  : null;

// ── Supabase subscription helpers (server-side) ───────────────

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** Service-role client for webhook writes (bypasses RLS) */
export function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}
