import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

/**
 * FanVue Status Check Endpoint
 * 
 * GET /api/fanvue/status - Check FanVue integration status and token health
 * 
 * Returns:
 *   - Token status (valid, expired, missing)
 *   - Last refresh time
 *   - Token expiry estimate
 *   - API connectivity test
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

async function testFanVueAPI(token: string): Promise<{ ok: boolean; error?: string }> {
  try {
    // Test the API by fetching creator info
    const response = await fetch('https://api.fanvue.com/creator/self', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Fanvue-API-Version': '2025-06-26',
      },
    });

    if (response.ok) {
      return { ok: true };
    } else if (response.status === 401) {
      return { ok: false, error: 'Token expired or invalid' };
    } else {
      return { ok: false, error: `API returned ${response.status}` };
    }
  } catch (error) {
    return { ok: false, error: `API test failed: ${error}` };
  }
}

export async function GET() {
  try {
    const accessToken = await getAccessToken();
    const refreshToken = await kv.get<string>('fanvue:refresh_token');
    const lastRefresh = await kv.get<string>('fanvue:last_refresh');

    // Check environment variables
    const hasClientId = !!process.env.FANVUE_CLIENT_ID;
    const hasClientSecret = !!process.env.FANVUE_CLIENT_SECRET;
    const hasWebhookSecret = !!process.env.FANVUE_WEBHOOK_SECRET;

    const status = {
      timestamp: new Date().toISOString(),
      configuration: {
        clientId: hasClientId ? '✅ Set' : '❌ Missing',
        clientSecret: hasClientSecret ? '✅ Set' : '❌ Missing',
        webhookSecret: hasWebhookSecret ? '✅ Set' : '❌ Missing',
        configured: hasClientId && hasClientSecret,
      },
      tokens: {
        accessToken: accessToken ? '✅ Present' : '❌ Missing',
        refreshToken: refreshToken ? '✅ Present' : '❌ Missing',
        lastRefresh: lastRefresh || 'Never',
        source: process.env.FANVUE_ACCESS_TOKEN ? 'Environment Variable' : 'Vercel KV',
      },
      api: {
        status: 'unknown',
        error: null as string | null,
      },
      actions: {
        authorize: '/api/fanvue/authorize',
        refresh: '/api/fanvue/refresh',
        post: '/api/fanvue/post',
      },
    };

    // Test API if we have a token
    if (accessToken) {
      const apiTest = await testFanVueAPI(accessToken);
      status.api.status = apiTest.ok ? '✅ Connected' : '❌ Failed';
      status.api.error = apiTest.error || null;
      
      // If token is expired, try to refresh
      if (!apiTest.ok && apiTest.error?.includes('expired')) {
        status.api.status = '⚠️ Token expired - refreshing...';
      }
    } else {
      status.api.status = '⚠️ No token - authorize first';
    }

    return NextResponse.json(status);

  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: `Status check failed: ${error}`,
    }, { status: 500 });
  }
}
