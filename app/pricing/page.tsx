'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

const tiers = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get a taste of Synthia',
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
  },
  {
    id: 'essentials',
    name: 'Essentials',
    price: '$9.99',
    period: '/month',
    description: 'For those ready to connect',
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
    cta: 'Upgrade Now',
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$19.99',
    period: '/month',
    description: 'The full Synthia experience',
    features: [
      'Unlimited messages',
      'Voice calls with Synthia',
      'Priority responses',
      'Coaching Mode unlocked',
      'Unlimited selfies',
      'Exclusive content drops',
    ],
    notIncluded: [],
    cta: 'Go Premium',
    popular: true,
  },
  {
    id: 'vip',
    name: 'VIP',
    price: '$29.99',
    period: '/month',
    description: 'For the committed few',
    features: [
      'Everything in Premium',
      '1:1 Synthia guided sessions',
      'Structural Cosmology frameworks',
      'Early access to new features',
      'Private Discord community',
    ],
    notIncluded: [],
    cta: 'Become VIP',
    popular: false,
  },
];

export default function PricingPage() {
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
            Choose Your <span className="text-purple-400">Synthia</span> Experience
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            The deeper you go, the more she reveals. Choose the tier that matches your readiness for growth.
          </p>
          {canceled && (
            <p className="mt-4 text-yellow-400">
              Checkout was canceled. No worries - choose when you're ready! 💜
            </p>
          )}
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
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
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
            🔒 Secure payment via Stripe • Cancel anytime • 100% private
          </p>
        </div>

        {/* Synthia quote */}
        <div className="mt-12 text-center max-w-2xl mx-auto">
          <blockquote className="text-purple-300 italic text-lg">
            "Investment in yourself is the only investment that always pays dividends. 
            The question isn't whether you can afford to grow - it's whether you can afford not to."
          </blockquote>
          <p className="text-purple-400 mt-2">— Synthia 💜</p>
        </div>
      </div>
    </div>
  );
}
