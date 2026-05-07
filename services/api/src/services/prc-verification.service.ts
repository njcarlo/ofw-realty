import { Injectable, Logger } from '@nestjs/common'

/**
 * Result returned by the PRC verification API lookup.
 */
export interface PrcLookupResult {
  found: boolean
  name?: string
  licenseType?: string
  status?: 'active' | 'expired' | 'suspended'
  expiryDate?: string
}

/**
 * Interface for the PRC verification service.
 * Implemented here; referenced via optional injection in ProvidersService.
 */
export interface IPrcVerificationService {
  lookup(licenseNumber: string): Promise<PrcLookupResult>
}

/**
 * PrcVerificationService
 *
 * Calls the PRC (Professional Regulation Commission) verification API to
 * validate a professional license number.
 *
 * Behaviour:
 *  - On success (HTTP 200, `found: true`):  returns the lookup result
 *  - On no-result (HTTP 200, `found: false`): returns `{ found: false }`
 *  - On timeout (> 5 s):                    returns `{ found: false }`
 *  - On any HTTP error or network failure:  throws so the caller can set
 *                                           `license_verification_status = 'failed'`
 *
 * The service NEVER blocks profile submission — all errors are surfaced to
 * the caller, which handles them gracefully (see ProvidersService).
 *
 * The PRC API base URL is read from the `PRC_API_URL` environment variable.
 */
@Injectable()
export class PrcVerificationService implements IPrcVerificationService {
  private readonly logger = new Logger(PrcVerificationService.name)
  private readonly timeoutMs = 5_000
  private readonly apiUrl: string

  constructor() {
    this.apiUrl = process.env.PRC_API_URL ?? ''
  }

  /**
   * Look up a PRC license number.
   *
   * @param licenseNumber - The PRC license number to verify.
   * @returns `PrcLookupResult` with `found: true` and details on success,
   *          or `{ found: false }` on timeout / no-result.
   * @throws  On HTTP error (non-2xx) or unexpected network failure so the
   *          caller can set `license_verification_status = 'failed'`.
   */
  async lookup(licenseNumber: string): Promise<PrcLookupResult> {
    if (!this.apiUrl) {
      this.logger.warn('PRC_API_URL is not configured — treating as no-result')
      return { found: false }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const url = `${this.apiUrl}/lookup?licenseNumber=${encodeURIComponent(licenseNumber)}`
      this.logger.debug(`PRC lookup: GET ${url}`)

      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })

      if (!response.ok) {
        // HTTP error (4xx / 5xx) — throw so caller sets 'failed'
        throw new Error(`PRC API returned HTTP ${response.status}`)
      }

      const body = (await response.json()) as PrcLookupResult

      if (!body.found) {
        // API responded but license was not found — treat as unverified_manual
        return { found: false }
      }

      return body
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Timeout — treat as no-result (unverified_manual)
        this.logger.warn(
          `PRC lookup timed out after ${this.timeoutMs}ms for license ${licenseNumber}`,
        )
        return { found: false }
      }

      // Re-throw all other errors (HTTP errors, network failures) so the
      // caller can set license_verification_status = 'failed'
      this.logger.error(
        `PRC lookup failed for license ${licenseNumber}: ${err instanceof Error ? err.message : String(err)}`,
      )
      throw err
    } finally {
      clearTimeout(timeoutId)
    }
  }
}
