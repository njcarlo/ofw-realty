'use client'
import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { createClient } from '@supabase/supabase-js'
import {
  PHILIPPINES_CENTER, PHILIPPINES_BOUNDS,
  DEFAULT_STYLE_URL, HazardLayerType, HAZARD_LAYER_COLORS
} from '@ofw-realty/map'
import { CityTagBar } from './CityTagBar'

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  residential_lot: 'Residential Lot',
  house_and_lot: 'House & Lot',
  condo: 'Condo',
  commercial: 'Commercial',
  farm_lot: 'Farm Lot',
}

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [activeLayers, setActiveLayers] = useState<Set<HazardLayerType>>(new Set())
  const [showLayers, setShowLayers] = useState(false)
  const [pinCount, setPinCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: DEFAULT_STYLE_URL,
      center: PHILIPPINES_CENTER,
      zoom: 6,
      maxBounds: [
        [PHILIPPINES_BOUNDS[0][0] - 2, PHILIPPINES_BOUNDS[0][1] - 2],
        [PHILIPPINES_BOUNDS[1][0] + 2, PHILIPPINES_BOUNDS[1][1] + 2],
      ],
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.current.addControl(
      new maplibregl.GeolocateControl({ trackUserLocation: false }),
      'top-right'
    )

    map.current.on('load', () => {
      map.current!.addSource('listings', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      })

      // Cluster background
      map.current!.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'listings',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#1d4ed8',
          'circle-radius': ['step', ['get', 'point_count'], 22, 10, 32, 50, 42],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
        },
      })

      // Cluster count
      map.current!.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'listings',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 13,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        },
        paint: { 'text-color': '#ffffff' },
      })

      // Individual pins — featured (gold)
      map.current!.addLayer({
        id: 'pins-featured',
        type: 'circle',
        source: 'listings',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'is_featured'], true]],
        paint: {
          'circle-color': '#f59e0b',
          'circle-radius': 11,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
        },
      })

      // Individual pins — standard (blue)
      map.current!.addLayer({
        id: 'pins-standard',
        type: 'circle',
        source: 'listings',
        filter: ['all', ['!', ['has', 'point_count']], ['!=', ['get', 'is_featured'], true]],
        paint: {
          'circle-color': '#2563eb',
          'circle-radius': 9,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })

      // Blockchain verified ring
      map.current!.addLayer({
        id: 'pins-verified-ring',
        type: 'circle',
        source: 'listings',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'blockchain_verified'], true]],
        paint: {
          'circle-color': 'transparent',
          'circle-radius': 14,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#10b981',
          'circle-stroke-opacity': 0.8,
        },
      })

      // Click cluster → zoom in
      map.current!.on('click', 'clusters', (e) => {
        const features = map.current!.queryRenderedFeatures(e.point, { layers: ['clusters'] })
        const clusterId = features[0].properties?.cluster_id
        const source = map.current!.getSource('listings') as maplibregl.GeoJSONSource
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          map.current!.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom,
          })
        }).catch(() => {})
      })

      // Click pin → popup
      const showPopup = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
        if (!e.features?.length) return
        const props = e.features[0].properties!
        const coords = (e.features[0].geometry as any).coordinates.slice()
        const price = Number(props.price_php).toLocaleString('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 })
        const typeLabel = PROPERTY_TYPE_LABELS[props.property_type] ?? props.property_type

        new maplibregl.Popup({ offset: 15, maxWidth: '280px' })
          .setLngLat(coords)
          .setHTML(`
            <div style="font-family:system-ui,sans-serif;padding:4px">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
                <span style="background:#dbeafe;color:#1d4ed8;font-size:11px;padding:2px 8px;border-radius:99px;font-weight:600">${typeLabel}</span>
                ${props.is_featured ? '<span style="background:#fef3c7;color:#d97706;font-size:11px;padding:2px 8px;border-radius:99px;font-weight:600">⭐ Featured</span>' : ''}
                ${props.blockchain_verified ? '<span style="background:#d1fae5;color:#059669;font-size:11px;padding:2px 8px;border-radius:99px">✓ Verified</span>' : ''}
              </div>
              <p style="font-size:18px;font-weight:700;color:#1e40af;margin:0 0 4px">${price}</p>
              <p style="font-size:12px;color:#6b7280;margin:0 0 10px">${props.city ?? ''}, ${props.province ?? ''}</p>
              <a href="/listings/${props.id}" style="display:block;background:#2563eb;color:white;text-align:center;padding:8px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none">
                View Listing →
              </a>
            </div>
          `)
          .addTo(map.current!)
      }

      map.current!.on('click', 'pins-featured', showPopup)
      map.current!.on('click', 'pins-standard', showPopup)

      // Cursor changes
      ;['clusters', 'pins-featured', 'pins-standard'].forEach(layer => {
        map.current!.on('mouseenter', layer, () => { map.current!.getCanvas().style.cursor = 'pointer' })
        map.current!.on('mouseleave', layer, () => { map.current!.getCanvas().style.cursor = '' })
      })

      loadPins()
    })

    map.current.on('moveend', loadPins)

    // Realtime: remove deactivated/sold listings
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const channel = supabase
      .channel('listing-status-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'listings' }, (payload) => {
        const updated = payload.new as any
        if (['deactivated', 'sold'].includes(updated.status)) {
          const source = map.current?.getSource('listings') as maplibregl.GeoJSONSource
          if (!source) return
          const currentData = (source as any)._data as GeoJSON.FeatureCollection
          if (!currentData?.features) return
          source.setData({
            ...currentData,
            features: currentData.features.filter((f: any) => f.properties?.id !== updated.id),
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      map.current?.remove()
      map.current = null
    }
  }, [])

  async function loadPins() {
    if (!map.current) return
    const bounds = map.current.getBounds()
    try {
      const res = await fetch(
        `/api/map/pins?minLat=${bounds.getSouth()}&maxLat=${bounds.getNorth()}&minLng=${bounds.getWest()}&maxLng=${bounds.getEast()}`
      )
      const geojson = await res.json()
      const source = map.current.getSource('listings') as maplibregl.GeoJSONSource
      source?.setData(geojson)
      setPinCount(geojson.features?.length ?? 0)
    } catch (e) {
      console.error('Failed to load pins', e)
    }
  }

  async function toggleHazardLayer(type: HazardLayerType) {
    if (!map.current) return
    const layerId = `hazard-${type}`
    const sourceId = `hazard-source-${type}`

    if (activeLayers.has(type)) {
      if (map.current.getLayer(layerId)) map.current.removeLayer(layerId)
      if (map.current.getSource(sourceId)) map.current.removeSource(sourceId)
      setActiveLayers(prev => { const s = new Set(prev); s.delete(type); return s })
    } else {
      try {
        const res = await fetch(`/api/map/hazard-layers/${type}`)
        if (!res.ok) throw new Error()
        const geojson = await res.json()
        map.current.addSource(sourceId, { type: 'geojson', data: geojson })

        // Fault lines (earthquake) use line layer; others use fill
        if (type === 'earthquake' || type === 'typhoon') {
          map.current.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': HAZARD_LAYER_COLORS[type],
              'line-width': type === 'earthquake' ? 3 : 2,
              'line-opacity': 0.8,
              'line-dasharray': type === 'typhoon' ? [2, 2] : [1],
            },
          }, 'pins-verified-ring')
        } else {
          map.current.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            paint: { 'fill-color': HAZARD_LAYER_COLORS[type], 'fill-opacity': 0.35 },
          }, 'pins-verified-ring')
        }
        setActiveLayers(prev => new Set(prev).add(type))
      } catch {
        alert(`Could not load ${type} hazard layer.`)
      }
    }
  }

  function filterByBoundary(_: string, bounds: [[number, number], [number, number]]) {
    if (!map.current) return
    map.current.fitBounds(bounds, { padding: 40, duration: 800 })
  }

  const HAZARD_LABELS: Record<HazardLayerType, string> = {
    flood: '🌊 Flood',
    earthquake: '🔴 Earthquake',
    landslide: '⛰️ Landslide',
    storm_surge: '🌀 Storm Surge',
    typhoon: '🌪️ Typhoon',
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Map canvas */}
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 12, left: 12, right: 60,
        display: 'flex', gap: 8, alignItems: 'center', zIndex: 10,
      }}>
        {/* Search */}
        <div style={{
          background: 'white', borderRadius: 12, padding: '8px 14px',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)', flex: 1, maxWidth: 360,
        }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search city, province, property type..."
            style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%', background: 'transparent' }}
          />
        </div>

        {/* Pin count badge */}
        {pinCount > 0 && (
          <div style={{
            background: '#1d4ed8', color: 'white', borderRadius: 99,
            padding: '6px 14px', fontSize: 12, fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            {pinCount} listing{pinCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* City tags */}
      <div style={{ position: 'absolute', top: 60, left: 12, zIndex: 10 }}>
        <CityTagBar onSelectCity={filterByBoundary} />
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 32, left: 12, zIndex: 10,
        background: 'white', borderRadius: 14, padding: '12px 14px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)', minWidth: 140,
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Legend</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b', border: '2px solid white', boxShadow: '0 0 0 2px #f59e0b' }} />
            <span style={{ fontSize: 12, color: '#374151' }}>Featured</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#2563eb', border: '2px solid white' }} />
            <span style={{ fontSize: 12, color: '#374151' }}>Standard</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'transparent', border: '2px solid #10b981' }} />
            <span style={{ fontSize: 12, color: '#374151' }}>Blockchain ✓</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 9, fontWeight: 700 }}>3</span>
            </div>
            <span style={{ fontSize: 12, color: '#374151' }}>Cluster</span>
          </div>
        </div>
      </div>

      {/* Hazard layers panel */}
      <div style={{
        position: 'absolute', bottom: 32, right: 12, zIndex: 10,
        background: 'white', borderRadius: 14, padding: '12px 14px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)', minWidth: 160,
      }}>
        <button
          onClick={() => setShowLayers(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, color: '#374151', padding: 0,
          }}
        >
          <span>⚠️ Hazard Layers</span>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>{showLayers ? '▲' : '▼'}</span>
        </button>

        {showLayers && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(Object.keys(HAZARD_LABELS) as HazardLayerType[]).map(type => (
              <button
                key={type}
                onClick={() => toggleHazardLayer(type)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: activeLayers.has(type) ? '#eff6ff' : 'transparent',
                  fontSize: 12, color: activeLayers.has(type) ? '#1d4ed8' : '#6b7280',
                  fontWeight: activeLayers.has(type) ? 600 : 400,
                  textAlign: 'left', width: '100%',
                }}
              >
                <div style={{
                  width: 10, height: 10, borderRadius: 2,
                  background: HAZARD_LAYER_COLORS[type],
                  opacity: activeLayers.has(type) ? 1 : 0.4,
                }} />
                {HAZARD_LABELS[type]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Balikbayan mode button */}
      <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
        <button style={{
          background: '#7c3aed', color: 'white', border: 'none', borderRadius: 99,
          padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(124,58,237,0.4)', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ✈️ Balikbayan Mode
        </button>
      </div>
    </div>
  )
}
