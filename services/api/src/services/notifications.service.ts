import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

export interface ServiceNotificationPayload {
  user_id: string
  type: string
  title: string
  body: string
  data?: Record<string, unknown>
}

/**
 * NotificationsService
 *
 * Centralised helper for creating in-app notification rows in the `notifications`
 * table for all Services Portal events.  Every call is wrapped in a try/catch so
 * that a notification failure never blocks the primary business operation.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly supabase: SupabaseService) {}

  // ─── Core helper ────────────────────────────────────────────────────────────

  /**
   * Insert a single notification row.  Swallows errors so callers are never
   * blocked by notification failures.
   */
  async notify(payload: ServiceNotificationPayload): Promise<void> {
    try {
      await this.supabase.admin.from('notifications').insert({
        user_id: payload.user_id,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data ?? null,
      })
    } catch {
      // Swallow — notification failures must not block primary operations
    }
  }

  /**
   * Insert multiple notification rows in a single batch.  Swallows errors.
   */
  async notifyMany(payloads: ServiceNotificationPayload[]): Promise<void> {
    if (payloads.length === 0) return
    try {
      await this.supabase.admin.from('notifications').insert(
        payloads.map((p) => ({
          user_id: p.user_id,
          type: p.type,
          title: p.title,
          body: p.body,
          data: p.data ?? null,
        })),
      )
    } catch {
      // Swallow — notification failures must not block primary operations
    }
  }

  // ─── Requirement 9.1 ────────────────────────────────────────────────────────

  /**
   * Notify a Requester that a new Proposal has been received on their
   * Service_Request.
   *
   * Validates: Requirements 9.1
   */
  async notifyNewProposalReceived(params: {
    requesterId: string
    requestId: string
    proposalId: string
    providerName?: string
  }): Promise<void> {
    await this.notify({
      user_id: params.requesterId,
      type: 'services_new_proposal',
      title: 'New proposal received',
      body: params.providerName
        ? `${params.providerName} submitted a proposal on your service request.`
        : 'A service provider submitted a proposal on your service request.',
      data: {
        request_id: params.requestId,
        proposal_id: params.proposalId,
      },
    })
  }

  // ─── Requirement 9.2 ────────────────────────────────────────────────────────

  /**
   * Notify a Service_Provider that their Proposal was accepted and an
   * Engagement has been created.
   *
   * Validates: Requirements 9.2
   */
  async notifyProposalAccepted(params: {
    providerUserId: string
    requestId: string
    proposalId: string
    engagementId: string
  }): Promise<void> {
    await this.notify({
      user_id: params.providerUserId,
      type: 'services_proposal_accepted',
      title: 'Your proposal was accepted',
      body: 'The requester accepted your proposal. An engagement has been created.',
      data: {
        request_id: params.requestId,
        proposal_id: params.proposalId,
        engagement_id: params.engagementId,
      },
    })
  }

  // ─── Requirement 9.3 ────────────────────────────────────────────────────────

  /**
   * Notify both parties when an Engagement status changes to 'completed' or
   * 'disputed'.
   *
   * Validates: Requirements 9.3
   */
  async notifyEngagementStatusChange(params: {
    requesterUserId: string
    providerUserId: string
    engagementId: string
    newStatus: 'completed' | 'disputed'
  }): Promise<void> {
    const isCompleted = params.newStatus === 'completed'

    const title = isCompleted ? 'Engagement completed' : 'Dispute raised on engagement'
    const body = isCompleted
      ? 'Your engagement has been marked as completed.'
      : 'A dispute has been raised on your engagement. An admin will review it.'

    await this.notifyMany([
      {
        user_id: params.requesterUserId,
        type: `services_engagement_${params.newStatus}`,
        title,
        body,
        data: { engagement_id: params.engagementId, new_status: params.newStatus },
      },
      {
        user_id: params.providerUserId,
        type: `services_engagement_${params.newStatus}`,
        title,
        body,
        data: { engagement_id: params.engagementId, new_status: params.newStatus },
      },
    ])
  }

  // ─── Requirement 9.4 ────────────────────────────────────────────────────────

  /**
   * Notify a Service_Provider that their Provider_Profile was approved or
   * rejected by an Admin.
   *
   * Validates: Requirements 9.4
   */
  async notifyProfileReviewed(params: {
    providerUserId: string
    profileId: string
    decision: 'approved' | 'rejected'
    rejectionReason?: string
  }): Promise<void> {
    const isApproved = params.decision === 'approved'

    await this.notify({
      user_id: params.providerUserId,
      type: isApproved ? 'services_profile_approved' : 'services_profile_rejected',
      title: isApproved ? 'Provider profile approved' : 'Provider profile rejected',
      body: isApproved
        ? 'Your provider profile has been approved. You can now submit proposals.'
        : `Your provider profile was rejected. Reason: ${params.rejectionReason ?? 'No reason provided'}. You may update and resubmit.`,
      data: {
        profile_id: params.profileId,
        decision: params.decision,
        ...(params.rejectionReason ? { rejection_reason: params.rejectionReason } : {}),
      },
    })
  }

  // ─── Requirement 9.5 ────────────────────────────────────────────────────────

  /**
   * Send a rating reminder to a Requester who has not submitted a Rating
   * within 7 days of Engagement completion.
   *
   * Validates: Requirements 9.5
   */
  async notifyRatingReminder(params: {
    requesterUserId: string
    engagementId: string
  }): Promise<void> {
    await this.notify({
      user_id: params.requesterUserId,
      type: 'services_rating_reminder',
      title: "Don't forget to rate your service provider",
      body: 'Your engagement was completed 7 days ago. Please submit a rating before the window closes.',
      data: { engagement_id: params.engagementId },
    })
  }

  // ─── Requirement 2.8 ────────────────────────────────────────────────────────

  /**
   * Notify a Requester that their Service_Request has expired with no proposals.
   *
   * Validates: Requirements 2.8
   */
  async notifyRequestExpired(requesterId: string, requestId: string): Promise<void> {
    await this.notify({
      user_id: requesterId,
      type: 'services_request_expired',
      title: 'Your service request has expired',
      body: 'Your service request received no proposals and has expired. You can post a new request anytime.',
      data: { request_id: requestId },
    })
  }

  // ─── Requirement 2.9 ────────────────────────────────────────────────────────

  /**
   * Notify a Requester that their Service_Request has expired but has pending
   * proposals — they can extend or close it.
   *
   * Validates: Requirements 2.9
   */
  async notifyStaleRequest(requesterId: string, requestId: string): Promise<void> {
    await this.notify({
      user_id: requesterId,
      type: 'services_request_stale',
      title: 'Your service request has expired with pending proposals',
      body: 'Your service request has expired but has pending proposals. You can extend the deadline or close the request.',
      data: { request_id: requestId },
    })
  }
}
