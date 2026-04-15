import {
  Injectable, CanActivate, ExecutionContext, ForbiddenException
} from '@nestjs/common'

const MFA_REQUIRED_ROLES = ['realtor', 'broker_admin', 'admin']

@Injectable()
export class TwoFactorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest()
    const role = user?.user_metadata?.role
    const mfaVerified = user?.user_metadata?.mfa_verified

    if (MFA_REQUIRED_ROLES.includes(role) && !mfaVerified) {
      throw new ForbiddenException(
        '2FA verification required. Please complete two-factor authentication.'
      )
    }
    return true
  }
}
