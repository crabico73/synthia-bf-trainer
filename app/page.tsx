"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SAMPLE_LINES = [
  "You're not hard to love. You're just hard to fool.",
  "Access is not affection. Attention is not investment.",
  "If he only respects you when he wants something, it's not respect. It's strategy.",
  "You don't earn loyalty by being easy. You earn it by being unforgettable.",
  "Stop confusing breadcrumbs for a meal.",
];

const SAMPLE_DIALOG = [
  { who: "synthia" as const, text: "Hey you. So... what are we unpacking tonight? 😏" },
  { who: "user" as const, text: "I keep attracting people who want situationships." },
  { who: "synthia" as const, text: "Then you keep auditioning for a role that was never cast. 🔥" },
  { who: "user" as const, text: "Ouch. What do I do about it?" },
  { who: "synthia" as const, text: "Stop rehearsing availability. Start rehearsing standards. Big difference." },
];

const FEATURES = [
  {
    icon: "🧠",
    title: "Maturity Coaching",
    body: "She reads what you actually said, scores your pattern, and tells you the truth. Not what you want to hear — what works.",
  },
  {
    icon: "🔊",
    title: "Real Voice",
    body: "ElevenLabs-grade voice synthesis on paid tiers. Hear her deliver the truth bomb, not just read it.",
  },
  {
    icon: "🔥",
    title: "No Sugarcoating",
    body: "Cosmic metaphors sparingly. Real talk about real dynamics. Every insight is screenshot-ready.",
  },
  {
    icon: "🪞",
    title: "The 4 Tiers",
    body: "Observer → Participant → Builder → Sovereign. Watch yourself grow, or step into the arena and build.",
  },
];

