import { BrokerSidebar } from '@/components/BrokerSidebar'

const POOL = [
  { id: 'p001', type: 'House & Lot', address: 'Molino Blvd, Bacoor, Cavite', price: '₱3,200,000', area: '100 sqm', status: 'available', claimedBy: null, daysInPool: 5 },
  { id: 'p002', type: 'Residential Lot', address: 'Tagaytay Road, Sta. Rosa, Laguna', price: '₱1,800,000', area: '150 sqm', status: 'available', claimedBy: null, daysInPool: 12 },
  { id: 'p003', type: 'Condo', address: 'IT Park, Cebu City', price: '₱4,800,000', area: '42 sqm', status: 'claimed', claimedBy: 'Juan Santos', daysInPool: 3 },
  { id: 'p004', type: 'Farm Lot', address: 'Pansol, Calamba, Laguna', price: '₱2,100,000', area: '600 sqm', status: 'available', claimedBy: null, daysInPool: 28 },
  { id: 'p005', type: 'Commercial', address: 'MacArthur Highway, Angeles City', price: '₱6,000,000', area: '300 sqm', status: 'available', claimedBy: null, daysInPool: 31 },
]

export default function BrokerPoolPage() {
  const unclaimed30 = POOL.filter(p => p.status === 'available' && p.daysInPool > 30).length

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <BrokerSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Property Pool</h1>
            <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Add properties for your agents to claim and list</p>
          </div>
          <button style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 20px rgba(112,59,247,0.3)' }}>
            + Add to Pool
          </button>
        </div>

        {unclaimed30 > 0 && (
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 24 }}>
            <span style={{ fontSize: 13, color: '#F59E0B' }}>⚠️ {unclaimed30} propert{unclaimed30 > 1 ? 'ies have' : 'y has'} been unclaimed for over 30 days.</span>
          </div>
        )}

        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 120px 120px 100px 120px 100px', padding: '12px 20px', borderBottom: '1px solid #141414' }}>
            {['Property', 'Type', 'Price', 'Days', 'Claimed By', 'Status'].map(h => (
              <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>
          {POOL.map((p, i) => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 120px 120px 100px 120px 100px', padding: '16px 20px', borderBottom: i < POOL.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center', background: p.daysInPool > 30 ? 'rgba(245,158,11,0.03)' : 'transparent' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{p.address}</div>
                <div style={{ fontSize: 12, color: '#595959' }}>📐 {p.area}</div>
              </div>
              <div style={{ fontSize: 13, color: '#999' }}>{p.type}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{p.price}</div>
              <div style={{ fontSize: 13, color: p.daysInPool > 30 ? '#F59E0B' : '#999' }}>{p.daysInPool}d</div>
              <div style={{ fontSize: 13, color: p.claimedBy ? '#703BF7' : '#595959' }}>{p.claimedBy ?? '—'}</div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 99, background: p.status === 'available' ? 'rgba(16,185,129,0.15)' : 'rgba(112,59,247,0.15)', color: p.status === 'available' ? '#10B981' : '#703BF7', textTransform: 'capitalize' }}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
