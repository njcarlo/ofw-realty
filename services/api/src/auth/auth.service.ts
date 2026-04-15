import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { RegisterDto, LoginDto } from './auth.dto'

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async register(dto: RegisterDto) {
    const { data, error } = await this.supabase.admin.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: false,
      user_metadata: {
        full_name: dto.fullName,
        role: dto.role,
      },
    })
    if (error) throw new UnauthorizedException(error.message)

    // Insert into users table with role
    await this.supabase.admin
      .from('users')
      .insert({
        id: data.user.id,
        email: dto.email,
        full_name: dto.fullName,
        role: dto.role,
      })

    return { message: 'Registration successful. Please verify your email.' }
  }

  async login(dto: LoginDto) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    })
    if (error) throw new UnauthorizedException('Invalid credentials')
    return { session: data.session, user: data.user }
  }

  async logout() {
    await this.supabase.client.auth.signOut()
    return { message: 'Logged out successfully' }
  }

  async validateToken(token: string) {
    const { data, error } = await this.supabase.admin.auth.getUser(token)
    if (error || !data.user) throw new UnauthorizedException('Invalid token')
    return data.user
  }
}
