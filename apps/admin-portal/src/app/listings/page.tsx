import { AdminSidebar } from '@/components/AdminSidebar'
import { supabaseAdmin } from '@/lib/supabase'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'

const STATUS_COLORS: Record<string, string> = {
  active: '#10B981', reserved: '#F59E0B', sold: '#703BF7', deactivated: '#595959',
}

const TYPE_LABELS: Record<string, string> = {
  house_and_lot: 'House & Lot', residential_lot: 'Lot', condo: 'Condo',
  commercial: 'Commercial', farm_lot: 'Farm Lot',
}

async function getListings() {
  const { data } = await supabaseAdmin
    .from('listings')
    .select('id, title, property_type, price_php, city, province, status, is_featured, blockchain_verified, scam_flagged, created_at, realtors(users(full_name))')
    .order('created_at', { ascending: false })
    .limit(100)
  return data ?? []
}

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  return `₱${(n / 1000).toFixed(0)}K`
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default async function ListingsPage() {
  const listings = await getListings()
  const byStatus = listings.reduce((acc: any, l) => { acc[l.status] = (acc[l.status] ?? 0) + 1; return acc }, {})
  const scamFlagged = listings.filter(l => l.scam_flagged).length

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Listings</h1>
          <p style={{ fontSize: 14, color: '#595959', marginTop: 4 }}>{listings.length} total properties</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {Object.entries(byStatus).map(([status, count]: any) => (
            <div key={status} style={{ background: '#0D0D0D', border: `1px solid ${STATUS_COLORS[status] ?? '#1A1A1A'}30`, borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: STATUS_COLORS[status] ?? '#fff' }}>{count}</span>
              <span style={{ fontSize: 12, color: '#999', textTransform: 'capitalize' }}>{status}</span>
            </div>
          ))}
          {scamFlagged > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#EF4444' }}>{scamFlagged}</span>
              <span style={{ fontSize: 12, color: '#EF4444' }}>🚨 Scam Flagged</span>
            </div>
          )}
        </div>

        {/* Table */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 120px 120px 100px 80px 80px', padding: '10px 20px', borderBottom: '1px solid #141414' }}>
            {['Property', 'Type', 'Price', 'Location', 'Status', 'Badges', 'Added'].map(h => (
              <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>
          {listings.map((l, i) => (
            <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '2fr 100px 120px 120px 100px 80px 80px', padding: '12px 20px', borderBottom: i < listings.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}>
              <div>
                <a href={`${WEB_URL}/listings/${l.id}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, fontWeight: 600, color: l.scam_flagged ? '#EF4444' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                  {l.scam_flagged ? '🚨 ' : ''}{l.title}
                </a>
                <div style={{ fontSize: 11, color: '#595959' }}>{(l.realtors as any)?.users?.full_name ?? 'Unknown agent'}</div>
              </div>
              <div style={{ fontSize: 11, color: '#999' }}>{TYPE_LABELS[l.property_type] ?? l.property_type}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{formatPHP(l.price_php)}</div>
              <div style={{ fontSize: 12, color: '#595959' }}>{l.city}, {l.province}</div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: `${STATUS_COLORS[l.status] ?? '#595959'}15`, color: STATUS_COLORS[l.status] ?? '#595959', textTransform: 'capitalize', display: 'inline-block' }}>
                {l.status}
              </span>
              <div style={{ display: 'flex', gap: 3 }}>
                {l.is_featured && <span title="Featured" style={{ fontSize: 12 }}>⭐</span>}
                {l.blockchain_verified && <span title="Blockchain Verified" style={{ fontSize: 12 }}>🔗</span>}
              </div>
              <div style={{ fontSize: 11, color: '#595959' }}>{timeAgo(l.created_at)}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
