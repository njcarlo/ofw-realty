/**
 * E2E encryption utilities for the Negotiation Deal Room.
 * Uses the Web Crypto API — compatible with browsers and Node.js 18+.
 *
 * Key derivation: HKDF-SHA256 → 256-bit AES-GCM key
 * Encryption: AES-GCM with a random 12-byte IV per message
 */

// ─── Helpers ───────────────────────────────────────────────────

function base64ToBytes(b64: string): Uint8Array {
  // Works in both browser (atob) and Node.js (Buffer)
  const binary = typeof atob !== 'undefined'
    ? atob(b64)
    : Buffer.from(b64, 'base64').toString('binary')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function bytesToBase64(bytes: Uint8Array): string {
  // Works in both browser (btoa) and Node.js (Buffer)
  if (typeof btoa !== 'undefined') {
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
  return Buffer.from(bytes).toString('base64')
}

// ─── Key Derivation ────────────────────────────────────────────

/**
 * Derive a 256-bit AES-GCM key from a room secret and a user's JWT subject claim.
 *
 * @param roomSecret - Base64-encoded 256-bit room secret (from the API)
 * @param userSub    - The user's JWT `sub` claim
 * @returns A CryptoKey suitable for AES-GCM encrypt/decrypt operations
 *
 * The derivation is deterministic: the same (roomSecret, userSub) pair always
 * produces the same key, enabling any authorised participant to re-derive the
 * key from the values delivered by the authenticated GET endpoint.
 */
export async function deriveRoomKey(
  roomSecret: string,
  userSub: string,
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  // Use globalThis.crypto for Node.js 18+ compatibility
  const subtle = (globalThis.crypto ?? crypto).subtle

  const secretBytes = base64ToBytes(roomSecret)
  const keyMaterial = await subtle.importKey(
    'raw',
    secretBytes.buffer.slice(secretBytes.byteOffset, secretBytes.byteOffset + secretBytes.byteLength) as ArrayBuffer,
    { name: 'HKDF' },
    false,
    ['deriveKey'],
  )

  const info = encoder.encode(`negotiation-deal-room:${userSub}`)
  const salt = new Uint8Array(0)

  return subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt,
      info,
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,       // not extractable
    ['encrypt', 'decrypt'],
  )
}

// ─── Encryption ────────────────────────────────────────────────

/**
 * Encrypt a plaintext string with AES-GCM.
 *
 * @param key       - A CryptoKey derived via `deriveRoomKey`
 * @param plaintext - The message content to encrypt
 * @returns Base64-encoded `ciphertext` and `iv` suitable for storage in
 *          `negotiation_messages.content_enc` / `content_iv`
 */
export async function encrypt(
  key: CryptoKey,
  plaintext: string,
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder()
  const subtle = (globalThis.crypto ?? crypto).subtle
  const iv = (globalThis.crypto ?? crypto).getRandomValues(new Uint8Array(12))

  const ciphertextBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext),
  )

  return {
    ciphertext: bytesToBase64(new Uint8Array(ciphertextBuffer)),
    iv: bytesToBase64(iv),
  }
}

// ─── Decryption ────────────────────────────────────────────────

/**
 * Decrypt an AES-GCM ciphertext back to the original plaintext string.
 *
 * @param key        - A CryptoKey derived via `deriveRoomKey`
 * @param ciphertext - Base64-encoded ciphertext (from `encrypt`)
 * @param iv         - Base64-encoded 12-byte IV (from `encrypt`)
 * @returns The original plaintext string
 * @throws If the key or IV is wrong, or the ciphertext has been tampered with
 */
export async function decrypt(
  key: CryptoKey,
  ciphertext: string,
  iv: string,
): Promise<string> {
  const decoder = new TextDecoder()
  const subtle = (globalThis.crypto ?? crypto).subtle

  const plaintextBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(iv) },
    key,
    base64ToBytes(ciphertext),
  )

  return decoder.decode(plaintextBuffer)
}
