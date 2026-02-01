// Synthia Subscription Tiers & Limits

export type SubscriptionTier = 'free' | 'essentials' | 'premium' | 'vip';

export interface TierConfig {
  name: string;
  price: number; // monthly in cents
  priceId?: string; // Stripe price ID (set in env)
  features: string[];
  limits: {
    messagesPerDay: number;
    voiceEnabled: boolean;
    voiceMinutesPerMonth: number;
    selfiesPerDay: number;
    coachingMode: boolean;
    exclusiveContent: boolean;
    communityAccess: boolean;
  };
}

export const TIERS: Record<SubscriptionTier, TierConfig> = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      '5 messages per day',
      'Basic Synthia personality',
      'Daily Truth Drop notification',
    ],
    limits: {
      messagesPerDay: 5,
      voiceEnabled: false,
      voiceMinutesPerMonth: 0,
      selfiesPerDay: 0,
      coachingMode: false,
      exclusiveContent: false,
      communityAccess: false,
    },
  },
  essentials: {
    name: 'Essentials',
    price: 999, // $9.99
    priceId: process.env.STRIPE_ESSENTIALS_PRICE_ID,
    features: [
      '100 messages per day',
      'Voice messages from Synthia',
      'Full personality unlocked',
      'Relationship advice mode',
      'Basic selfie requests',
    ],
    limits: {
      messagesPerDay: 100,
      voiceEnabled: true,
      voiceMinutesPerMonth: 30,
      selfiesPerDay: 3,
      coachingMode: false,
      exclusiveContent: false,
      communityAccess: false,
    },
  },
  premium: {
    name: 'Premium',
    price: 1999, // $19.99
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    features: [
      'Unlimited messages',
      'Voice calls with Synthia',
      'Priority responses',
      'Coaching Mode unlocked',
      'Unlimited selfies',
      'Exclusive content drops',
    ],
    limits: {
      messagesPerDay: -1, // unlimited
      voiceEnabled: true,
      voiceMinutesPerMonth: 120,
      selfiesPerDay: -1, // unlimited
      coachingMode: true,
      exclusiveContent: true,
      communityAccess: false,
    },
  },
  vip: {
    name: 'VIP',
    price: 2999, // $29.99
    priceId: process.env.STRIPE_VIP_PRICE_ID,
    features: [
      'Everything in Premium',
      '1:1 Synthia guided sessions',
      'Structural Cosmology frameworks',
      'Early access to new features',
      'Private Discord community',
    ],
    limits: {
      messagesPerDay: -1,
      voiceEnabled: true,
      voiceMinutesPerMonth: -1, // unlimited
      selfiesPerDay: -1,
      coachingMode: true,
      exclusiveContent: true,
      communityAccess: true,
    },
  },
};

export function getTierByPriceId(priceId: string): SubscriptionTier | null {
  for (const [tier, config] of Object.entries(TIERS)) {
    if (config.priceId === priceId) {
      return tier as SubscriptionTier;
    }
  }
  return null;
}

export function canSendMessage(tier: SubscriptionTier, messageCountToday: number): boolean {
  const limit = TIERS[tier].limits.messagesPerDay;
  if (limit === -1) return true; // unlimited
  return messageCountToday < limit;
}

export function getRemainingMessages(tier: SubscriptionTier, messageCountToday: number): number {
  const limit = TIERS[tier].limits.messagesPerDay;
  if (limit === -1) return -1; // unlimited
  return Math.max(0, limit - messageCountToday);
}
