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
      <div className="text-center">
        <div className="text-4xl mb-4">🗺️</div>
        <p className="text-zinc-400">Caricamento profilo...</p>
      </div>
    </div>
  )

  const totalSpots = spots.length
  const approvedSpots = spots.filter(s => s.status === 'approved').length
  const pendingSpots = spots.filter(s => s.status === 'pending').length
  const rejectedSpots = spots.filter(s => s.status === 'rejected').length

  const statusColors = {
    approved: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    pending: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
    rejected: 'bg-red-500/20 text-red-300 border border-red-500/30',
  }

  const statusLabels = {
    approved: '✅ Approvato',
    pending: '⏳ In attesa',
    rejected: '❌ Rifiutato',
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-black via-zinc-900 to-black border-b border-zinc-800 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-zinc-300 hover:text-cyan-300 transition font-medium text-sm flex items-center gap-2">
            ← Torna alla mappa
          </Link>
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">👤 Profilo</h1>
          <div className="w-20"></div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg px-4 py-3 font-medium text-sm">
            ✅ Profilo aggiornato con successo!
          </div>
        )}

        {/* Profilo Card */}
        <div className="bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                {avatarPreview || profile?.avatar_url ? (
                  <img
                    src={avatarPreview || profile.avatar_url}
                    alt="avatar"
                    className="w-32 h-32 rounded-full object-cover border-4 border-cyan-500 shadow-lg group-hover:border-blue-500 transition"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-5xl font-bold border-4 border-zinc-700">
                    {username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-cyan-600 hover:bg-cyan-500 p-3 rounded-full cursor-pointer transition shadow-lg">
                  📷
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>
              <p className="text-center font-medium text-zinc-400 text-sm">Click sulla camera per cambiare</p>
            </div>

            {/* Info Section */}
            <div className="flex-1 w-full">
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-zinc-400 text-sm mb-2 block font-medium">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 border border-zinc-700 focus:border-cyan-500 transition"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 w-full md:w-auto"
                >
                  {saving ? '💾 Salvataggio...' : '💾 Salva profilo'}
                </button>
              </form>

              {/* Statistiche */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-zinc-800">
                <div className="text-center">
                  <div className="text-3xl font-black text-cyan-400">{totalSpots}</div>
                  <p className="text-zinc-400 text-xs mt-1">Total Spot</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-emerald-400">{approvedSpots}</div>
                  <p className="text-zinc-400 text-xs mt-1">Approvati</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-yellow-400">{pendingSpots}</div>
                  <p className="text-zinc-400 text-xs mt-1">In attesa</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-red-400">{rejectedSpots}</div>
                  <p className="text-zinc-400 text-xs mt-1">Rifiutati</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* I tuoi spot Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            📍 I tuoi spot
            <span className="text-sm bg-zinc-800 px-3 py-1 rounded-full text-zinc-400">{totalSpots}</span>
          </h2>

          {spots.length === 0 ? (
            <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-12 text-center border border-zinc-800 border-dashed">
              <div className="text-5xl mb-4">🗺️</div>
              <p className="text-zinc-300 font-medium mb-4">Non hai ancora aggiunto spot</p>
              <Link href="/" className="inline-block bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold px-6 py-2 rounded-lg transition">
                Aggiungi il primo →
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {spots.map(spot => (
                <div key={spot.id} className="bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-xl overflow-hidden hover:border-cyan-500/50 transition group">
                  {/* Immagine */}
                  {spot.spot_images && spot.spot_images.length > 0 ? (
                    <img src={spot.spot_images[0].url} alt={spot.name} className="w-full h-40 object-cover group-hover:opacity-80 transition" />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center text-4xl">📍</div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-white text-sm line-clamp-1 flex-1">{spot.name}</h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${statusColors[spot.status]}`}>
                        {statusLabels[spot.status]}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-xs mb-3">{new Date(spot.created_at).toLocaleDateString('it-IT')}</p>

                    <div className="space-y-2">
                      {spot.status === 'approved' && (
                        <Link href={'/spot/' + spot.id} className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-center text-xs transition">
                          Vedi dettagli
                        </Link>
                      )}
                      {spot.status === 'rejected' && (
                        <>
                          {spot.rejection_reason && (
                            <p className="text-red-400 text-xs bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                              {spot.rejection_reason}
                            </p>
                          )}
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
                            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 rounded-lg text-xs transition"
                          >
                            ✏️ Modifica e reinvia
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modal modifica spot rifiutato */}
      {editSpot && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] px-4 py-8 overflow-y-auto">
          <div className="bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
              <h2 className="text-white font-black text-xl bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">✏️ Modifica spot</h2>
              <button onClick={() => setEditSpot(null)} className="text-zinc-400 hover:text-cyan-400 text-2xl transition">✕</button>
            </div>

            <form onSubmit={handleResubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-zinc-400 text-sm mb-2 block font-medium">Nome *</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 border border-zinc-700 focus:border-cyan-500 transition"
                  required
                />
              </div>
              <div>
                <label className="text-zinc-400 text-sm mb-2 block font-medium">Indirizzo</label>
                <input
                  type="text"
                  value={editForm.address || ''}
                  onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 border border-zinc-700 focus:border-cyan-500 transition"
                />
              </div>
              <div>
                <label className="text-zinc-400 text-sm mb-2 block font-medium">Descrizione</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 border border-zinc-700 focus:border-cyan-500 transition resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-zinc-400 text-sm mb-2 block font-medium">Categoria</label>
                <select
                  value={editForm.category || ''}
                  onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 border border-zinc-700 focus:border-cyan-500 transition"
                >
                  <option value="">Seleziona categoria</option>
                  {['Bar', 'Panorama', 'Street', 'Parco', 'Skate', 'Altro'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-zinc-400 text-sm mb-2 block font-medium">
                  🚔 Livello presidiato: <span className="text-cyan-400 font-bold">{editForm.police_level || 5}/10</span>
                </label>
                <input
                  type="range" min={1} max={10}
                  value={editForm.police_level || 5}
                  onChange={e => setEditForm(f => ({ ...f, police_level: parseInt(e.target.value) }))}
                  className="w-full accent-cyan-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'has_fountain', label: '💧' },
                  { key: 'is_lit', label: '💡' },
                  { key: 'is_covered', label: '🌧️' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEditForm(f => ({ ...f, [key]: !f[key] }))}
                    className={`rounded-lg px-4 py-3 text-lg font-medium transition border ${editForm[key] ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-sm mb-2 block font-medium">Capienza max</label>
                  <div className="grid grid-cols-2 gap-1">
                    <input
                      type="number"
                      placeholder="N°"
                      value={editForm.space_capacity && editForm.space_capacity !== 'inf' ? editForm.space_capacity : ''}
                      onChange={e => setEditForm(f => ({ ...f, space_capacity: e.target.value }))}
                      className="bg-zinc-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500 border border-zinc-700 focus:border-cyan-500 transition"
                      min="1"
                    />
                    <button
                      type="button"
                      onClick={() => setEditForm(f => ({ ...f, space_capacity: 'inf' }))}
                      className={`rounded-lg px-3 py-2 text-sm font-bold transition border ${editForm.space_capacity === 'inf' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'}`}
                    >
                      ∞
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-zinc-400 text-sm mb-2 block font-medium">Tipo spazio</label>
                  <select
                    value={editForm.space_type || 'seduto'}
                    onChange={e => setEditForm(f => ({ ...f, space_type: e.target.value }))}
                    className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500 border border-zinc-700 focus:border-cyan-500 transition"
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
                <div className="bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-sm font-medium">
                  ❌ {editError}
                </div>
              )}

              {editExistingImages.length > 0 && (
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <label className="text-zinc-400 text-sm mb-2 block font-medium">📷 Foto caricate</label>
                  <div className="flex gap-2 flex-wrap">
                    {editExistingImages.map((img) => {
                      const isRemoved = editRemovedImageIds.includes(img.id)
                      return (
                        <div key={img.id} className="relative group">
                          <img
                            src={img.url}
                            alt="existing"
                            className={`w-16 h-16 rounded-lg object-cover border border-zinc-700 transition ${isRemoved ? 'opacity-40 grayscale' : 'group-hover:border-cyan-500'}`}
                          />
                          <button
                            type="button"
                            onClick={() => handleToggleExistingImage(img.id)}
                            className="absolute inset-0 bg-black/0 group-hover:bg-black/60 rounded-lg flex items-center justify-center text-xs text-white font-bold opacity-0 group-hover:opacity-100 transition"
                          >
                            {isRemoved ? '↩️' : '🗑️'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="text-zinc-400 text-sm mb-2 block font-medium">📷 Aggiungi foto (opzionali)</label>
                <label className="cursor-pointer block w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg px-4 py-3 text-sm text-center transition border border-dashed border-zinc-700 hover:border-cyan-500">
                  {editImages.length > 0 ? `✅ ${editImages.length} foto` : '+ Aggiungi foto'}
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
                      <img key={i} src={p} alt="preview" className="w-16 h-16 rounded-lg object-cover border border-zinc-700" />
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={editLoading}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 mt-2"
              >
                {editLoading ? '⏳ Invio in corso...' : '📤 Reinvia per approvazione'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}