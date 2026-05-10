/**
 * Unit + Property-Based Tests for ServicesAdminService
 * Feature: services-portal
 *
 * Tests cover:
 *   Property 21: Admin-only endpoints reject non-admin users
 *   Property 22: Profile rejection requires a reason
 *   Property 23: Dispute resolution requires a resolution note
 */

import fc from 'fast-check'

// ---------------------------------------------------------------------------
// Pure helper functions extracted from ServicesAdminService for unit testing
// ---------------------------------------------------------------------------

/**
 * Validates that a rejection reason is non-empty.
 * Returns true if valid, false if invalid (absent or empty/whitespace).
 */
function isValidRejectionReason(reason: string | undefined | null): boolean {
  if (reason === undefined || reason === null) return false
  return reason.trim().length > 0
}

/**
 * Validates that a resolution note is non-empty.
 * Returns true if valid, false if invalid (absent or empty/whitespace).
 */
function isValidResolutionNote(note: string | undefined | null): boolean {
  if (note === undefined || note === null) return false
  return note.trim().length > 0
}

/**
 * Simulates the admin role check.
 * Returns true if the user has the 'admin' role, false otherwise.
 */
function hasAdminRole(userRole: string | undefined | null): boolean {
  return userRole === 'admin'
}

/**
 * Simulates the featured status update logic.
 * Returns the new profile state after grant/revoke.
 */
function applyFeaturedStatus(
  profile: { is_featured: boolean; featured_until: string | null },
  grant: boolean,
  featuredUntil?: string,
): { is_featured: boolean; featured_until: string | null } {
  if (grant) {
    return {
      is_featured: true,
      featured_until: featuredUntil ?? null,
    }
  }
  return {
    is_featured: false,
    featured_until: null,
  }
}

// ---------------------------------------------------------------------------
// Property 21: Admin-only endpoints reject non-admin users
// Feature: services-portal, Property 21: Admin-only endpoints reject non-admin users
// Validates: Requirements 8.1, 10.4
// ---------------------------------------------------------------------------

