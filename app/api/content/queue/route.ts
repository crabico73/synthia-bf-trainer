import { NextRequest, NextResponse } from 'next/server';
import { 
  addToQueue, 
  getQueue, 
  getQueueStats, 
  removeFromQueue, 
  clearQueue 
} from '@/lib/content-queue';

/**
 * Content Queue API
 * 
 * GET /api/content/queue - Get queue and stats
 * POST /api/content/queue - Add item to queue
 * DELETE /api/content/queue?id=xxx - Remove item from queue
 * DELETE /api/content/queue?clear=true - Clear all queued items
 */

export async function GET() {
  try {
    const [queue, stats] = await Promise.all([
      getQueue(),
      getQueueStats(),
    ]);

    return NextResponse.json({
      success: true,
      stats,
      queue: queue.filter(i => i.status === 'queued'),
      failed: queue.filter(i => i.status === 'failed'),
    });
  } catch (error) {
    return NextResponse.json({ error: `Failed to get queue: ${error}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, mediaUrls, isPPV, price, scheduledFor, platform } = body;

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const item = await addToQueue({
      text,
      mediaUrls,
      isPPV,
      price,
      scheduledFor,
      platform: platform || 'fanvue',
    });

    return NextResponse.json({
      success: true,
      item,
      message: scheduledFor 
        ? `Scheduled for ${scheduledFor}` 
        : 'Added to queue (will post on next cron run)',
    });
  } catch (error) {
    return NextResponse.json({ error: `Failed to add to queue: ${error}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const shouldClear = searchParams.get('clear') === 'true';

    if (shouldClear) {
      await clearQueue();
      return NextResponse.json({ success: true, message: 'Queue cleared' });
    }

    if (id) {
      const removed = await removeFromQueue(id);
      return NextResponse.json({ 
        success: removed, 
        message: removed ? 'Item removed' : 'Item not found' 
      });
    }

    return NextResponse.json({ error: 'Provide id or clear=true' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: `Failed to modify queue: ${error}` }, { status: 500 });
  }
}
