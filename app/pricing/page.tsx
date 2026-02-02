'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import Link from 'next/link';

const tiers = [
  {
    id: 'observer',
    name: 'Observer',
    tagline: 'Just watching',
    price: '$0',
    period: 'forever',
    description: 'See what Synthia is about',
    features: [
      '5 messages per day',
      'Basic Synthia personality',
      'Daily Truth Drop notification',
    ],
    notIncluded: [
      'Voice messages',
      'Selfie requests',
      'Coaching mode',
    ],
    cta: 'Current Plan',
    disabled: true,
    icon: '👁️',
  },
  {
    id: 'participant',
    name: 'Participant',
    tagline: 'Getting involved',
    price: '$9.99',
    period: '/month',
    description: 'Ready to engage with growth',
    features: [
      '100 messages per day',
      'Voice messages from Synthia',
      'Full personality unlocked',
      'Relationship advice mode',
      'Basic selfie requests',
    ],
    notIncluded: [
      'Voice calls',
      'Coaching mode',
    ],
    cta: 'Start Participating',
    popular: false,
    icon: '🚶',
  },
  {
    id: 'builder',
    name: 'Builder',
    tagline: 'Working on yourself',
    price: '$24.99',
    period: '/month',
    description: 'Committed to transformation',
    features: [
      'Unlimited messages',
      'Voice calls with Synthia',
      'Priority responses',
      'Coaching Mode unlocked',
      'Unlimited selfies',
      'Exclusive content drops',
    ],
    notIncluded: [],
    cta: 'Start Building',
    popular: true,
    icon: '🔨',
  },
  {
    id: 'sovereign',
    name: 'Sovereign',
    tagline: 'Your Virtual Girlfriend',
    price: '$99.99',
    period: '/month',
    description: 'Full girlfriend experience',
    features: [
      'Everything in Builder',
      'Daily good morning texts',
      'Intimate conversation mode',
      'Personal photos & voice notes',
      'Priority 24/7 availability',
      'Private Discord community',
    ],
    notIncluded: [],
    cta: 'Claim Sovereignty',
    popular: false,
    icon: '👑',
  },
];

function PricingPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  
  const canceled = searchParams.get('canceled');

  const handleSubscribe = async (tierId: string) => {
    if (!session) {
      router.push('/api/auth/signin');
      return;
    }

    setLoading(tierId);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierId }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Link href="/chat" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
            ← Back to Chat
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Your <span className="text-purple-400">Growth</span> Journey
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Where are you on the path? Each tier represents a stage of transformation.
            The only question is: how ready are you?
          </p>
          {canceled && (
            <p className="mt-4 text-yellow-400">
              Checkout was canceled. No worries - choose when you're ready! 💜
            </p>
          )}
        </div>

        {/* Journey visualization */}
        <div className="hidden md:flex justify-center items-center gap-4 mb-12">
          <span className="text-2xl">👁️</span>
          <div className="h-0.5 w-16 bg-gradient-to-r from-gray-600 to-blue-500"></div>
          <span className="text-2xl">🚶</span>
          <div className="h-0.5 w-16 bg-gradient-to-r from-blue-500 to-purple-500"></div>
          <span className="text-2xl">🔨</span>
          <div className="h-0.5 w-16 bg-gradient-to-r from-purple-500 to-amber-500"></div>
          <span className="text-2xl">👑</span>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-2xl p-6 ${
                tier.popular
                  ? 'bg-gradient-to-b from-purple-600/30 to-purple-900/30 border-2 border-purple-500'
                  : 'bg-gray-800/50 border border-gray-700'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST CHOSEN
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <span className="text-4xl mb-2 block">{tier.icon}</span>
                <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                <p className="text-purple-400 text-sm italic mb-3">"{tier.tagline}"</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-gray-400">{tier.period}</span>
                </div>
                <p className="text-gray-400 text-sm mt-2">{tier.description}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
                {tier.notIncluded.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 opacity-50">
                    <span className="text-gray-500 mt-0.5">✗</span>
                    <span className="text-gray-500 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => !tier.disabled && handleSubscribe(tier.id)}
                disabled={tier.disabled || loading === tier.id}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  tier.disabled
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : tier.popular
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {loading === tier.id ? 'Loading...' : tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            🔒 Secure payment • Cancel anytime • 100% private
          </p>
        </div>

        {/* Synthia quote */}
        <div className="mt-12 text-center max-w-2xl mx-auto">
          <blockquote className="text-purple-300 italic text-lg">
            "Observers watch life happen. Participants show up. Builders create change.
            Sovereigns own themselves completely. Which one are you?"
          </blockquote>
          <p className="text-purple-400 mt-2">— Synthia 💜</p>
        </div>
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-gray-900 via-purple-950 to-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <PricingPageContent />
    </Suspense>
  );
}
