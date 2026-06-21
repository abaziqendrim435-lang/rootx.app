'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseClient, hasSupabaseConfig } from './supabase-auth';
import { type PlanId, PLANS, getPlan, type Plan } from './stripe';

export interface SubscriptionState {
  planId: PlanId;
  plan: Plan;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  loading: boolean;
}

const FREE_STATE: SubscriptionState = {
  planId: 'free',
  plan: PLANS.free,
  status: 'active',
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  stripeCustomerId: null,
  loading: false,
};

/**
 * React hook — reads the current user's subscription from Supabase.
 * Falls back to free plan when Supabase is not configured or user is logged out.
 */
export function usePlan(userId: string | null | undefined): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({ ...FREE_STATE, loading: true });

  const fetchPlan = useCallback(async () => {
    if (!userId || !hasSupabaseConfig || !supabaseClient) {
      setState({ ...FREE_STATE, loading: false });
      return;
    }

    const { data, error } = await supabaseClient
      .from('subscriptions')
      .select('plan_id, status, current_period_end, cancel_at_period_end, stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      setState({ ...FREE_STATE, loading: false });
      return;
    }

    const planId = (data.plan_id as PlanId) ?? 'free';
    setState({
      planId,
      plan: getPlan(planId),
      status: data.status ?? 'active',
      currentPeriodEnd: data.current_period_end ?? null,
      cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
      stripeCustomerId: data.stripe_customer_id ?? null,
      loading: false,
    });
  }, [userId]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  return state;
}

/**
 * Check if a given plan can make more generations this month.
 * monthlyCount = number of generations made this calendar month.
 */
export function canGenerate(plan: Plan, monthlyCount: number): boolean {
  if (plan.generationsPerMonth === -1) return true; // unlimited
  return monthlyCount < plan.generationsPerMonth;
}

/**
 * Returns remaining generations this month (-1 = unlimited).
 */
export function remainingGenerations(plan: Plan, monthlyCount: number): number {
  if (plan.generationsPerMonth === -1) return -1;
  return Math.max(0, plan.generationsPerMonth - monthlyCount);
}

/** Check if the plan has Stripe configured (not a free plan) */
export const hasStripeClientConfig =
  typeof process !== 'undefined'
    ? (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '').startsWith('pk_')
    : false;
