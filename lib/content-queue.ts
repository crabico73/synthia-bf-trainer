/**
 * Content Queue System for FanVue Automation
 * 
 * Manages a queue of content to be posted automatically.
 * Stores queue in Vercel KV.
 */

import { kv } from '@vercel/kv';

export interface ContentItem {
  id: string;
  text: string;
  mediaUrls?: string[];
  isPPV?: boolean;
  price?: number;
  scheduledFor?: string; // ISO date string
  platform: 'fanvue' | 'dfans' | 'both';
  status: 'queued' | 'posted' | 'failed';
  createdAt: string;
  postedAt?: string;
  error?: string;
}

const QUEUE_KEY = 'content:queue';
const POSTED_KEY = 'content:posted';

/**
 * Add content to the queue
 */
export async function addToQueue(content: Omit<ContentItem, 'id' | 'status' | 'createdAt'>): Promise<ContentItem> {
  const item: ContentItem = {
    ...content,
    id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'queued',
    createdAt: new Date().toISOString(),
  };

  // Get existing queue
  const queue = await getQueue();
  queue.push(item);

  // Save back to KV
  await kv.set(QUEUE_KEY, JSON.stringify(queue));

  return item;
}

/**
 * Get all queued content
 */
export async function getQueue(): Promise<ContentItem[]> {
  try {
    const data = await kv.get<string>(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Get next item ready to post
 */
export async function getNextToPost(): Promise<ContentItem | null> {
  const queue = await getQueue();
  const now = new Date();

  // Find first queued item that's either not scheduled or scheduled time has passed
  return queue.find(item => {
    if (item.status !== 'queued') return false;
    if (!item.scheduledFor) return true;
    return new Date(item.scheduledFor) <= now;
  }) || null;
}

/**
 * Mark item as posted
 */
export async function markAsPosted(id: string): Promise<void> {
  const queue = await getQueue();
  const item = queue.find(i => i.id === id);

  if (item) {
    item.status = 'posted';
    item.postedAt = new Date().toISOString();
    await kv.set(QUEUE_KEY, JSON.stringify(queue));

    // Also add to posted history
    const posted = await getPostedHistory();
    posted.push(item);
    // Keep only last 100 posted items
    if (posted.length > 100) posted.shift();
    await kv.set(POSTED_KEY, JSON.stringify(posted));
  }
}

/**
 * Mark item as failed
 */
export async function markAsFailed(id: string, error: string): Promise<void> {
  const queue = await getQueue();
  const item = queue.find(i => i.id === id);

  if (item) {
    item.status = 'failed';
    item.error = error;
    await kv.set(QUEUE_KEY, JSON.stringify(queue));
  }
}

/**
 * Get posted history
 */
export async function getPostedHistory(): Promise<ContentItem[]> {
  try {
    const data = await kv.get<string>(POSTED_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Clear all queued items (not posted)
 */
export async function clearQueue(): Promise<void> {
  const queue = await getQueue();
  const remaining = queue.filter(i => i.status !== 'queued');
  await kv.set(QUEUE_KEY, JSON.stringify(remaining));
}

/**
 * Remove specific item from queue
 */
export async function removeFromQueue(id: string): Promise<boolean> {
  const queue = await getQueue();
  const index = queue.findIndex(i => i.id === id);

  if (index > -1) {
    queue.splice(index, 1);
    await kv.set(QUEUE_KEY, JSON.stringify(queue));
    return true;
  }
  return false;
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  queued: number;
  posted: number;
  failed: number;
  nextScheduled: string | null;
}> {
  const queue = await getQueue();
  const posted = await getPostedHistory();

  const queuedItems = queue.filter(i => i.status === 'queued');
  const failedItems = queue.filter(i => i.status === 'failed');

  // Find next scheduled item
  const scheduledItems = queuedItems
    .filter(i => i.scheduledFor)
    .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime());

  return {
    queued: queuedItems.length,
    posted: posted.length,
    failed: failedItems.length,
    nextScheduled: scheduledItems[0]?.scheduledFor || null,
  };
}
