import { AgentSidebar } from '@/components/AgentSidebar'

const COMMISSIONS = [
  { property: 'House & Lot in Bacoor Cavite', salePrice: '₱2,800,000', rate: '3%', amount: '₱84,000', status: 'pending', date: 'Apr 10, 2026' },
  { property: 'Condo Unit in Cebu IT Park', salePrice: '₱5,200,000', rate: '3%', amount: '₱156,000', status: 'pending', date: 'Apr 8, 2026' },
  { property: 'Lot in Sta. Rosa Laguna', salePrice: '₱2,200,000', rate: '2.5%', amount: '₱55,000', status: 'paid', date: 'Mar 15, 2026' },
]

export default function CommissionsPage() {
  const pending = COMMISSIONS.filter(c => c.status === 'pending').reduce((s, c) => s + parseInt(c.amount.replace(/[₱,]/g, '')), 0)
  const paid = COMMISSIONS.filter(c => c.status === 'paid').reduce((s, c) => s + parseInt(c.amount.replace(/[₱,]/g, '')), 0)

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <AgentSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Commissions</h1>
          <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Track your earnings from property transactions</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Pending Payout', value: `₱${pending.toLocaleString()}`, color: '#F59E0B', icon: '⏳' },
            { label: 'Total Paid', value: `₱${paid.toLocaleString()}`, color: '#10B981', icon: '✅' },
            { label: 'Default Rate', value: '3%', color: '#703BF7', icon: '📊' },
          ].map(s => (
            <div key={s.label} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: '20px 24px', display: 'flex', gap: 14, alignItems: 'center' }}>
              <span style={{ fontSize: 28 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: '#595959' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 140px 80px 120px 100px 80px', padding: '12px 20px', borderBottom: '1px solid #141414' }}>
            {['Property', 'Sale Price', 'Rate', 'Commission', 'Date', 'Status'].map(h => (
              <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>
          {COMMISSIONS.map((c, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 140px 80px 120px 100px 80px', padding: '16px 20px', borderBottom: i < COMMISSIONS.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{c.property}</div>
              <div style={{ fontSize: 13, color: '#999' }}>{c.salePrice}</div>
              <div style={{ fontSize: 13, color: '#703BF7', fontWeight: 600 }}>{c.rate}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{c.amount}</div>
              <div style={{ fontSize: 12, color: '#595959' }}>{c.date}</div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 99, background: c.status === 'paid' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: c.status === 'paid' ? '#10B981' : '#F59E0B', textTransform: 'capitalize' }}>
                {c.status}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
