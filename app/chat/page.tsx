"use client";
import { useState, useRef, useEffect } from "react";
import { generateSynthiaAudio } from "@/lib/elevenlabs";

type Message = {
  role: "user" | "synthia";
  content: string;
  timestamp: Date;
};

export default function SynthiaChat() {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Add Synthia's response
      setMessages((prev) => [
        ...prev,
        { role: "synthia", content: data.text, timestamp: new Date() },
      ]);

      // Voice for longer, meaningful responses (optional - costs money)
      // Uncomment if you want auto-voice:
      // if (data.text.length > 100) {
      //   playAudio(data.text);
      // }
      
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
    try {
      setAudioPlaying(true);
      const audioUrl = await generateSynthiaAudio(text.slice(0, 500)); // Limit for cost
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

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-900 via-purple-950 to-gray-900">
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
        <div className="flex gap-2">
          {audioPlaying && (
            <span className="text-amber-400 text-sm animate-pulse">🔊 Speaking...</span>
          )}
        </div>
      </header>

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
