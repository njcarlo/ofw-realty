import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class CoBrokingService {
  constructor(private readonly supabase: SupabaseService) {}

  async getInventory(userId: string) {
    // Get all listings from co-broking network brokerages
    const { data: listings, error } = await this.supabase.admin
      .from('listings')
      .select(`
        id, title, price_php, city, province, property_type, status,
        listing_photos(url, is_primary),
        broker_companies(id, name, co_broking),
        co_broking_listings(id, co_broker_id, commission_split, status)
      `)
      .eq('status', 'active')
      .not('brokerage_id', 'is', null)

    if (error) throw error

    // Filter to only co-broking enabled brokerages
    return (listings ?? []).filter((l: any) => l.broker_companies?.co_broking === true)
  }

  async requestCoListing(dto: { listing_id: string; commission_split: number }, requesterId: string) {
    // Get requester's brokerage
    const { data: realtor } = await this.supabase.admin
      .from('realtors')
      .select('primary_brokerage')
      .eq('id', requesterId)
      .single()

    const { data, error } = await this.supabase.admin
      .from('co_broking_listings')
      .insert({
        listing_id: dto.listing_id,
        co_broker_id: realtor?.primary_brokerage,
        commission_split: dto.commission_split,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'co_broking',
      entity_id: data.id,
      user_id: requesterId,
      action: 'co_listing_requested',
      metadata: { listing_id: dto.listing_id, commission_split: dto.commission_split },
    })

    return data
  }

  async updateStatus(id: string, status: 'approved' | 'removed') {
    const { data, error } = await this.supabase.admin
      .from('co_broking_listings')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'co_broking',
      entity_id: id,
      action: `co_listing_${status}`,
    })

    return data
  }
}
