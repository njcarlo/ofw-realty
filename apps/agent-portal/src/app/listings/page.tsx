import { AgentSidebar } from '@/components/AgentSidebar'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://ofw-realty-web.vercel.app'

const LISTINGS = [
  { id: 'b1000004', title: 'House & Lot in Bacoor Cavite', type: 'House & Lot', price: '₱2,800,000', city: 'Bacoor', province: 'Cavite', status: 'active', views: 142, inquiries: 8, featured: true, verified: true },
  { id: 'b1000005', title: 'Lot in Dasmariñas Cavite', type: 'Residential Lot', price: '₱1,500,000', city: 'Dasmariñas', province: 'Cavite', status: 'active', views: 89, inquiries: 4, featured: false, verified: true },
  { id: 'b1000007', title: 'Lot in Sta. Rosa Laguna', type: 'Residential Lot', price: '₱2,200,000', city: 'Sta. Rosa', province: 'Laguna', status: 'active', views: 203, inquiries: 12, featured: true, verified: true },
  { id: 'b1000009', title: 'Condo Unit in Cebu IT Park', type: 'Condo', price: '₱5,200,000', city: 'Cebu City', province: 'Cebu', status: 'reserved', views: 318, inquiries: 21, featured: true, verified: true },
  { id: 'b1000011', title: 'Lot in Davao City', type: 'Residential Lot', price: '₱2,500,000', city: 'Davao City', province: 'Davao del Sur', status: 'active', views: 67, inquiries: 3, featured: false, verified: false },
]

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active: { bg: 'rgba(16,185,129,0.15)', color: '#10B981' },
  reserved: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
  sold: { bg: 'rgba(112,59,247,0.15)', color: '#703BF7' },
  deactivated: { bg: 'rgba(89,89,89,0.15)', color: '#595959' },
}

export default function ListingsPage() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <AgentSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>My Listings</h1>
            <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>{LISTINGS.length} properties managed</p>
          </div>
          <a href="/listings/new" style={{ background: '#703BF7', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: '0 0 20px rgba(112,59,247,0.3)' }}>
            + New Listing
          </a>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Active', value: LISTINGS.filter(l => l.status === 'active').length, color: '#10B981' },
            { label: 'Reserved', value: LISTINGS.filter(l => l.status === 'reserved').length, color: '#F59E0B' },
            { label: 'Total Views', value: LISTINGS.reduce((s, l) => s + l.views, 0), color: '#703BF7' },
            { label: 'Total Inquiries', value: LISTINGS.reduce((s, l) => s + l.inquiries, 0), color: '#06B6D4' },
          ].map(s => (
            <div key={s.label} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#595959' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 120px 120px 80px 80px 100px 120px', padding: '12px 20px', borderBottom: '1px solid #141414' }}>
            {['Property', 'Type', 'Price', 'Views', 'Leads', 'Status', 'Actions'].map(h => (
              <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>
          {LISTINGS.map((l, i) => (
            <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '2fr 120px 120px 80px 80px 100px 120px', padding: '16px 20px', borderBottom: i < LISTINGS.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{l.title}</div>
                <div style={{ fontSize: 12, color: '#595959' }}>📍 {l.city}, {l.province}</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  {l.featured && <span style={{ fontSize: 9, background: 'rgba(112,59,247,0.15)', color: '#703BF7', padding: '2px 6px', borderRadius: 99, fontWeight: 600 }}>⭐ Featured</span>}
                  {l.verified && <span style={{ fontSize: 9, background: 'rgba(16,185,129,0.15)', color: '#10B981', padding: '2px 6px', borderRadius: 99, fontWeight: 600 }}>✓ Verified</span>}
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#999' }}>{l.type}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{l.price}</div>
              <div style={{ fontSize: 13, color: '#999' }}>{l.views}</div>
              <div style={{ fontSize: 13, color: '#703BF7', fontWeight: 600 }}>{l.inquiries}</div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 99, background: STATUS_STYLE[l.status].bg, color: STATUS_STYLE[l.status].color, textTransform: 'capitalize' }}>
                  {l.status}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <a href={`/listings/${l.id}`} style={{ fontSize: 12, color: '#703BF7', padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(112,59,247,0.3)', background: 'rgba(112,59,247,0.08)' }}>Edit</a>
                <a href={`${WEB_URL}/listings/${l.id}`} target="_blank" style={{ fontSize: 12, color: '#595959', padding: '5px 10px', borderRadius: 6, border: '1px solid #1A1A1A' }}>View</a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
