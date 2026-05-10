'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DeveloperSidebar } from '@/components/DeveloperSidebar'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export default function CommissionsPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ broker: '', from: '', to: '' })
  const [brokers, setBrokers] = useState<string[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const t = data.session?.access_token
      if (!t) { router.replace('/onboarding'); return }
      setToken(t)
      const res = await fetch(`${API}/api/developer-commissions`, { headers: { Authorization: `Bearer ${t}` } })
      if (res.ok) {
        const data2 = await res.json()
        setRecords(data2)
        setBrokers([...new Set(data2.map((r: any) => r.broker_name).filter(Boolean))] as string[])
      }
      setLoading(false)
    })
  }, [router])

  const filtered = records.filter(r => {
    if (filters.broker && r.broker_name !== filters.broker) return false
    if (filters.from && r.created_at < filters.from) return false
    if (filters.to && r.created_at > filters.to + 'T23:59:59') return false
    return true
  })

  const totalGross = filtered.reduce((s, r) => s + Number(r.gross_commission ?? 0), 0)

  const inputStyle: React.CSSProperties = {
    background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8,
    padding: '8px 14px', fontSize: 13, color: '#fff', outline: 'none',
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <DeveloperSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Commissions</h1>
          <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Immutable commission records for all confirmed sales</p>
        </div>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Records', value: filtered.length, color: '#703BF7', icon: '📋' },
            { label: 'Total Gross Commission', value: `₱${totalGross.toLocaleString()}`, color: '#10B981', icon: '💰' },
            { label: 'Avg Commission', value: filtered.length > 0 ? `₱${Math.round(totalGross / filtered.length).toLocaleString()}` : '—', color: '#F59E0B', icon: '📊' },
          ].map(s => (
            <div key={s.label} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: '20px 24px', display: 'flex', gap: 14, alignItems: 'center' }}>
              <span style={{ fontSize: 28 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: '#595959' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={filters.broker} onChange={e => setFilters(f => ({ ...f, broker: e.target.value }))}>
            <option value="">All Brokers</option>
            {brokers.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="date" style={inputStyle} value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
            <span style={{ color: '#595959', fontSize: 13 }}>to</span>
            <input type="date" style={inputStyle} value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
          </div>
          {(filters.broker || filters.from || filters.to) && (
            <button onClick={() => setFilters({ broker: '', from: '', to: '' })} style={{ background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, padding: '7px 12px', fontSize: 13, cursor: 'pointer' }}>
              Clear Filters
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ color: '#595959', fontSize: 14 }}>Loading…</div>
        ) : (
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px 80px 140px 100px', padding: '10px 20px', borderBottom: '1px solid #141414' }}>
              {['Unit', 'Broker', 'Sale Price', 'Rate', 'Gross Commission', 'Date'].map(h => (
                <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding: '32px 20px', color: '#595959', fontSize: 14, textAlign: 'center' }}>No commission records found.</div>
            ) : filtered.map((r: any, i: number) => (
              <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px 80px 140px 100px', padding: '16px 20px', borderBottom: i < filtered.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{r.unit_identifier ?? r.unit_id}</div>
                  <div style={{ fontSize: 12, color: '#595959' }}>{r.project_name}</div>
                </div>
                <div style={{ fontSize: 13, color: '#999' }}>{r.broker_name ?? '—'}</div>
                <div style={{ fontSize: 13, color: '#fff' }}>₱{Number(r.unit_price_php ?? 0).toLocaleString()}</div>
                <div style={{ fontSize: 13, color: '#703BF7', fontWeight: 600 }}>
                  {r.rate_value}{r.rate_type === 'percentage' ? '%' : ' PHP'}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#10B981' }}>₱{Number(r.gross_commission ?? 0).toLocaleString()}</div>
                <div style={{ fontSize: 12, color: '#595959' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
