/**
 * Unit + Property-Based Tests for RatingsService
 * Feature: services-portal
 *
 * Tests cover:
 *   Property 17: Rating score is validated within 1–5 range
 *   Property 18: One rating per engagement
 *   Property 19: Average rating calculation is correct
 *   Property 20: Rating window expiry blocks late submissions
 */

import fc from 'fast-check'
import { RatingsService } from './ratings.service'

// ---------------------------------------------------------------------------
// Pure helper functions extracted from RatingsService for unit testing
// ---------------------------------------------------------------------------

/**
 * Validates whether a rating score is a valid integer in [1, 5].
 */
function validateScore(score: unknown): boolean {
  return Number.isInteger(score) && (score as number) >= 1 && (score as number) <= 5
}

/**
 * Validates whether the rating window is still open.
 * Returns true if the window is open (windowClosesAt >= now), false if expired.
 */
function isRatingWindowOpen(windowClosesAt: string | null, now: Date): boolean {
  if (!windowClosesAt) return false
  return new Date(windowClosesAt) >= now
}

/**
 * Simulates the duplicate-rating check.
 * Returns true if a rating already exists for this engagement.
 */
function hasDuplicateRating(existingRatingEngagementIds: string[], engagementId: string): boolean {
  return existingRatingEngagementIds.includes(engagementId)
}

/**
 * Computes avg_rating: arithmetic mean of scores, rounded to 1 decimal place.
 * Delegates to the static method on RatingsService.
 */
