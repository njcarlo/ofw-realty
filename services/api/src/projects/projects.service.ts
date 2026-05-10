import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { UpdateProjectStatusDto } from './dto/update-project-status.dto'
import { UploadPhotoDto } from './dto/upload-photo.dto'
import * as crypto from 'crypto'

@Injectable()
export class ProjectsService {
  constructor(private readonly supabase: SupabaseService) {}

  private async getDeveloperIdForUser(userId: string): Promise<string> {
    const { data } = await this.supabase.admin
      .from('developers')
      .select('id')
      .eq('user_id', userId)
      .single()
    if (!data) throw new NotFoundException('Developer profile not found')
    return data.id
  }

  async create(userId: string, dto: CreateProjectDto) {
    const developerId = await this.getDeveloperIdForUser(userId)

    const { data, error } = await this.supabase.admin
      .from('projects')
      .insert({ ...dto, developer_id: developerId })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async list(userId: string) {
    const developerId = await this.getDeveloperIdForUser(userId)

    const { data, error } = await this.supabase.admin
      .from('projects')
      .select('*, project_photos(id, url, is_primary, sort_order)')
      .eq('developer_id', developerId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }

  async getOne(id: string) {
    const { data, error } = await this.supabase.admin
      .from('projects')
      .select(`
        *,
        project_photos(id, url, is_primary, sort_order),
        units(id, unit_type, identifier, floor_area_sqm, price_php, status)
      `)
      .eq('id', id)
      .single()
    if (error || !data) throw new NotFoundException('Project not found')
    return data
  }

  async update(userId: string, id: string, dto: UpdateProjectDto) {
    const developerId = await this.getDeveloperIdForUser(userId)

    const { data, error } = await this.supabase.admin
      .from('projects')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('developer_id', developerId)
      .select()
      .single()
    if (error || !data) throw new NotFoundException('Project not found')
    return data
  }

  async updateStatus(userId: string, id: string, dto: UpdateProjectStatusDto) {
    const developerId = await this.getDeveloperIdForUser(userId)

    const { data, error } = await this.supabase.admin
      .from('projects')
      .update({ status: dto.status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('developer_id', developerId)
      .select()
      .single()
    if (error || !data) throw new NotFoundException('Project not found')

    // Sync map pin: hide listing if sold_out or on_hold
    if (dto.status === 'sold_out' || dto.status === 'on_hold') {
      await this.supabase.admin
        .from('listings')
        .update({ status: 'inactive' })
        .eq('project_id', id)
    } else {
      await this.supabase.admin
        .from('listings')
        .update({ status: 'active' })
        .eq('project_id', id)
    }

    return data
  }

  async getSignedPhotoUploadUrl(userId: string, projectId: string, dto: UploadPhotoDto) {
    const developerId = await this.getDeveloperIdForUser(userId)

    // Verify project belongs to developer
    const { data: project } = await this.supabase.admin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('developer_id', developerId)
      .single()
    if (!project) throw new NotFoundException('Project not found')

    // Validate min 5 photos check (warn if needed — enforced at publish time)
    const storagePath = `${userId}/${projectId}/${crypto.randomUUID()}-${dto.file_name}`

    const { data: signedData, error } = await this.supabase.admin.storage
      .from('project-media')
      .createSignedUploadUrl(storagePath)
    if (error) throw error

    // Insert photo metadata
    const { data: photo } = await this.supabase.admin
      .from('project_photos')
      .insert({
        project_id: projectId,
        url: storagePath,
        is_primary: dto.is_primary ?? false,
        sort_order: dto.sort_order ?? 0,
      })
      .select()
      .single()

    return { photo, upload_url: signedData.signedUrl, path: storagePath }
  }

  async validateMinPhotos(projectId: string): Promise<void> {
    const { count } = await this.supabase.admin
      .from('project_photos')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
    if ((count ?? 0) < 5) {
      throw new UnprocessableEntityException('Project requires a minimum of 5 photos')
    }
  }
}
