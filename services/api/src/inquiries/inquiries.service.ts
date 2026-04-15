import { Injectable, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class InquiriesService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(userId: string, role: string) {
    let query = this.supabase.client
      .from('inquiries')
      .select(`
        id, message, offer_price_php, status, lead_score, source, created_at, updated_at,
        listings(id, title, price_php, city, province),
        users!buyer_id(full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })

    if (role === 'buyer') {
      query = query.eq('buyer_id', userId)
    } else if (role === 'realtor') {
      query = query.eq('realtor_id', userId)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  async create(dto: { listing_id: string; message: string; offer_price_php?: number }, buyerId: string) {
    // Get listing to find realtor
    const { data: listing } = await this.supabase.client
      .from('listings')
      .select('realtor_id, brokerage_id')
      .eq('id', dto.listing_id)
      .single()

    if (!listing) throw new NotFoundException('Listing not found')

    const { data, error } = await this.supabase.admin
      .from('inquiries')
      .insert({
        listing_id: dto.listing_id,
        buyer_id: buyerId,
        realtor_id: listing.realtor_id,
        message: dto.message,
        offer_price_php: dto.offer_price_php ?? null,
        status: 'pending',
        source: 'platform',
      })
      .select()
      .single()

    if (error) throw error

    // Notify realtor
    if (listing.realtor_id) {
      await this.supabase.admin.from('notifications').insert({
        user_id: listing.realtor_id,
        type: 'new_inquiry',
        title: 'New inquiry received',
        body: dto.offer_price_php
          ? `New offer of ₱${dto.offer_price_php.toLocaleString()} received`
          : 'New inquiry received for your listing',
        data: { inquiry_id: data.id, listing_id: dto.listing_id },
      })
    }

    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'inquiry',
      entity_id: data.id,
      user_id: buyerId,
      action: 'created',
      metadata: { listing_id: dto.listing_id, offer_price_php: dto.offer_price_php },
    })

    return data
  }

  async updateStatus(id: string, status: string, userId: string) {
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
