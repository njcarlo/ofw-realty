const API = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://ofw-realty-api-production.up.railway.app'
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://ofw-realty-web.vercel.app'

const DEMO_ROOMS = [
  { id: 'dr-001', slug: 'abc123', listing_title: 'House & Lot in Bacoor Cavite', buyer_name: 'Jose Reyes', realtor_name: 'Maria Santos', status: 'active', latest_offer: 2600000, last_activity_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'dr-002', slug: 'def456', listing_title: 'Condo Unit in Cebu IT Park', buyer_name: 'Ana Cruz', realtor_name: 'Pedro Dela Cruz', status: 'offer_accepted', latest_offer: 5000000, last_activity_at: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: 'dr-003', slug: 'ghi789', listing_title: 'Lot in Sta. Rosa Laguna', buyer_name: 'Mark Tan', realtor_name: 'Lisa Santos', status: 'disputed', latest_offer: 2100000, last_activity_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'dr-004', slug: 'jkl012', listing_title: 'Lot in Davao City', buyer_name: 'Grace Lim', realtor_name: 'Juan Reyes', status: 'closed', latest_offer: 2500000, last_activity_at: new Date(Date.now() - 7 * 86400000).toISOString() },
]

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  active:         { bg: 'rgba(16,185,129,0.15)',  color: '#10B981', label: 'Active' },
  offer_accepted: { bg: 'rgba(59,130,246,0.15)',  color: '#3B82F6', label: 'Offer Accepted' },
  reserved:       { bg: 'rgba(245,158,11,0.15)',  color: '#F59E0B', label: 'Reserved' },
  disputed:       { bg: 'rgba(239,68,68,0.15)',   color: '#EF4444', label: '⚠ Disputed' },
  closed:         { bg: 'rgba(89,89,89,0.15)',    color: '#595959', label: 'Closed' },
  cancelled:      { bg: 'rgba(89,89,89,0.15)',    color: '#595959', label: 'Cancelled' },
}

async function getDealRooms() {
  try {
    const res = await fetch(`${API}/admin/deal-rooms?limit=50`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      if (data.length) return { rooms: data, isDemo: false }
    }
  } catch {}
  return { rooms: DEMO_ROOMS, isDemo: true }
}

function formatPHP(n: number) {
  return `₱${n.toLocaleString()}`
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default async function AdminDealRoomsPage() {
  const { rooms, isDemo } = await getDealRooms()

  const disputed = rooms.filter((r: any) => r.status === 'disputed')

  return (
    <div style={{ padding: 32, color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Deal Rooms</h1>
        <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>{rooms.length} rooms · {disputed.length} disputed</p>
      </div>

      {isDemo && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>⚠️</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#F59E0B' }}>Demo Mode</span>
          <span style={{ fontSize: 13, color: '#595959' }}>— API unavailable, showing sample data.</span>
        </div>
      )}

      {/* Disputed queue */}
      {disputed.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#EF4444', marginBottom: 12 }}>
            ⚠️ Disputed Engagements — Requires Resolution ({disputed.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {disputed.map((r: any) => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0D0D0D', borderRadius: 8, padding: '12px 16px' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{r.listing_title}</div>
                  <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>Buyer: {r.buyer_name} · Agent: {r.realtor_name}</div>
                </div>
                <a
                  href={`${WEB_URL}/deal-rooms/${r.slug}`}
                  target="_blank"
                  style={{ fontSize: 12, color: '#EF4444', padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', textDecoration: 'none', whiteSpace: 'nowrap' }}
                >
                  Open Room ↗
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All rooms table */}
      <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 130px 120px 120px', padding: '12px 20px', borderBottom: '1px solid #141414' }}>
          {['Property', 'Buyer', 'Agent', 'Status', 'Latest Offer', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>

        {rooms.map((r: any, i: number) => {
          const s = STATUS_STYLE[r.status] ?? STATUS_STYLE.active
          return (
            <div
              key={r.id}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 130px 120px 120px', padding: '14px 20px', borderBottom: i < rooms.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center', background: r.status === 'disputed' ? 'rgba(239,68,68,0.03)' : 'transparent' }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{r.listing_title}</div>
                <div style={{ fontSize: 11, color: '#595959', marginTop: 2 }}>{timeAgo(r.last_activity_at)}</div>
              </div>
              <div style={{ fontSize: 13, color: '#999' }}>{r.buyer_name}</div>
              <div style={{ fontSize: 13, color: '#999' }}>{r.realtor_name}</div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: s.bg, color: s.color }}>
                  {s.label}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                {r.latest_offer ? formatPHP(r.latest_offer) : '—'}
              </div>
              <div>
                <a
                  href={`${WEB_URL}/deal-rooms/${r.slug}`}
                  target="_blank"
                  style={{ fontSize: 12, color: '#703BF7', padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(112,59,247,0.3)', background: 'rgba(112,59,247,0.08)', textDecoration: 'none' }}
                >
                  Open Room ↗
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