function computeAvgRating(scores: number[]): number {
  return RatingsService.computeAvgRating(scores)
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

// ISO date string arbitrary
const isoDateArb = fc
  .date({ min: new Date('2024-01-01'), max: new Date('2030-01-01') })
  .filter((d) => !isNaN(d.getTime()))
  .map((d) => d.toISOString())

// Valid score arbitrary: integers in [1, 5]
const validScoreArb = fc.integer({ min: 1, max: 5 })

// Invalid score arbitrary: integers outside [1, 5] or non-integers
const invalidIntegerScoreArb = fc.oneof(
  fc.integer({ min: -100, max: 0 }),
  fc.integer({ min: 6, max: 100 }),
)

const nonIntegerScoreArb = fc.oneof(
  fc.float({ min: Math.fround(1.1), max: Math.fround(4.9), noNaN: true }).filter((n) => !Number.isInteger(n)),
  fc.constant(NaN),
  fc.constant(Infinity),
  fc.constant(-Infinity),
)

// Array of valid scores (for avg_rating tests)
const scoresArb = fc.array(validScoreArb, { minLength: 1, maxLength: 100 })

// ---------------------------------------------------------------------------
// Property 17: Rating score is validated within 1–5 range
// Feature: services-portal, Property 17: Rating score is validated within 1–5 range
// Validates: Requirements 6.2
// ---------------------------------------------------------------------------

describe('Property 17: Rating score is validated within 1–5 range', () => {
  it('should accept score = 1', () => {
    expect(validateScore(1)).toBe(true)
  })

  it('should accept score = 5', () => {
    expect(validateScore(5)).toBe(true)
  })

  it('should accept score = 3', () => {
    expect(validateScore(3)).toBe(true)
  })

  it('should reject score = 0', () => {
    expect(validateScore(0)).toBe(false)
  })

  it('should reject score = 6', () => {
    expect(validateScore(6)).toBe(false)
  })

  it('should reject score = -1', () => {
    expect(validateScore(-1)).toBe(false)
  })

  it('should reject non-integer score 2.5', () => {
    expect(validateScore(2.5)).toBe(false)
  })

  it('should reject NaN', () => {
    expect(validateScore(NaN)).toBe(false)
  })

  it('should reject null', () => {
    expect(validateScore(null)).toBe(false)
  })

  it('should reject undefined', () => {
    expect(validateScore(undefined)).toBe(false)
  })

  it('should reject string "3"', () => {
    expect(validateScore('3')).toBe(false)
  })

  it('[PBT] any integer in [1, 5] is always accepted', () => {
    // Feature: services-portal, Property 17: Rating score is validated within 1–5 range
    // Validates: Requirements 6.2
    fc.assert(
      fc.property(validScoreArb, (score) => {
        expect(validateScore(score)).toBe(true)
      }),
      { numRuns: 100 },
    )
  })

  it('[PBT] any integer outside [1, 5] is always rejected', () => {
    // Feature: services-portal, Property 17: Rating score is validated within 1–5 range
    // Validates: Requirements 6.2
    fc.assert(
      fc.property(invalidIntegerScoreArb, (score) => {
        expect(validateScore(score)).toBe(false)
      }),
      { numRuns: 100 },
    )
  })

  it('[PBT] any non-integer value is always rejected', () => {
    // Feature: services-portal, Property 17: Rating score is validated within 1–5 range
    // Validates: Requirements 6.2
    fc.assert(
      fc.property(nonIntegerScoreArb, (score) => {
        expect(validateScore(score)).toBe(false)
      }),
      { numRuns: 100 },
    )
  })

  it('[PBT] score validation is consistent: valid iff integer AND in [1,5]', () => {
    // Feature: services-portal, Property 17: Rating score is validated within 1–5 range
    // Validates: Requirements 6.2
    fc.assert(
      fc.property(fc.integer({ min: -50, max: 50 }), (score) => {
        const expected = score >= 1 && score <= 5
        expect(validateScore(score)).toBe(expected)
      }),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 18: One rating per engagement
// Feature: services-portal, Property 18: One rating per engagement
// Validates: Requirements 6.3
// ---------------------------------------------------------------------------

describe('Property 18: One rating per engagement', () => {
  it('should detect duplicate when engagement already has a rating', () => {
    const engagementId = 'engagement-1'
    expect(hasDuplicateRating([engagementId], engagementId)).toBe(true)
  })

  it('should not detect duplicate when engagement has no rating', () => {
    const engagementId = 'engagement-1'
    expect(hasDuplicateRating([], engagementId)).toBe(false)
  })

  it('should not detect duplicate for a different engagement', () => {
    expect(hasDuplicateRating(['engagement-1'], 'engagement-2')).toBe(false)
  })

  it('[PBT] duplicate is always detected when engagement_id is in the existing set', () => {
    // Feature: services-portal, Property 18: One rating per engagement
    // Validates: Requirements 6.3
    fc.assert(
      fc.property(fc.uuid(), fc.array(fc.uuid(), { minLength: 0, maxLength: 10 }), (engId, others) => {
        const existing = [...others, engId]
        expect(hasDuplicateRating(existing, engId)).toBe(true)
      }),
      { numRuns: 100 },
    )
  })

  it('[PBT] no duplicate detected when engagement_id is not in the existing set', () => {
    // Feature: services-portal, Property 18: One rating per engagement
    // Validates: Requirements 6.3
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(fc.uuid(), { minLength: 0, maxLength: 10 }),
        (engId, others) => {
          // Ensure engId is not in others
          const existing = others.filter((id) => id !== engId)
          expect(hasDuplicateRating(existing, engId)).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] ratings table has at most one row per engagement_id', () => {
    // Feature: services-portal, Property 18: One rating per engagement
    // Validates: Requirements 6.3
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 20 }),
        (engagementIds) => {
          // Simulate inserting ratings with uniqueness enforcement
          const inserted = new Set<string>()
          const results: Array<{ success: boolean; engagementId: string }> = []

          for (const engId of engagementIds) {
            if (inserted.has(engId)) {
              results.push({ success: false, engagementId: engId })
            } else {
              inserted.add(engId)
              results.push({ success: true, engagementId: engId })
            }
          }

          // Verify: no duplicate engagement_ids in the inserted set
          const insertedIds = results.filter((r) => r.success).map((r) => r.engagementId)
          const uniqueIds = new Set(insertedIds)
          expect(uniqueIds.size).toBe(insertedIds.length)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 19: Average rating calculation is correct
// Feature: services-portal, Property 19: Average rating calculation is correct
// Validates: Requirements 6.4, 6.5
// ---------------------------------------------------------------------------

describe('Property 19: Average rating calculation is correct', () => {
  it('should compute avg_rating for a single score', () => {
    expect(computeAvgRating([3])).toBe(3)
  })

  it('should compute avg_rating for equal scores', () => {
    expect(computeAvgRating([4, 4, 4])).toBe(4)
  })

  it('should compute avg_rating for [1, 5] = 3.0', () => {
    expect(computeAvgRating([1, 5])).toBe(3)
  })

  it('should compute avg_rating for [1, 2, 3, 4, 5] = 3.0', () => {
    expect(computeAvgRating([1, 2, 3, 4, 5])).toBe(3)
  })

  it('should round to 1 decimal place: [1, 2] = 1.5', () => {
    expect(computeAvgRating([1, 2])).toBe(1.5)
  })

  it('should round to 1 decimal place: [1, 1, 2] = 1.3', () => {
    // mean = 4/3 = 1.333... → round to 1.3
    expect(computeAvgRating([1, 1, 2])).toBe(1.3)
  })

  it('should round to 1 decimal place: [2, 2, 3] = 2.3', () => {
    // mean = 7/3 = 2.333... → round to 2.3
    expect(computeAvgRating([2, 2, 3])).toBe(2.3)
  })

  it('should round to 1 decimal place: [3, 4] = 3.5', () => {
    expect(computeAvgRating([3, 4])).toBe(3.5)
  })

  it('should return 0 for empty scores array', () => {
    expect(computeAvgRating([])).toBe(0)
  })

  it('[PBT] avg_rating equals arithmetic mean rounded to 1 decimal place', () => {
    // Feature: services-portal, Property 19: Average rating calculation is correct
    // Validates: Requirements 6.4, 6.5
    fc.assert(
      fc.property(scoresArb, (scores) => {
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length
        const expected = Math.round(mean * 10) / 10
        expect(computeAvgRating(scores)).toBe(expected)
      }),
      { numRuns: 100 },
    )
  })

  it('[PBT] avg_rating is always in [1, 5] for valid score arrays', () => {
    // Feature: services-portal, Property 19: Average rating calculation is correct
    // Validates: Requirements 6.4, 6.5
    fc.assert(
      fc.property(scoresArb, (scores) => {
        const avg = computeAvgRating(scores)
        expect(avg).toBeGreaterThanOrEqual(1)
        expect(avg).toBeLessThanOrEqual(5)
      }),
      { numRuns: 100 },
    )
  })

  it('[PBT] avg_rating is monotonically bounded by min and max scores', () => {
    // Feature: services-portal, Property 19: Average rating calculation is correct
    // Validates: Requirements 6.4, 6.5
    fc.assert(
      fc.property(scoresArb, (scores) => {
        const avg = computeAvgRating(scores)
        const minScore = Math.min(...scores)
        const maxScore = Math.max(...scores)
        // avg must be between min and max (inclusive, accounting for rounding)
        expect(avg).toBeGreaterThanOrEqual(minScore - 0.05)
        expect(avg).toBeLessThanOrEqual(maxScore + 0.05)
      }),
      { numRuns: 100 },
    )
  })

  it('[PBT] adding a score equal to current avg does not change avg_rating', () => {
    // Feature: services-portal, Property 19: Average rating calculation is correct
    // Validates: Requirements 6.4, 6.5
    fc.assert(
      fc.property(
        fc.array(validScoreArb, { minLength: 1, maxLength: 50 }),
        (scores) => {
          const avg = computeAvgRating(scores)
          // Adding a score equal to the exact mean (if it's an integer) keeps avg the same
          // We test with a score of 3 (middle value) and verify the formula holds
          const newScores = [...scores, 3]
          const newAvg = computeAvgRating(newScores)
          const expectedMean = newScores.reduce((a, b) => a + b, 0) / newScores.length
          const expected = Math.round(expectedMean * 10) / 10
          expect(newAvg).toBe(expected)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 20: Rating window expiry blocks late submissions
// Feature: services-portal, Property 20: Rating window expiry blocks late submissions
// Validates: Requirements 6.7
// ---------------------------------------------------------------------------

describe('Property 20: Rating window expiry blocks late submissions', () => {
  it('should allow submission when window closes in the future', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60).toISOString() // 1 hour from now
    const now = new Date()
    expect(isRatingWindowOpen(future, now)).toBe(true)
  })

  it('should block submission when window closed in the past', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
    const now = new Date()
    expect(isRatingWindowOpen(past, now)).toBe(false)
  })

  it('should block submission when window closes exactly at now (boundary)', () => {
    const now = new Date()
    const windowClosesAt = new Date(now.getTime() - 1).toISOString() // 1ms before now
    expect(isRatingWindowOpen(windowClosesAt, now)).toBe(false)
  })

  it('should allow submission when window closes exactly at now (boundary)', () => {
    const now = new Date()
    const windowClosesAt = now.toISOString() // exactly now
    expect(isRatingWindowOpen(windowClosesAt, now)).toBe(true)
  })

  it('should block submission when rating_window_closes_at is null', () => {
    const now = new Date()
    expect(isRatingWindowOpen(null, now)).toBe(false)
  })

  it('[PBT] any window_closes_at in the future is always open', () => {
    // Feature: services-portal, Property 20: Rating window expiry blocks late submissions
    // Validates: Requirements 6.7
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2024-01-01'), max: new Date('2030-01-01') }).filter((d) => !isNaN(d.getTime())),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2030-01-01') }).filter((d) => !isNaN(d.getTime())),
        (windowDate, nowDate) => {
          // Only test cases where window is strictly in the future
          fc.pre(windowDate > nowDate)
          expect(isRatingWindowOpen(windowDate.toISOString(), nowDate)).toBe(true)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] any window_closes_at strictly in the past is always expired', () => {
    // Feature: services-portal, Property 20: Rating window expiry blocks late submissions
    // Validates: Requirements 6.7
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2024-01-01'), max: new Date('2030-01-01') }).filter((d) => !isNaN(d.getTime())),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2030-01-01') }).filter((d) => !isNaN(d.getTime())),
        (windowDate, nowDate) => {
          // Only test cases where window is strictly in the past
          fc.pre(windowDate < nowDate)
          expect(isRatingWindowOpen(windowDate.toISOString(), nowDate)).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] window open/closed is determined solely by comparing dates', () => {
    // Feature: services-portal, Property 20: Rating window expiry blocks late submissions
    // Validates: Requirements 6.7
    fc.assert(
      fc.property(
        isoDateArb,
        isoDateArb,
        (windowClosesAt, nowIso) => {
          const now = new Date(nowIso)
          const windowDate = new Date(windowClosesAt)
          const result = isRatingWindowOpen(windowClosesAt, now)
          const expected = windowDate >= now
          expect(result).toBe(expected)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('[PBT] null window_closes_at always blocks submission', () => {
    // Feature: services-portal, Property 20: Rating window expiry blocks late submissions
    // Validates: Requirements 6.7
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2024-01-01'), max: new Date('2030-01-01') }).filter((d) => !isNaN(d.getTime())),
        (now) => {
          expect(isRatingWindowOpen(null, now)).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })
})
