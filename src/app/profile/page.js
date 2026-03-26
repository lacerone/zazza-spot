'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [spots, setSpots] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [username, setUsername] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: spotsData } = await supabase
      .from('spots')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setProfile(profileData)
    setUsername(profileData?.username || '')
    if (spotsData) setSpots(spotsData)
    setLoading(false)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    let avatarUrl = profile.avatar_url

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = profile.id + '.' + ext
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true })

      if (!uploadError) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = data.publicUrl
      }
    }

    await supabase
      .from('profiles')
      .update({ username, avatar_url: avatarUrl })
      .eq('id', profile.id)

    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    setSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-400">Caricamento...</p>
    </div>
  )

  const statusColors = {
    approved: 'text-green-400',
    pending: 'text-yellow-400',
    rejected: 'text-red-400',
  }

  const statusLabels = {
    approved: '✅ Approvato',
    pending: '⏳ In attesa',
    rejected: '❌ Rifiutato',
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

        <h1 className="text-white text-2xl font-bold mb-6">👤 Il tuo profilo</h1>

        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-400 rounded-lg px-4 py-3 mb-6 text-sm">
            ✅ Profilo aggiornato!
          </div>
        )}

        <form onSubmit={handleSave} className="bg-zinc-900 rounded-2xl p-6 mb-8">

          {/* Avatar */}
          <div className="flex items-center gap-5 mb-6">
            <div className="relative">
              {avatarPreview || profile?.avatar_url ? (
                <img
                  src={avatarPreview || profile.avatar_url}
                  alt="avatar"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center text-2xl font-bold text-white">
                  {username?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-white font-medium mb-1">{profile?.username}</p>
              <label className="cursor-pointer text-zinc-400 hover:text-white text-sm underline">
                Cambia foto
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Username */}
          <div className="mb-4">
            <label className="text-zinc-400 text-sm mb-1 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-white/20"
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-white text-black font-semibold rounded-lg px-6 py-2 hover:bg-zinc-200 transition disabled:opacity-50 text-sm"
          >
            {saving ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
        </form>

        {/* I tuoi spot */}
        <h2 className="text-white font-bold text-lg mb-4">📍 I tuoi spot</h2>

        {spots.length === 0 ? (
          <div className="bg-zinc-900 rounded-2xl p-6 text-center">
            <p className="text-zinc-400 text-sm">Non hai ancora aggiunto spot.</p>
            <Link href="/" className="text-white underline text-sm mt-2 block">
              Aggiungi il primo spot →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {spots.map(spot => (
              <div key={spot.id} className="bg-zinc-900 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{spot.name}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    {new Date(spot.created_at).toLocaleDateString('it-IT')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={'text-xs font-medium ' + statusColors[spot.status]}>
                    {statusLabels[spot.status]}
                  </span>
                  {spot.status === 'approved' && (
                    <Link href={'/spot/' + spot.id} className="text-zinc-400 hover:text-white text-xs underline">
                      Vedi
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}