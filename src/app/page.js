'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const Map = dynamic(() => import('@/components/map/Map'), { ssr: false })

export default function Home() {
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <main className="flex flex-col h-screen bg-black">
      <header className="bg-gradient-to-r from-black via-zinc-900 to-black border-b border-zinc-800 text-white px-6 py-4 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🗺️</span>
          <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">Zazza-Spot</h1>
        </div>
        
        <nav className="flex gap-4 text-sm items-center">
          {user ? (
            <>
              {/* Desktop menu */}
              <div className="hidden lg:flex items-center gap-4">
                <Link href="/profile" className="text-zinc-300 hover:text-cyan-300 transition font-medium">
                  Profilo
                </Link>
                <Link href="/admin" className="text-zinc-300 hover:text-cyan-300 transition font-medium">
                  Admin
                </Link>
              </div>
              
              <div className="flex items-center gap-2 pl-4 border-l border-zinc-700">
                <span className="text-zinc-400">Ciao,</span>
                <span className="text-cyan-300 font-semibold hidden sm:inline">{user.user_metadata?.username}</span>
              </div>
              
              <button 
                onClick={handleLogout}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-2 rounded-lg transition font-medium text-xs"
              >
                Esci
              </button>

              {/* Mobile burger menu */}
              <div className="lg:hidden relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="text-zinc-300 hover:text-cyan-300 transition font-bold text-xl"
                >
                  ☰
                </button>
                
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-xl shadow-2xl p-3 space-y-2 z-50">
                    <Link 
                      href="/profile" 
                      className="block text-zinc-300 hover:text-cyan-300 hover:bg-zinc-800/50 px-4 py-2 rounded-lg transition font-medium text-sm"
                      onClick={() => setMenuOpen(false)}
                    >
                      👤 Profilo
                    </Link>
                    <Link 
                      href="/admin" 
                      className="block text-zinc-300 hover:text-cyan-300 hover:bg-zinc-800/50 px-4 py-2 rounded-lg transition font-medium text-sm"
                      onClick={() => setMenuOpen(false)}
                    >
                      🛡️ Admin
                    </Link>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-zinc-300 hover:text-cyan-300 transition font-medium">
                Accedi
              </Link>
              <Link href="/register" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black px-4 py-2 rounded-full font-bold transition shadow-lg">
                Registrati
              </Link>
            </>
          )}
        </nav>
      </header>
      <div className="flex-1 relative">
        <Map user={user} />
      </div>
    </main>
  )
}