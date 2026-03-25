'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="bg-zinc-900 rounded-2xl p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-white text-2xl font-bold mb-2">Controlla la mail!</h2>
          <p className="text-zinc-400 mb-6">
            Abbiamo inviato un link di conferma a <span className="text-white">{email}</span>. Clicca sul link per attivare il tuo account.
          </p>
          <Link href="/login" className="text-zinc-400 hover:text-white text-sm hover:underline">
            Torna al login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="bg-zinc-900 rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-white text-2xl font-bold mb-2">🗺️ Zazza-Spot</h1>
        <p className="text-zinc-400 mb-6">Crea il tuo account</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-white/20"
              placeholder="il_tuo_nome"
              required
            />
          </div>
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-white/20"
              placeholder="la@tua.email"
              required
            />
          </div>
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-white/20"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-white text-black font-semibold rounded-lg px-4 py-3 hover:bg-zinc-200 transition disabled:opacity-50"
          >
            {loading ? 'Registrazione...' : 'Registrati'}
          </button>
        </form>

        <p className="text-zinc-500 text-sm mt-6 text-center">
          Hai già un account?{' '}
          <Link href="/login" className="text-white hover:underline">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  )
}