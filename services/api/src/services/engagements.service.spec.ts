/**
 * Unit + Property-Based Tests for EngagementsService
 * Feature: services-portal
 *
 * Tests cover:
 *   Property 14: Mutual completion transitions engagement to completed
 *   Property 16: Messages are restricted to active or disputed engagements
 */

import fc from 'fast-check'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EngagementStatus = 'active' | 'completed' | 'disputed' | 'cancelled'
type ParticipantRole = 'requester' | 'provider'

interface EngagementLike {
  id: string
  requester_id: string
  provider_id: string
  status: EngagementStatus
  requester_completed_at: string | null
  provider_completed_at: string | null
  rating_window_closes_at: string | null
}

interface CompletionResult {
  engagement: EngagementLike
  error: 'not_active' | 'already_marked' | null
}

interface MessageResult {
  allowed: boolean
  error: 'not_active_or_disputed' | null
}

// ---------------------------------------------------------------------------
// Pure helper functions extracted from EngagementsService for unit testing
// ---------------------------------------------------------------------------

/**
 * Simulates the complete operation for an engagement.
 * Returns the updated engagement state or an error.
 */
function simulateComplete(
  engagement: EngagementLike,
  participantRole: ParticipantRole,
  now: string,
): CompletionResult {
  if (engagement.status !== 'active') {
    return { engagement, error: 'not_active' }
  }

  if (participantRole === 'requester' && engagement.requester_completed_at !== null) {
    return { engagement, error: 'already_marked' }
  }

  if (participantRole === 'provider' && engagement.provider_completed_at !== null) {
    return { engagement, error: 'already_marked' }
  }

  const updated: EngagementLike = { ...engagement }

  if (participantRole === 'requester') {
    updated.requester_completed_at = now
  } else {
    updated.provider_completed_at = now
  }

  // Check if both parties have now completed
  const requesterDone = updated.requester_completed_at !== null
  const providerDone = updated.provider_completed_at !== null

  if (requesterDone && providerDone) {
    updated.status = 'completed'
    // rating_window_closes_at = now + 14 days
    const closeDate = new Date(now)
    closeDate.setDate(closeDate.getDate() + 14)
    updated.rating_window_closes_at = closeDate.toISOString()
  }

  return { engagement: updated, error: null }
}

/**
 * Validates whether a message can be posted to an engagement.
 */
function canPostMessage(engagementStatus: EngagementStatus): MessageResult {
  if (engagementStatus === 'active' || engagementStatus === 'disputed') {
    return { allowed: true, error: null }
  }
  return { allowed: false, error: 'not_active_or_disputed' }
}

/**
 * Computes the rating window close date (14 days after completion).
 */
