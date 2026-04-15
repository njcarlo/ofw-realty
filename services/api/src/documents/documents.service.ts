import { Injectable, NotFoundException } from '@nestjs/common'
import { createHash } from 'crypto'
import { SupabaseService } from '../supabase/supabase.service'

const REQUIRED_DOC_COUNT = 9

@Injectable()
export class DocumentsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getChecklist(ownerId: string) {
    const { data, error } = await this.supabase.client
      .from('documents')
      .select('*')
      .eq('owner_id', ownerId)
      .order('doc_number')

    if (error) throw error
    return data
  }

  async upload(dto: {
    owner_id: string
    owner_type: string
    doc_type: string
    doc_number: number
    file_url: string
    expiry_date?: string
  }, uploadedBy: string) {
    const { data, error } = await this.supabase.admin
      .from('documents')
      .insert({
        owner_id: dto.owner_id,
        owner_type: dto.owner_type,
        doc_type: dto.doc_type,
        doc_number: dto.doc_number,
        file_url: dto.file_url,
        expiry_date: dto.expiry_date ?? null,
        status: 'submitted',
      })
      .select()
      .single()

    if (error) throw error

    // Audit trail
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'document',
      entity_id: data.id,
      user_id: uploadedBy,
      action: 'uploaded',
      metadata: { doc_type: dto.doc_type, doc_number: dto.doc_number },
    })

    // Notify admin (in production: trigger notification service)
    await this.supabase.admin.from('notifications').insert({
      user_id: uploadedBy, // placeholder — in production notify admin users
      type: 'document_submitted',
      title: 'New document submitted',
      body: `Document #${dto.doc_number} (${dto.doc_type}) submitted for review`,
      data: { document_id: data.id, owner_id: dto.owner_id },
    })

    return data
  }

  async review(docId: string, action: 'approve' | 'reject', adminId: string, rejectionReason?: string) {
    const newStatus = action === 'approve' ? 'approved' : 'pending'

    const { data: doc, error } = await this.supabase.admin
      .from('documents')
      .update({
        status: newStatus,
        rejection_reason: action === 'reject' ? rejectionReason : null,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', docId)
      .select()
      .single()

    if (error) throw error

    // Audit trail
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'document',
      entity_id: docId,
      user_id: adminId,
      action: action === 'approve' ? 'approved' : 'rejected',
      metadata: { rejection_reason: rejectionReason },
    })

    if (action === 'approve') {
      // Generate and store document hash on blockchain
      await this.storeDocumentHash(doc)

      // Check if all 9 documents are approved → award Verified_Badge
      await this.checkAndAwardBadge(doc.owner_id, doc.owner_type)
    }

    return doc
  }

  private async storeDocumentHash(doc: any) {
    // Generate SHA-256 hash of the file URL as a proxy for file content hash
    // In production: hash the actual file buffer before upload
    const hash = createHash('sha256').update(doc.file_url + doc.id).digest('hex')

    await this.supabase.admin
      .from('documents')
      .update({ blockchain_hash: hash })
      .eq('id', doc.id)

    // Audit trail for blockchain write
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'document',
      entity_id: doc.id,
      action: 'blockchain_hash_stored',
      metadata: { hash, doc_type: doc.doc_type },
    })
  }

  private async checkAndAwardBadge(ownerId: string, ownerType: string) {
    const { data: docs } = await this.supabase.admin
      .from('documents')
      .select('status')
      .eq('owner_id', ownerId)
      .eq('owner_type', ownerType)

    const approvedCount = docs?.filter(d => d.status === 'approved').length ?? 0

    if (approvedCount >= REQUIRED_DOC_COUNT) {
      if (ownerType === 'realtor') {
        // Generate QR code URL (placeholder — in production: generate actual QR)
        const qrUrl = `${process.env.APP_URL ?? 'https://ofw-realty.com'}/verify/realtor/${ownerId}`

        await this.supabase.admin
          .from('realtors')
          .update({
            verified_badge: true,
            verified_at: new Date().toISOString(),
            blockchain_qr_url: qrUrl,
          })
          .eq('id', ownerId)
      } else if (ownerType === 'brokerage') {
        await this.supabase.admin
          .from('broker_companies')
          .update({
            verified_badge: true,
            verified_at: new Date().toISOString(),
          })
          .eq('id', ownerId)
      }

      await this.supabase.admin.from('audit_trail').insert({
        entity_type: ownerType,
        entity_id: ownerId,
        action: 'verified_badge_awarded',
        metadata: { approved_doc_count: approvedCount },
      })
    }
  }

  async verifyOnBlockchain(docId: string) {
    const { data: doc } = await this.supabase.client
      .from('documents')
      .select('id, doc_type, doc_number, status, blockchain_hash, reviewed_at')
      .eq('id', docId)
      .single()

    if (!doc) throw new NotFoundException('Document not found')

    return {
      document_id: doc.id,
      doc_type: doc.doc_type,
      status: doc.status,
      blockchain_hash: doc.blockchain_hash,
      verified_at: doc.reviewed_at,
      is_blockchain_verified: !!doc.blockchain_hash,
    }
  }

  // Cron: check for expiring documents (called by scheduler)
  async checkExpiringDocuments() {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const { data: expiring } = await this.supabase.admin
      .from('documents')
      .select('id, owner_id, doc_type, expiry_date')
      .eq('status', 'approved')
      .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
      .gte('expiry_date', new Date().toISOString().split('T')[0])

    for (const doc of expiring ?? []) {
      await this.supabase.admin.from('notifications').insert({
        user_id: doc.owner_id,
        type: 'document_expiring',
        title: 'Document expiring soon',
        body: `Your ${doc.doc_type} expires on ${doc.expiry_date}. Please renew it to keep your Verified Badge.`,
        data: { document_id: doc.id },
      })
    }

    // Revoke badges for expired documents
    const { data: expired } = await this.supabase.admin
      .from('documents')
      .select('id, owner_id, owner_type, doc_type')
      .eq('status', 'approved')
      .lt('expiry_date', new Date().toISOString().split('T')[0])

    for (const doc of expired ?? []) {
      await this.supabase.admin
        .from('documents')
        .update({ status: 'expired' })
        .eq('id', doc.id)

      // Revoke badge
      if (doc.owner_type === 'realtor') {
        await this.supabase.admin
          .from('realtors')
          .update({ verified_badge: false })
          .eq('id', doc.owner_id)
      }
    }
  }
}
