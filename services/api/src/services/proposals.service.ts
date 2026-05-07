import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
  ConflictException,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { NotificationsService } from './notifications.service'
import { CreateProposalDto } from './dto/create-proposal.dto'
import { Proposal, Engagement } from './types/entities'

@Injectable()
export class ProposalsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Submit a proposal for a service request.
   *
   * Business rules:
   * - Provider must have an approved provider_profile
   * - Service request must be 'open'
   * - proposal_count must be < 10 (422 if >= 10)
   * - No duplicate (request_id, provider_id) (409 if exists)
   * - Increments service_requests.proposal_count after successful insert
   */
  async create(
    requestId: string,
    dto: CreateProposalDto,
    userId: string,
  ): Promise<Proposal> {
    // Resolve the provider profile for this user
    const { data: providerProfile, error: profileError } = await this.supabase.admin
      .from('provider_profiles')
      .select('id, status')
      .eq('user_id', userId)
      .single()

    if (profileError || !providerProfile) {
      throw new ForbiddenException('You must have a provider profile to submit proposals')
    }

    if (providerProfile.status !== 'approved') {
      throw new ForbiddenException('Your provider profile must be approved to submit proposals')
    }

    // Fetch the service request
    const { data: serviceRequest, error: requestError } = await this.supabase.admin
      .from('service_requests')
      .select('id, status, proposal_count, requester_id')
      .eq('id', requestId)
      .single()

    if (requestError || !serviceRequest) {
      throw new NotFoundException('Service request not found')
    }

    if (serviceRequest.status !== 'open') {
      throw new UnprocessableEntityException('Service request is not open for proposals')
    }

    // Check proposal cap
    if (serviceRequest.proposal_count >= 10) {
      throw new UnprocessableEntityException(
        'This service request has reached the maximum number of proposals (10)',
      )
    }

    // Check for duplicate (request_id, provider_id)
    const { data: existing } = await this.supabase.admin
      .from('proposals')
      .select('id')
      .eq('request_id', requestId)
      .eq('provider_id', providerProfile.id)
      .maybeSingle()

    if (existing) {
      throw new ConflictException(
        'You have already submitted a proposal for this service request',
      )
    }

    // Insert the proposal
    const { data: proposal, error: insertError } = await this.supabase.admin
      .from('proposals')
      .insert({
        request_id: requestId,
        provider_id: providerProfile.id,
        message: dto.message,
        fee_min_php: dto.fee_min_php ?? null,
        fee_max_php: dto.fee_max_php ?? null,
        estimated_timeline: dto.estimated_timeline,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Increment proposal_count on the service request
    await this.supabase.admin
      .from('service_requests')
      .update({
        proposal_count: serviceRequest.proposal_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    // Audit trail
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'proposal',
      entity_id: proposal.id,
      user_id: userId,
      action: 'created',
      metadata: { request_id: requestId, provider_id: providerProfile.id },
    })

    // Requirement 9.1: Notify the requester that a new proposal was received
    await this.notifications.notifyNewProposalReceived({
      requesterId: serviceRequest.requester_id,
      requestId,
      proposalId: proposal.id,
    })

    return proposal
  }

  /**
   * List all proposals for a service request.
   * Only the requester who owns the service request can view all proposals.
   */
  async findAll(requestId: string, userId: string): Promise<Proposal[]> {
    // Verify the service request exists and the caller is the requester
    const { data: serviceRequest, error: requestError } = await this.supabase.admin
      .from('service_requests')
      .select('id, requester_id')
      .eq('id', requestId)
      .single()

    if (requestError || !serviceRequest) {
      throw new NotFoundException('Service request not found')
    }

    if (serviceRequest.requester_id !== userId) {
      throw new ForbiddenException('Only the requester can view proposals for this request')
    }

    const { data, error } = await this.supabase.admin
      .from('proposals')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return data ?? []
  }

  /**
   * Withdraw (delete) a proposal.
   *
   * Business rules:
   * - Only the provider who submitted can withdraw
   * - Block withdrawal if proposal status = 'accepted'
   */
  async withdraw(requestId: string, proposalId: string, userId: string): Promise<void> {
    // Resolve the provider profile for this user
    const { data: providerProfile, error: profileError } = await this.supabase.admin
      .from('provider_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (profileError || !providerProfile) {
      throw new ForbiddenException('Provider profile not found')
    }

    // Fetch the proposal
    const { data: proposal, error: proposalError } = await this.supabase.admin
      .from('proposals')
      .select('id, request_id, provider_id, status')
      .eq('id', proposalId)
      .eq('request_id', requestId)
      .single()

    if (proposalError || !proposal) {
      throw new NotFoundException('Proposal not found')
    }

    // Verify ownership
    if (proposal.provider_id !== providerProfile.id) {
      throw new ForbiddenException('You can only withdraw your own proposals')
    }

    // Block withdrawal if accepted
    if (proposal.status === 'accepted') {
      throw new ForbiddenException('Cannot withdraw an accepted proposal')
    }

    // Update status to 'withdrawn'
    const { error: updateError } = await this.supabase.admin
      .from('proposals')
      .update({
        status: 'withdrawn',
        updated_at: new Date().toISOString(),
      })
      .eq('id', proposalId)

    if (updateError) throw updateError

    // Decrement proposal_count on the service request
    const { data: serviceRequest } = await this.supabase.admin
      .from('service_requests')
      .select('proposal_count')
      .eq('id', requestId)
      .single()

    if (serviceRequest && serviceRequest.proposal_count > 0) {
      await this.supabase.admin
        .from('service_requests')
        .update({
          proposal_count: serviceRequest.proposal_count - 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
    }

    // Audit trail
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'proposal',
      entity_id: proposalId,
      user_id: userId,
      action: 'withdrawn',
      metadata: { request_id: requestId },
    })
  }

  /**
   * Accept a proposal.
   *
   * Business rules:
   * - Only the requester who owns the service request can accept
   * - Set the accepted proposal status = 'accepted'
   * - Set all other proposals for this request to status = 'rejected'
   * - Create a new engagements row with status = 'active'
   * - Set service_requests.status = 'in_progress'
   */
  async accept(
    requestId: string,
    proposalId: string,
    userId: string,
  ): Promise<Engagement> {
    // Verify the service request exists and the caller is the requester
    const { data: serviceRequest, error: requestError } = await this.supabase.admin
      .from('service_requests')
      .select('id, requester_id, status')
      .eq('id', requestId)
      .single()

    if (requestError || !serviceRequest) {
      throw new NotFoundException('Service request not found')
    }

    if (serviceRequest.requester_id !== userId) {
      throw new ForbiddenException('Only the requester can accept proposals')
    }

    if (serviceRequest.status !== 'open') {
      throw new UnprocessableEntityException(
        'Can only accept proposals on an open service request',
      )
    }

    // Fetch the proposal to accept
    const { data: proposal, error: proposalError } = await this.supabase.admin
      .from('proposals')
      .select('id, request_id, provider_id, status')
      .eq('id', proposalId)
      .eq('request_id', requestId)
      .single()

    if (proposalError || !proposal) {
      throw new NotFoundException('Proposal not found')
    }

    if (proposal.status !== 'pending') {
      throw new UnprocessableEntityException(
        'Can only accept a pending proposal',
      )
    }

    // 1. Set the accepted proposal status = 'accepted'
    const { error: acceptError } = await this.supabase.admin
      .from('proposals')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', proposalId)

    if (acceptError) throw acceptError

    // 2. Reject all other pending proposals for this request
    await this.supabase.admin
      .from('proposals')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('request_id', requestId)
      .eq('status', 'pending')
      .neq('id', proposalId)

    // 3. Create engagement row with status = 'active'
    const { data: engagement, error: engagementError } = await this.supabase.admin
      .from('engagements')
      .insert({
        request_id: requestId,
        proposal_id: proposalId,
        requester_id: userId,
        provider_id: proposal.provider_id,
        status: 'active',
      })
      .select()
      .single()

    if (engagementError) throw engagementError

    // 4. Set service_requests.status = 'in_progress'
    await this.supabase.admin
      .from('service_requests')
      .update({
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    // Audit trail
    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'proposal',
      entity_id: proposalId,
      user_id: userId,
      action: 'accepted',
      metadata: {
        request_id: requestId,
        engagement_id: engagement.id,
        provider_id: proposal.provider_id,
      },
    })

    // Requirement 9.2: Notify the provider that their proposal was accepted
    // Resolve the provider's user_id from their provider_profiles row
    const { data: providerProfile } = await this.supabase.admin
      .from('provider_profiles')
      .select('user_id')
      .eq('id', proposal.provider_id)
      .single()

    if (providerProfile?.user_id) {
      await this.notifications.notifyProposalAccepted({
        providerUserId: providerProfile.user_id,
        requestId,
        proposalId,
        engagementId: engagement.id,
      })
    }

    return engagement
  }
}
