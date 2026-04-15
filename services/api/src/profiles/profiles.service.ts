import { Injectable, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class ProfilesService {
  constructor(private readonly supabase: SupabaseService) {}

  async getAgents(q?: string) {
    let query = this.supabase.admin
      .from('realtors')
      .select(`
        id, slug, prc_license_number, verified_badge, blockchain_qr_url, specializations,
        users!inner(full_name, avatar_url, email),
        broker_companies(id, name, slug, verified_badge)
      `)
      .order('verified_badge', { ascending: false })

    if (q) {
      query = query.ilike('users.full_name', `%${q}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  }

  async getAgent(slug: string) {
    const { data, error } = await this.supabase.admin
      .from('realtors')
      .select(`
        id, slug, prc_license_number, verified_badge, blockchain_qr_url, specializations,
        users!inner(full_name, avatar_url, email, bio, spoken_languages),
        broker_companies(id, name, slug, verified_badge),
        listings(id, title, price_php, city, province, property_type, status, listing_photos(url, is_primary))
      `)
      .eq('slug', slug)
      .single()

    if (error || !data) throw new NotFoundException('Agent not found')

    // Get sold listings separately
    const { data: soldListings } = await this.supabase.admin
      .from('listings')
      .select('id, title, city, province, price_php')
      .eq('realtor_id', data.id)
      .eq('status', 'sold')

    return { ...data, sold_listings: soldListings ?? [] }
  }

  async getBrokers(q?: string) {
    let query = this.supabase.admin
      .from('broker_companies')
      .select(`
        id, name, slug, logo_url, cover_url, description,
        office_address, verified_badge, social_links,
        realtors(id, slug, verified_badge, users(full_name, avatar_url))
      `)
      .order('verified_badge', { ascending: false })

    if (q) {
      query = query.ilike('name', `%${q}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  }

  async getBroker(slug: string) {
    const { data, error } = await this.supabase.admin
      .from('broker_companies')
      .select(`
        id, name, slug, logo_url, cover_url, description,
        office_address, operating_hours, verified_badge, social_links,
        realtors(id, slug, verified_badge, users(full_name, avatar_url)),
        listings(id, title, price_php, city, province, property_type, status, blockchain_verified, listing_photos(url, is_primary))
      `)
      .eq('slug', slug)
      .single()

    if (error || !data) throw new NotFoundException('Brokerage not found')
    return data
  }
}
