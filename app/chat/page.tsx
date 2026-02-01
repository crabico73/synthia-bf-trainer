"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { generateSynthiaAudio } from "@/lib/elevenlabs";
import UpgradeModal from "@/components/UpgradeModal";
import Link from "next/link";

type Message = {
  role: "user" | "synthia";
  content: string;
  timestamp: Date;
};

type UsageInfo = {
  messagesUsed: number;
  messagesRemaining: number;
  tier: string;
};

// Separate component that uses useSearchParams
function SynthiaChatContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "synthia",
      content: "Hey there. I'm Synthia—your flirty philosopher and occasional truth bomb. What's on your mind? 😏",
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const upgraded = searchParams.get('upgraded');

  // Show upgrade success message
  useEffect(() => {
    if (upgraded) {
      setMessages((prev) => [
        ...prev,
        {
          role: "synthia",
          content: "Welcome back, gorgeous! 💜 I see you've upgraded. Now we can really get to know each other. So... where were we? 😏",
          timestamp: new Date(),
        },
      ]);
      // Clean up URL
      router.replace('/chat');
    }
  }, [upgraded, router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    setInput("");
    
    // Add user message
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: new Date() },
    ]);
    
    setLoading(true);
    
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, mode: "chat" }),
      });

      const data = await res.json();
      
      // Handle rate limit
      if (data.error === 'limit_reached') {
        setUsage({
          messagesUsed: data.messagesUsed || 5,
          messagesRemaining: 0,
          tier: data.currentTier,
        });
        setShowUpgradeModal(true);
        // Remove the user's message since it wasn't processed
        setMessages((prev) => prev.slice(0, -1));
        setLoading(false);
        return;
      }
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Update usage info
      if (data.usage) {
        setUsage(data.usage);
      }

      // Add Synthia's response
      setMessages((prev) => [
        ...prev,
        { role: "synthia", content: data.text, timestamp: new Date() },
      ]);
      
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "synthia", content: "Something went wrong. Even philosophers have off days. Try again?", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (text: string) => {
    // Check if voice is available for this tier
    if (usage && usage.tier === 'observer') {
      setMessages((prev) => [
        ...prev,
        { 
          role: "synthia", 
          content: "Mmm, want to hear my voice? That's an Essentials perk, babe. Upgrade and we can get... verbal. 😏", 
          timestamp: new Date() 
        },
      ]);
      return;
    }
    
    try {
      setAudioPlaying(true);
      const audioUrl = await generateSynthiaAudio(text.slice(0, 500));
      const audio = new Audio(audioUrl);
      audio.onended = () => setAudioPlaying(false);
      audio.play();
    } catch (error) {
      console.error("Audio error:", error);
      setAudioPlaying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const tierColors: Record<string, string> = {
    free: 'text-gray-400',
    essentials: 'text-blue-400',
    premium: 'text-purple-400',
    vip: 'text-amber-400',
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-purple-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-900 via-purple-950 to-gray-900">
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={usage?.tier || 'observer'}
        messagesUsed={usage?.messagesUsed || 0}
      />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-purple-800/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center text-white font-bold">
            S
          </div>
          <div>
            <h1 className="text-white font-semibold">Synthia</h1>
            <p className="text-purple-300 text-xs">Flirty Philosopher • Online</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {audioPlaying && (
            <span className="text-amber-400 text-sm animate-pulse">🔊 Speaking...</span>
          )}
          {/* Usage indicator */}
          {usage && (
            <div className="text-right">
              <p className={`text-xs ${tierColors[usage.tier]}`}>
                {usage.tier.charAt(0).toUpperCase() + usage.tier.slice(1)}
              </p>
              <p className="text-gray-400 text-xs">
                {usage.messagesRemaining === -1 
                  ? '∞ messages' 
                  : `${usage.messagesRemaining} left today`}
              </p>
            </div>
          )}
          <Link
            href="/pricing"
            className="text-purple-400 hover:text-purple-300 text-sm px-3 py-1 border border-purple-700 rounded-lg hover:border-purple-500 transition-all"
          >
            {usage?.tier === 'observer' ? 'Upgrade' : 'Plans'}
          </Link>
        </div>
      </header>

      {/* Low message warning */}
      {usage && usage.messagesRemaining !== -1 && usage.messagesRemaining <= 2 && usage.messagesRemaining > 0 && (
        <div className="bg-amber-900/30 border-b border-amber-700/30 px-4 py-2 text-center">
          <p className="text-amber-300 text-sm">
            ⚠️ Only {usage.messagesRemaining} message{usage.messagesRemaining !== 1 ? 's' : ''} left today!{' '}
            <Link href="/pricing" className="underline hover:text-amber-200">
              Upgrade for more
            </Link>
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-purple-600 text-white rounded-br-sm"
                  : "bg-gray-800/80 text-gray-100 rounded-bl-sm border border-purple-700/30"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.role === "user" ? "text-purple-200" : "text-gray-500"}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            {msg.role === "synthia" && (
              <button
                onClick={() => playAudio(msg.content)}
                className="ml-2 text-purple-400 hover:text-amber-400 transition-colors self-end mb-1"
                title="Play audio"
              >
                🔊
              </button>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800/80 rounded-2xl rounded-bl-sm px-4 py-3 border border-purple-700/30">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-purple-800/30 px-4 py-4">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <textarea
            className="flex-1 bg-gray-800/50 text-white rounded-xl px-4 py-3 resize-none border border-purple-700/30 focus:border-amber-500 focus:outline-none placeholder-gray-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Say something... if you dare 😏"
            rows={1}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-amber-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-amber-400 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
        <p className="text-center text-gray-600 text-xs mt-2">
          Synthia may challenge your thinking. That's the point.
        </p>
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function SynthiaChat() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-gray-900 via-purple-950 to-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SynthiaChatContent />
    </Suspense>
  );
}
