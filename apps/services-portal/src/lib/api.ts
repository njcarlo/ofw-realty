import { getAccessToken } from './supabase'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

/**
 * Typed fetch helper for the NestJS services/api backend.
 * Automatically attaches the Supabase JWT Bearer token when available.
 */
export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = await getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message ?? 'API request failed')
  }
  return res.json()
}
