import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

const SCAM_FLAG_THRESHOLD = 3

@Injectable()
export class ReportsService {
  constructor(private readonly supabase: SupabaseService) {}

  async report(listingId: string, reason: string, description?: string) {
    // Store report in audit trail
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'listing_report',
      entity_id: listingId,
      action: 'reported',
      metadata: { reason, description },
    })

    // Count unresolved reports for this listing
    const { count } = await this.supabase.admin
      .from('audit_trail')
      .select('id', { count: 'exact', head: true })
      .eq('entity_id', listingId)
      .eq('action', 'reported')

    // Auto-flag if threshold reached
    if ((count ?? 0) >= SCAM_FLAG_THRESHOLD) {
      await this.supabase.admin
        .from('listings')
        .update({ scam_flagged: true, scam_flag_reason: `Auto-flagged: ${count} reports` })
        .eq('id', listingId)

      // Notify admins
      await this.supabase.admin.from('notifications').insert({
        user_id: '00000000-0000-0000-0000-000000000000', // system notification
        type: 'listing_auto_flagged',
        title: 'Listing auto-flagged',
        body: `Listing ${listingId} has been auto-flagged after ${count} reports`,
        data: { listing_id: listingId, report_count: count },
      })
    }

    return { message: 'Report submitted. Thank you for helping keep LUPAPH safe.' }
  }
}
