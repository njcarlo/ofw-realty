'use client'
import { useState } from 'react'
import { Navbar } from '@/components/Navbar'

const PACKAGES = [
  {
    id: 'pkg1',
    name: 'Essential Starter',
    price: 85000,
    supplier: 'HomeBase PH',
    items: ['Ceramic floor tiles (30sqm)', 'Interior latex paint (3 rooms)', 'Basic light fixtures (6 pcs)', 'Door handles & locks set'],
    delivery: '7–10 business days',
    commission: 4250,
    image: '🏠',
  },
  {
    id: 'pkg2',
    name: 'Modern Living',
    price: 185000,
    supplier: 'DesignHub Manila',
    items: ['Porcelain floor tiles (30sqm)', 'Premium paint + accent wall', 'LED lighting package', 'Kitchen cabinet set', 'Bathroom fixtures'],
    delivery: '14–21 business days',
    commission: 9250,
    image: '✨',
  },
  {
    id: 'pkg3',
    name: 'Premium Turnkey',
    price: 380000,
    supplier: 'LuxeFinish PH',
    items: ['Italian marble tiles', 'Full interior design consultation', 'Smart home lighting', 'Built-in wardrobes', 'Kitchen island + appliances', 'Bathroom renovation'],
    delivery: '30–45 business days',
    commission: 19000,
    image: '👑',
  },
]

export default function FitOutPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [ordered, setOrdered] = useState<string[]>([])
  const [toast, setToast] = useState('')

  function order(id: string) {
    setOrdered(prev => [...prev, id])
    setSelected(null)
    setToast('✅ Order placed! Your supplier will contact you within 24 hours.')
    setTimeout(() => setToast(''), 5000)
  }

  const pkg = PACKAGES.find(p => p.id === selected)

  return (
    <div style={{ minHeight: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <Navbar />
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, background: '#0D0D0D', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 10, padding: '14px 20px', fontSize: 14, color: '#10B981', zIndex: 9999 }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 900, margin: '0 auto', paddingTop: 112, paddingBottom: 60, paddingLeft: 32, paddingRight: 32 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(112,59,247,0.1)', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 99, padding: '6px 14px', fontSize: 12, color: '#703BF7', marginBottom: 16 }}>
            🔓 Unlocked after property turnover
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>Fit-Out Portal</h1>
          <p style={{ fontSize: 16, color: '#595959', margin: 0 }}>Browse finishing packages from verified suppliers. Order directly and have it delivered to your property.</p>
        </div>

        {/* Property context */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 20, marginBottom: 32, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ fontSize: 32 }}>🏡</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>House & Lot in Bacoor Cavite</div>
            <div style={{ fontSize: 13, color: '#595959' }}>Lot Area: 120 sqm · Turned over: Apr 1, 2026 · Managing Agent: Maria Santos</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#595959' }}>Affiliate Commission</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#703BF7' }}>Earned on orders</div>
          </div>
        </div>

        {/* Packages */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {PACKAGES.map(p => (
            <div key={p.id} style={{ background: '#0D0D0D', border: `1px solid ${ordered.includes(p.id) ? 'rgba(16,185,129,0.3)' : '#1A1A1A'}`, borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 36, textAlign: 'center' }}>{p.image}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: '#595959' }}>by {p.supplier}</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#703BF7' }}>₱{p.price.toLocaleString()}</div>
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 13, color: '#999', lineHeight: 1.8 }}>
                {p.items.map(item => <li key={item}>{item}</li>)}
              </ul>
              <div style={{ fontSize: 12, color: '#595959', paddingTop: 8, borderTop: '1px solid #141414' }}>
                🚚 Delivery: {p.delivery}
              </div>
              <div style={{ fontSize: 12, color: '#10B981' }}>
                💰 Agent commission: ₱{p.commission.toLocaleString()}
              </div>
              {ordered.includes(p.id) ? (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '10px', textAlign: 'center', fontSize: 13, color: '#10B981', fontWeight: 600 }}>
                  ✅ Order Placed
                </div>
              ) : (
                <button
                  onClick={() => setSelected(p.id)}
                  style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 20px rgba(112,59,247,0.3)' }}
                >
                  Order Package
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Order confirmation modal */}
      {selected && pkg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>Confirm Order</h2>
            <p style={{ fontSize: 13, color: '#595959', margin: '0 0 20px' }}>Your order will be processed by {pkg.supplier}.</p>
            <div style={{ background: '#141414', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{pkg.name}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#703BF7', marginBottom: 8 }}>₱{pkg.price.toLocaleString()}</div>
              <div style={{ fontSize: 13, color: '#595959' }}>🚚 {pkg.delivery}</div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => order(selected)} style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Confirm Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
