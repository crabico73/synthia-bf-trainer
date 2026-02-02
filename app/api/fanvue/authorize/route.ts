import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import crypto from 'crypto';

// Helper function for Base64URL encoding
function base64URLEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Generate code verifier (43-128 characters)
function generateCodeVerifier(): string {
  return base64URLEncode(crypto.randomBytes(32));
}

// Generate code challenge from verifier (SHA-256)
function generateCodeChallenge(verifier: string): string {
  return base64URLEncode(
    crypto.createHash('sha256').update(verifier).digest()
  );
}

// FanVue OAuth Authorization - Step 1: Redirect to FanVue
export async function GET() {
  const clientId = process.env.FANVUE_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/fanvue/callback`;
  
  // Generate PKCE values
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  
  // Generate state for CSRF protection
  const state = crypto.randomBytes(32).toString('hex');
  
  // Store code_verifier and state in KV (expires in 10 minutes)
  await kv.set(`oauth:${state}`, { codeVerifier }, { ex: 600 });

  // All the scopes we need (including required ones)
  const scopes = [
    'openid',           // Required for OpenID Connect
    'offline_access',   // Required for refresh tokens
    'offline',          // Required for long-term access
    'read:chat',
    'write:chat',
    'read:creator',
    'read:fan',
    'read:self'
  ].join(' ');

  // Use the correct FanVue OAuth endpoint
  const authUrl = new URL('https://auth.fanvue.com/oauth2/auth');
  authUrl.searchParams.set('client_id', clientId!);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  console.log('Redirecting to FanVue OAuth:', authUrl.toString());
  
  return NextResponse.redirect(authUrl.toString());
}
