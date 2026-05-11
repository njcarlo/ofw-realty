import { BrokerSidebar } from '@/components/BrokerSidebar'

const AGENT_PORTAL_URL = process.env.NEXT_PUBLIC_AGENT_PORTAL_URL ?? 'https://ofw-realty-agent-portal.vercel.app'

const AGENTS = [
  { name: 'Juan Santos', email: 'agent@demo.lupaph.com', listings: 8, leads: 12, sold: 3, points: 1240, verified: true, status: 'active' },
  { name: 'Maria Cruz', email: 'maria@lupaph.com', listings: 6, leads: 9, sold: 2, points: 980, verified: true, status: 'active' },
  { name: 'Pedro Reyes', email: 'pedro@lupaph.com', listings: 5, leads: 7, sold: 2, points: 870, verified: true, status: 'active' },
  { name: 'Ana Dela Cruz', email: 'ana@lupaph.com', listings: 4, leads: 6, sold: 1, points: 650, verified: false, status: 'pending' },
]

export default function AgentsPage() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <BrokerSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>My Agents</h1>
            <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>{AGENTS.length} agents in LupaPH Realty</p>
          </div>
          <button style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 20px rgba(112,59,247,0.3)' }}>
            + Invite Agent
          </button>
        </div>

        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 80px 80px 80px 100px 80px', padding: '12px 20px', borderBottom: '1px solid #141414' }}>
            {['Agent', 'Status', 'Listings', 'Leads', 'Sold', 'Points', 'Actions'].map(h => (
              <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>
          {AGENTS.map((a, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 100px 80px 80px 80px 100px 80px', padding: '16px 20px', borderBottom: i < AGENTS.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{a.name}</div>
                <div style={{ fontSize: 12, color: '#595959' }}>{a.email}</div>
                {a.verified && <span style={{ fontSize: 10, color: '#10B981', fontWeight: 600 }}>✓ Verified</span>}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 99, background: a.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: a.status === 'active' ? '#10B981' : '#F59E0B', textTransform: 'capitalize' }}>
                {a.status}
              </span>
              <div style={{ fontSize: 13, color: '#999' }}>{a.listings}</div>
              <div style={{ fontSize: 13, color: '#999' }}>{a.leads}</div>
              <div style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>{a.sold}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#703BF7' }}>{a.points.toLocaleString()}</div>
              <a href={`${AGENT_PORTAL_URL}`} target="_blank" rel="noopener noreferrer"
                style={{ background: 'transparent', color: '#703BF7', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 6, padding: '5px 10px', fontSize: 12 }}>View</a>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
