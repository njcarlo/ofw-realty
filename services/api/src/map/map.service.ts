import { Injectable, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

interface BoundingBox {
  minLat: number; maxLat: number; minLng: number; maxLng: number
}

const VALID_HAZARD_TYPES = ['flood', 'earthquake', 'landslide', 'storm_surge', 'typhoon']

@Injectable()
export class MapService {
  constructor(private readonly supabase: SupabaseService) {}

  async getPins(bbox: BoundingBox) {
    const { data, error } = await this.supabase.client
      .from('listings')
      .select('id, lat, lng, price_php, property_type, is_featured, blockchain_verified, scam_flagged')
      .eq('status', 'active')
      .eq('scam_flagged', false)
      .gte('lat', bbox.minLat)
      .lte('lat', bbox.maxLat)
      .gte('lng', bbox.minLng)
      .lte('lng', bbox.maxLng)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) throw error

    // Return as GeoJSON FeatureCollection
    return {
      type: 'FeatureCollection',
      features: (data ?? []).map(pin => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [pin.lng, pin.lat] },
        properties: {
          id: pin.id,
          price_php: pin.price_php,
          property_type: pin.property_type,
          is_featured: pin.is_featured,
          blockchain_verified: pin.blockchain_verified,
        },
      })),
    }
  }

  async getZonalValue(city: string, province: string) {
    const { data } = await this.supabase.client
      .from('lgu_tax_rates')
      .select('zonal_value_per_sqm, transfer_tax_rate')
      .eq('city', city)
      .eq('province', province)
      .single()
    return data ?? { zonal_value_per_sqm: null }
  }

  async getHazardLayer(type: string) {
    if (!VALID_HAZARD_TYPES.includes(type)) {
      throw new NotFoundException(`Unknown hazard layer type: ${type}`)
    }

    // Try Supabase Storage first (production GeoJSON from PAGASA/PHIVOLCS/NDRRMC)
    // Falls back to bundled demo GeoJSON if storage file not found
    try {
      const { data } = this.supabase.admin.storage
        .from('hazard-layers')
        .getPublicUrl(`${type}.geojson`)

      const res = await fetch(data.publicUrl)
      if (res.ok) {
        const geojson = await res.json()
        if (geojson.features?.length > 0) return geojson
      }
    } catch {
      // Fall through to bundled demo data
    }

    // Bundled demo GeoJSON — covers known Philippine hazard zones
    const demoData: Record<string, object> = {
      flood: {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { name: 'Metro Manila Flood Zone', risk: 'High' }, geometry: { type: 'Polygon', coordinates: [[[120.95,14.55],[121.10,14.55],[121.10,14.70],[120.95,14.70],[120.95,14.55]]] } },
          { type: 'Feature', properties: { name: 'Pampanga Flood Zone', risk: 'High' }, geometry: { type: 'Polygon', coordinates: [[[120.55,14.90],[120.85,14.90],[120.85,15.20],[120.55,15.20],[120.55,14.90]]] } },
          { type: 'Feature', properties: { name: 'Cagayan Valley Flood Zone', risk: 'High' }, geometry: { type: 'Polygon', coordinates: [[[121.60,17.40],[122.20,17.40],[122.20,18.20],[121.60,18.20],[121.60,17.40]]] } },
          { type: 'Feature', properties: { name: 'Leyte Flood Zone', risk: 'Medium' }, geometry: { type: 'Polygon', coordinates: [[[124.80,10.60],[125.10,10.60],[125.10,11.20],[124.80,11.20],[124.80,10.60]]] } },
          { type: 'Feature', properties: { name: 'Davao Flood Zone', risk: 'Medium' }, geometry: { type: 'Polygon', coordinates: [[[125.40,6.90],[125.70,6.90],[125.70,7.20],[125.40,7.20],[125.40,6.90]]] } },
        ]
      },
      earthquake: {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { name: 'West Valley Fault', type: 'Active Fault' }, geometry: { type: 'LineString', coordinates: [[121.08,14.30],[121.06,14.45],[121.04,14.60],[121.02,14.75],[121.00,14.90]] } },
          { type: 'Feature', properties: { name: 'East Valley Fault', type: 'Active Fault' }, geometry: { type: 'LineString', coordinates: [[121.15,14.35],[121.13,14.50],[121.11,14.65],[121.09,14.80]] } },
          { type: 'Feature', properties: { name: 'Philippine Fault Zone - Luzon', type: 'Major Fault' }, geometry: { type: 'LineString', coordinates: [[121.50,13.50],[121.60,14.20],[121.70,15.00],[121.80,15.80],[121.90,16.60],[122.00,17.40]] } },
          { type: 'Feature', properties: { name: 'Philippine Fault Zone - Visayas', type: 'Major Fault' }, geometry: { type: 'LineString', coordinates: [[124.00,9.50],[124.20,10.20],[124.40,10.90],[124.60,11.60]] } },
          { type: 'Feature', properties: { name: 'Cotabato Fault', type: 'Active Fault' }, geometry: { type: 'LineString', coordinates: [[124.20,6.80],[124.50,7.20],[124.80,7.60],[125.10,8.00]] } },
        ]
      },
      landslide: {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { name: 'Cordillera Landslide Zone', risk: 'High' }, geometry: { type: 'Polygon', coordinates: [[[120.60,16.50],[121.20,16.50],[121.20,17.20],[120.60,17.20],[120.60,16.50]]] } },
          { type: 'Feature', properties: { name: 'Benguet Landslide Zone', risk: 'High' }, geometry: { type: 'Polygon', coordinates: [[[120.55,16.20],[120.90,16.20],[120.90,16.55],[120.55,16.55],[120.55,16.20]]] } },
          { type: 'Feature', properties: { name: 'Southern Leyte Landslide Zone', risk: 'High' }, geometry: { type: 'Polygon', coordinates: [[[124.90,10.00],[125.20,10.00],[125.20,10.40],[124.90,10.40],[124.90,10.00]]] } },
          { type: 'Feature', properties: { name: 'Bukidnon Landslide Zone', risk: 'Medium' }, geometry: { type: 'Polygon', coordinates: [[[124.80,7.80],[125.30,7.80],[125.30,8.30],[124.80,8.30],[124.80,7.80]]] } },
        ]
      },
      storm_surge: {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { name: 'Eastern Samar Storm Surge Zone', risk: 'High' }, geometry: { type: 'Polygon', coordinates: [[[125.40,11.00],[125.70,11.00],[125.70,11.80],[125.40,11.80],[125.40,11.00]]] } },
          { type: 'Feature', properties: { name: 'Tacloban Storm Surge Zone', risk: 'High' }, geometry: { type: 'Polygon', coordinates: [[[124.95,11.10],[125.10,11.10],[125.10,11.30],[124.95,11.30],[124.95,11.10]]] } },
          { type: 'Feature', properties: { name: 'Batanes Storm Surge Zone', risk: 'High' }, geometry: { type: 'Polygon', coordinates: [[[121.80,20.20],[122.20,20.20],[122.20,20.60],[121.80,20.60],[121.80,20.20]]] } },
          { type: 'Feature', properties: { name: 'Quezon Pacific Coast', risk: 'Medium' }, geometry: { type: 'Polygon', coordinates: [[[122.00,13.60],[122.30,13.60],[122.30,14.20],[122.00,14.20],[122.00,13.60]]] } },
        ]
      },
      typhoon: {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { name: 'Typhoon Yolanda Track 2013', category: 'Super Typhoon' }, geometry: { type: 'LineString', coordinates: [[130.00,10.80],[128.00,11.00],[126.00,11.20],[124.50,11.40],[122.50,11.80],[120.50,12.50],[118.50,13.50]] } },
          { type: 'Feature', properties: { name: 'Typhoon Odette Track 2021', category: 'Super Typhoon' }, geometry: { type: 'LineString', coordinates: [[130.00,9.50],[128.00,9.80],[126.00,10.00],[124.00,10.20],[122.00,10.80],[120.00,11.50],[118.00,12.50]] } },
          { type: 'Feature', properties: { name: 'Typhoon Belt - Northern Luzon', risk: 'High' }, geometry: { type: 'Polygon', coordinates: [[[119.50,17.00],[122.50,17.00],[122.50,20.00],[119.50,20.00],[119.50,17.00]]] } },
          { type: 'Feature', properties: { name: 'Typhoon Belt - Eastern Philippines', risk: 'High' }, geometry: { type: 'Polygon', coordinates: [[[125.00,10.00],[127.00,10.00],[127.00,15.00],[125.00,15.00],[125.00,10.00]]] } },
        ]
      },
    }

    return demoData[type] ?? { type: 'FeatureCollection', features: [] }
  }
}
