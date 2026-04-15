import { BrokerSidebar } from '@/components/BrokerSidebar'

const RATES = [
  { type: 'Default (All Types)', rate: '3%', rateType: 'Percentage' },
  { type: 'Commercial', rate: '2.5%', rateType: 'Percentage' },
  { type: 'Farm Lot', rate: '2%', rateType: 'Percentage' },
]

const RECORDS = [
  { property: 'House & Lot in Bacoor', agent: 'Juan Santos', salePrice: '₱2,800,000', rate: '3%', commission: '₱84,000', status: 'pending', date: 'Apr 10, 2026' },
  { property: 'Condo in Cebu IT Park', agent: 'Maria Cruz', salePrice: '₱5,200,000', rate: '3%', commission: '₱156,000', status: 'pending', date: 'Apr 8, 2026' },
  { property: 'Lot in Sta. Rosa', agent: 'Juan Santos', salePrice: '₱2,200,000', rate: '2.5%', commission: '₱55,000', status: 'paid', date: 'Mar 15, 2026' },
  { property: 'Modern House Davao', agent: 'Pedro Reyes', salePrice: '₱7,500,000', rate: '3%', commission: '₱225,000', status: 'paid', date: 'Mar 10, 2026' },
]

export default function BrokerCommissionsPage() {
  const pending = RECORDS.filter(r => r.status === 'pending').reduce((s, r) => s + parseInt(r.commission.replace(/[₱,]/g, '')), 0)
  const paid = RECORDS.filter(r => r.status === 'paid').reduce((s, r) => s + parseInt(r.commission.replace(/[₱,]/g, '')), 0)

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <BrokerSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Commission Management</h1>
          <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Set rates and track agent earnings</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 32 }}>
          {[
            { label: 'Pending Payouts', value: `₱${pending.toLocaleString()}`, color: '#F59E0B', icon: '⏳' },
            { label: 'Total Paid Out', value: `₱${paid.toLocaleString()}`, color: '#10B981', icon: '✅' },
            { label: 'Total Brokerage Revenue', value: `₱${(pending + paid).toLocaleString()}`, color: '#703BF7', icon: '💰' },
          ].map(s => (
            <div key={s.label} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: '20px 24px', display: 'flex', gap: 14, alignItems: 'center' }}>
              <span style={{ fontSize: 28 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: '#595959' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Commission Rates */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Commission Rates</h2>
            <button style={{ background: 'transparent', color: '#703BF7', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>Edit Rates</button>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {RATES.map(r => (
              <div key={r.type} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, padding: '16px 20px', flex: 1 }}>
                <div style={{ fontSize: 11, color: '#595959', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.type}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#703BF7' }}>{r.rate}</div>
                <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>{r.rateType}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Records */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Commission Records</h2>
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 120px 140px 80px 120px 100px 80px', padding: '12px 20px', borderBottom: '1px solid #141414' }}>
              {['Property', 'Agent', 'Sale Price', 'Rate', 'Commission', 'Date', 'Status'].map(h => (
                <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>
            {RECORDS.map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 120px 140px 80px 120px 100px 80px', padding: '16px 20px', borderBottom: i < RECORDS.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{r.property}</div>
                <div style={{ fontSize: 13, color: '#999' }}>{r.agent}</div>
                <div style={{ fontSize: 13, color: '#999' }}>{r.salePrice}</div>
                <div style={{ fontSize: 13, color: '#703BF7', fontWeight: 600 }}>{r.rate}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{r.commission}</div>
                <div style={{ fontSize: 12, color: '#595959' }}>{r.date}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: r.status === 'paid' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: r.status === 'paid' ? '#10B981' : '#F59E0B', textTransform: 'capitalize' }}>
                    {r.status}
                  </span>
                  {r.status === 'pending' && (
                    <button style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>Pay</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
