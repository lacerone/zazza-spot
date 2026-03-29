'use client'

import CommentSection from '@/components/comment/CommentSection'
import CorrectionForm from '@/components/comment/CorrectionForm'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'




const BADGES = [
  { key: 'has_fountain', label: '💧 Fontanella' },
  { key: 'is_lit', label: '💡 Illuminato' },
  { key: 'is_covered', label: '🌧️ Coperto' },
]

export default function SpotPage() {
  const { id } = useParams()
  const [spot, setSpot] = useState(null)
  const [avgRating, setAvgRating] = useState(null)
  const [totalVotes, setTotalVotes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    loadSpot()
  }, [id])

  const loadSpot = async () => {
    const { data: spotData } = await supabase
        .from('spots')
        .select('*, profiles(username), spot_images(url)')
        .eq('id', id)
        .single()

    const { data: popularity, error: popularityError } = await supabase
        .from('spot_popularity')
        .select('*')
        .eq('spot_id', id)
        .maybeSingle()

    if (popularityError) {
      console.warn('spot_popularity fetch warning:', popularityError)
    }

    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()
        setIsAdmin(profile?.is_admin || false)
        }
    setSpot(spotData)
    if (popularity) {
        setAvgRating(popularity.avg_rating)
        setTotalVotes(popularity.total_votes)
    }
    setLoading(false)
    }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-400">Caricamento...</p>
    </div>
  )

  if (!spot) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-400">Spot non trovato.</p>
    </div>
  )

  const mapsUrl = 'https://www.google.com/maps?q=' + spot.lat + ',' + spot.lng

  const toggleVerified = async () => {
    const { error } = await supabase
        .from('spots')
        .update({ is_verified: !spot.is_verified })
        .eq('id', spot.id)
    if (!error) setSpot(s => ({ ...s, is_verified: !s.is_verified }))
    }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-black via-zinc-900 to-black border-b border-zinc-800 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-zinc-300 hover:text-cyan-300 transition font-medium text-sm flex items-center gap-2">
            ← Torna alla mappa
          </Link>
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">📍 Dettagli Spot</h1>
          <div className="w-20"></div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Titolo e Badge */}
        <div className="mb-6">
          <div className="flex items-end gap-3 mb-2 flex-wrap">
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">{spot.name}</h1>
            {spot.is_verified && (
              <span className="bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full font-bold border border-blue-500/30 mb-1">
                🏅 Verificato
              </span>
            )}
          </div>
          <p className="text-zinc-400 text-sm">
            Aggiunto da <span className="text-cyan-400 font-semibold">{spot.profiles?.username}</span>
            {' · '}{new Date(spot.created_at).toLocaleDateString('it-IT')}
          </p>
          {spot.address && (
            <p className="text-zinc-300 text-sm mt-2">📍 {spot.address}</p>
          )}
        </div>

        {/* Admin verify button */}
        {isAdmin && (
          <div className="mb-6">
            <button
              onClick={toggleVerified}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition border ${spot.is_verified
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
                : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/30'
              }`}
            >
              {spot.is_verified ? '🏅 Rimuovi verifica' : '🏅 Verifica spot'}
            </button>
          </div>
        )}

        {/* Immagini */}
        {spot.spot_images?.length > 0 && (
          <div className="mb-8">
            <div className="grid gap-4">
              {spot.spot_images.map((img, i) => (
                <img
                  key={i}
                  src={img.url}
                  alt={`${spot.name} foto ${i + 1}`}
                  className="w-full rounded-2xl object-cover max-h-96 border border-zinc-800 hover:border-cyan-500/50 transition"
                />
              ))}
            </div>
          </div>
        )}

        {/* Info card principale */}
        <div className="bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 mb-8">
          {/* Badge info */}
          <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-zinc-800">
            <span className="bg-cyan-500/20 text-cyan-300 text-xs px-3 py-1.5 rounded-lg border border-cyan-500/30 font-semibold">{spot.category}</span>
            <span className="bg-blue-500/20 text-blue-300 text-xs px-3 py-1.5 rounded-lg border border-blue-500/30 font-semibold">🚔 {spot.police_level}/10</span>
            {BADGES.filter(b => spot[b.key]).map(b => (
              <span key={b.key} className="bg-teal-500/20 text-teal-300 text-xs px-3 py-1.5 rounded-lg border border-teal-500/30 font-semibold">
                {b.label}
              </span>
            ))}
            {spot.space_capacity && (
              <span className="bg-indigo-500/20 text-indigo-300 text-xs px-3 py-1.5 rounded-lg border border-indigo-500/30 font-semibold">
                📐 {spot.space_capacity === 'inf' ? '∞' : spot.space_capacity} posti
              </span>
            )}
            {spot.space_type && (
              <span className="bg-purple-500/20 text-purple-300 text-xs px-3 py-1.5 rounded-lg border border-purple-500/30 font-semibold">
                🪑 {spot.space_type}
              </span>
            )}
          </div>

          {/* Descrizione */}
          {spot.description && (
            <>
              <h2 className="text-white font-bold text-lg mb-3">📝 Descrizione</h2>
              <p className="text-zinc-300 leading-relaxed">{spot.description}</p>
            </>
          )}
        </div>

        {/* Coordinate e maps */}
        <div className="bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-zinc-400 text-xs uppercase tracking-widest font-bold mb-3">📍 Coordinate</h2>
          <p className="text-white font-mono text-sm bg-zinc-800/50 rounded-lg px-3 py-2 mb-3">{spot.lat.toFixed(6)}, {spot.lng.toFixed(6)}</p>
          <a 
            href={mapsUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-block bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold px-6 py-2 rounded-lg transition text-sm"
          >
            🗺️ Apri su Google Maps
          </a>
        </div>

        {/* Correzioni e Commenti */}
        {user && (
          <div className="mb-8">
            <CorrectionForm spot={spot} user={user} />
          </div>
        )}
        <CommentSection spotId={id} />
      </div>
    </div>
  )
}