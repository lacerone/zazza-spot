'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()
  const [spots, setSpots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) { router.push('/'); return }

    loadPendingSpots()
  }

  const loadPendingSpots = async () => {
    const { data, error } = await supabase
      .from('spots')
      .select('*, profiles(username)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setSpots(data)
    setLoading(false)
  }

  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from('spots')
      .update({ status })
      .eq('id', id)

    if (error) {
      alert(error.message)
    } else {
      setSpots(s => s.filter(spot => spot.id !== id))
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-400">Caricamento...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-black px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white text-2xl font-bold">🛡️ Pannello Admin</h1>
            <p className="text-zinc-400 text-sm mt-1">Spot in attesa di approvazione</p>
          </div>
          <a href="/" className="text-zinc-400 hover:text-white text-sm hover:underline">
            ← Torna alla mappa
          </a>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {spots.length === 0 ? (
          <div className="bg-zinc-900 rounded-2xl p-8 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-white font-medium">Nessuno spot in attesa</p>
            <p className="text-zinc-400 text-sm mt-1">Tutti gli spot sono stati revisionati</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {spots.map(spot => (
              <div key={spot.id} className="bg-zinc-900 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-white font-bold text-lg">{spot.name}</h2>
                    <p className="text-zinc-400 text-sm">
                      Aggiunto da <span className="text-white">{spot.profiles?.username}</span>
                      {' · '}{new Date(spot.created_at).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <span className="bg-yellow-500/10 text-yellow-400 text-xs px-3 py-1 rounded-full">
                    In attesa
                  </span>
                </div>

                {spot.address && (
                  <p className="text-zinc-400 text-sm mb-2">📍 {spot.address}</p>
                )}
                {spot.description && (
                  <p className="text-zinc-300 text-sm mb-3">{spot.description}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">
                    {spot.category}
                  </span>
                  <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">
                    🚔 {spot.police_level}/10
                  </span>
                  {spot.has_fountain && <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">💧 Fontanella</span>}
                  {spot.has_space && <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">📐 Spazio</span>}
                  {spot.is_lit && <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">💡 Illuminato</span>}
                  {spot.is_covered && <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">🌧️ Coperto</span>}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => updateStatus(spot.id, 'approved')}
                    className="flex-1 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg px-4 py-2 transition text-sm"
                  >
                    ✅ Approva
                  </button>
                  <button
                    onClick={() => updateStatus(spot.id, 'rejected')}
                    className="flex-1 bg-zinc-800 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 font-semibold rounded-lg px-4 py-2 transition text-sm"
                  >
                    ❌ Rifiuta
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}