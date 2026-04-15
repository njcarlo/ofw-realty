'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useTheme } from './ThemeProvider'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PORTAL_URLS: Record<string, string> = {
  buyer:        '/dashboard',
  seller:       '/sell',
  realtor:      'https://ofw-realty-agent-portal.vercel.app',
  broker_admin: 'https://ofw-realty-broker-portal.vercel.app',
}

const DEMO_ACCOUNTS = [
  {
    role: 'Buyer (OFW)',
    userRole: 'buyer',
    icon: '🏠',
    email: 'buyer@demo.lupaph.com',
    password: 'Demo@12345',
    name: 'Maria OFW Buyer',
    desc: 'Browse properties, save listings, submit inquiries, SPA workflow',
    color: '#10B981',
    features: ['Browse & save properties', 'Submit inquiries', 'SPA workflow', 'Financing calculator'],
  },
  {
    role: 'Seller',
    userRole: 'seller',
    icon: '🏷️',
    email: 'seller@demo.lupaph.com',
    password: 'Demo@12345',
    name: 'Pedro Seller Reyes',
    desc: 'List your property, request agent representation, track inquiries',
    color: '#06B6D4',
    features: ['List properties', 'Pin on map', 'Request agent/broker', 'Track views & inquiries'],
  },
  {
    role: 'Agent',
    userRole: 'realtor',
    icon: '👤',
    email: 'agent@demo.lupaph.com',
    password: 'Demo@12345',
    name: 'Juan Agent Santos',
    desc: 'Manage listings, handle leads, open houses, site visits',
    color: '#703BF7',
    features: ['Manage listings', 'Lead dashboard', 'Open houses', 'Commission tracking'],
  },
  {
    role: 'Broker',
    userRole: 'broker_admin',
    icon: '🏢',
    email: 'broker@demo.lupaph.com',
    password: 'Demo@12345',
    name: 'Ana Broker Cruz',
    desc: 'Manage brokerage, agents, property pool, commissions',
    color: '#F59E0B',
    features: ['Manage agents', 'Property pool', 'Commission rates', 'Co-broking network'],
  },
]

interface Props {
  onClose: () => void
}

export function DemoLoginPanel({ onClose }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loginAs(account: typeof DEMO_ACCOUNTS[0]) {
    setLoading(account.role)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      })
      if (error) throw error
      window.location.href = PORTAL_URLS[account.userRole] ?? '/dashboard'
    } catch (err: any) {
      setError(`Failed to login as ${account.role}: ${err.message}`)
      setLoading(null)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, backdropFilter: 'blur(4px)' }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 201, width: '100%', maxWidth: 680,
        background: isDark ? '#0D0D0D' : '#fff',
        border: `1px solid ${isDark ? '#1A1A1A' : '#E5E7EB'}`,
        borderRadius: 20, padding: 32,
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 99, padding: '4px 12px', marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>🧪 DEMO MODE — For Testing Only</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: isDark ? '#fff' : '#111', margin: 0 }}>Choose a Demo Account</h2>
            <p style={{ fontSize: 14, color: isDark ? '#595959' : '#6B7280', marginTop: 6 }}>
              Log in instantly to test the happy path for each user role.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: isDark ? '#595959' : '#9CA3AF', cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        {/* Credentials info */}
        <div style={{ background: isDark ? '#141414' : '#F9FAFB', border: `1px solid ${isDark ? '#1A1A1A' : '#E5E7EB'}`, borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>🔑</span>
          <span style={{ fontSize: 13, color: isDark ? '#595959' : '#6B7280' }}>
            All demo accounts use password: <code style={{ background: isDark ? '#0D0D0D' : '#F3F4F6', padding: '2px 6px', borderRadius: 4, color: isDark ? '#fff' : '#111', fontWeight: 600 }}>Demo@12345</code>
          </span>
        </div>

        {/* Account cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          {DEMO_ACCOUNTS.map(account => (
            <div key={account.role} style={{
              background: isDark ? '#141414' : '#F9FAFB',
              border: `1px solid ${isDark ? '#1A1A1A' : '#E5E7EB'}`,
              borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column',
            }}>
              {/* Role header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${account.color}15`, border: `1px solid ${account.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {account.icon}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: isDark ? '#fff' : '#111' }}>{account.role}</div>
                  <div style={{ fontSize: 11, color: isDark ? '#595959' : '#9CA3AF' }}>{account.name}</div>
                </div>
              </div>

              {/* Features */}
              <div style={{ flex: 1, marginBottom: 16 }}>
                {account.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: account.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: isDark ? '#595959' : '#6B7280' }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* Email */}
              <div style={{ fontSize: 11, color: isDark ? '#595959' : '#9CA3AF', marginBottom: 12, fontFamily: 'monospace', background: isDark ? '#0D0D0D' : '#F3F4F6', padding: '4px 8px', borderRadius: 6 }}>
                {account.email}
              </div>

              {/* Login button */}
              <button
                onClick={() => loginAs(account)}
                disabled={loading !== null}
                style={{
                  background: loading === account.role ? `${account.color}80` : account.color,
                  color: '#fff', border: 'none', borderRadius: 8,
                  padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: loading !== null ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {loading === account.role ? '⏳ Logging in...' : `Login as ${account.role}`}
              </button>
              <div style={{ fontSize: 10, color: isDark ? '#595959' : '#9CA3AF', textAlign: 'center', marginTop: 6 }}>
                → {account.userRole === 'realtor' ? 'agent-portal.vercel.app' : account.userRole === 'broker_admin' ? 'broker-portal.vercel.app' : account.userRole === 'seller' ? 'Seller Dashboard' : 'Buyer Dashboard'}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px' }}>
            <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>⚠️ {error}</p>
          </div>
        )}

        <p style={{ fontSize: 12, color: isDark ? '#595959' : '#9CA3AF', textAlign: 'center', marginTop: 16 }}>
          These are demo accounts for testing purposes only. Do not use real personal information.
        </p>
      </div>
    </>
  )
}
