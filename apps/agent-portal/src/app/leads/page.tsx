'use client'
import { useState, useEffect } from 'react'
import { AgentSidebar } from '@/components/AgentSidebar'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: 'rgba(245,158,11,0.15)',  color: '#F59E0B', label: 'New' },
  responded: { bg: 'rgba(59,130,246,0.15)',  color: '#3B82F6', label: 'In Progress' },
  closed:    { bg: 'rgba(89,89,89,0.15)',    color: '#595959', label: 'Closed' },
}

const SOURCE_LABELS: Record<string, string> = {
  platform:  '🏠 Platform',
  messenger: '💬 Messenger',
  viber:     '📱 Viber',
}

const SCORE_COLOR = (score: number) =>
  score >= 4 ? '#10B981' : score >= 2 ? '#F59E0B' : '#595959'

// Demo leads shown when API returns empty
const DEMO_LEADS = [
  { id: 'd1', users: { full_name: 'Maria Santos', email: 'maria@example.com', avatar_url: null }, listings: { title: 'House & Lot in Bacoor Cavite', city: 'Bacoor' }, status: 'pending', lead_score: 5, source: 'platform', offer_price_php: 3200000, message: 'Hi, I am interested in this property. Can we schedule a viewing?', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'd2', users: { full_name: 'Jose Reyes', email: 'jose@example.com', avatar_url: null }, listings: { title: 'Condo Unit in Cebu IT Park', city: 'Cebu City' }, status: 'responded', lead_score: 4, source: 'messenger', offer_price_php: null, message: 'Is this still available? I am an OFW in Dubai.', created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: 'd3', users: { full_name: 'Ana Cruz', email: 'ana@example.com', avatar_url: null }, listings: { title: 'Lot in Sta. Rosa Laguna', city: 'Sta. Rosa' }, status: 'responded', lead_score: 3, source: 'platform', offer_price_php: 1800000, message: 'I would like to make an offer on this lot.', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'd4', users: { full_name: 'Carlo Mendoza', email: 'carlo@example.com', avatar_url: null }, listings: { title: 'House & Lot in Bacoor Cavite', city: 'Bacoor' }, status: 'closed', lead_score: 2, source: 'viber', offer_price_php: null, message: 'Just inquiring about the price.', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'd5', users: { full_name: 'Liza Flores', email: 'liza@example.com', avatar_url: null }, listings: { title: 'Condo Unit in Cebu IT Park', city: 'Cebu City' }, status: 'pending', lead_score: 5, source: 'messenger', offer_price_php: 4100000, message: 'Very interested! I am ready to buy. Can we talk?', created_at: new Date(Date.now() - 30 * 60000).toISOString() },
]

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => { loadLeads() }, [filter])

  async function loadLeads() {
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const res = await fetch(`${API}/leads${params}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setLeads(data.length > 0 ? data : DEMO_LEADS)
      } else {
        setLeads(DEMO_LEADS)
      }
    } catch {
      setLeads(DEMO_LEADS)
    }
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id)
    try {
      const res = await fetch(`${API}/leads/${id}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
        if (selected?.id === id) setSelected((prev: any) => ({ ...prev, status }))
        setToast(`✅ Lead marked as ${STATUS_CONFIG[status]?.label}`)
        setTimeout(() => setToast(''), 3000)
      }
    } catch {}
    setUpdatingId(null)
  }

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter)
  const counts = {
    all: leads.length,
    pending: leads.filter(l => l.status === 'pending').length,
    responded: leads.filter(l => l.status === 'responded').length,
    closed: leads.filter(l => l.status === 'closed').length,
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <AgentSidebar />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {toast && (
          <div style={{ position: 'fixed', top: 24, right: 24, background: '#0D0D0D', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 10, padding: '12px 18px', fontSize: 13, color: '#10B981', zIndex: 9999 }}>
            {toast}
          </div>
        )}

        {/* Header */}
        <div style={{ padding: '28px 32px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Lead Management</h1>
              <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Track and manage all buyer inquiries</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { label: 'Total', value: counts.all, color: '#fff' },
                { label: 'New', value: counts.pending, color: '#F59E0B' },
                { label: 'Active', value: counts.responded, color: '#3B82F6' },
              ].map(s => (
                <div key={s.label} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, padding: '10px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#595959' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 4, background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, padding: 4, width: 'fit-content' }}>
            {(['all', 'pending', 'responded', 'closed'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: filter === f ? '#703BF7' : 'transparent',
                color: filter === f ? '#fff' : '#595959',
              }}>
                {f === 'all' ? `All (${counts.all})` : `${STATUS_CONFIG[f].label} (${counts[f]})`}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', gap: 0, padding: '16px 32px 28px' }}>

          {/* Lead list */}
          <div style={{ flex: selected ? '0 0 420px' : '1', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: selected ? 16 : 0 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#595959' }}>Loading leads...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#595959' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#999', marginBottom: 6 }}>No leads yet</div>
                <div style={{ fontSize: 13 }}>Leads appear when buyers inquire about your listings</div>
              </div>
            ) : filtered.map(lead => {
              const s = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.pending
              const isNew = lead.status === 'pending'
              return (
                <div
                  key={lead.id}
                  onClick={() => setSelected(selected?.id === lead.id ? null : lead)}
                  style={{
                    background: selected?.id === lead.id ? 'rgba(112,59,247,0.08)' : '#0D0D0D',
                    border: `1px solid ${selected?.id === lead.id ? 'rgba(112,59,247,0.35)' : isNew ? 'rgba(245,158,11,0.2)' : '#1A1A1A'}`,
                    borderRadius: 12, padding: '16px 18px', cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                        {lead.users?.full_name?.[0] ?? '?'}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{lead.users?.full_name ?? 'Unknown'}</div>
                        <div style={{ fontSize: 12, color: '#595959' }}>{lead.listings?.title}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {/* Lead score */}
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1,2,3,4,5].map(i => (
                          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i <= (lead.lead_score ?? 0) ? SCORE_COLOR(lead.lead_score) : '#1A1A1A' }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#595959', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>
                    {lead.message}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#595959' }}>
                    <span>{SOURCE_LABELS[lead.source] ?? lead.source}</span>
                    <span>{timeAgo(lead.created_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Lead detail panel */}
          {selected && (
            <div style={{ flex: 1, background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, padding: 24, overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{selected.users?.full_name}</div>
                  <div style={{ fontSize: 13, color: '#595959' }}>{selected.users?.email}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: '#595959', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
              </div>

              {/* Property */}
              <div style={{ background: '#141414', border: '1px solid #1A1A1A', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#595959', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Property</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{selected.listings?.title}</div>
                {selected.offer_price_php && (
                  <div style={{ fontSize: 13, color: '#703BF7', marginTop: 4, fontWeight: 700 }}>
                    Offer: ₱{selected.offer_price_php.toLocaleString()}
                  </div>
                )}
              </div>

              {/* Message */}
              <div style={{ background: '#141414', border: '1px solid #1A1A1A', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#595959', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Message</div>
                <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.6 }}>{selected.message}</div>
              </div>

              {/* Meta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Source', value: SOURCE_LABELS[selected.source] ?? selected.source },
                  { label: 'Lead Score', value: `${'★'.repeat(selected.lead_score ?? 0)}${'☆'.repeat(5 - (selected.lead_score ?? 0))}` },
                  { label: 'Received', value: new Date(selected.created_at).toLocaleString() },
                  { label: 'Status', value: STATUS_CONFIG[selected.status]?.label ?? selected.status },
                ].map(s => (
                  <div key={s.label} style={{ background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: '#595959', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ fontSize: 12, color: '#595959', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Update Status</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['pending', 'responded', 'closed'] as const).map(s => {
                  const cfg = STATUS_CONFIG[s]
                  const isActive = selected.status === s
                  return (
                    <button
                      key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      disabled={isActive || updatingId === selected.id}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: isActive ? 'default' : 'pointer',
                        border: `1px solid ${isActive ? cfg.color : '#1A1A1A'}`,
                        background: isActive ? cfg.bg : '#141414',
                        color: isActive ? cfg.color : '#595959',
                        opacity: updatingId === selected.id ? 0.5 : 1,
                      }}
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>

              <div style={{ marginTop: 16 }}>
                <button style={{ width: '100%', background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 20px rgba(112,59,247,0.3)' }}>
                  💬 Reply to Lead
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
