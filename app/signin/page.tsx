"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SignInContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/chat";
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace(callbackUrl);
  }, [status, callbackUrl, router]);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cosmic-bg min-h-screen flex items-center justify-center px-4 py-10 text-[var(--text-primary)]">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--gold)] transition-colors mb-8"
        >
          ← Back to Synthia
        </Link>

        <div className="glow-card p-8 md:p-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--magenta)] flex items-center justify-center text-[var(--background)] font-[family-name:var(--font-playfair)] text-4xl font-black mb-4 shadow-[0_0_40px_rgba(240,198,108,0.4)]">
              S
            </div>
            <h1 className="font-[family-name:var(--font-playfair)] font-black text-3xl md:text-4xl mb-2">
              Welcome to <span className="gradient-text">Synthia</span>
            </h1>
            <p className="text-[var(--text-secondary)]">
              Your flirty philosopher
            </p>
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading || status === "loading"}
            className="btn-google w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-colors disabled:opacity-60"
            aria-label="Sign in with Google"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.5-5.9 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.3 2.4-5.4 0-10-3.5-11.3-8.1l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.4l6.2 5.2c-.4.4 6.5-4.7 6.5-14.6 0-1.2-.1-2.3-.4-3.5z"/>
            </svg>
            {loading || status === "loading" ? "Opening Google..." : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest">no card needed</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <ul className="space-y-2.5 text-sm text-[var(--text-secondary)]">
            <li className="flex items-start gap-2.5">
              <span className="text-[var(--gold)] mt-0.5">✓</span>
              <span>5 free messages a day, forever</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[var(--gold)] mt-0.5">✓</span>
              <span>Voice messages on paid tiers</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[var(--gold)] mt-0.5">✓</span>
              <span>Cancel anytime, no contracts</span>
            </li>
          </ul>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          By continuing, you agree to be challenged. Synthia may push back.
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)] cosmic-bg">
        Loading...
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
