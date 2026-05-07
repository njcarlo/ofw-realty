import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { SetVanitySlugDto } from './dto/set-vanity-slug.dto'
import { UploadCoverDto } from './dto/upload-cover.dto'
import * as crypto from 'crypto'

const SLUG_REGEX = /^[a-z0-9-]+$/
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

@Injectable()
export class BrokerWhiteLabelService {
  constructor(private readonly supabase: SupabaseService) {}

  async setVanitySlug(userId: string, dto: SetVanitySlugDto) {
    if (!SLUG_REGEX.test(dto.vanity_slug)) {
      throw new UnprocessableEntityException('Slug must be lowercase alphanumeric with hyphens only')
    }

    // Get broker company
    const { data: bc } = await this.supabase.admin
      .from('broker_companies').select('id, vanity_slug, vanity_slug_set_at').eq('id', userId).single()
    if (!bc) throw new NotFoundException('Broker company not found')

    // Check 30-day rate limit
    if (bc.vanity_slug_set_at) {
      const setAt = new Date(bc.vanity_slug_set_at).getTime()
      const elapsed = Date.now() - setAt
      if (elapsed < THIRTY_DAYS_MS) {
        const daysRemaining = Math.ceil((THIRTY_DAYS_MS - elapsed) / (24 * 60 * 60 * 1000))
        throw new UnprocessableEntityException({
          code: 'slug_update_too_soon',
          days_remaining: daysRemaining,
        })
      }
    }

    // Check uniqueness
    const { data: taken } = await this.supabase.admin
      .from('broker_companies')
      .select('id')
      .eq('vanity_slug', dto.vanity_slug)
      .neq('id', userId)
      .maybeSingle()
    if (taken) throw new ConflictException({ code: 'slug_taken' })

    const now = new Date().toISOString()
    const { data, error } = await this.supabase.admin
      .from('broker_companies')
      .update({
        previous_vanity_slug: bc.vanity_slug ?? null,
        previous_slug_set_at: bc.vanity_slug_set_at ?? null,
        vanity_slug: dto.vanity_slug,
        vanity_slug_set_at: now,
      })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async resolveSlug(slug: string) {
    // Check current slug
    const { data: current } = await this.supabase.admin
      .from('broker_companies')
      .select('id, name, logo_url, vanity_slug, vanity_slug_set_at')
      .eq('vanity_slug', slug)
      .maybeSingle()
    if (current) return { broker: current, redirected: false }

    // Check previous slug (within 90-day redirect window)
    const { data: previous } = await this.supabase.admin
      .from('broker_companies')
      .select('id, name, logo_url, vanity_slug, vanity_slug_set_at, previous_vanity_slug, previous_slug_set_at')
      .eq('previous_vanity_slug', slug)
      .maybeSingle()

    if (previous && previous.previous_slug_set_at) {
      const setAt = new Date(previous.previous_slug_set_at).getTime()
      const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000
      if (Date.now() - setAt <= ninetyDaysMs) {
        return { broker: previous, redirected: true, new_slug: previous.vanity_slug }
      }
    }

    throw new NotFoundException('Broker profile not found')
  }

  async getSignedCoverUploadUrl(userId: string, dto: UploadCoverDto) {
    const { data: bc } = await this.supabase.admin
      .from('broker_companies').select('id').eq('id', userId).single()
    if (!bc) throw new NotFoundException('Broker company not found')

    const storagePath = `broker-covers/${userId}/${crypto.randomUUID()}-${dto.file_name}`

    const { data: signedData, error } = await this.supabase.admin.storage
      .from('developer-media')
      .createSignedUploadUrl(storagePath)
    if (error) throw error

    return { upload_url: signedData.signedUrl, path: storagePath }
  }
}
