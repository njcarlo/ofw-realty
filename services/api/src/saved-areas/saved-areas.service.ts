import { Injectable, BadRequestException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

const MAX_SAVED_AREAS = 20

@Injectable()
export class SavedAreasService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(buyerId: string) {
    const { data, error } = await this.supabase.admin
      .from('saved_areas')
      .select('*')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }

  async create(dto: { name: string; boundary: object; level: string }, buyerId: string) {
    // Check limit
    const { count } = await this.supabase.admin
      .from('saved_areas')
      .select('id', { count: 'exact', head: true })
      .eq('buyer_id', buyerId)

    if ((count ?? 0) >= MAX_SAVED_AREAS) {
      throw new BadRequestException(`Maximum of ${MAX_SAVED_AREAS} saved areas allowed`)
    }

    const { data, error } = await this.supabase.admin
      .from('saved_areas')
      .insert({ buyer_id: buyerId, name: dto.name, boundary: dto.boundary, level: dto.level })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async remove(id: string, buyerId: string) {
    const { error } = await this.supabase.admin
      .from('saved_areas')
      .delete()
      .eq('id', id)
      .eq('buyer_id', buyerId)

    if (error) throw error
    return { message: 'Saved area removed' }
  }

  // Called when a new listing is published — check if it falls within any saved area
  async notifyBuyersInArea(listing: { id: string; lat: number; lng: number; title: string }) {
    const { data: areas } = await this.supabase.admin
      .from('saved_areas')
      .select('id, buyer_id, name, boundary')

    for (const area of areas ?? []) {
      const boundary = area.boundary as any
      if (this.isPointInBoundary(listing.lat, listing.lng, boundary)) {
        await this.supabase.admin.from('notifications').insert({
          user_id: area.buyer_id,
          type: 'new_listing_in_saved_area',
          title: 'New listing in your saved area',
          body: `A new property "${listing.title}" was listed in ${area.name}`,
          data: { listing_id: listing.id, saved_area_id: area.id },
        })
      }
    }
  }

  private isPointInBoundary(lat: number, lng: number, boundary: any): boolean {
    // Simple bounding box check
    if (boundary.minLat && boundary.maxLat && boundary.minLng && boundary.maxLng) {
      return lat >= boundary.minLat && lat <= boundary.maxLat &&
             lng >= boundary.minLng && lng <= boundary.maxLng
    }
    return false
  }
}
