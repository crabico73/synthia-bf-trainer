'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface Message {
  text: string
  isUser: boolean
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hey there. What\'s on your mind?", isUser: false },
  ])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<null | HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = { text: input, isUser: true }
    setMessages((prev) => [...prev, userMessage])
    setInput('')

    const synthiaTyping: Message = { text: '...', isUser: false }
    setMessages((prev) => [...prev, synthiaTyping])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()
      const synthiaResponse: Message = { text: data.text, isUser: false }
      setMessages((prev) => [...prev.slice(0, -1), synthiaResponse])

    } catch (error) {
      console.error("Failed to send message:", error)
      const errorResponse: Message = { text: 'Sorry, I seem to be having trouble connecting. Let\'s try that again.', isUser: false }
      setMessages((prev) => [...prev.slice(0, -1), errorResponse])
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="p-4 border-b border-gray-700 flex items-center">
        <Image
          src="/synthia.png"
          alt="Synthia"
          width={50}
          height={50}
          className="rounded-full mr-4"
        />
        <div>
          <h1 className="text-xl font-bold text-purple-400">Synthia</h1>
          <p className="text-sm text-gray-400">Your flirty philosopher</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
            {!msg.isUser && (
              <Image
                src="/synthia.png"
                alt="Synthia"
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
                msg.isUser
                  ? 'bg-yellow-500 text-black rounded-br-none'
                  : 'bg-gray-700 rounded-bl-none'
              }`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 bg-gray-700 text-white rounded-l-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Ask Synthia a question..."
          />
          <button
            onClick={sendMessage}
            className="bg-purple-600 text-white font-bold px-6 py-3 rounded-r-lg hover:bg-purple-700 transition">
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
