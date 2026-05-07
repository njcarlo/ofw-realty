import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { DEFAULT_CHECKLIST } from './constants/checklist'
import { CreateRoomDto } from './dto/create-room.dto'
import { SubmitOfferDto } from './dto/submit-offer.dto'
import { SendMessageDto } from './dto/send-message.dto'
import { UploadDocumentDto } from './dto/upload-document.dto'
import { UpdateChecklistDto, AddChecklistItemDto } from './dto/update-checklist.dto'
import { UpdateStatusDto } from './dto/update-status.dto'
import * as crypto from 'crypto'

@Injectable()
export class NegotiationDealRoomsService {
  constructor(private readonly supabase: SupabaseService) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private encryptRoomSecret(secret: string): string {
    const key = Buffer.from(process.env.ROOM_SECRET_KEY ?? 'default-32-byte-key-for-dev-only!', 'utf8').slice(0, 32)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])
    return iv.toString('hex') + ':' + encrypted.toString('hex')
  }

  private decryptRoomSecret(enc: string): string {
    const [ivHex, encHex] = enc.split(':')
    const key = Buffer.from(process.env.ROOM_SECRET_KEY ?? 'default-32-byte-key-for-dev-only!', 'utf8').slice(0, 32)
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()])
    return decrypted.toString('utf8')
  }

  private async writeAudit(params: {
    room_id: string
    listing_id: string
    user_id: string
    role: string
    event_type: string
    payload?: Record<string, unknown>
  }) {
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'negotiation_room',
      entity_id: params.room_id,
      user_id: params.user_id,
      action: params.event_type,
      metadata: {
        negotiation_room_id: params.room_id,
        listing_id: params.listing_id,
        role: params.role,
        ...(params.payload ?? {}),
      },
    })
  }

  private async notifyParticipants(roomId: string, event: string, payload: Record<string, unknown> = {}) {
    // Fetch all participants for notification
    const { data: participants } = await this.supabase.admin
      .from('negotiation_room_participants')
      .select('user_id')
      .eq('room_id', roomId)

    if (!participants) return

    // Insert in-app notifications for each participant
    const notifications = participants.map((p) => ({
      user_id: p.user_id,
      type: event,
      payload: { room_id: roomId, ...payload },
      read: false,
    }))

    try {
      await this.supabase.admin.from('notifications').insert(notifications)
    } catch {
      // notifications table may not exist yet; swallow gracefully
    }
  }

  private computeProgress(items: { status: string }[]): number {
    if (items.length === 0) return 0
    const completed = items.filter((i) => i.status === 'completed').length
    return Math.floor((completed / items.length) * 100)
  }

  private async advanceChecklistItem(roomId: string, label: string, userId: string) {
    await this.supabase.admin
      .from('negotiation_checklist_items')
      .update({ status: 'completed', updated_by: userId, updated_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('label', label)
      .eq('is_system', true)
  }

  // ─── Room CRUD ───────────────────────────────────────────────────────────────

  async createRoom(dto: CreateRoomDto, buyerId: string) {
    // Check for existing active room
    const { data: existing } = await this.supabase.admin
      .from('negotiation_rooms')
      .select('id')
      .eq('listing_id', dto.listing_id)
      .eq('buyer_id', buyerId)
      .eq('status', 'active')
      .maybeSingle()

    if (existing) {
      throw new ConflictException('An active negotiation room already exists for this listing')
    }

    // Fetch listing to determine type and assigned realtor/seller
    const { data: listing, error: listingErr } = await this.supabase.admin
      .from('listings')
      .select('id, user_id, realtor_id, status')
      .eq('id', dto.listing_id)
      .single()

    if (listingErr || !listing) throw new NotFoundException('Listing not found')

    // Generate room secret
    const roomSecret = crypto.randomBytes(32).toString('hex')
    const roomSecretEnc = this.encryptRoomSecret(roomSecret)

    // Create room
    const { data: room, error: roomErr } = await this.supabase.admin
      .from('negotiation_rooms')
      .insert({
        listing_id: dto.listing_id,
        buyer_id: buyerId,
        status: 'active',
        room_secret_enc: roomSecretEnc,
      })
      .select()
      .single()

    if (roomErr || !room) throw roomErr ?? new Error('Failed to create room')

    // Add participants
    const participants: { room_id: string; user_id: string; role: string; added_by: string }[] = [
      { room_id: room.id, user_id: buyerId, role: 'buyer', added_by: buyerId },
    ]

    if (listing.realtor_id) {
      // Agent-listed: add realtor
      participants.push({ room_id: room.id, user_id: listing.realtor_id, role: 'realtor', added_by: buyerId })
    } else {
      // Seller-listed: add seller (listing owner)
      participants.push({ room_id: room.id, user_id: listing.user_id, role: 'seller', added_by: buyerId })
    }

    await this.supabase.admin.from('negotiation_room_participants').insert(participants)

    // Insert default checklist
    const checklistRows = DEFAULT_CHECKLIST.map((item) => ({
      room_id: room.id,
      label: item.label,
      sort_order: item.sort_order,
      is_system: item.is_system,
      status: 'pending',
    }))
    await this.supabase.admin.from('negotiation_checklist_items').insert(checklistRows)

    // Record initial offer in offer thread
    await this.supabase.admin.from('negotiation_offers').insert({
      room_id: room.id,
      submitted_by: buyerId,
      submitter_role: 'buyer',
      offer_type: 'offer',
      amount_php: dto.amount_php,
      payment_method: dto.payment_method,
      conditions: dto.conditions ?? null,
    })

    // Auto-advance "Offer Submitted" checklist item
    await this.advanceChecklistItem(room.id, 'Offer Submitted', buyerId)

    // Audit
    await this.writeAudit({
      room_id: room.id,
      listing_id: dto.listing_id,
      user_id: buyerId,
      role: 'buyer',
      event_type: 'room_created',
      payload: { amount_php: dto.amount_php },
    })

    // Notify
    await this.notifyParticipants(room.id, 'room_created', { listing_id: dto.listing_id })

    return { ...room, room_secret: roomSecret }
  }

  async getRoom(roomId: string, userId: string, isAdmin = false) {
    const { data: room, error } = await this.supabase.admin
      .from('negotiation_rooms')
      .select('*, listing:listings(id, title, address, status), buyer:users!buyer_id(id, full_name, email)')
      .eq('id', roomId)
      .single()

    if (error || !room) throw new NotFoundException('Not found')

    if (isAdmin) {
      await this.writeAudit({
        room_id: roomId,
        listing_id: room.listing_id,
        user_id: userId,
        role: 'admin',
        event_type: 'admin_access',
      })
      // Broadcast admin_notice via Realtime (best-effort via DB insert)
      void this.supabase.admin
        .from('audit_trail')
        .insert({
          entity_type: 'negotiation_room',
          entity_id: roomId,
          user_id: userId,
          action: 'admin_notice_broadcast',
          metadata: { admin_id: userId, room_id: roomId },
        })
    }

    const roomSecret = this.decryptRoomSecret(room.room_secret_enc)
    return { ...room, room_secret: roomSecret }
  }

  async listRooms(userId: string, userRole: string, filters?: { status?: string; listing_id?: string }) {
    let query = this.supabase.admin
      .from('negotiation_rooms')
      .select(`
        *,
        listing:listings(id, title, address, status, broker_company_id, realtor_id),
        buyer:users!buyer_id(id, full_name, email),
        participants:negotiation_room_participants(user_id, role),
        latest_offer:negotiation_offers(amount_php, created_at)
      `)
      .order('updated_at', { ascending: false })

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.listing_id) query = query.eq('listing_id', filters.listing_id)

    const { data: rooms, error } = await query
    if (error) throw error

    if (userRole === 'realtor' || userRole === 'agent') {
      // Only rooms where this user is a participant
      return (rooms ?? []).filter((r: any) =>
        r.participants?.some((p: any) => p.user_id === userId),
      )
    }

    if (userRole === 'broker') {
      // Only rooms for listings under this broker's company
      const { data: brokerProfile } = await this.supabase.admin
        .from('users')
        .select('broker_company_id')
        .eq('id', userId)
        .single()

      const brokerCompanyId = brokerProfile?.broker_company_id
      return (rooms ?? []).filter((r: any) => r.listing?.broker_company_id === brokerCompanyId)
    }

    return rooms ?? []
  }

  async addParticipant(roomId: string, sellerId: string, realtorId: string) {
    // Verify room is active
    const { data: room } = await this.supabase.admin
      .from('negotiation_rooms')
      .select('id, listing_id, status')
      .eq('id', roomId)
      .single()

    if (!room) throw new NotFoundException('Not found')
    if (room.status !== 'active') throw new ForbiddenException('Room is not active')

    const { data, error } = await this.supabase.admin
      .from('negotiation_room_participants')
      .insert({ room_id: roomId, user_id: sellerId, role: 'seller', added_by: realtorId })
      .select()
      .single()

    if (error) throw error

    await this.writeAudit({
      room_id: roomId,
      listing_id: room.listing_id,
      user_id: realtorId,
      role: 'realtor',
      event_type: 'participant_added',
      payload: { added_user_id: sellerId, role: 'seller' },
    })

    return data
  }

  // ─── Offers ─────────────────────────────────────────────────────────────────

  async submitOffer(roomId: string, dto: SubmitOfferDto, userId: string, participantRole: string) {
    const { data: room } = await this.supabase.admin
      .from('negotiation_rooms')
      .select('id, listing_id, status')
      .eq('id', roomId)
      .single()

    if (!room) throw new NotFoundException('Not found')
    if (room.status !== 'active') {
      throw new UnprocessableEntityException('Offer thread is locked')
    }

    // If responding to an existing offer, update its response
    if (dto.response_to_offer_id && dto.response) {
      await this.supabase.admin
        .from('negotiation_offers')
        .update({ response: dto.response, responded_by: userId, responded_at: new Date().toISOString() })
        .eq('id', dto.response_to_offer_id)
    }

    // Insert new offer row
    const { data: offer, error } = await this.supabase.admin
      .from('negotiation_offers')
      .insert({
        room_id: roomId,
        submitted_by: userId,
        submitter_role: participantRole,
        offer_type: dto.offer_type,
        amount_php: dto.amount_php,
        payment_method: dto.payment_method ?? null,
        conditions: dto.conditions ?? null,
      })
      .select()
      .single()

    if (error) throw error

    // If accepted: lock thread, update room status, advance checklist
    if (dto.response === 'accepted') {
      await this.supabase.admin
        .from('negotiation_rooms')
        .update({ status: 'offer_accepted', updated_at: new Date().toISOString() })
        .eq('id', roomId)

      await this.advanceChecklistItem(roomId, 'Offer Accepted', userId)
    }

    await this.writeAudit({
      room_id: roomId,
      listing_id: room.listing_id,
      user_id: userId,
      role: participantRole,
      event_type: dto.response === 'accepted' ? 'offer_accepted' : 'offer_submitted',
      payload: { amount_php: dto.amount_php, offer_type: dto.offer_type },
    })

    await this.notifyParticipants(roomId, 'offer_submitted', { amount_php: dto.amount_php })

    return offer
  }

  async getOffers(roomId: string) {
    const { data, error } = await this.supabase.admin
      .from('negotiation_offers')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data ?? []
  }

  // ─── Messages ────────────────────────────────────────────────────────────────

  async sendMessage(roomId: string, dto: SendMessageDto, userId: string, participantRole: string) {
    const { data: room } = await this.supabase.admin
      .from('negotiation_rooms')
      .select('listing_id')
      .eq('id', roomId)
      .single()

    const { data: message, error } = await this.supabase.admin
      .from('negotiation_messages')
      .insert({
        room_id: roomId,
        sender_id: userId,
        sender_role: participantRole,
        content_enc: dto.content_enc,
        content_iv: dto.content_iv,
        message_type: dto.message_type,
        attachment_url: dto.attachment_url ?? null,
      })
      .select()
      .single()

    if (error) throw error

    await this.writeAudit({
      room_id: roomId,
      listing_id: room?.listing_id ?? '',
      user_id: userId,
      role: participantRole,
      event_type: 'message_sent',
    })

    await this.notifyParticipants(roomId, 'message_sent', { sender_id: userId })

    return message
  }

  async getMessages(roomId: string) {
    const { data, error } = await this.supabase.admin
      .from('negotiation_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data ?? []
  }

  async recordReadReceipt(roomId: string, msgId: string, userId: string) {
    // Upsert — idempotent
    const { data, error } = await this.supabase.admin
      .from('negotiation_message_reads')
      .upsert({ message_id: msgId, reader_id: userId }, { onConflict: 'message_id,reader_id' })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // ─── Documents ───────────────────────────────────────────────────────────────

  async getSignedUploadUrl(roomId: string, dto: UploadDocumentDto, userId: string, participantRole: string) {
    const { data: room } = await this.supabase.admin
      .from('negotiation_rooms')
      .select('listing_id')
      .eq('id', roomId)
      .single()

    const storagePath = `${roomId}/${crypto.randomUUID()}-${dto.file_name}`

    const { data: signedData, error: signedErr } = await this.supabase.admin.storage
      .from('deal-room-docs')
      .createSignedUploadUrl(storagePath)

    if (signedErr) throw signedErr

    // Insert document metadata row
    const { data: doc, error: docErr } = await this.supabase.admin
      .from('negotiation_documents')
      .insert({
        room_id: roomId,
        uploaded_by: userId,
        uploader_role: participantRole,
        file_name: dto.file_name,
        file_type: dto.file_type,
        file_size_bytes: dto.file_size_bytes,
        storage_path: storagePath,
        category: dto.category,
      })
      .select()
      .single()

    if (docErr) throw docErr

    await this.writeAudit({
      room_id: roomId,
      listing_id: room?.listing_id ?? '',
      user_id: userId,
      role: participantRole,
      event_type: 'document_uploaded',
      payload: { file_name: dto.file_name, category: dto.category },
    })

    await this.notifyParticipants(roomId, 'document_uploaded', { file_name: dto.file_name })

    return { document: doc, upload_url: signedData.signedUrl, path: storagePath }
  }

  async listDocuments(roomId: string) {
    const { data, error } = await this.supabase.admin
      .from('negotiation_documents')
      .select('*')
      .eq('room_id', roomId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  }

  async getSignedDownloadUrl(roomId: string, docId: string) {
    const { data: doc, error: docErr } = await this.supabase.admin
      .from('negotiation_documents')
      .select('storage_path, deleted_at')
      .eq('id', docId)
      .eq('room_id', roomId)
      .single()

    if (docErr || !doc) throw new NotFoundException('Document not found')
    if (doc.deleted_at) throw new NotFoundException('Document not found')

    const { data: signedData, error: signedErr } = await this.supabase.admin.storage
      .from('deal-room-docs')
      .createSignedUrl(doc.storage_path, 900) // exactly 900 seconds

    if (signedErr) throw signedErr

    return { url: signedData.signedUrl, expires_in: 900 }
  }

  async deleteDocument(roomId: string, docId: string, userId: string, participantRole: string) {
    const { data: doc, error: docErr } = await this.supabase.admin
      .from('negotiation_documents')
      .select('id, uploaded_by, room_id, file_name, category')
      .eq('id', docId)
      .eq('room_id', roomId)
      .is('deleted_at', null)
      .single()

    if (docErr || !doc) throw new NotFoundException('Document not found')

    // Only uploader can delete
    if (doc.uploaded_by !== userId) {
      throw new ForbiddenException('Only the uploader may delete this document')
    }

    // Only when room is active
    const { data: room } = await this.supabase.admin
      .from('negotiation_rooms')
      .select('status, listing_id')
      .eq('id', roomId)
      .single()

    if (room?.status !== 'active') {
      throw new ForbiddenException('Documents cannot be deleted after offer is accepted')
    }

    await this.supabase.admin
      .from('negotiation_documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', docId)

    await this.writeAudit({
      room_id: roomId,
      listing_id: room?.listing_id ?? '',
      user_id: userId,
      role: participantRole,
      event_type: 'document_deleted',
      payload: { file_name: doc.file_name, category: doc.category },
    })

    return { success: true }
  }

  // ─── Checklist ───────────────────────────────────────────────────────────────

  async getChecklist(roomId: string) {
    const { data: items, error } = await this.supabase.admin
      .from('negotiation_checklist_items')
      .select('*')
      .eq('room_id', roomId)
      .order('sort_order', { ascending: true })

    if (error) throw error

    const progress = this.computeProgress(items ?? [])
    return { items: items ?? [], progress }
  }

  async updateChecklistItem(
    roomId: string,
    itemId: string,
    dto: UpdateChecklistDto,
    userId: string,
    participantRole: string,
  ) {
    const { data: room } = await this.supabase.admin
      .from('negotiation_rooms')
      .select('listing_id')
      .eq('id', roomId)
      .single()

    const { data: item, error } = await this.supabase.admin
      .from('negotiation_checklist_items')
      .update({ status: dto.status, updated_by: userId, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .eq('room_id', roomId)
      .select()
      .single()

    if (error) throw error

    await this.writeAudit({
      room_id: roomId,
      listing_id: room?.listing_id ?? '',
      user_id: userId,
      role: participantRole,
      event_type: 'checklist_updated',
      payload: { item_id: itemId, new_status: dto.status, label: item?.label },
    })

    await this.notifyParticipants(roomId, 'checklist_updated', { item_id: itemId, status: dto.status })

    return item
  }

  async addChecklistItem(roomId: string, dto: AddChecklistItemDto, userId: string) {
    // Get current max sort_order
    const { data: existing } = await this.supabase.admin
      .from('negotiation_checklist_items')
      .select('sort_order')
      .eq('room_id', roomId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1

    const { data, error } = await this.supabase.admin
      .from('negotiation_checklist_items')
      .insert({
        room_id: roomId,
        label: dto.label,
        sort_order: nextOrder,
        is_system: false,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // ─── Status ──────────────────────────────────────────────────────────────────

  async updateStatus(roomId: string, dto: UpdateStatusDto, userId: string, participantRole: string) {
    const { data: room } = await this.supabase.admin
      .from('negotiation_rooms')
      .select('listing_id, status')
      .eq('id', roomId)
      .single()

    if (!room) throw new NotFoundException('Not found')

    await this.supabase.admin
      .from('negotiation_rooms')
      .update({ status: dto.status, updated_at: new Date().toISOString() })
      .eq('id', roomId)

    // Sync listing status
    await this.syncListingStatus(room.listing_id, dto.status)

    // Auto-advance "Deal Closed" checklist item
    if (dto.status === 'closed') {
      await this.advanceChecklistItem(roomId, 'Deal Closed', userId)
    }

    await this.writeAudit({
      room_id: roomId,
      listing_id: room.listing_id,
      user_id: userId,
      role: participantRole,
      event_type: 'status_changed',
      payload: { old_status: room.status, new_status: dto.status },
    })

    await this.notifyParticipants(roomId, 'status_changed', { new_status: dto.status })

    return { status: dto.status }
  }

  private async syncListingStatus(listingId: string, roomStatus: string) {
    let listingStatus: string | null = null

    if (roomStatus === 'reserved') {
      listingStatus = 'reserved'
    } else if (roomStatus === 'closed') {
      listingStatus = 'sold'
    } else if (roomStatus === 'cancelled') {
      // Only revert to active if no other active room exists
      const { count } = await this.supabase.admin
        .from('negotiation_rooms')
        .select('id', { count: 'exact', head: true })
        .eq('listing_id', listingId)
        .eq('status', 'active')

      if ((count ?? 0) === 0) {
        listingStatus = 'active'
      }
    }

    if (listingStatus) {
      await this.supabase.admin
        .from('listings')
        .update({ status: listingStatus })
        .eq('id', listingId)
    }
  }

  // ─── Audit ───────────────────────────────────────────────────────────────────

  async getAuditTrail(roomId: string) {
    const { data, error } = await this.supabase.admin
      .from('audit_trail')
      .select('*')
      .eq('entity_type', 'negotiation_room')
      .eq('entity_id', roomId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data ?? []
  }

  async exportAuditTrail(roomId: string, format: 'pdf' | 'csv' = 'csv') {
    const entries = await this.getAuditTrail(roomId)

    if (format === 'csv') {
      const header = 'id,event_type,user_id,role,created_at,payload\n'
      const rows = entries
        .map((e: any) =>
          [e.id, e.action, e.user_id, e.metadata?.role ?? '', e.created_at, JSON.stringify(e.metadata)].join(','),
        )
        .join('\n')
      return { format: 'csv', content: header + rows }
    }

    // PDF: return raw data for client-side rendering
    return { format: 'pdf', entries }
  }

  // ─── Listing deactivation hook ───────────────────────────────────────────────

  async cancelRoomsForListing(listingId: string, triggeredBy: string) {
    const { data: activeRooms } = await this.supabase.admin
      .from('negotiation_rooms')
      .select('id, listing_id')
      .eq('listing_id', listingId)
      .eq('status', 'active')

    if (!activeRooms?.length) return

    await this.supabase.admin
      .from('negotiation_rooms')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('listing_id', listingId)
      .eq('status', 'active')

    for (const room of activeRooms) {
      await this.writeAudit({
        room_id: room.id,
        listing_id: listingId,
        user_id: triggeredBy,
        role: 'system',
        event_type: 'status_changed',
        payload: { old_status: 'active', new_status: 'cancelled', reason: 'listing_deactivated' },
      })
      await this.notifyParticipants(room.id, 'room_cancelled', { reason: 'listing_deactivated' })
    }
  }
}
