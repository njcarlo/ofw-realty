'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DeveloperSidebar } from '@/components/DeveloperSidebar'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export default function BrokerDiscoveryPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [brokers, setBrokers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)
  const [sent, setSent] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({ province: '', verified: '', search: '' })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const t = data.session?.access_token
      if (!t) { router.replace('/onboarding'); return }
      setToken(t)
      const res = await fetch(`${API}/api/brokers`, { headers: { Authorization: `Bearer ${t}` } })
      if (res.ok) setBrokers(await res.json())
      setLoading(false)
    })
  }, [router])

  async function sendConnectionRequest(brokerId: string) {
    if (!token) return
    setSending(brokerId)
    try {
      const res = await fetch(`${API}/api/broker-connections/request`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ broker_id: brokerId, initiated_by: 'developer' }),
      })
      if (res.ok) setSent(s => new Set([...s, brokerId]))
    } finally {
      setSending(null)
    }
  }

  const filtered = brokers.filter(b => {
    if (filters.search && !b.company_name?.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.province && b.province !== filters.province) return false
    if (filters.verified === 'yes' && !b.verified) return false
    if (filters.verified === 'no' && b.verified) return false
    return true
  })

  const provinces = [...new Set(brokers.map(b => b.province).filter(Boolean))]

  const inputStyle: React.CSSProperties = {
    background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8,
    padding: '8px 14px', fontSize: 13, color: '#fff', outline: 'none',
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <DeveloperSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Find Brokers</h1>
          <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Discover and connect with verified brokers on the platform</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <input
            type="text" placeholder="Search by name…" style={{ ...inputStyle, minWidth: 200 }}
            value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={filters.province} onChange={e => setFilters(f => ({ ...f, province: e.target.value }))}>
            <option value="">All Provinces</option>
            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={filters.verified} onChange={e => setFilters(f => ({ ...f, verified: e.target.value }))}>
            <option value="">All Brokers</option>
            <option value="yes">Verified Only</option>
            <option value="no">Unverified</option>
          </select>
        </div>

        {loading ? (
          <div style={{ color: '#595959', fontSize: 14 }}>Loading brokers…</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: '#595959', fontSize: 14, textAlign: 'center', padding: 48 }}>No brokers found matching your filters.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map((b: any) => (
              <div key={b.id} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(112,59,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏢</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{b.company_name}</div>
                    <div style={{ fontSize: 12, color: '#595959' }}>{b.city}{b.province ? `, ${b.province}` : ''}</div>
                    {b.verified && (
                      <span style={{ fontSize: 10, color: '#10B981', fontWeight: 600 }}>✓ Verified Broker</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                  {[
                    { label: 'Agents', value: b.agent_count ?? 0 },
                    { label: 'Listings', value: b.listing_count ?? 0 },
                    { label: 'Sold', value: b.sold_count ?? 0 },
                  ].map(s => (
                    <div key={s.label} style={{ background: '#141414', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {b.specialization && (
                  <div style={{ fontSize: 12, color: '#595959', marginBottom: 14 }}>Specializes in: {b.specialization}</div>
                )}
                <button
                  onClick={() => sendConnectionRequest(b.id)}
                  disabled={sending === b.id || sent.has(b.id) || b.already_connected}
                  style={{
                    width: '100%', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: (sending === b.id || sent.has(b.id) || b.already_connected) ? 'not-allowed' : 'pointer',
                    background: sent.has(b.id) || b.already_connected ? 'rgba(16,185,129,0.1)' : 'rgba(112,59,247,0.15)',
                    color: sent.has(b.id) || b.already_connected ? '#10B981' : '#703BF7',
                  }}
                >
                  {b.already_connected ? '✓ Connected' : sent.has(b.id) ? '✓ Request Sent' : sending === b.id ? 'Sending…' : '+ Send Connection Request'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
