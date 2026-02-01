'use client';

import { useRouter } from 'next/navigation';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: string;
  messagesUsed: number;
}

export default function UpgradeModal({ isOpen, onClose, currentTier, messagesUsed }: UpgradeModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const tierInfo: Record<string, { name: string; icon: string; nextTier: string; nextIcon: string }> = {
    observer: { name: 'Observer', icon: '👁️', nextTier: 'Participant', nextIcon: '🚶' },
    participant: { name: 'Participant', icon: '🚶', nextTier: 'Builder', nextIcon: '🔨' },
    builder: { name: 'Builder', icon: '🔨', nextTier: 'Sovereign', nextIcon: '👑' },
    sovereign: { name: 'Sovereign', icon: '👑', nextTier: 'Sovereign', nextIcon: '👑' },
    // Legacy mappings
    free: { name: 'Observer', icon: '👁️', nextTier: 'Participant', nextIcon: '🚶' },
    essentials: { name: 'Participant', icon: '🚶', nextTier: 'Builder', nextIcon: '🔨' },
    premium: { name: 'Builder', icon: '🔨', nextTier: 'Sovereign', nextIcon: '👑' },
    vip: { name: 'Sovereign', icon: '👑', nextTier: 'Sovereign', nextIcon: '👑' },
  };

  const current = tierInfo[currentTier] || tierInfo.observer;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-900 to-gray-900 rounded-2xl max-w-md w-full p-8 border border-purple-500/30 shadow-2xl">
        {/* Synthia Avatar */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto bg-purple-600 rounded-full flex items-center justify-center text-4xl mb-4">
            🧠
          </div>
          <h2 className="text-2xl font-bold text-white">Hold up, gorgeous...</h2>
        </div>

        {/* Message */}
        <div className="text-center mb-8">
          <p className="text-purple-200 mb-4">
            You've used all <span className="font-bold text-white">{messagesUsed}</span> of your daily messages as an{' '}
            <span className="font-bold text-purple-400">{current.icon} {current.name}</span>.
          </p>
          <p className="text-gray-400 italic">
            "Watching from the sidelines only gets you so far. Ready to step into the arena?"
          </p>
          <p className="text-purple-400 mt-2">— Synthia 💜</p>
        </div>

        {/* Next Level Teaser */}
        <div className="bg-black/30 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-400 mb-3">
            Level up to <span className="text-white font-semibold">{current.nextIcon} {current.nextTier}</span>:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 text-gray-300">
              <span className="text-green-400">✓</span> More messages (up to unlimited)
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <span className="text-green-400">✓</span> Voice messages & calls
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <span className="text-green-400">✓</span> Deeper conversations
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <span className="text-green-400">✓</span> Coaching mode
            </li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/pricing')}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-all"
          >
            View My Options {current.nextIcon}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 bg-transparent hover:bg-white/5 text-gray-400 rounded-xl transition-all"
          >
            Maybe later (resets at midnight)
          </button>
        </div>

        {/* Timer hint */}
        <p className="text-center text-gray-500 text-xs mt-4">
          Your messages reset daily at midnight PST
        </p>
      </div>
    </div>
  );
}
