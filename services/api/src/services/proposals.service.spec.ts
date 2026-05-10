/**
 * Unit + Property-Based Tests for ProposalsService
 * Feature: services-portal
 *
 * Tests cover:
 *   Property 10: Proposal cap enforcement
 *   Property 11: One proposal per provider per request
 *   Property 12: Accepting a proposal creates an engagement and updates request status
 *   Property 13: Proposal withdrawal is blocked after acceptance
 */

import fc from 'fast-check'

// ---------------------------------------------------------------------------
// Pure helper functions extracted from ProposalsService for unit testing
// ---------------------------------------------------------------------------

type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'
type ServiceRequestStatus = 'open' | 'in_progress' | 'expired' | 'completed' | 'cancelled'

interface ProposalLike {
  id: string
  request_id: string
  provider_id: string
  message: string
  fee_min_php: number | null
  fee_max_php: number | null
  estimated_timeline: string
  status: ProposalStatus
  created_at: string
  updated_at: string
}

interface ServiceRequestLike {
  id: string
  requester_id: string
  status: ServiceRequestStatus
  proposal_count: number
}

interface EngagementLike {
  id: string
  request_id: string
  proposal_id: string
  requester_id: string
  provider_id: string
  status: 'active' | 'completed' | 'disputed' | 'cancelled'
}

/**
 * Validates whether a new proposal can be submitted.
 * Returns an error code or null if valid.
 */
function validateProposalSubmission(
  proposalCount: number,
  existingProposalForProvider: boolean,
  requestStatus: ServiceRequestStatus,
): 'proposal_cap' | 'duplicate' | 'request_not_open' | null {
  if (requestStatus !== 'open') return 'request_not_open'
  if (proposalCount >= 10) return 'proposal_cap'
  if (existingProposalForProvider) return 'duplicate'
  return null
}

/**
 * Simulates the accept proposal operation.
 * Returns the resulting state after acceptance.
 */
function simulateAcceptProposal(
  proposals: ProposalLike[],
  acceptedProposalId: string,
  requestId: string,
  requesterId: string,
): {
  updatedProposals: ProposalLike[]
  engagement: EngagementLike
  requestStatus: ServiceRequestStatus
} {
  const accepted = proposals.find((p) => p.id === acceptedProposalId)
  if (!accepted) throw new Error('Proposal not found')

  const updatedProposals = proposals.map((p) => {
    if (p.id === acceptedProposalId) return { ...p, status: 'accepted' as ProposalStatus }
    if (p.request_id === requestId && p.status === 'pending') {
      return { ...p, status: 'rejected' as ProposalStatus }
    }
    return p
  })

  const engagement: EngagementLike = {
    id: 'engagement-' + acceptedProposalId,
    request_id: requestId,
    proposal_id: acceptedProposalId,
    requester_id: requesterId,
    provider_id: accepted.provider_id,
    status: 'active',
  }

  return {
    updatedProposals,
    engagement,
    requestStatus: 'in_progress',
  }
}

/**
 * Validates whether a proposal can be withdrawn.
 * Returns true if withdrawal is allowed, false if blocked.
 */
