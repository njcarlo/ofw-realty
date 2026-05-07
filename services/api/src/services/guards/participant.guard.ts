import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { SupabaseService } from '../../supabase/supabase.service'

/**
 * ParticipantGuard — verifies the authenticated user is a participant in the
 * engagement identified by `request.params.id` (or `request.params.engagementId`).
 *
 * A participant is either:
 *   - the requester (engagements.requester_id === user.id), or
 *   - the provider (provider_profiles.user_id === user.id for the engagement's provider_id)
 *
 * Admin users bypass this check.
 */
@Injectable()
export class ParticipantGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user

    // Admin bypasses participant check
    const userRole = user?.user_metadata?.role
    if (userRole === 'admin') {
      request.isAdminBypass = true
      return true
    }

    // Support both :id and :engagementId route params
    const engagementId = request.params?.id ?? request.params?.engagementId
    if (!engagementId) return true // no engagement param, skip

    const { data: engagement, error } = await this.supabase.admin
      .from('engagements')
      .select('requester_id, provider_id')
      .eq('id', engagementId)
      .single()

    if (error || !engagement) {
      throw new NotFoundException('Engagement not found')
    }

    // Check if user is the requester
    if (engagement.requester_id === user.id) {
      request.participantRole = 'requester'
      return true
    }

    // Check if user is the provider (via provider_profiles.user_id)
    const { data: profile } = await this.supabase.admin
      .from('provider_profiles')
      .select('id')
      .eq('id', engagement.provider_id)
      .eq('user_id', user.id)
      .single()

    if (profile) {
      request.participantRole = 'provider'
      return true
    }

    throw new ForbiddenException('Forbidden')
  }
}
