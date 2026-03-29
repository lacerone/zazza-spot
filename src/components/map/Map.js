'use client'

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useState, useEffect } from 'react'
import AddSpotModal from '@/components/spot/AddSpotModal'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function ClickHandler() {
  // niente; il click sulla mappa non crea spot direttamente
  useMapEvents({})
  return null
}

function MapTracker({ onMove }) {
  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter()
      onMove([c.lat, c.lng])
    }
  })
  return null
}

export default function Map({ user }) {
  const [modal, setModal] = useState(null)
  const [saved, setSaved] = useState(false)
  const [authNotice, setAuthNotice] = useState('')
  const [allSpots, setAllSpots] = useState([])
  const [spots, setSpots] = useState([])
  const [mapCenter, setMapCenter] = useState([45.0703, 7.6869])
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    category: 'All',
    has_fountain: false,
    is_lit: false,
    is_covered: false,
    space_capacity: '',
    space_type: [],
    is_verified: false,
  })

  useEffect(() => {
    loadSpots()
  }, [])

  useEffect(() => {
    const filtered = allSpots.filter((spot) => {
      if (filters.category !== 'All' && spot.category !== filters.category) return false
      if (filters.has_fountain && !spot.has_fountain) return false
      if (filters.is_lit && !spot.is_lit) return false
      if (filters.is_covered && !spot.is_covered) return false

      if (filters.space_capacity) {
        if (!spot.space_capacity) return false
        if (spot.space_capacity !== 'inf' && Number(spot.space_capacity) < Number(filters.space_capacity)) return false
      }

      if (filters.space_type.length > 0) {
        if (!spot.space_type || !filters.space_type.includes(spot.space_type)) return false
      }

      if (filters.is_verified && !spot.is_verified) return false

      return true
    })
    setSpots(filtered)
  }, [allSpots, filters])

  const loadSpots = async () => {
    const { data, error } = await supabase
      .from('spots')
      .select('*, spot_images(id, url)')
      .eq('status', 'approved')

    if (!error) {
      console.log('Spot caricati:', data)
      setAllSpots(data)
      setSpots(data)
    } else {
      console.error('Errore caricamento spot:', error)
    }
  }

  const handleMapClick = (lat, lng) => {
    if (!user) {
      setAuthNotice('Per aggiungere uno spot devi essere loggato. Vai su Accedi o Registrati per contribuire alla comunità.')
      return
    }
    setAuthNotice('')
    setModal({ lat, lng })
  }

  const handleAddSpot = () => {
    if (!user) {
      setAuthNotice('Per aggiungere uno spot devi essere loggato. Vai su Accedi o Registrati per contribuire alla comunità.')
      return
    }
    setAuthNotice('')
    setModal({ lat: mapCenter[0], lng: mapCenter[1] })
  }

  const handleSaved = () => {
    setModal(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 4000)
  }

  return (
    <>
      {saved && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[9999] bg-emerald-500/95 text-black px-6 py-3 rounded-full font-semibold shadow-2xl border border-emerald-300/40">
          ✅ Spot inviato! Aspetta l'approvazione dell'admin.
        </div>
      )}

      {authNotice && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[9999] bg-yellow-500/95 text-black px-6 py-3 rounded-full font-semibold shadow-2xl border border-yellow-300/40">
          {authNotice} {' '}
          <a href="/login" className="underline font-black">Accedi</a> / <a href="/register" className="underline font-black">Registrati</a>
        </div>
      )}

      <div className="absolute top-4 left-4 z-[2000]">
        <button
          onClick={() => setFilterOpen(open => !open)}
          className="glass-card px-3 py-2 text-xs font-semibold rounded-xl border border-zinc-700 flex items-center gap-2"
        >
          {filterOpen ? 'Chiudi filtri' : 'Apri filtri'}
          <span className="text-cyan-300">⚙️</span>
        </button>

        <div className={`${filterOpen ? 'block' : 'hidden'} mt-2 glass-card p-4 text-xs text-white w-[90vw] max-w-[340px] lg:w-64 lg:max-w-none lg:shadow-xl`}>
          <h3 className="font-bold text-sm mb-3 tracking-wide text-cyan-200">🔍 Filtri</h3>

          <label className="block mb-3">
            <span className="text-zinc-300 text-[10px] block mb-1">Categoria</span>
            <select
              value={filters.category}
              onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
              className="w-full bg-zinc-900 text-white rounded-lg px-2 py-1 text-xs border border-zinc-700"
            >
              <option value="All">Tutte</option>
              <option>Bar</option>
              <option>Panorama</option>
              <option>Street</option>
              <option>Parco</option>
              <option>Skate</option>
              <option>Altro</option>
            </select>
          </label>

        {[
          { key: 'has_fountain', label: '💧 Fontanella' },
          { key: 'is_lit', label: '💡 Illuminato' },
          { key: 'is_covered', label: '🌧️ Coperto' },
          { key: 'is_verified', label: '✅ Verificati' },
        ].map(item => (
          <label key={item.key} className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={filters[item.key]}
              onChange={(e) => setFilters(f => ({ ...f, [item.key]: e.target.checked }))}
              className="accent-cyan-400"
            />
            <span>{item.label}</span>
          </label>
        ))}

        <label className="block mb-3">
          <span className="text-zinc-300 text-[10px] block mb-1">Capienza minima (posti)</span>
          <input
            type="number"
            placeholder="Es. 20"
            value={filters.space_capacity}
            onChange={e => setFilters(f => ({ ...f, space_capacity: e.target.value }))}
            className="w-full bg-zinc-900 text-white rounded-lg px-2 py-1 text-xs border border-zinc-700"
            min="1"
          />
        </label>

        <div className="mb-3">
          <span className="text-zinc-300 text-[10px] block mb-1">Tipo di seduta</span>
          <div className="grid grid-cols-2 gap-1">
            {['seduto','prato','muretto','panchina','altro'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setFilters(f => {
                  const exists = f.space_type.includes(type)
                  return { ...f, space_type: exists ? f.space_type.filter(v => v !== type) : [...f.space_type, type] }
                })}
                className={`px-2 py-1 text-[10px] rounded-md border transition ${filters.space_type.includes(type) ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-600'}`}>
                {type}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setFilters({ category: 'All', has_fountain: false, is_lit: false, is_covered: false, space_capacity: '', space_type: [], is_verified: false })}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg px-2 py-1 text-xs border border-zinc-700 transition"
        >Reset</button>
      </div>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a className="text-cyan-100" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapTracker onMove={setMapCenter} />

        {spots.map(spot => (
          <Marker key={spot.id} position={[spot.lat, spot.lng]}>
            <Popup className="leaflet-popup-custom">
              <div className="bg-zinc-900/95 backdrop-blur rounded-lg overflow-hidden border border-zinc-700 shadow-lg" style={{ width: '300px' }}>
                {/* Immagine grande */}
                {spot.spot_images && spot.spot_images.length > 0 ? (
                  <img src={spot.spot_images[0].url} alt={spot.name} className="w-full h-56 object-cover" />
                ) : (
                  <div className="w-full h-56 bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center">
                    <span className="text-6xl opacity-30">📍</span>
                  </div>
                )}

                {/* Info compatta */}
                <div className="p-3 space-y-2">
                  <h3 className="text-sm font-bold text-cyan-300">{spot.name || 'Spot'}</h3>

                  {/* Tag */}
                  <div className="flex flex-wrap gap-1">
                    <span className="inline-block bg-zinc-800 text-zinc-300 text-[10px] px-2 py-1 rounded">{spot.category}</span>
                    <span className="inline-block bg-zinc-800 text-orange-300 text-[10px] px-2 py-1 rounded">🚔 {spot.police_level}</span>
                    {spot.has_fountain && <span className="inline-block bg-zinc-800 text-blue-300 text-[10px] px-2 py-1 rounded">💧</span>}
                    {spot.is_lit && <span className="inline-block bg-zinc-800 text-yellow-300 text-[10px] px-2 py-1 rounded">💡</span>}
                    {spot.is_covered && <span className="inline-block bg-zinc-800 text-purple-300 text-[10px] px-2 py-1 rounded">🌧️</span>}
                  </div>

                  {(spot.space_capacity || spot.space_type) && (
                    <p className="text-xs text-green-300 bg-zinc-800/50 px-2 py-1 rounded">
                      📐 {spot.space_capacity ? (spot.space_capacity === 'inf' ? '∞' : spot.space_capacity) : '?'} posti {spot.space_type && `· ${spot.space_type}`}
                    </p>
                  )}

                  <Link href={'/spot/' + spot.id} className="block w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold py-2 rounded text-center transition mt-2 text-sm">
                    Dettagli
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <button
        onClick={handleAddSpot}
        className="fixed right-4 bottom-4 z-[2000] h-14 w-14 rounded-full bg-cyan-400 text-black text-2xl font-bold shadow-2xl border-4 border-white/20 hover:bg-cyan-300 transition"
        aria-label="Aggiungi nuovo spot"
      >
        +
      </button>

      {modal && (
        <AddSpotModal
          lat={modal.lat}
          lng={modal.lng}
          spots={spots}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}