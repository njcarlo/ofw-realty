'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('No verification token found in the URL.')
      return
    }

    fetch(`${API}/api/developers/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async res => {
        if (res.ok) {
          setStatus('success')
          setTimeout(() => router.replace('/'), 2000)
        } else {
          const data = await res.json().catch(() => ({}))
          setStatus('error')
          setMessage(data.message ?? 'Verification failed. The link may have expired.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Network error. Please try again.')
      })
  }, [router, searchParams])

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, padding: 48, maxWidth: 440, width: '100%', textAlign: 'center' }}>
        {status === 'verifying' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Verifying your email…</h1>
            <p style={{ fontSize: 14, color: '#595959' }}>Please wait while we confirm your email address.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>✅</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Email verified!</h1>
            <p style={{ fontSize: 14, color: '#595959', marginBottom: 16 }}>Your email has been confirmed. Redirecting to your dashboard…</p>
            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, padding: '12px 18px' }}>
              <p style={{ fontSize: 13, color: '#10B981', margin: 0 }}>✓ Your account is now pending Admin review.</p>
            </div>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>❌</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Verification failed</h1>
            <p style={{ fontSize: 14, color: '#595959', marginBottom: 20 }}>{message}</p>
            <a
              href="/onboarding"
              style={{ display: 'inline-block', background: '#703BF7', color: '#fff', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, boxShadow: '0 0 20px rgba(112,59,247,0.3)' }}
            >
              Back to Registration
            </a>
          </>
        )}
      </div>
    </div>
  )
}
