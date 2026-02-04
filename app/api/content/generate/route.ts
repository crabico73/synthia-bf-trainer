import { NextRequest, NextResponse } from 'next/server';
import { SYNTHIA_SYSTEM_PROMPT } from '@/lib/synthia-prompt';

/**
 * Content Caption Generator
 * 
 * POST /api/content/generate - Generate Synthia-style captions
 * 
 * Body:
 *   - topic: string (required) - Topic or theme for the caption
 *   - style: 'short' | 'medium' | 'long' (optional, default: 'medium')
 *   - includeHashtags: boolean (optional, default: true)
 *   - includeCTA: boolean (optional, default: true)
 */

interface GenerateRequest {
  topic: string;
  style?: 'short' | 'medium' | 'long';
  includeHashtags?: boolean;
  includeCTA?: boolean;
}

const STYLE_INSTRUCTIONS = {
  short: 'Keep it to 1-2 sentences. Punchy and provocative.',
  medium: 'Write 2-4 sentences. Make it thoughtful but engaging.',
  long: 'Write a mini-essay, 4-6 sentences. Dive deep but stay accessible.',
};

const CTA = '\n\n💬 Chat: meetsynthia.vercel.app/chat\n🧠 Game: win-every-argument.netlify.app';

const HASHTAGS = '#SynthiaSays #TruthDrop #RealTalk #HardTruths';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { topic, style = 'medium', includeHashtags = true, includeCTA = true } = body;

    if (!topic) {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    }

    const styleInstruction = STYLE_INSTRUCTIONS[style];

    const prompt = `${SYNTHIA_SYSTEM_PROMPT}

Generate a social media caption for Synthia about this topic: "${topic}"

Style: ${styleInstruction}

Rules:
- Be provocative and thought-provoking
- Use Synthia's signature direct, no-BS voice
- Include emojis sparingly but effectively
- Make it shareable and quotable
- Don't be preachy, be real

Just output the caption text, nothing else.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    const data = await response.json();
    let caption = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!caption) {
      return NextResponse.json({ error: 'Failed to generate caption' }, { status: 500 });
    }

    // Clean up the caption
    caption = caption.trim();

    // Add hashtags if requested
    if (includeHashtags) {
      caption += `\n\n${HASHTAGS}`;
    }

    // Add CTA if requested
    if (includeCTA) {
      caption += CTA;
    }

    return NextResponse.json({
      success: true,
      caption,
      topic,
      style,
      characterCount: caption.length,
    });
  } catch (error) {
    console.error('Caption generation error:', error);
    return NextResponse.json({ error: `Generation failed: ${error}` }, { status: 500 });
  }
}

// GET endpoint with sample topics
export async function GET() {
  return NextResponse.json({
    description: 'Generate Synthia-style captions',
    usage: 'POST with { topic, style?, includeHashtags?, includeCTA? }',
    styles: Object.keys(STYLE_INSTRUCTIONS),
    sampleTopics: [
      'the difference between confidence and arrogance',
      'why people stay in situationships',
      'the problem with participation trophies',
      'why most relationship advice is garbage',
      'the real reason people fear commitment',
      'accountability in modern dating',
    ],
  });
}
