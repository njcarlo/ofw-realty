const API = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://ofw-realty-api-production.up.railway.app'

const DEMO_INQUIRIES = [
  { id: 'inq1', buyer_name: 'Jose Reyes', listing_title: 'House & Lot in Bacoor Cavite', message: 'Is this still available? I am an OFW in Dubai interested in this property.', status: 'pending', created_at: new Date(Date.now() - 1 * 3600000).toISOString() },
  { id: 'inq2', buyer_name: 'Ana Santos', listing_title: 'Condo Unit in Cebu IT Park', message: 'Can we schedule a virtual tour? I am based in Singapore.', status: 'responded', created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 'inq3', buyer_name: 'Mark Cruz', listing_title: 'Lot in Sta. Rosa Laguna', message: 'What is the lowest price you can offer?', status: 'closed', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
]

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:   { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
  responded: { bg: 'rgba(16,185,129,0.15)', color: '#10B981' },
  closed:    { bg: 'rgba(89,89,89,0.15)',   color: '#595959' },
}

async function getInquiries() {
  try {
    const res = await fetch(`${API}/admin/inquiries?limit=50`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      if (data.length) return { inquiries: data, isDemo: false }
    }
  } catch {}
  return { inquiries: DEMO_INQUIRIES, isDemo: true }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default async function AdminInquiriesPage() {
  const { inquiries, isDemo } = await getInquiries()

  const pending = inquiries.filter((i: any) => i.status === 'pending').length

  return (
    <div style={{ padding: 32, color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Inquiries</h1>
        <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>
          {inquiries.length} total · {pending} pending
        </p>
      </div>

      {isDemo && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>⚠️</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#F59E0B' }}>Demo Mode</span>
          <span style={{ fontSize: 13, color: '#595959' }}>— API unavailable, showing sample data.</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {inquiries.map((inq: any) => {
          const s = STATUS_STYLE[inq.status] ?? STATUS_STYLE.pending
          return (
            <div key={inq.id} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{inq.buyer_name}</div>
                  <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>Re: {inq.listing_title}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: s.bg, color: s.color, textTransform: 'capitalize' }}>
                    {inq.status}
                  </span>
                  <span style={{ fontSize: 11, color: '#595959' }}>{timeAgo(inq.created_at)}</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#999', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
                "{inq.message}"
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
