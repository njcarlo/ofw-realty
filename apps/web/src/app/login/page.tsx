'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ROLES = [
  { value: 'buyer', label: 'Buyer', icon: '🏠', desc: 'Browse and purchase properties' },
  { value: 'realtor', label: 'Agent', icon: '👤', desc: 'List and manage properties' },
  { value: 'broker_admin', label: 'Broker', icon: '🏢', desc: 'Manage a brokerage and agents' },
]

const PORTAL_URLS: Record<string, string> = {
  realtor:      process.env.NEXT_PUBLIC_AGENT_PORTAL_URL  ?? 'http://localhost:3002',
  broker_admin: process.env.NEXT_PUBLIC_BROKER_PORTAL_URL ?? 'http://localhost:3003',
  buyer:        '/dashboard',
  seller:       '/dashboard',
}

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('buyer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null); setSuccess(null)
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        const userRole = data.user?.user_metadata?.role ?? 'buyer'
        const destination = PORTAL_URLS[userRole] ?? '/dashboard'
        window.location.href = destination
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, role } } })
        if (error) throw error
        setSuccess('Account created! Please check your email to verify your account.')
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0D0D0D', border: '1px solid #1A1A1A',
    borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#fff',
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #703BF7, #9B6DFF)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 0 24px rgba(112,59,247,0.4)' }}>🏠</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>LUPA<span style={{ color: '#703BF7' }}>PH</span></div>
              <div style={{ fontSize: 9, color: '#595959', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Lots · Units · Properties Anywhere</div>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, padding: 36 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: '#141414', borderRadius: 10, padding: 4, marginBottom: 28 }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null) }} style={{
                flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 600,
                background: mode === m ? '#1A1A1A' : 'transparent',
                color: mode === m ? '#fff' : '#595959',
                transition: 'all 0.15s',
              }}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#999', display: 'block', marginBottom: 6 }}>Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Juan dela Cruz" style={inputStyle} />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#999', display: 'block', marginBottom: 6 }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="juan@example.com" style={inputStyle} />
            </div>

            <div style={{ marginBottom: mode === 'register' ? 16 : 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#999' }}>Password</label>
                {mode === 'login' && <a href="#" style={{ fontSize: 12, color: '#703BF7' }}>Forgot password?</a>}
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="••••••••" style={inputStyle} />
            </div>

            {mode === 'register' && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#999', display: 'block', marginBottom: 10 }}>I am a...</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ROLES.map(r => (
                    <button key={r.value} type="button" onClick={() => setRole(r.value)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                      border: role === r.value ? '1px solid rgba(112,59,247,0.4)' : '1px solid #1A1A1A',
                      background: role === r.value ? 'rgba(112,59,247,0.08)' : '#141414',
                    }}>
                      <span style={{ fontSize: 20 }}>{r.icon}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{r.label}</div>
                        <div style={{ fontSize: 12, color: '#595959' }}>{r.desc}</div>
                      </div>
                      {role === r.value && <span style={{ marginLeft: 'auto', color: '#703BF7', fontSize: 16 }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}><p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>⚠️ {error}</p></div>}
            {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}><p style={{ fontSize: 13, color: '#10B981', margin: 0 }}>✅ {success}</p></div>}

            <button type="submit" disabled={loading} style={{
              width: '100%', background: loading ? '#4B2FA8' : '#703BF7', color: '#fff', border: 'none',
              borderRadius: 8, padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 24px rgba(112,59,247,0.35)',
            }}>
              {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#1A1A1A' }} />
            <span style={{ fontSize: 12, color: '#595959' }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#1A1A1A' }} />
          </div>

          <Link href="/" style={{ display: 'block', textAlign: 'center', padding: '12px 0', border: '1px solid #1A1A1A', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#595959' }}>
            👀 Browse as Guest
          </Link>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#595959', marginTop: 20 }}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
