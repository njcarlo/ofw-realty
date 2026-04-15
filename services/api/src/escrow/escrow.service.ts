import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

// Valid milestone order — a later milestone cannot be released before an earlier one
// Property P5: Escrow Milestone Ordering
const MILESTONE_ORDER = ['contract_initiation', 'cts_upload_verified']

@Injectable()
export class EscrowService {
  constructor(private readonly supabase: SupabaseService) {}

  async createEscrow(dto: {
    transaction_id: string
    buyer_id: string
    seller_id: string
    total_amount_php: number
    milestones: Array<{ label: string; percent: number; condition: string }>
  }) {
    // Validate milestone percents sum to 100
    const total = dto.milestones.reduce((sum, m) => sum + m.percent, 0)
    if (total !== 100) {
      throw new BadRequestException('Milestone percentages must sum to 100')
    }

    const { data, error } = await this.supabase.admin
      .from('deal_rooms')
      .insert({
        transaction_id: dto.transaction_id,
        buyer_id: dto.buyer_id,
        seller_id: dto.seller_id,
        escrow_amount_php: dto.total_amount_php,
        escrow_status: 'locked',
        milestones: dto.milestones.map((m, i) => ({
          ...m,
          order: i,
          status: 'pending',
          released_at: null,
        })),
        blockchain_contract_id: null, // set after Hyperledger Fabric call
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // TODO: call Hyperledger Fabric createEscrowContract chaincode
    // const blockchainTx = await this.blockchainService.createEscrowContract(data.id, dto)
    // await this.supabase.admin.from('deal_rooms').update({ blockchain_contract_id: blockchainTx.id }).eq('id', data.id)

    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'escrow',
      entity_id: data.id,
      user_id: dto.buyer_id,
      action: 'escrow_created',
      metadata: { total_amount_php: dto.total_amount_php, milestone_count: dto.milestones.length },
    })

    return data
  }

  async releaseMilestone(escrowId: string, milestoneOrder: number, adminId: string) {
    const { data: escrow } = await this.supabase.admin
      .from('deal_rooms')
      .select('*')
      .eq('id', escrowId)
      .single()

    if (!escrow) throw new NotFoundException('Escrow not found')

    const milestones: any[] = escrow.milestones ?? []

    // Property P5: Enforce milestone ordering — cannot release out of order
    for (let i = 0; i < milestoneOrder; i++) {
      if (milestones[i]?.status !== 'released') {
        throw new BadRequestException(
          `Cannot release milestone ${milestoneOrder + 1} before milestone ${i + 1} is released.`
        )
      }
    }

    const target = milestones[milestoneOrder]
    if (!target) throw new NotFoundException('Milestone not found')
    if (target.status === 'released') throw new BadRequestException('Milestone already released')

    // Mark milestone as released
    milestones[milestoneOrder] = { ...target, status: 'released', released_at: new Date().toISOString() }

    const allReleased = milestones.every(m => m.status === 'released')

    const { data, error } = await this.supabase.admin
      .from('deal_rooms')
      .update({
        milestones,
        escrow_status: allReleased ? 'completed' : 'locked',
        updated_at: new Date().toISOString(),
      })
      .eq('id', escrowId)
      .select()
      .single()

    if (error) throw error

    // TODO: call Hyperledger Fabric releaseMilestone chaincode
    // await this.blockchainService.releaseMilestone(escrow.blockchain_contract_id, milestoneOrder)

    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'escrow',
      entity_id: escrowId,
      user_id: adminId,
      action: 'milestone_released',
      metadata: { milestone_order: milestoneOrder, milestone_label: target.label },
    })

    return data
  }

  async getEscrow(escrowId: string) {
    const { data, error } = await this.supabase.client
      .from('deal_rooms')
      .select('*')
      .eq('id', escrowId)
      .single()

    if (error || !data) throw new NotFoundException('Escrow not found')
    return data
  }
}
