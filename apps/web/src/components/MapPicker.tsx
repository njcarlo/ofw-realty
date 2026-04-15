'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  lat?: number
  lng?: number
  onChange: (lat: number, lng: number, address?: string) => void
}

const PHILIPPINES_CENTER: [number, number] = [122.5, 12.0]

export function MapPicker({ lat, lng, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    lat && lng ? { lat, lng } : null
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Dynamically import maplibre to avoid SSR issues
    import('maplibre-gl').then(({ default: maplibregl }) => {
      const map = new maplibregl.Map({
        container: containerRef.current!,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: coords ? [coords.lng, coords.lat] : PHILIPPINES_CENTER,
        zoom: coords ? 14 : 6,
      })

      map.addControl(new maplibregl.NavigationControl(), 'top-right')

      // If initial coords, place marker
      if (coords) {
        const marker = new maplibregl.Marker({ color: '#703BF7', draggable: true })
          .setLngLat([coords.lng, coords.lat])
          .addTo(map)

        marker.on('dragend', () => {
          const pos = marker.getLngLat()
          const newCoords = { lat: Math.round(pos.lat * 1000000) / 1000000, lng: Math.round(pos.lng * 1000000) / 1000000 }
          setCoords(newCoords)
          onChange(newCoords.lat, newCoords.lng)
        })

        markerRef.current = marker
      }

      // Click to place/move marker
      map.on('click', (e) => {
        const newCoords = {
          lat: Math.round(e.lngLat.lat * 1000000) / 1000000,
          lng: Math.round(e.lngLat.lng * 1000000) / 1000000,
        }

        if (markerRef.current) {
          markerRef.current.setLngLat([newCoords.lng, newCoords.lat])
        } else {
          const marker = new maplibregl.Marker({ color: '#703BF7', draggable: true })
            .setLngLat([newCoords.lng, newCoords.lat])
            .addTo(map)

          marker.on('dragend', () => {
            const pos = marker.getLngLat()
            const updated = { lat: Math.round(pos.lat * 1000000) / 1000000, lng: Math.round(pos.lng * 1000000) / 1000000 }
            setCoords(updated)
            onChange(updated.lat, updated.lng)
          })

          markerRef.current = marker
        }

        setCoords(newCoords)
        onChange(newCoords.lat, newCoords.lng)
      })

      mapRef.current = map
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  async function searchAddress() {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchError('')
    try {
      // Use Nominatim (OpenStreetMap) geocoder — free, no API key
      const q = encodeURIComponent(`${searchQuery}, Philippines`)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=ph`, {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'LUPAPH/1.0' },
      })
      const data = await res.json()
      if (data.length === 0) {
        setSearchError('Location not found. Try a more specific address.')
        setSearching(false)
        return
      }
      const result = data[0]
      const newCoords = {
        lat: Math.round(parseFloat(result.lat) * 1000000) / 1000000,
        lng: Math.round(parseFloat(result.lon) * 1000000) / 1000000,
      }

      if (mapRef.current) {
        mapRef.current.flyTo({ center: [newCoords.lng, newCoords.lat], zoom: 16, duration: 1000 })
      }

      if (markerRef.current) {
        markerRef.current.setLngLat([newCoords.lng, newCoords.lat])
      } else if (mapRef.current) {
        import('maplibre-gl').then(({ default: maplibregl }) => {
          const marker = new maplibregl.Marker({ color: '#703BF7', draggable: true })
            .setLngLat([newCoords.lng, newCoords.lat])
            .addTo(mapRef.current)

          marker.on('dragend', () => {
            const pos = marker.getLngLat()
            const updated = { lat: Math.round(pos.lat * 1000000) / 1000000, lng: Math.round(pos.lng * 1000000) / 1000000 }
            setCoords(updated)
            onChange(updated.lat, updated.lng)
          })

          markerRef.current = marker
        })
      }

      setCoords(newCoords)
      onChange(newCoords.lat, newCoords.lng, result.display_name)
    } catch {
      setSearchError('Search failed. Please try again.')
    }
    setSearching(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Search bar */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchAddress()}
          placeholder="Search address (e.g. Molino Blvd, Bacoor, Cavite)"
          style={{ flex: 1, background: '#141414', border: '1px solid #262626', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fff', outline: 'none', fontFamily: 'inherit' }}
        />
        <button
          onClick={searchAddress}
          disabled={searching}
          style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: searching ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: searching ? 0.7 : 1 }}
        >
          {searching ? '...' : '🔍 Search'}
        </button>
      </div>

      {searchError && <div style={{ fontSize: 12, color: '#EF4444' }}>{searchError}</div>}

      {/* Map */}
      <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid #262626' }}>
        <div ref={containerRef} style={{ width: '100%', height: 300 }} />
        <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.75)', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: '#999', pointerEvents: 'none' }}>
          Click on the map to pin your property location
        </div>
      </div>

      {/* Coordinates display */}
      {coords ? (
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, background: '#141414', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
            <span style={{ color: '#595959' }}>Latitude: </span>
            <span style={{ color: '#10B981', fontWeight: 600, fontFamily: 'monospace' }}>{coords.lat}</span>
          </div>
          <div style={{ flex: 1, background: '#141414', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
            <span style={{ color: '#595959' }}>Longitude: </span>
            <span style={{ color: '#10B981', fontWeight: 600, fontFamily: 'monospace' }}>{coords.lng}</span>
          </div>
        </div>
      ) : (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#F59E0B' }}>
          ⚠️ No location pinned yet. Search for an address or click on the map.
        </div>
      )}
    </div>
  )
}
