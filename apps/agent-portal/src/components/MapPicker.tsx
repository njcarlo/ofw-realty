'use client'
import { useEffect, useRef, useState } from 'react'

type DrawMode = 'pin' | 'rectangle' | 'polygon'

interface Props {
  lat?: number
  lng?: number
  polygon?: GeoJSON.Polygon | null
  onChange: (lat: number, lng: number, polygon?: GeoJSON.Polygon | null, detectedAddress?: string) => void
}

const PHILIPPINES_CENTER: [number, number] = [122.5, 12.0]

function centroid(coords: [number, number][]): [number, number] {
  const n = coords.length
  const sum = coords.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1]], [0, 0])
  return [sum[0] / n, sum[1] / n]
}

function polygonFromCoords(coords: [number, number][]): GeoJSON.Polygon {
  const closed = [...coords, coords[0]]
  return { type: 'Polygon', coordinates: [closed] }
}

export function MapPicker({ lat, lng, polygon, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [mode, setMode] = useState<DrawMode>('pin')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    lat && lng ? { lat, lng } : null
  )
  const [drawnPolygon, setDrawnPolygon] = useState<GeoJSON.Polygon | null>(polygon ?? null)
  const [polyPoints, setPolyPoints] = useState<[number, number][]>([])
  const [rectStart, setRectStart] = useState<[number, number] | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [hint, setHint] = useState('Click on the map to place a pin')

  // Keep refs for event handlers
  const modeRef = useRef(mode)
  const polyPointsRef = useRef(polyPoints)
  const rectStartRef = useRef(rectStart)
  modeRef.current = mode
  polyPointsRef.current = polyPoints
  rectStartRef.current = rectStart

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import('maplibre-gl').then(({ default: maplibregl }) => {
      const SATELLITE_STYLE = {
        version: 8,
        sources: {
          'esri-satellite': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: '© Esri, Maxar',
            maxzoom: 19,
          },
          'esri-labels': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            maxzoom: 19,
          },
        },
        layers: [
          { id: 'satellite', type: 'raster', source: 'esri-satellite' },
          { id: 'labels', type: 'raster', source: 'esri-labels', paint: { 'raster-opacity': 0.85 } },
        ],
      }

      const map = new maplibregl.Map({
        container: containerRef.current!,
        style: SATELLITE_STYLE as any,
        center: coords ? [coords.lng, coords.lat] : PHILIPPINES_CENTER,
        zoom: coords ? 16 : 6,
      })

      map.addControl(new maplibregl.NavigationControl(), 'top-right')

      map.on('load', () => {
        // Add polygon source + layers
        map.addSource('drawn-polygon', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        })
        map.addLayer({
          id: 'polygon-fill',
          type: 'fill',
          source: 'drawn-polygon',
          paint: { 'fill-color': '#703BF7', 'fill-opacity': 0.2 },
        })
        map.addLayer({
          id: 'polygon-outline',
          type: 'line',
          source: 'drawn-polygon',
          paint: { 'line-color': '#703BF7', 'line-width': 2, 'line-dasharray': [2, 1] },
        })

        // Add vertex dots source
        map.addSource('poly-vertices', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        })
        map.addLayer({
          id: 'poly-vertex-dots',
          type: 'circle',
          source: 'poly-vertices',
          paint: { 'circle-radius': 5, 'circle-color': '#703BF7', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' },
        })

        // Restore existing polygon if any
        if (drawnPolygon) {
          updatePolygonOnMap(map, drawnPolygon)
        }

        // Place initial pin marker
        if (coords) {
          const marker = new maplibregl.Marker({ color: '#703BF7', draggable: true })
            .setLngLat([coords.lng, coords.lat])
            .addTo(map)
          marker.on('dragend', () => {
            const pos = marker.getLngLat()
            const nc = { lat: round(pos.lat), lng: round(pos.lng) }
            setCoords(nc)
            onChange(nc.lat, nc.lng, drawnPolygon)
          })
          markerRef.current = marker
        }
      })

      map.on('click', (e) => {
        const m = modeRef.current
        const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat]

        if (m === 'pin') {
          const nc = { lat: round(e.lngLat.lat), lng: round(e.lngLat.lng) }
          if (markerRef.current) {
            markerRef.current.setLngLat([nc.lng, nc.lat])
          } else {
            const marker = new maplibregl.Marker({ color: '#703BF7', draggable: true })
              .setLngLat([nc.lng, nc.lat])
              .addTo(map)
            marker.on('dragend', () => {
              const pos = marker.getLngLat()
              const updated = { lat: round(pos.lat), lng: round(pos.lng) }
              setCoords(updated)
              onChange(updated.lat, updated.lng, null)
            })
            markerRef.current = marker
          }
          setCoords(nc)
          setDrawnPolygon(null)
          onChange(nc.lat, nc.lng, null)
        }

        if (m === 'rectangle') {
          if (!rectStartRef.current) {
            rectStartRef.current = lngLat
            setRectStart(lngLat)
            setHint('Now click the opposite corner to complete the rectangle')
          } else {
            const start = rectStartRef.current
            const end = lngLat
            const rectCoords: [number, number][] = [
              [start[0], start[1]],
              [end[0], start[1]],
              [end[0], end[1]],
              [start[0], end[1]],
            ]
            const poly = polygonFromCoords(rectCoords)
            const center = centroid(rectCoords)
            const nc = { lat: round(center[1]), lng: round(center[0]) }
            setDrawnPolygon(poly)
            setCoords(nc)
            setRectStart(null)
            rectStartRef.current = null
            updatePolygonOnMap(map, poly)
            updateVerticesOnMap(map, rectCoords)
            placeCentroidMarker(map, maplibregl, nc)
            onChange(nc.lat, nc.lng, poly)
            setHint('Rectangle drawn! Click again to redraw, or switch modes.')
          }
        }

        if (m === 'polygon') {
          const newPoints = [...polyPointsRef.current, lngLat]
          setPolyPoints(newPoints)
          polyPointsRef.current = newPoints
          updateVerticesOnMap(map, newPoints)
          if (newPoints.length >= 3) {
            const poly = polygonFromCoords(newPoints)
            const center = centroid(newPoints)
            const nc = { lat: round(center[1]), lng: round(center[0]) }
            setDrawnPolygon(poly)
            setCoords(nc)
            updatePolygonOnMap(map, poly)
            placeCentroidMarker(map, maplibregl, nc)
            onChange(nc.lat, nc.lng, poly)
            setHint(`${newPoints.length} points. Keep clicking to add more, or switch modes to finish.`)
          } else {
            setHint(`${newPoints.length} point${newPoints.length > 1 ? 's' : ''} placed. Click at least 3 to form a shape.`)
          }
        }
      })

      mapRef.current = map
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  function round(n: number) { return Math.round(n * 1000000) / 1000000 }

  function updatePolygonOnMap(map: any, poly: GeoJSON.Polygon) {
    const src = map.getSource('drawn-polygon')
    if (src) src.setData({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: poly, properties: {} }] })
  }

  function updateVerticesOnMap(map: any, points: [number, number][]) {
    const src = map.getSource('poly-vertices')
    if (src) src.setData({
      type: 'FeatureCollection',
      features: points.map(p => ({ type: 'Feature', geometry: { type: 'Point', coordinates: p }, properties: {} })),
    })
  }

  function placeCentroidMarker(map: any, maplibregl: any, nc: { lat: number; lng: number }) {
    if (markerRef.current) {
      markerRef.current.setLngLat([nc.lng, nc.lat])
    } else {
      const marker = new maplibregl.Marker({ color: '#703BF7' })
        .setLngLat([nc.lng, nc.lat])
        .addTo(map)
      markerRef.current = marker
    }
  }

  function clearDrawing() {
    setDrawnPolygon(null)
    setPolyPoints([])
    setRectStart(null)
    polyPointsRef.current = []
    rectStartRef.current = null
    if (mapRef.current) {
      const src = mapRef.current.getSource('drawn-polygon')
      if (src) src.setData({ type: 'FeatureCollection', features: [] })
      const vSrc = mapRef.current.getSource('poly-vertices')
      if (vSrc) vSrc.setData({ type: 'FeatureCollection', features: [] })
    }
    if (markerRef.current) { markerRef.current.remove(); markerRef.current = null }
    setCoords(null)
    setHint(getHint(mode))
    onChange(0, 0, null)
  }

  function switchMode(m: DrawMode) {
    setMode(m)
    setPolyPoints([])
    setRectStart(null)
    polyPointsRef.current = []
    rectStartRef.current = null
    setHint(getHint(m))
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = m === 'pin' ? '' : 'crosshair'
    }
  }

  function getHint(m: DrawMode) {
    if (m === 'pin') return 'Click on the map to place a pin'
    if (m === 'rectangle') return 'Click the first corner of your property'
    return 'Click to add points. At least 3 points to form a shape.'
  }

  async function searchAddress() {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchError('')
    try {
      const q = encodeURIComponent(`${searchQuery}, Philippines`)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=ph`, {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'LUPAPH/1.0' },
      })
      const data = await res.json()
      if (!data.length) { setSearchError('Location not found. Try a more specific address.'); setSearching(false); return }
      const result = data[0]
      const nc = { lat: round(parseFloat(result.lat)), lng: round(parseFloat(result.lon)) }
      mapRef.current?.flyTo({ center: [nc.lng, nc.lat], zoom: 17, duration: 1000 })
    } catch { setSearchError('Search failed. Please try again.') }
    setSearching(false)
  }

  const areaM2 = drawnPolygon ? estimateArea(drawnPolygon) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Mode selector */}
      <div style={{ display: 'flex', gap: 6 }}>
        {([
          { m: 'pin' as DrawMode, icon: '📍', label: 'Pin' },
          { m: 'rectangle' as DrawMode, icon: '⬜', label: 'Rectangle' },
          { m: 'polygon' as DrawMode, icon: '✏️', label: 'Free-form' },
        ]).map(({ m, icon, label }) => (
          <button key={m} onClick={() => switchMode(m)} style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: `1px solid ${mode === m ? 'rgba(112,59,247,0.5)' : '#262626'}`, background: mode === m ? 'rgba(112,59,247,0.15)' : '#141414', color: mode === m ? '#703BF7' : '#595959', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
            {label}
          </button>
        ))}
        {(drawnPolygon || coords) && (
          <button onClick={clearDrawing} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            🗑️ Clear
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchAddress()}
          placeholder="Search address to navigate map (e.g. Molino Blvd, Bacoor)"
          style={{ flex: 1, background: '#141414', border: '1px solid #262626', borderRadius: 8, padding: '9px 14px', fontSize: 13, color: '#fff', outline: 'none', fontFamily: 'inherit' }}
        />
        <button onClick={searchAddress} disabled={searching} style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: searching ? 'not-allowed' : 'pointer', opacity: searching ? 0.7 : 1 }}>
          {searching ? '...' : '🔍'}
        </button>
      </div>
      {searchError && <div style={{ fontSize: 12, color: '#EF4444' }}>{searchError}</div>}

      {/* Map */}
      <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid #262626' }}>
        <div ref={containerRef} style={{ width: '100%', height: 340 }} />
        <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.8)', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: '#ccc', pointerEvents: 'none', maxWidth: '70%' }}>
          {hint}
        </div>
        {mode === 'polygon' && polyPoints.length > 0 && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(112,59,247,0.9)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#fff', fontWeight: 600 }}>
            {polyPoints.length} pts
          </div>
        )}
      </div>

      {/* Result */}
      {coords ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 140, background: '#141414', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
            <span style={{ color: '#595959' }}>Lat: </span>
            <span style={{ color: '#10B981', fontWeight: 600, fontFamily: 'monospace' }}>{coords.lat}</span>
          </div>
          <div style={{ flex: 1, minWidth: 140, background: '#141414', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
            <span style={{ color: '#595959' }}>Lng: </span>
            <span style={{ color: '#10B981', fontWeight: 600, fontFamily: 'monospace' }}>{coords.lng}</span>
          </div>
          {drawnPolygon && areaM2 !== null && (
            <div style={{ flex: 1, minWidth: 140, background: '#141414', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
              <span style={{ color: '#595959' }}>Est. Area: </span>
              <span style={{ color: '#703BF7', fontWeight: 600 }}>{areaM2 < 10000 ? `${areaM2} m²` : `${(areaM2 / 10000).toFixed(2)} ha`}</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#F59E0B' }}>
          ⚠️ No location set yet. {getHint(mode)}
        </div>
      )}

      {drawnPolygon && (
        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#10B981' }}>
          ✅ Property boundary drawn — {drawnPolygon.coordinates[0].length - 1} vertices. This exact shape will be shown on the map.
        </div>
      )}
    </div>
  )
}

// Shoelace formula for approximate area in m²
function estimateArea(polygon: GeoJSON.Polygon): number {
  const coords = polygon.coordinates[0]
  if (coords.length < 4) return 0
  const R = 6371000
  let area = 0
  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i]
    const [lng2, lat2] = coords[i + 1]
    const x1 = (lng1 * Math.PI / 180) * R * Math.cos(lat1 * Math.PI / 180)
    const y1 = lat1 * Math.PI / 180 * R
    const x2 = (lng2 * Math.PI / 180) * R * Math.cos(lat2 * Math.PI / 180)
    const y2 = lat2 * Math.PI / 180 * R
    area += (x1 * y2 - x2 * y1)
  }
  return Math.round(Math.abs(area / 2))
}