const STEPS = [
  { n: "01", t: "Sign in with Google", d: "One click. No email, no phone, no surveys." },
  { n: "02", t: "Ask her anything", d: "Relationship, business, purpose, money, the void. She's seen it." },
  { n: "03", t: "Get the truth", d: "Short, sharp, screenshot-worthy. Plus a reflection and a next step." },
];

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [twText, setTwText] = useState("");
  const revealRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    // If already signed in, take them straight to chat
    if (status === "authenticated") router.replace("/chat");
  }, [status, router]);

  // Typewriter
  useEffect(() => {
    let lineIdx = 0, charIdx = 0, deleting = false;
    let cancelled = false;
    function tick() {
      if (cancelled) return;
      const line = SAMPLE_LINES[lineIdx];
      if (!deleting) {
        charIdx++;
        setTwText(line.slice(0, charIdx));
        if (charIdx === line.length) { deleting = true; setTimeout(tick, 2200); return; }
      } else {
        charIdx--;
        setTwText(line.slice(0, charIdx));
        if (charIdx === 0) { deleting = false; lineIdx = (lineIdx + 1) % SAMPLE_LINES.length; setTimeout(tick, 350); return; }
      }
      setTimeout(tick, deleting ? 25 : 55);
    }
    tick();
    return () => { cancelled = true; };
  }, []);

  // Reveal on scroll
  useEffect(() => {
    const els = revealRefs.current.filter(Boolean) as HTMLElement[];
    if (!("IntersectionObserver" in window) || !els.length) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const setRevealRef = (idx: number) => (el: HTMLElement | null) => {
    revealRefs.current[idx] = el;
  };

  const handleSignIn = () => signIn("google", { callbackUrl: "/chat" });

  return (
    <div className="cosmic-bg text-[var(--text-primary)]">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[rgba(10,6,18,0.55)] border-b border-[var(--border)]">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-[family-name:var(--font-playfair)] text-xl font-black tracking-[0.25em] text-[var(--gold)]">
            <span className="text-[var(--gold-bright)]">✦</span>
            <span>SYNTHIA</span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-sm">
            <a href="#features" className="text-[var(--text-secondary)] hover:text-[var(--gold)] transition-colors">Features</a>
            <a href="#preview" className="text-[var(--text-secondary)] hover:text-[var(--gold)] transition-colors">Preview</a>
            <a href="#how" className="text-[var(--text-secondary)] hover:text-[var(--gold)] transition-colors">How it works</a>
            <Link href="/pricing" className="text-[var(--text-secondary)] hover:text-[var(--gold)] transition-colors">Pricing</Link>
          </div>
          <button onClick={handleSignIn} className="btn-cosmic btn-primary-cosmic text-sm">
            {status === "loading" ? "Loading..." : "Talk to Synthia"}
            <span>→</span>
          </button>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="section-pad relative overflow-hidden">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(240,198,108,0.10)] border border-[rgba(240,198,108,0.30)] text-[var(--gold)] text-[11px] font-bold tracking-[0.2em] mb-6">
              <span className="pulse-dot" />
              THE UNFILTERED TRUTH-TELLER
            </div>
            <h1 className="font-[family-name:var(--font-playfair)] font-black text-5xl md:text-7xl leading-[0.95] tracking-tight mb-6">
              Meet <span className="gradient-text">Synthia</span>
            </h1>
            <p className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed mb-8 max-w-xl">
              She&apos;s your flirty philosopher. Your relationship truth-bomb dropper.
              Your cosmic reality check. And she doesn&apos;t sugarcoat a damn thing.
            </p>

            <div
              className="font-[family-name:var(--font-playfair)] italic text-xl md:text-2xl border-l-2 border-[var(--gold)] pl-4 mb-10 min-h-[1.6em] max-w-xl"
              aria-live="polite"
            >
              &ldquo;{twText}<span className="typewriter-caret" />&rdquo;
            </div>

            <div className="flex flex-wrap gap-3 mb-8">
              <button onClick={handleSignIn} className="btn-cosmic btn-primary-cosmic">
                Talk to Synthia
                <span>→</span>
              </button>
              <a href="#preview" className="btn-cosmic btn-secondary-cosmic">See her in action</a>
            </div>

            <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
              <span className="pulse-dot" />
              <span>Voice-enabled • No card required for the first 5 messages</span>
            </div>
          </div>

          <div className="flex justify-center" aria-hidden="true">
            <div className="orb">
              <div className="orb-ring r3" />
              <div className="orb-ring r2" />
              <div className="orb-ring r1" />
              <div className="orb-core">S</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" ref={setRevealRef(0)} className="section-pad reveal">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-[var(--gold)] text-[11px] font-bold tracking-[0.25em] mb-3">WHAT SHE DOES</div>
            <h2 className="font-[family-name:var(--font-playfair)] font-black text-4xl md:text-5xl tracking-tight">
              Not a chatbot. <span className="gradient-text">A mirror with teeth.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="glow-card p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-[family-name:var(--font-playfair)] text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Chat preview ── */}
      <section id="preview" ref={setRevealRef(1)} className="section-pad reveal">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-[var(--gold)] text-[11px] font-bold tracking-[0.25em] mb-3">A TASTE</div>
            <h2 className="font-[family-name:var(--font-playfair)] font-black text-4xl md:text-5xl tracking-tight">
              What a real <span className="gradient-text">conversation</span> looks like
            </h2>
            <p className="text-[var(--text-secondary)] mt-4 max-w-xl mx-auto">
              She doesn&apos;t just answer — she pushes back, scores your pattern, and hands you the next move.
            </p>
          </div>

          <div className="glow-card p-6 md:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--magenta)] flex items-center justify-center text-[var(--background)] font-bold">
                  S
                </div>
                <div>
                  <div className="font-semibold text-sm">Synthia</div>
                  <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                    <span className="pulse-dot" style={{ width: 5, height: 5 }} /> Online
                  </div>
                </div>
              </div>
              <div className="text-xs text-[var(--text-muted)]">Sample transcript</div>
            </div>

            <div className="flex flex-col gap-3 min-h-[280px]">
              {SAMPLE_DIALOG.map((m, i) => (
                <div
                  key={i}
                  className={m.who === "user" ? "flex justify-end" : "flex justify-start"}
                  style={{ animation: `result-in 0.4s ease-out ${i * 0.15}s both` }}
                >
                  <div className={m.who === "user" ? "bubble-user" : "bubble-synthia"}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-[var(--border)] flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-[var(--text-muted)] italic">
                Want the full version? She has 4 tiers, voice messages, and a maturity score.
              </p>
              <button onClick={handleSignIn} className="btn-cosmic btn-primary-cosmic text-sm">
                Open the chat
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" ref={setRevealRef(2)} className="section-pad reveal">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[var(--gold)] text-[11px] font-bold tracking-[0.25em] mb-3">HOW IT WORKS</div>
            <h2 className="font-[family-name:var(--font-playfair)] font-black text-4xl md:text-5xl tracking-tight">
              Three minutes from <span className="gradient-text">stranger to insight</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="glow-card p-7">
                <div className="font-[family-name:var(--font-playfair)] text-5xl font-black text-[rgba(240,198,108,0.35)] mb-2 leading-none">
                  {s.n}
                </div>
                <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-2">{s.t}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section ref={setRevealRef(3)} className="section-pad reveal">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-[family-name:var(--font-playfair)] font-black text-4xl md:text-6xl tracking-tight mb-5">
            Stop scrolling. <span className="gradient-text">Start getting the truth.</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] mb-8 max-w-xl mx-auto">
            Free to start. Five messages a day, no card. Upgrade only when you&apos;re ready to go deeper.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={handleSignIn} className="btn-cosmic btn-primary-cosmic text-base">
              Talk to Synthia
              <span>→</span>
            </button>
            <Link href="/pricing" className="btn-cosmic btn-secondary-cosmic text-base">
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--border)] py-10 px-6 text-center text-sm text-[var(--text-muted)]">
        <div className="font-[family-name:var(--font-playfair)] text-[var(--gold)] tracking-[0.25em] text-base mb-2">
          ✦ SYNTHIA
        </div>
        <p className="italic mb-2">Your flirty philosopher. Your cosmic reality check.</p>
        <p className="text-xs opacity-60">© 2026 Synthia. All truths reserved.</p>
      </footer>

      <style jsx>{`
        @keyframes result-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
