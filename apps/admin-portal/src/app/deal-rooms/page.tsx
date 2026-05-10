import { AdminSidebar } from '@/components/AdminSidebar'
import { supabaseAdmin } from '@/lib/supabase'

async function getDealRooms() {
  const { data } = await supabaseAdmin
    .from('negotiation_rooms')
    .select('id, status, created_at, listing:listings(title, city, province), buyer:users!buyer_id(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(50)
  return data ?? []
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const STATUS_COLORS: Record<string, string> = {
  active: '#10B981', offer_accepted: '#06B6D4', reserved: '#F59E0B',
  closed: '#703BF7', cancelled: '#595959',
}

export default async function DealRoomsPage() {
  const rooms = await getDealRooms()
  const byStatus = rooms.reduce((acc: any, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc }, {})

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Deal Rooms</h1>
          <p style={{ fontSize: 14, color: '#595959', marginTop: 4 }}>Negotiation rooms across all portals</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {Object.entries(byStatus).map(([status, count]: any) => (
            <div key={status} style={{ background: '#0D0D0D', border: `1px solid ${STATUS_COLORS[status] ?? '#1A1A1A'}30`, borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: STATUS_COLORS[status] ?? '#fff' }}>{count}</span>
              <span style={{ fontSize: 12, color: '#999', textTransform: 'capitalize' }}>{status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px', padding: '10px 20px', borderBottom: '1px solid #141414' }}>
            {['Property', 'Buyer', 'Status', 'Created'].map(h => (
              <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>
          {rooms.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#595959', fontSize: 14 }}>No deal rooms yet</div>
          ) : rooms.map((r, i) => (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px', padding: '12px 20px', borderBottom: i < rooms.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(r.listing as any)?.title ?? 'Unknown listing'}</div>
                <div style={{ fontSize: 11, color: '#595959' }}>{(r.listing as any)?.city}, {(r.listing as any)?.province}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#fff' }}>{(r.buyer as any)?.full_name ?? '—'}</div>
                <div style={{ fontSize: 11, color: '#595959' }}>{(r.buyer as any)?.email}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: `${STATUS_COLORS[r.status] ?? '#595959'}15`, color: STATUS_COLORS[r.status] ?? '#595959', textTransform: 'capitalize', display: 'inline-block' }}>
                {r.status?.replace('_', ' ')}
              </span>
              <div style={{ fontSize: 11, color: '#595959' }}>{timeAgo(r.created_at)}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
