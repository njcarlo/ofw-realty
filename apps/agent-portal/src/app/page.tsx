// Agent Portal — Main Dashboard with KPIs
import { AgentSidebar } from '@/components/AgentSidebar'

export default function AgentDashboard() {
  const KPIS = [
    { label: 'Active Listings', value: '15', change: '+2 this month', icon: '🏠', color: '#703BF7', trend: 'up' },
    { label: 'New Leads', value: '8', change: '+3 this week', icon: '💬', color: '#10B981', trend: 'up' },
    { label: 'Pending Commissions', value: '₱245,000', change: '3 transactions', icon: '💰', color: '#F59E0B', trend: 'neutral' },
    { label: 'Open Houses', value: '2', change: 'This week', icon: '🏛️', color: '#8B5CF6', trend: 'neutral' },
    { label: 'Avg Lead Score', value: '3.8/5', change: '+0.4 vs last month', icon: '⭐', color: '#EC4899', trend: 'up' },
    { label: 'Conversion Rate', value: '24%', change: '+5% vs last month', icon: '📈', color: '#06B6D4', trend: 'up' },
    { label: 'Properties Sold', value: '3', change: 'This quarter', icon: '✅', color: '#10B981', trend: 'up' },
    { label: 'Performance Points', value: '1,240', change: 'Rank #2 in brokerage', icon: '🏆', color: '#F59E0B', trend: 'up' },
  ]

  const RECENT_LEADS = [
    { buyer: 'Jose Reyes', property: 'House & Lot in Bacoor', status: 'New', score: 5, time: '2h ago', source: '💬 Messenger' },
    { buyer: 'Ana Santos', property: 'Condo in BGC', status: 'In Progress', score: 4, time: '5h ago', source: '🏠 Platform' },
    { buyer: 'Mark Cruz', property: 'Lot in Sta. Rosa', status: 'Responded', score: 3, time: '1d ago', source: '🏠 Platform' },
    { buyer: 'Lisa Tan', property: 'Farm Lot in Calamba', status: 'New', score: 4, time: '2d ago', source: '💬 Messenger' },
  ]

  const QUICK_ACTIONS = [
    { label: 'Add New Listing', icon: '➕', href: '/listings/new', color: '#703BF7' },
    { label: 'Schedule Open House', icon: '🏛️', href: '/open-houses/new', color: '#8B5CF6' },
    { label: 'Start Site Visit', icon: '📍', href: '/site-visits/new', color: '#10B981' },
    { label: 'View All Leads', icon: '💬', href: '/leads', color: '#F59E0B' },
    { label: 'Post to Social', icon: '📱', href: '/social', color: '#EC4899' },
    { label: 'Run Facebook Ad', icon: '📢', href: '/social/ads', color: '#EF4444' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <AgentSidebar />

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>Good morning, Juan 👋</h1>
            <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Here's what's happening with your listings today.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <a href="/listings/new" style={{ background: '#703BF7', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', boxShadow: '0 0 20px rgba(112,59,247,0.3)' }}>
              + New Listing
            </a>
          </div>
        </div>

        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {KPIS.map(kpi => (
            <div key={kpi.label} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${kpi.color}15`, border: `1px solid ${kpi.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {kpi.icon}
                </div>
                <span style={{ fontSize: 11, color: kpi.trend === 'up' ? '#10B981' : '#595959', fontWeight: 600, background: kpi.trend === 'up' ? 'rgba(16,185,129,0.1)' : 'transparent', padding: '2px 6px', borderRadius: 99 }}>
                  {kpi.trend === 'up' ? '↑' : '→'} {kpi.change}
                </span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{kpi.value}</div>
              <div style={{ fontSize: 13, color: '#595959' }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          {/* Recent Leads */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Recent Leads</h2>
              <a href="/leads" style={{ fontSize: 13, color: '#703BF7', textDecoration: 'none' }}>View all →</a>
            </div>
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
              {RECENT_LEADS.map((lead, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < RECENT_LEADS.length - 1 ? '1px solid #141414' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(112,59,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>👤</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{lead.buyer}</div>
                    <div style={{ fontSize: 12, color: '#595959', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.property}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, marginBottom: 4, background: lead.status === 'New' ? 'rgba(112,59,247,0.15)' : lead.status === 'In Progress' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: lead.status === 'New' ? '#703BF7' : lead.status === 'In Progress' ? '#F59E0B' : '#10B981' }}>
                      {lead.status}
                    </div>
                    <div style={{ fontSize: 11, color: '#595959' }}>{lead.source} · {lead.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Quick Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {QUICK_ACTIONS.map(action => (
                <a key={action.label} href={action.href} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 18px', background: '#0D0D0D', border: '1px solid #1A1A1A',
                  borderRadius: 10, textDecoration: 'none', color: '#fff', fontSize: 14, fontWeight: 500,
                  transition: 'border-color 0.15s',
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${action.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {action.icon}
                  </div>
                  {action.label}
                  <span style={{ marginLeft: 'auto', color: '#595959' }}>→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
