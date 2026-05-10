/**
 * E2E encryption utilities for the Negotiation Deal Room.
 * Uses the Web Crypto API — compatible with browsers and Node.js 18+.
 *
 * Key derivation: HKDF-SHA256 → 256-bit AES-GCM key
 * Encryption: AES-GCM with a random 12-byte IV per message
 */

// ─── Helpers ───────────────────────────────────────────────────

/** Convert base64 string to Uint8Array — works in browser and Node.js */
function base64ToBytes(b64: string): Uint8Array {
  const binary = typeof atob !== 'undefined'
    ? atob(b64)
    : Buffer.from(b64, 'base64').toString('binary')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/** Convert Uint8Array to base64 string — works in browser and Node.js */
function bytesToBase64(bytes: Uint8Array): string {
  if (typeof btoa !== 'undefined') {
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
  return Buffer.from(bytes).toString('base64')
}

/**
 * Convert Uint8Array to a plain ArrayBuffer.
 * Required for strict TypeScript compatibility with Web Crypto APIs on Node 24+
 * where Uint8Array<ArrayBufferLike> is not assignable to BufferSource.
 */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer
}

/** Get the subtle crypto instance — works in browser and Node.js 18+ */
function getSubtle(): SubtleCrypto {
  return (globalThis.crypto ?? crypto).subtle
}

/** Get the crypto instance for random values */
function getCrypto(): Crypto {
  return (globalThis.crypto ?? crypto) as Crypto
}

// ─── Key Derivation ────────────────────────────────────────────

export async function deriveRoomKey(
  roomSecret: string,
  userSub: string,
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const subtle = getSubtle()

  const secretBytes = base64ToBytes(roomSecret)
  const keyMaterial = await subtle.importKey(
    'raw',
    toArrayBuffer(secretBytes),
    { name: 'HKDF' },
    false,
    ['deriveKey'],
  )

  const infoBytes = encoder.encode(`negotiation-deal-room:${userSub}`)
  const salt = new Uint8Array(0)

  return subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: toArrayBuffer(salt),
      info: toArrayBuffer(infoBytes),
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

// ─── Encryption ────────────────────────────────────────────────

export async function encrypt(
  key: CryptoKey,
  plaintext: string,
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder()
  const subtle = getSubtle()
  const iv = getCrypto().getRandomValues(new Uint8Array(12))

  const plaintextBytes = encoder.encode(plaintext)
  const ciphertextBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(plaintextBytes),
  )

  return {
    ciphertext: bytesToBase64(new Uint8Array(ciphertextBuffer)),
    iv: bytesToBase64(iv),
  }
}

// ─── Decryption ────────────────────────────────────────────────

export async function decrypt(
  key: CryptoKey,
  ciphertext: string,
  iv: string,
): Promise<string> {
  const decoder = new TextDecoder()
  const subtle = getSubtle()

  const ivBytes = base64ToBytes(iv)
  const ciphertextBytes = base64ToBytes(ciphertext)

  const plaintextBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(ivBytes) },
    key,
    toArrayBuffer(ciphertextBytes),
  )

  return decoder.decode(plaintextBuffer)
}
