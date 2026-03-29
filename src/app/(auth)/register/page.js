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
        <div className="w-full max-w-md text-center">
          <div className="bg-gradient-to-b from-zinc-900 to-black rounded-xl p-8 border border-zinc-800 shadow-2xl">
            <div className="text-6xl mb-4">📬</div>
            <h2 className="text-white text-2xl font-bold mb-3">Controlla la mail!</h2>
            <p className="text-zinc-400 mb-6">
              Abbiamo inviato un link di conferma a <span className="text-cyan-300 font-semibold">{email}</span>. Clicca sul link per attivare il tuo account.
            </p>
            <Link href="/login" className="inline-block bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold px-6 py-2 rounded-lg transition">
              Torna al login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🗺️</div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">Zazza-Spot</h1>
          <p className="text-zinc-400 mt-2">Unisciti alla community</p>
        </div>

        {/* Card */}
        <div className="bg-gradient-to-b from-zinc-900 to-black rounded-xl p-8 border border-zinc-800 shadow-2xl">
          <h2 className="text-white text-lg font-bold mb-6">Crea il tuo account</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <label className="text-zinc-300 text-sm mb-2 block font-medium">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 border border-zinc-700 focus:border-cyan-500 transition"
                placeholder="il_tuo_nome"
                required
              />
            </div>
            <div>
              <label className="text-zinc-300 text-sm mb-2 block font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 border border-zinc-700 focus:border-cyan-500 transition"
                placeholder="tu@esempio.com"
                required
              />
            </div>
            <div>
              <label className="text-zinc-300 text-sm mb-2 block font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 border border-zinc-700 focus:border-cyan-500 transition"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold rounded-lg px-4 py-3 transition disabled:opacity-50 mt-2"
            >
              {loading ? '⏳ Registrazione...' : '✨ Registrati'}
            </button>
          </form>

          <p className="text-zinc-400 text-sm mt-6 text-center">
            Hai già un account?{' '}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition">
              Accedi
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}