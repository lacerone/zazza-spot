'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '@/lib/supabase'

const CATEGORIE = ['Bar', 'Panorama', 'Street', 'Parco', 'Skate', 'Altro']

function AddSpotMap({ center, onMove, spots }) {
  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter()
      onMove([c.lat, c.lng])
    }
  })
  return null
}

export default function AddSpotModal({ lat, lng, spots = [], onClose, onSaved }) {
  const [chooseLocation, setChooseLocation] = useState([lat, lng])
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    category: 'Altro',
    police_level: 5,
    has_fountain: false,
    // space: capacity + type
    space_capacity: '',
    space_type: 'seduto',
    is_lit: false,
    is_covered: false,
  })
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const handleImages = (e) => {
    const files = Array.from(e.target.files)
    setImages(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Devi essere loggato per aggiungere uno spot')
      setLoading(false)
      return
    }

    // derive old boolean for backwards compatibility (e.g. mappa badge)
    const spotPayload = {
      name: form.name,
      description: form.description,
      address: form.address,
      category: form.category,
      police_level: form.police_level,
      has_fountain: form.has_fountain,
      is_lit: form.is_lit,
      is_covered: form.is_covered,
      lat: chooseLocation[0],
      lng: chooseLocation[1],
      user_id: user.id,
      status: 'pending',
      space_capacity: form.space_capacity || null,
      space_type: form.space_type,
      has_space: Boolean(form.space_capacity || form.space_type),
    }

    const { data: spot, error: spotError } = await supabase
      .from('spots')
      .insert(spotPayload)
      .select()
      .single()

    if (spotError) {
      setError(spotError.message)
      setLoading(false)
      return
    }

    for (const image of images) {
      const ext = image.name.split('.').pop()
      const path = spot.id + '/' + Date.now() + '.' + ext
      const { error: uploadError } = await supabase.storage
        .from('spot-images')
        .upload(path, image)

      if (!uploadError) {
        const { data } = supabase.storage.from('spot-images').getPublicUrl(path)
        await supabase.from('spot_images').insert({ spot_id: spot.id, url: data.publicUrl })
      }
    }

    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] px-4">
      <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">📍 Nuovo Spot</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="relative rounded-xl overflow-hidden border border-zinc-700 mb-4 h-64">
          <MapContainer center={chooseLocation} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a className="text-cyan-100" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <AddSpotMap center={chooseLocation} onMove={setChooseLocation} spots={spots} />
            {spots.map(s => (
              <Marker key={s.id} position={[s.lat, s.lng]} />
            ))}
          </MapContainer>
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[9999]">
            <span className="text-red-500 font-black text-2xl drop-shadow-lg">×</span>
          </div>
        </div>

        <p className="text-zinc-300 text-xs mb-3">
          Scegli la posizione con la X al centro (coordinate attuali: {chooseLocation[0].toFixed(5)}, {chooseLocation[1].toFixed(5)})
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
            <p>{error}</p>
            {error.includes('loggato') && (
              <p className="mt-2 text-xs text-red-100">
                Per continuare, <Link href="/login" className="underline font-semibold text-white">accedi</Link> o <Link href="/register" className="underline font-semibold text-white">registrati</Link>.
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Nome *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Es. Muretto del Valentino"
              required
            />
          </div>

          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Indirizzo</label>
            <input
              type="text"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Es. Via Roma 1, Torino"
            />
          </div>

          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Descrizione</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-white/20 resize-none"
              placeholder="Descrivi lo spot..."
              rows={3}
            />
          </div>

          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Categoria</label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-white/20"
            >
              {CATEGORIE.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-zinc-400 text-sm mb-1 block">
              🚔 Livello presidiato: <span className="text-white font-bold">{form.police_level}/10</span>
            </label>
            <input
              type="range" min={1} max={10}
              value={form.police_level}
              onChange={e => set('police_level', parseInt(e.target.value))}
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
                onClick={() => set(key, !form[key])}
                className={'rounded-lg px-4 py-3 text-sm font-medium transition ' + (form[key] ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700')}
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
                  value={form.space_capacity && form.space_capacity !== 'inf' ? String(form.space_capacity) : ''}
                  onChange={e => set('space_capacity', e.target.value ? String(e.target.value) : '')}
                  className="bg-zinc-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20 col-span-1"
                  min="1"
                />
                <button
                  type="button"
                  onClick={() => set('space_capacity', 'inf')}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${form.space_capacity === 'inf' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                >
                  ∞
                </button>
              </div>
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1 block">Tipo di spazio</label>
              <select
                value={form.space_type}
                onChange={e => set('space_type', e.target.value)}
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

          {/* Upload foto */}
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">📷 Foto (opzionali)</label>
            <label className="cursor-pointer block w-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 rounded-lg px-4 py-3 text-sm text-center transition">
              {images.length > 0 ? images.length + ' foto selezionate' : 'Clicca per aggiungere foto'}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImages}
                className="hidden"
              />
            </label>
            {previews.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {previews.map((p, i) => (
                  <img key={i} src={p} alt="" className="w-16 h-16 rounded-lg object-cover" />
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-white text-black font-semibold rounded-lg px-4 py-3 hover:bg-zinc-200 transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Invio...' : '📤 Invia per approvazione'}
          </button>
        </form>
      </div>
    </div>
  )
}