import { AdminSidebar } from '@/components/AdminSidebar'
import { supabaseAdmin } from '@/lib/supabase'

const B2B_URL = 'http://localhost:3008'

async function getB2BStats() {
  const [profiles, posts, connections, services, verifications] = await Promise.all([
    supabaseAdmin.from('b2b_profiles').select('id, display_name, prc_verified, connection_count, post_count, created_at').order('created_at', { ascending: false }).limit(20),
    supabaseAdmin.from('b2b_posts').select('id, post_type, reaction_count, comment_count, created_at').order('created_at', { ascending: false }).limit(10),
    supabaseAdmin.from('b2b_connections').select('id, status').limit(100),
    supabaseAdmin.from('b2b_service_offers').select('id, service_type, is_active').limit(50),
    supabaseAdmin.from('b2b_prc_verifications').select('id, status, submitted_at').order('submitted_at', { ascending: false }).limit(20),
  ])

  return {
    profiles: profiles.data ?? [],
    posts: posts.data ?? [],
    connections: connections.data ?? [],
    services: services.data ?? [],
    verifications: verifications.data ?? [],
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const POST_TYPE_COLORS: Record<string, string> = {
  update: '#595959', listing_share: '#703BF7', service_offer: '#06B6D4',
  market_insight: '#10B981', co_broking_request: '#F59E0B',
}

export default async function B2BPage() {
  const { profiles, posts, connections, services, verifications } = await getB2BStats()

  const acceptedConns = connections.filter(c => c.status === 'accepted').length
  const pendingVerifs = verifications.filter(v => v.status === 'pending').length
  const activeServices = services.filter(s => s.is_active).length

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>B2B Network</h1>
            <p style={{ fontSize: 14, color: '#595959', marginTop: 4 }}>Broker-to-broker networking platform</p>
          </div>
          <a href={B2B_URL} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, color: '#F97316', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 8, padding: '8px 14px' }}>
            Open B2B Network ↗
          </a>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Profiles', value: profiles.length, color: '#F97316' },
            { label: 'Posts', value: posts.length, color: '#703BF7' },
            { label: 'Connections', value: acceptedConns, color: '#10B981' },
            { label: 'Service Offers', value: activeServices, color: '#06B6D4' },
            { label: 'PRC Pending', value: pendingVerifs, color: pendingVerifs > 0 ? '#EF4444' : '#595959' },
          ].map(s => (
            <div key={s.label} style={{ background: '#0D0D0D', border: `1px solid ${s.color}20`, borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#999' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Recent profiles */}
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Recent Profiles</div>
            {profiles.slice(0, 8).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #141414' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(249,115,22,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>👤</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name}</span>
                    {p.prc_verified && <span style={{ fontSize: 9, color: '#10B981', flexShrink: 0 }}>✓ PRC</span>}
                  </div>
                  <div style={{ fontSize: 10, color: '#595959' }}>{p.connection_count} connections · {p.post_count} posts</div>
                </div>
                <div style={{ fontSize: 10, color: '#333' }}>{timeAgo(p.created_at)}</div>
              </div>
            ))}
          </div>

          {/* Recent posts */}
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Recent Posts</div>
            {posts.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #141414' }}>
                <span style={{ fontSize: 11, background: `${POST_TYPE_COLORS[p.post_type] ?? '#595959'}20`, color: POST_TYPE_COLORS[p.post_type] ?? '#595959', padding: '2px 7px', borderRadius: 99, fontWeight: 600, flexShrink: 0, textTransform: 'capitalize' }}>
                  {p.post_type.replace('_', ' ')}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#595959' }}>👍 {p.reaction_count} · 💬 {p.comment_count}</div>
                </div>
                <div style={{ fontSize: 10, color: '#333' }}>{timeAgo(p.created_at)}</div>
              </div>
            ))}
          </div>

          {/* PRC verifications */}
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14 }}>PRC Verification Requests</div>
            {verifications.length === 0
              ? <div style={{ fontSize: 13, color: '#595959' }}>No verification requests yet</div>
              : verifications.map(v => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #141414' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: v.status === 'approved' ? 'rgba(16,185,129,0.15)' : v.status === 'pending' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)', color: v.status === 'approved' ? '#10B981' : v.status === 'pending' ? '#F59E0B' : '#EF4444', textTransform: 'capitalize' }}>
                    {v.status}
                  </span>
                  <div style={{ flex: 1, fontSize: 11, color: '#595959' }}>{timeAgo(v.submitted_at)}</div>
                </div>
              ))
            }
          </div>

          {/* Service offers by type */}
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Service Offers by Type</div>
            {Object.entries(
              services.reduce((acc: any, s) => { acc[s.service_type] = (acc[s.service_type] ?? 0) + 1; return acc }, {})
            ).map(([type, count]: any) => (
              <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #141414' }}>
                <span style={{ fontSize: 12, color: '#999', textTransform: 'capitalize' }}>{type.replace('_', ' ')}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#06B6D4' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
