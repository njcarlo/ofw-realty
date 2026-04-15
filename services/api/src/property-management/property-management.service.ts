import { Injectable, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class PropertyManagementService {
  constructor(private readonly supabase: SupabaseService) {}

  async getUnits(ownerId: string) {
    const { data, error } = await this.supabase.client
      .from('transactions')
      .select(`
        id, status, created_at,
        listings(id, title, address, city, province),
        users!buyer_id(full_name, email)
      `)
      .eq('buyer_id', ownerId)
      .eq('status', 'sold')

    if (error) throw error
    return data
  }

  async submitMaintenanceTicket(dto: {
    listing_id: string
    tenant_id: string
    issue: string
    category: string
    description?: string
    photo_url?: string
  }) {
    const { data, error } = await this.supabase.admin
      .from('site_visit_media') // reuse media table for tickets
      .insert({
        listing_id: dto.listing_id,
        uploaded_by: dto.tenant_id,
        media_type: 'maintenance_ticket',
        url: dto.photo_url ?? '',
        metadata: {
          issue: dto.issue,
          category: dto.category,
          description: dto.description,
          status: 'open',
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'maintenance_ticket',
      entity_id: data.id,
      user_id: dto.tenant_id,
      action: 'ticket_submitted',
      metadata: { issue: dto.issue, category: dto.category },
    })

    return data
  }

  async generateIncomeStatement(ownerId: string, month: string) {
    // Stub — in production, aggregate from payment records
    return {
      owner_id: ownerId,
      month,
      gross_rent: 40000,
      management_fee: 3200,
      maintenance_costs: 2500,
      net_income: 34300,
      generated_at: new Date().toISOString(),
      disclaimer: 'This is a summary statement. Consult your accountant for tax purposes.',
    }
  }
}
