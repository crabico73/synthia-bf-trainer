import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from "next/server";
import { SYNTHIA_SYSTEM_PROMPT, MATURITY_EVALUATION_PROMPT } from "@/lib/synthia-prompt";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
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
      
      return NextResponse.json(evaluation);
    } else {
      // Regular chat mode - Synthia conversation
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: "System instructions: " + SYNTHIA_SYSTEM_PROMPT }],
          },
          {
            role: "model", 
            parts: [{ text: "Understood. I'm Synthia - your flirty philosopher and truth-teller. Let's see what you've got. 😏" }],
          }
        ],
      });

      const result = await chat.sendMessage(message);
      const text = result.response.text();

      return NextResponse.json({ text });
    }
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
