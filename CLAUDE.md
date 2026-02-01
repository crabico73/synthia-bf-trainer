# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev    # Start development server (http://localhost:3000)
npm run build  # Build for production
npm run start  # Run production build
```

## Architecture

This is a Next.js 15 (App Router) application called "Synthia" - a chat interface powered by Google's Gemini AI with voice synthesis capabilities.

### Key Components

- **Authentication**: NextAuth.js with Google OAuth provider. Session state managed via `SessionProvider` wrapper in `app/components/Providers.tsx`. Unauthenticated users are redirected from `/chat` to the login page.

- **Chat API** (`app/api/chat/route.ts`): POST endpoint that forwards messages to Gemini 2.0 Flash model.

- **Maturity Evaluation** (`lib/syn-logic.ts`): Gemini-powered behavioral analysis that scores user messages on "structural integrity" (1-10) and categorizes into tiers (Adolescent/Growing/Supporting Partner).

- **Voice Synthesis** (`lib/elevenlabs.ts`): ElevenLabs text-to-speech integration. Triggered as audio reward when evaluation score >= 8.

### Environment Variables Required

```
GOOGLE_CLIENT_ID          # Google OAuth
GOOGLE_CLIENT_SECRET      # Google OAuth
GEMINI_API_KEY            # Gemini API (server-side)
NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY  # Gemini API (client-side)
ELEVENLABS_API_KEY        # Voice synthesis
SYNTHIA_VOICE_ID          # ElevenLabs voice ID
```

### Path Alias

`@/*` maps to project root (e.g., `@/lib/elevenlabs`).
