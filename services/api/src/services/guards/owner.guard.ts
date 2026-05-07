import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  SetMetadata,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { SupabaseService } from '../../supabase/supabase.service'

/**
 * Decorator to specify which resource table and foreign-key column to check.
 *
 * Usage:
 *   @UseGuards(JwtGuard, OwnerGuard)
 *   @OwnerResource('provider_profiles', 'user_id')
 *   @Patch(':id')
 *   update(...) {}
 *
 * The guard reads `request.params.id` (or the param name specified as the
 * third argument) and verifies that the row's `ownerColumn` equals the
 * authenticated user's id.
 */
export const OWNER_RESOURCE_KEY = 'ownerResource'
export const OwnerResource = (
  table: string,
  ownerColumn: string,
  paramName = 'id',
) => SetMetadata(OWNER_RESOURCE_KEY, { table, ownerColumn, paramName })

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.getAllAndOverride<{
      table: string
      ownerColumn: string
      paramName: string
    }>(OWNER_RESOURCE_KEY, [context.getHandler(), context.getClass()])

    // If no metadata is set, skip the guard (allow through)
    if (!meta) return true

    const request = context.switchToHttp().getRequest()
    const user = request.user

    // Admin bypasses ownership check
    const userRole = user?.user_metadata?.role
    if (userRole === 'admin') {
      request.isAdminBypass = true
      return true
    }

    const resourceId = request.params?.[meta.paramName]
    if (!resourceId) return true // no param, skip

    const { data, error } = await this.supabase.admin
      .from(meta.table)
      .select(meta.ownerColumn)
      .eq('id', resourceId)
      .single()

    if (error || !data) {
      throw new NotFoundException('Resource not found')
    }

    // For provider_profiles the owner column is user_id (direct user reference).
    // For service_requests the owner column is requester_id.
    // For proposals the owner column is provider_id which references provider_profiles.id,
    // so we need to resolve the provider profile's user_id.
    if (meta.table === 'proposals' && meta.ownerColumn === 'provider_id') {
    const providerId = (data as unknown as Record<string, unknown>)[meta.ownerColumn]
      const { data: profile } = await this.supabase.admin
        .from('provider_profiles')
        .select('user_id')
        .eq('id', providerId)
        .single()

      if (!profile || profile.user_id !== user.id) {
        throw new ForbiddenException('Forbidden')
      }
      return true
    }

    const ownerId = (data as unknown as Record<string, unknown>)[meta.ownerColumn]
    if (ownerId !== user.id) {
      throw new ForbiddenException('Forbidden')
    }

    return true
  }
}
