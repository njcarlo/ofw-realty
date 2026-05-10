/**
 * Unit Tests for PrcVerificationService
 * Feature: services-portal
 *
 * Tests cover:
 *   - Successful PRC lookup (found: true)
 *   - No-result response (found: false) → returns { found: false }
 *   - Timeout (> 5 s) → returns { found: false }
 *   - HTTP error (non-2xx) → throws
 *   - Network failure → throws
 *   - Missing PRC_API_URL → returns { found: false }
 *   - Profile submission is never blocked by PRC API unavailability
 *
 * Requirements: 1.5, 1.6
 */

import { PrcVerificationService, PrcLookupResult } from './prc-verification.service'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a PrcVerificationService instance with the given PRC_API_URL
 * environment variable set.
 */
function makeService(apiUrl: string): PrcVerificationService {
  const original = process.env.PRC_API_URL
  process.env.PRC_API_URL = apiUrl
  const svc = new PrcVerificationService()
  process.env.PRC_API_URL = original
  return svc
}

// ---------------------------------------------------------------------------
// Mock fetch helper
// ---------------------------------------------------------------------------

type FetchMock = jest.Mock

function mockFetch(impl: (url: string, init?: RequestInit) => Promise<Response>): FetchMock {
  const mock = jest.fn(impl) as FetchMock
  global.fetch = mock as unknown as typeof fetch
  return mock
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PrcVerificationService', () => {
  const FAKE_URL = 'https://prc-api.example.com'

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // -------------------------------------------------------------------------
  // Successful lookup
  // -------------------------------------------------------------------------

  describe('successful lookup', () => {
    it('returns the full result when the API responds with found: true', async () => {
      const apiResult: PrcLookupResult = {
        found: true,
        name: 'Juan dela Cruz',
        licenseType: 'Real Estate Appraiser',
        status: 'active',
        expiryDate: '2026-12-31',
      }

      mockFetch(async () =>
        new Response(JSON.stringify(apiResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      const svc = makeService(FAKE_URL)
      const result = await svc.lookup('0012345')

      expect(result.found).toBe(true)
      expect(result.name).toBe('Juan dela Cruz')
      expect(result.status).toBe('active')
      expect(result.expiryDate).toBe('2026-12-31')
    })
  })

  // -------------------------------------------------------------------------
  // No-result (found: false)
  // -------------------------------------------------------------------------

  describe('no-result response', () => {
    it('returns { found: false } when the API responds with found: false', async () => {
      mockFetch(async () =>
        new Response(JSON.stringify({ found: false }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      const svc = makeService(FAKE_URL)
      const result = await svc.lookup('UNKNOWN-999')

      expect(result.found).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Timeout
  // -------------------------------------------------------------------------

  describe('timeout handling', () => {
    it('returns { found: false } when the request times out (AbortError)', async () => {
      mockFetch(async (_url, init) => {
        // Simulate the AbortController firing
        return new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal as AbortSignal | undefined
          if (signal) {
            signal.addEventListener('abort', () => {
              const err = new Error('The operation was aborted')
              err.name = 'AbortError'
              reject(err)
            })
          }
          // Never resolve — the timeout will abort it
        })
      })

      // Use a very short timeout for the test
      const svc = makeService(FAKE_URL)
      // Override the timeout to 10ms so the test runs fast
      ;(svc as any).timeoutMs = 10

      const result = await svc.lookup('TIMEOUT-LICENSE')

      expect(result.found).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // HTTP error
  // -------------------------------------------------------------------------

  describe('HTTP error handling', () => {
    it('throws when the API returns a non-2xx status', async () => {
      mockFetch(async () =>
        new Response('Internal Server Error', { status: 500 }),
      )

      const svc = makeService(FAKE_URL)

      await expect(svc.lookup('BAD-LICENSE')).rejects.toThrow('PRC API returned HTTP 500')
    })

    it('throws when the API returns 404', async () => {
      mockFetch(async () =>
        new Response('Not Found', { status: 404 }),
      )

      const svc = makeService(FAKE_URL)

      await expect(svc.lookup('MISSING-LICENSE')).rejects.toThrow('PRC API returned HTTP 404')
    })
  })

  // -------------------------------------------------------------------------
  // Network failure
  // -------------------------------------------------------------------------

  describe('network failure handling', () => {
    it('throws on network failure (fetch rejects)', async () => {
      mockFetch(async () => {
        throw new Error('Network unreachable')
      })

      const svc = makeService(FAKE_URL)

      await expect(svc.lookup('ANY-LICENSE')).rejects.toThrow('Network unreachable')
    })
  })

  // -------------------------------------------------------------------------
  // Missing PRC_API_URL
  // -------------------------------------------------------------------------

  describe('missing PRC_API_URL', () => {
    it('returns { found: false } when PRC_API_URL is not configured', async () => {
      const svc = makeService('') // empty URL

      const result = await svc.lookup('ANY-LICENSE')

      expect(result.found).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Profile submission is never blocked (integration contract)
  // -------------------------------------------------------------------------

  describe('profile submission is never blocked by PRC API unavailability', () => {
    /**
     * Simulates what ProvidersService does: calls prcVerification.lookup()
     * and maps the result to a license_verification_status without throwing.
     */
    async function simulateProfileSubmission(
      svc: PrcVerificationService,
      licenseNumber: string,
    ): Promise<{ status: string; prcLookupResult: PrcLookupResult | null }> {
      let licenseVerificationStatus = 'not_applicable'
      let prcLookupResult: PrcLookupResult | null = null

      try {
        const result = await svc.lookup(licenseNumber)
        if (result.found) {
          licenseVerificationStatus = 'verified'
          prcLookupResult = result
        } else {
          licenseVerificationStatus = 'unverified_manual'
          prcLookupResult = result
        }
      } catch {
        licenseVerificationStatus = 'failed'
      }

      return { status: licenseVerificationStatus, prcLookupResult }
    }

    it('sets verified when API returns found: true', async () => {
      mockFetch(async () =>
        new Response(JSON.stringify({ found: true, name: 'Test', status: 'active' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      const svc = makeService(FAKE_URL)
      const { status, prcLookupResult } = await simulateProfileSubmission(svc, 'PRC-001')

      expect(status).toBe('verified')
      expect(prcLookupResult).not.toBeNull()
      expect(prcLookupResult?.found).toBe(true)
    })

    it('sets unverified_manual when API returns found: false', async () => {
      mockFetch(async () =>
        new Response(JSON.stringify({ found: false }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      const svc = makeService(FAKE_URL)
      const { status } = await simulateProfileSubmission(svc, 'PRC-002')

      expect(status).toBe('unverified_manual')
    })

    it('sets unverified_manual on timeout — does not block submission', async () => {
      mockFetch(async (_url, init) => {
        return new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal as AbortSignal | undefined
          if (signal) {
            signal.addEventListener('abort', () => {
              const err = new Error('The operation was aborted')
              err.name = 'AbortError'
              reject(err)
            })
          }
        })
      })

      const svc = makeService(FAKE_URL)
      ;(svc as any).timeoutMs = 10

      const { status } = await simulateProfileSubmission(svc, 'PRC-003')

      expect(status).toBe('unverified_manual')
    })

    it('sets failed on HTTP error — does not block submission', async () => {
      mockFetch(async () => new Response('Error', { status: 503 }))

      const svc = makeService(FAKE_URL)
      const { status } = await simulateProfileSubmission(svc, 'PRC-004')

      expect(status).toBe('failed')
    })

    it('sets failed on network failure — does not block submission', async () => {
      mockFetch(async () => {
        throw new Error('ECONNREFUSED')
      })

      const svc = makeService(FAKE_URL)
      const { status } = await simulateProfileSubmission(svc, 'PRC-005')

      expect(status).toBe('failed')
    })

    it('sets unverified_manual when PRC_API_URL is not configured — does not block submission', async () => {
      const svc = makeService('')
      const { status } = await simulateProfileSubmission(svc, 'PRC-006')

      expect(status).toBe('unverified_manual')
    })
  })
})
