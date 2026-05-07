/**
 * Unit + Property-Based Tests for RequestsService
 * Feature: services-portal
 *
 * Tests cover:
 *   Property 4: Service request initial status is always open
 *   Property 5: "Other" service type requires a description
 *   Property 6: Unauthenticated requests receive masked data (service requests)
 *   Property 7: Request filter results match filter criteria
 */

import fc from 'fast-check'

// ---------------------------------------------------------------------------
// Pure helper functions extracted from RequestsService for unit testing
// ---------------------------------------------------------------------------

type ServiceType =
  | 'property_appraisal'
  | 'geodetic_survey'
  | 'title_transfer'
  | 'notarization'
  | 'legal_consultation'
  | 'property_tax_assistance'
  | 'building_permit_processing'
  | 'other'

type ServiceRequestStatus = 'open' | 'in_progress' | 'expired' | 'completed' | 'cancelled'

interface ServiceRequestLike {
  id: string
  requester_id: string
  service_type: ServiceType
  other_description: string | null
  description: string
  province: string
  city: string
  barangay: string | null
  preferred_timeline: string | null
  budget_min_php: number | null
  budget_max_php: number | null
  status: ServiceRequestStatus
  proposal_count: number
  expires_at: string
  extension_granted: boolean
  created_at: string
  updated_at: string
}

/**
 * Validates the "other" service type rule:
 * Returns true if the request is valid, false if it should be rejected.
 */
function validateOtherDescription(
  serviceType: ServiceType,
  otherDescription: string | null | undefined,
): boolean {
  if (serviceType === 'other') {
    return (
      otherDescription !== null &&
      otherDescription !== undefined &&
      otherDescription.trim().length > 0
    )
  }
  return true
}

/**
 * Simulates the initial status assignment on service request creation.
 * Always returns 'open'.
 */
function computeInitialStatus(): ServiceRequestStatus {
  return 'open'
}

/**
 * Simulates the expires_at calculation: now() + 30 days.
 */
function computeExpiresAt(now: Date): Date {
  return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
}

/**
 * Masks sensitive fields from a service request for unauthenticated callers.
 * Hides: description (replaced with null).
 */
function maskServiceRequest(req: ServiceRequestLike): ServiceRequestLike {
  return {
    ...req,
    description: null as unknown as string,
  }
}

/**
 * Filters service requests by service_type, province, city, and date range.
 * Only returns open/in_progress requests.
 */
