import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

// Demo infrastructure data — replace with real DPWH/DOTr GeoJSON when available
const DEMO_INFRASTRUCTURE = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'CALAX (Cavite-Laguna Expressway)', type: 'expressway', status: 'Operational', completion: '2021' },
      geometry: { type: 'LineString', coordinates: [[120.97, 14.47], [121.00, 14.40], [121.05, 14.32], [121.08, 14.25]] }
    },
    {
      type: 'Feature',
      properties: { name: 'CAVITEX Extension', type: 'expressway', status: 'Under Construction', completion: '2026' },
      geometry: { type: 'LineString', coordinates: [[120.88, 14.48], [120.92, 14.44], [120.97, 14.47]] }
    },
    {
      type: 'Feature',
      properties: { name: 'LRT-1 Cavite Extension', type: 'lrt_mrt', status: 'Under Construction', completion: '2027' },
      geometry: { type: 'LineString', coordinates: [[120.98, 14.54], [120.97, 14.50], [120.96, 14.46], [120.95, 14.42], [120.94, 14.38]] }
    },
    {
      type: 'Feature',
      properties: { name: 'Metro Manila Subway (MMS)', type: 'lrt_mrt', status: 'Under Construction', completion: '2028' },
      geometry: { type: 'LineString', coordinates: [[121.05, 14.68], [121.04, 14.63], [121.03, 14.58], [121.02, 14.54]] }
    },
    {
      type: 'Feature',
      properties: { name: 'NLEX-SLEX Connector Road', type: 'expressway', status: 'Under Construction', completion: '2025' },
      geometry: { type: 'LineString', coordinates: [[120.98, 14.60], [120.99, 14.56], [121.00, 14.52]] }
    },
    {
      type: 'Feature',
      properties: { name: 'Bataan-Cavite Interlink Bridge', type: 'bridge', status: 'Planned', completion: '2030' },
      geometry: { type: 'LineString', coordinates: [[120.57, 14.65], [120.65, 14.60], [120.73, 14.55], [120.82, 14.50], [120.90, 14.47]] }
    },
    {
      type: 'Feature',
      properties: { name: 'SLEX TR4 (Sto. Tomas-Batangas)', type: 'expressway', status: 'Operational', completion: '2022' },
      geometry: { type: 'LineString', coordinates: [[121.02, 14.10], [121.03, 13.95], [121.04, 13.80]] }
    },
    {
      type: 'Feature',
      properties: { name: 'Cebu-Cordova Link Expressway', type: 'bridge', status: 'Operational', completion: '2022' },
      geometry: { type: 'LineString', coordinates: [[123.90, 10.29], [123.93, 10.27], [123.96, 10.25]] }
    },
  ]
}

@Injectable()
export class InfrastructureService {
  constructor(private readonly supabase: SupabaseService) {}

  async getOverlay() {
    // Try database first
    const { data } = await this.supabase.admin
      .from('infrastructure_projects')
      .select('name, type, geojson, estimated_completion_year')

    if (data && data.length > 0) {
      return {
        type: 'FeatureCollection',
        features: data.map(p => ({
          type: 'Feature',
          properties: { name: p.name, type: p.type, completion: p.estimated_completion_year },
          geometry: p.geojson,
        }))
      }
    }

    // Fall back to demo data
    return DEMO_INFRASTRUCTURE
  }
}
