import { Injectable, BadRequestException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class ReviewsService {
  constructor(private readonly supabase: SupabaseService) {}

  async findByTarget(targetId: string, targetType: string) {
    const { data, error } = await this.supabase.client
      .from('reviews')
      .select('*, users!buyer_id(full_name, avatar_url)')
      .eq('target_id', targetId)
      .eq('target_type', targetType)
      .eq('is_removed', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    const reviews = data ?? []
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    return { reviews, avg_rating: Math.round(avgRating * 10) / 10, total: reviews.length }
  }

  async create(dto: {
    transaction_id: string
    target_id: string
    target_type: string
    rating: number
    comment?: string
  }, buyerId: string) {
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5')
    }

    const { data, error } = await this.supabase.admin
      .from('reviews')
      .insert({
        transaction_id: dto.transaction_id,
        buyer_id: buyerId,
        target_id: dto.target_id,
        target_type: dto.target_type,
        rating: dto.rating,
        comment: dto.comment ?? null,
      })
      .select()
      .single()

    if (error) throw error

    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'review',
      entity_id: data.id,
      user_id: buyerId,
      action: 'created',
      metadata: { rating: dto.rating, target_type: dto.target_type },
    })

    return data
  }

  async respond(reviewId: string, response: string) {
    const { data, error } = await this.supabase.admin
      .from('reviews')
      .update({ response })
      .eq('id', reviewId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async remove(reviewId: string, adminId: string) {
    const { error } = await this.supabase.admin
      .from('reviews')
      .update({ is_removed: true })
      .eq('id', reviewId)

    if (error) throw error

    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'review',
      entity_id: reviewId,
      user_id: adminId,
      action: 'removed_by_admin',
    })

    return { message: 'Review removed' }
  }
}
