'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const CATEGORIE = ['Bar', 'Panorama', 'Street', 'Parco', 'Skate', 'Altro']

export default function AddSpotModal({ lat, lng, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    category: 'Altro',
    police_level: 5,
    has_fountain: false,
    has_space: false,
    is_lit: false,
    is_covered: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

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

    const { error } = await supabase.from('spots').insert({
      ...form,
      lat,
      lng,
      user_id: user.id,
      status: 'pending',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      onSaved()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] px-4">
      <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">📍 Nuovo Spot</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl">✕</button>
        </div>

        <p className="text-zinc-500 text-sm mb-4">
          Coordinate: {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
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
              { key: 'has_space', label: '📐 Spazio' },
              { key: 'is_lit', label: '💡 Illuminato' },
              { key: 'is_covered', label: '🌧️ Coperto' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => set(key, !form[key])}
                className={`rounded-lg px-4 py-3 text-sm font-medium transition ${
                  form[key]
                    ? 'bg-white text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {label}
              </button>
            ))}
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