import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { SYNTHIA_SYSTEM_PROMPT } from '@/lib/synthia-prompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Per-process in-memory rate limiter: 5 requests per IP per hour.
// Good enough for the demo. Vercel serverless will reset on cold start,
// which is fine — we just don't want the same IP hammering us all day.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 5;
const buckets = new Map<string, number[]>();

function clientIp(req: Request): string {
    const fwd = req.headers.get('x-forwarded-for');
    if (fwd) return fwd.split(',')[0].trim();
    const real = req.headers.get('x-real-ip');
    if (real) return real;
    return 'unknown';
}

function rateLimit(ip: string): { ok: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const arr = (buckets.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
    if (arr.length >= MAX_REQUESTS) {
        const oldest = arr[0];
        return { ok: false, remaining: 0, resetAt: oldest + WINDOW_MS };
    }
    arr.push(now);
    buckets.set(ip, arr);
    return { ok: true, remaining: MAX_REQUESTS - arr.length, resetAt: now + WINDOW_MS };
}

const SUGGESTION_PROMPTS = [
    'I keep attracting people who only want situationships',
    'How do I stop people-pleasing?',
    'I feel stuck in my career',
    'How do I know if someone is emotionally available?',
    'Why do I feel empty even when things are going well?',
];

const INPUT_MAX = 280;

export async function POST(req: Request) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: 'Sample insight is temporarily unavailable. Try again later.' },
            { status: 503 }
        );
    }

    const ip = clientIp(req);
    const limit = rateLimit(ip);
    if (!limit.ok) {
        return NextResponse.json(
            {
                error:
                    "You've used all your free samples for now. Sign in to keep talking to Synthia.",
                retryAfter: Math.ceil((limit.resetAt - Date.now()) / 1000),
            },
            {
                status: 429,
                headers: {
                    'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
                },
            }
        );
    }

    let body: { message?: unknown };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const raw = typeof body.message === 'string' ? body.message.trim() : '';
    if (!raw) {
        return NextResponse.json(
            { error: "Tell Synthia what's on your mind." },
            { status: 400 }
        );
    }
    if (raw.length > INPUT_MAX) {
        return NextResponse.json(
            { error: `Keep it under ${INPUT_MAX} characters for the demo.` },
            { status: 400 }
        );
    }

    // Block obvious abuse patterns
    if (/^\s*$/.test(raw) || /(.)\1{40,}/.test(raw)) {
        return NextResponse.json({ error: "That doesn't look like a real thought." }, { status: 400 });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                temperature: 0.9,
                topP: 0.95,
                maxOutputTokens: 220,
            },
        });

        const demoPreamble = `\n\n[Demo mode: this is a one-shot free sample, not a back-and-forth conversation. Keep the response to 2-4 sentences MAX. Be punchy, insightful, screenshot-worthy. End with a single, short, inviting line that suggests signing up for the full experience. Do NOT mention the demo, rate limits, or being an AI.]`;

        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: 'System instructions: ' + SYNTHIA_SYSTEM_PROMPT + demoPreamble }],
                },
                {
                    role: 'model',
                    parts: [
                        {
                            text: "Understood. I'm Synthia. One shot, make it count.",
                        },
                    ],
                },
            ],
        });

        const result = await chat.sendMessage(raw);
        const text = (result.response.text() || '').trim();

        if (!text) {
            return NextResponse.json(
                { error: "Synthia came up empty. Try another angle." },
                { status: 502 }
            );
        }

        return NextResponse.json(
            { text, remaining: limit.remaining },
            { headers: { 'X-RateLimit-Remaining': String(limit.remaining) } }
        );
    } catch (err) {
        console.error('[sample-insight] error:', err);
        return NextResponse.json(
            { error: 'Synthia is temporarily unavailable. Try again in a moment.' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        ok: true,
        maxRequests: MAX_REQUESTS,
        windowMinutes: WINDOW_MS / 60000,
        suggestions: SUGGESTION_PROMPTS,
    });
}
