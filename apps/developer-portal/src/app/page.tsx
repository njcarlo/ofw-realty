'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DeveloperSidebar } from '@/components/DeveloperSidebar'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

const DATE_RANGES = [
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
  { label: 'Custom', value: 'custom' },
]

export default function DeveloperDashboard() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: s }) => {
      const t = s.session?.access_token
      if (!t) { router.replace('/onboarding'); return }
      setToken(t)
      await fetchDashboard(t, '30')
    })
  }, [router])

  async function fetchDashboard(t: string, range: string, from?: string, to?: string) {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (range !== 'custom') {
        params.set('days', range)
      } else if (from && to) {
        params.set('from', from)
        params.set('to', to)
      }
      const res = await fetch(`${API}/api/developers/me/dashboard?${params}`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  function handleRangeChange(range: string) {
    setDateRange(range)
    if (range !== 'custom' && token) {
      fetchDashboard(token, range)
    }
  }

  function handleCustomApply() {
    if (token && customFrom && customTo) {
      fetchDashboard(token, 'custom', customFrom, customTo)
    }
  }

  const kpis = data ? [
    { label: 'Total Units', value: data.total_units ?? 0, icon: '🏗️', color: '#703BF7' },
    { label: 'Available', value: data.available_units ?? 0, icon: '✅', color: '#10B981' },
    { label: 'Reserved', value: data.reserved_units ?? 0, icon: '📋', color: '#F59E0B' },
    { label: 'Sold', value: data.sold_units ?? 0, icon: '💰', color: '#8B5CF6' },
    { label: 'Active Broker Connections', value: data.active_connections ?? 0, icon: '🤝', color: '#06B6D4' },
    { label: 'Reservation Requests (Month)', value: data.reservations_this_month ?? 0, icon: '📩', color: '#EC4899' },
    { label: 'Confirmed Sales (Month)', value: data.sales_this_month ?? 0, icon: '🏆', color: '#10B981' },
  ] : []

  const projects: any[] = data?.projects ?? []
  const activity: any[] = data?.recent_activity ?? []

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <DeveloperSidebar verified={data?.verified_badge} companyName={data?.company_name} />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>Developer Dashboard 🏗️</h1>
            <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>{data?.company_name ?? 'Loading…'}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {DATE_RANGES.map(r => (
              <button
                key={r.value}
                onClick={() => handleRangeChange(r.value)}
                style={{
                  background: dateRange === r.value ? 'rgba(112,59,247,0.15)' : '#0D0D0D',
                  color: dateRange === r.value ? '#703BF7' : '#595959',
                  border: `1px solid ${dateRange === r.value ? 'rgba(112,59,247,0.3)' : '#1A1A1A'}`,
                  borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer',
                }}
              >
                {r.label}
              </button>
            ))}
            {dateRange === 'custom' && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ background: '#141414', border: '1px solid #1A1A1A', borderRadius: 6, padding: '6px 10px', fontSize: 13, color: '#fff', outline: 'none' }} />
                <span style={{ color: '#595959', fontSize: 13 }}>to</span>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={{ background: '#141414', border: '1px solid #1A1A1A', borderRadius: 6, padding: '6px 10px', fontSize: 13, color: '#fff', outline: 'none' }} />
                <button onClick={handleCustomApply} style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 13, cursor: 'pointer' }}>Apply</button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#595959', fontSize: 14 }}>Loading dashboard…</div>
        ) : (
          <>
            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
              {kpis.map(kpi => (
                <div key={kpi.label} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: '18px 20px' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: `${kpi.color}15`, border: `1px solid ${kpi.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, marginBottom: 12 }}>
                    {kpi.icon}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{kpi.value.toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: '#595959' }}>{kpi.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
              {/* Per-project breakdown */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Project Breakdown</h2>
                  <a href="/projects" style={{ fontSize: 13, color: '#703BF7' }}>View all →</a>
                </div>
                <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 80px 80px 1fr', padding: '10px 16px', borderBottom: '1px solid #141414' }}>
                    {['Project', 'Avail', 'Rsvd', 'Sold', 'Total', 'Top Broker'].map(h => (
                      <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                    ))}
                  </div>
                  {projects.length === 0 ? (
                    <div style={{ padding: '24px 16px', color: '#595959', fontSize: 14, textAlign: 'center' }}>
                      No projects yet. <a href="/projects/new" style={{ color: '#703BF7' }}>Create your first project →</a>
                    </div>
                  ) : projects.map((p: any, i: number) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 80px 80px 1fr', padding: '14px 16px', borderBottom: i < projects.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}>
                      <div>
                        <a href={`/projects/${p.id}`} style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{p.name}</a>
                        <div style={{ fontSize: 11, color: '#595959', marginTop: 2 }}>{p.city}, {p.province}</div>
                      </div>
                      <div style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>{p.available ?? 0}</div>
                      <div style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>{p.reserved ?? 0}</div>
                      <div style={{ fontSize: 13, color: '#8B5CF6', fontWeight: 600 }}>{p.sold ?? 0}</div>
                      <div style={{ fontSize: 13, color: '#999' }}>{p.total_units ?? 0}</div>
                      <div style={{ fontSize: 12, color: '#595959' }}>{p.top_broker ?? '—'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Recent Activity</h2>
                <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
                  {activity.length === 0 ? (
                    <div style={{ padding: '24px 16px', color: '#595959', fontSize: 14, textAlign: 'center' }}>No recent activity.</div>
                  ) : activity.slice(0, 20).map((ev: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: i < Math.min(activity.length, 20) - 1 ? '1px solid #141414' : 'none', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 18, flexShrink: 0 }}>
                        {ev.type === 'connection' ? '🤝' : ev.type === 'reservation' ? '📋' : ev.type === 'unit_status' ? '🏗️' : ev.type === 'agent_tag' ? '👤' : '📌'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{ev.description}</div>
                        <div style={{ fontSize: 11, color: '#595959', marginTop: 2 }}>{ev.time_ago ?? ev.created_at}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
