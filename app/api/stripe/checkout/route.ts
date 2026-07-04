import { NextRequest, NextResponse } from 'next/server';
import { stripe, hasStripeConfig, PLANS, type PlanId } from '@/lib/stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side Supabase — lazily created to avoid crashing at import time
// when env vars are not yet available (e.g. during static page collection).
let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!url || !key || url.includes('your_supabase')) return null;
  if (!_supabase) _supabase = createClient(url, key);
  return _supabase;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, userEmail, userId } = body as {
      planId: PlanId;
      userEmail: string;
      userId: string;
    };

    const plan = PLANS[planId];
    if (!plan || !plan.stripePriceId) {
      return NextResponse.json({ error: 'Invalid plan or free plan selected' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';

    // ── Demo mode ──
    if (!hasStripeConfig || !stripe) {
      return NextResponse.json({
        demo: true,
        url: `${appUrl}/billing?demo=1&plan=${planId}`,
      });
    }

    // ── Real Stripe checkout ──

    // Look up or create Stripe customer
    let customerId: string | undefined;
    const sb = getSupabase();
    const { data: sub } = sb
      ? await sb
          .from('subscriptions')
          .select('stripe_customer_id')
          .eq('user_id', userId)
          .maybeSingle()
      : { data: null };

    if (sub?.stripe_customer_id) {
      customerId = sub.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${appUrl}/billing?success=1&plan=${planId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?canceled=1`,
      metadata: {
        supabase_user_id: userId,
        plan_id: planId,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
          plan_id: planId,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error('[Stripe Checkout]', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