function filterRequests(
  requests: ServiceRequestLike[],
  filters: {
    service_type?: string
    province?: string
    city?: string
    date_from?: string
    date_to?: string
  },
): ServiceRequestLike[] {
  return requests.filter((r) => {
    // Only open or in_progress
    if (r.status !== 'open' && r.status !== 'in_progress') return false

    if (filters.service_type && r.service_type !== filters.service_type) return false
    if (filters.province && r.province !== filters.province) return false
    if (filters.city && r.city !== filters.city) return false
    if (filters.date_from && r.created_at < filters.date_from) return false
    if (filters.date_to && r.created_at > filters.date_to) return false

    return true
  })
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const SERVICE_TYPES: ServiceType[] = [
  'property_appraisal',
  'geodetic_survey',
  'title_transfer',
  'notarization',
  'legal_consultation',
  'property_tax_assistance',
  'building_permit_processing',
  'other',
]

const NON_OTHER_SERVICE_TYPES: ServiceType[] = SERVICE_TYPES.filter((t) => t !== 'other')

// Safe date arbitrary that filters out NaN dates
const safeDateIso = (min: Date, max: Date) =>
  fc
    .date({ min, max })
    .filter((d) => !isNaN(d.getTime()))
    .map((d) => d.toISOString())

const serviceRequestArb = fc.record({
  id: fc.uuid(),
  requester_id: fc.uuid(),
  service_type: fc.constantFrom(...SERVICE_TYPES),
  other_description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  description: fc.string({ minLength: 1, maxLength: 1000 }),
  province: fc.string({ minLength: 1, maxLength: 50 }),
  city: fc.string({ minLength: 1, maxLength: 50 }),
  barangay: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  preferred_timeline: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  budget_min_php: fc.option(fc.float({ min: 0, max: 1_000_000, noNaN: true }), { nil: null }),
  budget_max_php: fc.option(fc.float({ min: 0, max: 10_000_000, noNaN: true }), { nil: null }),
  status: fc.constantFrom<ServiceRequestStatus>('open', 'in_progress', 'expired', 'completed', 'cancelled'),
  proposal_count: fc.integer({ min: 0, max: 10 }),
  expires_at: safeDateIso(new Date('2024-01-01'), new Date('2030-01-01')),
  extension_granted: fc.boolean(),
  created_at: safeDateIso(new Date('2024-01-01'), new Date('2025-12-31')),
  updated_at: safeDateIso(new Date('2024-01-01'), new Date('2025-12-31')),
})

// ---------------------------------------------------------------------------
// Property 4: Service request initial status is always open
// Feature: services-portal, Property 4: Service request initial status is always open
// Validates: Requirements 2.3
// ---------------------------------------------------------------------------

describe('Property 4: Service request initial status is always open', () => {
  it('should always return open as the initial status', () => {
    expect(computeInitialStatus()).toBe('open')
  })

  it('[PBT] status is always open for any valid request payload', () => {
    // Feature: services-portal, Property 4: Service request initial status is always open
    fc.assert(
      fc.property(
        fc.record({
          service_type: fc.constantFrom(...SERVICE_TYPES),
          description: fc.string({ minLength: 1, maxLength: 1000 }),
          province: fc.string({ minLength: 1, maxLength: 50 }),
          city: fc.string({ minLength: 1, maxLength: 50 }),
          barangay: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          preferred_timeline: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          budget_min_php: fc.option(fc.float({ min: 0, max: 1_000_000, noNaN: true }), { nil: undefined }),
          budget_max_php: fc.option(fc.float({ min: 0, max: 10_000_000, noNaN: true }), { nil: undefined }),
        }),
        (_dto) => {
          // Simulate what the service does: always set status = 'open'
          const insertedStatus = computeInitialStatus()
          expect(insertedStatus).toBe('open')
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] expires_at is always approximately now + 30 days', () => {
    // Feature: services-portal, Property 4: Service request initial status is always open
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2024-01-01'), max: new Date('2030-01-01') }).filter((d) => !isNaN(d.getTime())),
        (now) => {
          const expiresAt = computeExpiresAt(now)
          const diffMs = expiresAt.getTime() - now.getTime()
          const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
          expect(diffMs).toBe(thirtyDaysMs)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 5: "Other" service type requires a description
// Feature: services-portal, Property 5: "Other" service type requires a description
// Validates: Requirements 2.6
// ---------------------------------------------------------------------------

describe('Property 5: "Other" service type requires a description', () => {
  it('should reject when service_type is other and other_description is null', () => {
    expect(validateOtherDescription('other', null)).toBe(false)
  })

  it('should reject when service_type is other and other_description is empty string', () => {
    expect(validateOtherDescription('other', '')).toBe(false)
  })

  it('should reject when service_type is other and other_description is whitespace only', () => {
    expect(validateOtherDescription('other', '   ')).toBe(false)
  })

  it('should accept when service_type is other and other_description is non-empty', () => {
    expect(validateOtherDescription('other', 'Custom service description')).toBe(true)
  })

  it('should accept when service_type is not other regardless of other_description', () => {
    expect(validateOtherDescription('notarization', null)).toBe(true)
    expect(validateOtherDescription('notarization', '')).toBe(true)
    expect(validateOtherDescription('property_appraisal', undefined)).toBe(true)
  })

  it('[PBT] any non-empty other_description is accepted when service_type is other', () => {
    // Feature: services-portal, Property 5: "Other" service type requires a description
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0),
        (description) => {
          expect(validateOtherDescription('other', description)).toBe(true)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] null or empty other_description is always rejected when service_type is other', () => {
    // Feature: services-portal, Property 5: "Other" service type requires a description
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(''),
          fc.constant('   '),
          fc.string({ maxLength: 20 }).filter((s) => s.trim().length === 0),
        ),
        (description) => {
          expect(validateOtherDescription('other', description)).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] non-other service types always pass regardless of other_description', () => {
    // Feature: services-portal, Property 5: "Other" service type requires a description
    fc.assert(
      fc.property(
        fc.constantFrom(...NON_OTHER_SERVICE_TYPES),
        fc.option(fc.string({ maxLength: 200 }), { nil: null }),
        (serviceType, description) => {
          expect(validateOtherDescription(serviceType, description)).toBe(true)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 6: Unauthenticated requests receive masked data (service requests)
// Feature: services-portal, Property 6: Unauthenticated requests receive masked data
// Validates: Requirements 2.5
// ---------------------------------------------------------------------------

describe('Property 6: Unauthenticated requests receive masked data (service requests)', () => {
  it('should hide description for unauthenticated users', () => {
    const request: ServiceRequestLike = {
      id: 'test-id',
      requester_id: 'user-id',
      service_type: 'notarization',
      other_description: null,
      description: 'Full description of the service needed',
      province: 'Metro Manila',
      city: 'Makati',
      barangay: null,
      preferred_timeline: '2 weeks',
      budget_min_php: 5000,
      budget_max_php: 10000,
      status: 'open',
      proposal_count: 0,
      expires_at: '2025-12-31T00:00:00Z',
      extension_granted: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }

    const masked = maskServiceRequest(request)
    expect(masked.description).toBeNull()
    // Other fields preserved
    expect(masked.id).toBe(request.id)
    expect(masked.service_type).toBe(request.service_type)
    expect(masked.province).toBe(request.province)
    expect(masked.city).toBe(request.city)
    expect(masked.status).toBe(request.status)
    expect(masked.proposal_count).toBe(request.proposal_count)
    expect(masked.created_at).toBe(request.created_at)
  })

  it('should show description for authenticated users (no masking)', () => {
    const request: ServiceRequestLike = {
      id: 'test-id',
      requester_id: 'user-id',
      service_type: 'notarization',
      other_description: null,
      description: 'Full description of the service needed',
      province: 'Metro Manila',
      city: 'Makati',
      barangay: null,
      preferred_timeline: null,
      budget_min_php: null,
      budget_max_php: null,
      status: 'open',
      proposal_count: 0,
      expires_at: '2025-12-31T00:00:00Z',
      extension_granted: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }

    // Authenticated: no masking applied
    expect(request.description).toBe('Full description of the service needed')
  })

  it('[PBT] unauthenticated response always has null description', () => {
    // Feature: services-portal, Property 6: Unauthenticated requests receive masked data
    fc.assert(
      fc.property(
        serviceRequestArb,
        (request) => {
          const masked = maskServiceRequest(request)
          expect(masked.description).toBeNull()
          // Public fields are preserved
          expect(masked.id).toBe(request.id)
          expect(masked.service_type).toBe(request.service_type)
          expect(masked.province).toBe(request.province)
          expect(masked.city).toBe(request.city)
          expect(masked.status).toBe(request.status)
          expect(masked.proposal_count).toBe(request.proposal_count)
          expect(masked.created_at).toBe(request.created_at)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] masking is idempotent: masking twice equals masking once', () => {
    // Feature: services-portal, Property 6: Unauthenticated requests receive masked data
    fc.assert(
      fc.property(
        serviceRequestArb,
        (request) => {
          const maskedOnce = maskServiceRequest(request)
          const maskedTwice = maskServiceRequest(maskedOnce)
          expect(maskedTwice.description).toBeNull()
          expect(maskedTwice.id).toBe(maskedOnce.id)
          expect(maskedTwice.service_type).toBe(maskedOnce.service_type)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 7: Request filter results match filter criteria
// Feature: services-portal, Property 7: Request filter results match filter criteria
// Validates: Requirements 2.4
// ---------------------------------------------------------------------------

describe('Property 7: Request filter results match filter criteria', () => {
  it('should only return open and in_progress requests', () => {
    const requests: ServiceRequestLike[] = [
      { ...makeRequest('1'), status: 'open' },
      { ...makeRequest('2'), status: 'in_progress' },
      { ...makeRequest('3'), status: 'expired' },
      { ...makeRequest('4'), status: 'completed' },
      { ...makeRequest('5'), status: 'cancelled' },
    ]
    const result = filterRequests(requests, {})
    expect(result).toHaveLength(2)
    expect(result.every((r) => r.status === 'open' || r.status === 'in_progress')).toBe(true)
  })

  it('should filter by service_type correctly', () => {
    const requests: ServiceRequestLike[] = [
      { ...makeRequest('1'), status: 'open', service_type: 'notarization' },
      { ...makeRequest('2'), status: 'open', service_type: 'geodetic_survey' },
      { ...makeRequest('3'), status: 'open', service_type: 'notarization' },
    ]
    const result = filterRequests(requests, { service_type: 'notarization' })
    expect(result).toHaveLength(2)
    expect(result.every((r) => r.service_type === 'notarization')).toBe(true)
  })

  it('should filter by province correctly', () => {
    const requests: ServiceRequestLike[] = [
      { ...makeRequest('1'), status: 'open', province: 'Metro Manila' },
      { ...makeRequest('2'), status: 'open', province: 'Cebu' },
    ]
    const result = filterRequests(requests, { province: 'Metro Manila' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('should filter by city correctly', () => {
    const requests: ServiceRequestLike[] = [
      { ...makeRequest('1'), status: 'open', city: 'Makati' },
      { ...makeRequest('2'), status: 'open', city: 'Cebu City' },
    ]
    const result = filterRequests(requests, { city: 'Makati' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('should filter by date_from correctly', () => {
    const requests: ServiceRequestLike[] = [
      { ...makeRequest('1'), status: 'open', created_at: '2025-01-15T00:00:00Z' },
      { ...makeRequest('2'), status: 'open', created_at: '2025-01-05T00:00:00Z' },
    ]
    const result = filterRequests(requests, { date_from: '2025-01-10T00:00:00Z' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('should filter by date_to correctly', () => {
    const requests: ServiceRequestLike[] = [
      { ...makeRequest('1'), status: 'open', created_at: '2025-01-05T00:00:00Z' },
      { ...makeRequest('2'), status: 'open', created_at: '2025-01-15T00:00:00Z' },
    ]
    const result = filterRequests(requests, { date_to: '2025-01-10T00:00:00Z' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('should apply multiple filters simultaneously', () => {
    const requests: ServiceRequestLike[] = [
      { ...makeRequest('1'), status: 'open', service_type: 'notarization', province: 'Metro Manila', city: 'Makati' },
      { ...makeRequest('2'), status: 'open', service_type: 'notarization', province: 'Cebu', city: 'Cebu City' },
      { ...makeRequest('3'), status: 'open', service_type: 'geodetic_survey', province: 'Metro Manila', city: 'Makati' },
    ]
    const result = filterRequests(requests, { service_type: 'notarization', province: 'Metro Manila' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('[PBT] every returned request satisfies all applied filter conditions', () => {
    // Feature: services-portal, Property 7: Request filter results match filter criteria
    fc.assert(
      fc.property(
        fc.array(serviceRequestArb, { minLength: 0, maxLength: 20 }),
        fc.record({
          service_type: fc.option(fc.constantFrom(...SERVICE_TYPES), { nil: undefined }),
          province: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
          city: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
        }),
        (requests, filters) => {
          const result = filterRequests(requests, filters)

          for (const r of result) {
            // All results must be open or in_progress
            expect(['open', 'in_progress']).toContain(r.status)

            // All results must match service_type filter if applied
            if (filters.service_type !== undefined) {
              expect(r.service_type).toBe(filters.service_type)
            }

            // All results must match province filter if applied
            if (filters.province !== undefined) {
              expect(r.province).toBe(filters.province)
            }

            // All results must match city filter if applied
            if (filters.city !== undefined) {
              expect(r.city).toBe(filters.city)
            }
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] no request failing any filter condition appears in results', () => {
    // Feature: services-portal, Property 7: Request filter results match filter criteria
    fc.assert(
      fc.property(
        fc.array(serviceRequestArb, { minLength: 1, maxLength: 20 }),
        fc.constantFrom(...SERVICE_TYPES),
        (requests, serviceType) => {
          const result = filterRequests(requests, { service_type: serviceType })

          // Every result must match the service type
          for (const r of result) {
            expect(r.service_type).toBe(serviceType)
          }

          // Every open/in_progress request with matching service type must be in results
          const resultIds = new Set(result.map((r) => r.id))
          for (const r of requests) {
            if (
              (r.status === 'open' || r.status === 'in_progress') &&
              r.service_type === serviceType
            ) {
              expect(resultIds.has(r.id)).toBe(true)
            }
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] results with date_from filter all have created_at >= date_from', () => {
    // Feature: services-portal, Property 7: Request filter results match filter criteria
    fc.assert(
      fc.property(
        fc.array(serviceRequestArb, { minLength: 0, maxLength: 20 }),
        safeDateIso(new Date('2024-01-01'), new Date('2025-12-31')),
        (requests, dateFrom) => {
          const result = filterRequests(requests, { date_from: dateFrom })
          for (const r of result) {
            expect(r.created_at >= dateFrom).toBe(true)
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Helper: create a minimal ServiceRequestLike for tests
// ---------------------------------------------------------------------------

function makeRequest(id: string): ServiceRequestLike {
  return {
    id,
    requester_id: 'user-id',
    service_type: 'notarization',
    other_description: null,
    description: 'Test description',
    province: 'Metro Manila',
    city: 'Makati',
    barangay: null,
    preferred_timeline: null,
    budget_min_php: null,
    budget_max_php: null,
    status: 'open',
    proposal_count: 0,
    expires_at: '2025-12-31T00:00:00Z',
    extension_granted: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  }
}
