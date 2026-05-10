'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false); return }
    router.replace('/feed')
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4 }}>LUPA <span style={{ color: '#703BF7' }}>PH</span></div>
          <div style={{ fontSize: 14, color: '#595959' }}>B2B Broker Network</div>
        </div>
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, padding: 32 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Sign in to your account</h1>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#595959', display: 'block', marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="broker@example.com" style={inputStyle} onFocus={e => (e.target.style.borderColor = 'rgba(112,59,247,0.4)')} onBlur={e => (e.target.style.borderColor = '#1A1A1A')} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, color: '#595959', display: 'block', marginBottom: 6 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={inputStyle} onFocus={e => (e.target.style.borderColor = 'rgba(112,59,247,0.4)')} onBlur={e => (e.target.style.borderColor = '#1A1A1A')} />
            </div>
            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#EF4444' }}>⚠️ {error}</div>}
            <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#333' : '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '13px 0', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 0 24px rgba(112,59,247,0.35)' }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#595959' }}>
            Use your LUPA PH account credentials.{' '}
            <a href={`${process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'}/login`} style={{ color: '#703BF7' }}>Create account →</a>
          </div>
        </div>
        <div style={{ marginTop: 20, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#F59E0B', textAlign: 'center' }}>
          🧪 Demo: broker@demo.lupaph.com / Demo@12345
        </div>
      </div>
    </div>
  )
}
