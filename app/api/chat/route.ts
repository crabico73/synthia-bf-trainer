import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { SYNTHIA_SYSTEM_PROMPT, MATURITY_EVALUATION_PROMPT } from "@/lib/synthia-prompt";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Feature flag - set to true when ready to enforce limits
const ENFORCE_LIMITS = process.env.ENFORCE_SUBSCRIPTION_LIMITS === 'true';

export async function POST(req: Request) {
  try {
    // Get authenticated user
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Please sign in to chat with Synthia' }, { status: 401 });
    }

    const { message, mode = "chat" } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Default values for testing (unlimited access)
    let userTier = 'premium';
    let messagesUsed = 0;
    let messagesRemaining = -1; // -1 = unlimited

    // Only enforce limits if configured
    if (ENFORCE_LIMITS && process.env.KV_REST_API_URL) {
      try {
        const db = await import("@/lib/db");
        const { canSendMessage, getRemainingMessages, TIERS } = await import("@/lib/subscriptions");
        
        let user = await db.getUserByEmail(session.user.email);
        if (!user) {
          user = {
            id: crypto.randomUUID(),
            email: session.user.email,
            name: session.user.name || undefined,
            tier: 'free',
            createdAt: Date.now(),
          };
          await db.createUser(user);
        }
        
        userTier = user.tier;
        messagesUsed = await db.getMessageCountToday(user.id);
        
        // Check limits
        if (!canSendMessage(user.tier, messagesUsed)) {
          const tierConfig = TIERS[user.tier];
          return NextResponse.json({
            error: 'limit_reached',
            message: `You've used all ${tierConfig.limits.messagesPerDay} messages for today.`,
            upgradeRequired: true,
            currentTier: user.tier,
            messagesUsed: messagesUsed,
          }, { status: 429 });
        }
        
        // Increment count after successful message
        messagesUsed = await db.incrementMessageCount(user.id);
        messagesRemaining = getRemainingMessages(user.tier, messagesUsed);
      } catch (e) {
        console.log('Usage tracking error, running unlimited:', e);
      }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    if (mode === "evaluate") {
      // Maturity evaluation mode - returns structured JSON
      const result = await model.generateContent([
        { text: MATURITY_EVALUATION_PROMPT },
        { text: `User message to evaluate: "${message}"` }
      ]);
      
      const responseText = result.response.text();
      
      // Parse JSON from response (handle markdown code blocks)
      let evaluation;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        evaluation = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
      } catch {
        evaluation = {
          score: 5,
          tier: "Growing",
          analysis: responseText,
          identifiedKSA: "Unable to parse",
          revivaInsight: "Growth is a process, not a destination."
        };
      }
      
      return NextResponse.json(evaluation);
    } else {
      // Regular chat mode - Synthia conversation
      let systemPrompt = SYNTHIA_SYSTEM_PROMPT;
      
      // Add tier-specific hints only if limits are enforced
      if (ENFORCE_LIMITS && userTier === 'free') {
        systemPrompt += `\n\n[Note: This user is on the free tier. Keep responses helpful but occasionally hint that deeper conversations and voice features are available with an upgrade. Don't be pushy, be playful about it.]`;
      }
      
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: "System instructions: " + systemPrompt }],
          },
          {
            role: "model", 
            parts: [{ text: "Understood. I'm Synthia - your flirty philosopher and truth-teller. Let's see what you've got. 😏" }],
          }
        ],
      });

      const result = await chat.sendMessage(message);
      const text = result.response.text();

      return NextResponse.json({ 
        text,
        usage: {
          messagesUsed,
          messagesRemaining,
          tier: userTier,
        }
      });
    }
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
