import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { SYNTHIA_SYSTEM_PROMPT, MATURITY_EVALUATION_PROMPT } from "@/lib/synthia-prompt";
import { getUserByEmail, createUser, getMessageCountToday, incrementMessageCount } from "@/lib/db";
import { canSendMessage, getRemainingMessages, TIERS } from "@/lib/subscriptions";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    // Get authenticated user
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Please sign in to chat with Synthia' }, { status: 401 });
    }

    // Get or create user
    let user = await getUserByEmail(session.user.email);
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        email: session.user.email,
        name: session.user.name || undefined,
        tier: 'free',
        createdAt: Date.now(),
      };
      await createUser(user);
    }

    // Check message limits
    const messageCount = await getMessageCountToday(user.id);
    if (!canSendMessage(user.tier, messageCount)) {
      const tierConfig = TIERS[user.tier];
      return NextResponse.json({
        error: 'limit_reached',
        message: `You've used all ${tierConfig.limits.messagesPerDay} messages for today.`,
        upgradeRequired: true,
        currentTier: user.tier,
        nextTier: user.tier === 'free' ? 'essentials' : user.tier === 'essentials' ? 'premium' : 'vip',
      }, { status: 429 });
    }

    const { message, mode = "chat" } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
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
      
      // Increment message count
      await incrementMessageCount(user.id);
      
      return NextResponse.json(evaluation);
    } else {
      // Regular chat mode - Synthia conversation
      
      // Add tier-specific personality hints
      let systemPrompt = SYNTHIA_SYSTEM_PROMPT;
      if (user.tier === 'free') {
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

      // Increment message count
      const newCount = await incrementMessageCount(user.id);
      const remaining = getRemainingMessages(user.tier, newCount);

      return NextResponse.json({ 
        text,
        usage: {
          messagesUsed: newCount,
          messagesRemaining: remaining,
          tier: user.tier,
        }
      });
    }
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
