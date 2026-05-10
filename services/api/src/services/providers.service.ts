import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Optional,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto'
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto'
import { UpdateAvailabilityDto } from './dto/update-availability.dto'
import { ProviderProfile } from './types/entities'
import { IPrcVerificationService } from './prc-verification.service'

@Injectable()
export class ProvidersService {
  constructor(
    private readonly supabase: SupabaseService,
    @Optional() private readonly prcVerification?: IPrcVerificationService,
  ) {}

  /**
   * Register as a service provider.
   * Always sets status = 'pending_review' regardless of input.
   * Calls PrcVerificationService if it exists (Task 5).
   */
  async create(
    dto: CreateProviderProfileDto,
    userId: string,
  ): Promise<ProviderProfile> {
    // Check if user already has a provider profile
    const { data: existing } = await this.supabase.admin
      .from('provider_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existing) {
      throw new BadRequestException('Provider profile already exists')
    }

    // Determine license verification status
    let licenseVerificationStatus = 'not_applicable'
    let prcLookupResult = null

    if (dto.license_number && dto.license_type === 'prc') {
      // Try to call PRC verification service (Task 5)
      // Gracefully skip if not injected
      if (this.prcVerification) {
        try {
          const result = await this.prcVerification.lookup(dto.license_number)
          if (result.found) {
            licenseVerificationStatus = 'verified'
            prcLookupResult = result
          } else {
            // Timeout or no-result: unverified_manual
            licenseVerificationStatus = 'unverified_manual'
            prcLookupResult = result
          }
        } catch {
          // HTTP error or network failure: failed
          licenseVerificationStatus = 'failed'
        }
      } else {
        // PRC service not yet available
        licenseVerificationStatus = 'unverified_manual'
      }
    }

    const { data, error } = await this.supabase.admin
      .from('provider_profiles')
      .insert({
        user_id: userId,
        full_name: dto.full_name,
        license_number: dto.license_number ?? null,
        license_type: dto.license_type ?? null,
        license_verification_status: licenseVerificationStatus,
        prc_lookup_result: prcLookupResult,
        service_types: dto.service_types,
        coverage_areas: dto.coverage_areas,
        bio: dto.bio ?? null,
        contact_phone: dto.contact_phone ?? null,
        contact_email: dto.contact_email ?? null,
        photo_url: dto.photo_url ?? null,
        status: 'pending_review', // Always pending_review on creation
        availability: 'available',
      })
      .select()
      .single()

    if (error) throw error

    // Audit trail
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'provider_profile',
      entity_id: data.id,
      user_id: userId,
      action: 'created',
      metadata: { service_types: dto.service_types },
    })

    return data
  }

  /**
   * List approved providers with filtering and sorting.
   * Public endpoint - masks contact info for unauthenticated users.
   */
  async findAll(
    query: {
      service_type?: string
      coverage_area?: string
      availability?: string
    },
    isAuthenticated: boolean,
  ): Promise<ProviderProfile[]> {
    let q = this.supabase.client
      .from('provider_profiles')
      .select('*')
      .eq('status', 'approved')
      .order('is_featured', { ascending: false })
      .order('avg_rating', { ascending: false, nullsFirst: false })
      .order('completed_engagements', { ascending: false })
      .limit(50)

    // Apply filters
    if (query.service_type) {
      q = q.contains('service_types', [query.service_type])
    }
    if (query.coverage_area) {
      q = q.contains('coverage_areas', [query.coverage_area])
    }
    if (query.availability) {
      q = q.eq('availability', query.availability)
    }

    const { data, error } = await q

    if (error) throw error

    // Mask contact info for unauthenticated users
    if (!isAuthenticated) {
      return data.map((profile) => ({
        ...profile,
        contact_phone: null,
        contact_email: null,
      }))
    }

    return data
  }

  /**
   * Get a single provider profile by ID.
   * Public endpoint - masks contact info for unauthenticated users.
   */
  async findOne(id: string, isAuthenticated: boolean): Promise<ProviderProfile> {
    const { data, error } = await this.supabase.client
      .from('provider_profiles')
      .select('*')
      .eq('id', id)
      .eq('status', 'approved')
      .single()

    if (error || !data) {
      throw new NotFoundException('Provider profile not found')
    }

    // Mask contact info for unauthenticated users
    if (!isAuthenticated) {
      return {
        ...data,
        contact_phone: null,
        contact_email: null,
      }
    }

    return data
  }

  /**
   * Update own provider profile.
   * If license_number or license_type changes, reset status to 'pending_review'.
   * Otherwise, preserve the current status.
   */
  async update(
    id: string,
    dto: UpdateProviderProfileDto,
    userId: string,
  ): Promise<ProviderProfile> {
    // Get existing profile
    const { data: existing, error: fetchError } = await this.supabase.admin
      .from('provider_profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      throw new NotFoundException('Provider profile not found')
    }

    // Verify ownership
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not your profile')
    }

    // Check if license credentials changed
    const licenseChanged =
      (dto.license_number !== undefined &&
        dto.license_number !== existing.license_number) ||
      (dto.license_type !== undefined &&
        dto.license_type !== existing.license_type)

    // Prepare update data
    const updateData: Record<string, any> = {
      ...dto,
      updated_at: new Date().toISOString(),
    }

    // If license changed, reset status to pending_review and re-verify
    if (licenseChanged) {
      updateData.status = 'pending_review'

      // Re-run PRC verification if applicable
      const newLicenseNumber = dto.license_number ?? existing.license_number
      const newLicenseType = dto.license_type ?? existing.license_type

      if (newLicenseNumber && newLicenseType === 'prc') {
        if (this.prcVerification) {
          try {
            const result = await this.prcVerification.lookup(newLicenseNumber)
            if (result.found) {
              updateData.license_verification_status = 'verified'
              updateData.prc_lookup_result = result as any
            } else {
              // Timeout or no-result: unverified_manual
              updateData.license_verification_status = 'unverified_manual'
              updateData.prc_lookup_result = result as any
            }
          } catch {
            // HTTP error or network failure: failed
            updateData.license_verification_status = 'failed'
          }
        } else {
          updateData.license_verification_status = 'unverified_manual'
        }
      } else {
        updateData.license_verification_status = 'not_applicable'
        updateData.prc_lookup_result = null
      }
    }

    const { data, error } = await this.supabase.admin
      .from('provider_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Audit trail
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'provider_profile',
      entity_id: id,
      user_id: userId,
      action: licenseChanged ? 'updated_credentials' : 'updated',
      metadata: { license_changed: licenseChanged, fields: Object.keys(dto) },
    })

    return data
  }

  /**
   * Update availability status (available/busy).
   * Does not trigger re-review.
   */
  async updateAvailability(
    id: string,
    dto: UpdateAvailabilityDto,
    userId: string,
  ): Promise<ProviderProfile> {
    // Get existing profile
    const { data: existing, error: fetchError } = await this.supabase.admin
      .from('provider_profiles')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      throw new NotFoundException('Provider profile not found')
    }

    // Verify ownership
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not your profile')
    }

    const { data, error } = await this.supabase.admin
      .from('provider_profiles')
      .update({
        availability: dto.availability,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return data
  }
}
