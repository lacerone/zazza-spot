'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const CAMPI_CORREGGIBILI = [
  { key: 'name', label: 'Nome', type: 'text' },
  { key: 'description', label: 'Descrizione', type: 'textarea' },
  { key: 'address', label: 'Indirizzo', type: 'text' },
  { key: 'category', label: 'Categoria', type: 'select', options: ['Bar', 'Panorama', 'Street', 'Parco', 'Skate', 'Altro'] },
  { key: 'police_level', label: 'Livello presidiato (1-10)', type: 'number' },
  { key: 'has_fountain', label: 'Fontanella', type: 'boolean' },
  { key: 'has_space', label: 'Spazio', type: 'boolean' },
  { key: 'is_lit', label: 'Illuminato', type: 'boolean' },
  { key: 'is_covered', label: 'Coperto', type: 'boolean' },
]

export default function CorrectionForm({ spot, user, onSaved }) {
  const [selectedField, setSelectedField] = useState('')
  const [newValue, setNewValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const fieldConfig = CAMPI_CORREGGIBILI.find(f => f.key === selectedField)

  const handleFieldChange = (key) => {
    setSelectedField(key)
    const config = CAMPI_CORREGGIBILI.find(f => f.key === key)
    if (config?.type === 'boolean') {
      setNewValue(spot[key] ? 'false' : 'true')
    } else {
      setNewValue(String(spot[key] ?? ''))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedField) { setError('Seleziona un campo'); return }
    setLoading(true)
    setError('')

    const { error } = await supabase.from('corrections').insert({
      spot_id: spot.id,
      user_id: user.id,
      field_name: selectedField,
      old_value: String(spot[selectedField] ?? ''),
      new_value: newValue,
      status: 'pending',
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
      if (onSaved) onSaved()
    }
    setLoading(false)
  }

  if (sent) return (
    <div className="bg-zinc-800 rounded-xl p-4 text-sm text-zinc-300">
      ✅ Correzione inviata! L&apos;admin la valuterà a breve.
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="border border-zinc-800 rounded-xl p-4">
      <p className="text-zinc-400 text-sm mb-3">Proponi una correzione a questo spot</p>

      <div className="mb-3">
        <label className="text-zinc-400 text-xs mb-1 block">Campo da correggere</label>
        <select
          value={selectedField}
          onChange={e => handleFieldChange(e.target.value)}
          className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-white/20 text-sm"
        >
          <option value="">Seleziona...</option>
          {CAMPI_CORREGGIBILI.map(f => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>
      </div>

      {selectedField && (
        <div className="mb-3">
          <label className="text-zinc-400 text-xs mb-1 block">
            Valore attuale: <span className="text-white">{String(spot[selectedField] ?? 'non impostato')}</span>
          </label>
          <label className="text-zinc-400 text-xs mb-1 block">Nuovo valore</label>

          {fieldConfig?.type === 'textarea' && (
            <textarea
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-white/20 resize-none text-sm"
              rows={3}
              required
            />
          )}

          {fieldConfig?.type === 'text' && (
            <input
              type="text"
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-white/20 text-sm"
              required
            />
          )}

          {fieldConfig?.type === 'number' && (
            <input
              type="number"
              min={1}
              max={10}
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-white/20 text-sm"
              required
            />
          )}

          {fieldConfig?.type === 'select' && (
            <select
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-white/20 text-sm"
            >
              {fieldConfig.options.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          )}

          {fieldConfig?.type === 'boolean' && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setNewValue('true')}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${newValue === 'true' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'}`}
              >
                Sì
              </button>
              <button
                type="button"
                onClick={() => setNewValue('false')}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${newValue === 'false' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'}`}
              >
                No
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

      <button
        type="submit"
        disabled={loading || !selectedField}
        className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold rounded-lg px-4 py-2 text-sm transition disabled:opacity-50"
      >
        {loading ? 'Invio...' : '✏️ Proponi correzione'}
      </button>
    </form>
  )
}