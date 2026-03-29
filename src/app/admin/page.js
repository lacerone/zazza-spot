'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminPage() {
  const router = useRouter()
  const [spots, setSpots] = useState([])
  const [corrections, setCorrections] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('spots')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

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
      .select('*, profiles(username), spot_images(url)')
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

  const updateSpotStatus = async (id, status, verified = false, reason = '') => {
    await supabase
      .from('spots')
      .update({ status, is_verified: verified, rejection_reason: reason || null })
      .eq('id', id)
    setSpots(s => s.filter(spot => spot.id !== id))
    setRejectModal(null)
    setRejectReason('')
  }

  const updateCorrection = async (correction, status, reason = '') => {
    await supabase
      .from('corrections')
      .update({ status, rejection_reason: reason || null })
      .eq('id', correction.id)

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
    setRejectModal(null)
    setRejectReason('')
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🛡️</div>
        <p className="text-zinc-400">Caricamento...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-black via-zinc-900 to-black border-b border-zinc-800 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-zinc-300 hover:text-cyan-300 transition font-medium text-sm flex items-center gap-2">
            ← Torna alla mappa
          </Link>
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">🛡️ Admin Panel</h1>
          <div className="w-20"></div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setTab('spots')}
            className={'px-6 py-3 rounded-lg font-semibold transition text-sm flex items-center gap-2 ' + (tab === 'spots' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-lg shadow-cyan-500/20' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700')}
          >
            📍 Spot in attesa
            {spots.length > 0 && <span className="bg-black/30 px-2.5 py-0.5 rounded-full text-xs font-bold">{spots.length}</span>}
          </button>
          <button
            onClick={() => setTab('corrections')}
            className={'px-6 py-3 rounded-lg font-semibold transition text-sm flex items-center gap-2 ' + (tab === 'corrections' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-lg shadow-cyan-500/20' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700')}
          >
            ✏️ Correzioni
            {corrections.length > 0 && <span className="bg-black/30 px-2.5 py-0.5 rounded-full text-xs font-bold">{corrections.length}</span>}
          </button>
        </div>

        {/* SPOTS TAB */}
        {tab === 'spots' && (
          spots.length === 0 ? (
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-12 text-center">
              <p className="text-5xl mb-4">✅</p>
              <p className="text-white font-medium text-lg">Nessuno spot in attesa di approvazione</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {spots.map(spot => (
                <div key={spot.id} className="bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-xl hover:border-cyan-500/50 transition p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-white font-black text-lg mb-1 line-clamp-1">{spot.name}</h2>
                      <p className="text-zinc-400 text-sm">
                        da <span className="text-cyan-400 font-semibold">{spot.profiles?.username}</span>
                        {' · '}{new Date(spot.created_at).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs px-3 py-1 rounded-full whitespace-nowrap font-semibold">⏳ In attesa</span>
                  </div>
                  
                  {spot.address && <p className="text-zinc-300 text-sm mb-3">📍 {spot.address}</p>}
                  
                  {spot.spot_images?.length > 0 && (
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {spot.spot_images.slice(0, 4).map((img, i) => (
                        <img key={i} src={img.url} alt="" className="w-20 h-20 rounded-lg object-cover border border-zinc-700" />
                      ))}
                      {spot.spot_images.length > 4 && (
                        <div className="w-20 h-20 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 text-xs font-semibold">
                          +{spot.spot_images.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {spot.description && <p className="text-zinc-300 text-sm mb-4 bg-zinc-900/50 rounded-lg p-3">{spot.description}</p>}
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-cyan-500/20 text-cyan-300 text-xs px-2.5 py-1 rounded-lg border border-cyan-500/30">{spot.category}</span>
                    <span className="bg-blue-500/20 text-blue-300 text-xs px-2.5 py-1 rounded-lg border border-blue-500/30">🚔 {spot.police_level}/10</span>
                    {spot.has_fountain && <span className="bg-teal-500/20 text-teal-300 text-xs px-2.5 py-1 rounded-lg border border-teal-500/30">💧 Fontanella</span>}
                    {spot.space_capacity && (
                      <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-1 rounded-lg border border-indigo-500/30">📐 {spot.space_capacity === 'inf' ? '∞' : spot.space_capacity} posti</span>
                    )}
                    {spot.space_type && (
                      <span className="bg-purple-500/20 text-purple-300 text-xs px-2.5 py-1 rounded-lg border border-purple-500/30">🪑 {spot.space_type}</span>
                    )}
                    {spot.is_lit && <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2.5 py-1 rounded-lg border border-yellow-500/30">💡 Illuminato</span>}
                    {spot.is_covered && <span className="bg-slate-500/20 text-slate-300 text-xs px-2.5 py-1 rounded-lg border border-slate-500/30">🌧️ Coperto</span>}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={() => updateSpotStatus(spot.id, 'approved')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg px-4 py-2 transition text-sm"
                    >
                      ✅ Approva
                    </button>
                    <button
                      onClick={() => updateSpotStatus(spot.id, 'approved', true)}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg px-4 py-2 transition text-sm"
                    >
                      🏅 Approva e Verifica
                    </button>
                    <button
                      onClick={() => setRejectModal({ type: 'spot', data: spot })}
                      className="bg-red-600/30 hover:bg-red-600/50 text-red-300 font-bold rounded-lg px-4 py-2 transition text-sm border border-red-600/40"
                    >
                      ❌ Rifiuta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* CORRECTIONS TAB */}
        {tab === 'corrections' && (
          corrections.length === 0 ? (
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-12 text-center">
              <p className="text-5xl mb-4">✅</p>
              <p className="text-white font-medium text-lg">Nessuna correzione in attesa di approvazione</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {corrections.map(correction => (
                <div key={correction.id} className="bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-xl hover:border-cyan-500/50 transition p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <Link href={'/spot/' + correction.spot_id} className="text-white font-black text-lg hover:text-cyan-400 transition line-clamp-1 block">
                        ✏️ {correction.spots?.name}
                      </Link>
                      <p className="text-zinc-400 text-sm">
                        da <span className="text-cyan-400 font-semibold">{correction.profiles?.username}</span>
                        {' · '}{new Date(correction.created_at).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs px-3 py-1 rounded-full whitespace-nowrap font-semibold">⏳ In attesa</span>
                  </div>
                  
                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 mb-4 text-sm space-y-1">
                    <p className="text-zinc-400">Campo: <span className="text-white font-semibold">{correction.field_name}</span></p>
                    <p className="text-zinc-400">Valore attuale: <span className="text-red-400 line-through">{correction.old_value}</span></p>
                    <p className="text-zinc-400">Nuovo valore: <span className="text-emerald-400 font-semibold">{correction.new_value}</span></p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => updateCorrection(correction, 'approved')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg px-4 py-2 transition text-sm"
                    >
                      ✅ Approva
                    </button>
                    <button
                      onClick={() => setRejectModal({ type: 'correction', data: correction })}
                      className="bg-red-600/30 hover:bg-red-600/50 text-red-300 font-bold rounded-lg px-4 py-2 transition text-sm border border-red-600/40"
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

      {/* Modal rifiuto */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] px-4 py-8">
          <div className="bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-white font-black text-xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">❌ Motivo del rifiuto</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Scrivi un motivo opzionale che verrà mostrato all&apos;utente.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 border border-zinc-700 focus:border-cyan-500 transition resize-none text-sm mb-4"
              placeholder="Es. Spot duplicato, informazioni insufficienti..."
              rows={3}
            />
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (rejectModal.type === 'spot') {
                    updateSpotStatus(rejectModal.data.id, 'rejected', false, rejectReason)
                  } else {
                    updateCorrection(rejectModal.data, 'rejected', rejectReason)
                  }
                }}
                className="bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg px-4 py-2 transition text-sm"
              >
                Conferma
              </button>
              <button
                onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg px-4 py-2 transition text-sm"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}