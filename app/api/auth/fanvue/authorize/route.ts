import { NextResponse } from 'next/server';

// FanVue OAuth Authorization - Step 1: Redirect to FanVue
export async function GET() {
  const clientId = process.env.FANVUE_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/fanvue/callback`;
  
  // All the scopes we need
  const scopes = [
    'read:chat',
    'write:chat',
    'read:creator',
    'read:fan',
    'read:self'
  ].join(' ');

  const authUrl = new URL('https://www.fanvue.com/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId!);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes);

  console.log('Redirecting to FanVue OAuth:', authUrl.toString());
  
  return NextResponse.redirect(authUrl.toString());
}
