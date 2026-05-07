import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { NotificationsService } from './notifications.service'
import { CreateEngagementMessageDto } from './dto/create-engagement-message.dto'
import { Engagement, EngagementMessage } from './types/entities'

@Injectable()
export class EngagementsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * List all engagements where the user is a participant.
   *
   * A user is a participant if they are:
   * - The requester (engagements.requester_id === user.id), OR
   * - The provider (via provider_profiles.user_id === user.id)
   */
  async findAll(userId: string): Promise<Engagement[]> {
    // Get the user's provider profile ID if they have one
    const { data: providerProfile } = await this.supabase.admin
      .from('provider_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    // Build query to find engagements where user is requester OR provider
    let query = this.supabase.admin
      .from('engagements')
      .select('*')
      .order('created_at', { ascending: false })

    if (providerProfile) {
      // User has a provider profile, so they could be either requester or provider
      query = query.or(`requester_id.eq.${userId},provider_id.eq.${providerProfile.id}`)
    } else {
      // User doesn't have a provider profile, so they can only be a requester
      query = query.eq('requester_id', userId)
    }

    const { data, error } = await query

    if (error) throw error

    return data ?? []
  }

  /**
   * Get a single engagement by ID.
   * Access is controlled by ParticipantGuard.
   */
  async findOne(engagementId: string): Promise<Engagement> {
    const { data, error } = await this.supabase.admin
      .from('engagements')
      .select('*')
      .eq('id', engagementId)
      .single()

    if (error || !data) {
      throw new NotFoundException('Engagement not found')
    }

    return data
  }

  /**
   * Mark an engagement as completed by the current user.
   *
   * Business rules:
   * - If user is requester: set requester_completed_at = now()
   * - If user is provider: set provider_completed_at = now()
   * - If BOTH are now set: set status = 'completed', rating_window_closes_at = now() + 14 days
   */
  async complete(engagementId: string, userId: string, participantRole: string): Promise<Engagement> {
    // Fetch the engagement
    const { data: engagement, error } = await this.supabase.admin
      .from('engagements')
      .select('*')
      .eq('id', engagementId)
      .single()

    if (error || !engagement) {
      throw new NotFoundException('Engagement not found')
    }

    if (engagement.status !== 'active') {
      throw new UnprocessableEntityException('Can only complete an active engagement')
    }

    const now = new Date().toISOString()
    const updates: Record<string, any> = {
      updated_at: now,
    }

    // Set the appropriate completion timestamp based on participant role
    if (participantRole === 'requester') {
      if (engagement.requester_completed_at) {
        throw new UnprocessableEntityException('You have already marked this engagement as completed')
      }
      updates.requester_completed_at = now
    } else if (participantRole === 'provider') {
      if (engagement.provider_completed_at) {
        throw new UnprocessableEntityException('You have already marked this engagement as completed')
      }
      updates.provider_completed_at = now
    } else {
      throw new ForbiddenException('Invalid participant role')
    }

    // Check if both parties have now completed
    const requesterCompleted = participantRole === 'requester' ? now : engagement.requester_completed_at
    const providerCompleted = participantRole === 'provider' ? now : engagement.provider_completed_at

    if (requesterCompleted && providerCompleted) {
      // Both parties have completed, transition to completed status
      updates.status = 'completed'
      // Set rating window to close 14 days from now
      const ratingWindowClose = new Date()
      ratingWindowClose.setDate(ratingWindowClose.getDate() + 14)
      updates.rating_window_closes_at = ratingWindowClose.toISOString()
    }

    // Update the engagement
    const { data: updated, error: updateError } = await this.supabase.admin
      .from('engagements')
      .update(updates)
      .eq('id', engagementId)
      .select()
      .single()

    if (updateError) throw updateError

    // Audit trail
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'engagement',
      entity_id: engagementId,
      user_id: userId,
      action: updates.status === 'completed' ? 'completed' : 'marked_complete',
      metadata: {
        participant_role: participantRole,
        both_completed: !!updates.status,
      },
    })

    // Requirement 9.3: Notify both parties when engagement transitions to 'completed'
    if (updates.status === 'completed') {
      // Resolve the provider's user_id
      const { data: providerProfile } = await this.supabase.admin
        .from('provider_profiles')
        .select('user_id')
        .eq('id', engagement.provider_id)
        .single()

      if (providerProfile?.user_id) {
        await this.notifications.notifyEngagementStatusChange({
          requesterUserId: engagement.requester_id,
          providerUserId: providerProfile.user_id,
          engagementId,
          newStatus: 'completed',
        })
      }
    }

    return updated
  }

  /**
   * Raise a dispute on an engagement.
   *
   * Business rules:
   * - Only allowed if status = 'active'
   * - Set status = 'disputed'
   * - Set dispute_raised_by = user.id
   * - Set dispute_raised_at = now()
   */
  async dispute(engagementId: string, userId: string): Promise<Engagement> {
    // Fetch the engagement
    const { data: engagement, error } = await this.supabase.admin
      .from('engagements')
      .select('*')
      .eq('id', engagementId)
      .single()

    if (error || !engagement) {
      throw new NotFoundException('Engagement not found')
    }

    if (engagement.status !== 'active') {
      throw new UnprocessableEntityException('Can only dispute an active engagement')
    }

    const now = new Date().toISOString()

    // Update the engagement
    const { data: updated, error: updateError } = await this.supabase.admin
      .from('engagements')
      .update({
        status: 'disputed',
        dispute_raised_by: userId,
        dispute_raised_at: now,
        updated_at: now,
      })
      .eq('id', engagementId)
      .select()
      .single()

    if (updateError) throw updateError

    // Audit trail
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'engagement',
      entity_id: engagementId,
      user_id: userId,
      action: 'disputed',
      metadata: {
        dispute_raised_by: userId,
        dispute_raised_at: now,
      },
    })

    // Requirement 9.3: Notify both parties when engagement transitions to 'disputed'
    const { data: providerProfile } = await this.supabase.admin
      .from('provider_profiles')
      .select('user_id')
      .eq('id', engagement.provider_id)
      .single()

    if (providerProfile?.user_id) {
      await this.notifications.notifyEngagementStatusChange({
        requesterUserId: engagement.requester_id,
        providerUserId: providerProfile.user_id,
        engagementId,
        newStatus: 'disputed',
      })
    }

    return updated
  }

  /**
   * Post a message to an engagement thread.
   *
   * Business rules:
   * - Block if engagement status is not 'active' or 'disputed'
   * - Insert into engagement_messages
   */
  async createMessage(
    engagementId: string,
    dto: CreateEngagementMessageDto,
    userId: string,
  ): Promise<EngagementMessage> {
    // Fetch the engagement
    const { data: engagement, error } = await this.supabase.admin
      .from('engagements')
      .select('status')
      .eq('id', engagementId)
      .single()

    if (error || !engagement) {
      throw new NotFoundException('Engagement not found')
    }

    if (engagement.status !== 'active' && engagement.status !== 'disputed') {
      throw new UnprocessableEntityException(
        'Can only post messages to active or disputed engagements',
      )
    }

    // Insert the message
    const { data: message, error: insertError } = await this.supabase.admin
      .from('engagement_messages')
      .insert({
        engagement_id: engagementId,
        sender_id: userId,
        content: dto.content,
      })
      .select()
      .single()

    if (insertError) throw insertError

    return message
  }

  /**
   * Get all messages for an engagement thread.
   * Access is controlled by ParticipantGuard.
   * Messages are ordered by created_at ASC.
   */
  async getMessages(engagementId: string): Promise<EngagementMessage[]> {
    const { data, error } = await this.supabase.admin
      .from('engagement_messages')
      .select('*')
      .eq('engagement_id', engagementId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return data ?? []
  }
}
