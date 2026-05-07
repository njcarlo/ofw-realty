import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { SupabaseService } from '../supabase/supabase.service'
import { NotificationsService } from './notifications.service'

/**
 * ServicesScheduler
 *
 * Cron jobs for the LUPA PH Services Portal.
 * All schedules are expressed in UTC; PHT = UTC+8.
 *
 * | Job                      | PHT   | UTC   | Cron (UTC)    |
 * |--------------------------|-------|-------|---------------|
 * | expireFeaturedProviders  | 01:00 | 17:00 | 0 17 * * *    |
 * | expireOpenRequests       | 02:00 | 18:00 | 0 18 * * *    |
 * | notifyStaleRequests      | 02:00 | 18:00 | 0 18 * * *    |
 * | autoCompleteEngagements  | 03:00 | 19:00 | 0 19 * * *    |
 * | closeRatingWindows       | 03:00 | 19:00 | 0 19 * * *    |
 *
 * Requirements: 2.8, 2.9, 5.4, 6.7, 11.5
 */
@Injectable()
export class ServicesScheduler {
  private readonly logger = new Logger(ServicesScheduler.name)

  constructor(
    private readonly supabase: SupabaseService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── 1. Expire open requests with 0 proposals ───────────────────────────────
  // Daily 02:00 PHT = 18:00 UTC
  // Requirement 2.8: open requests with proposal_count = 0 and expires_at < now()
  // → set status = 'expired', notify requester
  @Cron('0 18 * * *', { name: 'expireOpenRequests', timeZone: 'UTC' })
  async expireOpenRequests(): Promise<void> {
    try {
      const { data: requests, error } = await this.supabase.admin
        .from('service_requests')
        .select('id, requester_id')
        .eq('status', 'open')
        .eq('proposal_count', 0)
        .lt('expires_at', new Date().toISOString())

      if (error) throw error
      if (!requests || requests.length === 0) return

      for (const request of requests) {
        try {
          const { error: updateError } = await this.supabase.admin
            .from('service_requests')
            .update({ status: 'expired', updated_at: new Date().toISOString() })
            .eq('id', request.id)

          if (updateError) throw updateError

          await this.notifications.notifyRequestExpired(request.requester_id, request.id)
        } catch (itemErr) {
          await this.logCronError('expireOpenRequests', itemErr, { request_id: request.id })
        }
      }
    } catch (err) {
      await this.logCronError('expireOpenRequests', err)
    }
  }

  // ─── 2. Notify stale requests with proposals ────────────────────────────────
  // Daily 02:00 PHT = 18:00 UTC
  // Requirement 2.9: open requests with proposal_count > 0 and expires_at < now()
  // → notify requester, offer extend/close
  @Cron('0 18 * * *', { name: 'notifyStaleRequests', timeZone: 'UTC' })
  async notifyStaleRequests(): Promise<void> {
    try {
      const { data: requests, error } = await this.supabase.admin
        .from('service_requests')
        .select('id, requester_id, proposal_count')
        .eq('status', 'open')
        .gt('proposal_count', 0)
        .lt('expires_at', new Date().toISOString())

      if (error) throw error
      if (!requests || requests.length === 0) return

      for (const request of requests) {
        try {
          await this.notifications.notifyStaleRequest(request.requester_id, request.id)
        } catch (itemErr) {
          await this.logCronError('notifyStaleRequests', itemErr, { request_id: request.id })
        }
      }
    } catch (err) {
      await this.logCronError('notifyStaleRequests', err)
    }
  }

  // ─── 3. Auto-complete one-sided engagements after 7 days ────────────────────
  // Daily 03:00 PHT = 19:00 UTC
  // Requirement 5.4: one-sided completion where the marked timestamp is > 7 days ago
  // → set status = 'completed', auto_completed_at = now(), rating_window_closes_at = now() + 14 days
  @Cron('0 19 * * *', { name: 'autoCompleteEngagements', timeZone: 'UTC' })
  async autoCompleteEngagements(): Promise<void> {
    try {
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

      // Fetch engagements where only one party has marked completion and it was > 7 days ago
      const { data: engagements, error } = await this.supabase.admin
        .from('engagements')
        .select('id, requester_id, provider_id, requester_completed_at, provider_completed_at')
        .eq('status', 'active')
        .or(
          `and(requester_completed_at.not.is.null,provider_completed_at.is.null,requester_completed_at.lt.${sevenDaysAgo}),` +
          `and(provider_completed_at.not.is.null,requester_completed_at.is.null,provider_completed_at.lt.${sevenDaysAgo})`,
        )

      if (error) throw error
      if (!engagements || engagements.length === 0) return

      const autoCompletedAt = now.toISOString()
      const ratingWindowClosesAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()

      for (const engagement of engagements) {
        try {
          const { error: updateError } = await this.supabase.admin
            .from('engagements')
            .update({
              status: 'completed',
              auto_completed_at: autoCompletedAt,
              rating_window_closes_at: ratingWindowClosesAt,
              updated_at: autoCompletedAt,
            })
            .eq('id', engagement.id)

          if (updateError) throw updateError

          // Notify both parties of completion
          await this.notifications.notifyEngagementStatusChange({
            requesterUserId: engagement.requester_id,
            providerUserId: engagement.provider_id,
            engagementId: engagement.id,
            newStatus: 'completed',
          })

          // Prompt requester to rate
          await this.notifications.notifyRatingReminder({
            requesterUserId: engagement.requester_id,
            engagementId: engagement.id,
          })
        } catch (itemErr) {
          await this.logCronError('autoCompleteEngagements', itemErr, {
            engagement_id: engagement.id,
          })
        }
      }
    } catch (err) {
      await this.logCronError('autoCompleteEngagements', err)
    }
  }

  // ─── 4. Close expired rating windows ────────────────────────────────────────
  // Daily 03:00 PHT = 19:00 UTC
  // Requirement 6.7: rating_window_closes_at < now() and no rating submitted
  // → mark window closed (set rating_window_closed = true if column exists, else log/audit)
  @Cron('0 19 * * *', { name: 'closeRatingWindows', timeZone: 'UTC' })
  async closeRatingWindows(): Promise<void> {
    try {
      const now = new Date().toISOString()

      // Find completed engagements whose rating window has expired
      const { data: engagements, error } = await this.supabase.admin
        .from('engagements')
        .select('id, requester_id')
        .eq('status', 'completed')
        .lt('rating_window_closes_at', now)
        .not('rating_window_closes_at', 'is', null)

      if (error) throw error
      if (!engagements || engagements.length === 0) return

      for (const engagement of engagements) {
        try {
          // Check if a rating has already been submitted for this engagement
          const { data: existingRating, error: ratingError } = await this.supabase.admin
            .from('ratings')
            .select('id')
            .eq('engagement_id', engagement.id)
            .maybeSingle()

          if (ratingError) throw ratingError

          // If no rating was submitted, log to audit trail that the window has closed
          if (!existingRating) {
            await this.supabase.admin.from('audit_trail').insert({
              entity_type: 'rating_window_closed',
              entity_id: engagement.id,
              action: 'rating_window_expired',
              metadata: {
                engagement_id: engagement.id,
                requester_id: engagement.requester_id,
                closed_at: now,
              },
              created_at: now,
            })
          }
        } catch (itemErr) {
          await this.logCronError('closeRatingWindows', itemErr, {
            engagement_id: engagement.id,
          })
        }
      }
    } catch (err) {
      await this.logCronError('closeRatingWindows', err)
    }
  }

  // ─── 5. Expire featured providers ───────────────────────────────────────────
  // Daily 01:00 PHT = 17:00 UTC
  // Requirement 11.5: featured_until < now() → is_featured = false, featured_until = null
  @Cron('0 17 * * *', { name: 'expireFeaturedProviders', timeZone: 'UTC' })
  async expireFeaturedProviders(): Promise<void> {
    try {
      const now = new Date().toISOString()

      const { data: providers, error } = await this.supabase.admin
        .from('provider_profiles')
        .select('id')
        .eq('is_featured', true)
        .lt('featured_until', now)
        .not('featured_until', 'is', null)

      if (error) throw error
      if (!providers || providers.length === 0) return

      for (const provider of providers) {
        try {
          const { error: updateError } = await this.supabase.admin
            .from('provider_profiles')
            .update({
              is_featured: false,
              featured_until: null,
              updated_at: now,
            })
            .eq('id', provider.id)

          if (updateError) throw updateError
        } catch (itemErr) {
          await this.logCronError('expireFeaturedProviders', itemErr, {
            provider_id: provider.id,
          })
        }
      }
    } catch (err) {
      await this.logCronError('expireFeaturedProviders', err)
    }
  }

  // ─── Error logging helper ────────────────────────────────────────────────────

  /**
   * Log a cron job failure to the audit_trail table.
   * Swallows secondary errors so a logging failure never masks the original.
   */
  private async logCronError(
    jobName: string,
    err: unknown,
    context?: Record<string, unknown>,
  ): Promise<void> {
    const message = err instanceof Error ? err.message : String(err)
    this.logger.error(`[${jobName}] ${message}`, err instanceof Error ? err.stack : undefined)

    try {
      await this.supabase.admin.from('audit_trail').insert({
        entity_type: 'cron_error',
        entity_id: null,
        action: jobName,
        metadata: {
          error: message,
          ...(context ?? {}),
        },
        created_at: new Date().toISOString(),
      })
    } catch {
      // Swallow — logging failure must not propagate
    }
  }
}
