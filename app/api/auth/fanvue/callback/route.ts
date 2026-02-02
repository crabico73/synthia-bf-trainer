import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// FanVue OAuth Callback - Step 2: Exchange code for access token
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('FanVue OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}?error=fanvue_oauth_error&message=${error}`
    );
  }

  if (!code) {
    console.error('No authorization code received');
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}?error=no_code`
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.fanvue.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.FANVUE_CLIENT_ID,
        client_secret: process.env.FANVUE_CLIENT_SECRET,
        code: code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/fanvue/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log('FanVue token response:', JSON.stringify(tokenData, null, 2));

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}?error=token_exchange_failed`
      );
    }

    // Store the access token in KV store
    const { access_token, refresh_token, expires_in } = tokenData;
    
    await kv.set('fanvue:access_token', access_token);
    if (refresh_token) {
      await kv.set('fanvue:refresh_token', refresh_token);
    }
    if (expires_in) {
      await kv.set('fanvue:token_expires', Date.now() + (expires_in * 1000));
    }

    console.log('FanVue access token stored successfully!');

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}?success=fanvue_connected`
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}?error=oauth_callback_error`
    );
  }
}
