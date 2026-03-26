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
  const [editSpot, setEditSpot] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editImages, setEditImages] = useState([])
  const [editPreviews, setEditPreviews] = useState([])
  const [editExistingImages, setEditExistingImages] = useState([])
  const [editRemovedImageIds, setEditRemovedImageIds] = useState([])
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)

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
      .select('*, spot_images(id, url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setProfile(profileData)
    setUsername(profileData?.username || '')
    if (spotsData) setSpots(spotsData)
    setLoading(false)
  }

  const handleResubmit = async (e) => {
    e.preventDefault()
    setEditLoading(true)
    setEditError('')

    const updatePayload = {
      ...editForm,
      status: 'pending',
      rejection_reason: null,
      space_capacity: editForm.space_capacity || null,
    }

    const { error: spotError } = await supabase
      .from('spots')
      .update(updatePayload)
      .eq('id', editSpot.id)

    if (spotError) {
      setEditError(spotError.message)
      setEditLoading(false)
      return
    }

    if (editRemovedImageIds.length > 0) {
      await supabase
        .from('spot_images')
        .delete()
        .in('id', editRemovedImageIds)
    }

    if (editImages.length > 0) {
      for (const image of editImages) {
        const ext = image.name.split('.').pop()
        const path = editSpot.id + '/' + Date.now() + '.' + ext
        const { error: uploadError } = await supabase.storage
          .from('spot-images')
          .upload(path, image)

        if (!uploadError) {
          const { data } = supabase.storage.from('spot-images').getPublicUrl(path)
          await supabase.from('spot_images').insert({ spot_id: editSpot.id, url: data.publicUrl })
        }
      }
    }

    setEditSpot(null)
    setEditImages([])
    setEditPreviews([])
    setEditExistingImages([])
    setEditRemovedImageIds([])
    setEditLoading(false)
    loadProfile()
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleEditImages = (e) => {
    const files = Array.from(e.target.files)
    setEditImages(files)
    setEditPreviews(files.map(f => URL.createObjectURL(f)))
  }

  const handleToggleExistingImage = (id) => {
    setEditRemovedImageIds(ids =>
      ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id]
    )
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#131920_0%,#070b10_40%,#020406_100%)] text-zinc-100">
      <header className="bg-zinc-900/95 border-b border-zinc-800 px-6 py-4 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="text-cyan-300 hover:text-white text-sm font-medium">
          ← Torna alla mappa
        </Link>
        <span className="text-zinc-500 text-xs">🗺️ Zazza-Spot</span>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">

        <div className="glass-card p-6">
          <h1 className="text-white text-2xl font-bold mb-4">👤 Il tuo profilo</h1>

          {success && (
            <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 rounded-lg px-4 py-3 mb-6 text-sm">
              ✅ Profilo aggiornato!
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">          <div className="flex items-center gap-5 mb-6">
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
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
          </div>

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
            className="btn-primary w-full"
          >
            {saving ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
        </form>
      </div>

      <section className="glass-card p-6">
        <h2 className="text-white font-bold text-lg mb-4">📍 I tuoi spot</h2>

        {spots.length === 0 ? (
          <div className="bg-zinc-800/80 rounded-2xl p-6 text-center border border-zinc-700">
            <p className="text-zinc-300 text-sm">Non hai ancora aggiunto spot.</p>
            <Link href="/" className="text-cyan-300 underline text-sm mt-2 block">
              Aggiungi il primo spot →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {spots.map(spot => (
              <div key={spot.id} className="glass-card p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-white font-bold text-sm truncate">{spot.name}</p>
                    <p className="text-zinc-400 text-xs mt-0.5">{new Date(spot.created_at).toLocaleDateString('it-IT')}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={'text-xs font-semibold px-2 py-1 rounded-full ' + statusColors[spot.status]}>
                      {statusLabels[spot.status]}
                    </span>
                    {spot.status === 'approved' && (
                      <Link href={'/spot/' + spot.id} className="text-cyan-300 hover:text-white text-xs underline">
                        Vedi
                      </Link>
                    )}
                  </div>
                </div>
                {spot.status === 'rejected' && spot.rejection_reason && (
                  <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <p className="text-red-400 text-xs">Motivo: {spot.rejection_reason}</p>
                  </div>
                )}
                {spot.status === 'rejected' && (
                  <button
                    onClick={() => {
                      setEditSpot(spot)
                      setEditForm({
                        name: spot.name,
                        description: spot.description,
                        address: spot.address,
                        category: spot.category,
                        police_level: spot.police_level,
                        has_fountain: spot.has_fountain,
                        // derived - assicurati che space_capacity sia sempre una stringa
                        space_capacity: spot.space_capacity ? String(spot.space_capacity) : '',
                        space_type: spot.space_type ?? 'seduto',
                        is_lit: spot.is_lit,
                        is_covered: spot.is_covered,
                      })
                      setEditImages([])
                      setEditPreviews([])
                      setEditExistingImages(spot.spot_images || [])
                      setEditRemovedImageIds([])
                      setEditError('')
                    }}
                    className="mt-3 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition"
                  >
                    ✏️ Modifica e reinvia
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  </div>

      {/* Modal modifica spot rifiutato */}
      {editSpot && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] px-4">
          <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">✏️ Modifica spot</h2>
              <button onClick={() => setEditSpot(null)} className="text-zinc-400 hover:text-white text-xl">✕</button>
            </div>

            <form onSubmit={handleResubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-zinc-400 text-sm mb-1 block">Nome *</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-white/20"
                  required
                />
              </div>
              <div>
                <label className="text-zinc-400 text-sm mb-1 block">Indirizzo</label>
                <input
                  type="text"
                  value={editForm.address || ''}
                  onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
              <div>
                <label className="text-zinc-400 text-sm mb-1 block">Descrizione</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-white/20 resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-zinc-400 text-sm mb-1 block">Categoria</label>
                <select
                  value={editForm.category || ''}
                  onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-white/20"
                >
                  {['Bar', 'Panorama', 'Street', 'Parco', 'Skate', 'Altro'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-zinc-400 text-sm mb-1 block">
                  🚔 Livello presidiato: <span className="text-white font-bold">{editForm.police_level}/10</span>
                </label>
                <input
                  type="range" min={1} max={10}
                  value={editForm.police_level || 5}
                  onChange={e => setEditForm(f => ({ ...f, police_level: parseInt(e.target.value) }))}
                  className="w-full accent-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'has_fountain', label: '💧 Fontanella' },
                  { key: 'is_lit', label: '💡 Illuminato' },
                  { key: 'is_covered', label: '🌧️ Coperto' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEditForm(f => ({ ...f, [key]: !f[key] }))}
                    className={'rounded-lg px-4 py-3 text-sm font-medium transition ' + (editForm[key] ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700')}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-sm mb-1 block">Capienza max</label>
                  <div className="grid grid-cols-2 gap-1">
                    <input
                      type="number"
                      placeholder="Numero"
                      value={editForm.space_capacity && editForm.space_capacity !== 'inf' ? editForm.space_capacity : ''}
                      onChange={e => setEditForm(f => ({ ...f, space_capacity: e.target.value }))}
                      className="bg-zinc-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20 col-span-1"
                      min="1"
                    />
                    <button
                      type="button"
                      onClick={() => setEditForm(f => ({ ...f, space_capacity: 'inf' }))}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${editForm.space_capacity === 'inf' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                    >
                      ∞
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-zinc-400 text-sm mb-1 block">Tipo di spazio</label>
                  <select
                    value={editForm.space_type || 'seduto'}
                    onChange={e => setEditForm(f => ({ ...f, space_type: e.target.value }))}
                    className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                  >
                    <option value="seduto">Seduto</option>
                    <option value="prato">Prato</option>
                    <option value="muretto">Muretto</option>
                    <option value="panchina">Panchina</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>
              </div>

              {editError && (
                <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg px-4 py-3 text-sm">
                  {editError}
                </div>
              )}

              {editExistingImages.length > 0 && (
                <div>
                  <label className="text-zinc-400 text-sm mb-1 block">📷 Foto già caricate</label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {editExistingImages.map((img) => {
                      const isRemoved = editRemovedImageIds.includes(img.id)
                      return (
                        <div key={img.id} className="relative">
                          <img
                            src={img.url}
                            alt="existing"
                            className={`w-16 h-16 rounded-lg object-cover transition ${isRemoved ? 'opacity-40 grayscale' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => handleToggleExistingImage(img.id)}
                            className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-0.5 rounded-b-lg"
                          >
                            {isRemoved ? 'Annulla' : 'Rimuovi'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="text-zinc-400 text-sm mb-1 block">📷 Aggiungi nuove foto (opzionali)</label>
                <label className="cursor-pointer block w-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 rounded-lg px-4 py-3 text-sm text-center transition">
                  {editImages.length > 0 ? editImages.length + ' foto selezionate' : 'Clicca per aggiungere foto'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleEditImages}
                    className="hidden"
                  />
                </label>
                {editPreviews.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {editPreviews.map((p, i) => (
                      <img key={i} src={p} alt="preview" className="w-16 h-16 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={editLoading}
                className="bg-white text-black font-semibold rounded-lg px-4 py-3 hover:bg-zinc-200 transition disabled:opacity-50"
              >
                {editLoading ? 'Invio...' : '📤 Reinvia per approvazione'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}