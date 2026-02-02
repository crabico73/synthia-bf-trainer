import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Check if we have a valid token in cookies
  const accessToken = request.cookies.get('fanvue_access_token')?.value;
  
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
              max-width: 500px;
            }
            h1 { font-size: 2.5rem; margin-bottom: 10px; }
            p { font-size: 1.2rem; opacity: 0.9; }
            .checkmark { font-size: 4rem; margin-bottom: 20px; }
            .note {
              margin-top: 30px;
              padding: 20px;
              background: rgba(255,255,255,0.1);
              border-radius: 10px;
              font-size: 0.9rem;
            }
            code {
              background: rgba(0,0,0,0.2);
              padding: 2px 6px;
              border-radius: 4px;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="checkmark">✅</div>
            <h1>FanVue Connected!</h1>
            <p>Synthia can now automatically reply to your FanVue messages.</p>
            <div class="note">
              <strong>Next step:</strong> Check the Vercel logs - the access token has been logged there. 
              Add it as <code>FANVUE_ACCESS_TOKEN</code> in your environment variables for the webhook to use.
            </div>
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
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>FanVue Connection</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              text-align: center;
              padding: 40px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⚠️ No Token Found</h1>
            <p>Please try the authorization again.</p>
            <p><a href="/api/fanvue/authorize">Click here to connect FanVue</a></p>
          </div>
        </body>
      </html>
    `, {
      status: 400,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}
