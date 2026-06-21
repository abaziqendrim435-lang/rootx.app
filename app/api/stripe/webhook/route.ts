import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, hasStripeConfig, getSupabaseAdmin, type PlanId } from '@/lib/stripe';

// Force dynamic — webhook must not be cached, and reads raw request body
export const dynamic = 'force-dynamic';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';

/** Map a Stripe Price ID to one of our plan IDs */
function priceIdToPlan(priceId: string): PlanId {
  if (priceId === (process.env.STRIPE_PRICE_PRO ?? '')) return 'pro';
  if (priceId === (process.env.STRIPE_PRICE_BUSINESS ?? '')) return 'business';
  return 'free';
}

export async function POST(req: NextRequest) {
  if (!hasStripeConfig || !stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  // ── Handle events ─────────────────────────────────────────

  try {
    switch (event.type) {
      // ── Checkout completed ────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const planId = (session.metadata?.plan_id ?? 'free') as PlanId;

        if (!userId || !session.subscription) break;

        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = sub.items.data[0]?.price.id ?? '';

        await db.from('subscriptions').upsert({
          user_id: userId,
          plan_id: planId || priceIdToPlan(priceId),
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          stripe_price_id: priceId,
          status: sub.status,
          current_period_end: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        console.log(`[Webhook] Subscription created for user ${userId} → ${planId}`);
        break;
      }

      // ── Subscription updated ──────────────────────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        const priceId = sub.items.data[0]?.price.id ?? '';

        if (!userId) break;

        await db.from('subscriptions').update({
          plan_id: priceIdToPlan(priceId),
          stripe_price_id: priceId,
          status: sub.status,
          current_period_end: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', sub.id);

        console.log(`[Webhook] Subscription updated → ${priceIdToPlan(priceId)}`);
        break;
      }

      // ── Subscription canceled / deleted ───────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;

        await db.from('subscriptions').update({
          plan_id: 'free',
          stripe_subscription_id: null,
          stripe_price_id: null,
          status: 'canceled',
          current_period_end: null,
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', sub.id);

        console.log('[Webhook] Subscription canceled → free');
        break;
      }

      // ── Payment failed ────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as unknown as { subscription: string }).subscription;
        if (subId) {
          await db.from('subscriptions').update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          }).eq('stripe_subscription_id', subId);
          console.log('[Webhook] Payment failed → past_due');
        }
        break;
      }

      default:
        // Ignore unhandled events
        break;
    }
  } catch (err) {
    console.error('[Webhook] Handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
