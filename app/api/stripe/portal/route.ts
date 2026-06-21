import { NextRequest, NextResponse } from 'next/server';
import { stripe, hasStripeConfig } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  if (!hasStripeConfig || !stripe) {
    return NextResponse.json({ demo: true, url: '/billing?demo=1' });
  }

  try {
    const { customerId } = await req.json() as { customerId: string };
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[Portal]', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
