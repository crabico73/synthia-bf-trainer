import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

/**
 * FanVue Token Refresh Endpoint
 * 
 * This endpoint refreshes the FanVue access token using the stored refresh token.
 * Should be called via cron job every 45 minutes (token expires in ~1 hour).
 * 
 * GET /api/fanvue/refresh - Refresh the token
 */

export async function GET() {
  try {
    // Get refresh token from KV
    const refreshToken = await kv.get<string>('fanvue:refresh_token');
    
    if (!refreshToken) {
      console.error('No refresh token found in KV store');
      return NextResponse.json({ 
        error: 'No refresh token available. Re-authorize at /api/fanvue/authorize',
        needsReauth: true
      }, { status: 401 });
    }

    // Build credentials for Basic auth
    const credentials = Buffer.from(
      `${process.env.FANVUE_CLIENT_ID}:${process.env.FANVUE_CLIENT_SECRET}`
    ).toString('base64');

    // Exchange refresh token for new access token
    const tokenResponse = await fetch('https://auth.fanvue.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token refresh failed:', tokenResponse.status, errorData);
      
      // If refresh failed, might need to re-authorize
      if (tokenResponse.status === 400 || tokenResponse.status === 401) {
        return NextResponse.json({ 
          error: 'Refresh token expired or invalid. Re-authorize at /api/fanvue/authorize',
          needsReauth: true
        }, { status: 401 });
      }
      
      return NextResponse.json({ 
        error: `Token refresh failed: ${errorData}` 
      }, { status: 500 });
    }

    const tokens = await tokenResponse.json();
    
    console.log('✅ FanVue token refreshed successfully!');
    console.log('New token expires in:', tokens.expires_in, 'seconds');

    // Store new tokens in KV
    await kv.set('fanvue:access_token', tokens.access_token, {
      ex: tokens.expires_in || 3600
    });

    // Store new refresh token if provided (some OAuth providers rotate them)
    if (tokens.refresh_token) {
      await kv.set('fanvue:refresh_token', tokens.refresh_token, {
        ex: 60 * 60 * 24 * 30 // 30 days
      });
    }

    // Update timestamp for monitoring
    await kv.set('fanvue:last_refresh', new Date().toISOString());

    return NextResponse.json({
      success: true,
      expiresIn: tokens.expires_in,
      refreshedAt: new Date().toISOString(),
      message: 'Token refreshed and stored in KV'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json({ 
      error: `Token refresh error: ${error}` 
    }, { status: 500 });
  }
}
