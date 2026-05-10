import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { ConnectionRequestDto } from './dto/connection-request.dto'

@Injectable()
export class BrokerConnectionsService {
  constructor(private readonly supabase: SupabaseService) {}

  private async notify(userId: string, type: string, payload: Record<string, unknown>) {
    try {
      await this.supabase.admin.from('notifications').insert({ user_id: userId, type, payload, read: false })
    } catch { /* swallow */ }
  }

  async sendRequest(userId: string, dto: ConnectionRequestDto) {
    let developerId: string
    let brokerId: string

    if (dto.initiated_by === 'developer') {
      const { data: dev } = await this.supabase.admin
        .from('developers').select('id').eq('user_id', userId).single()
      if (!dev) throw new NotFoundException('Developer profile not found')
      developerId = dev.id
      brokerId = dto.target_id
    } else {
      const { data: broker } = await this.supabase.admin
        .from('broker_companies').select('id').eq('id', dto.target_id).single()
      if (!broker) throw new NotFoundException('Developer not found')
      developerId = dto.target_id
      const { data: bc } = await this.supabase.admin
        .from('broker_companies').select('id').eq('id', userId).single()
      brokerId = bc?.id ?? userId
    }

    // Check for existing connection
    const { data: existing } = await this.supabase.admin
      .from('broker_connections')
      .select('id, status')
      .eq('developer_id', developerId)
      .eq('broker_id', brokerId)
      .maybeSingle()

    if (existing) throw new ConflictException({ code: 'connection_already_exists' })

    const { data, error } = await this.supabase.admin
      .from('broker_connections')
      .insert({ developer_id: developerId, broker_id: brokerId, initiated_by: dto.initiated_by, status: 'pending' })
      .select()
      .single()
    if (error) throw error

    // Notify recipient
    const recipientId = dto.initiated_by === 'developer' ? brokerId : developerId
    await this.notify(recipientId, 'connection_request_received', { connection_id: data.id })

    return data
  }

  async accept(userId: string, connectionId: string) {
    const { data: conn } = await this.supabase.admin
      .from('broker_connections').select('*').eq('id', connectionId).single()
    if (!conn) throw new NotFoundException('Connection not found')

    const { data, error } = await this.supabase.admin
      .from('broker_connections')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', connectionId)
      .select()
      .single()
    if (error) throw error

    await this.notify(conn.developer_id, 'connection_accepted', { connection_id: connectionId })
    return data
  }

  async decline(userId: string, connectionId: string) {
    const { data: conn } = await this.supabase.admin
      .from('broker_connections').select('*').eq('id', connectionId).single()
    if (!conn) throw new NotFoundException('Connection not found')

    const { data, error } = await this.supabase.admin
      .from('broker_connections')
      .update({ status: 'declined', declined_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', connectionId)
      .select()
      .single()
    if (error) throw error

    const requesterId = conn.initiated_by === 'developer' ? conn.developer_id : conn.broker_id
    await this.notify(requesterId, 'connection_declined', { connection_id: connectionId })
    return data
  }

  async terminate(userId: string, connectionId: string) {
    const { data: conn } = await this.supabase.admin
      .from('broker_connections').select('*').eq('id', connectionId).single()
    if (!conn) throw new NotFoundException('Connection not found')

    // Check for open reservations
    const { count } = await this.supabase.admin
      .from('reservation_requests')
      .select('id', { count: 'exact', head: true })
      .eq('connection_id', connectionId)
      .eq('status', 'pending')
    if ((count ?? 0) > 0) {
      throw new UnprocessableEntityException('Resolve open reservations before terminating connection')
    }

    // Determine who is terminating
    const { data: dev } = await this.supabase.admin
      .from('developers').select('id').eq('user_id', userId).single()
    const terminatedBy = dev ? 'developer' : 'broker'

    const { data, error } = await this.supabase.admin
      .from('broker_connections')
      .update({
        status: 'terminated',
        terminated_at: new Date().toISOString(),
        terminated_by: terminatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId)
      .select()
      .single()
    if (error) throw error

    const otherPartyId = terminatedBy === 'developer' ? conn.broker_id : conn.developer_id
    await this.notify(otherPartyId, 'connection_terminated', { connection_id: connectionId })
    return data
  }

  async listConnections(userId: string) {
    const { data: dev } = await this.supabase.admin
      .from('developers').select('id').eq('user_id', userId).single()

    let query = this.supabase.admin
      .from('broker_connections')
      .select(`
        *,
        broker:broker_companies(id, name),
        developer:developers(id, company_name)
      `)
      .order('created_at', { ascending: false })

    if (dev) {
      query = query.eq('developer_id', dev.id)
    } else {
      query = query.eq('broker_id', userId)
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  }

  async listDevelopers(filters?: { project_type?: string; province?: string; city?: string }) {
    let query = this.supabase.admin
      .from('developers')
      .select('id, company_name, logo_url, description, verified_badge, verification_status, projects(id, name, project_type, province, city, status)')
      .eq('verification_status', 'verified')

    const { data, error } = await query
    if (error) throw error

    let results = data ?? []
    if (filters?.project_type) {
      results = results.filter((d: any) =>
        d.projects?.some((p: any) => p.project_type === filters.project_type),
      )
    }
    if (filters?.province) {
      results = results.filter((d: any) =>
        d.projects?.some((p: any) => p.province === filters.province),
      )
    }
    if (filters?.city) {
      results = results.filter((d: any) =>
        d.projects?.some((p: any) => p.city === filters.city),
      )
    }
    return results
  }

  async listBrokers(filters?: { province?: string; city?: string; verified?: string }) {
    let query = this.supabase.admin
      .from('broker_companies')
      .select('id, name, logo_url, province, city, verified')

    if (filters?.province) query = query.eq('province', filters.province)
    if (filters?.city) query = query.eq('city', filters.city)
    if (filters?.verified) query = query.eq('verified', filters.verified === 'true')

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  }
}
