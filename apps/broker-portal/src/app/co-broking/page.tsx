import { BrokerSidebar } from '@/components/BrokerSidebar'

export default function CoBrokingPage() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <BrokerSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Co-Broking Network</h1>
          <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Share inventory with partner brokerages — prevent ghost listings</p>
        </div>

        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#10B981', marginBottom: 2 }}>✓ Co-Broking Network: Active</div>
            <div style={{ fontSize: 13, color: '#595959' }}>Your listings are visible to 3 partner brokerages</div>
          </div>
          <button style={{ background: 'transparent', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>Opt Out</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Partner Brokerages</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Cavite Realty Group', 'Laguna Properties Inc.', 'Metro Manila Homes'].map((b, i) => (
                <div key={i} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{b}</div>
                    <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>✓ Verified Brokerage</div>
                  </div>
                  <span style={{ fontSize: 11, color: '#10B981', background: 'rgba(16,185,129,0.15)', padding: '3px 8px', borderRadius: 99, fontWeight: 600 }}>Active</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Co-Listed Properties</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { property: 'Beach Lot in Batangas', partner: 'Cavite Realty Group', split: '50/50', status: 'approved' },
                { property: 'Condo in Cebu IT Park', partner: 'Metro Manila Homes', split: '60/40', status: 'pending' },
              ].map((c, i) => (
                <div key={i} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, padding: '16px 20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{c.property}</div>
                  <div style={{ fontSize: 12, color: '#595959', marginBottom: 8 }}>Partner: {c.partner} · Split: {c.split}</div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: c.status === 'approved' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: c.status === 'approved' ? '#10B981' : '#F59E0B', textTransform: 'capitalize' }}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
