import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { SetCommissionRateDto } from './dto/set-commission-rate.dto'
import { SetDefaultRateDto } from './dto/set-default-rate.dto'
import { UpdateRateDto } from './dto/update-rate.dto'
import { AddPromoRateDto } from './dto/add-promo-rate.dto'

@Injectable()
export class CommissionEngineService {
  constructor(private readonly supabase: SupabaseService) {}

  private validateRateValue(value: number) {
    if (value <= 0) {
      throw new UnprocessableEntityException({ code: 'rate_must_be_positive' })
    }
  }

  computeGrossCommission(unitPricePHP: number, rateType: string, rateValue: number): number {
    if (rateType === 'percentage') {
      return parseFloat((unitPricePHP * (rateValue / 100)).toFixed(2))
    }
    return rateValue // fixed_php
  }

  async setRate(userId: string, dto: SetCommissionRateDto) {
    this.validateRateValue(dto.rate_value)

    const { data: dev } = await this.supabase.admin
      .from('developers').select('id').eq('user_id', userId).single()
    if (!dev) throw new NotFoundException('Developer profile not found')

    const { data, error } = await this.supabase.admin
      .from('developer_commission_rates')
      .insert({
        connection_id: dto.connection_id ?? null,
        developer_id: dev.id,
        rate_type: dto.rate_type,
        rate_value: dto.rate_value,
        is_default: false,
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async setDefaultRate(userId: string, dto: SetDefaultRateDto) {
    this.validateRateValue(dto.rate_value)

    const { data: dev } = await this.supabase.admin
      .from('developers').select('id').eq('user_id', userId).single()
    if (!dev) throw new NotFoundException('Developer profile not found')

    // Upsert default rate (connection_id = null, is_default = true)
    const { data: existing } = await this.supabase.admin
      .from('developer_commission_rates')
      .select('id')
      .eq('developer_id', dev.id)
      .is('connection_id', null)
      .eq('is_default', true)
      .maybeSingle()

    if (existing) {
      const { data, error } = await this.supabase.admin
        .from('developer_commission_rates')
        .update({ rate_type: dto.rate_type, rate_value: dto.rate_value })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      return data
    }

    const { data, error } = await this.supabase.admin
      .from('developer_commission_rates')
      .insert({
        connection_id: null,
        developer_id: dev.id,
        rate_type: dto.rate_type,
        rate_value: dto.rate_value,
        is_default: true,
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async getApplicableRate(connectionId: string) {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // Check for active promo rate
    const { data: promoRate } = await this.supabase.admin
      .from('developer_commission_rates')
      .select('*')
      .eq('connection_id', connectionId)
      .not('promo_start', 'is', null)
      .lte('promo_start', today)
      .gte('promo_end', today)
      .maybeSingle()

    if (promoRate) return { ...promoRate, is_promo: true }

    // Fall back to standard rate for this connection
    const { data: standardRate } = await this.supabase.admin
      .from('developer_commission_rates')
      .select('*')
      .eq('connection_id', connectionId)
      .is('promo_start', null)
      .maybeSingle()

    if (standardRate) return { ...standardRate, is_promo: false }

    // Fall back to developer default rate
    const { data: conn } = await this.supabase.admin
      .from('broker_connections').select('developer_id').eq('id', connectionId).single()
    if (!conn) throw new NotFoundException('Connection not found')

    const { data: defaultRate } = await this.supabase.admin
      .from('developer_commission_rates')
      .select('*')
      .eq('developer_id', conn.developer_id)
      .is('connection_id', null)
      .eq('is_default', true)
      .maybeSingle()

    if (!defaultRate) throw new NotFoundException('No commission rate configured for this connection')
    return { ...defaultRate, is_promo: false, is_default: true }
  }

  async updateRate(rateId: string, dto: UpdateRateDto) {
    if (dto.rate_value !== undefined) this.validateRateValue(dto.rate_value)

    const { data, error } = await this.supabase.admin
      .from('developer_commission_rates')
      .update(dto)
      .eq('id', rateId)
      .select()
      .single()
    if (error || !data) throw new NotFoundException('Commission rate not found')
    return data
  }

  async addPromoRate(rateId: string, dto: AddPromoRateDto) {
    this.validateRateValue(dto.rate_value)

    const promoStart = new Date(dto.promo_start)
    const promoEnd = new Date(dto.promo_end)
    if (promoEnd <= promoStart) {
      throw new UnprocessableEntityException({ code: 'overlapping_promo_period' })
    }

    // Get parent rate to get developer_id and connection_id
    const { data: parent } = await this.supabase.admin
      .from('developer_commission_rates').select('*').eq('id', rateId).single()
    if (!parent) throw new NotFoundException('Commission rate not found')

    const { data, error } = await this.supabase.admin
      .from('developer_commission_rates')
      .insert({
        connection_id: parent.connection_id,
        developer_id: parent.developer_id,
        rate_type: dto.rate_type,
        rate_value: dto.rate_value,
        is_default: false,
        promo_start: dto.promo_start,
        promo_end: dto.promo_end,
      })
      .select()
      .single()
    if (error) throw error
    return data
  }
}
