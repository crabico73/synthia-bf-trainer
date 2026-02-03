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

  // Get PKCE values from cookies
  const storedState = request.cookies.get('fanvue_oauth_state')?.value;
  const codeVerifier = request.cookies.get('fanvue_code_verifier')?.value;

  // Validate state
  if (!storedState || storedState !== state) {
    return new NextResponse('Invalid state parameter (CSRF check failed)', { status: 400 });
  }

  if (!codeVerifier) {
    return new NextResponse('Missing code verifier (session expired?)', { status: 400 });
  }

  try {
    // Exchange authorization code for tokens using correct endpoint
    // FanVue requires client_secret_basic (credentials in Authorization header)
    const credentials = Buffer.from(
      `${process.env.FANVUE_CLIENT_ID}:${process.env.FANVUE_CLIENT_SECRET}`
    ).toString('base64');

    const tokenResponse = await fetch('https://auth.fanvue.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
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

    // Create success response
    const successUrl = new URL('/api/fanvue/success', request.url);
    const response = NextResponse.redirect(successUrl);

    // Clear the PKCE cookies
    response.cookies.delete('fanvue_code_verifier');
    response.cookies.delete('fanvue_oauth_state');

    // Store tokens in secure cookies
    // Access token - shorter lived
    response.cookies.set('fanvue_access_token', tokens.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: tokens.expires_in || 3600,
      path: '/',
    });

    // Refresh token - longer lived (30 days)
    if (tokens.refresh_token) {
      response.cookies.set('fanvue_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }

    // Store tokens in Vercel KV for the webhook to use
    try {
      await kv.set('fanvue:access_token', tokens.access_token, {
        ex: tokens.expires_in || 3600 // expire when token expires
      });
      if (tokens.refresh_token) {
        await kv.set('fanvue:refresh_token', tokens.refresh_token, {
          ex: 60 * 60 * 24 * 30 // 30 days
        });
      }
      console.log('✅ FanVue tokens stored in KV successfully!');
    } catch (kvError) {
      console.error('Failed to store tokens in KV:', kvError);
      // Continue anyway - tokens are also in cookies
    }

    // Also log for backup/debugging
    console.log('=== FANVUE ACCESS TOKEN (backup) ===');
    console.log('FANVUE_ACCESS_TOKEN=' + tokens.access_token);
    console.log('=====================================');

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return new NextResponse(`OAuth callback error: ${error}`, { status: 500 });
  }
}
