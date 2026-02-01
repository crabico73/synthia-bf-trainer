import { Redis } from '@upstash/redis';
import { SubscriptionTier } from './subscriptions';

// Initialize Redis client (uses KV_REST_API_URL and KV_REST_API_TOKEN from env)
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// User data structure stored in Redis
export interface UserData {
  id: string;
  email: string;
  name?: string;
  tier: SubscriptionTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionEndsAt?: number; // Unix timestamp
  createdAt: number;
}

// Default tier for new users
export const DEFAULT_TIER: SubscriptionTier = 'observer';

// Keys
const userKey = (userId: string) => `user:${userId}`;
const userByEmailKey = (email: string) => `user:email:${email}`;
const messageCountKey = (userId: string, date: string) => `messages:${userId}:${date}`;

// Get today's date as YYYY-MM-DD
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// User CRUD operations
export async function getUser(userId: string): Promise<UserData | null> {
  return redis.get<UserData>(userKey(userId));
}

export async function getUserByEmail(email: string): Promise<UserData | null> {
  const userId = await redis.get<string>(userByEmailKey(email));
  if (!userId) return null;
  return getUser(userId);
}

export async function createUser(user: UserData): Promise<void> {
  await redis.set(userKey(user.id), user);
  await redis.set(userByEmailKey(user.email), user.id);
}

export async function updateUser(userId: string, updates: Partial<UserData>): Promise<void> {
  const existing = await getUser(userId);
  if (!existing) throw new Error('User not found');
  await redis.set(userKey(userId), { ...existing, ...updates });
}

export async function updateUserTier(userId: string, tier: SubscriptionTier): Promise<void> {
  await updateUser(userId, { tier });
}

// Message counting for rate limiting
export async function getMessageCountToday(userId: string): Promise<number> {
  const count = await redis.get<number>(messageCountKey(userId, getTodayDate()));
  return count || 0;
}

export async function incrementMessageCount(userId: string): Promise<number> {
  const key = messageCountKey(userId, getTodayDate());
  const newCount = await redis.incr(key);
  // Set expiry to 48 hours (cleanup old keys)
  await redis.expire(key, 60 * 60 * 48);
  return newCount;
}

// Subscription management
export async function setSubscription(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  tier: SubscriptionTier,
  endsAt: number
): Promise<void> {
  await updateUser(userId, {
    tier,
    stripeCustomerId,
    stripeSubscriptionId,
    subscriptionEndsAt: endsAt,
  });
}

export async function cancelSubscription(userId: string): Promise<void> {
  await updateUser(userId, {
    tier: 'free',
    stripeSubscriptionId: undefined,
    subscriptionEndsAt: undefined,
  });
}

// Check if subscription is still valid
export async function isSubscriptionActive(userId: string): Promise<boolean> {
  const user = await getUser(userId);
  if (!user) return false;
  if (user.tier === 'free') return true; // Free is always "active"
  if (!user.subscriptionEndsAt) return false;
  return user.subscriptionEndsAt > Date.now();
}