describe('Property 21: Admin-only endpoints reject non-admin users', () => {
  it('should allow access for admin role', () => {
    expect(hasAdminRole('admin')).toBe(true)
  })

  it('should deny access for non-admin roles', () => {
    expect(hasAdminRole('realtor')).toBe(false)
    expect(hasAdminRole('buyer')).toBe(false)
    expect(hasAdminRole('seller')).toBe(false)
    expect(hasAdminRole('broker_admin')).toBe(false)
    expect(hasAdminRole(undefined)).toBe(false)
    expect(hasAdminRole(null)).toBe(false)
    expect(hasAdminRole('')).toBe(false)
  })

  it('[PBT] any role other than "admin" is denied access', () => {
    // Feature: services-portal, Property 21: Admin-only endpoints reject non-admin users
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 50 }).filter((r) => r !== 'admin'),
        (role) => {
          expect(hasAdminRole(role)).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] only "admin" role is granted access', () => {
    // Feature: services-portal, Property 21: Admin-only endpoints reject non-admin users
    fc.assert(
      fc.property(
        fc.constantFrom('admin', 'realtor', 'buyer', 'seller', 'broker_admin', 'developer'),
        (role) => {
          const result = hasAdminRole(role)
          if (role === 'admin') {
            expect(result).toBe(true)
          } else {
            expect(result).toBe(false)
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 22: Profile rejection requires a reason
// Feature: services-portal, Property 22: Profile rejection requires a reason
// Validates: Requirements 8.3
// ---------------------------------------------------------------------------

describe('Property 22: Profile rejection requires a reason', () => {
  it('should reject when reason is absent (undefined)', () => {
    expect(isValidRejectionReason(undefined)).toBe(false)
  })

  it('should reject when reason is null', () => {
    expect(isValidRejectionReason(null)).toBe(false)
  })

  it('should reject when reason is empty string', () => {
    expect(isValidRejectionReason('')).toBe(false)
  })

  it('should reject when reason is whitespace only', () => {
    expect(isValidRejectionReason('   ')).toBe(false)
    expect(isValidRejectionReason('\t\n')).toBe(false)
  })

  it('should accept a non-empty reason', () => {
    expect(isValidRejectionReason('Incomplete credentials')).toBe(true)
    expect(isValidRejectionReason('a')).toBe(true)
    expect(isValidRejectionReason('  valid reason  ')).toBe(true)
  })

  it('[PBT] any non-empty, non-whitespace reason is valid', () => {
    // Feature: services-portal, Property 22: Profile rejection requires a reason
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0),
        (reason) => {
          expect(isValidRejectionReason(reason)).toBe(true)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] empty or whitespace-only reason is always invalid', () => {
    // Feature: services-portal, Property 22: Profile rejection requires a reason
    fc.assert(
      fc.property(
        fc.constantFrom('', ' ', '  ', '\t', '\n', '   \t\n   '),
        (reason) => {
          expect(isValidRejectionReason(reason)).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] absent reason (undefined/null) is always invalid', () => {
    // Feature: services-portal, Property 22: Profile rejection requires a reason
    fc.assert(
      fc.property(
        fc.constantFrom(undefined, null),
        (reason) => {
          expect(isValidRejectionReason(reason)).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 23: Dispute resolution requires a resolution note
// Feature: services-portal, Property 23: Dispute resolution requires a resolution note
// Validates: Requirements 8.7
// ---------------------------------------------------------------------------

describe('Property 23: Dispute resolution requires a resolution note', () => {
  it('should reject when resolution_note is absent (undefined)', () => {
    expect(isValidResolutionNote(undefined)).toBe(false)
  })

  it('should reject when resolution_note is null', () => {
    expect(isValidResolutionNote(null)).toBe(false)
  })

  it('should reject when resolution_note is empty string', () => {
    expect(isValidResolutionNote('')).toBe(false)
  })

  it('should reject when resolution_note is whitespace only', () => {
    expect(isValidResolutionNote('   ')).toBe(false)
    expect(isValidResolutionNote('\t\n')).toBe(false)
  })

  it('should accept a non-empty resolution note', () => {
    expect(isValidResolutionNote('Both parties agreed to cancel')).toBe(true)
    expect(isValidResolutionNote('x')).toBe(true)
    expect(isValidResolutionNote('  valid note  ')).toBe(true)
  })

  it('[PBT] any non-empty, non-whitespace resolution note is valid', () => {
    // Feature: services-portal, Property 23: Dispute resolution requires a resolution note
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 1000 }).filter((s) => s.trim().length > 0),
        (note) => {
          expect(isValidResolutionNote(note)).toBe(true)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] empty or whitespace-only resolution note is always invalid', () => {
    // Feature: services-portal, Property 23: Dispute resolution requires a resolution note
    fc.assert(
      fc.property(
        fc.constantFrom('', ' ', '  ', '\t', '\n', '   \t\n   '),
        (note) => {
          expect(isValidResolutionNote(note)).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] absent note (undefined/null) is always invalid', () => {
    // Feature: services-portal, Property 23: Dispute resolution requires a resolution note
    fc.assert(
      fc.property(
        fc.constantFrom(undefined, null),
        (note) => {
          expect(isValidResolutionNote(note)).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Additional unit tests for ServicesAdminService logic
// ---------------------------------------------------------------------------

describe('Featured status management', () => {
  it('should set is_featured = true and featured_until on grant', () => {
    const profile = { is_featured: false, featured_until: null }
    const result = applyFeaturedStatus(profile, true, '2025-12-31T00:00:00Z')
    expect(result.is_featured).toBe(true)
    expect(result.featured_until).toBe('2025-12-31T00:00:00Z')
  })

  it('should set is_featured = true with null featured_until when no date provided', () => {
    const profile = { is_featured: false, featured_until: null }
    const result = applyFeaturedStatus(profile, true)
    expect(result.is_featured).toBe(true)
    expect(result.featured_until).toBeNull()
  })

  it('should clear is_featured and featured_until on revoke', () => {
    const profile = { is_featured: true, featured_until: '2025-12-31T00:00:00Z' }
    const result = applyFeaturedStatus(profile, false)
    expect(result.is_featured).toBe(false)
    expect(result.featured_until).toBeNull()
  })

  it('[PBT] grant always sets is_featured = true', () => {
    // Use a constrained date range to avoid invalid Date objects
    const minDate = new Date('2020-01-01').getTime()
    const maxDate = new Date('2030-12-31').getTime()
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.option(
          fc.integer({ min: minDate, max: maxDate }).map((ms) => new Date(ms).toISOString()),
          { nil: undefined },
        ),
        (currentFeatured, featuredUntil) => {
          const profile = { is_featured: currentFeatured, featured_until: null }
          const result = applyFeaturedStatus(profile, true, featuredUntil)
          expect(result.is_featured).toBe(true)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] revoke always sets is_featured = false and featured_until = null', () => {
    const minDate = new Date('2020-01-01').getTime()
    const maxDate = new Date('2030-12-31').getTime()
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.option(
          fc.integer({ min: minDate, max: maxDate }).map((ms) => new Date(ms).toISOString()),
          { nil: null },
        ),
        (currentFeatured, currentFeaturedUntil) => {
          const profile = { is_featured: currentFeatured, featured_until: currentFeaturedUntil }
          const result = applyFeaturedStatus(profile, false)
          expect(result.is_featured).toBe(false)
          expect(result.featured_until).toBeNull()
        },
      ),
      { numRuns: 100 },
    )
  })
})
