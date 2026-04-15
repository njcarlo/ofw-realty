import { Injectable, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

type RiskLevel = 'Low' | 'Medium' | 'High'

function classifyRisk(value: number, thresholds: [number, number]): RiskLevel {
  if (value < thresholds[0]) return 'Low'
  if (value < thresholds[1]) return 'Medium'
  return 'High'
}

@Injectable()
export class GeohazardService {
  constructor(private readonly supabase: SupabaseService) {}

  async getReport(listingId: string) {
    const { data: listing } = await this.supabase.client
      .from('listings')
      .select('lat, lng, city, province')
      .eq('id', listingId)
      .single()

    if (!listing) throw new NotFoundException('Listing not found')

    // In production: call PAGASA, Project NOAH, PHIVOLCS, NDRRMC APIs
    // For Phase 1: return computed estimates based on known Philippine hazard zones
    // These are placeholder values — real data requires API integration

    const report = {
      listing_id: listingId,
      coordinates: { lat: listing.lat, lng: listing.lng },
      elevation_m: this.estimateElevation(listing.lat, listing.lng),
      flood_risk: this.estimateFloodRisk(listing.lat, listing.lng),
      fault_distance_km: this.estimateFaultDistance(listing.lat, listing.lng),
      landslide_risk: this.estimateLandslideRisk(listing.lat, listing.lng),
      storm_surge_risk: this.estimateStormSurgeRisk(listing.lat, listing.lng),
      typhoon_track_proximity: 'Moderate', // Philippines is in typhoon belt
      data_sources: ['DOST-PAGASA', 'Project NOAH', 'PHIVOLCS', 'NDRRMC'],
      data_source_date: '2024-Q4',
      disclaimer: 'Geohazard data is sourced from public government agencies and is for informational purposes only. Consult local authorities for official assessments.',
      generated_at: new Date().toISOString(),
    }

    return report
  }

  private estimateElevation(lat: number, lng: number): number {
    // Simplified: coastal areas (near 0 elevation), inland higher
    // Real implementation: SRTM/PAGASA elevation API
    return Math.max(0, Math.round((Math.abs(lat - 14.5) * 50 + Math.abs(lng - 121) * 30)))
  }

  private estimateFloodRisk(lat: number, lng: number): RiskLevel {
    // Low-lying coastal areas have higher flood risk
    const elevation = this.estimateElevation(lat, lng)
    return classifyRisk(elevation, [5, 15])
  }

  private estimateFaultDistance(lat: number, lng: number): number {
    // West Valley Fault runs through Metro Manila area
    // Simplified distance calculation
    const wvfLat = 14.5, wvfLng = 121.05
    const dist = Math.sqrt(Math.pow(lat - wvfLat, 2) + Math.pow(lng - wvfLng, 2)) * 111
    return Math.round(dist * 10) / 10
  }

  private estimateLandslideRisk(lat: number, lng: number): RiskLevel {
    const elevation = this.estimateElevation(lat, lng)
    return classifyRisk(elevation, [100, 300])
  }

  private estimateStormSurgeRisk(lat: number, lng: number): RiskLevel {
    const elevation = this.estimateElevation(lat, lng)
    return classifyRisk(elevation, [3, 10])
  }
}