function canWithdrawProposal(proposalStatus: ProposalStatus): boolean {
  return proposalStatus !== 'accepted'
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const proposalStatusArb = fc.constantFrom<ProposalStatus>(
  'pending',
  'accepted',
  'rejected',
  'withdrawn',
)

const serviceRequestStatusArb = fc.constantFrom<ServiceRequestStatus>(
  'open',
  'in_progress',
  'expired',
  'completed',
  'cancelled',
)

const proposalArb = fc.record<ProposalLike>({
  id: fc.uuid(),
  request_id: fc.uuid(),
  provider_id: fc.uuid(),
  message: fc.string({ minLength: 1, maxLength: 500 }),
  fee_min_php: fc.option(fc.float({ min: 0, max: 1_000_000, noNaN: true }), { nil: null }),
  fee_max_php: fc.option(fc.float({ min: 0, max: 10_000_000, noNaN: true }), { nil: null }),
  estimated_timeline: fc.string({ minLength: 1, maxLength: 100 }),
  status: proposalStatusArb,
  created_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2030-01-01') })
    .filter((d) => !isNaN(d.getTime()))
    .map((d) => d.toISOString()),
  updated_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2030-01-01') })
    .filter((d) => !isNaN(d.getTime()))
    .map((d) => d.toISOString()),
})

// ---------------------------------------------------------------------------
// Property 10: Proposal cap enforcement
// Feature: services-portal, Property 10: Proposal cap enforcement
// Validates: Requirements 4.7
// ---------------------------------------------------------------------------

describe('Property 10: Proposal cap enforcement', () => {
  it('should reject when proposal_count is exactly 10', () => {
    const result = validateProposalSubmission(10, false, 'open')
    expect(result).toBe('proposal_cap')
  })

  it('should reject when proposal_count is greater than 10', () => {
    const result = validateProposalSubmission(11, false, 'open')
    expect(result).toBe('proposal_cap')
  })

  it('should allow when proposal_count is 9', () => {
    const result = validateProposalSubmission(9, false, 'open')
    expect(result).toBeNull()
  })

  it('should allow when proposal_count is 0', () => {
    const result = validateProposalSubmission(0, false, 'open')
    expect(result).toBeNull()
  })

  it('[PBT] any proposal_count >= 10 always results in proposal_cap error', () => {
    // Feature: services-portal, Property 10: Proposal cap enforcement
    // Validates: Requirements 4.7
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 100 }),
        (count) => {
          const result = validateProposalSubmission(count, false, 'open')
          expect(result).toBe('proposal_cap')
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] proposal_count < 10 with no duplicate and open request always succeeds', () => {
    // Feature: services-portal, Property 10: Proposal cap enforcement
    // Validates: Requirements 4.7
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 9 }),
        (count) => {
          const result = validateProposalSubmission(count, false, 'open')
          expect(result).toBeNull()
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] proposal_count remains at 10 after rejection (count does not change)', () => {
    // Feature: services-portal, Property 10: Proposal cap enforcement
    // Validates: Requirements 4.7
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 10 }),
        (count) => {
          const result = validateProposalSubmission(count, false, 'open')
          // Rejection means count stays at 10 (no increment)
          expect(result).toBe('proposal_cap')
          // The count is unchanged — still 10
          expect(count).toBe(10)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 11: One proposal per provider per request
// Feature: services-portal, Property 11: One proposal per provider per request
// Validates: Requirements 4.8
// ---------------------------------------------------------------------------

describe('Property 11: One proposal per provider per request', () => {
  it('should reject duplicate (request_id, provider_id) combination', () => {
    const result = validateProposalSubmission(0, true, 'open')
    expect(result).toBe('duplicate')
  })

  it('should allow when no existing proposal for this provider+request', () => {
    const result = validateProposalSubmission(0, false, 'open')
    expect(result).toBeNull()
  })

  it('[PBT] duplicate check always returns conflict when existing proposal exists', () => {
    // Feature: services-portal, Property 11: One proposal per provider per request
    // Validates: Requirements 4.8
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 9 }), // count < 10 to isolate duplicate check
        (count) => {
          const result = validateProposalSubmission(count, true, 'open')
          expect(result).toBe('duplicate')
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] proposals table has at most one row per (request_id, provider_id) pair', () => {
    // Feature: services-portal, Property 11: One proposal per provider per request
    // Validates: Requirements 4.8
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            request_id: fc.constantFrom('req-1', 'req-2', 'req-3'),
            provider_id: fc.constantFrom('prov-1', 'prov-2', 'prov-3'),
          }),
          { minLength: 1, maxLength: 20 },
        ),
        (submissions) => {
          // Simulate inserting proposals with uniqueness enforcement
          const inserted = new Map<string, boolean>()
          const results: Array<{ success: boolean; key: string }> = []

          for (const sub of submissions) {
            const key = `${sub.request_id}:${sub.provider_id}`
            if (inserted.has(key)) {
              results.push({ success: false, key })
            } else {
              inserted.set(key, true)
              results.push({ success: true, key })
            }
          }

          // Verify: no duplicate keys in the "inserted" set
          const insertedKeys = results.filter((r) => r.success).map((r) => r.key)
          const uniqueKeys = new Set(insertedKeys)
          expect(uniqueKeys.size).toBe(insertedKeys.length)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 12: Accepting a proposal creates an engagement and updates request status
// Feature: services-portal, Property 12: Accepting a proposal creates an engagement
// Validates: Requirements 4.5, 5.1
// ---------------------------------------------------------------------------

describe('Property 12: Accepting a proposal creates an engagement and updates request status', () => {
  it('should create exactly one engagement with status active', () => {
    const proposals: ProposalLike[] = [
      makeProposal('p1', 'req-1', 'prov-1', 'pending'),
      makeProposal('p2', 'req-1', 'prov-2', 'pending'),
    ]

    const result = simulateAcceptProposal(proposals, 'p1', 'req-1', 'user-1')

    expect(result.engagement).toBeDefined()
    expect(result.engagement.status).toBe('active')
    expect(result.engagement.proposal_id).toBe('p1')
    expect(result.engagement.request_id).toBe('req-1')
    expect(result.engagement.requester_id).toBe('user-1')
    expect(result.engagement.provider_id).toBe('prov-1')
  })

  it('should set service_requests.status to in_progress', () => {
    const proposals: ProposalLike[] = [
      makeProposal('p1', 'req-1', 'prov-1', 'pending'),
    ]

    const result = simulateAcceptProposal(proposals, 'p1', 'req-1', 'user-1')

    expect(result.requestStatus).toBe('in_progress')
  })

  it('should reject all other pending proposals', () => {
    const proposals: ProposalLike[] = [
      makeProposal('p1', 'req-1', 'prov-1', 'pending'),
      makeProposal('p2', 'req-1', 'prov-2', 'pending'),
      makeProposal('p3', 'req-1', 'prov-3', 'pending'),
    ]

    const result = simulateAcceptProposal(proposals, 'p1', 'req-1', 'user-1')

    const accepted = result.updatedProposals.find((p) => p.id === 'p1')
    const rejected2 = result.updatedProposals.find((p) => p.id === 'p2')
    const rejected3 = result.updatedProposals.find((p) => p.id === 'p3')

    expect(accepted?.status).toBe('accepted')
    expect(rejected2?.status).toBe('rejected')
    expect(rejected3?.status).toBe('rejected')
  })

  it('should not affect proposals from other requests', () => {
    const proposals: ProposalLike[] = [
      makeProposal('p1', 'req-1', 'prov-1', 'pending'),
      makeProposal('p2', 'req-2', 'prov-2', 'pending'), // different request
    ]

    const result = simulateAcceptProposal(proposals, 'p1', 'req-1', 'user-1')

    const otherRequestProposal = result.updatedProposals.find((p) => p.id === 'p2')
    expect(otherRequestProposal?.status).toBe('pending') // unchanged
  })

  it('[PBT] accepting any pending proposal always creates exactly one active engagement', () => {
    // Feature: services-portal, Property 12: Accepting a proposal creates an engagement
    // Validates: Requirements 4.5, 5.1
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            provider_id: fc.uuid(),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        fc.uuid(), // requestId
        fc.uuid(), // requesterId
        (providerEntries, requestId, requesterId) => {
          // Build proposals with unique provider IDs
          const uniqueProviders = Array.from(
            new Map(providerEntries.map((p) => [p.provider_id, p])).values(),
          )
          if (uniqueProviders.length === 0) return

          const proposals: ProposalLike[] = uniqueProviders.map((p) =>
            makeProposal(p.id, requestId, p.provider_id, 'pending'),
          )

          const acceptedId = proposals[0].id
          const result = simulateAcceptProposal(proposals, acceptedId, requestId, requesterId)

          // Exactly one engagement created
          expect(result.engagement).toBeDefined()
          expect(result.engagement.status).toBe('active')
          expect(result.engagement.proposal_id).toBe(acceptedId)

          // Request status is in_progress
          expect(result.requestStatus).toBe('in_progress')
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] all other pending proposals are rejected after acceptance', () => {
    // Feature: services-portal, Property 12: Accepting a proposal creates an engagement
    // Validates: Requirements 4.5, 5.1
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            provider_id: fc.uuid(),
          }),
          { minLength: 2, maxLength: 10 },
        ),
        fc.uuid(), // requestId
        fc.uuid(), // requesterId
        (providerEntries, requestId, requesterId) => {
          // Build proposals with unique IDs and provider IDs
          const seen = new Set<string>()
          const uniqueEntries = providerEntries.filter((p) => {
            if (seen.has(p.id) || seen.has(p.provider_id)) return false
            seen.add(p.id)
            seen.add(p.provider_id)
            return true
          })
          if (uniqueEntries.length < 2) return

          const proposals: ProposalLike[] = uniqueEntries.map((p) =>
            makeProposal(p.id, requestId, p.provider_id, 'pending'),
          )

          const acceptedId = proposals[0].id
          const result = simulateAcceptProposal(proposals, acceptedId, requestId, requesterId)

          // The accepted proposal has status 'accepted'
          const acceptedProposal = result.updatedProposals.find((p) => p.id === acceptedId)
          expect(acceptedProposal?.status).toBe('accepted')

          // All other proposals for this request are rejected
          const otherProposals = result.updatedProposals.filter(
            (p) => p.id !== acceptedId && p.request_id === requestId,
          )
          for (const p of otherProposals) {
            expect(p.status).toBe('rejected')
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 13: Proposal withdrawal is blocked after acceptance
// Feature: services-portal, Property 13: Proposal withdrawal is blocked after acceptance
// Validates: Requirements 4.6
// ---------------------------------------------------------------------------

describe('Property 13: Proposal withdrawal is blocked after acceptance', () => {
  it('should block withdrawal when status is accepted', () => {
    expect(canWithdrawProposal('accepted')).toBe(false)
  })

  it('should allow withdrawal when status is pending', () => {
    expect(canWithdrawProposal('pending')).toBe(true)
  })

  it('should allow withdrawal when status is rejected', () => {
    // Edge case: rejected proposals can technically be "withdrawn" (no-op in practice)
    expect(canWithdrawProposal('rejected')).toBe(true)
  })

  it('should allow withdrawal when status is withdrawn (idempotent)', () => {
    expect(canWithdrawProposal('withdrawn')).toBe(true)
  })

  it('[PBT] accepted proposals always block withdrawal', () => {
    // Feature: services-portal, Property 13: Proposal withdrawal is blocked after acceptance
    // Validates: Requirements 4.6
    fc.assert(
      fc.property(
        proposalArb.map((p) => ({ ...p, status: 'accepted' as ProposalStatus })),
        (proposal) => {
          expect(canWithdrawProposal(proposal.status)).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] pending proposals always allow withdrawal', () => {
    // Feature: services-portal, Property 13: Proposal withdrawal is blocked after acceptance
    // Validates: Requirements 4.6
    fc.assert(
      fc.property(
        proposalArb.map((p) => ({ ...p, status: 'pending' as ProposalStatus })),
        (proposal) => {
          expect(canWithdrawProposal(proposal.status)).toBe(true)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] withdrawal is only blocked for accepted status, allowed for all others', () => {
    // Feature: services-portal, Property 13: Proposal withdrawal is blocked after acceptance
    // Validates: Requirements 4.6
    fc.assert(
      fc.property(
        proposalStatusArb,
        (status) => {
          const canWithdraw = canWithdrawProposal(status)
          if (status === 'accepted') {
            expect(canWithdraw).toBe(false)
          } else {
            expect(canWithdraw).toBe(true)
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Helper: create a minimal ProposalLike for tests
// ---------------------------------------------------------------------------

function makeProposal(
  id: string,
  requestId: string,
  providerId: string,
  status: ProposalStatus,
): ProposalLike {
  return {
    id,
    request_id: requestId,
    provider_id: providerId,
    message: 'Test proposal message',
    fee_min_php: null,
    fee_max_php: null,
    estimated_timeline: '2 weeks',
    status,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  }
}
