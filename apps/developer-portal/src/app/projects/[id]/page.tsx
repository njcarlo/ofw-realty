'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DeveloperSidebar } from '@/components/DeveloperSidebar'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

const STATUS_COLORS: Record<string, string> = {
  available: '#10B981', reserved: '#F59E0B', sold: '#8B5CF6',
}
const PROJECT_STATUS_COLORS: Record<string, string> = {
  pre_selling: '#703BF7', ready_for_occupancy: '#10B981', sold_out: '#595959', on_hold: '#F59E0B',
}
const PROJECT_STATUS_LABELS: Record<string, string> = {
  pre_selling: 'Pre-Selling', ready_for_occupancy: 'Ready for Occupancy', sold_out: 'Sold Out', on_hold: 'On Hold',
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [token, setToken] = useState<string | null>(null)
  const [project, setProject] = useState<any>(null)
  const [units, setUnits] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [statusChanging, setStatusChanging] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const t = data.session?.access_token
      if (!t) { router.replace('/onboarding'); return }
      setToken(t)
      const [pRes, uRes] = await Promise.all([
        fetch(`${API}/api/projects/${id}`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API}/api/projects/${id}/units`, { headers: { Authorization: `Bearer ${t}` } }),
      ])
      if (pRes.ok) setProject(await pRes.json())
      if (uRes.ok) setUnits(await uRes.json())
      setLoading(false)
    })
  }, [id, router])

  async function handleStatusChange(newStatus: string) {
    if (!token) return
    setStatusChanging(true)
    const res = await fetch(`${API}/api/projects/${id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) setProject((p: any) => ({ ...p, status: newStatus }))
    setStatusChanging(false)
  }

  async function handleExport(format: 'csv' | 'pdf') {
    if (!token) return
    const res = await fetch(`${API}/api/projects/${id}/inventory-sheet${format === 'pdf' ? '/pdf' : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-${id}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredUnits = statusFilter ? units.filter(u => u.status === statusFilter) : units
  const summary = {
    total: units.length,
    available: units.filter(u => u.status === 'available').length,
    reserved: units.filter(u => u.status === 'reserved').length,
    sold: units.filter(u => u.status === 'sold').length,
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
        <DeveloperSidebar />
        <main style={{ flex: 1, padding: 32, color: '#595959', fontSize: 14 }}>Loading…</main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <DeveloperSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <a href="/projects" style={{ fontSize: 13, color: '#595959' }}>← Projects</a>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '6px 0 4px' }}>{project?.name}</h1>
            <p style={{ fontSize: 14, color: '#595959', margin: 0 }}>{project?.city}, {project?.province} · {project?.project_type?.replace('_', ' ')}</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Status dropdown — Task 10.5 */}
            <select
              value={project?.status ?? ''}
              onChange={e => handleStatusChange(e.target.value)}
              disabled={statusChanging}
              style={{ background: '#0D0D0D', border: `1px solid ${PROJECT_STATUS_COLORS[project?.status] ?? '#1A1A1A'}30`, borderRadius: 8, padding: '8px 14px', fontSize: 13, color: PROJECT_STATUS_COLORS[project?.status] ?? '#999', cursor: 'pointer', outline: 'none' }}
            >
              {Object.entries(PROJECT_STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            {/* Export dropdown */}
            <div style={{ position: 'relative' }}>
              <select
                onChange={e => { if (e.target.value) { handleExport(e.target.value as 'csv' | 'pdf'); e.target.value = '' } }}
                style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#999', cursor: 'pointer', outline: 'none' }}
              >
                <option value="">Export Inventory ▾</option>
                <option value="csv">Export CSV</option>
                <option value="pdf">Export PDF</option>
              </select>
            </div>
            <a href={`/projects/${id}/units/import`} style={{ background: '#0D0D0D', color: '#999', border: '1px solid #1A1A1A', borderRadius: 8, padding: '8px 14px', fontSize: 13 }}>
              Import CSV
            </a>
            <button style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              + Add Unit
            </button>
          </div>
        </div>

        {/* Photo gallery */}
        {project?.photos?.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto' }}>
            {project.photos.map((url: string, i: number) => (
              <img key={i} src={url} alt={`Photo ${i + 1}`} style={{ width: 160, height: 100, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
            ))}
          </div>
        )}

        {/* Real-time summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Units', value: summary.total, color: '#999' },
            { label: 'Available', value: summary.available, color: '#10B981' },
            { label: 'Reserved', value: summary.reserved, color: '#F59E0B' },
            { label: 'Sold', value: summary.sold, color: '#8B5CF6' },
          ].map(s => (
            <div key={s.label} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#595959' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Unit inventory table */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Unit Inventory</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {['', 'available', 'reserved', 'sold'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    background: statusFilter === s ? 'rgba(112,59,247,0.15)' : '#0D0D0D',
                    color: statusFilter === s ? '#703BF7' : '#595959',
                    border: `1px solid ${statusFilter === s ? 'rgba(112,59,247,0.3)' : '#1A1A1A'}`,
                    borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', textTransform: 'capitalize',
                  }}
                >
                  {s || 'All'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 120px 120px 100px', padding: '10px 16px', borderBottom: '1px solid #141414' }}>
              {['Unit ID', 'Type', 'Area (sqm)', 'Price (PHP)', 'Status', 'Floor Plan'].map(h => (
                <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>
            {filteredUnits.length === 0 ? (
              <div style={{ padding: '24px 16px', color: '#595959', fontSize: 14, textAlign: 'center' }}>No units found.</div>
            ) : filteredUnits.map((u: any, i: number) => (
              <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 120px 120px 100px', padding: '14px 16px', borderBottom: i < filteredUnits.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{u.identifier}</div>
                <div style={{ fontSize: 13, color: '#999' }}>{u.unit_type}</div>
                <div style={{ fontSize: 13, color: '#999' }}>{u.floor_area_sqm}</div>
                <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>₱{Number(u.price_php).toLocaleString()}</div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: `${STATUS_COLORS[u.status] ?? '#595959'}15`, color: STATUS_COLORS[u.status] ?? '#595959', textTransform: 'capitalize', display: 'inline-block' }}>
                  {u.status}
                </span>
                <div>
                  {u.floor_plan_url ? (
                    <a href={u.floor_plan_url} target="_blank" style={{ fontSize: 12, color: '#703BF7' }}>View</a>
                  ) : (
                    <span style={{ fontSize: 12, color: '#595959' }}>—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
