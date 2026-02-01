import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { setSubscription, cancelSubscription, getUser } from '@/lib/db';
import { getTierByPriceId, SubscriptionTier } from '@/lib/subscriptions';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier as SubscriptionTier;
        
        if (userId && tier && session.subscription) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          
          await setSubscription(
            userId,
            session.customer as string,
            subscription.id,
            tier,
            subscription.current_period_end * 1000 // Convert to ms
          );
          
          console.log(`✅ User ${userId} upgraded to ${tier}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        
        if (userId) {
          // Get the price ID to determine tier
          const priceId = subscription.items.data[0]?.price.id;
          const tier = getTierByPriceId(priceId) || 'free';
          
          await setSubscription(
            userId,
            subscription.customer as string,
            subscription.id,
            tier,
            subscription.current_period_end * 1000
          );
          
          console.log(`🔄 User ${userId} subscription updated to ${tier}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        
        if (userId) {
          await cancelSubscription(userId);
          console.log(`❌ User ${userId} subscription canceled`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`⚠️ Payment failed for customer ${invoice.customer}`);
        // Could send email notification here
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Disable body parsing for webhooks (Stripe needs raw body)
export const config = {
  api: {
    bodyParser: false,
  },
};
