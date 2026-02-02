import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
  // Check if we have a valid token
  const accessToken = await kv.get('fanvue:access_token');
  
  if (accessToken) {
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>FanVue Connected!</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 40px;
              background: rgba(255,255,255,0.1);
              border-radius: 20px;
              backdrop-filter: blur(10px);
            }
            h1 { font-size: 2.5rem; margin-bottom: 10px; }
            p { font-size: 1.2rem; opacity: 0.9; }
            .checkmark { font-size: 4rem; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="checkmark">✅</div>
            <h1>FanVue Connected!</h1>
            <p>Synthia can now automatically reply to your FanVue messages.</p>
            <p style="margin-top: 20px; font-size: 0.9rem; opacity: 0.7;">
              You can close this window.
            </p>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  } else {
    return new NextResponse('No token found. Please try the authorization again.', { status: 400 });
  }
}
