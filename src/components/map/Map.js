'use client'

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useState, useEffect } from 'react'
import AddSpotModal from '@/components/spot/AddSpotModal'
import { supabase } from '@/lib/supabase'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}

export default function Map({ user }) {
  const [modal, setModal] = useState(null)
  const [saved, setSaved] = useState(false)
  const [spots, setSpots] = useState([])

  useEffect(() => {
    loadSpots()
  }, [])

  const loadSpots = async () => {
    const { data, error } = await supabase
      .from('spots')
      .select('*')
      .eq('status', 'approved')

    if (!error) setSpots(data)
  }

  const handleMapClick = (lat, lng) => {
    if (!user) {
      alert('Devi essere loggato per aggiungere uno spot!')
      return
    }
    setModal({ lat, lng })
  }

  const handleSaved = () => {
    setModal(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 4000)
  }

  return (
    <>
      {saved && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[9999] bg-green-500 text-white px-6 py-3 rounded-full font-medium shadow-lg">
          ✅ Spot inviato! Aspetta l'approvazione dell'admin.
        </div>
      )}

      <MapContainer
        center={[45.0703, 7.6869]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onMapClick={handleMapClick} />

        {spots.map(spot => (
          <Marker key={spot.id} position={[spot.lat, spot.lng]}>
            <Popup>
              <div className="text-sm">
                <p className="font-bold text-base">{spot.name}</p>
                {spot.address && <p className="text-gray-500">{spot.address}</p>}
                {spot.description && <p className="mt-1">{spot.description}</p>}
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{spot.category}</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">🚔 {spot.police_level}/10</span>
                  {spot.has_fountain && <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">💧</span>}
                  {spot.has_space && <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">📐</span>}
                  {spot.is_lit && <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">💡</span>}
                  {spot.is_covered && <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">🌧️</span>}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {modal && (
        <AddSpotModal
          lat={modal.lat}
          lng={modal.lng}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}