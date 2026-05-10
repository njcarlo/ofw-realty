import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { SupabaseService } from '../../supabase/supabase.service'

@Injectable()
export class ParticipantGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user
    const roomId = request.params?.id

    if (!roomId) return true // no room param, skip

    // Admin bypasses participant check but we still log (handled in service)
    const userRole = user?.user_metadata?.role
    if (userRole === 'admin') {
      request.isAdminBypass = true
      return true
    }

    // Check suspended status
    const { data: profile } = await this.supabase.admin
      .from('users')
      .select('status')
      .eq('id', user.id)
      .single()

    if (profile?.status === 'suspended') {
      throw new ForbiddenException('Account suspended')
    }

    // Check room membership
    const { data: participant } = await this.supabase.admin
      .from('negotiation_room_participants')
      .select('id, role')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single()

    if (!participant) {
      throw new ForbiddenException('Forbidden')
    }

    request.participantRole = participant.role
    return true
  }
}
