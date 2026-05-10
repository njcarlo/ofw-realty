import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { SubmitReservationDto } from './dto/submit-reservation.dto'
import { RejectReservationDto } from './dto/reject-reservation.dto'
import { CommissionEngineService } from '../commission-engine/commission-engine.service'

@Injectable()
export class ReservationRequestsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly commissionEngine: CommissionEngineService,
  ) {}

  private async notify(userId: string, type: string, payload: Record<string, unknown>) {
    try {
      await this.supabase.admin.from('notifications').insert({ user_id: userId, type, payload, read: false })
    } catch { /* swallow */ }
  }

  async submit(userId: string, dto: SubmitReservationDto) {
    // Verify unit is available
    const { data: unit } = await this.supabase.admin
      .from('units')
      .select('id, status, project_id, projects!inner(developer_id)')
      .eq('id', dto.unit_id)
      .single()

    if (!unit) throw new NotFoundException('Unit not found')
    if ((unit as any).status !== 'available') {
      throw new ConflictException({ code: 'unit_not_available' })
    }

    const windowHours = dto.response_window_hours ?? 48
    const expiresAt = new Date(Date.now() + windowHours * 60 * 60 * 1000).toISOString()

    // Get broker company id
    const { data: bc } = await this.supabase.admin
      .from('broker_companies').select('id').eq('id', userId).maybeSingle()
    const brokerId = bc?.id ?? userId

    const { data: reservation, error } = await this.supabase.admin
      .from('reservation_requests')
      .insert({
        unit_id: dto.unit_id,
        connection_id: dto.connection_id,
        broker_id: brokerId,
        buyer_name: dto.buyer_name,
        buyer_contact: dto.buyer_contact,
        reservation_fee_confirmed: dto.reservation_fee_confirmed,
        status: 'pending',
        response_window_hours: windowHours,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (error?.code === '23505') throw new ConflictException({ code: 'unit_not_available' })
    if (error) throw error

    // Set unit to reserved
    await this.supabase.admin
      .from('units')
      .update({ status: 'reserved', updated_at: new Date().toISOString() })
      .eq('id', dto.unit_id)

    // Notify developer
    const developerId = (unit as any).projects?.developer_id
    if (developerId) {
      await this.notify(developerId, 'reservation_submitted', { reservation_id: reservation.id, unit_id: dto.unit_id })
    }

    return reservation
  }

  async confirm(userId: string, reservationId: string) {
    const { data: reservation } = await this.supabase.admin
      .from('reservation_requests')
      .select('*, units!inner(project_id, price_php, projects!inner(developer_id))')
      .eq('id', reservationId)
      .single()

    if (!reservation) throw new NotFoundException('Reservation not found')

    const { data, error } = await this.supabase.admin
      .from('reservation_requests')
      .update({ status: 'confirmed', responded_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', reservationId)
      .select()
      .single()
    if (error) throw error

    // Set unit to sold
    await this.supabase.admin
      .from('units')
      .update({ status: 'sold', updated_at: new Date().toISOString() })
      .eq('id', reservation.unit_id)

    // Create commission record
    try {
      const rate = await this.commissionEngine.getApplicableRate(reservation.connection_id)
      const unitPrice = (reservation as any).units?.price_php ?? 0
      const grossCommission = this.commissionEngine.computeGrossCommission(
        unitPrice,
        rate.rate_type,
        rate.rate_value,
      )

      await this.supabase.admin.from('developer_commission_records').insert({
        reservation_id: reservationId,
        connection_id: reservation.connection_id,
        unit_id: reservation.unit_id,
        rate_type: rate.rate_type,
        rate_value: rate.rate_value,
        unit_price_php: unitPrice,
        gross_commission: grossCommission,
      })
    } catch {
      // Commission record creation failure: revert reservation to pending
      await this.supabase.admin
        .from('reservation_requests')
        .update({ status: 'pending', responded_at: null, updated_at: new Date().toISOString() })
        .eq('id', reservationId)
      await this.supabase.admin
        .from('units')
        .update({ status: 'reserved', updated_at: new Date().toISOString() })
        .eq('id', reservation.unit_id)
      throw new Error('Commission record creation failed; reservation reverted to pending')
    }

    await this.notify(reservation.broker_id, 'reservation_confirmed', { reservation_id: reservationId })
    return data
  }

  async reject(userId: string, reservationId: string, dto: RejectReservationDto) {
    const { data: reservation } = await this.supabase.admin
      .from('reservation_requests')
      .select('*')
      .eq('id', reservationId)
      .single()
    if (!reservation) throw new NotFoundException('Reservation not found')

    const { data, error } = await this.supabase.admin
      .from('reservation_requests')
      .update({
        status: 'rejected',
        rejection_reason: dto.rejection_reason,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId)
      .select()
      .single()
    if (error) throw error

    // Revert unit to available
    await this.supabase.admin
      .from('units')
      .update({ status: 'available', updated_at: new Date().toISOString() })
      .eq('id', reservation.unit_id)

    await this.notify(reservation.broker_id, 'reservation_rejected', {
      reservation_id: reservationId,
      reason: dto.rejection_reason,
    })
    return data
  }

  async list(userId: string, filters?: { status?: string; unit_id?: string }) {
    let query = this.supabase.admin
      .from('reservation_requests')
      .select('*, units(id, identifier, unit_type, price_php, project_id)')
      .order('created_at', { ascending: false })

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.unit_id) query = query.eq('unit_id', filters.unit_id)

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  }

  async expireOverdueReservations() {
    const now = new Date().toISOString()

    const { data: expired } = await this.supabase.admin
      .from('reservation_requests')
      .select('id, unit_id, broker_id, units!inner(project_id, projects!inner(developer_id))')
      .eq('status', 'pending')
      .lt('expires_at', now)

    if (!expired?.length) return { expired: 0 }

    const ids = expired.map((r: any) => r.id)
    const unitIds = expired.map((r: any) => r.unit_id)

    // Set reservations to expired
    await this.supabase.admin
      .from('reservation_requests')
      .update({ status: 'expired', updated_at: now })
      .in('id', ids)

    // Revert units to available
    await this.supabase.admin
      .from('units')
      .update({ status: 'available', updated_at: now })
      .in('id', unitIds)

    // Notify both parties
    for (const r of expired) {
      const developerId = (r as any).units?.projects?.developer_id
      await this.notify(r.broker_id, 'reservation_expired', { reservation_id: r.id })
      if (developerId) {
        await this.notify(developerId, 'reservation_expired', { reservation_id: r.id })
      }
    }

    return { expired: ids.length }
  }
}
