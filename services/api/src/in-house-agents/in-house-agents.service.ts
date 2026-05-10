import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { InviteAgentDto } from './dto/invite-agent.dto'

@Injectable()
export class InHouseAgentsService {
  constructor(private readonly supabase: SupabaseService) {}

  private async notify(userId: string, type: string, payload: Record<string, unknown>) {
    try {
      await this.supabase.admin.from('notifications').insert({ user_id: userId, type, payload, read: false })
    } catch { /* swallow */ }
  }

  private async getDeveloperId(userId: string): Promise<string> {
    const { data } = await this.supabase.admin
      .from('developers').select('id').eq('user_id', userId).single()
    if (!data) throw new NotFoundException('Developer profile not found')
    return data.id
  }

  async invite(userId: string, dto: InviteAgentDto) {
    const developerId = await this.getDeveloperId(userId)

    // Verify realtor exists
    const { data: realtor } = await this.supabase.admin
      .from('realtors').select('id').eq('id', dto.realtor_id).single()
    if (!realtor) throw new NotFoundException('Agent not found')

    const { data: existing } = await this.supabase.admin
      .from('in_house_agent_tags')
      .select('id, status')
      .eq('developer_id', developerId)
      .eq('realtor_id', dto.realtor_id)
      .maybeSingle()

    if (existing && existing.status !== 'removed') {
      throw new ConflictException('Agent already invited or active')
    }

    const { data, error } = await this.supabase.admin
      .from('in_house_agent_tags')
      .upsert(
        { developer_id: developerId, realtor_id: dto.realtor_id, status: 'invited', invited_at: new Date().toISOString() },
        { onConflict: 'developer_id,realtor_id' },
      )
      .select()
      .single()
    if (error) throw error

    await this.notify(dto.realtor_id, 'in_house_agent_invited', { tag_id: data.id, developer_id: developerId })
    return data
  }

  async accept(userId: string, tagId: string) {
    const { data: tag } = await this.supabase.admin
      .from('in_house_agent_tags').select('*').eq('id', tagId).single()
    if (!tag) throw new NotFoundException('Invitation not found')

    const { data, error } = await this.supabase.admin
      .from('in_house_agent_tags')
      .update({ status: 'active', accepted_at: new Date().toISOString() })
      .eq('id', tagId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async remove(userId: string, tagId: string) {
    const developerId = await this.getDeveloperId(userId)

    const { data: tag } = await this.supabase.admin
      .from('in_house_agent_tags')
      .select('*')
      .eq('id', tagId)
      .eq('developer_id', developerId)
      .single()
    if (!tag) throw new NotFoundException('Tag not found')

    const { data, error } = await this.supabase.admin
      .from('in_house_agent_tags')
      .update({ status: 'removed', removed_at: new Date().toISOString() })
      .eq('id', tagId)
      .select()
      .single()
    if (error) throw error

    await this.notify(tag.realtor_id, 'in_house_agent_removed', { tag_id: tagId })
    return data
  }

  async list(userId: string) {
    const developerId = await this.getDeveloperId(userId)

    const { data, error } = await this.supabase.admin
      .from('in_house_agent_tags')
      .select(`
        *,
        realtor:realtors(id, full_name, email, profile_photo_url)
      `)
      .eq('developer_id', developerId)
      .neq('status', 'removed')
      .order('invited_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }
}
