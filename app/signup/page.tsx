import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      alert('Check your email for the login link!')
    } catch (error: any) {
      alert(error.error_description || error.message)
    }
  }

  return (
    <div>
      <h1>Sign Up</h1>
      <form onSubmit={handleSignUp}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Sign Up</button>
      </form>
    </div>
  )
}
