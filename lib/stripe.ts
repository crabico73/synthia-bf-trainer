import Stripe from 'stripe';

// Server-side Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Price IDs from Stripe Dashboard (set these in .env.local after creating products)
export const STRIPE_PRICES = {
  essentials: process.env.STRIPE_ESSENTIALS_PRICE_ID!,
  premium: process.env.STRIPE_PREMIUM_PRICE_ID!,
  vip: process.env.STRIPE_VIP_PRICE_ID!,
};
