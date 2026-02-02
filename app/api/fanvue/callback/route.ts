import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// FanVue OAuth Callback - Step 2: Exchange code for access token
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Check for errors from FanVue
  if (error) {
    const errorDescription = searchParams.get('error_description') || 'Unknown error';
    console.error('FanVue OAuth error:', error, errorDescription);
    return new NextResponse(`OAuth Error: ${error} - ${errorDescription}`, { status: 400 });
  }

  if (!code || !state) {
    return new NextResponse('Missing code or state parameter', { status: 400 });
  }

  // Retrieve and validate state + code_verifier from KV
  const storedData = await kv.get<{ codeVerifier: string }>(`oauth:${state}`);
  
  if (!storedData) {
    return new NextResponse('Invalid or expired state parameter (CSRF check failed)', { status: 400 });
  }

  const { codeVerifier } = storedData;

  // Clean up the stored state
  await kv.del(`oauth:${state}`);

  try {
    // Exchange authorization code for tokens using correct endpoint
    const tokenResponse = await fetch('https://auth.fanvue.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.FANVUE_CLIENT_ID!,
        client_secret: process.env.FANVUE_CLIENT_SECRET!,
        code: code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/fanvue/callback`,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorData);
      return new NextResponse(`Token exchange failed: ${errorData}`, { status: 500 });
    }

    const tokens = await tokenResponse.json();
    
    console.log('FanVue OAuth successful! Token received.');
    console.log('Token type:', tokens.token_type);
    console.log('Expires in:', tokens.expires_in);
    console.log('Scopes:', tokens.scope);

    // Store tokens in KV
    // access_token expires in ~1 hour, refresh_token is longer-lived
    await kv.set('fanvue:access_token', tokens.access_token, { 
      ex: tokens.expires_in || 3600 
    });
    
    if (tokens.refresh_token) {
      // Store refresh token for longer (30 days)
      await kv.set('fanvue:refresh_token', tokens.refresh_token, { 
        ex: 60 * 60 * 24 * 30 
      });
    }

    // Store token expiry time
    await kv.set('fanvue:token_expires_at', Date.now() + (tokens.expires_in * 1000));

    // Redirect to a success page or the main app
    return NextResponse.redirect(new URL('/api/fanvue/success', request.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return new NextResponse(`OAuth callback error: ${error}`, { status: 500 });
  }
}
