import { AdminSidebar } from '@/components/AdminSidebar'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://ofw-realty-api-production.up.railway.app'

function StatCard({ label, value, sub, color, href }: { label: string; value: string | number; sub?: string; color: string; href?: string }) {
  const content = (
    <div style={{ background: '#0D0D0D', border: `1px solid ${color}20`, borderRadius: 12, padding: '18px 20px', transition: 'border-color 0.15s' }}
      onMouseEnter={e => href && ((e.currentTarget as HTMLElement).style.borderColor = `${color}50`)}
      onMouseLeave={e => href && ((e.currentTarget as HTMLElement).style.borderColor = `${color}20`)}
    >
      <div style={{ fontSize: 28, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#595959' }}>{sub}</div>}
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

function SectionHeader({ title, sub, href }: { title: string; sub: string; href?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{title}</div>
        <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>{sub}</div>
      </div>
      {href && <Link href={href} style={{ fontSize: 12, color: '#703BF7' }}>View all →</Link>}
    </div>
  )
}

async function getStats() {
  const safeCount = async (query: any) => {
    try { const r = await query; return r.count ?? 0 } catch { return 0 }
  }

  const [
    totalUsers, totalListings, activeListings, pendingDocs,
    totalBrokers, totalAgents, openRequests, b2bProfiles,
    b2bPosts, dealRooms, developers,
  ] = await Promise.all([
    safeCount(supabaseAdmin.from('users').select('*', { count: 'exact', head: true })),
    safeCount(supabaseAdmin.from('listings').select('*', { count: 'exact', head: true })),
    safeCount(supabaseAdmin.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active')),
    safeCount(supabaseAdmin.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'submitted')),
    safeCount(supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'broker_admin')),
    safeCount(supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'realtor')),
    safeCount(supabaseAdmin.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'open')),
    safeCount(supabaseAdmin.from('b2b_profiles').select('*', { count: 'exact', head: true })),
    safeCount(supabaseAdmin.from('b2b_posts').select('*', { count: 'exact', head: true })),
    safeCount(supabaseAdmin.from('negotiation_rooms').select('*', { count: 'exact', head: true })),
    safeCount(supabaseAdmin.from('developer_profiles').select('*', { count: 'exact', head: true })),
  ])

  return { totalUsers, totalListings, activeListings, pendingDocs, totalBrokers, totalAgents, openRequests, b2bProfiles, b2bPosts, dealRooms, developers }
}

async function getRecentActivity() {
  const [users, listings] = await Promise.all([
    supabaseAdmin.from('users').select('id, email, full_name, role, created_at').order('created_at', { ascending: false }).limit(5),
    supabaseAdmin.from('listings').select('id, title, status, city, province, created_at').order('created_at', { ascending: false }).limit(5),
  ])
  let pendingDocsList: any[] = []
  try {
    const { data } = await supabaseAdmin.from('documents').select('id, doc_type, status, owner_id, created_at').eq('status', 'submitted').order('created_at', { ascending: false }).limit(5)
    pendingDocsList = data ?? []
  } catch {}
  return { recentUsers: users.data ?? [], recentListings: listings.data ?? [], pendingDocsList }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const ROLE_COLORS: Record<string, string> = {
  buyer: '#10B981', seller: '#06B6D4', realtor: '#703BF7',
  broker_admin: '#F59E0B', developer: '#8B5CF6', admin: '#EF4444',
}

export default async function AdminDashboard() {
  const [stats, activity] = await Promise.all([getStats(), getRecentActivity()])

  const portals = [
    { name: 'Web Marketplace', url: process.env.NEXT_PUBLIC_WEB_URL ?? 'https://ofw-realty-web.vercel.app', icon: '🌐', color: '#10B981', desc: 'Public listings & buyer portal' },
    { name: 'Agent Portal', url: process.env.NEXT_PUBLIC_AGENT_PORTAL_URL ?? 'https://ofw-realty-agent-portal.vercel.app', icon: '👤', color: '#703BF7', desc: 'Agent dashboard & listings' },
    { name: 'Broker Portal', url: process.env.NEXT_PUBLIC_BROKER_PORTAL_URL ?? 'https://ofw-realty-broker-portal.vercel.app', icon: '🏢', color: '#F59E0B', desc: 'Brokerage management' },
    { name: 'Developer Portal', url: process.env.NEXT_PUBLIC_DEVELOPER_PORTAL_URL ?? 'http://localhost:3005', icon: '🏗️', color: '#8B5CF6', desc: 'Project & unit management' },
    { name: 'Services Portal', url: process.env.NEXT_PUBLIC_SERVICES_PORTAL_URL ?? 'http://localhost:3006', icon: '🛠️', color: '#06B6D4', desc: 'Real estate services marketplace' },
    { name: 'AI Concierge', url: process.env.NEXT_PUBLIC_AI_CONCIERGE_URL ?? 'https://ofw-realty-concierge-portal.vercel.app', icon: '🤖', color: '#EC4899', desc: 'Listahan voice AI assistant' },
    { name: 'B2B Network', url: process.env.NEXT_PUBLIC_B2B_NETWORK_URL ?? 'https://ofw-realty-broker-to-broker-portal.vercel.app', icon: '🤝', color: '#F97316', desc: 'Broker networking platform' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Admin Dashboard</h1>
          <p style={{ fontSize: 14, color: '#595959', marginTop: 4 }}>Central monitoring for all LUPA PH apps</p>
        </div>

        {/* Pending alert */}
        {stats.pendingDocs > 0 && (
          <Link href="/verifications" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '12px 18px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>🚨</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#EF4444' }}>{stats.pendingDocs} document{stats.pendingDocs !== 1 ? 's' : ''} pending review</div>
                <div style={{ fontSize: 12, color: '#595959' }}>Agents and brokers waiting for verification</div>
              </div>
            </div>
            <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>Review Now →</span>
          </Link>
        )}

        {/* KPI grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          <StatCard label="Total Users" value={stats.totalUsers} sub="All roles" color="#703BF7" href="/users" />
          <StatCard label="Active Listings" value={stats.activeListings} sub={`${stats.totalListings} total`} color="#10B981" href="/listings" />
          <StatCard label="Pending Docs" value={stats.pendingDocs} sub="Awaiting review" color="#EF4444" href="/verifications" />
          <StatCard label="Deal Rooms" value={stats.dealRooms} sub="Negotiations" color="#F59E0B" href="/deal-rooms" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
          <StatCard label="Brokers" value={stats.totalBrokers} color="#F59E0B" href="/brokerages" />
          <StatCard label="Agents" value={stats.totalAgents} color="#703BF7" href="/users" />
          <StatCard label="B2B Profiles" value={stats.b2bProfiles} sub={`${stats.b2bPosts} posts`} color="#F97316" href="/b2b" />
          <StatCard label="Service Requests" value={stats.openRequests} sub="Open" color="#06B6D4" href="/services" />
        </div>

        {/* 3-column activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 32 }}>

          {/* Recent users */}
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 18 }}>
            <SectionHeader title="Recent Signups" sub="Latest registered users" href="/users" />
            {activity.recentUsers.length === 0
              ? <div style={{ fontSize: 13, color: '#595959', padding: '12px 0' }}>No users yet</div>
              : activity.recentUsers.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #141414' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${ROLE_COLORS[u.role] ?? '#595959'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                    {u.role === 'realtor' ? '👤' : u.role === 'broker_admin' ? '🏢' : u.role === 'buyer' ? '🏠' : '👤'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name ?? u.email}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, color: ROLE_COLORS[u.role] ?? '#595959', fontWeight: 600, textTransform: 'capitalize' }}>{u.role?.replace('_', ' ')}</span>
                      <span style={{ fontSize: 10, color: '#333' }}>· {timeAgo(u.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>

          {/* Recent listings */}
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 18 }}>
            <SectionHeader title="Recent Listings" sub="Latest property submissions" href="/listings" />
            {activity.recentListings.length === 0
              ? <div style={{ fontSize: 13, color: '#595959', padding: '12px 0' }}>No listings yet</div>
              : activity.recentListings.map(l => (
                <div key={l.id} style={{ padding: '8px 0', borderBottom: '1px solid #141414' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{l.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: l.status === 'active' ? '#10B981' : '#F59E0B', fontWeight: 600, textTransform: 'capitalize' }}>{l.status}</span>
                    <span style={{ fontSize: 10, color: '#595959' }}>· {l.city}, {l.province}</span>
                    <span style={{ fontSize: 10, color: '#333', marginLeft: 'auto' }}>{timeAgo(l.created_at)}</span>
                  </div>
                </div>
              ))
            }
          </div>

          {/* Pending verifications */}
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 18 }}>
            <SectionHeader title="Pending Verifications" sub="Documents awaiting review" href="/verifications" />
            {activity.pendingDocsList.length === 0
              ? <div style={{ fontSize: 13, color: '#10B981', padding: '12px 0' }}>✓ All clear — no pending docs</div>
              : activity.pendingDocsList.map(d => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #141414' }}>
                  <span style={{ fontSize: 18 }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{d.doc_type}</div>
                    <div style={{ fontSize: 10, color: '#595959' }}>{timeAgo(d.created_at)}</div>
                  </div>
                  <Link href="/verifications" style={{ fontSize: 10, color: '#703BF7', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 5, padding: '3px 7px' }}>Review</Link>
                </div>
              ))
            }
          </div>
        </div>

        {/* Portal status grid */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>All Portals</div>
          <div style={{ fontSize: 12, color: '#595959', marginBottom: 16 }}>Quick access to all LUPA PH applications</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {portals.map(p => (
              <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                style={{ background: '#0D0D0D', border: `1px solid ${p.color}20`, borderRadius: 12, padding: '16px 18px', transition: 'border-color 0.15s, transform 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${p.color}50`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${p.color}20`; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>{p.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: '#595959', marginBottom: 8 }}>{p.desc}</div>
                <div style={{ fontSize: 10, color: p.color, fontWeight: 600 }}>Open ↗</div>
              </a>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
