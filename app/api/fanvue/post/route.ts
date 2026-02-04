import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

/**
 * FanVue Content Posting API
 * 
 * POST /api/fanvue/post - Create a new post on FanVue
 * 
 * Body:
 *   - text: string (required) - The post caption
 *   - mediaUrls: string[] (optional) - Array of media URLs to include
 *   - isPPV: boolean (optional) - Whether this is pay-per-view content
 *   - price: number (optional) - PPV price if isPPV is true
 */

async function getAccessToken(): Promise<string | null> {
  if (process.env.FANVUE_ACCESS_TOKEN) {
    return process.env.FANVUE_ACCESS_TOKEN;
  }
  try {
    const token = await kv.get<string>('fanvue:access_token');
    return token;
  } catch (error) {
    console.error('Error getting access token from KV:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, mediaUrls, isPPV, price } = body;

    if (!text) {
      return NextResponse.json({ 
        error: 'text is required' 
      }, { status: 400 });
    }

    const accessToken = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'No access token. Authorize at /api/fanvue/authorize',
        needsReauth: true
      }, { status: 401 });
    }

    // Build the post payload
    // Note: FanVue API structure - this is based on typical creator platform APIs
    // May need adjustment based on actual FanVue API docs
    const postPayload: Record<string, unknown> = {
      text: text,
    };

    // Add media if provided
    if (mediaUrls && Array.isArray(mediaUrls) && mediaUrls.length > 0) {
      postPayload.media = mediaUrls.map(url => ({ url }));
    }

    // Add PPV settings if applicable
    if (isPPV && price) {
      postPayload.isPPV = true;
      postPayload.price = price;
    }

    // Create the post via FanVue API
    const response = await fetch('https://api.fanvue.com/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Fanvue-API-Version': '2025-06-26',
      },
      body: JSON.stringify(postPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FanVue post creation failed:', response.status, errorText);
      
      // Check if token expired
      if (response.status === 401) {
        // Try to refresh token
        const refreshResult = await fetch(`${request.nextUrl.origin}/api/fanvue/refresh`);
        if (refreshResult.ok) {
          // Retry the post with new token
          return POST(request);
        }
        return NextResponse.json({ 
          error: 'Token expired and refresh failed. Re-authorize at /api/fanvue/authorize',
          needsReauth: true
        }, { status: 401 });
      }
      
      return NextResponse.json({ 
        error: `Failed to create post: ${errorText}` 
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('✅ FanVue post created:', result);

    return NextResponse.json({
      success: true,
      post: result,
      postedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Post creation error:', error);
    return NextResponse.json({ 
      error: `Post creation error: ${error}` 
    }, { status: 500 });
  }
}

// GET endpoint to check API status
export async function GET() {
  const accessToken = await getAccessToken();
  const lastRefresh = await kv.get<string>('fanvue:last_refresh');
  
  return NextResponse.json({
    status: accessToken ? 'ready' : 'needs_auth',
    hasAccessToken: !!accessToken,
    lastRefresh: lastRefresh || 'never',
    authUrl: '/api/fanvue/authorize'
  });
}
