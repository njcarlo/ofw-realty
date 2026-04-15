import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class DealRoomsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(dto: { transaction_id: string; buyer_id: string; co_borrower_id?: string }, realtorId: string) {
    const { data, error } = await this.supabase.admin
      .from('deal_rooms')
      .insert({
        transaction_id: dto.transaction_id,
        realtor_id: realtorId,
        buyer_id: dto.buyer_id,
        co_borrower_id: dto.co_borrower_id ?? null,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async findOne(id: string, userId: string) {
    const { data, error } = await this.supabase.admin
      .from('deal_rooms')
      .select(`
        *,
        transactions(id, listing_id, status, final_price_php),
        buyer:users!buyer_id(full_name, email),
        co_borrower:users!co_borrower_id(full_name, email),
        realtor:realtors!realtor_id(id, slug, users(full_name))
      `)
      .eq('id', id)
      .single()

    if (!data) throw new NotFoundException('Deal room not found')

    // Only participants can access
    if (data.buyer_id !== userId && data.co_borrower_id !== userId && data.realtor_id !== userId) {
      throw new ForbiddenException('Access denied')
    }

    // Get documents for this deal room
    const { data: docs } = await this.supabase.admin
      .from('documents')
      .select('*')
      .eq('owner_id', id)
      .eq('owner_type', 'transaction')

    return { ...data, documents: docs ?? [] }
  }

  async uploadDocument(dealRoomId: string, dto: { doc_type: string; file_url: string; party: string }, userId: string) {
    const { data, error } = await this.supabase.admin
      .from('documents')
      .insert({
        owner_id: dealRoomId,
        owner_type: 'transaction',
        doc_type: `${dto.party}_${dto.doc_type}`,
        file_url: dto.file_url,
        status: 'submitted',
      })
      .select()
      .single()

    if (error) throw error

    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'deal_room',
      entity_id: dealRoomId,
      user_id: userId,
      action: 'document_uploaded',
      metadata: { doc_type: dto.doc_type, party: dto.party },
    })

    return data
  }
}
