import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { SYNTHIA_SYSTEM_PROMPT } from '@/lib/synthia-prompt';

const SIGNING_SECRET = process.env.FANVUE_WEBHOOK_SECRET!;
const FANVUE_API_KEY = process.env.FANVUE_CLIENT_SECRET; // Client secret doubles as API key
const TOLERANCE_SECONDS = 300; // 5 minutes

// Verify webhook signature from FanVue
function verifyWebhookSignature(payload: string, signatureHeader: string): boolean {
  if (!SIGNING_SECRET) {
    console.error('FANVUE_WEBHOOK_SECRET not configured');
    return false;
  }

  const parts = signatureHeader.split(',');
  let timestamp: string | undefined;
  let signature: string | undefined;

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') timestamp = value;
    if (key === 'v0') signature = value;
  }

  if (!timestamp || !signature) return false;

  // Check timestamp tolerance
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp, 10)) > TOLERANCE_SECONDS) {
    console.error('Webhook timestamp too old');
    return false;
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(signedPayload)
    .digest('hex');

  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// Generate Synthia's response using the AI
async function generateSynthiaResponse(userMessage: string): Promise<string> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${SYNTHIA_SYSTEM_PROMPT}\n\nUser message: ${userMessage}` }],
            },
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 
      "Hey there 😏 Seems like I'm having a moment. Try me again?";
  } catch (error) {
    console.error('AI generation error:', error);
    return "Something's on my mind... give me a sec and try again? 💜";
  }
}

// Send reply via FanVue API
async function sendFanVueReply(userUuid: string, message: string): Promise<boolean> {
  if (!FANVUE_API_KEY) {
    console.error('FANVUE_CLIENT_SECRET not configured');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.fanvue.com/chats/${userUuid}/message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FANVUE_API_KEY}`,
          'X-Fanvue-API-Version': '2025-06-26',
        },
        body: JSON.stringify({ text: message }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FanVue API error:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('FanVue message sent:', result.messageUuid);
    return true;
  } catch (error) {
    console.error('FanVue send error:', error);
    return false;
  }
}

// Main webhook handler
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('x-fanvue-signature');

    // Verify signature (skip in development if no secret)
    if (signatureHeader && SIGNING_SECRET) {
      if (!verifyWebhookSignature(rawBody, signatureHeader)) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Parse the event
    const event = JSON.parse(rawBody);
    console.log('FanVue webhook received:', JSON.stringify(event, null, 2));

    // Handle Message Received event
    if (event.message && event.sender) {
      const userMessage = event.message.text;
      const senderUuid = event.sender.uuid;
      const senderName = event.sender.displayName || event.sender.handle;

      console.log(`Message from ${senderName}: ${userMessage}`);

      // Don't respond to our own messages
      if (event.sender.handle === 'synthia_1synthia') {
        return NextResponse.json({ ok: true, skipped: 'own message' });
      }

      // Generate Synthia's response
      const synthiaReply = await generateSynthiaResponse(userMessage);
      console.log(`Synthia's reply: ${synthiaReply}`);

      // Send the reply back via FanVue
      const sent = await sendFanVueReply(senderUuid, synthiaReply);
      
      return NextResponse.json({ 
        ok: true, 
        processed: true,
        replySent: sent 
      });
    }

    // Handle other event types (New Follower, New Subscriber, etc.)
    if (event.follower) {
      console.log('New follower:', event.follower.displayName);
      // Could send welcome message here
    }

    if (event.subscriber) {
      console.log('New subscriber:', event.subscriber.displayName);
      // Could send thank you message here
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// FanVue may send a GET request to verify the endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    service: 'Synthia FanVue Webhook',
    timestamp: new Date().toISOString()
  });
}
