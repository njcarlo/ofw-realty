// MapLibre GL JS wrapper
// Satellite tiles: ESRI World Imagery (free, no API key)
// Street fallback: OpenFreeMap liberty

export const PHILIPPINES_CENTER: [number, number] = [122.5, 12.0]
export const PHILIPPINES_BOUNDS: [[number, number], [number, number]] = [
  [116.9, 4.6],
  [126.6, 21.1]
]

// Satellite/terrain style using ESRI World Imagery (free, no API key required)
export const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '© Esri, Maxar, Earthstar Geographics',
      maxzoom: 19,
    },
    'esri-labels': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'satellite',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 22,
    },
    {
      id: 'labels',
      type: 'raster',
      source: 'esri-labels',
      minzoom: 0,
      maxzoom: 22,
      paint: { 'raster-opacity': 0.85 },
    },
  ],
} as any

// Street style (fallback / toggle)
export const DEFAULT_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
export const SATELLITE_STYLE_URL = 'satellite' // sentinel for using SATELLITE_STYLE object

export const HAZARD_LAYER_TYPES = [
  'flood', 'earthquake', 'landslide', 'storm_surge', 'typhoon'
] as const
export type HazardLayerType = typeof HAZARD_LAYER_TYPES[number]

export const HAZARD_LAYER_COLORS: Record<HazardLayerType, string> = {
  flood: '#3b82f6',
  earthquake: '#ef4444',
  landslide: '#f97316',
  storm_surge: '#8b5cf6',
  typhoon: '#06b6d4',
}
