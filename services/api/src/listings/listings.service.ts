import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { CreateListingDto, UpdateListingDto } from './listings.dto'

// LGU transfer tax rates (sample — full table in DB)
const DEFAULT_TRANSFER_TAX_RATE = 0.005 // 0.5% default

// Valid status transitions: active → reserved → sold (terminal)
//                           active → deactivated
//                           deactivated → active
const VALID_TRANSITIONS: Record<string, string[]> = {
  active: ['reserved', 'deactivated'],
  reserved: ['sold', 'active'],   // can un-reserve back to active
  sold: [],                        // terminal — no transitions allowed
  deactivated: ['active'],
}

function assertValidTransition(from: string, to: string) {
  const allowed = VALID_TRANSITIONS[from] ?? []
  if (!allowed.includes(to)) {
    throw new BadRequestException(
      `Invalid status transition: "${from}" → "${to}". ` +
      (from === 'sold'
        ? 'Sold is a terminal state and cannot be changed.'
        : `Allowed transitions from "${from}": ${allowed.join(', ') || 'none'}.`)
    )
  }
}

@Injectable()
export class ListingsService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(query: Record<string, string>) {
    let q = this.supabase.client
      .from('listings')
      .select(`
        id, title, property_type, price_php, lat, lng,
        address, city, province, lot_area_sqm,
        is_featured, blockchain_verified, scam_flagged, status,
        created_at, updated_at,
        listing_photos(url, is_primary),
        realtors(id, slug, users(full_name, avatar_url), verified_badge)
      `)
      .eq('status', 'active')
      .eq('scam_flagged', false)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)

    if (query.city) q = q.eq('city', query.city)
    if (query.province) q = q.eq('province', query.province)
    if (query.property_type) q = q.eq('property_type', query.property_type)
    if (query.min_price) q = q.gte('price_php', parseFloat(query.min_price))
    if (query.max_price) q = q.lte('price_php', parseFloat(query.max_price))

    const { data, error } = await q
    if (error) throw error
    return data
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase.client
      .from('listings')
      .select(`
        *,
        listing_photos(url, is_primary, sort_order),
        realtors(
          id, slug, prc_license_number, verified_badge, blockchain_qr_url,
          users(full_name, avatar_url, phone, email),
          broker_companies(id, name, slug, verified_badge)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) throw new NotFoundException('Listing not found')
    return data
  }

  async create(dto: CreateListingDto, userId: string) {
    // Get realtor record
    const { data: realtor } = await this.supabase.client
      .from('realtors')
      .select('id, primary_brokerage')
      .eq('id', userId)
      .single()

    const { photo_urls, tct_number, tax_declaration_no, ...listingData } = dto

    const { data: listing, error } = await this.supabase.admin
      .from('listings')
      .insert({
        ...listingData,
        realtor_id: realtor?.id ?? null,
        brokerage_id: realtor?.primary_brokerage ?? null,
        tct_number_enc: tct_number, // encrypted at rest via field encryption service
        tax_declaration_no_enc: tax_declaration_no,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error

    // Insert photos
    if (photo_urls.length > 0) {
      await this.supabase.admin.from('listing_photos').insert(
        photo_urls.map((url, i) => ({
          listing_id: listing.id,
          url,
          is_primary: i === 0,
          sort_order: i,
        }))
      )
    }

    // Audit trail
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'listing',
      entity_id: listing.id,
      user_id: userId,
      action: 'created',
      metadata: { property_type: dto.property_type, price_php: dto.price_php },
    })

    return listing
  }

  async update(id: string, dto: UpdateListingDto, userId: string) {
    // Verify ownership
    const { data: existing } = await this.supabase.client
      .from('listings')
      .select('realtor_id, status')
      .eq('id', id)
      .single()

    if (!existing) throw new NotFoundException('Listing not found')
    if (existing.realtor_id !== userId) throw new ForbiddenException('Not your listing')

    // Enforce status transition rules
    if (dto.status && dto.status !== existing.status) {
      assertValidTransition(existing.status, dto.status)
    }

    const { photo_urls, tct_number, tax_declaration_no, ...updateData } = dto as any

    const { data, error } = await this.supabase.admin
      .from('listings')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'listing',
      entity_id: id,
      user_id: userId,
      action: dto.status ? `status_changed_to_${dto.status}` : 'updated',
      metadata: { previous_status: existing.status, ...updateData },
    })

    return data
  }

  async deactivate(id: string, userId: string) {
    const { data: existing } = await this.supabase.admin
      .from('listings')
      .select('status')
      .eq('id', id)
      .single()

    if (!existing) throw new NotFoundException('Listing not found')

    // Enforce transition: only active listings can be deactivated
    assertValidTransition(existing.status, 'deactivated')

    const { data, error } = await this.supabase.admin
      .from('listings')
      .update({ status: 'deactivated', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'listing',
      entity_id: id,
      user_id: userId,
      action: 'deactivated',
      metadata: { previous_status: existing.status },
    })

    return { message: 'Listing deactivated' }
  }

  async getClosingCosts(id: string, overridePrice?: number) {
    const { data: listing } = await this.supabase.client
      .from('listings')
      .select('price_php, city, province')
      .eq('id', id)
      .single()

    if (!listing) throw new NotFoundException('Listing not found')

    const sellingPrice = overridePrice ?? listing.price_php

    // Get LGU-specific transfer tax rate
    const { data: lgu } = await this.supabase.client
      .from('lgu_tax_rates')
      .select('transfer_tax_rate, zonal_value_per_sqm')
      .eq('city', listing.city ?? '')
      .eq('province', listing.province ?? '')
      .single()

    const transferTaxRate = lgu?.transfer_tax_rate ?? DEFAULT_TRANSFER_TAX_RATE
    const taxBase = sellingPrice // simplified; use max(selling, zonal) in production

    const cgt = taxBase * 0.06
    const dst = taxBase * 0.015
    const transferTax = taxBase * transferTaxRate
    const registrationFee = this.getLRAFee(sellingPrice)
    const notarialFee = sellingPrice * 0.015
    const miscFees = sellingPrice * 0.005
    const total = cgt + dst + transferTax + registrationFee + notarialFee + miscFees

    return {
      selling_price: sellingPrice,
      breakdown: {
        cgt: Math.round(cgt * 100) / 100,
        dst: Math.round(dst * 100) / 100,
        transfer_tax: Math.round(transferTax * 100) / 100,
        registration_fee: Math.round(registrationFee * 100) / 100,
        notarial_fee: Math.round(notarialFee * 100) / 100,
        misc_fees: Math.round(miscFees * 100) / 100,
      },
      total: Math.round(total * 100) / 100,
      disclaimer: 'These are estimates only. Actual fees may vary by LGU and are subject to change.',
    }
  }

  private getLRAFee(price: number): number {
    // LRA fee schedule (simplified)
    if (price <= 1_750_000) return 8_796
    if (price <= 2_000_000) return 10_621
    if (price <= 3_000_000) return 13_621
    if (price <= 5_000_000) return 18_621
    return 18_621 + (price - 5_000_000) * 0.0025
  }
}
