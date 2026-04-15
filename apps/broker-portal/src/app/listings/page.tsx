import { BrokerSidebar } from '@/components/BrokerSidebar'

const LISTINGS = [
  { title: 'House & Lot in Bacoor Cavite', agent: 'Juan Santos', price: '₱2,800,000', city: 'Bacoor', status: 'active', views: 142, inquiries: 8 },
  { title: 'Condo Unit in Cebu IT Park', agent: 'Maria Cruz', price: '₱5,200,000', city: 'Cebu City', status: 'reserved', views: 318, inquiries: 21 },
  { title: 'Lot in Sta. Rosa Laguna', agent: 'Juan Santos', price: '₱2,200,000', city: 'Sta. Rosa', status: 'active', views: 203, inquiries: 12 },
  { title: 'Modern House in Davao City', agent: 'Pedro Reyes', price: '₱7,500,000', city: 'Davao City', status: 'active', views: 89, inquiries: 5 },
  { title: 'Beach Lot in Batangas', agent: 'Maria Cruz', price: '₱3,800,000', city: 'San Juan', status: 'active', views: 167, inquiries: 9 },
]

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active: { bg: 'rgba(16,185,129,0.15)', color: '#10B981' },
  reserved: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
  sold: { bg: 'rgba(112,59,247,0.15)', color: '#703BF7' },
}

export default function BrokerListingsPage() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <BrokerSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>All Listings</h1>
            <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>{LISTINGS.length} properties across all agents</p>
          </div>
          <a href="http://localhost:3002/listings/new" style={{ background: '#703BF7', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: '0 0 20px rgba(112,59,247,0.3)' }}>
            + Add Listing
          </a>
        </div>

        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 140px 140px 80px 80px 100px', padding: '12px 20px', borderBottom: '1px solid #141414' }}>
            {['Property', 'Agent', 'Price', 'Views', 'Leads', 'Status'].map(h => (
              <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>
          {LISTINGS.map((l, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 140px 140px 80px 80px 100px', padding: '16px 20px', borderBottom: i < LISTINGS.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{l.title}</div>
                <div style={{ fontSize: 12, color: '#595959' }}>📍 {l.city}</div>
              </div>
              <div style={{ fontSize: 13, color: '#999' }}>{l.agent}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{l.price}</div>
              <div style={{ fontSize: 13, color: '#999' }}>{l.views}</div>
              <div style={{ fontSize: 13, color: '#703BF7', fontWeight: 600 }}>{l.inquiries}</div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 99, background: STATUS_STYLE[l.status].bg, color: STATUS_STYLE[l.status].color, textTransform: 'capitalize' }}>
                {l.status}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
