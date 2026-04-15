import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class LeadsService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(realtorId: string, listingId?: string, status?: string) {
    let query = this.supabase.admin
      .from('inquiries')
      .select(`
        id, message, offer_price_php, status, lead_score, source, created_at, updated_at,
        listings(id, title, price_php, city, province),
        users!buyer_id(full_name, avatar_url, email)
      `)
      .eq('realtor_id', realtorId)
      .order('lead_score', { ascending: false })
      .order('created_at', { ascending: false })

    if (listingId) query = query.eq('listing_id', listingId)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  }

  async getAnalytics(listingId: string) {
    const { data: inquiries } = await this.supabase.admin
      .from('inquiries')
      .select('id, status, created_at')
      .eq('listing_id', listingId)

    const total = inquiries?.length ?? 0
    const offers = inquiries?.filter(i => i.status !== 'pending').length ?? 0

    // Simulate view/save counts (in production: track via analytics events)
    return {
      listing_id: listingId,
      total_inquiries: total,
      total_offers: offers,
      total_views: total * 8, // placeholder ratio
      total_saves: Math.floor(total * 2.5),
      conversion_rate: total > 0 ? Math.round((offers / total) * 100) : 0,
    }
  }

  async updateStatus(id: string, status: string) {
    const { data, error } = await this.supabase.admin
      .from('inquiries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
