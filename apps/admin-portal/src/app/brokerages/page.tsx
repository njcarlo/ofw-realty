const API = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://ofw-realty-api-production.up.railway.app'

const DEMO_BROKERAGES = [
  { id: 'br1', name: 'LupaPH Realty', owner: 'Ana Broker Cruz', agents: 8, listings: 47, verified: true, created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: 'br2', name: 'Cebu Properties Inc.', owner: 'Pedro Santos', agents: 5, listings: 23, verified: true, created_at: new Date(Date.now() - 60 * 86400000).toISOString() },
  { id: 'br3', name: 'Davao Realty Group', owner: 'Maria Reyes', agents: 3, listings: 12, verified: false, created_at: new Date(Date.now() - 14 * 86400000).toISOString() },
]

async function getBrokerages() {
  try {
    const res = await fetch(`${API}/admin/brokerages?limit=50`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      if (data.length) return { brokerages: data, isDemo: false }
    }
  } catch {}
  return { brokerages: DEMO_BROKERAGES, isDemo: true }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { dateStyle: 'medium' })
}

export default async function AdminBrokeragesPage() {
  const { brokerages, isDemo } = await getBrokerages()

  return (
    <div style={{ padding: 32, color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Brokerages</h1>
        <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>{brokerages.length} registered brokerages</p>
      </div>

      {isDemo && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>⚠️</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#F59E0B' }}>Demo Mode</span>
          <span style={{ fontSize: 13, color: '#595959' }}>— API unavailable, showing sample data.</span>
        </div>
      )}

      <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 80px 100px 100px 80px', padding: '12px 20px', borderBottom: '1px solid #141414' }}>
          {['Brokerage', 'Owner', 'Agents', 'Listings', 'Verified', 'Registered', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>

        {brokerages.map((b: any, i: number) => (
          <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 80px 100px 100px 80px', padding: '14px 20px', borderBottom: i < brokerages.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{b.name}</div>
            </div>
            <div style={{ fontSize: 13, color: '#999' }}>{b.owner}</div>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{b.agents}</div>
            <div style={{ fontSize: 13, color: '#999' }}>{b.listings}</div>
            <div style={{ fontSize: 13, color: b.verified ? '#10B981' : '#595959' }}>
              {b.verified ? '✓ Verified' : '— Pending'}
            </div>
            <div style={{ fontSize: 12, color: '#595959' }}>{formatDate(b.created_at)}</div>
            <div>
              <a
                href={`/brokerages/${b.id}`}
                style={{ fontSize: 12, color: '#703BF7', padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(112,59,247,0.3)', background: 'rgba(112,59,247,0.08)', textDecoration: 'none' }}
              >
                View
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
