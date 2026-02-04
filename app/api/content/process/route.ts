import { NextResponse } from 'next/server';
import { getNextToPost, markAsPosted, markAsFailed } from '@/lib/content-queue';
import { kv } from '@vercel/kv';

/**
 * Content Queue Processor
 * 
 * GET /api/content/process - Process next queued item
 * 
 * This should be called by a cron job to automatically post content.
 * It processes one item per call to avoid timeout issues.
 */

async function getAccessToken(): Promise<string | null> {
  if (process.env.FANVUE_ACCESS_TOKEN) {
    return process.env.FANVUE_ACCESS_TOKEN;
  }
  try {
    return await kv.get<string>('fanvue:access_token');
  } catch {
    return null;
  }
}

async function postToFanVue(text: string, mediaUrls?: string[], isPPV?: boolean, price?: number): Promise<{ success: boolean; error?: string }> {
  const accessToken = await getAccessToken();
  
  if (!accessToken) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const payload: Record<string, unknown> = { text };
    if (mediaUrls?.length) {
      payload.media = mediaUrls.map(url => ({ url }));
    }
    if (isPPV && price) {
      payload.isPPV = true;
      payload.price = price;
    }

    const response = await fetch('https://api.fanvue.com/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Fanvue-API-Version': '2025-06-26',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `FanVue API error ${response.status}: ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: `Post failed: ${error}` };
  }
}

export async function GET() {
  try {
    // Get next item ready to post
    const item = await getNextToPost();

    if (!item) {
      return NextResponse.json({
        success: true,
        message: 'No items ready to post',
        processed: false,
      });
    }

    console.log(`Processing content item: ${item.id}`);

    // Post based on platform
    let result: { success: boolean; error?: string } = { success: false, error: 'Unknown platform' };

    if (item.platform === 'fanvue' || item.platform === 'both') {
      result = await postToFanVue(item.text, item.mediaUrls, item.isPPV, item.price);
    }

    // TODO: Add dFans posting when API is available
    // if (item.platform === 'dfans' || item.platform === 'both') {
    //   result = await postToDFans(item.text, item.mediaUrls);
    // }

    if (result.success) {
      await markAsPosted(item.id);
      console.log(`✅ Posted content: ${item.id}`);
      return NextResponse.json({
        success: true,
        processed: true,
        item: {
          id: item.id,
          text: item.text.substring(0, 50) + '...',
          platform: item.platform,
        },
      });
    } else {
      await markAsFailed(item.id, result.error || 'Unknown error');
      console.error(`❌ Failed to post: ${item.id} - ${result.error}`);
      return NextResponse.json({
        success: false,
        processed: true,
        error: result.error,
        item: { id: item.id },
      });
    }
  } catch (error) {
    console.error('Queue processor error:', error);
    return NextResponse.json({ error: `Processor error: ${error}` }, { status: 500 });
  }
}
