'use client'

interface CityTag {
  name: string
  province: string
  bounds: [[number, number], [number, number]]
}

// All major Philippine cities/provinces with bounds
const ALL_CITIES: CityTag[] = [
  // Metro Manila
  { name: 'BGC / Taguig', province: 'Metro Manila', bounds: [[121.03, 14.51], [121.07, 14.57]] },
  { name: 'Makati', province: 'Metro Manila', bounds: [[121.00, 14.54], [121.04, 14.58]] },
  { name: 'Quezon City', province: 'Metro Manila', bounds: [[121.00, 14.62], [121.12, 14.75]] },
  { name: 'Pasig', province: 'Metro Manila', bounds: [[121.05, 14.54], [121.10, 14.60]] },
  { name: 'Paranaque', province: 'Metro Manila', bounds: [[120.98, 14.45], [121.03, 14.52]] },
  { name: 'Mandaluyong', province: 'Metro Manila', bounds: [[121.02, 14.57], [121.05, 14.60]] },
  // Cavite
  { name: 'Bacoor', province: 'Cavite', bounds: [[120.93, 14.41], [120.99, 14.47]] },
  { name: 'Imus', province: 'Cavite', bounds: [[120.92, 14.41], [120.98, 14.46]] },
  { name: 'Dasmariñas', province: 'Cavite', bounds: [[120.93, 14.29], [121.01, 14.36]] },
  { name: 'Cavite City', province: 'Cavite', bounds: [[120.87, 14.46], [120.93, 14.51]] },
  { name: 'General Trias', province: 'Cavite', bounds: [[120.87, 14.35], [120.97, 14.42]] },
  { name: 'Tagaytay', province: 'Cavite', bounds: [[120.92, 14.09], [121.02, 14.15]] },
  // Laguna
  { name: 'Sta. Rosa', province: 'Laguna', bounds: [[121.08, 14.26], [121.14, 14.32]] },
  { name: 'Calamba', province: 'Laguna', bounds: [[121.14, 14.18], [121.22, 14.24]] },
  { name: 'San Pedro', province: 'Laguna', bounds: [[121.04, 14.34], [121.09, 14.38]] },
  // Batangas
  { name: 'Batangas City', province: 'Batangas', bounds: [[121.04, 13.73], [121.10, 13.79]] },
  { name: 'Lipa City', province: 'Batangas', bounds: [[121.14, 13.93], [121.20, 13.99]] },
  // Pampanga
  { name: 'Angeles City', province: 'Pampanga', bounds: [[120.56, 15.12], [120.62, 15.18]] },
  { name: 'San Fernando', province: 'Pampanga', bounds: [[120.67, 15.02], [120.73, 15.08]] },
  // Cebu
  { name: 'Cebu City', province: 'Cebu', bounds: [[123.86, 10.28], [123.92, 10.36]] },
  { name: 'Mandaue', province: 'Cebu', bounds: [[123.91, 10.31], [123.97, 10.37]] },
  { name: 'Lapu-Lapu', province: 'Cebu', bounds: [[123.95, 10.28], [124.01, 10.34]] },
  // Davao
  { name: 'Davao City', province: 'Davao del Sur', bounds: [[125.55, 7.04], [125.65, 7.14]] },
  // Iloilo
  { name: 'Iloilo City', province: 'Iloilo', bounds: [[122.54, 10.69], [122.60, 10.75]] },
]

// Province-level tags for when zoomed out
const PROVINCES: CityTag[] = [
  { name: 'Metro Manila', province: 'NCR', bounds: [[120.92, 14.39], [121.12, 14.77]] },
  { name: 'Cavite', province: 'Region IV-A', bounds: [[120.60, 14.00], [121.10, 14.55]] },
  { name: 'Laguna', province: 'Region IV-A', bounds: [[121.00, 14.00], [121.60, 14.40]] },
  { name: 'Batangas', province: 'Region IV-A', bounds: [[120.70, 13.60], [121.30, 14.10]] },
  { name: 'Cebu', province: 'Region VII', bounds: [[123.60, 9.80], [124.20, 11.20]] },
  { name: 'Davao', province: 'Region XI', bounds: [[125.20, 6.60], [126.00, 7.60]] },
  { name: 'Iloilo', province: 'Region VI', bounds: [[122.30, 10.50], [122.80, 11.00]] },
  { name: 'Pampanga', province: 'Region III', bounds: [[120.40, 14.80], [121.00, 15.30]] },
]

interface Props {
  onSelectCity: (name: string, bounds: [[number, number], [number, number]]) => void
  currentZoom?: number
  currentBounds?: { minLng: number; maxLng: number; minLat: number; maxLat: number }
}

export function CityTagBar({ onSelectCity, currentZoom = 6, currentBounds }: Props) {
  // Show province tags when zoomed out, city tags when zoomed in
  const isZoomedIn = currentZoom >= 9

  // Filter to show only cities/provinces visible in current bounds
  const tags = isZoomedIn ? ALL_CITIES : PROVINCES

  const visibleTags = currentBounds
    ? tags.filter(tag => {
        const tagCenterLng = (tag.bounds[0][0] + tag.bounds[1][0]) / 2
        const tagCenterLat = (tag.bounds[0][1] + tag.bounds[1][1]) / 2
        // Show tags whose center is within or near the current viewport
        const buffer = isZoomedIn ? 0.5 : 3
        return (
          tagCenterLng >= currentBounds.minLng - buffer &&
          tagCenterLng <= currentBounds.maxLng + buffer &&
          tagCenterLat >= currentBounds.minLat - buffer &&
          tagCenterLat <= currentBounds.maxLat + buffer
        )
      })
    : tags.slice(0, 6) // Default: show first 6

  if (visibleTags.length === 0) return null

  return (
    <div style={{
      display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 500,
    }}>
      {visibleTags.map(tag => (
        <button
          key={tag.name}
          onClick={() => onSelectCity(tag.name, tag.bounds)}
          style={{
            background: 'white', border: 'none', borderRadius: 99,
            padding: '6px 12px', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            color: '#374151', whiteSpace: 'nowrap',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#eff6ff'
            e.currentTarget.style.color = '#2563eb'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'white'
            e.currentTarget.style.color = '#374151'
          }}
        >
          {tag.name}
        </button>
      ))}
    </div>
  )
}
