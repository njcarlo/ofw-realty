// MapLibre GL JS wrapper
// Free tile provider: OpenFreeMap (https://tiles.openfreemap.org)
// Upgrade path: swap style URL to Mapbox when needed

export const PHILIPPINES_CENTER: [number, number] = [122.5, 12.0]
export const PHILIPPINES_BOUNDS: [[number, number], [number, number]] = [
  [116.9, 4.6],
  [126.6, 21.1]
]
export const DEFAULT_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

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
