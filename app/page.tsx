
"use client"

import { signIn, useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function Page() {
  const { data: session } = useSession()

  if (session) {
    redirect('/chat')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold">
          Welcome to Synthia
        </h1>

        <p className="mt-3 text-2xl">
          Your flirty philosopher
        </p>

        <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full">
          <button
            onClick={() => signIn('google')}
            className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-blue-600 focus:text-blue-600"
          >
            <h3 className="text-2xl font-bold">Login with Google &rarr;</h3>
            <p className="mt-4 text-xl">
              Sign in to start chatting with Synthia.
            </p>
          </button>
        </div>
      </main>
    </div>
  )
}
