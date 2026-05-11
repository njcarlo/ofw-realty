import { AdminSidebar } from '@/components/AdminSidebar'
import { supabaseAdmin } from '@/lib/supabase'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://ofw-realty-web.vercel.app'

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  responded: '#10B981',
  closed: '#595959',
}

async function getInquiries() {
  const { data } = await supabaseAdmin
    .from('inquiries')
    .select(`
      id, message, offer_price_php, status, lead_score, source, created_at,
      listing:listings(id, title, city, province),
      buyer:users!buyer_id(id, full_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(100)
  return data ?? []
}

function formatPHP(n: number) {
  if (!n) return '—'
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  return `₱${(n / 1000).toFixed(0)}K`
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const SOURCE_LABELS: Record<string, string> = {
  platform: '🌐 Platform',
  messenger: '💬 Messenger',
  viber: '📱 Viber',
}

export default async function InquiriesPage() {
  const inquiries = await getInquiries()

  const byStatus = inquiries.reduce((acc: any, i) => {
    acc[i.status] = (acc[i.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Inquiries</h1>
          <p style={{ fontSize: 14, color: '#595959', marginTop: 4 }}>{inquiries.length} total buyer inquiries</p>
        </div>

        {/* Status breakdown */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {Object.entries(byStatus).map(([status, count]: any) => (
            <div key={status} style={{ background: '#0D0D0D', border: `1px solid ${STATUS_COLORS[status] ?? '#1A1A1A'}30`, borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: STATUS_COLORS[status] ?? '#fff' }}>{count}</span>
              <span style={{ fontSize: 12, color: '#999', textTransform: 'capitalize' }}>{status}</span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 80px 80px 100px 80px', padding: '10px 20px', borderBottom: '1px solid #141414' }}>
            {['Buyer', 'Property', 'Offer', 'Score', 'Source', 'Status', 'Time'].map(h => (
              <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>

          {inquiries.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#595959', fontSize: 14 }}>No inquiries yet</div>
          ) : inquiries.map((inq: any, i: number) => (
            <div key={inq.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 80px 80px 100px 80px', padding: '12px 20px', borderBottom: i < inquiries.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}>
              {/* Buyer */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{inq.buyer?.full_name ?? '—'}</div>
                <div style={{ fontSize: 11, color: '#595959', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inq.buyer?.email ?? '—'}</div>
              </div>

              {/* Property */}
              <div>
                {inq.listing ? (
                  <a href={`${WEB_URL}/listings/${inq.listing.id}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, fontWeight: 600, color: '#703BF7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                    {inq.listing.title}
                  </a>
                ) : <span style={{ fontSize: 12, color: '#595959' }}>—</span>}
                {inq.listing && <div style={{ fontSize: 11, color: '#595959' }}>📍 {inq.listing.city}</div>}
              </div>

              {/* Offer */}
              <div style={{ fontSize: 13, fontWeight: 600, color: inq.offer_price_php ? '#10B981' : '#595959' }}>
                {formatPHP(inq.offer_price_php)}
              </div>

              {/* Lead score */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: inq.lead_score >= 4 ? '#10B981' : inq.lead_score >= 2 ? '#F59E0B' : '#595959' }}>
                  {inq.lead_score ?? 0}
                </span>
                <span style={{ fontSize: 10, color: '#595959' }}>/5</span>
              </div>

              {/* Source */}
              <div style={{ fontSize: 11, color: '#595959' }}>{SOURCE_LABELS[inq.source] ?? inq.source}</div>

              {/* Status */}
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: `${STATUS_COLORS[inq.status] ?? '#595959'}15`, color: STATUS_COLORS[inq.status] ?? '#595959', textTransform: 'capitalize', display: 'inline-block' }}>
                {inq.status}
              </span>

              {/* Time */}
              <div style={{ fontSize: 11, color: '#595959' }}>{timeAgo(inq.created_at)}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
