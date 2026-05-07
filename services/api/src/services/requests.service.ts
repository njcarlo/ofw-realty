import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { CreateServiceRequestDto } from './dto/create-service-request.dto'
import { ServiceRequest } from './types/entities'

@Injectable()
export class RequestsService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Create a new service request.
   * Always sets status = 'open', generates unique id, sets expires_at = now() + 30 days.
   * Enforces other_description required when service_type = 'other'.
   */
  async create(dto: CreateServiceRequestDto, userId: string): Promise<ServiceRequest> {
    // Enforce: other_description required when service_type = 'other'
    if (dto.service_type === 'other') {
      if (!dto.other_description || dto.other_description.trim().length === 0) {
        throw new UnprocessableEntityException(
          'A description is required when service type is Other',
        )
      }
    }

    const { data, error } = await this.supabase.admin
      .from('service_requests')
      .insert({
        requester_id: userId,
        service_type: dto.service_type,
        other_description: dto.other_description ?? null,
        description: dto.description,
        province: dto.province,
        city: dto.city,
        barangay: dto.barangay ?? null,
        preferred_timeline: dto.preferred_timeline ?? null,
        budget_min_php: dto.budget_min_php ?? null,
        budget_max_php: dto.budget_max_php ?? null,
        status: 'open', // Always 'open' on creation
        proposal_count: 0,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        extension_granted: false,
      })
      .select()
      .single()

    if (error) throw error

    // Audit trail
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'service_request',
      entity_id: data.id,
      user_id: userId,
      action: 'created',
      metadata: { service_type: dto.service_type, province: dto.province, city: dto.city },
    })

    return data
  }

  /**
   * List open/in_progress service requests with optional filters.
   * Public endpoint — masks description and requester contact for unauthenticated callers.
   * Filters: service_type, province, city, date_from, date_to.
   */
  async findAll(
    query: {
      service_type?: string
      province?: string
      city?: string
      date_from?: string
      date_to?: string
    },
    isAuthenticated: boolean,
  ): Promise<ServiceRequest[]> {
    let q = this.supabase.client
      .from('service_requests')
      .select('*')
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(50)

    if (query.service_type) {
      q = q.eq('service_type', query.service_type)
    }
    if (query.province) {
      q = q.eq('province', query.province)
    }
    if (query.city) {
      q = q.eq('city', query.city)
    }
    if (query.date_from) {
      q = q.gte('created_at', query.date_from)
    }
    if (query.date_to) {
      q = q.lte('created_at', query.date_to)
    }

    const { data, error } = await q

    if (error) throw error

    if (!isAuthenticated) {
      return (data ?? []).map((req) => maskServiceRequest(req))
    }

    return data ?? []
  }

  /**
   * Get a single service request by ID.
   * Public endpoint — masks description and requester contact for unauthenticated callers.
   */
  async findOne(id: string, isAuthenticated: boolean): Promise<ServiceRequest> {
    const { data, error } = await this.supabase.client
      .from('service_requests')
      .select('*')
      .eq('id', id)
      .in('status', ['open', 'in_progress'])
      .single()

    if (error || !data) {
      throw new NotFoundException('Service request not found')
    }

    if (!isAuthenticated) {
      return maskServiceRequest(data)
    }

    return data
  }

  /**
   * Cancel a service request.
   * Only the owner can cancel, and only if no active engagement exists.
   */
  async cancel(id: string, userId: string): Promise<ServiceRequest> {
    // Fetch the request
    const { data: request, error: fetchError } = await this.supabase.admin
      .from('service_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !request) {
      throw new NotFoundException('Service request not found')
    }

    // Verify ownership
    if (request.requester_id !== userId) {
      throw new ForbiddenException('Forbidden')
    }

    // Check for active engagement
    const { data: activeEngagement } = await this.supabase.admin
      .from('engagements')
      .select('id')
      .eq('request_id', id)
      .eq('status', 'active')
      .maybeSingle()

    if (activeEngagement) {
      throw new UnprocessableEntityException(
        'Cannot cancel a request with an active engagement',
      )
    }

    const { data, error } = await this.supabase.admin
      .from('service_requests')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Audit trail
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'service_request',
      entity_id: id,
      user_id: userId,
      action: 'cancelled',
      metadata: {},
    })

    return data
  }

  /**
   * Extend a service request by 15 days.
   * Only the owner can extend.
   * Sets expires_at = expires_at + 15 days, sets extension_granted = true.
   */
  async extend(id: string, userId: string): Promise<ServiceRequest> {
    // Fetch the request
    const { data: request, error: fetchError } = await this.supabase.admin
      .from('service_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !request) {
      throw new NotFoundException('Service request not found')
    }

    // Verify ownership
    if (request.requester_id !== userId) {
      throw new ForbiddenException('Forbidden')
    }

    // Compute new expires_at = current expires_at + 15 days
    const currentExpiresAt = new Date(request.expires_at)
    const newExpiresAt = new Date(
      currentExpiresAt.getTime() + 15 * 24 * 60 * 60 * 1000,
    ).toISOString()

    const { data, error } = await this.supabase.admin
      .from('service_requests')
      .update({
        expires_at: newExpiresAt,
        extension_granted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Audit trail
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'service_request',
      entity_id: id,
      user_id: userId,
      action: 'extended',
      metadata: { new_expires_at: newExpiresAt },
    })

    return data
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Masks sensitive fields from a service request for unauthenticated callers.
 * Hides: description (replaced with null), requester_id contact info.
 * Shows: service_type, province, city, status, created_at, id, proposal_count,
 *        other_description, barangay, preferred_timeline, budget ranges, expires_at.
 */
function maskServiceRequest(req: ServiceRequest): ServiceRequest {
  return {
    ...req,
    description: null as unknown as string, // hide full description
    // requester_id is kept (it's a UUID, not contact info) but we don't expose
    // contact details since those live on the user/provider profile, not here
  }
}