function computeRatingWindowClose(completedAt: string): string {
  const date = new Date(completedAt)
  date.setDate(date.getDate() + 14)
  return date.toISOString()
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const engagementStatusArb = fc.constantFrom<EngagementStatus>(
  'active',
  'completed',
  'disputed',
  'cancelled',
)

const participantRoleArb = fc.constantFrom<ParticipantRole>('requester', 'provider')

const isoDateArb = fc
  .date({ min: new Date('2024-01-01'), max: new Date('2030-01-01') })
  .filter((d) => !isNaN(d.getTime()))
  .map((d) => d.toISOString())

const activeEngagementArb = fc.record<EngagementLike>({
  id: fc.uuid(),
  requester_id: fc.uuid(),
  provider_id: fc.uuid(),
  status: fc.constant<EngagementStatus>('active'),
  requester_completed_at: fc.constant(null),
  provider_completed_at: fc.constant(null),
  rating_window_closes_at: fc.constant(null),
})

const engagementArb = fc.record<EngagementLike>({
  id: fc.uuid(),
  requester_id: fc.uuid(),
  provider_id: fc.uuid(),
  status: engagementStatusArb,
  requester_completed_at: fc.option(isoDateArb, { nil: null }),
  provider_completed_at: fc.option(isoDateArb, { nil: null }),
  rating_window_closes_at: fc.option(isoDateArb, { nil: null }),
})

// ---------------------------------------------------------------------------
// Property 14: Mutual completion transitions engagement to completed
// Feature: services-portal, Property 14: Mutual completion transitions engagement to completed
// Validates: Requirements 5.3, 6.7
// ---------------------------------------------------------------------------

describe('Property 14: Mutual completion transitions engagement to completed', () => {
  const now = '2025-06-01T12:00:00.000Z'

  it('should set requester_completed_at when requester marks complete', () => {
    const engagement = makeEngagement('active', null, null)
    const result = simulateComplete(engagement, 'requester', now)

    expect(result.error).toBeNull()
    expect(result.engagement.requester_completed_at).toBe(now)
    expect(result.engagement.provider_completed_at).toBeNull()
    expect(result.engagement.status).toBe('active') // not yet completed
  })

  it('should set provider_completed_at when provider marks complete', () => {
    const engagement = makeEngagement('active', null, null)
    const result = simulateComplete(engagement, 'provider', now)

    expect(result.error).toBeNull()
    expect(result.engagement.provider_completed_at).toBe(now)
    expect(result.engagement.requester_completed_at).toBeNull()
    expect(result.engagement.status).toBe('active') // not yet completed
  })

  it('should transition to completed when both parties mark complete', () => {
    // Requester already marked, now provider marks
    const engagement = makeEngagement('active', now, null)
    const result = simulateComplete(engagement, 'provider', now)

    expect(result.error).toBeNull()
    expect(result.engagement.status).toBe('completed')
    expect(result.engagement.requester_completed_at).toBe(now)
    expect(result.engagement.provider_completed_at).toBe(now)
  })

  it('should set rating_window_closes_at to 14 days after completion', () => {
    const engagement = makeEngagement('active', now, null)
    const result = simulateComplete(engagement, 'provider', now)

    expect(result.error).toBeNull()
    expect(result.engagement.rating_window_closes_at).not.toBeNull()

    // Verify it's exactly 14 days after now
    const expectedClose = computeRatingWindowClose(now)
    expect(result.engagement.rating_window_closes_at).toBe(expectedClose)
  })

  it('should reject completion if engagement is not active', () => {
    const completedEngagement = makeEngagement('completed', now, now)
    const result = simulateComplete(completedEngagement, 'requester', now)

    expect(result.error).toBe('not_active')
    expect(result.engagement.status).toBe('completed') // unchanged
  })

  it('should reject completion if engagement is disputed', () => {
    const disputedEngagement = makeEngagement('disputed', null, null)
    const result = simulateComplete(disputedEngagement, 'requester', now)

    expect(result.error).toBe('not_active')
  })

  it('should reject if requester already marked complete', () => {
    const engagement = makeEngagement('active', now, null) // requester already marked
    const result = simulateComplete(engagement, 'requester', now)

    expect(result.error).toBe('already_marked')
  })

  it('should reject if provider already marked complete', () => {
    const engagement = makeEngagement('active', null, now) // provider already marked
    const result = simulateComplete(engagement, 'provider', now)

    expect(result.error).toBe('already_marked')
  })

  it('[PBT] mutual completion always transitions status to completed', () => {
    // Feature: services-portal, Property 14: Mutual completion transitions engagement to completed
    // Validates: Requirements 5.3, 6.7
    fc.assert(
      fc.property(
        isoDateArb, // requester_completed_at (already set)
        isoDateArb, // now (provider marks complete)
        (requesterCompletedAt, now) => {
          const engagement = makeEngagement('active', requesterCompletedAt, null)
          const result = simulateComplete(engagement, 'provider', now)

          expect(result.error).toBeNull()
          expect(result.engagement.status).toBe('completed')
          expect(result.engagement.requester_completed_at).toBe(requesterCompletedAt)
          expect(result.engagement.provider_completed_at).toBe(now)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] mutual completion always sets rating_window_closes_at to completed_at + 14 days', () => {
    // Feature: services-portal, Property 14: Mutual completion transitions engagement to completed
    // Validates: Requirements 5.3, 6.7
    fc.assert(
      fc.property(
        isoDateArb, // requester_completed_at (already set)
        isoDateArb, // now (provider marks complete, triggers completion)
        (requesterCompletedAt, now) => {
          const engagement = makeEngagement('active', requesterCompletedAt, null)
          const result = simulateComplete(engagement, 'provider', now)

          expect(result.error).toBeNull()
          expect(result.engagement.rating_window_closes_at).not.toBeNull()

          // rating_window_closes_at must be exactly 14 days after the completion timestamp (now)
          const expectedClose = computeRatingWindowClose(now)
          expect(result.engagement.rating_window_closes_at).toBe(expectedClose)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] single-party completion never transitions status to completed', () => {
    // Feature: services-portal, Property 14: Mutual completion transitions engagement to completed
    // Validates: Requirements 5.3
    fc.assert(
      fc.property(
        participantRoleArb,
        isoDateArb,
        (role, now) => {
          // Start with a fresh active engagement (neither party has marked)
          const engagement = makeEngagement('active', null, null)
          const result = simulateComplete(engagement, role, now)

          expect(result.error).toBeNull()
          // Status should still be 'active' — only one party has marked
          expect(result.engagement.status).toBe('active')
          expect(result.engagement.rating_window_closes_at).toBeNull()
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] completion is rejected for any non-active engagement status', () => {
    // Feature: services-portal, Property 14: Mutual completion transitions engagement to completed
    // Validates: Requirements 5.3
    fc.assert(
      fc.property(
        fc.constantFrom<EngagementStatus>('completed', 'disputed', 'cancelled'),
        participantRoleArb,
        isoDateArb,
        (status, role, now) => {
          const engagement = makeEngagement(status, null, null)
          const result = simulateComplete(engagement, role, now)

          expect(result.error).toBe('not_active')
          expect(result.engagement.status).toBe(status) // unchanged
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 16: Messages are restricted to active or disputed engagements
// Feature: services-portal, Property 16: Messages are restricted to active or disputed engagements
// Validates: Requirements 5.6
// ---------------------------------------------------------------------------

describe('Property 16: Messages are restricted to active or disputed engagements', () => {
  it('should allow messages when engagement is active', () => {
    const result = canPostMessage('active')
    expect(result.allowed).toBe(true)
    expect(result.error).toBeNull()
  })

  it('should allow messages when engagement is disputed', () => {
    const result = canPostMessage('disputed')
    expect(result.allowed).toBe(true)
    expect(result.error).toBeNull()
  })

  it('should block messages when engagement is completed', () => {
    const result = canPostMessage('completed')
    expect(result.allowed).toBe(false)
    expect(result.error).toBe('not_active_or_disputed')
  })

  it('should block messages when engagement is cancelled', () => {
    const result = canPostMessage('cancelled')
    expect(result.allowed).toBe(false)
    expect(result.error).toBe('not_active_or_disputed')
  })

  it('[PBT] messages are always allowed for active or disputed engagements', () => {
    // Feature: services-portal, Property 16: Messages are restricted to active or disputed engagements
    // Validates: Requirements 5.6
    fc.assert(
      fc.property(
        fc.constantFrom<EngagementStatus>('active', 'disputed'),
        (status) => {
          const result = canPostMessage(status)
          expect(result.allowed).toBe(true)
          expect(result.error).toBeNull()
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] messages are always blocked for non-active and non-disputed engagements', () => {
    // Feature: services-portal, Property 16: Messages are restricted to active or disputed engagements
    // Validates: Requirements 5.6
    fc.assert(
      fc.property(
        fc.constantFrom<EngagementStatus>('completed', 'cancelled'),
        (status) => {
          const result = canPostMessage(status)
          expect(result.allowed).toBe(false)
          expect(result.error).toBe('not_active_or_disputed')
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] message gating is consistent across all engagement statuses', () => {
    // Feature: services-portal, Property 16: Messages are restricted to active or disputed engagements
    // Validates: Requirements 5.6
    fc.assert(
      fc.property(
        engagementStatusArb,
        (status) => {
          const result = canPostMessage(status)
          const isAllowedStatus = status === 'active' || status === 'disputed'

          if (isAllowedStatus) {
            expect(result.allowed).toBe(true)
            expect(result.error).toBeNull()
          } else {
            expect(result.allowed).toBe(false)
            expect(result.error).toBe('not_active_or_disputed')
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] message gating is independent of other engagement fields', () => {
    // Feature: services-portal, Property 16: Messages are restricted to active or disputed engagements
    // Validates: Requirements 5.6
    fc.assert(
      fc.property(
        engagementArb,
        (engagement) => {
          const result = canPostMessage(engagement.status)
          const isAllowedStatus =
            engagement.status === 'active' || engagement.status === 'disputed'

          expect(result.allowed).toBe(isAllowedStatus)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Helper: create a minimal EngagementLike for tests
// ---------------------------------------------------------------------------

function makeEngagement(
  status: EngagementStatus,
  requesterCompletedAt: string | null,
  providerCompletedAt: string | null,
): EngagementLike {
  return {
    id: 'engagement-1',
    requester_id: 'user-requester',
    provider_id: 'provider-1',
    status,
    requester_completed_at: requesterCompletedAt,
    provider_completed_at: providerCompletedAt,
    rating_window_closes_at: null,
  }
}
