import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { NotificationsService } from './notifications.service'

/**
 * ServicesAdminService
 *
 * Admin moderation operations for the Services Portal.
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 11.1, 11.4
 */
@Injectable()
export class ServicesAdminService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Requirement 8.2 ────────────────────────────────────────────────────────

  /**
   * List provider profiles with status = 'pending_review'.
   * Requirement 8.2: Admin interface displays pending profiles in a queue.
   */
  async listPendingProfiles(): Promise<unknown[]> {
    const { data, error } = await this.supabase.admin
      .from('provider_profiles')
      .select('*')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch pending profiles: ${error.message}`)
    }

    return data ?? []
  }

  // ─── Requirement 8.3 ────────────────────────────────────────────────────────

  /**
   * Approve a provider profile.
   *
   * Requirement 9.4: Notify the provider when their profile is approved.
   */
  async approveProfile(profileId: string, adminUserId: string): Promise<void> {
    const { data: profile, error } = await this.supabase.admin
      .from('provider_profiles')
      .select('id, user_id, status')
      .eq('id', profileId)
      .single()

    if (error || !profile) {
      throw new NotFoundException('Provider profile not found')
    }

    if (profile.status === 'approved') {
      // Already approved, no-op
      return
    }

    await this.supabase.admin
      .from('provider_profiles')
      .update({
        status: 'approved',
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)

    // Audit trail
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'provider_profile',
      entity_id: profileId,
      user_id: adminUserId,
      action: 'approved',
      metadata: { profile_id: profileId },
    })

    // Requirement 9.4: Notify the provider
    await this.notifications.notifyProfileReviewed({
      providerUserId: profile.user_id,
      profileId,
      decision: 'approved',
    })
  }

  /**
   * Reject a provider profile.
   *
   * Requirement 8.3: Rejection requires a non-empty reason.
   * Requirement 8.4: Notify provider with rejection reason; allow resubmission
   *   by setting status to 'pending_review' (so they can update and resubmit).
   * Requirement 9.4: Notify the provider when their profile is rejected.
   */
  async rejectProfile(
    profileId: string,
    adminUserId: string,
    reason: string,
  ): Promise<void> {
    if (!reason || reason.trim().length === 0) {
      throw new UnprocessableEntityException('Rejection reason is required')
    }

    const { data: profile, error } = await this.supabase.admin
      .from('provider_profiles')
      .select('id, user_id, status')
      .eq('id', profileId)
      .single()

    if (error || !profile) {
      throw new NotFoundException('Provider profile not found')
    }

    // Set status to 'rejected' but allow resubmission — the provider can update
    // their profile and resubmit, which will reset status to 'pending_review'.
    await this.supabase.admin
      .from('provider_profiles')
      .update({
        status: 'rejected',
        rejection_reason: reason.trim(),
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)

    // Audit trail
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'provider_profile',
      entity_id: profileId,
      user_id: adminUserId,
      action: 'rejected',
      metadata: { profile_id: profileId, reason: reason.trim() },
    })

    // Requirement 9.4: Notify the provider
    await this.notifications.notifyProfileReviewed({
      providerUserId: profile.user_id,
      profileId,
      decision: 'rejected',
      rejectionReason: reason.trim(),
    })
  }

  // ─── Requirement 8.5 ────────────────────────────────────────────────────────

  /**
   * Delete (remove) a provider profile that violates platform policies.
   * Requirement 8.5: Admin can remove any Provider_Profile.
   */
  async deleteProfile(profileId: string, adminUserId: string): Promise<void> {
    const { data: profile, error } = await this.supabase.admin
      .from('provider_profiles')
      .select('id')
      .eq('id', profileId)
      .single()

    if (error || !profile) {
      throw new NotFoundException('Provider profile not found')
    }

    await this.supabase.admin
      .from('provider_profiles')
      .delete()
      .eq('id', profileId)

    // Audit trail
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'provider_profile',
      entity_id: profileId,
      user_id: adminUserId,
      action: 'deleted',
      metadata: { profile_id: profileId },
    })
  }

  /**
   * Delete (remove) a service request that violates platform policies.
   * Requirement 8.5: Admin can remove any Service_Request.
   */
  async deleteRequest(requestId: string, adminUserId: string): Promise<void> {
    const { data: request, error } = await this.supabase.admin
      .from('service_requests')
      .select('id')
      .eq('id', requestId)
      .single()

    if (error || !request) {
      throw new NotFoundException('Service request not found')
    }

    await this.supabase.admin
      .from('service_requests')
      .delete()
      .eq('id', requestId)

    // Audit trail
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'service_request',
      entity_id: requestId,
      user_id: adminUserId,
      action: 'deleted',
      metadata: { request_id: requestId },
    })
  }

  // ─── Requirement 8.6 ────────────────────────────────────────────────────────

  /**
   * List engagements with status = 'disputed'.
   * Requirement 8.6: Admin interface displays disputed engagements in a queue.
   */
  async listDisputedEngagements(): Promise<unknown[]> {
    const { data, error } = await this.supabase.admin
      .from('engagements')
      .select('*')
      .eq('status', 'disputed')
      .order('dispute_raised_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch disputed engagements: ${error.message}`)
    }

    return data ?? []
  }

  // ─── Requirement 8.7 ────────────────────────────────────────────────────────

  /**
   * Resolve a disputed engagement.
   *
   * Requirement 8.7: Admin can resolve a dispute with a required resolution note.
   * Sets engagement status to 'completed' or 'cancelled'.
   */
  async resolveDispute(
    engagementId: string,
    adminUserId: string,
    resolutionNote: string,
    outcome: 'completed' | 'cancelled',
  ): Promise<void> {
    if (!resolutionNote || resolutionNote.trim().length === 0) {
      throw new UnprocessableEntityException('A resolution note is required')
    }

    const { data: engagement, error } = await this.supabase.admin
      .from('engagements')
      .select('id, requester_id, provider_id, status')
      .eq('id', engagementId)
      .single()

    if (error || !engagement) {
      throw new NotFoundException('Engagement not found')
    }

    if (engagement.status !== 'disputed') {
      throw new UnprocessableEntityException(
        'Only disputed engagements can be resolved',
      )
    }

    const now = new Date().toISOString()

    await this.supabase.admin
      .from('engagements')
      .update({
        status: outcome,
        resolution_note: resolutionNote.trim(),
        resolved_by: adminUserId,
        resolved_at: now,
        // If resolving to completed, set rating window
        ...(outcome === 'completed'
          ? {
              rating_window_closes_at: new Date(
                Date.now() + 14 * 24 * 60 * 60 * 1000,
              ).toISOString(),
            }
          : {}),
        updated_at: now,
      })
      .eq('id', engagementId)

    // Audit trail
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'engagement',
      entity_id: engagementId,
      user_id: adminUserId,
      action: 'dispute_resolved',
      metadata: {
        engagement_id: engagementId,
        outcome,
        resolution_note: resolutionNote.trim(),
      },
    })

    // Notify both parties of the resolution
    await this.notifications.notifyEngagementStatusChange({
      requesterUserId: engagement.requester_id,
      providerUserId: engagement.provider_id,
      engagementId,
      newStatus: outcome as 'completed' | 'disputed',
    })
  }

  // ─── Requirement 11.1, 11.4 ─────────────────────────────────────────────────

  /**
   * Grant or revoke featured status for a provider profile.
   *
   * Requirement 11.1: Featured status can be granted by an Admin.
   * Requirement 11.4: Admin can grant or revoke Featured_Provider status.
   *
   * On grant: set is_featured = true and featured_until (if provided).
   * On revoke: set is_featured = false and featured_until = null.
   */
  async setFeaturedStatus(
    profileId: string,
    adminUserId: string,
    grant: boolean,
    featuredUntil?: string,
  ): Promise<void> {
    const { data: profile, error } = await this.supabase.admin
      .from('provider_profiles')
      .select('id, status')
      .eq('id', profileId)
      .single()

    if (error || !profile) {
      throw new NotFoundException('Provider profile not found')
    }

    if (grant) {
      await this.supabase.admin
        .from('provider_profiles')
        .update({
          is_featured: true,
          featured_until: featuredUntil ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId)
    } else {
      await this.supabase.admin
        .from('provider_profiles')
        .update({
          is_featured: false,
          featured_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId)
    }

    // Audit trail
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'provider_profile',
      entity_id: profileId,
      user_id: adminUserId,
      action: grant ? 'featured_granted' : 'featured_revoked',
      metadata: {
        profile_id: profileId,
        grant,
        featured_until: featuredUntil ?? null,
      },
    })
  }
}
