import { Injectable, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { RejectDeveloperDto } from './dto/reject-developer.dto'

@Injectable()
export class DeveloperAdminService {
  constructor(private readonly supabase: SupabaseService) {}

  private async notify(userId: string, type: string, payload: Record<string, unknown>) {
    try {
      await this.supabase.admin.from('notifications').insert({ user_id: userId, type, payload, read: false })
    } catch { /* swallow */ }
  }

  async listPending() {
    const { data, error } = await this.supabase.admin
      .from('developers')
      .select('*')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: true })
    if (error) throw error
    return data ?? []
  }

  async approve(id: string) {
    const { data: dev } = await this.supabase.admin
      .from('developers').select('*').eq('id', id).single()
    if (!dev) throw new NotFoundException('Developer not found')

    const { data, error } = await this.supabase.admin
      .from('developers')
      .update({
        verification_status: 'verified',
        verified_badge: true,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    await this.notify(dev.user_id, 'developer_approved', { developer_id: id })
    return data
  }

  async reject(id: string, dto: RejectDeveloperDto) {
    const { data: dev } = await this.supabase.admin
      .from('developers').select('*').eq('id', id).single()
    if (!dev) throw new NotFoundException('Developer not found')

    const { data, error } = await this.supabase.admin
      .from('developers')
      .update({
        verification_status: 'rejected',
        rejection_reason: dto.rejection_reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    await this.notify(dev.user_id, 'developer_rejected', { developer_id: id, reason: dto.rejection_reason })
    return data
  }

  async suspend(id: string) {
    const { data: dev } = await this.supabase.admin
      .from('developers').select('*').eq('id', id).single()
    if (!dev) throw new NotFoundException('Developer not found')

    const { data, error } = await this.supabase.admin
      .from('developers')
      .update({
        verification_status: 'suspended',
        suspended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    // Hide all projects
    await this.supabase.admin
      .from('projects')
      .update({ status: 'on_hold', updated_at: new Date().toISOString() })
      .eq('developer_id', id)

    // Notify developer
    await this.notify(dev.user_id, 'developer_suspended', { developer_id: id })

    // Notify connected brokers
    const { data: connections } = await this.supabase.admin
      .from('broker_connections')
      .select('broker_id')
      .eq('developer_id', id)
      .eq('status', 'active')

    for (const conn of connections ?? []) {
      await this.notify(conn.broker_id, 'developer_suspended', { developer_id: id })
    }

    return data
  }

  async listAll(filters?: { verification_status?: string; search?: string }) {
    let query = this.supabase.admin
      .from('developers')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.verification_status) {
      query = query.eq('verification_status', filters.verification_status)
    }
    if (filters?.search) {
      query = query.ilike('company_name', `%${filters.search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  }
}
