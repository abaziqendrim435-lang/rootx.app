import { NextRequest, NextResponse } from 'next/server';
import { stripe, hasStripeConfig, PLANS, type PlanId } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase (uses anon key — reads user from auth header)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
);

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
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

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
