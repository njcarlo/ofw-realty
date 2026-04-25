'use client'
import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
// maplibre-gl CSS is loaded via <link> in layout.tsx to avoid PostCSS build errors
import { createClient } from '@supabase/supabase-js'
import {
  PHILIPPINES_CENTER, PHILIPPINES_BOUNDS,
  DEFAULT_STYLE_URL, SATELLITE_STYLE,
  HazardLayerType, HAZARD_LAYER_COLORS
} from '@ofw-realty/map'
import { CityTagBar } from './CityTagBar'
import { ListingPanel } from './ListingPanel'

const HAZARD_LABELS: Record<HazardLayerType, string> = {
  flood: '🌊 Flood',
  earthquake: '🔴 Earthquake',
  landslide: '⛰️ Landslide',
  storm_surge: '🌀 Storm Surge',
  typhoon: '🌪️ Typhoon',
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  residential_lot: 'Residential Lot',
  house_and_lot: 'House & Lot',
  condo: 'Condo',
  commercial: 'Commercial',
  farm_lot: 'Farm Lot',
}

export function MapViewWithPanel() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [activeLayers, setActiveLayers] = useState<Set<HazardLayerType>>(new Set())
  const [showLayers, setShowLayers] = useState(false)
  const [listings, setListings] = useState<any[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedListing, setSelectedListing] = useState<any | null>(null)
  const [mapZoom, setMapZoom] = useState(6)
  const [mapBounds, setMapBounds] = useState<{ minLng: number; maxLng: number; minLat: number; maxLat: number } | null>(null)
  const [mapStyle, setMapStyle] = useState<'satellite' | 'street'>('satellite')

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: SATELLITE_STYLE as any,
      center: PHILIPPINES_CENTER,
      zoom: 6,
      maxBounds: [
        [PHILIPPINES_BOUNDS[0][0] - 2, PHILIPPINES_BOUNDS[0][1] - 2],
        [PHILIPPINES_BOUNDS[1][0] + 2, PHILIPPINES_BOUNDS[1][1] + 2],
      ],
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.current.on('load', () => {
      map.current!.addSource('listings', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      })

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
        },
      })

      map.current!.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'listings',
        filter: ['has', 'point_count'],
        layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 13 },
        paint: { 'text-color': '#ffffff' },
      })

      map.current!.addLayer({
        id: 'pins-featured',
        type: 'circle',
        source: 'listings',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'is_featured'], true]],
        paint: {
          'circle-color': '#f59e0b',
          'circle-radius': ['case', ['==', ['get', 'id'], hoveredId ?? ''], 14, 11],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
        },
      })

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

      // Click cluster
      map.current!.on('click', 'clusters', (e) => {
        const features = map.current!.queryRenderedFeatures(e.point, { layers: ['clusters'] })
        const clusterId = features[0].properties?.cluster_id
        const source = map.current!.getSource('listings') as maplibregl.GeoJSONSource
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          map.current!.easeTo({ center: (features[0].geometry as any).coordinates, zoom })
        }).catch(() => {})
      })

      // Click pin — highlight in sidebar
      const onPinClick = (e: any) => {
        if (!e.features?.length) return
        const props = e.features[0].properties!
        setSelectedListing(props)
        // Scroll sidebar to that listing
        document.getElementById(`listing-${props.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }

      map.current!.on('click', 'pins-featured', onPinClick)
      map.current!.on('click', 'pins-standard', onPinClick)

      ;['clusters', 'pins-featured', 'pins-standard'].forEach(layer => {
        map.current!.on('mouseenter', layer, () => { map.current!.getCanvas().style.cursor = 'pointer' })
        map.current!.on('mouseleave', layer, () => { map.current!.getCanvas().style.cursor = '' })
      })

      loadPins()
    })

    map.current.on('moveend', loadPins)
    map.current.on('zoomend', () => {
      if (map.current) {
        setMapZoom(map.current.getZoom())
        const b = map.current.getBounds()
        setMapBounds({ minLng: b.getWest(), maxLng: b.getEast(), minLat: b.getSouth(), maxLat: b.getNorth() })
      }
    })

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
          setListings(prev => prev.filter(l => l.id !== updated.id))
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

      // Also fetch full listing data for sidebar
      const listingRes = await fetch(`/api/listings?limit=50`)
      if (listingRes.ok) {
        const data = await listingRes.json()
        setListings(data)
      }
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
        if (type === 'earthquake' || type === 'typhoon') {
          map.current.addLayer({
            id: layerId, type: 'line', source: sourceId,
            paint: { 'line-color': HAZARD_LAYER_COLORS[type], 'line-width': 3, 'line-opacity': 0.8 },
          }, 'pins-verified-ring')
        } else {
          map.current.addLayer({
            id: layerId, type: 'fill', source: sourceId,
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
    map.current?.fitBounds(bounds, { padding: 40, duration: 800 })
  }

  function flyToListing(listing: any) {
    if (!listing) {
      setSelectedListing(null)
      return
    }
    map.current?.flyTo({ center: [listing.lng, listing.lat], zoom: 14, duration: 800 })
    setSelectedListing(listing)
  }

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative', overflow: 'hidden' }}>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        width: 380, flexShrink: 0, background: '#0D0D0D',
        borderLeft: '1px solid #1A1A1A', display: 'flex', flexDirection: 'column',
        zIndex: 20, order: 2,
      }}>
        {/* Panel header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #1A1A1A' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>
              {listings.length > 0 ? `${listings.length} properties` : 'Properties'}
            </p>
            <span style={{ fontSize: 12, color: '#595959' }}>Move map to update</span>
          </div>
          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['All', '🏡 House', '🏢 Condo', '🏞️ Lot', '🌾 Farm'].map(f => (
              <button key={f} style={{
                padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                border: '1px solid', cursor: 'pointer',
                borderColor: f === 'All' ? '#703BF7' : '#1A1A1A',
                background: f === 'All' ? 'rgba(112,59,247,0.15)' : '#141414',
                color: f === 'All' ? '#703BF7' : '#595959',
              }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Listing cards */}
        <ListingPanel
          listings={listings}
          selectedId={selectedListing?.id ?? null}
          onSelect={flyToListing}
          onHover={setHoveredId}
        />
      </div>

      {/* ── MAP ── */}
      <div style={{ flex: 1, position: 'relative', order: 1 }}>
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

        {/* City tags */}
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
          <CityTagBar onSelectCity={filterByBoundary} currentZoom={mapZoom} currentBounds={mapBounds ?? undefined} />
        </div>

        {/* Hazard layers toggle */}
        <div style={{
          position: 'absolute', bottom: 32, right: 12, zIndex: 10,
          background: '#0D0D0D', borderRadius: 12, padding: '12px 14px',
          border: '1px solid #1A1A1A', minWidth: 160,
        }}>
          {/* Map style toggle */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            <button
              onClick={() => {
                setMapStyle('satellite')
                map.current?.setStyle(SATELLITE_STYLE as any)
              }}
              style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: `1px solid ${mapStyle === 'satellite' ? 'rgba(112,59,247,0.5)' : '#262626'}`, background: mapStyle === 'satellite' ? 'rgba(112,59,247,0.15)' : '#141414', color: mapStyle === 'satellite' ? '#703BF7' : '#595959', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
            >
              🛰️ Satellite
            </button>
            <button
              onClick={() => {
                setMapStyle('street')
                map.current?.setStyle(DEFAULT_STYLE_URL)
              }}
              style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: `1px solid ${mapStyle === 'street' ? 'rgba(112,59,247,0.5)' : '#262626'}`, background: mapStyle === 'street' ? 'rgba(112,59,247,0.15)' : '#141414', color: mapStyle === 'street' ? '#703BF7' : '#595959', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
            >
              🗺️ Street
            </button>
          </div>
          <button
            onClick={() => setShowLayers(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700, color: '#999', padding: 0,
            }}
          >
            <span>⚠️ Hazard Layers</span>
            <span style={{ fontSize: 10, color: '#595959' }}>{showLayers ? '▲' : '▼'}</span>
          </button>
          {showLayers && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(Object.keys(HAZARD_LABELS) as HazardLayerType[]).map(type => (
                <button key={type} onClick={() => toggleHazardLayer(type)} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: activeLayers.has(type) ? 'rgba(112,59,247,0.1)' : 'transparent',
                  fontSize: 12, color: activeLayers.has(type) ? '#703BF7' : '#595959',
                  fontWeight: activeLayers.has(type) ? 600 : 400, textAlign: 'left', width: '100%',
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: HAZARD_LAYER_COLORS[type], opacity: activeLayers.has(type) ? 1 : 0.4 }} />
                  {HAZARD_LABELS[type]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 32, left: 12, zIndex: 10,
          background: '#0D0D0D', borderRadius: 12, padding: '12px 14px',
          border: '1px solid #1A1A1A',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#595959', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Legend</p>
          {[
            { color: '#f59e0b', label: 'Featured', border: '#f59e0b' },
            { color: '#703BF7', label: 'Standard', border: '#703BF7' },
            { color: 'transparent', label: 'Blockchain ✓', border: '#10b981' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.color, border: `2px solid ${item.border}` }} />
              <span style={{ fontSize: 12, color: '#595959' }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Balikbayan mode */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <button style={{
            background: '#703BF7', color: 'white', border: 'none', borderRadius: 99,
            padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 0 24px rgba(112,59,247,0.5)',
          }}>
            ✈️ Balikbayan Mode
          </button>
        </div>
      </div>
    </div>
  )
}
