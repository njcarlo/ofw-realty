'use client'
import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export default function OnboardingPage() {
  const [step, setStep] = useState<'form' | 'pending'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    company_name: '',
    company_type: 'corporation',
    primary_contact: '',
    email: '',
    phone: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/developers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.message ?? 'Registration failed. Please try again.')
        return
      }
      setStep('pending')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#141414', border: '1px solid #1A1A1A',
    borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#fff',
    outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: '#595959', display: 'block', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: '0.05em',
  }

  if (step === 'pending') {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ background: '#0D0D0D', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: 48, maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>📧</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Check your email</h1>
          <p style={{ fontSize: 15, color: '#595959', lineHeight: 1.6, marginBottom: 24 }}>
            We sent a verification link to <strong style={{ color: '#fff' }}>{form.email}</strong>.
            Click the link to verify your email and continue setting up your developer account.
          </p>
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, padding: '14px 20px', marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: '#10B981', margin: 0 }}>
              ✓ Your account is pending Admin review after email verification.
            </p>
          </div>
          <p style={{ fontSize: 13, color: '#595959' }}>
            Didn't receive it? Check your spam folder or{' '}
            <button onClick={() => setStep('form')} style={{ background: 'none', border: 'none', color: '#703BF7', cursor: 'pointer', fontSize: 13, padding: 0 }}>
              try again
            </button>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif", padding: 24 }}>
      <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, padding: 48, maxWidth: 520, width: '100%' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>LUPA <span style={{ color: '#703BF7' }}>PH</span></div>
          <div style={{ fontSize: 11, color: '#595959', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24 }}>Developer Portal</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>Register your company</h1>
          <p style={{ fontSize: 14, color: '#595959', margin: '8px 0 0' }}>Join OFW Realty as a verified real estate developer.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Company Name *</label>
            <input
              type="text" required style={inputStyle}
              value={form.company_name}
              onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
              placeholder="e.g. Pro-Friends Inc."
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Company Type *</label>
            <select
              required style={{ ...inputStyle, cursor: 'pointer' }}
              value={form.company_type}
              onChange={e => setForm(f => ({ ...f, company_type: e.target.value }))}
            >
              <option value="corporation">Corporation</option>
              <option value="sole_proprietorship">Sole Proprietorship</option>
              <option value="partnership">Partnership</option>
            </select>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Primary Contact Name *</label>
            <input
              type="text" required style={inputStyle}
              value={form.primary_contact}
              onChange={e => setForm(f => ({ ...f, primary_contact: e.target.value }))}
              placeholder="Full name of primary contact"
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Email Address *</label>
            <input
              type="email" required style={inputStyle}
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="company@example.com"
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>Phone Number *</label>
            <input
              type="tel" required style={inputStyle}
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+63 9XX XXX XXXX"
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 18 }}>
              <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{ width: '100%', background: loading ? '#333' : '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 0 20px rgba(112,59,247,0.3)' }}
          >
            {loading ? 'Registering…' : 'Create Developer Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
