// Synthia Subscription Tiers & Limits
// Themed for Renaissance/Growth journey

export type SubscriptionTier = 'observer' | 'participant' | 'builder' | 'sovereign';

export interface TierConfig {
  name: string;
  tagline: string;
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
  observer: {
    name: 'Observer',
    tagline: 'Just watching',
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
  participant: {
    name: 'Participant',
    tagline: 'Getting involved',
    price: 999, // $9.99
    priceId: process.env.STRIPE_PARTICIPANT_PRICE_ID,
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
  builder: {
    name: 'Builder',
    tagline: 'Working on yourself',
    price: 1999, // $19.99
    priceId: process.env.STRIPE_BUILDER_PRICE_ID,
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
  sovereign: {
    name: 'Sovereign',
    tagline: 'Mastery + Frameworks',
    price: 2999, // $29.99
    priceId: process.env.STRIPE_SOVEREIGN_PRICE_ID,
    features: [
      'Everything in Builder',
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
