'use client'

import dynamic from 'next/dynamic'

const Map = dynamic(() => import('@/components/map/Map'), { ssr: false })

export default function Home() {
  return (
    <main className="flex flex-col h-screen">
      <header className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">🗺️ Zazza-Spot</h1>
        <nav className="flex gap-4 text-sm">
          <a href="/login" className="hover:underline">Accedi</a>
          <a href="/register" className="hover:underline">Registrati</a>
        </nav>
      </header>
      <div className="flex-1">
        <Map />
      </div>
    </main>
  )
}