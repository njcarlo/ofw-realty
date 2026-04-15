import { AgentSidebar } from '@/components/AgentSidebar'

const POOL = [
  { id: 'p001', type: 'House & Lot', address: 'Molino Blvd, Bacoor, Cavite', price: '₱3,200,000', area: '100 sqm', status: 'available', daysInPool: 5 },
  { id: 'p002', type: 'Residential Lot', address: 'Tagaytay Road, Sta. Rosa, Laguna', price: '₱1,800,000', area: '150 sqm', status: 'available', daysInPool: 12 },
  { id: 'p003', type: 'Condo', address: 'IT Park, Cebu City', price: '₱4,800,000', area: '42 sqm', status: 'claimed', daysInPool: 3 },
  { id: 'p004', type: 'Farm Lot', address: 'Pansol, Calamba, Laguna', price: '₱2,100,000', area: '600 sqm', status: 'available', daysInPool: 28 },
]

export default function PoolPage() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <AgentSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Property Pool</h1>
          <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Properties added by your brokerage — claim one to create a listing</p>
        </div>

        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ fontSize: 13, color: '#F59E0B' }}>1 property has been unclaimed for over 30 days. Claim it before it gets reassigned.</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {POOL.map(p => (
            <div key={p.id} style={{ background: '#0D0D0D', border: `1px solid ${p.daysInPool > 25 ? 'rgba(245,158,11,0.3)' : '#1A1A1A'}`, borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{p.type}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{p.address}</div>
                  <div style={{ fontSize: 13, color: '#595959' }}>📐 {p.area}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: p.status === 'available' ? 'rgba(16,185,129,0.15)' : 'rgba(112,59,247,0.15)', color: p.status === 'available' ? '#10B981' : '#703BF7', textTransform: 'capitalize' }}>
                  {p.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid #1A1A1A' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{p.price}</div>
                  <div style={{ fontSize: 11, color: p.daysInPool > 25 ? '#F59E0B' : '#595959' }}>{p.daysInPool} days in pool</div>
                </div>
                {p.status === 'available' && (
                  <button style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 16px rgba(112,59,247,0.3)' }}>
                    Claim & List
                  </button>
                )}
                {p.status === 'claimed' && (
                  <span style={{ fontSize: 13, color: '#595959' }}>Claimed by you</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
