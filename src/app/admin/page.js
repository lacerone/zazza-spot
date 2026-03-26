'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()
  const [spots, setSpots] = useState([])
  const [corrections, setCorrections] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('spots')

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

    await Promise.all([loadPendingSpots(), loadPendingCorrections()])
    setLoading(false)
  }

  const loadPendingSpots = async () => {
    const { data } = await supabase
      .from('spots')
      .select('*, profiles(username)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (data) setSpots(data)
  }

  const loadPendingCorrections = async () => {
    const { data } = await supabase
      .from('corrections')
      .select('*, profiles(username), spots(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (data) setCorrections(data)
  }

  const updateSpotStatus = async (id, status) => {
    await supabase.from('spots').update({ status }).eq('id', id)
    setSpots(s => s.filter(spot => spot.id !== id))
  }

  const updateCorrection = async (correction, status) => {
    await supabase.from('corrections').update({ status }).eq('id', correction.id)

    if (status === 'approved') {
      const value = correction.new_value === 'true' ? true
        : correction.new_value === 'false' ? false
        : isNaN(correction.new_value) ? correction.new_value
        : Number(correction.new_value)

      await supabase
        .from('spots')
        .update({ [correction.field_name]: value })
        .eq('id', correction.spot_id)
    }

    setCorrections(c => c.filter(cor => cor.id !== correction.id))
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-400">Caricamento...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-black px-6 py-8">
      <div className="max-w-3xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">🛡️ Pannello Admin</h1>
          </div>
          <a href="/" className="text-zinc-400 hover:text-white text-sm">← Mappa</a>
        </div>

        {/* Tab */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('spots')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${tab === 'spots' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
          >
            Spot in attesa {spots.length > 0 && <span className="ml-1 bg-yellow-400 text-black text-xs px-1.5 py-0.5 rounded-full">{spots.length}</span>}
          </button>
          <button
            onClick={() => setTab('corrections')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${tab === 'corrections' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
          >
            Correzioni {corrections.length > 0 && <span className="ml-1 bg-yellow-400 text-black text-xs px-1.5 py-0.5 rounded-full">{corrections.length}</span>}
          </button>
        </div>

        {/* Spot pendenti */}
        {tab === 'spots' && (
          spots.length === 0 ? (
            <div className="bg-zinc-900 rounded-2xl p-8 text-center">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-white font-medium">Nessuno spot in attesa</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {spots.map(spot => (
                <div key={spot.id} className="bg-zinc-900 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="text-white font-bold text-lg">{spot.name}</h2>
                      <p className="text-zinc-400 text-sm">
                        da <span className="text-white">{spot.profiles?.username}</span>
                        {' · '}{new Date(spot.created_at).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <span className="bg-yellow-500/10 text-yellow-400 text-xs px-3 py-1 rounded-full">In attesa</span>
                  </div>
                  {spot.address && <p className="text-zinc-400 text-sm mb-2">📍 {spot.address}</p>}
                  {spot.description && <p className="text-zinc-300 text-sm mb-3">{spot.description}</p>}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">{spot.category}</span>
                    <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">🚔 {spot.police_level}/10</span>
                    {spot.has_fountain && <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">💧 Fontanella</span>}
                    {spot.has_space && <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">📐 Spazio</span>}
                    {spot.is_lit && <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">💡 Illuminato</span>}
                    {spot.is_covered && <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">🌧️ Coperto</span>}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => updateSpotStatus(spot.id, 'approved')}
                      className="flex-1 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg px-4 py-2 transition text-sm"
                    >
                      ✅ Approva
                    </button>
                    <button
                      onClick={() => updateSpotStatus(spot.id, 'rejected')}
                      className="flex-1 bg-zinc-800 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 font-semibold rounded-lg px-4 py-2 transition text-sm"
                    >
                      ❌ Rifiuta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Correzioni pendenti */}
        {tab === 'corrections' && (
          corrections.length === 0 ? (
            <div className="bg-zinc-900 rounded-2xl p-8 text-center">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-white font-medium">Nessuna correzione in attesa</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {corrections.map(correction => (
                <div key={correction.id} className="bg-zinc-900 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <a href={'/spot/' + correction.spot_id} className="text-white font-bold hover:underline">✏️ {correction.spots?.name}</a>
                      <p className="text-zinc-400 text-sm">
                        da <span className="text-white">{correction.profiles?.username}</span>
                        {' · '}{new Date(correction.created_at).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <span className="bg-yellow-500/10 text-yellow-400 text-xs px-3 py-1 rounded-full">In attesa</span>
                  </div>
                  <div className="bg-zinc-800 rounded-xl p-4 mb-4 text-sm">
                    <p className="text-zinc-400 mb-1">Campo: <span className="text-white font-medium">{correction.field_name}</span></p>
                    <p className="text-zinc-400 mb-1">Valore attuale: <span className="text-red-400 line-through">{correction.old_value}</span></p>
                    <p className="text-zinc-400">Nuovo valore: <span className="text-green-400 font-medium">{correction.new_value}</span></p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => updateCorrection(correction, 'approved')}
                      className="flex-1 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg px-4 py-2 transition text-sm"
                    >
                      ✅ Approva
                    </button>
                    <button
                      onClick={() => updateCorrection(correction, 'rejected')}
                      className="flex-1 bg-zinc-800 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 font-semibold rounded-lg px-4 py-2 transition text-sm"
                    >
                      ❌ Rifiuta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

      </div>
    </div>
  )
}