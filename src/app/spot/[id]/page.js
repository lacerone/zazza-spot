'use client'

import CommentSection from '@/components/comment/CommentSection'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const BADGES = [
  { key: 'has_fountain', label: '💧 Fontanella' },
  { key: 'has_space', label: '📐 Spazio' },
  { key: 'is_lit', label: '💡 Illuminato' },
  { key: 'is_covered', label: '🌧️ Coperto' },
]

export default function SpotPage() {
  const { id } = useParams()
  const [spot, setSpot] = useState(null)
  const [avgRating, setAvgRating] = useState(null)
  const [totalVotes, setTotalVotes] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSpot()
  }, [id])

  const loadSpot = async () => {
    const { data: spotData } = await supabase
      .from('spots')
      .select('*, profiles(username)')
      .eq('id', id)
      .single()

    const { data: popularity } = await supabase
      .from('spot_popularity')
      .select('*')
      .eq('spot_id', id)
      .single()

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

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-zinc-400 hover:text-white text-sm">
          ← Torna alla mappa
        </Link>
        <span className="text-zinc-500 text-xs">🗺️ Zazza-Spot</span>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">

        <div className="flex items-start justify-between mb-2">
          <h1 className="text-white text-3xl font-bold">{spot.name}</h1>
          {avgRating && (
            <div className="text-right">
              <div className="text-yellow-400 text-2xl font-bold">{avgRating}/10</div>
              <div className="text-zinc-500 text-xs">{totalVotes} vot{totalVotes === 1 ? 'o' : 'i'}</div>
            </div>
          )}
        </div>

        <p className="text-zinc-500 text-sm mb-1">
          Aggiunto da <span className="text-zinc-300">{spot.profiles?.username}</span>
          {' · '}{new Date(spot.created_at).toLocaleDateString('it-IT')}
        </p>
        {spot.address && (
          <p className="text-zinc-400 text-sm mb-4">📍 {spot.address}</p>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="bg-zinc-800 text-zinc-200 text-sm px-3 py-1 rounded-full">
            {spot.category}
          </span>
          <span className="bg-zinc-800 text-zinc-200 text-sm px-3 py-1 rounded-full">
            🚔 Presidiato {spot.police_level}/10
          </span>
          {BADGES.filter(b => spot[b.key]).map(b => (
            <span key={b.key} className="bg-zinc-800 text-zinc-200 text-sm px-3 py-1 rounded-full">
              {b.label}
            </span>
          ))}
        </div>

        {spot.description && (
          <div className="bg-zinc-900 rounded-2xl p-5 mb-6">
            <p className="text-zinc-300 leading-relaxed">{spot.description}</p>
          </div>
        )}

        <div className="bg-zinc-900 rounded-2xl p-5 mb-8">
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Coordinate</p>
            <p className="text-zinc-300 text-sm font-mono">{spot.lat.toFixed(6)}, {spot.lng.toFixed(6)}</p>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm mt-2 block">
                Apri su Google Maps
            </a>
        </div>

        <CommentSection spotId={id} />

      </div>
    </div>
  )
}