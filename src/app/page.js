'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const Map = dynamic(() => import('@/components/map/Map'), { ssr: false })

export default function Home() {
  const [user, setUser] = useState(null)

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
    <main className="flex flex-col h-screen">
      <header className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">🗺️ Zazza-Spot</h1>
        <nav className="flex gap-4 text-sm items-center">
          {user ? (
            <>
              <span className="text-zinc-400">Ciao, {user.user_metadata?.username}</span>
              <a href="/admin" className="text-zinc-400 hover:text-white text-sm">Admin</a>
              <button onClick={handleLogout} className="hover:underline">Esci</button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">Accedi</Link>
              <Link href="/register" className="hover:underline bg-white text-black px-3 py-1 rounded-full font-medium">Registrati</Link>
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