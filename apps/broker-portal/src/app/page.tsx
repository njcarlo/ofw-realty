// Broker Portal — Main Dashboard with KPIs
export default function BrokerDashboard() {
  const KPIS = [
    { label: 'Total Listings', value: '47', change: '+5 this month', icon: '🏠', color: '#703BF7', trend: 'up' },
    { label: 'Active Agents', value: '8', change: '2 pending verification', icon: '👥', color: '#10B981', trend: 'neutral' },
    { label: 'Total Revenue', value: '₱1.2M', change: '+18% vs last quarter', icon: '💰', color: '#F59E0B', trend: 'up' },
    { label: 'Pending Commissions', value: '₱380,000', change: '7 transactions', icon: '📊', color: '#8B5CF6', trend: 'neutral' },
    { label: 'New Leads (Team)', value: '34', change: '+12 this week', icon: '💬', color: '#EC4899', trend: 'up' },
    { label: 'Properties Sold', value: '12', change: 'This quarter', icon: '✅', color: '#10B981', trend: 'up' },
    { label: 'Conversion Rate', value: '31%', change: '+7% vs last quarter', icon: '📈', color: '#06B6D4', trend: 'up' },
    { label: 'Ad Spend (Month)', value: '₱45,000', change: '₱55,000 remaining cap', icon: '📢', color: '#EF4444', trend: 'neutral' },
    { label: 'Pool Properties', value: '6', change: '2 unclaimed >30 days', icon: '📋', color: '#F59E0B', trend: 'neutral' },
    { label: 'Co-Broking Deals', value: '3', change: 'Active co-listings', icon: '🤝', color: '#703BF7', trend: 'up' },
    { label: 'Verified Badge', value: '✓ Active', change: 'Expires in 8 months', icon: '🔐', color: '#10B981', trend: 'up' },
    { label: 'Open Houses', value: '5', change: 'Scheduled this week', icon: '🏛️', color: '#8B5CF6', trend: 'up' },
  ]

  const TOP_AGENTS = [
    { name: 'Juan Santos', listings: 8, leads: 12, sold: 3, points: 1240, rank: 1 },
    { name: 'Maria Cruz', listings: 6, leads: 9, sold: 2, points: 980, rank: 2 },
    { name: 'Pedro Reyes', listings: 5, leads: 7, sold: 2, points: 870, rank: 3 },
    { name: 'Ana Dela Cruz', listings: 4, leads: 6, sold: 1, points: 650, rank: 4 },
  ]

  const RECENT_TRANSACTIONS = [
    { property: 'House & Lot in Bacoor', agent: 'Juan Santos', amount: '₱2,800,000', commission: '₱84,000', status: 'Sold' },
    { property: 'Condo in BGC', agent: 'Maria Cruz', amount: '₱4,500,000', commission: '₱135,000', status: 'Reserved' },
    { property: 'Lot in Sta. Rosa', agent: 'Pedro Reyes', amount: '₱2,200,000', commission: '₱66,000', status: 'Sold' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#0D0D0D', borderRight: '1px solid #1A1A1A', padding: '24px 0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #1A1A1A' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>LUPA <span style={{ color: '#703BF7' }}>PH</span></div>
          <div style={{ fontSize: 11, color: '#595959', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Broker Portal</div>
        </div>
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {[
            { icon: '📊', label: 'Dashboard', href: '/', active: true },
            { icon: '👥', label: 'My Agents', href: '/agents' },
            { icon: '🏠', label: 'All Listings', href: '/listings' },
            { icon: '📋', label: 'Property Pool', href: '/pool' },
            { icon: '💰', label: 'Commissions', href: '/commissions' },
            { icon: '🤝', label: 'Co-Broking', href: '/co-broking' },
            { icon: '📢', label: 'Ad Campaigns', href: '/ads' },
            { icon: '📄', label: 'Documents', href: '/documents' },
            { icon: '🏆', label: 'Leaderboard', href: '/performance' },
            { icon: '🏢', label: 'Company Profile', href: '/profile' },
          ].map(item => (
            <a key={item.label} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, marginBottom: 2,
              textDecoration: 'none', fontSize: 14, fontWeight: 500,
              background: item.active ? 'rgba(112,59,247,0.15)' : 'transparent',
              color: item.active ? '#703BF7' : '#595959',
              borderLeft: item.active ? '2px solid #703BF7' : '2px solid transparent',
            }}>
              <span>{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #1A1A1A' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(112,59,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏢</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Ana Broker Cruz</div>
              <div style={{ fontSize: 11, color: '#595959' }}>LupaPH Realty</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>Brokerage Overview 🏢</h1>
            <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>LupaPH Realty · 8 agents · ✓ Verified Brokerage</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <a href="/agents/invite" style={{ background: '#0D0D0D', color: '#999', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: 'none', border: '1px solid #1A1A1A' }}>
              + Invite Agent
            </a>
            <a href="/pool/new" style={{ background: '#703BF7', color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', boxShadow: '0 0 20px rgba(112,59,247,0.3)' }}>
              + Add to Pool
            </a>
          </div>
        </div>

        {/* KPI Grid — 4 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
          {KPIS.map(kpi => (
            <div key={kpi.label} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: `${kpi.color}15`, border: `1px solid ${kpi.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
                  {kpi.icon}
                </div>
                <span style={{ fontSize: 10, color: kpi.trend === 'up' ? '#10B981' : '#595959', fontWeight: 600, background: kpi.trend === 'up' ? 'rgba(16,185,129,0.1)' : 'transparent', padding: '2px 6px', borderRadius: 99 }}>
                  {kpi.trend === 'up' ? '↑' : '→'}
                </span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{kpi.value}</div>
              <div style={{ fontSize: 12, color: '#595959', marginBottom: 2 }}>{kpi.label}</div>
              <div style={{ fontSize: 11, color: '#444' }}>{kpi.change}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Agent Leaderboard */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>🏆 Agent Leaderboard</h2>
              <a href="/performance" style={{ fontSize: 13, color: '#703BF7', textDecoration: 'none' }}>View all →</a>
            </div>
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 60px 60px 60px 80px', gap: 0, padding: '10px 16px', borderBottom: '1px solid #141414' }}>
                {['#', 'Agent', 'Lists', 'Leads', 'Sold', 'Points'].map(h => (
                  <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                ))}
              </div>
              {TOP_AGENTS.map((agent, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 60px 60px 60px 80px', gap: 0, padding: '14px 16px', borderBottom: i < TOP_AGENTS.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: i === 0 ? '#F59E0B' : '#595959' }}>#{agent.rank}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{agent.name}</div>
                  <div style={{ fontSize: 13, color: '#999' }}>{agent.listings}</div>
                  <div style={{ fontSize: 13, color: '#999' }}>{agent.leads}</div>
                  <div style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>{agent.sold}</div>
                  <div style={{ fontSize: 13, color: '#703BF7', fontWeight: 700 }}>{agent.points.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Recent Transactions</h2>
              <a href="/commissions" style={{ fontSize: 13, color: '#703BF7', textDecoration: 'none' }}>View all →</a>
            </div>
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
              {RECENT_TRANSACTIONS.map((tx, i) => (
                <div key={i} style={{ padding: '16px 20px', borderBottom: i < RECENT_TRANSACTIONS.length - 1 ? '1px solid #141414' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', flex: 1, marginRight: 12 }}>{tx.property}</div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: tx.status === 'Sold' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: tx.status === 'Sold' ? '#10B981' : '#F59E0B', flexShrink: 0 }}>
                      {tx.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: '#595959' }}>Agent: {tx.agent}</div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{tx.amount}</div>
                      <div style={{ fontSize: 11, color: '#703BF7' }}>Commission: {tx.commission}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
