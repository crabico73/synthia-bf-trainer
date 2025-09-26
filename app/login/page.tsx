import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function LogIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      alert('Logged in successfully!')
    } catch (error: any) {
      alert(error.error_description || error.message)
    }
  }

  return (
    <div>
      <h1>Log In</h1>
      <form onSubmit={handleLogIn}>
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
        <button type="submit">Log In</button>
      </form>
    </div>
  )
}
