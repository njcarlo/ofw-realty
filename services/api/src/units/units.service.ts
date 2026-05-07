import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { CreateUnitDto } from './dto/create-unit.dto'
import { UpdateUnitDto } from './dto/update-unit.dto'
import { BulkImportDto } from './dto/bulk-import.dto'

interface CsvRow {
  unit_type: string
  identifier: string
  floor_area_sqm: string
  price_php: string
  status?: string
  floor_plan_url?: string
}

interface ValidationError {
  row: number
  field: string
  message: string
}

@Injectable()
export class UnitsService {
  constructor(private readonly supabase: SupabaseService) {}

  private parseCsv(csvContent: string): CsvRow[] {
    const lines = csvContent.trim().split('\n')
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map((h) => h.trim())
    return lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim())
      const row: Record<string, string> = {}
      headers.forEach((h, i) => { row[h] = values[i] ?? '' })
      return row as unknown as CsvRow
    })
  }

  private validateCsvRows(rows: CsvRow[]): ValidationError[] {
    const errors: ValidationError[] = []
    const seenIdentifiers = new Set<string>()

    rows.forEach((row, idx) => {
      const rowNum = idx + 2 // 1-indexed, skip header
      if (!row.unit_type) errors.push({ row: rowNum, field: 'unit_type', message: 'Required' })
      if (!row.identifier) errors.push({ row: rowNum, field: 'identifier', message: 'Required' })
      else if (seenIdentifiers.has(row.identifier)) {
        errors.push({ row: rowNum, field: 'identifier', message: 'Duplicate identifier in file' })
      } else {
        seenIdentifiers.add(row.identifier)
      }
      const area = parseFloat(row.floor_area_sqm)
      if (isNaN(area) || area <= 0) {
        errors.push({ row: rowNum, field: 'floor_area_sqm', message: 'Must be a positive number' })
      }
      const price = parseFloat(row.price_php)
      if (isNaN(price) || price <= 0) {
        errors.push({ row: rowNum, field: 'price_php', message: 'Must be a positive number' })
      }
      if (row.status && !['available', 'reserved', 'sold'].includes(row.status)) {
        errors.push({ row: rowNum, field: 'status', message: 'Must be available, reserved, or sold' })
      }
    })
    return errors
  }

  async createUnit(projectId: string, dto: CreateUnitDto) {
    const { data, error } = await this.supabase.admin
      .from('units')
      .insert({ ...dto, project_id: projectId })
      .select()
      .single()
    if (error?.code === '23505') throw new ConflictException('Unit identifier already exists in this project')
    if (error) throw error
    return data
  }

  async bulkImport(projectId: string, dto: BulkImportDto) {
    const rows = this.parseCsv(dto.csv_content)
    if (rows.length === 0) {
      throw new UnprocessableEntityException('CSV file is empty or has no data rows')
    }

    const errors = this.validateCsvRows(rows)
    if (errors.length > 0) {
      // Atomic: return validation report, save nothing
      throw new UnprocessableEntityException({ validation_errors: errors, saved: 0 })
    }

    // Check for existing identifiers in DB
    const identifiers = rows.map((r) => r.identifier)
    const { data: existing } = await this.supabase.admin
      .from('units')
      .select('identifier')
      .eq('project_id', projectId)
      .in('identifier', identifiers)

    if (existing && existing.length > 0) {
      const dbErrors = existing.map((e: any) => ({
        row: rows.findIndex((r) => r.identifier === e.identifier) + 2,
        field: 'identifier',
        message: `Identifier '${e.identifier}' already exists in project`,
      }))
      throw new UnprocessableEntityException({ validation_errors: dbErrors, saved: 0 })
    }

    const insertRows = rows.map((r) => ({
      project_id: projectId,
      unit_type: r.unit_type,
      identifier: r.identifier,
      floor_area_sqm: parseFloat(r.floor_area_sqm),
      price_php: parseFloat(r.price_php),
      status: r.status ?? 'available',
      floor_plan_url: r.floor_plan_url ?? null,
    }))

    const { data, error } = await this.supabase.admin
      .from('units')
      .insert(insertRows)
      .select()
    if (error) throw error

    return { saved: data?.length ?? 0, units: data }
  }

  async listUnits(projectId: string, status?: string) {
    let query = this.supabase.admin
      .from('units')
      .select('*')
      .eq('project_id', projectId)
      .order('identifier', { ascending: true })

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  }

  async updateUnit(unitId: string, dto: UpdateUnitDto) {
    if (dto.price_php !== undefined && dto.price_php <= 0) {
      throw new UnprocessableEntityException('price_php must be positive')
    }

    const { data, error } = await this.supabase.admin
      .from('units')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', unitId)
      .select()
      .single()
    if (error || !data) throw new NotFoundException('Unit not found')

    // Propagate status/price change to connected brokers via notifications
    if (dto.status || dto.price_php) {
      await this.notifyConnectedBrokers(unitId, dto)
    }

    return data
  }

  private async notifyConnectedBrokers(unitId: string, changes: UpdateUnitDto) {
    const { data: unit } = await this.supabase.admin
      .from('units')
      .select('project_id, identifier, projects!inner(developer_id)')
      .eq('id', unitId)
      .single()
    if (!unit) return

    const developerId = (unit as any).projects?.developer_id
    if (!developerId) return

    const { data: connections } = await this.supabase.admin
      .from('broker_connections')
      .select('broker_id')
      .eq('developer_id', developerId)
      .eq('status', 'active')
    if (!connections?.length) return

    const notifications = connections.map((c: any) => ({
      user_id: c.broker_id,
      type: 'unit_updated',
      payload: { unit_id: unitId, identifier: (unit as any).identifier, changes },
      read: false,
    }))

    try {
      await this.supabase.admin.from('notifications').insert(notifications)
    } catch {
      // swallow if notifications table not available
    }
  }

  async exportInventoryCsv(projectId: string): Promise<string> {
    const units = await this.listUnits(projectId)
    const header = 'id,unit_type,identifier,floor_area_sqm,price_php,status,floor_plan_url\n'
    const rows = units
      .map((u: any) =>
        [u.id, u.unit_type, u.identifier, u.floor_area_sqm, u.price_php, u.status, u.floor_plan_url ?? ''].join(','),
      )
      .join('\n')
    return header + rows
  }

  async exportInventoryPdf(projectId: string) {
    const { data: project } = await this.supabase.admin
      .from('projects')
      .select('name, province, city')
      .eq('id', projectId)
      .single()

    const units = await this.listUnits(projectId)
    // Return data for client-side PDF rendering
    return { project, units }
  }
}
