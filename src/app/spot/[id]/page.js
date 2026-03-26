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
    <div className="min-h-screen bg-black">
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-zinc-400 hover:text-white text-sm">
          ← Torna alla mappa
        </Link>
        <span className="text-zinc-500 text-xs">🗺️ Zazza-Spot</span>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">

        <div className="flex items-center gap-3 mb-2">
        <h1 className="text-white text-3xl font-bold">{spot.name}</h1>
        {spot.is_verified && (
            <span className="bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full font-medium border border-blue-500/30">
            🏅 Verificato
            </span>
        )}
        </div>
        {isAdmin && (
        <button
            onClick={toggleVerified}
            className={'text-xs px-3 py-1 rounded-full font-medium border transition ' + (spot.is_verified
            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/30'
            )}
        >
            {spot.is_verified ? '🏅 Rimuovi verifica' : '🏅 Verifica spot'}
        </button>
        )}

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

          {spot.space_capacity && (
            <span className="bg-zinc-800 text-zinc-200 text-sm px-3 py-1 rounded-full">
              📐 {spot.space_capacity === 'inf' ? '∞' : spot.space_capacity} posti
            </span>
          )}
          {spot.space_type && (
            <span className="bg-zinc-800 text-zinc-200 text-sm px-3 py-1 rounded-full">
              🪑 {spot.space_type}
            </span>
          )}
        </div>
        {spot.spot_images?.length > 0 && (
        <div className="mb-6">
            <div className="flex gap-3 flex-wrap">
            {spot.spot_images.map((img, i) => (
                <img
                key={i}
                src={img.url}
                alt=""
                className="w-full rounded-2xl object-cover max-h-80"
                />
            ))}
            </div>
        </div>
        )}

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


        {user && (
        <div className="mb-6">
            <CorrectionForm spot={spot} user={user} />
        </div>
        )}
        <CommentSection spotId={id} />

      </div>
    </div>
  )
}