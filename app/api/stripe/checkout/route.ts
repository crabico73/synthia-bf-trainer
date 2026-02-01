import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { stripe } from '@/lib/stripe';
import { TIERS, SubscriptionTier } from '@/lib/subscriptions';
import { getUser, getUserByEmail, createUser } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier } = await request.json() as { tier: SubscriptionTier };
    
    // Validate tier
    if (!tier || !TIERS[tier] || tier === 'observer') {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const tierConfig = TIERS[tier];
    if (!tierConfig.priceId) {
      return NextResponse.json({ error: 'Tier not configured' }, { status: 400 });
    }

    // Get or create user in our database
    let user = await getUserByEmail(session.user.email);
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        email: session.user.email,
        name: session.user.name || undefined,
        tier: 'observer',
        createdAt: Date.now(),
      };
      await createUser(user);
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: tierConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/chat?upgraded=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        tier,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          tier,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
