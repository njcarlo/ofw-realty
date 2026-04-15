import {
  Injectable, CanActivate, ExecutionContext,
  UnauthorizedException
} from '@nestjs/common'
import { AuthService } from './auth.service'

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization token')
    }
    const token = authHeader.split(' ')[1]
    const user = await this.authService.validateToken(token)
    request.user = user
    return true
  }
}
