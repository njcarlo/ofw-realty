import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { RegisterDeveloperDto } from './dto/register-developer.dto'
import { UpdateDeveloperDto } from './dto/update-developer.dto'

@Injectable()
export class DevelopersService {
  constructor(private readonly supabase: SupabaseService) {}

  async register(dto: RegisterDeveloperDto) {
    // Check for duplicate email
    const { data: existing } = await this.supabase.admin.auth.admin.listUsers()
    const dup = existing?.users?.find((u) => u.email === dto.email)
    if (dup) throw new ConflictException({ code: 'email_already_registered' })

    // Create Supabase auth user with developer role
    const { data: authData, error: authErr } = await this.supabase.admin.auth.admin.createUser({
      email: dto.email,
      email_confirm: false,
      user_metadata: { role: 'developer', phone: dto.phone },
    })
    if (authErr || !authData.user) throw authErr ?? new Error('Failed to create user')

    const userId = authData.user.id

    // Insert users row
    await this.supabase.admin.from('users').insert({
      id: userId,
      email: dto.email,
      full_name: dto.primary_contact,
      role: 'developer',
    })

    // Insert developer record
    const { data: developer, error: devErr } = await this.supabase.admin
      .from('developers')
      .insert({
        user_id: userId,
        company_name: dto.company_name,
        company_type: dto.company_type,
        primary_contact: dto.primary_contact,
        verification_status: 'pending',
      })
      .select()
      .single()

    if (devErr || !developer) throw devErr ?? new Error('Failed to create developer')

    // Send email verification via magic link
    await this.supabase.admin.auth.admin.generateLink({
      type: 'magiclink',
      email: dto.email,
    })

    return { id: developer.id, status: 'pending', message: 'Verification email sent' }
  }

  async verifyEmail(token: string) {
    const { data, error } = await this.supabase.admin.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    })
    if (error) throw new UnprocessableEntityException('Invalid or expired verification token')
    return { verified: true, user: data.user }
  }

  async getMe(userId: string) {
    const { data, error } = await this.supabase.admin
      .from('developers')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error || !data) throw new NotFoundException('Developer profile not found')
    return data
  }

  async updateMe(userId: string, dto: UpdateDeveloperDto) {
    const { data: dev } = await this.supabase.admin
      .from('developers')
      .select('id')
      .eq('user_id', userId)
      .single()
    if (!dev) throw new NotFoundException('Developer profile not found')

    const { data, error } = await this.supabase.admin
      .from('developers')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', dev.id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async getPublicProfile(id: string) {
    const { data, error } = await this.supabase.admin
      .from('developers')
      .select(`
        id, company_name, company_type, logo_url, cover_url, description,
        office_address, website_url, social_links, years_in_operation,
        verified_badge, verification_status, created_at,
        projects(id, name, project_type, status, province, city)
      `)
      .eq('id', id)
      .single()
    if (error || !data) throw new NotFoundException('Developer not found')
    return data
  }

  async getDashboard(userId: string) {
    const { data: dev } = await this.supabase.admin
      .from('developers')
      .select('id')
      .eq('user_id', userId)
      .single()
    if (!dev) throw new NotFoundException('Developer profile not found')

    const developerId = dev.id

    // KPIs
    const [unitsRes, connectionsRes, reservationsRes] = await Promise.all([
      this.supabase.admin
        .from('units')
        .select('status, project_id, projects!inner(developer_id)')
        .eq('projects.developer_id', developerId),
      this.supabase.admin
        .from('broker_connections')
        .select('id, status')
        .eq('developer_id', developerId)
        .eq('status', 'active'),
      this.supabase.admin
        .from('reservation_requests')
        .select('id, status, created_at, units!inner(project_id, projects!inner(developer_id))')
        .eq('units.projects.developer_id', developerId),
    ])

    const units = unitsRes.data ?? []
    const totalUnits = units.length
    const availableUnits = units.filter((u: any) => u.status === 'available').length
    const reservedUnits = units.filter((u: any) => u.status === 'reserved').length
    const soldUnits = units.filter((u: any) => u.status === 'sold').length

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const reservations = reservationsRes.data ?? []
    const reservationsThisMonth = reservations.filter(
      (r: any) => r.created_at >= startOfMonth,
    ).length
    const confirmedThisMonth = reservations.filter(
      (r: any) => r.status === 'confirmed' && r.created_at >= startOfMonth,
    ).length

    // Activity feed — last 20 events
    const { data: activity } = await this.supabase.admin
      .from('audit_trail')
      .select('*')
      .eq('metadata->>developer_id', developerId)
      .order('created_at', { ascending: false })
      .limit(20)

    return {
      kpis: {
        total_units: totalUnits,
        available_units: availableUnits,
        reserved_units: reservedUnits,
        sold_units: soldUnits,
        active_connections: (connectionsRes.data ?? []).length,
        reservations_this_month: reservationsThisMonth,
        confirmed_sales_this_month: confirmedThisMonth,
      },
      activity_feed: activity ?? [],
    }
  }
}
