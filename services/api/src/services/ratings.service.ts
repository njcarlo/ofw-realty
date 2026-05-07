import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { NotificationsService } from './notifications.service'
import { CreateRatingDto } from './dto/create-rating.dto'
import { Rating } from './types/entities'

@Injectable()
export class RatingsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Submit a rating for a completed engagement.
   *
   * Business rules:
   * 1. Engagement must exist and be completed
   * 2. Caller must be the requester of the engagement
   * 3. score must be an integer in [1, 5] — reject with 422 otherwise
   * 4. No duplicate rating for the same engagement — reject with 409
   * 5. rating_window_closes_at must be >= now() — reject with 422 if expired
   * 6. After insert: recompute provider_profiles.avg_rating = round(mean(scores), 1)
   * 7. After insert: increment provider_profiles.completed_engagements by 1
   */
  async create(
    engagementId: string,
    dto: CreateRatingDto,
    requesterId: string,
  ): Promise<Rating> {
    // --- Validate score ---
    if (
      !Number.isInteger(dto.score) ||
      dto.score < 1 ||
      dto.score > 5
    ) {
      throw new UnprocessableEntityException('Rating score must be between 1 and 5')
    }

    // --- Fetch the engagement ---
    const { data: engagement, error: engError } = await this.supabase.admin
      .from('engagements')
      .select('id, requester_id, provider_id, status, rating_window_closes_at')
      .eq('id', engagementId)
      .single()

    if (engError || !engagement) {
      throw new NotFoundException('Engagement not found')
    }

    // --- Caller must be the requester ---
    if (engagement.requester_id !== requesterId) {
      throw new UnprocessableEntityException('Only the requester can submit a rating')
    }

    // --- Engagement must be completed ---
    if (engagement.status !== 'completed') {
      throw new UnprocessableEntityException(
        'A rating can only be submitted for a completed engagement',
      )
    }

    // --- Check rating window ---
    if (!engagement.rating_window_closes_at) {
      throw new UnprocessableEntityException('The rating window for this engagement has closed')
    }

    const now = new Date()
    const windowCloses = new Date(engagement.rating_window_closes_at)
    if (windowCloses < now) {
      throw new UnprocessableEntityException('The rating window for this engagement has closed')
    }

    // --- Check for duplicate rating ---
    const { data: existing } = await this.supabase.admin
      .from('ratings')
      .select('id')
      .eq('engagement_id', engagementId)
      .maybeSingle()

    if (existing) {
      throw new ConflictException('A rating has already been submitted for this engagement')
    }

    // --- Insert the rating ---
    const { data: rating, error: insertError } = await this.supabase.admin
      .from('ratings')
      .insert({
        engagement_id: engagementId,
        requester_id: requesterId,
        provider_id: engagement.provider_id,
        score: dto.score,
        review: dto.review ?? null,
      })
      .select()
      .single()

    if (insertError) throw insertError

    // --- Recompute avg_rating for the provider ---
    await this.recomputeProviderStats(engagement.provider_id)

    // --- Audit trail ---
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'rating',
      entity_id: rating.id,
      user_id: requesterId,
      action: 'created',
      metadata: {
        engagement_id: engagementId,
        provider_id: engagement.provider_id,
        score: dto.score,
      },
    })

    return rating
  }

  /**
   * Recompute provider_profiles.avg_rating and increment completed_engagements.
   *
   * avg_rating = round(arithmetic mean of all scores for this provider, 1 decimal place)
   * completed_engagements is incremented by 1 each time a rating is submitted.
   */
  private async recomputeProviderStats(providerId: string): Promise<void> {
    // Fetch all scores for this provider
    const { data: ratings, error } = await this.supabase.admin
      .from('ratings')
      .select('score')
      .eq('provider_id', providerId)

    if (error || !ratings || ratings.length === 0) return

    const scores = ratings.map((r: { score: number }) => r.score)
    const mean = scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length
    const avgRating = Math.round(mean * 10) / 10

    // Fetch current completed_engagements to increment it
    const { data: profile } = await this.supabase.admin
      .from('provider_profiles')
      .select('completed_engagements')
      .eq('id', providerId)
      .single()

    const currentCompleted = profile?.completed_engagements ?? 0

    // Update avg_rating and increment completed_engagements
    await this.supabase.admin
      .from('provider_profiles')
      .update({
        avg_rating: avgRating,
        completed_engagements: currentCompleted + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', providerId)
  }

  /**
   * Compute avg_rating from an array of scores.
   * Exported as a pure function for testing.
   */
  static computeAvgRating(scores: number[]): number {
    if (scores.length === 0) return 0
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length
    return Math.round(mean * 10) / 10
  }
}
