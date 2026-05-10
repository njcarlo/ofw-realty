import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

export const ROOM_ROLES_KEY = 'roomRoles'
export const RoomRoles = (...roles: string[]) => SetMetadata(ROOM_ROLES_KEY, roles)

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROOM_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredRoles || requiredRoles.length === 0) return true

    const request = context.switchToHttp().getRequest()

    // Admin bypass
    if (request.isAdminBypass) return true

    const participantRole: string = request.participantRole
    if (!participantRole || !requiredRoles.includes(participantRole)) {
      throw new ForbiddenException(
        `Forbidden: only ${requiredRoles.join(' or ')} may perform this action`,
      )
    }
    return true
  }
}
