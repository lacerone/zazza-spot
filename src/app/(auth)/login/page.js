'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🗺️</div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">Zazza-Spot</h1>
          <p className="text-zinc-400 mt-2">Scopri i migliori spot</p>
        </div>

        {/* Card */}
        <div className="bg-gradient-to-b from-zinc-900 to-black rounded-xl p-8 border border-zinc-800 shadow-2xl">
          <h2 className="text-white text-lg font-bold mb-6">Accedi al tuo account</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold rounded-lg px-4 py-3 transition disabled:opacity-50 mt-2"
            >
              {loading ? '⏳ Accesso...' : '✨ Accedi'}
            </button>
          </form>

          <p className="text-zinc-400 text-sm mt-6 text-center">
            Non hai un account?{' '}
            <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold transition">
              Registrati
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}