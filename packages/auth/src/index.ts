import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js'

export function createSupabaseClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function createSupabaseServerClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type UserRole = 'buyer' | 'seller' | 'realtor' | 'broker_admin' | 'admin'

export interface AuthUser extends User {
  user_metadata: {
    role: UserRole
    full_name: string
    mfa_verified?: boolean
  }
}

export function getRoleFromUser(user: User | null): UserRole | null {
  return (user?.user_metadata?.role as UserRole) ?? null
}

export function isMFARequired(role: UserRole): boolean {
  return ['realtor', 'broker_admin', 'admin'].includes(role)
}
